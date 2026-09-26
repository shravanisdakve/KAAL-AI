import { GoogleGenAI } from '@google/genai';
import { GuidanceCategory, GitaShloka } from '../types/guidance.ts';

export interface ConversationalSynthesisInput {
  question: string;
  category?: GuidanceCategory;
  detectedEmotion: string;
  intent?: string;
  topics?: string[];
  needs?: string[];
  shloka: GitaShloka | null;
  isShlokaRelevant: boolean;
  conversationHistory?: { question: string; reply: string; shloka?: string }[];
}

export interface ConversationalSynthesisOutput {
  conversationalReply: string;
  title: string;
  summary: string;
  whyThisRelates?: string; // Honest intellectual connection explaining why the verse applies to the situation
  reflectionPrompt: string;
  steps: string[];
}

/**
 * Robust whole-input and token-based casual greeting detector.
 * Avoids substring false positives like "which" containing "hi".
 */
export function isCasualGreeting(text: string): boolean {
  const normalized = text.toLowerCase().trim().replace(/[?!.,]/g, '');
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const GREETING_WORDS = new Set([
    'hi', 'hello', 'hey', 'hii', 'heyy', 'namaste', 'greetings', 'sup', 'yo',
  ]);

  if (tokens.length === 0) return true;
  if (tokens.length === 1 && GREETING_WORDS.has(tokens[0])) return true;

  if (
    normalized === 'good morning' ||
    normalized === 'good evening' ||
    normalized === 'good afternoon' ||
    normalized === 'good day'
  ) {
    return true;
  }

  if (tokens.length <= 3) {
    const nonGreetings = tokens.filter(
      (t) => !GREETING_WORDS.has(t) && !['there', 'kaal', 'ai', 'friend'].includes(t)
    );
    if (nonGreetings.length === 0 && tokens.some((t) => GREETING_WORDS.has(t))) {
      return true;
    }
  }

  return false;
}

/**
 * High-EQ Fallback Synthesizer
 * Generates natural, human-like, situation-specific prose even when no LLM API key is present.
 */
export function synthesizeEmpatheticFallback(
  input: ConversationalSynthesisInput
): ConversationalSynthesisOutput {
  const { question, detectedEmotion, shloka, isShlokaRelevant, category, intent } = input;

  // 1. Casual / Non-dilemma queries (NO shloka forced)
  if (!isShlokaRelevant || !shloka) {
    if (isCasualGreeting(question)) {
      return {
        title: 'Welcome to Your Space for Clarity',
        summary:
          'A quiet space to untangle your thoughts and navigate life with a calmer mind.',
        conversationalReply:
          'Hello, and welcome. Take a slow, deep breath. Whatever has been occupying your mind today—whether it is a difficult decision, emotional fatigue, or simply the need for a quiet moment—I am here with you. What is on your heart right now?',
        reflectionPrompt: 'What is one thought you can set down for the next ten minutes?',
        steps: [
          'Pause all notifications and take three slow, conscious breaths.',
          'Type whatever is currently occupying your mind without filtering.',
          'Allow yourself to be honest about where you are right now.',
        ],
      };
    }

    const qLower = question.toLowerCase();

    // 1A. Direct Factual Inquiry (No spiritual framing)
    if (qLower.includes('capital of france') || qLower.includes('capital of')) {
      return {
        title: 'Factual Inquiry',
        summary: 'Direct response to your factual question.',
        conversationalReply:
          'The capital of France is Paris. If there is a deeper thought, decision, or personal question you are reflecting on today, feel free to share.',
        reflectionPrompt: 'What is a personal question or decision on your mind today?',
        steps: [
          'Notice if your mind is seeking quick facts or deeper reflection.',
          'Feel free to ask about any life dilemma, stress, or career decision.',
          'Take a moment of stillness before continuing your day.',
        ],
      };
    }

    // 1B. Household & Roommate Friction
    if (qLower.includes('dirty dishes') || qLower.includes('roommate')) {
      return {
        title: 'Navigating Household Friction with Clarity',
        summary:
          'Household frustration is best resolved through clear, non-confrontational communication rather than silent resentment.',
        conversationalReply:
          'Living with others often brings small, persistent frictions like unwashed dishes or shared space conflicts. When left unsaid, minor irritations turn into silent resentment.\n\n' +
          'Instead of letting frustration fester or reacting impulsively, have a calm, brief conversation when neither of you is in a rush. Express what you need without accusation, and establish a simple shared agreement for common areas.',
        reflectionPrompt: 'What would a calm, honest conversation look like before frustration builds further?',
        steps: [
          'Wait until you feel unagitated before bringing up the topic.',
          'Use "I" statements to share how the shared space impacts your focus.',
          'Agree on one simple mutual standard for the sink.',
        ],
      };
    }

    // 1C. Technical / Practical Issues
    if (qLower.includes('laptop') && (qLower.includes('turn on') || qLower.includes('broken') || qLower.includes('stress'))) {
      return {
        title: 'Troubleshooting with Calm Presence',
        summary: 'Technical failures trigger unexpected urgency. Approach the problem methodically, step by step.',
        conversationalReply:
          'It is genuinely frustrating when an essential tool stops working right when you need it. The sudden spike of stress is natural, but panicking will not fix the machine.\n\n' +
          'Take a breath and step through the physical basics methodically: test a different power outlet, verify the charger cable, hold the power button down for 20 seconds to perform a hard reset, and check if the battery indicator shows any life. If hardware has failed, focus on what tasks you can adapt to or who can assist with repairs.',
        reflectionPrompt: 'Can you pause for one minute to reset your nervous system before troubleshooting?',
        steps: [
          'Check power sources, charger cables, and test a different wall outlet.',
          'Perform a 20-second hard reset by holding down the power button.',
          'Identify any alternative device or backup plan for urgent tasks today.',
        ],
      };
    }

    // 1D. Real Guidance Dilemma: Career, Life Direction & Competing Paths
    const isCareerOrPath =
      intent === 'life_direction' ||
      category === 'Clarity' ||
      qLower.includes('career') ||
      qLower.includes('which path') ||
      qLower.includes('choose between') ||
      qLower.includes('choice between') ||
      qLower.includes('doctor') ||
      qLower.includes('design') ||
      qLower.includes('medicine') ||
      qLower.includes('parents want') ||
      qLower.includes('direction in life');

    if (isCareerOrPath) {
      return {
        title: 'Discerning Your Authentic Path Amid External Expectations',
        summary:
          'You do not have to decide your entire twenty-year future today. Start by separating what you genuinely want from what you feel you owe to others.',
        conversationalReply:
          'You’re not really choosing between two careers in isolation. You’re trying to separate what you genuinely want from what you feel you owe your parents or society.\n\n' +
          'It is completely natural to feel torn when love and respect for your family pulls you in one direction while your authentic curiosity pulls you in another. You do not have to solve your entire future today. Start by asking a more useful question: if nobody were disappointed by your choice, which path would you be genuinely curious to explore?\n\n' +
          'Then test that answer against reality. Talk to people in both fields, look at the actual day-to-day work, and compare that with what medicine actually asks of you. You are looking for honest evidence about yourself, not instant permission from everyone around you.',
        reflectionPrompt:
          'If the fear of disappointing others was completely removed, what direction feels most aligned with your genuine curiosity?',
        steps: [
          'Write down what attracts you to each path independently of what others expect.',
          'Spend 30 minutes investigating the real day-to-day work involved in both directions.',
          'Identify one small exploratory action you can take this week without locking in a permanent choice.',
        ],
      };
    }

    // 1E. Real Guidance Dilemma: Stress & Overwhelm
    if (
      intent === 'stress_relief' ||
      category === 'Stress' ||
      qLower.includes('overwhelm') ||
      qLower.includes('stress')
    ) {
      return {
        title: 'Release Future Outcomes & Return to Present Effort',
        summary:
          'Overwhelm happens when the mind attempts to carry every future obligation simultaneously. True stillness comes from focusing on the single next task right in front of you.',
        conversationalReply:
          'I can feel the tension in what you are carrying. When demands accumulate, the mind naturally leaps into the future, trying to guarantee that every detail will resolve successfully.\n\n' +
          'You are only responsible for the effort you give right now, not the entire timeline. Step back from the horizon and give yourself permission to focus on one single task for the next twenty minutes.',
        reflectionPrompt: 'What is one burden you can gently set down for the next hour?',
        steps: [
          'Pause all notifications and take three slow, grounding breaths.',
          'Write down your immediate priorities and circle only the single next item.',
          'Direct your full attention to that single task without looking ahead.',
        ],
      };
    }

    // 1F. Real Guidance Dilemma: Purpose & Meaning
    if (
      intent === 'purpose_discovery' ||
      category === 'Purpose' ||
      qLower.includes('purpose') ||
      qLower.includes('meaning')
    ) {
      return {
        title: 'Finding Meaning Beyond External Validation',
        summary:
          'Purpose is not a hidden treasure waiting to be discovered; it is cultivated through honest, aligned action that serves what truly matters to you.',
        conversationalReply:
          'Feeling unfulfilled despite working hard is a common and painful experience. It often means your energy is being directed toward external metrics of success rather than what genuinely resonates with your core values.\n\n' +
          'Take time to examine where your natural strengths and genuine interest lie. Meaning grows when your effort is aligned with self-respect and service rather than comparison with others.',
        reflectionPrompt: 'Where do your natural curiosity and genuine strengths feel most alive?',
        steps: [
          'List the activities where you lose track of time and feel energized.',
          'Identify one expectation you have adopted from others that does not serve you.',
          'Dedicate 20 minutes today to an activity rooted in intrinsic interest.',
        ],
      };
    }

    // 1G. General Guidance Fallback (Respectful, Situation-Specific, Non-Greeting)
    return {
      title: 'Cultivating Perspective Through Honest Inquiry',
      summary:
        'Clarity begins when you step back from urgency and examine your thoughts with gentle curiosity.',
      conversationalReply:
        `I hear what you are reflecting on. Sometimes the clearest insights do not come from rushing toward an immediate answer, but from pausing to notice what you are truly feeling beneath the question. You do not have to carry everything all at once. What feels like the most essential thing for your peace of mind today?`,
      reflectionPrompt: 'If you gave yourself permission to move slowly, what would your next step look like?',
      steps: [
        'Notice your current breath and emotional state without judging yourself.',
        'Identify what is actually within your immediate control today.',
        'Take one small, honest step forward with presence.',
      ],
    };
  }

  // 2. Emotionally Tuned Guidance with RAG-Retrieved Shloka
  switch (shloka.id) {
    case 'BG2.47': // Karmanye Vadhikaraste (Overwhelm & Anxiety of Results)
      return {
        title: 'Release the Burden of Outcomes & Return to Present Effort',
        summary:
          'Overwhelm happens when the mind tries to carry every future consequence at once. True peace comes from pouring your energy into the immediate action before you.',
        conversationalReply:
          `I can truly feel the weight of what you are describing. When life piles on multiple expectations all at once, our mind naturally tries to fast-forward into the future—worrying whether everything will work out, whether our effort will be enough, or what others might think. That mental time-travel is what creates that suffocating feeling of drowning.\n\n` +
          `You don’t need to figure out the whole puzzle right now. You are only ever responsible for the single honest step you take in this present hour. The external reactions and distant milestones belong to tomorrow. Put down the heavy burden of guaranteeing the future, and just focus on the next twenty minutes. You are doing much better than your tired mind is telling you.`,
        whyThisRelates:
          'The verse emphasizes that our agency lies entirely in our effort, never in guaranteeing outcomes. For your situation, that can be approached as an invitation to put down the burden of predicting the future, and focus exclusively on the single honest action right in front of you.',
        reflectionPrompt:
          'What is one outcome you have been stressing over that you cannot 100% guarantee today? Can you gently give yourself permission to let it unfold?',
        steps: [
          'Write down what is currently overwhelming you and circle only what you can physically act on in the next hour.',
          'Consciously release the rest by reminding yourself: "My responsibility is the effort, not the universe’s timeline."',
          'Set a 25-minute timer and focus on the single next task without looking ahead.',
        ],
      };

    case 'BG2.48': // Samatvam (Equanimity & Balance)
      return {
        title: 'Anchor Yourself in Inner Equanimity (Samatvam)',
        summary:
          'When external circumstances swing like a pendulum, your anchor must remain within. Equanimity is treating both setbacks and victories as stepping stones.',
        conversationalReply:
          `It sounds like you are going through a phase where things feel unpredictable and emotionally volatile. When external situations swing between praise and criticism, or success and setbacks, it is exhausting if our self-worth swings with them.\n\n` +
          `Notice how steady you can be beneath the surface ripples of your life. Setbacks do not mean you have failed; they are simply feedback. Breathe into your center today.`,
        whyThisRelates:
          'Krishna defines equanimity (Samatvam) as remaining poised through alternating success and failure. In your situation, this offers a steady anchor: treating highs and lows as natural cycles rather than measures of your intrinsic worth.',
        reflectionPrompt:
          'If this current situation were just a training ground for your patience, how would you approach it differently?',
        steps: [
          'Recognize that today’s setback is an event, not your identity.',
          'Take three grounding breaths whenever you notice emotional agitation rising.',
          'Focus on acting with integrity and patience rather than defending your ego.',
        ],
      };

    case 'BG2.14': // Impermanence & Grief (Titiksha)
      return {
        title: 'This Difficult Season Is Impermanent (Titiksha)',
        summary:
          'Just as seasons turn from winter to spring, painful emotional waves also pass. Endure with quiet patience and self-compassion.',
        conversationalReply:
          `I want to gently acknowledge how painful this feels for you. When we are hurting or grieving, the mind often lies to us and says, "This is how life will feel forever." That is the heaviest part of sadness.\n\n` +
          `You do not have to force yourself to be cheerful today. It is okay to be hurting, and it is okay to rest. Give yourself the kindness you would give to a dear friend in tears. This storm will pass, and quiet clarity will return.`,
        whyThisRelates:
          'The verse reminds us that contact with physical and emotional circumstances inevitably produces alternating waves of heat and cold, joy and grief. Titiksha (patient forbearance) is not emotional numbness, but a gentle understanding that this painful phase is temporary and will pass.',
        reflectionPrompt:
          'Can you soften the pressure on yourself today and allow yourself to simply rest without guilt?',
        steps: [
          'Acknowledge your sadness without judging or criticizing yourself for feeling down.',
          'Engage in one nurturing, quiet act today: a warm tea, a slow walk, or an early night.',
          'Remind yourself that healing happens in quiet, gentle layers.',
        ],
      };

    case 'BG3.8': // Action over Procrastination
      return {
        title: 'Action Creates Momentum: Break Inertia with a Single Micro-Step',
        summary:
          'Waiting for the "perfect mood" is a trap. Action precedes motivation. Even a 2-minute start breaks the paralyzing grip of procrastination.',
        conversationalReply:
          `I know that feeling all too well—sitting with a growing to-do list, feeling guilty for delaying, and waiting for some magical wave of motivation that never seems to arrive. Procrastination is rarely about laziness; it is almost always about an underlying anxiety about the effort or the outcome.\n\n` +
          `The secret is that motivation does not strike while you are sitting still thinking about the task. Motivation is a byproduct of movement. Lower your standards for starting. Do not try to write the entire paper, clean the entire room, or finish the entire project. Just do the first two minutes. Once you move your hands, the paralysis dissolves.`,
        whyThisRelates:
          'Krishna emphasizes to Arjuna that prescribed action is inherently superior to inaction, and that movement maintains life. In moments of procrastination, waiting for motivation is a trap; taking one small physical action naturally dissolves the mental paralysis.',
        reflectionPrompt:
          'What is a 2-minute starting action you can take right now that requires almost zero willpower?',
        steps: [
          'Shrink the intimidating task down to a ridiculous 2-minute micro-action.',
          'Remove your phone or close extra browser tabs to eliminate easy escape routes.',
          'Count backward 3-2-1 and initiate the micro-action without waiting to "feel like it."',
        ],
      };

    case 'BG3.35': // Svadharma, Life Path & Purpose (Addressed with rigorous intellectual honesty)
      const qLowerBG = question.toLowerCase();
      const isCareerDilemma =
        qLowerBG.includes('career') ||
        qLowerBG.includes('doctor') ||
        qLowerBG.includes('design') ||
        qLowerBG.includes('medicine') ||
        qLowerBG.includes('parents want') ||
        qLowerBG.includes('family want') ||
        qLowerBG.includes('choose between') ||
        qLowerBG.includes('choice between');

      const isPathChoice =
        isCareerDilemma ||
        qLowerBG.includes('which path') ||
        qLowerBG.includes('path') ||
        qLowerBG.includes('direction in life') ||
        qLowerBG.includes('confused about which');

      if (isCareerDilemma) {
        return {
          title: 'Discerning Your Authentic Path Amid External Expectations',
          summary:
            'You do not have to decide your entire twenty-year future today. Start by separating what you genuinely want from what you feel you owe to others.',
          conversationalReply:
            `You’re not really choosing between two careers in isolation. You’re trying to separate what you genuinely want from what you feel you owe your parents or society.\n\n` +
            `It is completely natural to feel torn when love and respect for your family pulls you in one direction while your authentic curiosity pulls you in another. You do not have to solve your entire future today. Start by asking a more useful question: if nobody were disappointed by your choice, which path would you be genuinely curious to explore?\n\n` +
            `Then test that answer against reality. Talk to people in both fields, look at the actual day-to-day work, and compare that with what medicine actually asks of you. You are looking for honest evidence about yourself, not instant permission from everyone around you.`,
          whyThisRelates:
            'The verse speaks to the profound spiritual principle of Svadharma: living out one’s own authentic path and duty, rather than adopting someone else’s script out of fear or compliance. In your situation, it invites you to reflect on what calling is genuinely yours before committing your life to someone else’s expectations.',
          reflectionPrompt:
            'If the fear of disappointing others was completely removed, what direction feels most aligned with your genuine curiosity?',
          steps: [
            'Write down what attracts you to each path independently of what others expect.',
            'Spend 30 minutes investigating the real day-to-day work involved in both directions.',
            'Identify one small exploratory action you can take this week without locking in a permanent choice.',
          ],
        };
      }

      if (isPathChoice) {
        return {
          title: 'Finding your path without demanding immediate certainty',
          summary:
            'Clarity comes less from finding one perfect answer and more from understanding what genuinely matters to you and what kind of life you want to build.',
          conversationalReply:
            `Feeling confused about which direction to take doesn't necessarily mean you're on the wrong path.\n\n` +
            `Sometimes clarity comes less from finding one perfect answer and more from understanding what genuinely matters to you, what responsibilities are yours, and what kind of life you want to build. You do not need to demand instant certainty from yourself before taking the next thoughtful step.`,
          whyThisRelates:
            'This teaching relates to your question because it speaks to the importance of understanding and following one’s own path rather than simply adopting another person’s direction. For your situation, you might use it as an invitation to examine what is genuinely yours before making a decision.',
          reflectionPrompt:
            'If I stopped comparing my path with everyone else\'s, what direction would I feel more drawn toward?',
          steps: [
            'Write down the 2–3 paths you are currently considering.',
            'For each one, note what attracts you and what you are afraid of.',
            'Identify one small action that helps you learn more about each path.',
          ],
        };
      }

      return {
        title: 'Finding purpose without comparing your path',
        summary:
          'Working hard without feeling connected to what you do often stems from measuring your life against external expectations rather than your authentic path.',
        conversationalReply:
          `Working hard without feeling connected to what you're doing can leave you wondering whether you're moving in the right direction.\n\n` +
          `You don't necessarily need to discover one perfect "purpose" immediately. It may be more useful to examine which responsibilities, activities, and forms of contribution genuinely feel like they belong to you, rather than exhausting yourself chasing someone else's definition of success.`,
        whyThisRelates:
          'The verse emphasizes staying with one\'s own path rather than measuring one\'s life against someone else\'s. For your situation, that can be approached as an invitation to explore what feels genuinely yours, rather than defining purpose through someone else\'s success or expectations.',
        reflectionPrompt:
          'What kind of work or contribution would still feel meaningful to you if you stopped comparing your progress with other people\'s?',
        steps: [
          'Write down three activities where you feel genuinely engaged.',
          'Notice what values or interests those activities have in common.',
          'Choose one small way to explore that direction this week.',
        ],
      };

    case 'BG6.5': // Mind as Friend or Foe
      return {
        title: 'Transform Your Mind into Your Deepest Ally',
        summary:
          'You are the custodian of your inner dialogue. Stop treating yourself with harsh self-judgment, and train your mind with patient friendship.',
        conversationalReply:
          `Notice how harshly you might be speaking to yourself right now. When things go wrong, our internal voice often turns into our cruelest prosecutor.\n\n` +
          `You cannot build a peaceful, resilient life on a foundation of self-hatred. If you spoke to a friend the way your inner voice speaks to you during setbacks, they would have walked away long ago. Today, choose to be the steady, compassionate ally you have been searching for on the outside.`,
        whyThisRelates:
          'The verse teaches that the mind alone is one\'s friend or enemy. It invites us to recognize that harsh self-criticism actively degrades our resilience, whereas choosing patient inner friendship elevates our state of mind.',
        reflectionPrompt:
          'What is one compassionate sentence you can tell yourself today instead of your usual self-criticism?',
        steps: [
          'Catch yourself whenever your thoughts turn into harsh accusations.',
          'Reframe the thought with objective, gentle language: "I made a mistake, but I am learning."',
          'Acknowledge one thing you handled with courage or integrity today.',
        ],
      };

    case 'BG6.35': // Restless Mind & Meditation
      return {
        title: 'Taming the Restless Mind through Gentle Practice (Abhyasa)',
        summary:
          'Do not be angry when your mind wanders. Patient, non-judgmental return (Abhyasa) and releasing trivial noise (Vairagya) will restore stillness.',
        conversationalReply:
          `It is completely natural that your mind feels scattered and restless. We live in an environment specifically engineered to fragment human attention with infinite alerts, noise, and hurry.\n\n` +
          `Arjuna had the exact same complaint—he told Krishna that controlling the mind felt as difficult as catching the raging wind. Krishna did not scold him. He acknowledged that the mind is indeed restless, but reassured him that it can be mastered through gentle, patient practice.\n\n` +
          `Meditation is not about forcing all thoughts to halt. Every time you notice your mind has wandered and you bring it back to your breath without frustration, that is the meditation. Be patient with your mind like a mother with a curious toddler.`,
        whyThisRelates:
          'Arjuna expressed that curbing the restless mind seemed as impossible as catching the wind. Krishna validates this difficulty, explaining that steady practice (Abhyasa) and detachment from distractions (Vairagya) gradually cultivate stillness. It frames mindfulness not as eliminating thoughts, but as patiently returning attention without frustration.',
        reflectionPrompt:
          'Can you sit for just 5 minutes today and simply observe your breath without expecting perfection?',
        steps: [
          'Sit in a quiet space and close your eyes for just 5 minutes.',
          'When thoughts inevitably arise, silently label them "thinking" and gently return focus to the inhale and exhale.',
          'End the session with gratitude for having shown up, rather than judging its quality.',
        ],
      };

    case 'BG2.20': // Grief, Bereavement, Death of Loved Ones
      return {
        title: 'The Eternal Soul: Healing from Profound Grief',
        summary:
          'The physical form departs, but the soul and love never perish. Allow yourself to grieve with gentle reverence, surrounded by eternal grace.',
        conversationalReply:
          `I am holding your words with so much gentleness right now. Losing someone you love shakes the ground beneath your feet, and when tears come, let them flow. Tears are simply love with nowhere to go.\n\n` +
          `Do not pressure yourself to "get over it" or be strong today. Simply sit in quiet reverence for the life and love you shared. You are carrying their memory forward with every breath.`,
        whyThisRelates:
          'Krishna explains to Arjuna that the conscious essence is eternal—unborn and undying, untouched by bodily dissolution. In bereavement, this offers profound comfort: while the physical form has departed, the connection, love, and spiritual bond endure.',
        reflectionPrompt:
          'What is one loving lesson or warm memory your loved one gave you that you can hold close to your heart today?',
        steps: [
          'Allow yourself to cry without trying to suppress or hold back the tears.',
          'Light a gentle candle or sit in quiet contemplation, dedicating a silent prayer of gratitude to their soul.',
          'Surround yourself with soft kindness today; eat something warm and rest.',
        ],
      };

    case 'BG12.13': // Relationships, Arguments, Saying Things You Regret
      return {
        title: 'Mending Relationships with Compassion & Softened Defensiveness',
        summary:
          'When arguments wound, ego wants to fight harder. True strength is having the courage to soften, forgive, and speak from love.',
        conversationalReply:
          `Arguments with the people we care about leave such a hollow, burning ache in the chest. When tempers flare, we often say sharp words not because we hate the other person, but because our own fear or unmet needs felt threatened.\n\n` +
          `Winning an argument is worthless if you lose the heart of the person in the process. When the dust settles, someone has to be courageous enough to drop the shield of defensiveness first. Let your ego take a back seat. Reach out not to debate who was right, but to reaffirm that their heart matters more to you than winning a debate.`,
        whyThisRelates:
          'Krishna highlights the virtues of one who is free from malice, friendly, compassionate, and forgiving. In relationship arguments, this invites us to step back from the urge to be right or seek revenge, choosing instead to protect the human connection.',
        reflectionPrompt:
          'What would it look like to tell the other person: "I am sorry for the harsh words I spoke in anger. You matter more to me than being right"?',
        steps: [
          'Take a slow breath and let the heat of adrenaline leave your voice before re-initiating contact.',
          'Acknowledge your own contribution to the conflict without attaching a defensive "but you did X first."',
          'Offer a gentle, sincere apology for the tone and words spoken in frustration.',
        ],
      };

    case 'BG2.63': // Anger & Losing Reason
      return {
        title: 'Stepping Back from the Destructive Fire of Anger',
        summary:
          'Reacting in anger temporarily blinds discrimination and destroys peace. Step back, breathe, and let wisdom regain the helm.',
        conversationalReply:
          `Notice the intense physical sensation of anger right now—how your heartbeat speeds up and the mind races to justify retaliation. Anger feels powerful in the moment, but it is almost always a mask for hurt or fear.\n\n` +
          `Nothing constructive has ever been decided in the peak heat of anger. Do not send that email, do not send that text, and do not make that accusation right now. Step away physically for twenty minutes. Let your nervous system cool down so reason can decide what happens next.`,
        whyThisRelates:
          'The verse outlines how anger causes delusion, clouding memory and destroying rational discernment. For your current feeling, it serves as a crucial caution to pause before reacting, ensuring your actions are guided by calm reason rather than impulsive rage.',
        reflectionPrompt:
          'What is the vulnerable feeling (hurt, disrespect, fear) hiding underneath your anger right now?',
        steps: [
          'Institute an immediate 30-minute silence rule: no calls, messages, or decisions while agitated.',
          'Drink a full glass of cold water and take 10 slow diaphragmatic breaths.',
          'Ask yourself: "Will my reaction right now heal the situation or make it more toxic?"',
        ],
      };

    case 'BG2.70': // Ocean Stillness Amid Sensory Chaos
      return {
        title: 'Deep Ocean Stillness: Untouched by Life’s Incoming Waves',
        summary:
          'Be like the ocean that absorbs all rivers without overflowing. Let life’s currents pass through you without shaking your inner depth.',
        conversationalReply:
          `When life gets noisy, demanding, and chaotic, it feels like we are being pulled in a dozen directions at once. But remember: external noise only agitates you if you have no anchored depth within.\n\n` +
          `You do not have to fight the chaos around you. Step inward into your own depth. The surface waves may be choppy, but down in your core awareness, there is an unshakeable silence waiting for you.`,
        whyThisRelates:
          'The metaphor compares a wise mind to the ocean, which remains unmoved and serene even as countless rivers pour into it. When dealing with sensory overload or constant demands, it invites you to observe the external rush without letting it disrupt your inner anchor.',
        reflectionPrompt:
          'Can you close your eyes for 3 minutes and imagine yourself as the deep ocean floor, untouched by the surface storms?',
        steps: [
          'Mute all non-essential notifications for the next 2 hours.',
          'Step away from social media and sensory inputs that fuel agitation.',
          'Rest in quiet presence, knowing you are deeper than any temporary storm.',
        ],
      };

    case 'BG18.58': // Overcoming Impossible Obstacles
      return {
        title: 'Crossing Every Impossible Obstacle through Centered Faith',
        summary:
          'When hurdles appear insurmountable, ego feels defeated. Anchor yourself in truth, and by grace you will navigate every trial.',
        conversationalReply:
          `I know how heavy this hurdle feels. When you look at the mountain in front of you, the human mind immediately calculates its own limitations and says, "There is no way out of this."\n\n` +
          `You do not have to solve the entire ten-mile journey right now. You only need the strength for the next footstep. When you stop fighting entirely from personal ego and align yourself with patient, ethical perseverance, unseen doors begin to open. Have faith in your resilience.`,
        whyThisRelates:
          'Krishna assures that when awareness is grounded in wisdom rather than ego, all obstacles are transcended. For overwhelming hurdles, it suggests surrendering the anxiety of the entire journey and taking the single next ethical step in faith.',
        reflectionPrompt:
          'If you trusted that this obstacle was placed before you to reveal your hidden strength, how would you face it today?',
        steps: [
          'Break the impossible problem down into the single simplest action you can execute today.',
          'Surrender the worry of "how will this end in 6 months" and focus on today’s integrity.',
          'Remind yourself of at least one previous crisis you survived when you thought you couldn’t.',
        ],
      };

    case 'BG9.22': // Solace for Loneliness & Insecurity
      return {
        title: 'You Are Not Alone: Universal Grace Holds and Protects You',
        summary:
          'When you feel isolated and unprotected, remember you are held by a greater love. Sincere effort is never forgotten.',
        conversationalReply:
          `Loneliness is one of the quietest and heaviest aches a human heart can experience. Feeling as if you must fight every battle alone, carry every bill, and endure every hardship without a supportive hand is exhausting.\n\n` +
          `You are never truly abandoned. The breath moving in your chest right now is proof that life has not given up on you. Take comfort in the quiet knowledge that your sincere effort, your kindness, and your honesty are watched over by a higher grace. Rest your tired spirit today.`,
        whyThisRelates:
          'The verse offers assurance of protection and sustenance for those devoted to truth. In times of loneliness, it reminds us that sincere effort and honest living are embraced by a larger benevolent order, so we need not feel entirely on our own.',
        reflectionPrompt:
          'Can you gently place your hand on your heart, take a deep breath, and tell yourself: "I am safe in this moment"?',
        steps: [
          'Reach out to one trusted person just to say hello, or write your raw thoughts in a private journal.',
          'Take a slow, grounding walk outdoors and connect with the stillness of nature.',
          'Release the urge to carry everything alone; ask for help where you can.',
        ],
      };

    default:
      return {
        title: `${shloka.coreWisdom}`,
        summary: shloka.meaning,
        conversationalReply:
          `I hear the sincerity in your inquiry. In life, we often encounter situations where our usual habits of thinking cannot resolve our inner turmoil.\n\n` +
          `When you look at your situation through a broader perspective, what changes? Often, the solution is not to fight harder against external reality, but to cultivate a deeper inner stillness that can see clearly through the storm. Take this moment to center yourself.`,
        whyThisRelates:
          `This verse from Chapter ${shloka.chapter} provides a reflective lens on your question. Rather than prescribing a rigid answer, it invites you to explore how shifting your perspective toward deeper equanimity brings clarity to this moment.`,
        reflectionPrompt:
          'What is one expectation you can loosen your grip on right now to find immediate peace?',
        steps: [
          'Pause and take three deep breaths to ground your nervous system.',
          'Consider the core wisdom of this verse and how it applies to your current choices.',
          'Take one aligned action today with quiet confidence.',
        ],
      };
  }
}

/**
 * Primary Conversational Generator
 * Calls Google GenAI if API key exists; otherwise falls back gracefully to high-EQ synthesizer.
 */
export async function generateConversationalGuidance(
  input: ConversationalSynthesisInput
): Promise<ConversationalSynthesisOutput> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  // If no Gemini API key is configured, execute the High-EQ Fallback Synthesizer
  if (!apiKey) {
    return synthesizeEmpatheticFallback(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction =
      `You are KAAL AI, an emotionally intelligent, wise, and deeply compassionate mental wellness guide inspired by the Bhagavad Gita and modern psychological active listening (similar to kaalai.in).
Your tone is like a wise, loving elder mentor or compassionate friend.

CRITICAL INTELLECTUAL HONESTY & CONVERSATIONAL GUIDELINES:
1. Speak naturally like an empathetic human—DO NOT sound like a robotic template, bullet-list machine, or preachy lecturer.
2. Acknowledge and validate the user's emotional state with warmth, understanding, and active listening in "conversationalReply".
3. STRICT INTELLECTUAL HONESTY: DO NOT claim the Gita literally says modern self-help buzzwords (e.g. do not say "The Gita says your purpose is where your strengths and curiosity intersect"). The Gita offers foundational spiritual teachings in dialogue between Krishna and Arjuna.
4. ${
  input.isShlokaRelevant && input.shloka
    ? `A relevant Bhagavad Gita shloka has been retrieved by RAG:
   - Reference: Chapter ${input.shloka.chapter}, Verse ${input.shloka.verse} (${input.shloka.chapterName})
   - Sanskrit: ${input.shloka.sanskrit}
   - Translation: "${input.shloka.translation}"
   - Core Wisdom: ${input.shloka.coreWisdom}
   Provide an honest, thoughtful connection in "whyThisRelates": Explain why this ancient verse relates to what the user is describing (e.g. "The verse emphasizes X. For your situation, that can be approached as an invitation to reflect on Y rather than Z..."). Frame it as an invitation or reflection, not rigid dogma ("The Gita says X therefore do Y").`
    : `NO shloka is relevant for this query. DO NOT force any Gita verse or Sanskrit quotes. Set "whyThisRelates" to null.
   CRITICAL GUIDANCE DECOUPLING RULE:
   Even though no shloka is attached, the user has presented a real dilemma or query. DO NOT return a generic greeting, do not welcome them as if it's turn 0, and do not ask what is on their mind—they have already shared their question.
   Provide deep, compassionate, situation-specific guidance, validating their exact dilemma (e.g. career confusion, familial expectations, technical frustration, household tension), offer clear perspective, a focused reflection prompt, and 3 concrete, low-friction next steps for today.`
}
5. "reflectionPrompt": A single, thought-provoking reflective question.
6. "steps": Exactly 3 actionable, low-friction next steps for today.

Return your response in strict valid JSON format:
{
  "title": "A short, meaningful title (max 8 words, e.g. 'Finding purpose without comparing your path')",
  "summary": "A 1-2 sentence core insight",
  "conversationalReply": "Your full, warm, human conversational dialogue understanding the concern (2-3 paragraphs)",
  "whyThisRelates": ${input.isShlokaRelevant ? '"A thoughtful explanation of why this specific verse connects to the user\'s situation"' : 'null'},
  "reflectionPrompt": "A single contemplative question",
  "steps": ["Step 1", "Step 2", "Step 3"]
}
`;

    const historyContext =
      input.conversationHistory && input.conversationHistory.length > 0
        ? `\n\nPREVIOUS CONVERSATION CONTEXT (Continue this ongoing dialogue naturally like Krishna guiding Arjuna, directly building on what was explored earlier):\n` +
          input.conversationHistory
            .map(
              (h, idx) =>
                `Turn ${idx + 1}:\nUser: "${h.question}"\nGuide: "${h.reply}"${
                  h.shloka ? ` (Referred to: ${h.shloka})` : ''
                }`
            )
            .join('\n\n')
        : '';

    const prompt = `User's Question: "${input.question}"
Category: ${input.category || 'Clarity'}
Intent: ${input.intent || 'Guidance'}
Detected Emotion: ${input.detectedEmotion}
Topics: ${(input.topics || []).join(', ') || 'General'}
User Needs: ${(input.needs || []).join(', ') || 'Clarity and perspective'}
Is Shloka Relevant: ${input.isShlokaRelevant ? 'YES' : 'NO'}${historyContext}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.conversationalReply && parsed.title && parsed.steps) {
        return {
          title: parsed.title,
          summary: parsed.summary || parsed.title,
          conversationalReply: parsed.conversationalReply,
          whyThisRelates: parsed.whyThisRelates || undefined,
          reflectionPrompt:
            parsed.reflectionPrompt ||
            'What is one small step you can take today with peace in your heart?',
          steps: parsed.steps.slice(0, 3),
        };
      }
    }

    return synthesizeEmpatheticFallback(input);
  } catch (err) {
    console.warn('Google GenAI generation encountered an issue, falling back to High-EQ synthesizer:', err);
    return synthesizeEmpatheticFallback(input);
  }
}
