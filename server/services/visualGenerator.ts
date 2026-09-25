import {
  GuidanceCategory,
  GitaShloka,
  SituationVisual,
} from '../types/guidance.ts';

interface VisualGeneratorParams {
  question: string;
  category: GuidanceCategory;
  detectedEmotion?: string;
  shloka?: GitaShloka | null;
  isShlokaRelevant: boolean;
  seedOverride?: number;
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
  const { question, category, detectedEmotion, shloka, isShlokaRelevant, seedOverride } = params;
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

  // Case 1: Life path confusion / Decision dilemma (e.g. BG 3.35, Svadharma)
  if (
    category === 'Clarity' ||
    qLower.includes('path') ||
    qLower.includes('direction') ||
    qLower.includes('confus') ||
    qLower.includes('decision')
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
  // Case 2: Purpose / Meaning / Working hard without purpose (e.g. Svadharma)
  else if (
    category === 'Purpose' ||
    qLower.includes('purpose') ||
    qLower.includes('meaning') ||
    qLower.includes('working hard') ||
    qLower.includes('career')
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
  // Case 3: Stress / Overwhelm / Results anxiety (e.g. BG 2.47, Karmanye Vadhikaraste)
  else if (
    category === 'Stress' ||
    qLower.includes('overwhelm') ||
    qLower.includes('stress') ||
    qLower.includes('anxiety') ||
    qLower.includes('anxious') ||
    qLower.includes('pressure')
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
  // Case 4: Grief / Death / Bereavement (e.g. BG 2.20, Na Jayate Mriyate Va)
  else if (
    qLower.includes('death') ||
    qLower.includes('grief') ||
    qLower.includes('lost someone') ||
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
  // Case 5: Relationships / Conflict / Anger (e.g. BG 12.13, Adveshta Sarva-bhutanam)
  else if (
    category === 'Relationships' ||
    qLower.includes('relationship') ||
    qLower.includes('conflict') ||
    qLower.includes('argument') ||
    qLower.includes('anger') ||
    qLower.includes('fight')
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
