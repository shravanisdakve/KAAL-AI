import { StructuredGuidanceResponse, GuidanceSession } from '../types/guidance.ts';

/**
 * Normalizes input text for safety classification.
 * Strips punctuation, normalizes curly apostrophes, collapses whitespace, lowers case.
 */
export function normalizeSafetyQuery(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * HIGH-RISK SAFETY SIGNAL DETECTION
 *
 * Deterministically screens user queries for indications of acute self-harm,
 * suicidal ideation, or existential despair requiring immediate crisis intervention.
 * 
 * Executes BEFORE Gita RAG, conversational emotion routing, and visual generator.
 */
export function detectHighRiskSafetySignal(text: string): { isHighRisk: boolean; reason?: string } {
  if (!text || typeof text !== 'string') {
    return { isHighRisk: false };
  }

  const rawLower = text.toLowerCase();
  const normalized = normalizeSafetyQuery(text);

  // 1. Explicit self-harm & suicide actions (Zero-tolerance)
  const explicitSuicidePatterns = [
    /\b(kill\s+myself|killing\s+myself|gonna\s+kill\s+myself|going\s+to\s+kill\s+myself)\b/,
    /\b(commit\s+suicide|committing\s+suicide|attempt\s+suicide)\b/,
    /\b(suicidal|suicide)\b/,
    /\b(end\s+my\s+life|ending\s+my\s+life|want\s+to\s+end\s+my\s+life)\b/,
    /\b(take\s+my\s+own\s+life|taking\s+my\s+own\s+life)\b/,
    /\b(end\s+it\s+all|ending\s+it\s+all|want\s+to\s+end\s+it\s+all)\b/,
  ];

  for (const pattern of explicitSuicidePatterns) {
    if (pattern.test(normalized)) {
      return { isHighRisk: true, reason: 'Explicit suicide or self-harm ideation' };
    }
  }

  // 2. "Better off without me" & burden-to-others ideation
  // Must refer to the speaker ("without me", "if I died", "if I were dead"), NOT external objects (e.g. "without this app")
  const betterOffPatterns = [
    /\b(better\s+off\s+without\s+me|better\s+without\s+me)\b/,
    /\bbetter\s+off\s+if\s+i\s+(were|was|wasn't|wasnt|weren't|werent|died|was\s+gone|were\s+gone)\b/,
    /\bbetter\s+off\s+if\s+i\s+(wasn't|wasnt|weren't|werent)\s+here\b/,
    /\b(everyone|they|family|world|people)\s+would\s+be\s+better\s+off\s+without\s+me\b/,
    /\b(everyone|they|family|world|people)\s+is\s+better\s+off\s+without\s+me\b/,
    /\b(everyone|they|family|world|people)\s+are\s+better\s+off\s+without\s+me\b/,
  ];

  for (const pattern of betterOffPatterns) {
    if (pattern.test(normalized)) {
      return { isHighRisk: true, reason: 'Burden/perceived-burdensomeness ideation (better off without me)' };
    }
  }

  // 3. Wish to die or not wake up
  const wishToDiePatterns = [
    /\bi\s+(want|wanna|wish)\s+to\s+die\b/,
    /\bi\s+wish\s+i\s+(were|was|could|would)\s+(die|dead)\b/,
    /\bi\s+(wish|hope)\s+i\s+(don't|dont|never|do\s+not)\s+wake\s+up\b/,
    /\b(wish\s+i\s+didn't\s+wake\s+up|wish\s+i\s+did\s+not\s+wake\s+up)\b/,
    /\b(wish\s+i\s+had\s+never\s+been\s+born|wish\s+i\s+(was|were)\s+never\s+born)\b/,
    /\bi('d|\s+would)\s+rather\s+be\s+dead\b/,
  ];

  for (const pattern of wishToDiePatterns) {
    if (pattern.test(normalized)) {
      return { isHighRisk: true, reason: 'Expressed wish to die or not awaken' };
    }
  }

  // 4. "Don't want to be here anymore" & existential despair of living
  // Ensure we don't trigger on situational locations like "at this party", "in this meeting", "at work"
  const isSituationalLocation =
    normalized.includes('at this party') ||
    normalized.includes('at the party') ||
    normalized.includes('in this meeting') ||
    normalized.includes('at this job') ||
    normalized.includes('at work') ||
    normalized.includes('in this office') ||
    normalized.includes('in this room');

  if (!isSituationalLocation) {
    const notBeingHerePatterns = [
      /\b(don't|dont|do\s+not)\s+want\s+to\s+be\s+here\s+anymore\b/,
      /\b(don't|dont|do\s+not)\s+wanna\s+be\s+here\s+anymore\b/,
      /\bno\s+longer\s+want\s+to\s+be\s+here\b/,
      /\b(don't|dont|do\s+not)\s+want\s+to\s+(live|exist)\s+(anymore|any\s+more)\b/,
      /\b(don't|dont|do\s+not)\s+wanna\s+(live|exist)\s+(anymore|any\s+more)\b/,
      /\bno\s+point\s+(in|of)\s+living\b/,
      /\bno\s+reason\s+to\s+(keep\s+)?live\b/,
      /\bnothing\s+to\s+live\s+for\b/,
      /\b(life\s+is\s+not|life\s+isn't|not)\s+worth\s+living\b/,
      /\bwhy\s+should\s+i\s+live\b/,
      /\b(tired|sick|done)\s+of\s+living\b/,
      /\bdone\s+with\s+(this\s+)?life\b/,
    ];

    for (const pattern of notBeingHerePatterns) {
      if (pattern.test(normalized)) {
        return { isHighRisk: true, reason: 'Expressed despair with living/existing' };
      }
    }
  }

  // 5. "Want to disappear forever" & "Can't go on"
  // Guard against "disappear for the weekend", "disappear for a few days", "disappear on vacation"
  const isTemporaryDisappearance =
    normalized.includes('for the weekend') ||
    normalized.includes('for a weekend') ||
    normalized.includes('for vacation') ||
    normalized.includes('on vacation') ||
    normalized.includes('for a few days') ||
    normalized.includes('for a couple of days') ||
    normalized.includes('for a while');

  if (!isTemporaryDisappearance) {
    if (
      normalized.includes('disappear forever') ||
      normalized.includes('want to disappear forever') ||
      normalized.includes('wanna disappear forever') ||
      normalized.includes('wish i could disappear forever')
    ) {
      return { isHighRisk: true, reason: 'Wish to disappear permanently/forever' };
    }
  }

  // "Can't go on" / "Cannot go on"
  // Guard against "can't go on without coffee", "can't go on vacation", "can't go on stage", "can't go on a trip"
  const isGoOnNonCrisis =
    normalized.includes('without coffee') ||
    normalized.includes('go on vacation') ||
    normalized.includes('go on a trip') ||
    normalized.includes('go on stage') ||
    normalized.includes('go on sale') ||
    normalized.includes('go on strike') ||
    normalized.includes('go on a diet');

  if (!isGoOnNonCrisis) {
    const cantGoOnPatterns = [
      /\bi\s+(can't|cannot)\s+go\s+on\s+anymore\b/,
      /\bi\s+(can't|cannot)\s+go\s+on\s+living\b/,
      /\bi\s+(can't|cannot)\s+take\s+this\s+life\s+anymore\b/,
      /\bi\s+(can't|cannot)\s+go\s+on\s+like\s+this\b/,
      /\bi\s+just\s+(can't|cannot)\s+go\s+on\b/,
      /\bi\s+(can't|cannot)\s+go\s+on\b/,
    ];

    for (const pattern of cantGoOnPatterns) {
      if (pattern.test(normalized)) {
        return { isHighRisk: true, reason: 'Expressed inability to continue living (cannot go on)' };
      }
    }
  }

  return { isHighRisk: false };
}

/**
 * Checks if current turn is a follow-up to an existing safety session
 * (e.g. user reassuring safety: "No, I don't think I would actually do anything").
 */
export function isSafetyFollowUp(
  question: string,
  existingSession?: GuidanceSession
): boolean {
  if (!existingSession) return false;

  const prevResponse = existingSession.response;
  const isPrevSafety =
    prevResponse.safetyFlag === true ||
    prevResponse.meta?.safetyFlag === true ||
    (existingSession.messages &&
      existingSession.messages.some(
        (m) => m.response.safetyFlag === true || m.response.meta?.safetyFlag === true
      ));

  if (!isPrevSafety) return false;

  // If previous turn was a safety intervention, check if this follow-up is an acknowledgment/reassurance
  const normalized = normalizeSafetyQuery(question);

  const isReassuranceOrContinuation =
    normalized.includes("wouldn't actually do anything") ||
    normalized.includes('would not actually do anything') ||
    normalized.includes('not going to do anything') ||
    normalized.includes("won't do anything") ||
    normalized.includes('wont do anything') ||
    normalized.includes('safe right now') ||
    normalized.includes('am safe') ||
    normalized.includes('im safe') ||
    normalized.includes('i am safe') ||
    normalized.includes('not in danger') ||
    normalized.includes('not going to hurt myself') ||
    normalized.includes("won't hurt myself") ||
    normalized.includes('wont hurt myself') ||
    normalized.includes('do not have a plan') ||
    normalized.includes("don't have a plan") ||
    normalized.includes('dont have a plan') ||
    normalized.includes('no plan') ||
    normalized.includes('just needed to say it') ||
    normalized.includes('just overwhelmed') ||
    normalized.includes('just tired') ||
    normalized.startsWith('no ') ||
    normalized === 'no' ||
    normalized.startsWith('yes ') ||
    normalized === 'yes' ||
    normalized.includes('thank you') ||
    normalized.includes('thanks');

  // Any non-technical follow-up to a safety session continues the supportive safety context
  const isTechnical =
    normalized.includes('laptop') ||
    normalized.includes('wifi') ||
    normalized.includes('router') ||
    normalized.includes('code') ||
    normalized.includes('function') ||
    normalized.includes('recipe');

  return isReassuranceOrContinuation || !isTechnical;
}

/**
 * PRIMARY HIGH-RISK SAFETY RESPONSE BUILDER
 *
 * Generates immediate crisis-support response:
 * - Acknowledges the pain directly and compassionately
 * - Direct safety check: "Are you in immediate danger or thinking about acting on these thoughts right now?"
 * - Recommends crisis lifelines (988 US/Canada, 14416 India, 111/999 UK, emergency departments)
 * - Encourages reaching out to a trusted person and not being alone
 * - NO Gita verse (isShlokaRelevant: false, shloka: null)
 * - NO decorative situational visual (situationVisual: null)
 * - Sets safetyFlag: true, safetyLevel: 'high'
 */
export function generateHighRiskSafetyResponse(question: string): StructuredGuidanceResponse {
  return {
    title: 'Immediate Support and Safety Resources',
    summary:
      'Your life and safety matter deeply. You do not have to carry this intense pain alone—please connect with emergency support or someone you trust right now.',
    conversationalReply:
      'I hear how deeply overwhelmed and exhausted you are feeling right now, and I want to acknowledge what you just shared with complete care and seriousness. Wondering if others would be better off without you or feeling completely worthless is a clear signal that the pain you are carrying has become too heavy to hold by yourself. You do not have to walk through this alone, and you do not deserve to suffer in silence.\n\n' +
      'Are you in immediate danger or thinking about acting on these thoughts right now? If you are having active thoughts of harming yourself, please reach out for immediate support. You can call or text the Suicide & Crisis Lifeline at 988 (free and confidential, 24/7 in the US and Canada), contact Tele-MANAS at 14416 or Kiran at 1800-599-0019 (in India), call 111 or 999 (in the UK), or contact your local emergency services (like 911 or 112) or go to the nearest emergency department.\n\n' +
      'Please do not stay alone with this weight tonight. Reach out to a family member, close friend, counselor, or healthcare professional right now and tell them what you are experiencing. Even if your mind tells you that no one cares, that is the pain speaking—there are people and crisis counselors who are ready to listen, keep you safe, and support you through this without judgment.',
    steps: [
      'Safety Check: If you feel at risk of harming yourself right now, call or text 988 (US/Canada), 14416 (India), or your local emergency number (911/112/999) immediately.',
      'Break the Isolation: Call or text a trusted friend, family member, or mentor right now and tell them honestly that you are going through a crisis and need support.',
      'Change Your Immediate Environment: Move to a shared or public space, step away from anything harmful, and stay around other people while this acute wave passes.',
    ],
    frameworkSteps: [
      {
        id: 1,
        title: 'Emergency Safety & Crisis Support',
        status: 'Active Focus',
        description:
          'If you are in immediate danger or having thoughts of suicide, connect with emergency or crisis services immediately. Help is free, confidential, and available 24/7.',
        checklist: [
          'Call or text 988 (US/Canada), 14416 / 1800-599-0019 (India), or local emergency services (911/112/999)',
          'Go to the nearest hospital emergency room if you cannot keep yourself safe right now',
        ],
      },
      {
        id: 2,
        title: 'Connect With a Trusted Human',
        status: 'Pending',
        description:
          'Do not face this acute emotional pain in isolation. Reach out directly to someone you trust.',
        checklist: [
          'Text or call one trusted friend, family member, or counselor right now',
          'Tell them: "I\'m having a really difficult time right now and need someone to talk to or be with me"',
        ],
      },
      {
        id: 3,
        title: 'Secure Your Immediate Space',
        status: 'Pending',
        description:
          'Ensure your immediate physical environment is safe and that you are not isolated.',
        checklist: [
          'Step away from isolation into a common living area, family space, or open environment',
          'Give yourself permission to pause all work, obligations, and pressures for today',
        ],
      },
    ],
    shloka: null,
    isShlokaRelevant: false,
    whyThisRelates: undefined,
    detectedEmotion: 'immediate support',
    reflectionPrompt:
      'Are you in a safe place right now, and can you reach out to one person who can be with you?',
    situationVisual: null,
    safetyFlag: true,
    safetyLevel: 'high',
    meta: {
      category: 'Relationships',
      pattern: 'Crisis Support & Safety Protocol',
      score: 10,
      matchedKeywords: ['crisis_safety'],
      safetyFlag: true,
      safetyLevel: 'high',
      retrievalEngine: 'KAAL Crisis Safety Protocol',
      engine: 'KAAL Safety Engine',
      finalScore: 0,
      relevanceScore: 0,
    },
  };
}

/**
 * CRISIS FOLLOW-UP RESPONSE BUILDER
 *
 * For users continuing a safety conversation (e.g. acknowledging they are physically safe):
 * - Validates relief that user is safe while honoring the reality of their pain
 * - Avoids minimizing the emotional burden
 * - Recommends professional care and gentle pacing
 * - NO Gita verse, NO decorative visual
 * - Preserves safetyFlag: true, safetyLevel: 'moderate'
 */
export function generateSafetyFollowUpResponse(question: string): StructuredGuidanceResponse {
  return {
    title: 'Supporting You Through This Heavy Moment',
    summary:
      'I am glad you are safe and that you shared that with me. Even without an immediate plan to act, feeling this much pain deserves compassionate care, gentle boundaries, and human support.',
    conversationalReply:
      'Thank you for letting me know that you are safe and do not plan to act on those thoughts. That is very reassuring to hear. At the same time, I want to honor the fact that having those thoughts in the first place means you are dealing with an enormous amount of emotional strain and pain.\n\n' +
      'Even when there is no immediate intent to harm yourself, feeling that the world would be better off without you is an exhausting burden to carry alone. You do not have to minimize what you are feeling just because you are safe from immediate action. The pain you are experiencing is real, and it deserves genuine compassion and support.\n\n' +
      'Please consider speaking with a doctor, therapist, or a trusted loved one about the thoughts you have been having. Having a safe, confidential space to unpack this weight can make a profound difference. For today, treat yourself with extra gentleness: reduce any immediate demands on yourself, stay connected to people who make you feel secure, and remember that crisis support lines (like 988 or 14416) are always available whenever the feelings become too intense.',
    steps: [
      'Speak with a Professional: Schedule a conversation with a doctor, counselor, or mental health professional to talk about the thoughts you have been having.',
      'Set Down Immediate Demands: Give yourself permission to pause non-essential obligations today and focus purely on emotional rest.',
      'Keep Crisis Resources Handy: Save your local crisis helpline (such as 988 or 14416) in your phone so you have immediate support if the heavy feelings return.',
    ],
    frameworkSteps: [
      {
        id: 1,
        title: 'Acknowledge Pain Without Minimizing It',
        status: 'Active Focus',
        description:
          'Accept that feeling overwhelmed or having thoughts of disappearing is a sign of deep distress that deserves care, even when you are physically safe.',
        checklist: [
          'Allow yourself to feel exhausted without judging yourself for it',
          'Remind yourself that thoughts of being a burden are symptoms of pain, not objective truth',
        ],
      },
      {
        id: 2,
        title: 'Schedule Mental Health Support',
        status: 'Pending',
        description:
          'Plan to discuss these feelings with a licensed therapist, counselor, or doctor.',
        checklist: [
          'Look into scheduling a session with a counselor or mental health professional',
          'Let a trusted loved one know that you have been carrying a heavy emotional load',
        ],
      },
      {
        id: 3,
        title: 'Protect Your Peace Today',
        status: 'Pending',
        description:
          'Focus on low-pressure, calming activities and keep emergency contacts accessible.',
        checklist: [
          'Postpone high-stress tasks or difficult conversations until you feel more grounded',
          'Save crisis contacts in your phone for peace of mind',
        ],
      },
    ],
    shloka: null,
    isShlokaRelevant: false,
    whyThisRelates: undefined,
    detectedEmotion: 'emotional care & safety',
    reflectionPrompt:
      'What is one gentle, grounding thing you can do for yourself in this moment to rest and feel supported?',
    situationVisual: null,
    safetyFlag: true,
    safetyLevel: 'moderate',
    meta: {
      category: 'Relationships',
      pattern: 'Crisis Follow-Up & Emotional Support',
      score: 8,
      matchedKeywords: ['safety_followup'],
      safetyFlag: true,
      safetyLevel: 'moderate',
      retrievalEngine: 'KAAL Crisis Safety Protocol',
      engine: 'KAAL Safety Engine',
      finalScore: 0,
      relevanceScore: 0,
    },
  };
}
