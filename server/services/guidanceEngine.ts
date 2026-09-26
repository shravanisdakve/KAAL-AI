import {
  GuidanceCategory,
  GuidanceSession,
  StructuredGuidanceResponse,
  TacticalStep,
} from '../types/guidance.ts';
import { retrieveGitaShlokaRAG, retrieveGitaShlokaRAGSync } from './ragEngine.ts';
import {
  generateConversationalGuidance,
  synthesizeEmpatheticFallback,
} from './conversationalEngine.ts';
import { generateSituationVisual } from './visualGenerator.ts';

interface KeywordRule {
  term: string;
  weight: number;
}

interface PatternRule {
  id: string;
  name: string;
  keywords: string[];
  generate: (question: string) => {
    title: string;
    summary: string;
    steps: string[];
    frameworkSteps: TacticalStep[];
  };
}

// Category keyword dictionary with explicit weights tailored to KAAL AI's Gita-inspired domain
const CATEGORY_SIGNALS: Record<GuidanceCategory, KeywordRule[]> = {
  Clarity: [
    { term: 'confused', weight: 4 },
    { term: 'confuse', weight: 3 },
    { term: 'path', weight: 4 },
    { term: 'direction', weight: 3 },
    { term: 'overthink', weight: 3 },
    { term: 'overthinking', weight: 4 },
    { term: 'decision', weight: 3 },
    { term: 'decisions', weight: 3 },
    { term: 'choice', weight: 2 },
    { term: 'dilemma', weight: 3 },
    { term: 'clarity', weight: 4 },
  ],
  Stress: [
    { term: 'overwhelmed', weight: 4 },
    { term: 'overwhelm', weight: 3 },
    { term: 'stress', weight: 4 },
    { term: 'anxious', weight: 3 },
    { term: 'anxiety', weight: 3 },
    { term: 'pressure', weight: 3 },
    { term: 'exhausted', weight: 3 },
    { term: 'drowning', weight: 3 },
    { term: 'calm', weight: 3 },
    { term: 'calmer', weight: 4 },
  ],
  Purpose: [
    { term: 'purpose', weight: 5 },
    { term: 'meaning', weight: 3 },
    { term: 'working hard', weight: 4 },
    { term: 'unhappy', weight: 3 },
    { term: 'career', weight: 3 },
    { term: 'calling', weight: 3 },
    { term: 'why', weight: 2 },
    { term: 'empty', weight: 3 },
  ],
  Relationships: [
    { term: 'relationship', weight: 4 },
    { term: 'relationships', weight: 4 },
    { term: 'problem', weight: 2 },
    { term: 'problems', weight: 3 },
    { term: 'partner', weight: 3 },
    { term: 'friend', weight: 2 },
    { term: 'family', weight: 2 },
    { term: 'conflict', weight: 3 },
    { term: 'expectation', weight: 3 },
    { term: 'expectations', weight: 3 },
    { term: 'anger', weight: 3 },
  ],
  'Fear & Uncertainty': [
    { term: 'fear', weight: 4 },
    { term: 'afraid', weight: 4 },
    { term: 'wrong decision', weight: 5 },
    { term: 'uncertainty', weight: 4 },
    { term: 'uncertain', weight: 3 },
    { term: 'unknown', weight: 3 },
    { term: 'risk', weight: 2 },
    { term: 'fail', weight: 3 },
    { term: 'failure', weight: 3 },
    { term: 'doubt', weight: 3 },
  ],
  Discipline: [
    { term: 'procrastin', weight: 5 },
    { term: 'procrastinating', weight: 5 },
    { term: 'know what i need', weight: 4 },
    { term: 'discipline', weight: 4 },
    { term: 'routine', weight: 3 },
    { term: 'habit', weight: 3 },
    { term: 'delay', weight: 2 },
    { term: 'lazy', weight: 3 },
    { term: 'focus', weight: 3 },
  ],
  Meditation: [
    { term: 'meditation', weight: 5 },
    { term: 'meditate', weight: 4 },
    { term: 'habit', weight: 3 },
    { term: 'maintain', weight: 3 },
    { term: 'stillness', weight: 4 },
    { term: 'mindfulness', weight: 3 },
    { term: 'breath', weight: 3 },
    { term: 'quiet', weight: 2 },
  ],
  'General Reflection': [
    { term: 'life', weight: 2 },
    { term: 'mind', weight: 2 },
    { term: 'reflect', weight: 3 },
    { term: 'guidance', weight: 2 },
    { term: 'think', weight: 1 },
    { term: 'help', weight: 1 },
  ],
};

// Gita-inspired patterns for each domain
const PATTERNS: Record<GuidanceCategory, PatternRule[]> = {
  Clarity: [
    {
      id: 'clarity_path_selection',
      name: 'Discerning Your Core Path (Vivaka & Duty)',
      keywords: ['path', 'confused', 'direction', 'choice', 'life', 'decision'],
      generate: () => ({
        title: 'Separate What You Can Control From What You Cannot',
        summary:
          'Confusion arises when we evaluate options through the lens of external outcomes rather than internal alignment. You do not need to solve your entire future today—clarity emerges from single, aligned steps.',
        steps: [
          'Identify what is actually within your immediate control today.',
          'Write down the decision without judging your feelings or doubts.',
          'Choose one small, constructive action you can execute right now.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'Audit Your Sphere of Control',
            status: 'Active Focus',
            description:
              'Draw a circle. Inside, list your effort, attitude, and immediate choices. Outside, place external reactions, future guarantees, and other people’s opinions.',
            checklist: [
              'List 3 immediate actions within your 100% control',
              'Release 2 external outcomes that you cannot guarantee',
            ],
          },
          {
            id: 2,
            title: 'Formulate an Unfiltered Option Matrix',
            status: 'Pending',
            description:
              'Write out your competing paths on paper without fear of making a mistake. Notice which path reflects duty and personal growth versus fear of disappointment.',
            checklist: [
              'Record path A and path B with core values involved',
              'Highlight the option that aligns with long-term integrity over quick comfort',
            ],
          },
          {
            id: 3,
            title: 'Commit to a Single Micro-Step Today',
            status: 'Pending',
            description:
              'Take one physical action within the next 2 hours to move forward on the aligned path, letting momentum dissolve overthinking.',
            checklist: [
              'Complete a 15-minute exploratory task',
              'Set a reflection date 7 days from now to review progress',
            ],
          },
        ],
      }),
    },
  ],

  Stress: [
    {
      id: 'stress_overwhelm_stillness',
      name: 'Discharging Overwhelm (Equanimity / Samatvam)',
      keywords: ['overwhelmed', 'stress', 'drowning', 'pressure', 'anxious', 'calmer', 'calm'],
      generate: () => ({
        title: 'Practice Equanimity & Drop the Weight of Outcomes',
        summary:
          'Overwhelm occurs when the mind attempts to carry every future obligation simultaneously. True stillness comes from dropping attachment to results (Nishkama Karma) and returning to the present moment.',
        steps: [
          'Pause all input and take three deep, conscious breaths.',
          'Discharge your mental burden by writing every open thought onto paper.',
          'Focus exclusively on the single next task right in front of you.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'Complete a Mental Evacuation',
            status: 'Active Focus',
            description:
              'Write down every anxiety, deadline, and expectation without organizing or filtering. Externalizing thoughts reduces immediate nervous system load.',
            checklist: [
              'Write unedited thoughts on paper for 5 minutes',
              'Mark items that need immediate care versus items to defer',
            ],
          },
          {
            id: 2,
            title: 'Establish a Non-Negotiable Boundary',
            status: 'Pending',
            description:
              'Decide on one responsibility you will pause or decline today to create essential breathing room for your mind.',
            checklist: [
              'Identify one low-priority task to postpone',
              'Communicate a polite boundary or delay to stakeholders',
            ],
          },
          {
            id: 3,
            title: 'Return to Single-Task Presence',
            status: 'Pending',
            description:
              'Direct 100% of your energy toward the single action immediately ahead of you, ignoring everything outside this 30-minute window.',
            checklist: [
              'Set a 25-minute single-focus timer',
              'Mute all notifications during the focus window',
            ],
          },
        ],
      }),
    },
  ],

  Purpose: [
    {
      id: 'purpose_svadharma',
      name: 'Discovering Purpose & Natural Calling (Svadharma)',
      keywords: ['purpose', 'meaning', 'working hard', 'unhappy', 'career', 'direction', 'calling'],
      generate: () => ({
        title: 'Honor Your Svadharma Rather Than Imitating Others',
        summary:
          'The Gita teaches that it is better to perform your own duty imperfectly than to master another’s path. Working hard without purpose means working for external validation rather than inner alignment.',
        steps: [
          'Distinguish between external status expectations and your intrinsic strengths.',
          'Identify where your natural effort creates genuine service or impact.',
          'Re-anchor daily effort in self-mastery rather than social comparison.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'Identify Your Natural Duty (Svadharma)',
            status: 'Active Focus',
            description:
              'Reflect on activities where your focus flows naturally and where you feel energized rather than depleted, regardless of public praise.',
            checklist: [
              'Write down 3 moments this month where you felt deep engagement',
              'Note the specific skills and intentions behind those moments',
            ],
          },
          {
            id: 2,
            title: 'Detach Action From External Reward',
            status: 'Pending',
            description:
              'Reframe your current work as a discipline for internal growth (Karmayoga) rather than a transaction for approval or prestige.',
            checklist: [
              'Define one internal quality (e.g. patience, clarity) to cultivate today',
              'Evaluate your work day by effort invested rather than external applause',
            ],
          },
          {
            id: 3,
            title: 'Design a Purpose-Aligned Experiment',
            status: 'Pending',
            description:
              'Introduce one project or learning initiative each week that directly honors your core values and creative energy.',
            checklist: [
              'Dedicate 30 minutes daily to your purpose-driven study or project',
              'Track personal satisfaction weekly in a journal',
            ],
          },
        ],
      }),
    },
  ],

  Relationships: [
    {
      id: 'relationships_compassion',
      name: 'Navigating Relationships With Equanimity (Maitri)',
      keywords: ['relationship', 'relationships', 'problems', 'problem', 'partner', 'conflict', 'handle', 'expectations'],
      generate: () => ({
        title: 'Respond With Compassion & Release Reactive Expectations',
        summary:
          'Conflict in relationships often stems from holding unstated expectations or reacting to another person’s state rather than responding from your own centered awareness.',
        steps: [
          'Separate the person’s core intention from their reactive behavior.',
          'Communicate your boundary clearly without anger or defensiveness.',
          'Focus on being present and understanding before seeking to be understood.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'Pause the Reactive Impulse',
            status: 'Active Focus',
            description:
              'When tension arises, take a step back to prevent defensive retaliation. Remember that inner peace is your primary responsibility.',
            checklist: [
              'Take 3 deep breaths before responding to difficult comments',
              'Identify the unspoken fear or need beneath the conflict',
            ],
          },
          {
            id: 2,
            title: 'State Needs With Clarity & Compassion',
            status: 'Pending',
            description:
              'Express your feelings using simple "I" statements without blaming or projecting judgment onto the other person.',
            checklist: [
              'Draft your key message focusing on honest feeling and clear needs',
              'Schedule a calm, distraction-free time for dialogue',
            ],
          },
          {
            id: 3,
            title: 'Practice Detached Good-Will',
            status: 'Pending',
            description:
              'Offer genuine care while accepting that you cannot control another person’s choices or emotional growth rate.',
            checklist: [
              'Release the urge to fix or control the other person',
              'Focus on maintaining your own integrity and kindness',
            ],
          },
        ],
      }),
    },
  ],

  'Fear & Uncertainty': [
    {
      id: 'fear_courage_action',
      name: 'Overcoming Fear & Decision Anxiety (Abhaya)',
      keywords: ['fear', 'afraid', 'wrong decision', 'uncertainty', 'unknown', 'risk', 'fail', 'doubt'],
      generate: () => ({
        title: 'Action Clears Fear—Focus on Intentional Steps',
        summary:
          'Fear is an illusion constructed by the mind anticipating hypothetical future loss. The Gita reminds us that when action is performed with pure intention, no effort is wasted and no harm comes.',
        steps: [
          'Acknowledge fear as a natural signal, not a mandate to freeze.',
          'Define the absolute worst-case scenario and how you would recover.',
          'Take one irreversible small step forward to break the grip of doubt.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'De-catastrophize the Worst Case',
            status: 'Active Focus',
            description:
              'Write down the exact outcome you fear. Outline 3 concrete steps you would take to rebuild if that worst outcome actually materialized.',
            checklist: [
              'Detail the worst-case scenario on paper',
              'Write a 3-step recovery plan for that scenario',
            ],
          },
          {
            id: 2,
            title: 'Shift Focus From Loss to Growth',
            status: 'Pending',
            description:
              'Reframe the decision: even if the path requires adjustment later, the experience yields wisdom and resilience.',
            checklist: [
              'List 2 valuable lessons gained regardless of outcome',
              'Affirm your capacity to adapt to new information',
            ],
          },
          {
            id: 3,
            title: 'Execute Courageous Action',
            status: 'Pending',
            description:
              'Take a concrete, non-reversible step (sending the email, making the call, publishing the work) to lock in commitment.',
            checklist: [
              'Perform the action within the next 24 hours',
              'Acknowledge your courage immediately after completion',
            ],
          },
        ],
      }),
    },
  ],

  Discipline: [
    {
      id: 'discipline_abhyasa',
      name: 'Building Discipline Through Practice (Abhyasa & Vairagya)',
      keywords: ['procrastinating', 'procrastin', 'discipline', 'know what i need', 'routine', 'habit', 'lazy'],
      generate: () => ({
        title: 'Master the Mind Through Steady Practice (Abhyasa)',
        summary:
          'Procrastination is not a flaw of character; it is a momentary struggle between immediate comfort and long-term purpose. The mind is trained through gentle, persistent practice (Abhyasa) and detachment from micro-distractions (Vairagya).',
        steps: [
          'Lower the initiation barrier so starting takes less than 2 minutes.',
          'Commit to the practice without waiting for emotional motivation.',
          'Remove sensory distractions to safeguard your daily routine.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'Establish a 2-Minute Entry Rule',
            status: 'Active Focus',
            description:
              'Break the task down into a starting step so simple that your mind cannot object—such as opening a notebook or sitting at your desk.',
            checklist: [
              'Define the immediate 2-minute starting action',
              'Execute the starting action without evaluating the full workload',
            ],
          },
          {
            id: 2,
            title: 'Create an Environment of Frictionless Focus',
            status: 'Pending',
            description:
              'Eliminate temptations before you start so discipline does not depend on finite willpower.',
            checklist: [
              'Remove phone or irrelevant tabs from your field of view',
              'Set out all required materials prior to starting',
            ],
          },
          {
            id: 3,
            title: 'Celebrate Consistency Over Magnitude',
            status: 'Pending',
            description:
              'Focus on keeping the daily streak alive, even if some sessions are brief. Regularity builds lasting mental neural pathways.',
            checklist: [
              'Mark completion on a daily habit calendar',
              'Reflect on the quiet satisfaction of honoring your word to yourself',
            ],
          },
        ],
      }),
    },
  ],

  Meditation: [
    {
      id: 'meditation_stillness',
      name: 'Cultivating Inner Stillness (Dhyana)',
      keywords: ['meditation', 'meditate', 'habit', 'maintain', 'stillness', 'mindfulness', 'breath', 'quiet'],
      generate: () => ({
        title: 'Build a Sustainable Meditation Practice With Patience',
        summary:
          'Meditation is not about stopping all thoughts, but observing them without judgment like clouds passing across a clear sky. A steady 5-minute daily sit creates deeper peace than sporadic long sessions.',
        steps: [
          'Anchor your meditation session to an existing daily habit.',
          'Start with a manageable 5-minute breath-awareness sit.',
          'View wandering thoughts as opportunities to gently return to the breath.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'Anchor to a Daily Cue',
            status: 'Active Focus',
            description:
              'Pair your meditation sit with a fixed morning routine, such as right after waking up or after your morning tea.',
            checklist: [
              'Choose a dedicated quiet spot for your sit',
              'Set a gentle 5-minute timer',
            ],
          },
          {
            id: 2,
            title: 'Focus on Breath & Equanimity',
            status: 'Pending',
            description:
              'Rest your attention on the natural rise and fall of the breath. When thoughts arise, label them gently ("thinking") and return to the breath.',
            checklist: [
              'Sit comfortably with a upright, relaxed posture',
              'Observe 10 conscious breaths without trying to control them',
            ],
          },
          {
            id: 3,
            title: 'Maintain Non-Judgmental Continuity',
            status: 'Pending',
            description:
              'Never judge a session as "good" or "bad". Simply showing up to sit is the complete success of the practice.',
            checklist: [
              'Complete 7 consecutive days of 5-minute sits',
              'Gradually extend duration only when the habit feels effortless',
            ],
          },
        ],
      }),
    },
  ],

  'General Reflection': [
    {
      id: 'general_self_inquiry',
      name: 'Self-Inquiry & Inner Reflection (Atma Vichara)',
      keywords: ['life', 'mind', 'reflect', 'guidance', 'think', 'help', 'today'],
      generate: (question: string) => ({
        title: 'Turn Inward for Guidance & Self-Inquiry',
        summary:
          `Every question about life is an invitation for deeper self-inquiry. Regarding "${question.slice(0, 50)}${question.length > 50 ? '...' : ''}", clarity begins when you step back from noise and listen to your inner wisdom.`,
        steps: [
          'Take a quiet moment to observe your current state without judgment.',
          'Identify the underlying value or need beneath your question.',
          'Take one practical, aligned action today.',
        ],
        frameworkSteps: [
          {
            id: 1,
            title: 'Practice Conscious Observation',
            status: 'Active Focus',
            description:
              'Sit quietly for a few moments to observe your thoughts and feelings without trying to alter or force a quick answer.',
            checklist: [
              'Take 3 deep, grounding breaths',
              'Note the primary emotion present right now',
            ],
          },
          {
            id: 2,
            title: 'Reflect on Core Intentions',
            status: 'Pending',
            description:
              'Ask yourself: "What truly matters most to me in this situation?" Focus on truth, growth, and peace.',
            checklist: [
              'Write down your core intention in 1 short sentence',
              'Check if your proposed next step matches that intention',
            ],
          },
          {
            id: 3,
            title: 'Move Forward With Presence',
            status: 'Pending',
            description:
              'Engage in your next daily duty with full attention, trusting that clarity deepens through continuous action.',
            checklist: [
              'Execute one immediate positive action',
              'End the day with a moment of quiet gratitude',
            ],
          },
        ],
      }),
    },
  ],
};

/**
 * Normalizes input text for deterministic matching:
 * Converts to lowercase, strips extraneous punctuation, trims whitespace.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Score each category based on normalized text and weighted signals
 */
export function calculateCategoryScores(
  normalized: string
): { category: GuidanceCategory; score: number; matchedKeywords: string[] }[] {
  const words = normalized.split(' ');
  const results: { category: GuidanceCategory; score: number; matchedKeywords: string[] }[] = [];

  const categories: GuidanceCategory[] = [
    'Clarity',
    'Stress',
    'Purpose',
    'Relationships',
    'Fear & Uncertainty',
    'Discipline',
    'Meditation',
    'General Reflection',
  ];

  for (const cat of categories) {
    let score = 0;
    const matched: string[] = [];
    const signals = CATEGORY_SIGNALS[cat] || [];

    for (const signal of signals) {
      const term = signal.term.toLowerCase();
      // Check full word match or substring if phrase/stem
      const hasMatch =
        words.includes(term) ||
        normalized.includes(` ${term}`) ||
        normalized.startsWith(`${term} `) ||
        normalized.includes(term);

      if (hasMatch) {
        score += signal.weight;
        matched.push(signal.term);
      }
    }

    results.push({ category: cat, score, matchedKeywords: matched });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Select the best matching pattern within a category
 */
export function selectPattern(
  category: GuidanceCategory,
  normalized: string
): PatternRule {
  const categoryPatterns = PATTERNS[category] || PATTERNS['General Reflection'];

  let bestPattern = categoryPatterns[0];
  let highestMatchCount = -1;

  for (const pattern of categoryPatterns) {
    let matchCount = 0;
    for (const kw of pattern.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        matchCount += 2;
      }
    }
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      bestPattern = pattern;
    }
  }

  return bestPattern;
}

/**
 * Primary Guidance Engine entry point with RAG Shloka Retrieval & Conversational Synthesis.
 * Incorporates Bhagavad Gita RAG retrieval with conditional relevance filtering and high-EQ conversational dialogue.
 */
export async function runGuidanceEngine(
  question: string,
  existingSession?: GuidanceSession
): Promise<{
  category: GuidanceCategory;
  response: StructuredGuidanceResponse;
}> {
  const normalized = normalizeText(question);
  const scoredCategories = calculateCategoryScores(normalized);

  const topCategory = scoredCategories[0];

  // If score is negligible (< 2), fallback to General Reflection category
  let resolvedCategory: GuidanceCategory = topCategory.category;
  if (topCategory.score < 2) {
    resolvedCategory = 'General Reflection';
  }

  // 1. Run Bhagavad Gita RAG Retrieval Pipeline
  const ragResult = await retrieveGitaShlokaRAG(question);

  // Extract previous conversation turns if continuing a dialogue
  const conversationHistory =
    existingSession?.messages && existingSession.messages.length > 0
      ? existingSession.messages.map((m) => ({
          question: m.question,
          reply: m.response.conversationalReply,
          shloka: m.response.shloka?.id,
        }))
      : existingSession
      ? [
          {
            question: existingSession.question,
            reply: existingSession.response.conversationalReply,
            shloka: existingSession.response.shloka?.id,
          },
        ]
      : undefined;

  // 2. Synthesize Human-Like Conversational Guidance with conversation history
  const conversational = await generateConversationalGuidance({
    question,
    detectedEmotion: ragResult.detectedEmotion,
    shloka: ragResult.shloka,
    isShlokaRelevant: ragResult.isShlokaRelevant,
    conversationHistory,
  });

  // 3. Fallback Pattern Selection (for tactical steps compatibility)
  const pattern = selectPattern(resolvedCategory, normalized);
  const generated = pattern.generate(question);

  const stepsToUse =
    conversational.steps && conversational.steps.length > 0
      ? conversational.steps
      : generated.steps;

  const frameworkStepsToUse: TacticalStep[] = generated.frameworkSteps.map((step, idx) => ({
    ...step,
    title: stepsToUse[idx] || step.title,
  }));

  // 4. Generate bespoke situation visual on the fly for this exact question and emotional state
  const situationVisual = generateSituationVisual({
    question,
    category: resolvedCategory,
    detectedEmotion: ragResult.detectedEmotion,
    shloka: ragResult.shloka,
    isShlokaRelevant: ragResult.isShlokaRelevant,
  });

  const structuredResponse: StructuredGuidanceResponse = {
    title: conversational.title || generated.title,
    summary: conversational.summary || generated.summary,
    conversationalReply: conversational.conversationalReply,
    steps: stepsToUse,
    frameworkSteps: frameworkStepsToUse,
    shloka: ragResult.isShlokaRelevant ? ragResult.shloka : null,
    isShlokaRelevant: ragResult.isShlokaRelevant,
    whyThisRelates: ragResult.isShlokaRelevant
      ? conversational.whyThisRelates || (ragResult.shloka ? ragResult.shloka.meaning : undefined)
      : undefined,
    detectedEmotion: ragResult.detectedEmotion,
    reflectionPrompt: conversational.reflectionPrompt,
    situationVisual,
    meta: {
      category: resolvedCategory,
      pattern:
        ragResult.isShlokaRelevant && ragResult.shloka
          ? `${ragResult.shloka.id}: ${ragResult.shloka.chapterName}`
          : pattern.name,
      score: topCategory.score,
      matchedKeywords: topCategory.matchedKeywords,
      relevanceScore: ragResult.relevanceScore,
      retrievalEngine: 'Bhagavad Gita Hybrid RAG Retrieval Engine',
      engine: 'KAAL Hybrid RAG & Guidance Engine',
      retrievalMethod: ragResult.retrievalMethod,
      semanticScore: ragResult.semanticScore,
      keywordScore: ragResult.keywordScore,
      contextScore: ragResult.contextScore,
      finalScore: ragResult.finalScore,
      nlpAnalysis: ragResult.nlpUnderstanding,
      candidateRankings: ragResult.candidateRankings,
    },
  };

  return {
    category: resolvedCategory,
    response: structuredResponse,
  };
}

/**
 * Synchronous variant for zero-latency seeding and offline fallback.
 */
export function runGuidanceEngineSync(question: string): {
  category: GuidanceCategory;
  response: StructuredGuidanceResponse;
} {
  const normalized = normalizeText(question);
  const scoredCategories = calculateCategoryScores(normalized);

  const topCategory = scoredCategories[0];
  let resolvedCategory: GuidanceCategory = topCategory.category;
  if (topCategory.score < 2) {
    resolvedCategory = 'General Reflection';
  }

  const ragResult = retrieveGitaShlokaRAGSync(question);
  const conversational = synthesizeEmpatheticFallback({
    question,
    detectedEmotion: ragResult.detectedEmotion,
    shloka: ragResult.shloka,
    isShlokaRelevant: ragResult.isShlokaRelevant,
  });

  const pattern = selectPattern(resolvedCategory, normalized);
  const generated = pattern.generate(question);

  const stepsToUse =
    conversational.steps && conversational.steps.length > 0
      ? conversational.steps
      : generated.steps;

  const frameworkStepsToUse: TacticalStep[] = generated.frameworkSteps.map((step, idx) => ({
    ...step,
    title: stepsToUse[idx] || step.title,
  }));

  const situationVisual = generateSituationVisual({
    question,
    category: resolvedCategory,
    detectedEmotion: ragResult.detectedEmotion,
    shloka: ragResult.shloka,
    isShlokaRelevant: ragResult.isShlokaRelevant,
  });

  return {
    category: resolvedCategory,
    response: {
      title: conversational.title || generated.title,
      summary: conversational.summary || generated.summary,
      conversationalReply: conversational.conversationalReply,
      steps: stepsToUse,
      frameworkSteps: frameworkStepsToUse,
      shloka: ragResult.isShlokaRelevant ? ragResult.shloka : null,
      isShlokaRelevant: ragResult.isShlokaRelevant,
      whyThisRelates: ragResult.isShlokaRelevant
        ? conversational.whyThisRelates || (ragResult.shloka ? ragResult.shloka.meaning : undefined)
        : undefined,
      detectedEmotion: ragResult.detectedEmotion,
      reflectionPrompt: conversational.reflectionPrompt,
      situationVisual,
      meta: {
        category: resolvedCategory,
        pattern:
          ragResult.isShlokaRelevant && ragResult.shloka
            ? `${ragResult.shloka.id}: ${ragResult.shloka.chapterName}`
            : pattern.name,
        score: topCategory.score,
        matchedKeywords: topCategory.matchedKeywords,
        relevanceScore: ragResult.relevanceScore,
        retrievalEngine: 'Bhagavad Gita Hybrid RAG Retrieval Engine',
        engine: 'KAAL Hybrid RAG & Guidance Engine',
        retrievalMethod: ragResult.retrievalMethod,
        semanticScore: ragResult.semanticScore,
        keywordScore: ragResult.keywordScore,
        contextScore: ragResult.contextScore,
        finalScore: ragResult.finalScore,
        nlpAnalysis: ragResult.nlpUnderstanding,
        candidateRankings: ragResult.candidateRankings,
      },
    },
  };
}

