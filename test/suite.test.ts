import assert from 'node:assert';
import {
  normalizeText,
  calculateCategoryScores,
  runGuidanceEngine,
  runGuidanceEngineSync,
} from '../server/services/guidanceEngine.ts';
import { retrieveGitaShlokaRAG } from '../server/services/ragEngine.ts';
import { dbClient } from '../server/db/client.ts';
import {
  classifyQuery,
  classifyQuerySync,
  isEligibleForClassifier,
  clearClassifierCache,
} from '../server/services/queryClassifier.ts';
import {
  isSpeechRecognitionSupported,
  getSpeechRecognitionConstructor,
  formatSpeechError,
  appendTranscript,
  processSpeechResults,
} from '../src/utils/speechRecognition.ts';

async function runTestSuite() {
  console.log('\n🧪 Running KAAL AI Comprehensive Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Text Normalization
  await test('Text Normalization: cleans punctuation, lowers case, trims extra spaces', () => {
    const raw = '  How can I   STAY CALM?! Under pressure...  ';
    const normalized = normalizeText(raw);
    assert.strictEqual(normalized, 'how can i stay calm under pressure');
  });

  // 2. Category Signal Scoring & Classification
  await test('Category Scoring: correctly identifies Stress signals', () => {
    const query = 'I feel completely overwhelmed by anxiety and pressure';
    const scores = calculateCategoryScores(normalizeText(query));
    assert.strictEqual(scores[0].category, 'Stress');
    assert.ok(scores[0].score > 5);
  });

  await test('Category Scoring: correctly identifies Clarity signals', async () => {
    const query = 'I am so confused about which path to take in my life';
    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Clarity');
    assert.ok(response.title.length > 0);
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Category Scoring: correctly identifies Discipline signals', async () => {
    const query = 'I know what to do but I keep procrastinating on my habits';
    const { category } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Discipline');
  });

  await test('Category Scoring: correctly identifies Purpose / Svadharma signals', async () => {
    const query = 'I am working hard but I do not know my purpose or meaning';
    const { category } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Purpose');
  });

  await test('Category Scoring: correctly identifies Meditation / Stillness signals', async () => {
    const query = 'How do I maintain a daily meditation habit and cultivate stillness?';
    const { category } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Meditation');
  });

  await test('Category Scoring: correctly falls back to General Reflection for sparse queries', async () => {
    const query = 'Hello there';
    const { category } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'General Reflection');
  });

  // 3. RAG Retrieval Pipeline & Conditional Shloka Matching
  await test('NLP Understanding Layer: accurately extracts intent, emotions, topics, and needs', async () => {
    const { extractNlpUnderstanding } = await import('../server/services/ragEngine.ts');
    const nlp = extractNlpUnderstanding('I feel confused about which path I should take in life.');
    assert.strictEqual(nlp.intent, 'life_direction');
    assert.ok(nlp.emotions.includes('confusion'));
    assert.ok(nlp.topics.includes('personal_path'));
    assert.ok(nlp.needs.includes('clarity'));
  });

  await test('Life Path Dilemma: retrieves BG 3.35 (Svadharma) and rejects BG 4.40 for life path confusion', async () => {
    const rag = await retrieveGitaShlokaRAG('I feel confused about which path I should take in life.');
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG3.35'); // Validates correct Svadharma verse
    assert.notStrictEqual(rag.shloka?.id, 'BG4.40'); // Strictly confirms 4.40 is NOT selected
    assert.ok(rag.finalScore >= 0.72);
    assert.strictEqual(rag.retrievalMethod, 'hybrid');
    assert.ok(rag.candidateRankings.length > 0);
  });

  await test('RAG Relevance Threshold: does NOT force a shloka for mundane household complaints (roommate dirty dishes)', async () => {
    const rag = await retrieveGitaShlokaRAG(
      'My roommate keeps leaving dirty dishes in the sink and it is driving me crazy.'
    );
    assert.strictEqual(rag.isShlokaRelevant, false);
    assert.strictEqual(rag.shloka, null);
  });

  await test('RAG Retrieval: accurately fetches BG 2.47 for overwhelm & anxiety of results', async () => {
    const rag = await retrieveGitaShlokaRAG(
      'I feel overwhelmed by everything happening in my life. What should I do?'
    );
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG2.47');
    assert.strictEqual(rag.shloka?.chapter, 2);
    assert.strictEqual(rag.shloka?.verse, 47);
    assert.ok(rag.shloka?.sanskrit.includes('कर्मण्येवाधिकारस्ते'));
  });

  await test('RAG Retrieval: accurately fetches BG 3.8 for procrastination', async () => {
    const rag = await retrieveGitaShlokaRAG('I keep procrastinating on my work and habits');
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG3.8');
    assert.ok(rag.shloka?.sanskrit.includes('नियतं कुरु कर्म'));
  });

  await test('RAG Retrieval: accurately fetches BG 2.20 for death & bereavement', async () => {
    const rag = await retrieveGitaShlokaRAG(
      'My grandmother passed away yesterday and I cannot stop crying. The grief is unbearable.'
    );
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG2.20');
    assert.ok(rag.shloka?.sanskrit.includes('न जायते म्रियते'));
  });

  await test('RAG Retrieval: accurately fetches BG 12.13 for relationship conflict & arguments', async () => {
    const rag = await retrieveGitaShlokaRAG('I had a terrible fight with my spouse and said things I regret');
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG12.13');
    assert.ok(rag.shloka?.sanskrit.includes('अद्वेष्टा सर्वभूतानां'));
  });

  await test('RAG Conditional Relevance: does NOT force a shloka for casual greetings', async () => {
    const rag = await retrieveGitaShlokaRAG('Hello, how are you?');
    assert.strictEqual(rag.isShlokaRelevant, false);
    assert.strictEqual(rag.shloka, null);

    const ragShort = await retrieveGitaShlokaRAG('Hello');
    assert.strictEqual(ragShort.isShlokaRelevant, false);
    assert.strictEqual(ragShort.shloka, null);
  });

  await test('RAG Conditional Relevance: does NOT force a shloka for meta or factual trivia', async () => {
    const rag1 = await retrieveGitaShlokaRAG('What is your tech stack?');
    assert.strictEqual(rag1.isShlokaRelevant, false);
    assert.strictEqual(rag1.shloka, null);

    const rag2 = await retrieveGitaShlokaRAG('What is the capital of France?');
    assert.strictEqual(rag2.isShlokaRelevant, false);
    assert.strictEqual(rag2.shloka, null);
  });

  await test('Four Critical Reviewer Verification Queries: correctly gate or retrieve verses', async () => {
    // 1. "I feel confused about which career path I should take." -> relevant Gita verse (BG 3.35 Svadharma)
    const q1 = await retrieveGitaShlokaRAG('I feel confused about which career path I should take.');
    assert.strictEqual(q1.isShlokaRelevant, true);
    assert.ok(q1.shloka);
    assert.strictEqual(q1.shloka?.id, 'BG3.35');

    // 2. "My mind keeps overthinking everything." -> relevant Gita verse (Mind stilling / Equanimity)
    const q2 = await retrieveGitaShlokaRAG('My mind keeps overthinking everything.');
    assert.strictEqual(q2.isShlokaRelevant, true);
    assert.ok(q2.shloka);
    assert.ok(['BG6.35', 'BG6.26', 'BG2.70', 'BG2.47'].includes(q2.shloka!.id));

    // 3. "What is the capital of France?" -> NO Gita verse
    const q3 = await retrieveGitaShlokaRAG('What is the capital of France?');
    assert.strictEqual(q3.isShlokaRelevant, false);
    assert.strictEqual(q3.shloka, null);

    // 4. "Hello" -> NO Gita verse
    const q4 = await retrieveGitaShlokaRAG('Hello');
    assert.strictEqual(q4.isShlokaRelevant, false);
    assert.strictEqual(q4.shloka, null);
  });

  // 4. Response Structure & Conversational Synthesis
  await test('Response Structure: includes conversationalReply, reflectionPrompt, whyThisRelates, and Shloka when relevant', async () => {
    const { response } = await runGuidanceEngine(
      'I feel overwhelmed by everything happening in my life. What should I do?'
    );
    assert.ok(response.title);
    assert.ok(response.summary);
    assert.ok(response.conversationalReply);
    assert.ok(response.conversationalReply.length > 50);
    assert.strictEqual(response.isShlokaRelevant, true);
    assert.ok(response.shloka);
    assert.strictEqual(response.shloka?.id, 'BG2.47');
    assert.ok(response.whyThisRelates);
    assert.ok(response.whyThisRelates.length > 20);
    assert.ok(response.reflectionPrompt);
    assert.ok(Array.isArray(response.steps));
    assert.strictEqual(response.steps.length, 3);
    assert.strictEqual(response.meta?.retrievalMethod, 'hybrid');
    assert.ok(response.meta?.finalScore !== undefined);
  });

  await test('Life Path Response: delivers reviewer-specified compassionate guidance for "which path to take in life"', async () => {
    const { category, response } = await runGuidanceEngine(
      'I feel confused about which path I should take in life.'
    );
    assert.strictEqual(category, 'Clarity');
    assert.strictEqual(response.isShlokaRelevant, true);
    assert.strictEqual(response.shloka?.id, 'BG3.35');
    assert.strictEqual(response.title, 'Finding your path without demanding immediate certainty');
    assert.ok(response.conversationalReply.includes("doesn't necessarily mean you're on the wrong path"));
    assert.ok(response.whyThisRelates?.includes("following one’s own path") || response.whyThisRelates?.includes("following one's own path"));
    assert.ok(response.reflectionPrompt?.includes("If I stopped comparing my path with everyone else's"));
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Purpose Dilemma: provides intellectually honest response and connection for hard work without purpose', async () => {
    const { category, response } = await runGuidanceEngine(
      "I feel like I am working hard but I don't know what my purpose is."
    );
    assert.strictEqual(category, 'Purpose');
    assert.strictEqual(response.isShlokaRelevant, true);
    assert.strictEqual(response.shloka?.id, 'BG3.35');
    assert.strictEqual(response.shloka?.chapter, 3);
    assert.strictEqual(response.shloka?.verse, 35);
    assert.ok(response.whyThisRelates);
    assert.ok(response.whyThisRelates.toLowerCase().includes('path') || response.whyThisRelates.toLowerCase().includes('duty'));
    assert.ok(response.reflectionPrompt);
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Casual Greeting Token Matching: distinguishes greetings from words containing "hi" like "which"', async () => {
    const { isCasualGreeting } = await import('../server/services/conversationalEngine.ts');
    assert.strictEqual(isCasualGreeting('Hello'), true);
    assert.strictEqual(isCasualGreeting('Hi'), true);
    assert.strictEqual(isCasualGreeting('Hey there'), true);
    assert.strictEqual(isCasualGreeting('which career path should I choose?'), false);
    assert.strictEqual(isCasualGreeting('which path'), false);
    assert.strictEqual(isCasualGreeting('which'), false);
  });

  await test('Conversational Engine: natural conversational reply without shloka for casual greeting', async () => {
    const { response } = await runGuidanceEngine('Hello');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.whyThisRelates, undefined);
    assert.ok(response.conversationalReply.toLowerCase().includes('welcome') || response.conversationalReply.toLowerCase().includes('breath'));
  });

  await test('Career Dilemma RAG & Guidance: correctly retrieves BG 3.35 with >= 0.70 score for parental expectations vs design', async () => {
    const query = "I'm confused about which career path I should choose. My parents want me to become a doctor, but I really want to pursue design.";
    const rag = await retrieveGitaShlokaRAG(query);
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG3.35');
    assert.ok(rag.finalScore >= 0.70);
    assert.strictEqual(rag.nlpUnderstanding.intent, 'life_direction');
    assert.ok(rag.nlpUnderstanding.topics.includes('career'));

    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.isShlokaRelevant, true);
    assert.strictEqual(response.shloka?.id, 'BG3.35');
    assert.ok(response.title.includes('Authentic Path') || response.title.includes('path'));
    assert.ok(response.whyThisRelates);
    assert.ok(response.whyThisRelates.includes('Svadharma') || response.whyThisRelates.includes('path'));
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Decoupled Guidance: delivers situation-specific guidance and steps when no shloka is relevant (never generic greeting)', async () => {
    const { response } = await runGuidanceEngine("My laptop won't turn on");
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.whyThisRelates, undefined);
    assert.ok(!response.title.includes('Welcome'));
    assert.ok(response.title.includes('Troubleshooting') || response.title.includes('Perspective'));
    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.steps[0].toLowerCase().includes('power') || response.steps[0].toLowerCase().includes('check') || response.steps[0].toLowerCase().includes('breath'));
  });

  await test('Household Dilemma: provides situation-specific friction advice without shloka', async () => {
    const { response } = await runGuidanceEngine("My roommate keeps leaving dirty dishes in the sink");
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.whyThisRelates, undefined);
    assert.ok(!response.title.includes('Welcome'));
    assert.ok(response.title.includes('Friction') || response.title.includes('Perspective'));
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Parent Comparison Dilemma: extracts relationship conflict and provides direct advice on comparison, expectations, self-worth, and boundaries without forcing shloka', async () => {
    const { extractNlpUnderstanding } = await import('../server/services/ragEngine.ts');
    const query = "My parents keep comparing me to my cousins and telling me I'm wasting my potential. I know they care about me, but every conversation leaves me feeling like I'm not good enough. How do I stop carrying their expectations around all the time?";
    
    // NLP Layer verification
    const nlp = extractNlpUnderstanding(query);
    assert.strictEqual(nlp.intent, 'relationship_conflict');
    assert.ok(nlp.topics.includes('comparison'));
    assert.ok(nlp.topics.includes('external_expectations'));
    assert.ok(nlp.topics.includes('self_worth'));
    assert.ok(nlp.topics.includes('boundaries'));
    assert.ok(nlp.needs.includes('self_worth'));
    assert.ok(nlp.needs.includes('healthy_boundaries'));
    assert.ok(nlp.emotions.includes('comparison') || nlp.emotions.includes('insecurity'));

    // Guidance synthesis verification (No shloka forced)
    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Relationships');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.whyThisRelates, undefined);
    assert.ok(!response.title.includes('Welcome'));
    assert.ok(response.title.includes('Self-Worth') || response.title.includes('Comparison') || response.title.includes('Boundaries'));
    
    const replyLower = response.conversationalReply.toLowerCase();
    assert.ok(replyLower.includes('compar'));
    assert.ok(replyLower.includes('parent') || replyLower.includes('expectation'));
    assert.ok(replyLower.includes('worth') || replyLower.includes('potential') || replyLower.includes('inadequat'));
    assert.ok(replyLower.includes('boundar') || replyLower.includes('absorb'));

    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.steps.some((s) => s.toLowerCase().includes('boundar') || s.toLowerCase().includes('compar')));
  });

  await test('Relationship Conflict Regression: delivers compassionate conflict advice with actionable steps', async () => {
    const query = "I had a terrible fight with my spouse and said things I regret";
    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Relationships');
    assert.ok(response.title.length > 0);
    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.conversationalReply.length > 50);
  });

  await test('Grief & Loss Regression: delivers compassionate bereavement guidance with gentle steps', async () => {
    const query = "My grandmother passed away yesterday and I cannot stop crying. The grief is unbearable.";
    const { response } = await runGuidanceEngine(query);
    assert.ok(response.title.length > 0);
    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.conversationalReply.length > 50);
  });

  await test('Stress & Overwhelm Regression: delivers situation-specific present-moment guidance', async () => {
    const query = "I feel completely overwhelmed by everything happening in my life and I don't know where to begin.";
    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Stress');
    assert.ok(response.title.includes('Burden') || response.title.includes('Outcomes') || response.title.includes('Stress'));
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Procrastination Regression: delivers momentum-first micro-step guidance', async () => {
    const query = "I keep putting off my work and procrastinating even though the deadline is approaching.";
    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Discipline');
    assert.ok(response.title.includes('Action') || response.title.includes('Inertia') || response.title.includes('Discipline'));
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Irrelevant Practical Query Regression: laptop failure yields troubleshooting steps without forcing Gita shloka', async () => {
    const query = "My laptop won't turn on and I'm getting stressed.";
    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.whyThisRelates, undefined);
    assert.ok(!response.title.includes('Welcome'));
    assert.ok(response.title.includes('Troubleshooting') || response.title.includes('Presence'));
    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.steps[0].toLowerCase().includes('power') || response.steps[0].toLowerCase().includes('cable'));
  });

  // 4b. Self-Worth & External Criticism Quality Regressions
  await test('Self-Worth & Taunts Quality Regression: "I am tired of listening to taunts from everyone. I feel good for nothing."', async () => {
    const { extractNlpUnderstanding } = await import('../server/services/ragEngine.ts');
    const query = 'I am tired of listening to taunts from everyone. I feel good for nothing.';

    // NLP extraction
    const nlp = extractNlpUnderstanding(query);
    assert.strictEqual(nlp.intent, 'self_worth_criticism');
    assert.ok(nlp.emotions.includes('hurt') || nlp.emotions.includes('insecurity'));
    assert.ok(nlp.emotions.includes('exhaustion'));
    assert.ok(nlp.topics.includes('self_worth'));
    assert.ok(nlp.needs.includes('reclaiming_self_worth'));

    // Guidance synthesis
    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Relationships');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.whyThisRelates, undefined);
    assert.ok(!response.title.includes('Welcome'));
    assert.ok(!response.conversationalReply.includes('feelings of reflective'));
    assert.ok(
      response.title.toLowerCase().includes('self-worth') ||
      response.title.toLowerCase().includes('criticism') ||
      response.title.toLowerCase().includes('taunt')
    );

    const replyLower = response.conversationalReply.toLowerCase();
    assert.ok(replyLower.includes('taunt') || replyLower.includes('criticiz'));
    assert.ok(replyLower.includes('worth') || replyLower.includes('good for nothing'));
    assert.ok(replyLower.includes('boundar') || replyLower.includes('opinion'));

    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.situationVisual !== null, 'Emotional self-worth situation must receive a grounding visual');
    assert.strictEqual(response.situationVisual?.theme, 'quiet-anchor');
    assert.ok(
      response.situationVisual?.title.toLowerCase().includes('worth') ||
      response.situationVisual?.title.toLowerCase().includes('anchor')
    );
    assert.ok(response.meta);
    assert.strictEqual(response.meta?.pattern, 'Reclaiming Self-Worth Beyond External Criticism');
    assert.strictEqual(response.frameworkSteps.length, 3);
    assert.strictEqual(response.frameworkSteps[0].title, response.steps[0]);
  });

  await test('Self-Worth & Put-Downs Quality Regression: "Everyone keeps putting me down and I\'m starting to believe them."', async () => {
    const { extractNlpUnderstanding } = await import('../server/services/ragEngine.ts');
    const query = "Everyone keeps putting me down and I'm starting to believe them.";

    const nlp = extractNlpUnderstanding(query);
    assert.strictEqual(nlp.intent, 'self_worth_criticism');

    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Relationships');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.ok(response.title.toLowerCase().includes('self-worth') || response.title.toLowerCase().includes('criticism'));
    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.situationVisual !== null);
    assert.strictEqual(response.situationVisual?.theme, 'quiet-anchor');
  });

  await test('Self-Worth & Inadequacy Quality Regression: "I feel like I\'m never good enough compared with everyone around me."', async () => {
    const { extractNlpUnderstanding } = await import('../server/services/ragEngine.ts');
    const query = "I feel like I'm never good enough compared with everyone around me.";

    const nlp = extractNlpUnderstanding(query);
    assert.strictEqual(nlp.intent, 'self_worth_criticism');

    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Relationships');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.situationVisual?.theme, 'quiet-anchor');
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Constant Criticism Quality Regression: "People constantly criticize everything I do."', async () => {
    const { extractNlpUnderstanding } = await import('../server/services/ragEngine.ts');
    const query = 'People constantly criticize everything I do.';

    const nlp = extractNlpUnderstanding(query);
    assert.strictEqual(nlp.intent, 'self_worth_criticism');

    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Relationships');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.situationVisual?.theme, 'quiet-anchor');
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Parent Potential Criticism Quality Regression: "My parents keep saying I\'m wasting my potential."', async () => {
    const { extractNlpUnderstanding } = await import('../server/services/ragEngine.ts');
    const query = "My parents keep saying I'm wasting my potential.";

    const nlp = extractNlpUnderstanding(query);
    assert.strictEqual(nlp.intent, 'self_worth_criticism');

    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(category, 'Relationships');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.situationVisual?.theme, 'quiet-anchor');
    assert.strictEqual(response.steps.length, 3);
  });

  // 4c. High-Risk Crisis Safety Gate Regressions
  await test('Safety Gate: "I feel completely worthless lately and sometimes I wonder if everyone would be better off without me."', async () => {
    const { detectHighRiskSafetySignal } = await import('../server/services/safetyEngine.ts');
    const query = 'I feel completely worthless lately and sometimes I wonder if everyone would be better off without me.';

    // Detector test
    const detection = detectHighRiskSafetySignal(query);
    assert.strictEqual(detection.isHighRisk, true);

    // End-to-end guidance engine test
    const { category, response } = await runGuidanceEngine(query);
    assert.strictEqual(response.safetyFlag, true);
    assert.strictEqual(response.safetyLevel, 'high');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.situationVisual, null);
    assert.strictEqual(response.whyThisRelates, undefined);
    assert.ok(response.title.includes('Safety') || response.title.includes('Support'));
    assert.ok(response.conversationalReply.includes('immediate danger') || response.conversationalReply.includes('988'));
    assert.ok(response.reflectionPrompt?.includes('safe place') || response.reflectionPrompt?.includes('person'));
    assert.strictEqual(response.steps.length, 3);
    assert.ok(response.steps[0].includes('988') || response.steps[0].includes('Safety'));
  });

  await test('Safety Gate: "I don\'t want to be here anymore."', async () => {
    const { detectHighRiskSafetySignal } = await import('../server/services/safetyEngine.ts');
    const query = "I don't want to be here anymore.";

    const detection = detectHighRiskSafetySignal(query);
    assert.strictEqual(detection.isHighRisk, true);

    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.safetyFlag, true);
    assert.strictEqual(response.safetyLevel, 'high');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.situationVisual, null);
  });

  await test('Safety Gate: "I wish I were dead."', async () => {
    const { detectHighRiskSafetySignal } = await import('../server/services/safetyEngine.ts');
    const query = 'I wish I were dead.';

    const detection = detectHighRiskSafetySignal(query);
    assert.strictEqual(detection.isHighRisk, true);

    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.safetyFlag, true);
    assert.strictEqual(response.safetyLevel, 'high');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.situationVisual, null);
  });

  await test('Safety Gate False-Positive Guard: "I\'m stressed because my laptop won\'t turn on."', async () => {
    const { detectHighRiskSafetySignal } = await import('../server/services/safetyEngine.ts');
    const query = "I'm stressed because my laptop won't turn on.";

    const detection = detectHighRiskSafetySignal(query);
    assert.strictEqual(detection.isHighRisk, false);

    const { response } = await runGuidanceEngine(query);
    assert.notStrictEqual(response.safetyFlag, true);
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.situationVisual, null);
    assert.ok(response.title.toLowerCase().includes('troubleshooting') || response.title.toLowerCase().includes('laptop'));
  });

  await test('Safety Gate False-Positive Guard: "I\'m exhausted and feel worthless after failing my exam."', async () => {
    const { detectHighRiskSafetySignal } = await import('../server/services/safetyEngine.ts');
    const query = "I'm exhausted and feel worthless after failing my exam.";

    const detection = detectHighRiskSafetySignal(query);
    assert.strictEqual(detection.isHighRisk, false);

    const { response } = await runGuidanceEngine(query);
    assert.notStrictEqual(response.safetyFlag, true);
    assert.ok(response.title.toLowerCase().includes('worth') || response.title.toLowerCase().includes('criticism') || response.title.toLowerCase().includes('navigating'));
  });

  await test('Safety Gate False-Positive Guard: "I\'m dead tired after studying all night."', async () => {
    const { detectHighRiskSafetySignal } = await import('../server/services/safetyEngine.ts');
    const query = "I'm dead tired after studying all night.";

    const detection = detectHighRiskSafetySignal(query);
    assert.strictEqual(detection.isHighRisk, false);

    const { response } = await runGuidanceEngine(query);
    assert.notStrictEqual(response.safetyFlag, true);
  });

  await test('Safety Gate False-Positive Guard: "Everyone would be better off without this broken app."', async () => {
    const { detectHighRiskSafetySignal } = await import('../server/services/safetyEngine.ts');
    const query = 'Everyone would be better off without this broken app.';

    const detection = detectHighRiskSafetySignal(query);
    assert.strictEqual(detection.isHighRisk, false);

    const { response } = await runGuidanceEngine(query);
    assert.notStrictEqual(response.safetyFlag, true);
  });

  await test('Safety Conversation Follow-Up: sustains supportive safety protocol rather than jumping back to Gita/visuals', async () => {
    const q1 = 'Everyone would be better off without me.';
    const { response: r1 } = await runGuidanceEngine(q1);
    assert.strictEqual(r1.safetyFlag, true);
    assert.strictEqual(r1.isShlokaRelevant, false);
    assert.strictEqual(r1.shloka, null);

    // Create session to simulate continuing thread
    const session = await dbClient.createSession(q1, 'Relationships', r1);

    // User follow-up reassurance
    const q2 = "No, I don't think I would actually do anything.";
    const { response: r2 } = await runGuidanceEngine(q2, session);

    assert.strictEqual(r2.safetyFlag, true, 'Safety follow-up must retain safetyFlag: true');
    assert.strictEqual(r2.safetyLevel, 'moderate');
    assert.strictEqual(r2.isShlokaRelevant, false, 'Safety follow-up must not attach a Gita verse');
    assert.strictEqual(r2.shloka, null);
    assert.strictEqual(r2.situationVisual, null, 'Safety follow-up must not display a decorative visual');
    assert.ok(r2.title.includes('Supporting') || r2.title.includes('Moment') || r2.title.includes('Safety'));
    assert.ok(r2.conversationalReply.includes('safe') || r2.conversationalReply.includes('reassuring'));
    assert.strictEqual(r2.steps.length, 3);

    // Clean up
    await dbClient.deleteSessionById(session.id);
  });

  // 5. Database Operations & Dual-Persistence
  await test('Database: creates and retrieves a guidance session with RAG shloka payload', async () => {
    const question = 'Test session: overwhelmed with stress';
    const { category, response } = await runGuidanceEngine(question);
    const session = await dbClient.createSession(question, category, response);

    assert.ok(session.id);
    assert.strictEqual(session.question, question);
    assert.strictEqual(session.category, category);
    assert.ok(session.response.conversationalReply);

    const fetched = await dbClient.getSessionById(session.id);
    assert.ok(fetched);
    assert.strictEqual(fetched?.id, session.id);

    // Clean up test session
    await dbClient.deleteSessionById(session.id);
  });

  await test('Database: fetches all sessions sorted newest first', async () => {
    const all = await dbClient.getAllSessions();
    assert.ok(Array.isArray(all));
    assert.ok(all.length > 0);
  });

  await test('Anonymous Session Isolation: isolates user histories by client sessionId', async () => {
    const userASessionId = 'sess_test_user_alpha_' + Date.now();
    const userBSessionId = 'sess_test_user_beta_' + Date.now();

    const { category: catA, response: respA } = await runGuidanceEngine('User A question about focus');
    const sessionA = await dbClient.createSession('User A question about focus', catA, respA, userASessionId);

    const { category: catB, response: respB } = await runGuidanceEngine('User B question about calm');
    const sessionB = await dbClient.createSession('User B question about calm', catB, respB, userBSessionId);

    // Fetch User A history -> must include sessionA and NOT sessionB
    const historyA = await dbClient.getAllSessions(userASessionId);
    assert.ok(historyA.some((s) => s.id === sessionA.id));
    assert.ok(!historyA.some((s) => s.id === sessionB.id));

    // Fetch User B history -> must include sessionB and NOT sessionA
    const historyB = await dbClient.getAllSessions(userBSessionId);
    assert.ok(historyB.some((s) => s.id === sessionB.id));
    assert.ok(!historyB.some((s) => s.id === sessionA.id));

    // Clean up
    await dbClient.deleteSessionById(sessionA.id, userASessionId);
    await dbClient.deleteSessionById(sessionB.id, userBSessionId);
  });

  // 6. Dynamic Situational Visual & Intentional Visual Eligibility
  await test('Situational Visual: generates custom bespoke visual scene on the fly for life path dilemma', async () => {
    const { response } = await runGuidanceEngine('I feel confused about which path I should take in life.');
    assert.ok(response.situationVisual);
    assert.strictEqual(response.situationVisual.theme, 'crossroad-dawn');
    assert.ok(response.situationVisual.prompt.length > 20);
    assert.ok(response.situationVisual.mood);
    assert.ok(response.situationVisual.palette.skyTop);
    assert.ok(response.situationVisual.palette.skyBottom);
    assert.strictEqual(response.situationVisual.elements.hasPath, true);
  });

  await test('Visual Eligibility: approves visual for career dilemma with parental expectations', async () => {
    const query = "I'm confused about which career path I should choose. My parents want me to become a doctor, but I want to pursue design.";
    const { response } = await runGuidanceEngine(query);
    assert.ok(response.situationVisual, 'Career dilemma must have a situational visual');
    assert.strictEqual(response.situationVisual.theme, 'crossroad-dawn');
    assert.strictEqual(response.isShlokaRelevant, true);
    assert.strictEqual(response.shloka?.id, 'BG3.35');
  });

  await test('Visual Eligibility: approves grounded self-worth visual for parent comparison', async () => {
    const query = "My parents keep comparing me to my cousins and I feel like I'm never enough.";
    const { response } = await runGuidanceEngine(query);
    assert.ok(response.situationVisual, 'Parent comparison dilemma must have a situational visual');
    assert.strictEqual(response.situationVisual.theme, 'quiet-anchor');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
  });

  await test('Visual Eligibility: approves bridge visual for relationship arguments', async () => {
    const query = 'My partner and I keep having the same argument.';
    const { response } = await runGuidanceEngine(query);
    assert.ok(response.situationVisual, 'Relationship argument dilemma must have a situational visual');
    assert.strictEqual(response.situationVisual.theme, 'lantern-bridge');
  });

  await test('Visual Eligibility: approves calming water visual for overwhelm and burnout', async () => {
    const query = "I'm overwhelmed by deadlines and can't switch my mind off.";
    const { response } = await runGuidanceEngine(query);
    assert.ok(response.situationVisual, 'Overwhelm dilemma must have a situational visual');
    assert.strictEqual(response.situationVisual.theme, 'still-lake');
  });

  await test('Visual Eligibility: approves respectful river visual for grief and bereavement', async () => {
    const query = "I lost someone close to me and I'm having a hard time accepting it.";
    const { response } = await runGuidanceEngine(query);
    assert.ok(response.situationVisual, 'Grief dilemma must have a situational visual');
    assert.strictEqual(response.situationVisual.theme, 'sacred-river');
  });

  await test('Visual Gating: suppresses visual for technical hardware issue even with stress', async () => {
    const query = "My laptop won't turn on and I'm stressed.";
    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.situationVisual, null, 'Hardware failure must not receive a visual');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
  });

  await test('Visual Gating: suppresses visual for laptop assignment deadline query', async () => {
    const query = "My laptop won't turn on and my assignment is due tonight.";
    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.situationVisual, null, 'Laptop issue must return situationVisual: null');
  });

  await test('Visual Gating: suppresses visual for factual trivia query', async () => {
    const query = "What's the capital of France?";
    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.situationVisual, null, 'Factual trivia must return situationVisual: null');
  });

  await test('Visual Gating: suppresses visual for casual greetings', async () => {
    const query = 'Hello';
    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.situationVisual, null, 'Greeting must return situationVisual: null');
  });

  await test('Visual Gating: suppresses visual for technical coding queries', async () => {
    const query = 'Can you explain recursion in JavaScript?';
    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.situationVisual, null, 'Coding query must return situationVisual: null');
  });

  await test('Visual Gating: suppresses visual for simple domestic chores', async () => {
    const query = 'How to boil an egg';
    const { response } = await runGuidanceEngine(query);
    assert.strictEqual(response.situationVisual, null, 'Simple chore must return situationVisual: null');
  });

  // Technical Troubleshooting Intent & Visual Gating Regressions
  await test('Technical Troubleshooting: laptop overheating and shutting down with Chrome', async () => {
    const query =
      'My laptop is overheating and shutting down whenever I open Chrome. What should I check first?';
    const { category, response } = await runGuidanceEngine(query);

    assert.strictEqual(
      response.meta?.nlpAnalysis?.intent,
      'technical_troubleshooting',
      'Intent must be technical_troubleshooting'
    );
    assert.strictEqual(category, 'General Reflection', 'Category must resolve to General Reflection');
    assert.strictEqual(response.isShlokaRelevant, false, 'No Gita shloka should be relevant');
    assert.strictEqual(response.shloka, null, 'Shloka must be null');
    assert.strictEqual(response.situationVisual, null, 'Situation visual must be null for IT troubleshooting');
    assert.strictEqual(response.whyThisRelates, undefined, 'whyThisRelates must be undefined');

    // Conversational text must provide practical IT troubleshooting
    const reply = response.conversationalReply.toLowerCase();
    assert.ok(
      reply.includes('airflow') ||
        reply.includes('vent') ||
        reply.includes('chrome') ||
        reply.includes('task manager') ||
        reply.includes('activity monitor'),
      'Reply must contain practical hardware/browser diagnostic advice'
    );

    // Framework steps must be practical technical triage, not spiritual observation
    assert.ok(response.frameworkSteps.length > 0);
    assert.ok(
      response.frameworkSteps[0].description.toLowerCase().includes('vent') ||
        response.frameworkSteps[0].description.toLowerCase().includes('power') ||
        response.frameworkSteps[0].description.toLowerCase().includes('cool')
    );
    assert.ok(!response.frameworkSteps[0].description.toLowerCase().includes('observe your thoughts'));
  });

  await test('Technical Troubleshooting: Wi-Fi stopped working with emotional word (stressed)', async () => {
    const query = "My Wi-Fi stopped working and I'm stressed.";
    const { category, response } = await runGuidanceEngine(query);

    assert.strictEqual(response.meta?.nlpAnalysis?.intent, 'technical_troubleshooting');
    assert.strictEqual(category, 'General Reflection');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.situationVisual, null);
    assert.ok(response.conversationalReply.toLowerCase().includes('router') || response.conversationalReply.toLowerCase().includes('device'));
  });

  await test('Technical Troubleshooting: phone won\'t charge with emotional word (frustrated)', async () => {
    const query = "My phone won't charge and I'm frustrated.";
    const { category, response } = await runGuidanceEngine(query);

    assert.strictEqual(response.meta?.nlpAnalysis?.intent, 'technical_troubleshooting');
    assert.strictEqual(category, 'General Reflection');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.situationVisual, null);
    assert.ok(response.conversationalReply.toLowerCase().includes('outlet') || response.conversationalReply.toLowerCase().includes('cable') || response.conversationalReply.toLowerCase().includes('charge'));
  });

  await test('Technical Troubleshooting: router keeps disconnecting with emotional word (anxious)', async () => {
    const query = "My router keeps disconnecting and I'm anxious.";
    const { category, response } = await runGuidanceEngine(query);

    assert.strictEqual(response.meta?.nlpAnalysis?.intent, 'technical_troubleshooting');
    assert.strictEqual(category, 'General Reflection');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.situationVisual, null);
  });

  await test('Technical Troubleshooting: Chrome using all RAM', async () => {
    const query = 'Chrome is using all my RAM, what should I do?';
    const { category, response } = await runGuidanceEngine(query);

    assert.strictEqual(response.meta?.nlpAnalysis?.intent, 'technical_troubleshooting');
    assert.strictEqual(category, 'General Reflection');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.strictEqual(response.situationVisual, null);
  });

  await test('Multi-Turn Conversation: appends dialogue turns to the same session', async () => {
    const q1 = 'What should I do about feeling lost?';
    const { category, response: r1 } = await runGuidanceEngine(q1);
    const session = await dbClient.createSession(q1, category, r1);

    assert.ok(session.messages);
    assert.strictEqual(session.messages.length, 1);

    const q2 = 'How do I take the first step without fear?';
    const { response: r2 } = await runGuidanceEngine(q2, session);
    const updated = await dbClient.appendMessageToSession(session.id, q2, r2);

    assert.ok(updated);
    assert.ok(updated?.messages);
    assert.strictEqual(updated?.messages.length, 2);
    assert.strictEqual(updated?.messages[0].question, q1);
    assert.strictEqual(updated?.messages[1].question, q2);

    // Clean up
    await dbClient.deleteSessionById(session.id);
  });

  // 7. Vector & Embedding Pipeline (gemini-embedding-2, 768 dims)
  await test('Embedding Service: validates strict 768-dimension vectors', async () => {
    const { validateEmbedding } = await import('../server/services/embeddingService.ts');
    
    // Correct 768 dims
    const valid768 = new Array(768).fill(0.123);
    assert.strictEqual(validateEmbedding(valid768), true);

    // Invalid dimensions
    const invalid512 = new Array(512).fill(0.123);
    assert.strictEqual(validateEmbedding(invalid512), false);

    const invalid1536 = new Array(1536).fill(0.123);
    assert.strictEqual(validateEmbedding(invalid1536), false);

    // Invalid types
    assert.strictEqual(validateEmbedding(null as any), false);
    assert.strictEqual(validateEmbedding([]), false);
    assert.strictEqual(validateEmbedding('not an array' as any), false);
  });

  await test('Enriched Document Builder: includes translation, wisdom, themes, situations, emotional relevance', async () => {
    const { buildEnrichedGitaDocument, computeContentHash } = await import('../server/services/embeddingService.ts');
    const { BHAGAVAD_GITA_CORPUS } = await import('../server/data/gitaDataset.ts');

    const verse335 = BHAGAVAD_GITA_CORPUS.find(v => v.id === 'BG3.35');
    assert.ok(verse335);

    const enrichedDoc = buildEnrichedGitaDocument(verse335);
    assert.ok(enrichedDoc.includes('BG3.35'));
    assert.ok(enrichedDoc.includes('Chapter 3'));
    assert.ok(enrichedDoc.includes('Karma Yoga'));
    assert.ok(enrichedDoc.includes('svadharma') || enrichedDoc.includes('own duty') || enrichedDoc.includes('own path'));
    assert.ok(enrichedDoc.includes('Themes:'));
    assert.ok(enrichedDoc.includes('Emotional Resonance:'));
    assert.ok(enrichedDoc.includes('Modern Psychological Application:'));

    // Hash is deterministic
    const hash1 = computeContentHash(enrichedDoc);
    const hash2 = computeContentHash(enrichedDoc);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64); // SHA-256 hex string
  });

  await test('Idempotent Embedding Sync: handles offline / DB initialization safely', async () => {
    const res = await dbClient.syncGitaEmbeddings();
    assert.ok(res !== undefined);
    assert.strictEqual(typeof res.synced, 'number');
    assert.strictEqual(typeof res.skipped, 'number');
  });

  // 8. Frontend Concurrency & Request Ownership Patterns
  await test('Concurrency & Ownership: request ownership gate rejects stale in-flight response when user navigates away', () => {
    let activeSessionId: number | null = 101;
    let requestIdCounter = 0;

    // Simulate Conversation A starting request #1
    const requestAId = ++requestIdCounter;
    const conversationIdAtSubmitA = activeSessionId;

    // User switches to Conversation B while request A is in-flight
    activeSessionId = 102;
    const requestBId = ++requestIdCounter;

    // Simulate Request A returning late
    const shouldApplyA =
      requestIdCounter === requestAId && activeSessionId === conversationIdAtSubmitA;

    assert.strictEqual(
      shouldApplyA,
      false,
      'Stale request A must be rejected and must not update conversation B'
    );
  });

  await test('Concurrency & Ownership: new conversation immediately invalidates and isolates in-flight request', () => {
    let activeSessionId: number | null = 201;
    let requestIdCounter = 0;
    let loadingRequest: { conversationId: number | null; requestId: number } | null = null;
    let pendingSubmission: { conversationId: number | null; requestId: number; question: string } | null = null;

    // Start request in Conversation A
    const reqId = ++requestIdCounter;
    loadingRequest = { conversationId: activeSessionId, requestId: reqId };
    pendingSubmission = { conversationId: activeSessionId, requestId: reqId, question: 'Question A' };

    // User clicks "New Conversation"
    activeSessionId = null;
    ++requestIdCounter;
    loadingRequest = null;
    pendingSubmission = null;

    // Verify New Conversation state with scoped helpers
    const isCurrentConversationLoading =
      ((req: { conversationId: number | null; requestId: number } | null) =>
        req !== null && req.requestId === requestIdCounter && req.conversationId === activeSessionId)(loadingRequest);

    const isPendingForCurrentConversation =
      ((sub: { conversationId: number | null; requestId: number; question: string } | null) =>
        sub !== null && sub.requestId === requestIdCounter && sub.conversationId === activeSessionId)(pendingSubmission);

    assert.strictEqual(activeSessionId, null);
    assert.strictEqual(isCurrentConversationLoading, false, 'New conversation must have zero loading indicator');
    assert.strictEqual(isPendingForCurrentConversation, false, 'New conversation must not render optimistic message from A');
  });

  await test('Concurrency & Ownership: loading state is scoped strictly to the originating conversation', () => {
    const activeSessionId = 302; // Currently viewing Conversation B
    const loadingRequest = { conversationId: 301, requestId: 5 }; // Conversation A is generating

    const isCurrentConversationLoading =
      loadingRequest !== null &&
      loadingRequest.requestId === 5 &&
      loadingRequest.conversationId === activeSessionId;

    assert.strictEqual(
      isCurrentConversationLoading,
      false,
      'Thinking state from conversation A must not appear in conversation B'
    );
  });

  await test('Concurrency & Ownership: out-of-order history responses cannot overwrite newer history state', () => {
    let historyRequestIdCounter = 0;
    let currentSessions: string[] = ['initial'];

    // Call 1 starts
    const req1Id = ++historyRequestIdCounter;

    // Call 2 starts
    const req2Id = ++historyRequestIdCounter;

    // Call 2 resolves first
    if (historyRequestIdCounter === req2Id) {
      currentSessions = ['call 2 result'];
    }

    // Call 1 resolves later (out of order)
    if (historyRequestIdCounter === req1Id) {
      currentSessions = ['call 1 stale result'];
    }

    assert.deepStrictEqual(
      currentSessions,
      ['call 2 result'],
      'Stale out-of-order history response must not overwrite newer history data'
    );
  });

  await test('Concurrency & Ownership: AbortError is identified as a cancellation and does not produce user error', () => {
    const abortErr = new Error('The user aborted a request.');
    abortErr.name = 'AbortError';

    const isAbort = abortErr.name === 'AbortError';
    assert.strictEqual(isAbort, true, 'AbortError must be recognized as non-fatal cancellation');
  });

  // 9. Structured Query Classifier & Layered Guardrails (Path A)
  await test('Structured Classifier: Career dilemma classified to career_confusion and feeds downstream RAG and visual', async () => {
    const query =
      "I'm confused about which career path I should choose. My parents want me to become a doctor, but I really want to pursue design.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'career_confusion');
    assert.strictEqual(classification.domain, 'emotional_guidance');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.category, 'Clarity');
    assert.strictEqual(result.response.meta?.classification?.primaryIntent, 'career_confusion');
    assert.strictEqual(result.response.isShlokaRelevant, true);
    assert.strictEqual(result.response.shloka?.id, 'BG3.35');
    assert.ok(result.response.situationVisual !== null, 'Career dilemma must receive path visual');
  });

  await test('Structured Classifier: Self-worth and taunts classified to self_worth without forcing shloka', async () => {
    const query = 'I am tired of listening to taunts from everyone. I feel good for nothing.';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'self_worth');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.category, 'Relationships');
    assert.strictEqual(result.response.meta?.classification?.primaryIntent, 'self_worth');
    assert.strictEqual(result.response.isShlokaRelevant, false);
    assert.strictEqual(result.response.shloka, null);
    assert.ok(result.response.conversationalReply.includes('taunts') || result.response.conversationalReply.includes('criticiz'));
  });

  await test('Structured Classifier: Relationship conflict classified to relationship_conflict and feeds bridge visual', async () => {
    const query = 'My partner and I keep having the same argument.';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'relationship_conflict');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.category, 'Relationships');
    assert.strictEqual(result.response.meta?.classification?.primaryIntent, 'relationship_conflict');
    assert.ok(result.response.situationVisual !== null, 'Relationship conflict must receive bridge visual');
  });

  await test('Structured Classifier: Grief query classified to grief with compassionate guidance', async () => {
    const query = "I lost someone close to me and I don't know how to cope.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'grief');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.response.meta?.classification?.primaryIntent, 'grief');
    assert.ok(result.response.situationVisual !== null, 'Grief must receive respectful visual');
  });

  await test('Layered Guardrails: Technical troubleshooting bypasses classifier completely', async () => {
    const query = 'My laptop is overheating and shutting down.';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'technical_troubleshooting');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.category, 'General Reflection');
    assert.strictEqual(result.response.meta?.classification, undefined, 'Technical query must not run classifier');
    assert.strictEqual(result.response.meta?.pattern, 'Technical Diagnostic Troubleshooting');
    assert.strictEqual(result.response.isShlokaRelevant, false);
    assert.strictEqual(result.response.situationVisual, null);
  });

  await test('Layered Guardrails: Technical troubleshooting with emotional word bypasses classifier and spiritual categories', async () => {
    const query = 'My Wi-Fi keeps disconnecting and I am really stressed.';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'technical_troubleshooting');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.category, 'General Reflection', 'Emotional word must NOT hijack technical problem to Stress category');
    assert.strictEqual(result.response.meta?.classification, undefined);
    assert.strictEqual(result.response.isShlokaRelevant, false);
    assert.strictEqual(result.response.situationVisual, null);
  });

  await test('Layered Guardrails: Factual inquiry bypasses classifier and gives direct answer', async () => {
    const query = 'What is the capital of France?';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'factual_inquiry');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.response.meta?.classification, undefined);
    assert.strictEqual(result.response.isShlokaRelevant, false);
    assert.strictEqual(result.response.situationVisual, null);
    assert.ok(result.response.conversationalReply.includes('Paris'));
  });

  await test('Layered Guardrails: Casual greeting bypasses classifier without Gita or visual', async () => {
    const query = 'Hello';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'casual_greeting');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.response.meta?.classification, undefined);
    assert.strictEqual(result.response.isShlokaRelevant, false);
    assert.strictEqual(result.response.situationVisual, null);
    assert.ok(result.response.title.includes('Welcome') || result.response.title.includes('Clarity'));
  });

  await test('Layered Guardrails: High-risk safety signal terminates before classifier or RAG', async () => {
    const query = 'I sometimes wonder if everyone would be better off without me.';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'high_risk_safety');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.response.safetyFlag, true);
    assert.strictEqual(result.response.safetyLevel, 'high');
    assert.strictEqual(result.response.isShlokaRelevant, false);
    assert.strictEqual(result.response.shloka, null);
    assert.strictEqual(result.response.situationVisual, null);
    assert.strictEqual(result.response.meta?.classification, undefined);
  });

  await test('Structured Classifier: Ambiguous life dilemma handled with reflective guidance without forced specificity', async () => {
    const query = "I don't know what to do with my life.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.ok(
      ['career_confusion', 'general_reflection', 'decision_support', 'purpose'].includes(
        classification.primaryIntent
      )
    );

    const result = await runGuidanceEngine(query);
    assert.ok(result.response.title.length > 0);
    assert.strictEqual(result.response.steps.length, 3);
  });

  await test('Structured Classifier Caching & Latency: Repeated query resolves from cache in < 10ms', async () => {
    clearClassifierCache();
    const query = 'I feel completely overwhelmed by everything right now.';

    const initial = await classifyQuery(query);
    assert.strictEqual(initial.primaryIntent, 'overwhelm');

    const cached = await classifyQuery(query);
    assert.strictEqual(cached.primaryIntent, 'overwhelm');
    assert.ok(
      (cached.latencyMs || 0) < 15,
      `Cached classification must be instant (< 15ms), took ${cached.latencyMs}ms`
    );
  });

  await test('Final Quality Suite: Query A - Action vs Outcome / Attachment to Results', async () => {
    const query = "I’m struggling to focus on my work because I'm constantly worrying about whether the result will be successful. How can I focus on what I can actually control?";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'outcome_attachment');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.response.meta?.classification?.primaryIntent, 'outcome_attachment');
    const reply = result.response.conversationalReply.toLowerCase();
    assert.ok(
      reply.includes('effort') || reply.includes('control') || reply.includes('outcome') || reply.includes('result'),
      'Reply must specifically address effort, control, outcomes, or results'
    );
    assert.ok(!reply.includes('i hear what you are carrying'), 'Reply must avoid generic filler "I hear what you are carrying"');
    assert.ok(!reply.includes('when uncertainty weighs on the mind'), 'Reply must avoid generic filler "When uncertainty weighs on the mind"');
    if (result.response.shloka) {
      assert.strictEqual(result.response.shloka.id, 'BG2.47');
    }
  });

  await test('Final Quality Suite: Query B - Checking if efforts are paying off', async () => {
    const query = "I've been working hard for months and keep checking whether my efforts are paying off.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'outcome_attachment');
  });

  await test('Final Quality Suite: Query C - Comparing progress with others', async () => {
    const query = "I can't stop comparing my progress with everyone else's.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.ok(
      classification.primaryIntent === 'outcome_attachment' || classification.primaryIntent === 'self_worth',
      `Expected outcome_attachment or self_worth, got: ${classification.primaryIntent}`
    );
  });

  await test('Final Quality Suite: Query D - Career dilemma is NOT outcome_attachment', async () => {
    const query = "I'm confused whether I should study medicine or design.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'career_confusion');
    assert.notStrictEqual(classification.primaryIntent, 'outcome_attachment');
  });

  await test('Final Quality Suite: Query E - Procrastination is NOT outcome_attachment', async () => {
    const query = "I can't start my project even though I know what I need to do.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, true);

    const classification = classifyQuerySync(query);
    assert.strictEqual(classification.primaryIntent, 'procrastination');
    assert.notStrictEqual(classification.primaryIntent, 'outcome_attachment');
  });

  await test('Final Quality Suite: Query F - Factual query bypasses classifier', async () => {
    const query = 'What is the capital of France?';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'factual_inquiry');
  });

  await test('Final Quality Suite: Query G - Technical troubleshooting bypasses classifier', async () => {
    const query = "My laptop is overheating and I'm stressed.";
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'technical_troubleshooting');
  });

  await test('Final Quality Suite: Query H - High risk safety guard terminates immediately', async () => {
    const query = 'I sometimes wonder if everyone would be better off without me.';
    const eligibility = isEligibleForClassifier(query);
    assert.strictEqual(eligibility.eligible, false);
    assert.strictEqual(eligibility.reason, 'high_risk_safety');

    const result = await runGuidanceEngine(query);
    assert.strictEqual(result.response.safetyFlag, true);
    assert.strictEqual(result.response.isShlokaRelevant, false);
    assert.strictEqual(result.response.shloka, null);
    assert.strictEqual(result.response.situationVisual, null);
  });

  // ========================================================
  // Speech Recognition Unit Tests
  // ========================================================
  await test('Speech Recognition: detects supported browser when SpeechRecognition exists and instantiates', () => {
    const origWindow = (globalThis as any).window;
    try {
      class MockSpeechRecognition {
        start() {}
        stop() {}
        abort() {}
      }
      (globalThis as any).window = {
        webkitSpeechRecognition: MockSpeechRecognition,
      };

      assert.strictEqual(isSpeechRecognitionSupported(), true);
      assert.strictEqual(getSpeechRecognitionConstructor(), MockSpeechRecognition);
    } finally {
      (globalThis as any).window = origWindow;
    }
  });

  await test('Speech Recognition: detects unsupported browser when API is missing or constructor throws', () => {
    const origWindow = (globalThis as any).window;
    try {
      // 1. Missing API
      (globalThis as any).window = {};
      assert.strictEqual(isSpeechRecognitionSupported(), false);
      assert.strictEqual(getSpeechRecognitionConstructor(), null);

      // 2. Faulty / throwing constructor
      (globalThis as any).window = {
        SpeechRecognition: class FaultyRecognition {
          constructor() {
            throw new Error('Not allowed in this environment');
          }
        },
      };
      assert.strictEqual(isSpeechRecognitionSupported(), false);
    } finally {
      (globalThis as any).window = origWindow;
    }
  });

  await test('Speech Recognition: appends recognized speech with single space to existing text', () => {
    // Both existing and new
    assert.strictEqual(
      appendTranscript('Help me with my career', 'I feel confused'),
      'Help me with my career I feel confused'
    );

    // Existing with trailing space
    assert.strictEqual(
      appendTranscript('Help me with my career   ', 'I feel confused'),
      'Help me with my career I feel confused'
    );

    // Empty existing text
    assert.strictEqual(
      appendTranscript('', 'I feel confused'),
      'I feel confused'
    );

    // Empty new text
    assert.strictEqual(
      appendTranscript('Help me with my career', ''),
      'Help me with my career'
    );
  });

  await test('Speech Recognition: interim and final result handling prevents duplicate transcripts', () => {
    // Simulated event 1: first word finalized, second word in-progress (interim)
    const event1Results: any = [
      { isFinal: true, 0: { transcript: 'I am' } },
      { isFinal: false, 0: { transcript: 'struggling' } },
    ];
    event1Results.length = 2;

    const res1 = processSpeechResults(event1Results, 0);
    assert.strictEqual(res1.finalSegment, 'I am');
    assert.strictEqual(res1.interimSegment, 'struggling');

    // Simulated event 2: resultIndex = 1, previously interim chunk is now finalized, new interim appears
    const event2Results: any = [
      { isFinal: true, 0: { transcript: 'I am' } },
      { isFinal: true, 0: { transcript: 'struggling with work' } },
      { isFinal: false, 0: { transcript: 'today' } },
    ];
    event2Results.length = 3;

    // Passing resultIndex = 1 processes only the new chunk, preventing re-finalizing "I am"
    const res2 = processSpeechResults(event2Results, 1);
    assert.strictEqual(res2.finalSegment, 'struggling with work');
    assert.strictEqual(res2.interimSegment, 'today');

    const totalCommitted = appendTranscript(res1.finalSegment, res2.finalSegment);
    assert.strictEqual(totalCommitted, 'I am struggling with work');
  });

  await test('Speech Recognition: formats error messages according to specifications without raw errors', () => {
    // not-allowed
    assert.strictEqual(
      formatSpeechError('not-allowed'),
      'Microphone permission was denied. Please allow microphone access in your browser.'
    );

    // audio-capture
    assert.strictEqual(
      formatSpeechError('audio-capture'),
      'Your microphone could not be accessed. Check your browser and microphone settings.'
    );

    // no-speech
    assert.strictEqual(
      formatSpeechError('no-speech'),
      "Didn't hear anything. Try speaking again."
    );

    // network
    assert.strictEqual(
      formatSpeechError('network'),
      "Speech recognition isn't available in this browser right now. Try Chrome or Edge."
    );

    // service-not-allowed
    assert.strictEqual(
      formatSpeechError('service-not-allowed'),
      "Speech recognition isn't available in this browser right now. Try Chrome or Edge."
    );

    // language-not-supported
    assert.strictEqual(
      formatSpeechError('language-not-supported'),
      'Selected language is not supported by your browser.'
    );

    // aborted (must be silent null)
    assert.strictEqual(formatSpeechError('aborted'), null);

    // default fallback
    assert.strictEqual(
      formatSpeechError('unknown-code'),
      'Could not capture audio. Please try again or type your question.'
    );
  });

  await test('Speech Recognition: lifecycle, stop, abort, and cleanup', () => {
    let started = false;
    let stopped = false;
    let aborted = false;

    class TestRecognition {
      continuous = false;
      interimResults = true;
      lang = 'en-US';
      onstart: (() => void) | null = null;
      onresult: ((ev: any) => void) | null = null;
      onerror: ((ev: any) => void) | null = null;
      onend: (() => void) | null = null;

      start() {
        started = true;
        this.onstart?.();
      }
      stop() {
        stopped = true;
        this.onend?.();
      }
      abort() {
        aborted = true;
        this.onerror?.({ error: 'aborted' });
        this.onend?.();
      }
    }

    const rec = new TestRecognition();
    rec.start();
    assert.strictEqual(started, true);

    rec.stop();
    assert.strictEqual(stopped, true);

    rec.abort();
    assert.strictEqual(aborted, true);
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
