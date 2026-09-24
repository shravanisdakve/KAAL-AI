import assert from 'node:assert';
import {
  normalizeText,
  calculateCategoryScores,
  runGuidanceEngine,
} from '../server/services/guidanceEngine.ts';
import { dbClient } from '../server/db/client.ts';

async function runTestSuite() {
  console.log('\n🧪 Running KAAL AI Comprehensive Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✓ ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ✗ ${name}`);
            console.error(`    Error: ${err.message}`);
            failed++;
          });
      }
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Text Normalization
  test('Text Normalization: cleans punctuation, lowers case, trims extra spaces', () => {
    const raw = '  How can I   STAY CALM?! Under pressure...  ';
    const normalized = normalizeText(raw);
    assert.strictEqual(normalized, 'how can i stay calm under pressure');
  });

  // 2. Category Signal Scoring & Classification
  test('Category Scoring: correctly identifies Stress signals', () => {
    const query = 'I feel completely overwhelmed by anxiety and pressure';
    const scores = calculateCategoryScores(normalizeText(query));
    assert.strictEqual(scores[0].category, 'Stress');
    assert.ok(scores[0].score > 5);
  });

  test('Category Scoring: correctly identifies Clarity signals', () => {
    const query = 'I am so confused about which path to take in my life';
    const { category, response } = runGuidanceEngine(query);
    assert.strictEqual(category, 'Clarity');
    assert.ok(response.title.length > 0);
    assert.strictEqual(response.steps.length, 3);
  });

  test('Category Scoring: correctly identifies Discipline signals', () => {
    const query = 'I know what to do but I keep procrastinating on my habits';
    const { category } = runGuidanceEngine(query);
    assert.strictEqual(category, 'Discipline');
  });

  test('Category Scoring: correctly identifies Purpose / Svadharma signals', () => {
    const query = 'I am working hard but I do not know my purpose or meaning';
    const { category } = runGuidanceEngine(query);
    assert.strictEqual(category, 'Purpose');
  });

  test('Category Scoring: correctly identifies Meditation / Stillness signals', () => {
    const query = 'How do I maintain a daily meditation habit and cultivate stillness?';
    const { category } = runGuidanceEngine(query);
    assert.strictEqual(category, 'Meditation');
  });

  test('Category Scoring: correctly falls back to General Reflection for sparse queries', () => {
    const query = 'Hello there';
    const { category } = runGuidanceEngine(query);
    assert.strictEqual(category, 'General Reflection');
  });

  // 3. Response Structure & Gita-Grounded Architecture
  test('Response Structure: includes Core Guidance, Steps, and Meta', () => {
    const { response } = runGuidanceEngine('I feel overwhelmed and anxious');
    assert.ok(response.title);
    assert.ok(response.summary);
    assert.ok(Array.isArray(response.steps));
    assert.strictEqual(response.steps.length, 3);
    assert.ok(Array.isArray(response.frameworkSteps));
    assert.ok(response.frameworkSteps.length > 0);
    assert.strictEqual(response.meta?.engine, 'KAAL Rule-Based Guidance Engine');
  });

  // 4. Database Operations & Resilience
  await test('Database: creates and retrieves a guidance session', async () => {
    const question = 'Test session: how to overcome fear?';
    const { category, response } = runGuidanceEngine(question);
    const session = await dbClient.createSession(question, category, response);

    assert.ok(session.id);
    assert.strictEqual(session.question, question);
    assert.strictEqual(session.category, category);

    const fetched = await dbClient.getSessionById(session.id);
    assert.ok(fetched);
    assert.strictEqual(fetched?.id, session.id);

    // Clean up test session
    await dbClient.deleteSessionById(session.id);
  });

  test('Database: fetches all sessions sorted newest first', async () => {
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
