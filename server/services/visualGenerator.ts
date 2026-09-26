import {
  GuidanceCategory,
  GitaShloka,
  SituationVisual,
} from '../types/guidance.ts';
import {
  isTechnicalTroubleshootingQuery,
  isCodingTechnicalQuery,
  isFactualTriviaQuery,
} from './ragEngine.ts';

export interface VisualDecisionInput {
  question: string;
  category: GuidanceCategory;
  detectedEmotion?: string;
  intent?: string;
  topics?: string[];
  needs?: string[];
  isShlokaRelevant: boolean;
}

export interface VisualDecisionResult {
  show: boolean;
  reason: string;
  confidence?: number;
}

export interface VisualGeneratorParams {
  question: string;
  category: GuidanceCategory;
  detectedEmotion?: string;
  intent?: string;
  topics?: string[];
  needs?: string[];
  shloka?: GitaShloka | null;
  isShlokaRelevant: boolean;
  seedOverride?: number;
}

/**
 * Deterministically decides whether the user's situation genuinely benefits from
 * a metaphorical, contemplative visual scene.
 *
 * Visuals are intentionally reserved for situations that benefit from metaphorical
 * visual grounding (crossroads, stillness, bridges, sacred rivers, quiet anchors).
 * Simple factual, technical, coding, or casual queries return show: false.
 */
export function shouldShowSituationVisual(input: VisualDecisionInput): VisualDecisionResult {
  const { question, category, intent, topics = [], needs = [] } = input;
  const qLower = question.toLowerCase().trim();

  // ---------------------------------------------------------
  // 1. REJECTION GATES (Negative Filters - Highest Priority)
  // Technical hardware/network troubleshooting, coding, trivia, and greetings NEVER get visuals.
  // ---------------------------------------------------------

  // A. Technical troubleshooting / IT / hardware / network / software failures
  if (
    intent === 'technical_troubleshooting' ||
    isTechnicalTroubleshootingQuery(question)
  ) {
    return {
      show: false,
      reason: 'Technical hardware, IT, software, or network troubleshooting does not benefit from a metaphorical visual',
      confidence: 1.0,
    };
  }

  // B. Programming, coding syntax, algorithms
  if (
    intent === 'coding_technical' ||
    isCodingTechnicalQuery(question)
  ) {
    return {
      show: false,
      reason: 'Coding and technical programming questions do not benefit from a contemplative visual',
      confidence: 1.0,
    };
  }

  // C. Factual trivia, encyclopedic or definition queries
  if (
    intent === 'factual_inquiry' ||
    isFactualTriviaQuery(question)
  ) {
    return {
      show: false,
      reason: 'Factual or trivia queries do not benefit from a contemplative visual',
      confidence: 1.0,
    };
  }

  // D. Casual greetings and shallow chit-chat
  const isGreeting =
    intent === 'casual_greeting' ||
    /^(hi|hello|hey|greetings|namaste|good morning|good evening|good afternoon|howdy|what's up|sup)(\s*[!.,?]*$|\s+there|\s+kaal|\s+ai)/i.test(qLower) ||
    ['hi', 'hello', 'hey', 'greetings', 'namaste', 'good morning', 'good evening', 'how are you', 'how are you?'].includes(qLower);
  if (isGreeting) {
    return {
      show: false,
      reason: 'Casual greetings and chit-chat do not require a situational visual',
      confidence: 1.0,
    };
  }

  // E. Mundane domestic chores and basic physical how-to
  const choreKeywords = [
    'how to boil', 'boil an egg', 'how to clean', 'roommate dirty dishes', 'dishwasher',
    'laundry', 'clean the floor', 'fix a leaky faucet',
  ];
  if (choreKeywords.some((term) => qLower.includes(term))) {
    return {
      show: false,
      reason: 'Mundane domestic tasks and chores do not benefit from a contemplative visual',
      confidence: 0.9,
    };
  }

  // ---------------------------------------------------------
  // 2. ACCEPTANCE GATES (Meaningful Life Situations)
  // ---------------------------------------------------------

  // A. Career uncertainty / Life direction / Decision dilemma / Crossroads
  const isCareerLifeDirection =
    intent === 'life_direction' ||
    intent === 'career_choice' ||
    intent === 'decision_making' ||
    category === 'Clarity' ||
    topics.some((t) => ['career', 'life_direction', 'decision', 'crossroads', 'external_expectations'].includes(t)) ||
    qLower.includes('career') ||
    qLower.includes('which path') ||
    qLower.includes('career path') ||
    qLower.includes('parents want me to') ||
    qLower.includes('parents expect') ||
    qLower.includes('pursue design') ||
    qLower.includes('what to do with my life') ||
    (qLower.includes('confus') && (qLower.includes('path') || qLower.includes('choose') || qLower.includes('decision') || qLower.includes('future')));
  if (isCareerLifeDirection) {
    return {
      show: true,
      reason: 'Career and life-direction dilemmas benefit from contemplative path and clarity visualization',
      confidence: 0.95,
    };
  }

  // B. Comparison, self-worth, external expectations, feeling not enough
  const isComparisonSelfWorth =
    topics.some((t) => ['comparison', 'self_worth', 'external_expectations', 'boundaries'].includes(t)) ||
    needs.some((n) => ['self_worth', 'internal_validation', 'healthy_boundaries'].includes(n)) ||
    qLower.includes('comparing me') ||
    qLower.includes('compare me') ||
    qLower.includes('never enough') ||
    qLower.includes('not enough') ||
    qLower.includes('cousins') ||
    qLower.includes('measure up') ||
    qLower.includes('feel inadequate') ||
    qLower.includes('self-worth') ||
    qLower.includes('insecurity');
  if (isComparisonSelfWorth) {
    return {
      show: true,
      reason: 'Comparison and self-worth challenges benefit from grounding inner-perspective visualization',
      confidence: 0.95,
    };
  }

  // C. Relationship conflict / Interpersonal friction / Arguments / Reconciliation
  const isRelationshipConflict =
    intent === 'relationship_conflict' ||
    category === 'Relationships' ||
    topics.some((t) => ['relationship_conflict', 'communication', 'reconciliation', 'empathy'].includes(t)) ||
    qLower.includes('argument') ||
    qLower.includes('fight') ||
    qLower.includes('partner') ||
    qLower.includes('spouse') ||
    qLower.includes('husband') ||
    qLower.includes('wife') ||
    qLower.includes('relationship');
  if (isRelationshipConflict) {
    return {
      show: true,
      reason: 'Relationship and interpersonal conflict benefits from compassionate connection and bridge visualization',
      confidence: 0.92,
    };
  }

  // D. Overwhelm, burnout, chronic stress, racing mind, results anxiety
  const isOverwhelmStress =
    intent === 'overwhelm_burnout' ||
    intent === 'anxiety_results' ||
    category === 'Stress' ||
    topics.some((t) => ['overwhelm', 'burnout', 'stress', 'results_anxiety', 'calm_mind'].includes(t)) ||
    qLower.includes('overwhelm') ||
    qLower.includes('burnout') ||
    qLower.includes('deadlines') ||
    qLower.includes('switch my mind off') ||
    qLower.includes("can't switch my mind off") ||
    qLower.includes('cant switch my mind off') ||
    qLower.includes('anxiety') ||
    qLower.includes('mind keeps overthinking') ||
    qLower.includes('anxious') ||
    qLower.includes('pressure');
  if (isOverwhelmStress) {
    return {
      show: true,
      reason: 'Overwhelm and acute stress benefit from calming stillness and tranquil water visualization',
      confidence: 0.92,
    };
  }

  // E. Grief, bereavement, loss of a loved one, mourning
  const isGriefLoss =
    intent === 'grief_loss' ||
    topics.some((t) => ['grief', 'loss', 'impermanence', 'death'].includes(t)) ||
    qLower.includes('passed away') ||
    qLower.includes('lost someone') ||
    qLower.includes('grief') ||
    qLower.includes('mourning') ||
    qLower.includes('death');
  if (isGriefLoss) {
    return {
      show: true,
      reason: 'Grief and loss dilemmas benefit from respectful, subdued transcendental river visualization',
      confidence: 0.96,
    };
  }

  // F. Discipline, procrastination, steady momentum
  const isDiscipline =
    category === 'Discipline' ||
    intent === 'procrastination_action' ||
    topics.some((t) => ['procrastination', 'discipline', 'habits'].includes(t)) ||
    qLower.includes('procrastin') ||
    qLower.includes('discipline') ||
    qLower.includes('routine') ||
    qLower.includes('lazy');
  if (isDiscipline) {
    return {
      show: true,
      reason: 'Procrastination and habit formation benefit from steady upward momentum visualization',
      confidence: 0.9,
    };
  }

  // G. Meditation, mindfulness, stillness
  const isMeditation =
    category === 'Meditation' ||
    topics.some((t) => ['meditation', 'mindfulness', 'stillness'].includes(t)) ||
    qLower.includes('meditat') ||
    qLower.includes('stillness') ||
    qLower.includes('mindfulness');
  if (isMeditation) {
    return {
      show: true,
      reason: 'Meditation and mindfulness practices benefit from balanced zen stone stillness visualization',
      confidence: 0.9,
    };
  }

  // H. Purpose, meaning, existential inquiry
  const isPurpose =
    category === 'Purpose' ||
    intent === 'purpose_meaning' ||
    topics.some((t) => ['purpose', 'meaning', 'svadharma'].includes(t)) ||
    qLower.includes('purpose') ||
    qLower.includes('meaning') ||
    qLower.includes('working hard but');
  if (isPurpose) {
    return {
      show: true,
      reason: 'Purpose and existential dilemmas benefit from expansive mountain horizon visualization',
      confidence: 0.9,
    };
  }

  // ---------------------------------------------------------
  // 3. Fallback: Default to NO visual if no reflective dilemma
  // ---------------------------------------------------------
  return {
    show: false,
    reason: 'Query does not present a reflective dilemma that benefits from metaphorical visual reinforcement',
    confidence: 0.8,
  };
}

// Simple deterministic string hash to generate consistent procedural variations
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates a bespoke situational visual specification tailored to the user's
 * exact emotional dilemma, question, and philosophical guidance.
 */
export function generateSituationVisual(params: VisualGeneratorParams): SituationVisual {
  const { question, category, detectedEmotion, intent, topics = [], needs = [], shloka, isShlokaRelevant, seedOverride } = params;
  const qLower = question.toLowerCase();
  const seed = seedOverride ?? hashString(question);

  // Determine theme based on question context, emotion, and shloka
  let theme = 'golden-dawn';
  let title = 'Dawn of Inner Reflection';
  let mood = 'Contemplative Stillness';
  let prompt = '';
  let altText = '';

  let palette = {
    skyTop: '#1e293b',
    skyBottom: '#fdba74',
    mountainFar: '#334155',
    mountainNear: '#1e293b',
    ground: '#0f172a',
    accentGlow: 'rgba(251, 191, 36, 0.4)',
    sunGlow: '#fbbf24',
    waterReflection: undefined as string | undefined,
  };

  const elements = {
    sunPosition: 'center' as 'center' | 'left' | 'right' | 'rising' | 'dusk',
    hasSunRays: true,
    hasMountains: true,
    hasWater: false,
    hasPath: false,
    hasMist: true,
    hasStars: false,
    hasLanterns: false,
    hasLotus: false,
    hasStones: false,
  };

  // Case 1: Grief / Death / Bereavement (e.g. BG 2.20, Na Jayate Mriyate Va)
  if (
    intent === 'grief_loss' ||
    topics.includes('grief') ||
    qLower.includes('death') ||
    qLower.includes('grief') ||
    qLower.includes('lost someone') ||
    qLower.includes('passed away') ||
    qLower.includes('mourning') ||
    (shloka && shloka.id === 'BG2.20')
  ) {
    theme = 'sacred-river';
    title = 'The Eternal River of Life';
    mood = 'Transcendental Peace';
    prompt =
      'A timeless sacred river flowing serenely toward an eternal golden dawn, glowing lotus petals drifting on clear water, enduring peace beyond form, transcendental light.';
    altText =
      'An eternal river softly illuminated by dawn light with floating lotus blossoms, honoring impermanence and the immortal nature of consciousness.';
    palette = {
      skyTop: '#2d1b4e',
      skyBottom: '#fbcfe8',
      mountainFar: '#4a2872',
      mountainNear: '#1e0c38',
      ground: '#100524',
      accentGlow: 'rgba(244, 114, 182, 0.35)',
      sunGlow: '#f472b6',
      waterReflection: 'rgba(251, 207, 232, 0.3)',
    };
    elements.sunPosition = 'rising';
    elements.hasWater = true;
    elements.hasLotus = true;
    elements.hasSunRays = true;
  }
  // Case 2: Comparison / Self-Doubt / External Expectations (e.g. parents comparing to cousins)
  else if (
    topics.includes('comparison') ||
    topics.includes('self_worth') ||
    needs.includes('self_worth') ||
    needs.includes('internal_validation') ||
    qLower.includes('comparing me') ||
    qLower.includes('compare me') ||
    qLower.includes('never enough') ||
    qLower.includes('not enough') ||
    qLower.includes('cousin') ||
    qLower.includes('measure up') ||
    qLower.includes('inadequate') ||
    qLower.includes('self-worth')
  ) {
    theme = 'quiet-anchor';
    title = 'Anchoring in Your Own Worth';
    mood = 'Self-Trust & Perspective';
    prompt =
      'A solitary quiet mountain peak rising gracefully above a soft morning sea of clouds, bathed in warm gentle sunlight, steady grounded presence, release of external comparison, peaceful inner dignity.';
    altText =
      'A solitary mountain peak rising steadily above gentle morning clouds in warm dawn light, reflecting self-trust, emotional boundaries, and grounding in your own innate worth.';
    palette = {
      skyTop: '#1e2038',
      skyBottom: '#fed7aa',
      mountainFar: '#393c68',
      mountainNear: '#212340',
      ground: '#121324',
      accentGlow: 'rgba(251, 191, 36, 0.45)',
      sunGlow: '#fbbf24',
      waterReflection: undefined,
    };
    elements.sunPosition = 'rising';
    elements.hasMountains = true;
    elements.hasSunRays = true;
    elements.hasMist = true;
  }
  // Case 3: Life path confusion / Decision dilemma / Career uncertainty (e.g. BG 3.35, Svadharma)
  else if (
    intent === 'life_direction' ||
    intent === 'career_choice' ||
    intent === 'decision_making' ||
    category === 'Clarity' ||
    topics.includes('career') ||
    topics.includes('life_direction') ||
    qLower.includes('path') ||
    qLower.includes('direction') ||
    qLower.includes('confus') ||
    qLower.includes('decision') ||
    qLower.includes('career') ||
    (shloka && shloka.id === 'BG3.35')
  ) {
    theme = 'crossroad-dawn';
    title = 'Illuminating Your Own Path';
    mood = 'Clarity & Self-Discovery';
    prompt =
      'A serene dawn crossroad in an ancient mist-covered valley, a solitary seeker illuminated by soft golden sunlight breaking through clouds, meditative aesthetic, warm sage and amber colors, spiritual clarity.';
    altText =
      'A winding morning path through quiet mist with gentle sunbeams breaking through, symbolizing clarity and choosing one’s own path.';
    palette = {
      skyTop: '#1e2a38',
      skyBottom: '#fed7aa',
      mountainFar: '#385068',
      mountainNear: '#1c2d3d',
      ground: '#131e29',
      accentGlow: 'rgba(253, 186, 116, 0.45)',
      sunGlow: '#f59e0b',
      waterReflection: undefined,
    };
    elements.sunPosition = 'rising';
    elements.hasPath = true;
    elements.hasSunRays = true;
    elements.hasMist = true;
  }
  // Case 4: Relationships / Interpersonal Conflict / Arguments (e.g. BG 12.13, BG 12.15)
  else if (
    intent === 'relationship_conflict' ||
    topics.includes('relationship_conflict') ||
    category === 'Relationships' ||
    qLower.includes('relationship') ||
    qLower.includes('conflict') ||
    qLower.includes('argument') ||
    qLower.includes('anger') ||
    qLower.includes('fight') ||
    qLower.includes('partner') ||
    qLower.includes('spouse') ||
    (shloka && (shloka.id === 'BG12.13' || shloka.id === 'BG12.15'))
  ) {
    theme = 'lantern-bridge';
    title = 'Warmth Across the Water';
    mood = 'Compassion & Reconciliation';
    prompt =
      'Two warm glowing paper lanterns on a quiet wooden bridge over still lotus waters at twilight, tranquil reflections, harmony, gentle soft lighting, peaceful reconciliation.';
    altText =
      'Two lanterns glowing on a quiet bridge over still twilight water, symbolizing bridge-building, compassion, and emotional harmony.';
    palette = {
      skyTop: '#1e1b4b',
      skyBottom: '#fed7aa',
      mountainFar: '#312e81',
      mountainNear: '#1e1b4b',
      ground: '#0f0e26',
      accentGlow: 'rgba(251, 146, 60, 0.5)',
      sunGlow: '#ea580c',
      waterReflection: 'rgba(253, 186, 116, 0.35)',
    };
    elements.sunPosition = 'dusk';
    elements.hasWater = true;
    elements.hasLanterns = true;
    elements.hasStars = true;
  }
  // Case 5: Stress / Overwhelm / Results anxiety (e.g. BG 2.47, Karmanye Vadhikaraste)
  else if (
    intent === 'overwhelm_burnout' ||
    intent === 'anxiety_results' ||
    topics.includes('overwhelm') ||
    category === 'Stress' ||
    qLower.includes('overwhelm') ||
    qLower.includes('stress') ||
    qLower.includes('anxiety') ||
    qLower.includes('anxious') ||
    qLower.includes('pressure') ||
    qLower.includes('burnout') ||
    (shloka && shloka.id === 'BG2.47')
  ) {
    theme = 'still-lake';
    title = 'Stillness of the Mountain Waters';
    mood = 'Deep Calming Equilibrium';
    prompt =
      'A tranquil mirror-still mountain lake at dusk, deep emerald pine reflections, gentle ripples fading into quiet stillness, peaceful twilight sky, deep soothing tranquility.';
    altText =
      'A serene mountain lake at dusk with mirror-like water and calm reflections, inviting you to release future outcomes and rest in the present.';
    palette = {
      skyTop: '#0f2922',
      skyBottom: '#99f6e4',
      mountainFar: '#134e4a',
      mountainNear: '#042f2e',
      ground: '#021c1b',
      accentGlow: 'rgba(45, 212, 191, 0.35)',
      sunGlow: '#5eead4',
      waterReflection: 'rgba(94, 234, 212, 0.25)',
    };
    elements.sunPosition = 'dusk';
    elements.hasWater = true;
    elements.hasSunRays = false;
    elements.hasMist = true;
  }
  // Case 6: Purpose / Meaning / Svadharma
  else if (
    category === 'Purpose' ||
    intent === 'purpose_meaning' ||
    topics.includes('purpose') ||
    qLower.includes('purpose') ||
    qLower.includes('meaning') ||
    qLower.includes('working hard')
  ) {
    theme = 'mountain-horizon';
    title = 'Vast Horizons of Purpose';
    mood = 'Quiet Devotion & Meaning';
    prompt =
      'Vast open golden horizon viewed from an alpine mountain ridge at sunrise, endless serene valleys beneath clearing clouds, purposeful journey, warm terracotta and glowing gold atmosphere.';
    altText =
      'A panoramic mountain summit opening to a golden horizon at dawn, reflecting deep inner purpose and unhurried progress.';
    palette = {
      skyTop: '#2b1b3d',
      skyBottom: '#fed7aa',
      mountainFar: '#4c2e58',
      mountainNear: '#23142e',
      ground: '#130a1c',
      accentGlow: 'rgba(251, 146, 60, 0.4)',
      sunGlow: '#f97316',
      waterReflection: undefined,
    };
    elements.sunPosition = 'center';
    elements.hasMountains = true;
    elements.hasSunRays = true;
  }
  // Case 6: Discipline / Procrastination (e.g. BG 3.8, Niyatam Kuru Karma Tvam)
  else if (
    category === 'Discipline' ||
    qLower.includes('procrastin') ||
    qLower.includes('discipline') ||
    qLower.includes('habit') ||
    qLower.includes('lazy')
  ) {
    theme = 'forest-steps';
    title = 'The First Steady Step';
    mood = 'Quiet Resolve & Momentum';
    prompt =
      'Ancient mossy stone stairs rising steadily through a misty cedar forest, the first step bathed in crisp morning sunlight, focused determination, stillness.';
    altText =
      'Ancient stone steps leading upward through a serene forest bathed in morning sunbeams, symbolizing starting small and moving steadily forward.';
    palette = {
      skyTop: '#1c2826',
      skyBottom: '#d1fae5',
      mountainFar: '#2d4739',
      mountainNear: '#16281e',
      ground: '#0b1710',
      accentGlow: 'rgba(52, 211, 153, 0.4)',
      sunGlow: '#10b981',
      waterReflection: undefined,
    };
    elements.sunPosition = 'left';
    elements.hasPath = true;
    elements.hasSunRays = true;
    elements.hasMist = true;
  }
  // Case 7: Meditation / Stillness
  else if (
    category === 'Meditation' ||
    qLower.includes('meditat') ||
    qLower.includes('stillness') ||
    qLower.includes('silence') ||
    qLower.includes('calm mind')
  ) {
    theme = 'zen-stones';
    title = 'Equilibrium of Still Waters';
    mood = 'Present Moment Awareness';
    prompt =
      'Balanced river stones resting on glass-like water reflecting a soft crescent moon and morning star, pure equilibrium and quietude, meditative minimalism.';
    altText =
      'Balanced stones on peaceful glass-like water under a crescent moon, reflecting deep mental stillness and meditation.';
    palette = {
      skyTop: '#0f172a',
      skyBottom: '#a5f3fc',
      mountainFar: '#1e293b',
      mountainNear: '#0f172a',
      ground: '#020617',
      accentGlow: 'rgba(103, 232, 249, 0.4)',
      sunGlow: '#38bdf8',
      waterReflection: 'rgba(165, 243, 252, 0.3)',
    };
    elements.sunPosition = 'right';
    elements.hasWater = true;
    elements.hasStones = true;
    elements.hasStars = true;
  }
  // Case 8: General Reflection / Default
  else {
    theme = 'golden-dawn';
    title = 'Morning Light of Awareness';
    mood = 'Gentle Contemplation';
    prompt =
      'Soft gentle morning light spreading across an open tranquil landscape, rolling green hills under a vast open sky, timeless contemplation, serene peace.';
    altText =
      'Gentle sunrise over peaceful rolling hills, creating an open space for mindful reflection and emotional renewal.';
    palette = {
      skyTop: '#1e293b',
      skyBottom: '#fed7aa',
      mountainFar: '#334155',
      mountainNear: '#1e293b',
      ground: '#0f172a',
      accentGlow: 'rgba(251, 191, 36, 0.4)',
      sunGlow: '#fbbf24',
      waterReflection: undefined,
    };
    elements.sunPosition = 'rising';
    elements.hasSunRays = true;
    elements.hasMist = true;
  }

  return {
    id: `vis-${seed % 100000}`,
    theme,
    title,
    mood,
    prompt,
    seed,
    palette,
    elements,
    altText,
  };
}
