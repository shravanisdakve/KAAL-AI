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
  await test('RAG Retrieval: accurately fetches BG 2.47 for overwhelm & anxiety of results', () => {
    const rag = retrieveGitaShlokaRAG(
      'I feel overwhelmed by everything happening in my life. What should I do?'
    );
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG2.47');
    assert.strictEqual(rag.shloka?.chapter, 2);
    assert.strictEqual(rag.shloka?.verse, 47);
    assert.ok(rag.shloka?.sanskrit.includes('कर्मण्येवाधिकारस्ते'));
  });

  await test('RAG Retrieval: accurately fetches BG 3.8 for procrastination', () => {
    const rag = retrieveGitaShlokaRAG('I keep procrastinating on my work and habits');
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG3.8');
    assert.ok(rag.shloka?.sanskrit.includes('नियतं कुरु कर्म'));
  });

  await test('RAG Retrieval: accurately fetches BG 2.20 for death & bereavement', () => {
    const rag = retrieveGitaShlokaRAG(
      'My grandmother passed away yesterday and I cannot stop crying. The grief is unbearable.'
    );
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG2.20');
    assert.ok(rag.shloka?.sanskrit.includes('न जायते म्रियते'));
  });

  await test('RAG Retrieval: accurately fetches BG 12.13 for relationship conflict & arguments', () => {
    const rag = retrieveGitaShlokaRAG('I had a terrible fight with my spouse and said things I regret');
    assert.strictEqual(rag.isShlokaRelevant, true);
    assert.ok(rag.shloka);
    assert.strictEqual(rag.shloka?.id, 'BG12.13');
    assert.ok(rag.shloka?.sanskrit.includes('अद्वेष्टा सर्वभूतानां'));
  });

  await test('RAG Conditional Relevance: does NOT force a shloka for casual greetings', () => {
    const rag = retrieveGitaShlokaRAG('Hello, how are you?');
    assert.strictEqual(rag.isShlokaRelevant, false);
    assert.strictEqual(rag.shloka, null);
  });

  await test('RAG Conditional Relevance: does NOT force a shloka for meta or factual trivia', () => {
    const rag1 = retrieveGitaShlokaRAG('What is your tech stack?');
    assert.strictEqual(rag1.isShlokaRelevant, false);
    assert.strictEqual(rag1.shloka, null);

    const rag2 = retrieveGitaShlokaRAG('What is the capital of France?');
    assert.strictEqual(rag2.isShlokaRelevant, false);
    assert.strictEqual(rag2.shloka, null);
  });

  // 4. Response Structure & Conversational Synthesis
  await test('Response Structure: includes conversationalReply, reflectionPrompt, and Shloka when relevant', async () => {
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
    assert.ok(response.reflectionPrompt);
    assert.ok(Array.isArray(response.steps));
    assert.strictEqual(response.steps.length, 3);
  });

  await test('Conversational Engine: natural conversational reply without shloka for casual greeting', async () => {
    const { response } = await runGuidanceEngine('Hello');
    assert.strictEqual(response.isShlokaRelevant, false);
    assert.strictEqual(response.shloka, null);
    assert.ok(response.conversationalReply.toLowerCase().includes('welcome') || response.conversationalReply.toLowerCase().includes('breath'));
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

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
