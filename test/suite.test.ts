import assert from 'node:assert';
import {
  normalizeText,
  calculateCategoryScores,
  runGuidanceEngine,
  runGuidanceEngineSync,
} from '../server/services/guidanceEngine.ts';
import { retrieveGitaShlokaRAG } from '../server/services/ragEngine.ts';
import { dbClient } from '../server/db/client.ts';

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

  // 6. Dynamic Situational Visual & Multi-Turn Dialogue
  await test('Situational Visual: generates custom bespoke visual scene on the fly', async () => {
    const { response } = await runGuidanceEngine('I feel confused about which path I should take in life.');
    assert.ok(response.situationVisual);
    assert.strictEqual(response.situationVisual.theme, 'crossroad-dawn');
    assert.ok(response.situationVisual.prompt.length > 20);
    assert.ok(response.situationVisual.mood);
    assert.ok(response.situationVisual.palette.skyTop);
    assert.ok(response.situationVisual.palette.skyBottom);
    assert.strictEqual(response.situationVisual.elements.hasPath, true);
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

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
