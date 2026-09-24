import { GoogleGenAI } from '@google/genai';
import { GitaShloka } from '../types/guidance.ts';

interface ConversationalSynthesisInput {
  question: string;
  detectedEmotion: string;
  shloka: GitaShloka | null;
  isShlokaRelevant: boolean;
}

interface ConversationalSynthesisOutput {
  conversationalReply: string;
  title: string;
  summary: string;
  reflectionPrompt: string;
  steps: string[];
}

/**
 * High-EQ Fallback Synthesizer
 * Generates natural, human-like, non-template prose even when no LLM API key is present.
 */
export function synthesizeEmpatheticFallback(
  input: ConversationalSynthesisInput
): ConversationalSynthesisOutput {
  const { question, detectedEmotion, shloka, isShlokaRelevant } = input;

  // 1. Casual / Non-dilemma queries (NO shloka forced)
  if (!isShlokaRelevant || !shloka) {
    const qLower = question.toLowerCase().trim();
    if (qLower.includes('hello') || qLower.includes('hi') || qLower.includes('hey')) {
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

    return {
      title: 'A Moment for Self-Inquiry',
      summary:
        'Clarity begins when you step back from the noise and listen to your own centered awareness.',
      conversationalReply:
        `I hear what you are asking. Sometimes the clearest insights do not come from rushing toward an immediate answer, but from pausing to notice what you are truly feeling beneath the question. You do not have to carry everything all at once. What feels like the most essential thing for your peace of mind today?`,
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
        title: 'Release the Burden of Outcomes & Return to the Present Effort',
        summary:
          'Overwhelm happens when the mind tries to carry every future consequence at once. True peace comes from pouring your energy into the immediate action before you.',
        conversationalReply:
          `I can truly feel the weight of what you are describing. When life piles on multiple expectations all at once, our mind naturally tries to fast-forward into the future—worrying whether everything will work out, whether our effort will be enough, or what others might think. That mental time-travel is what creates that suffocating feeling of drowning.\n\n` +
          `In Chapter 2 of the Bhagavad Gita (Verse 47), Krishna speaks directly to this human vulnerability: "You have a right to your action, but never to the fruits of action."\n\n` +
          `This isn’t cold detachment—it is the greatest psychological relief imaginable. It means you are only ever responsible for the single honest step you take right now. The results, the timeline, and the external reactions belong to the world. Put down the heavy burden of guaranteeing the future, and just focus on the next twenty minutes. You are doing much better than your tired mind is telling you.`,
        reflectionPrompt:
          'What is one outcome you have been stressing over that you cannot 100% guarantee today? Can you gently give yourself permission to let it unfold?',
        steps: [
          'Write down the 3 biggest things creating anxiety, and circle only what you can physically do in the next hour.',
          'Consciously release the rest by reminding yourself: "My responsibility is the effort, not the universe’s timeline."',
          'Set a 20-minute timer and focus exclusively on the single next micro-task in front of you.',
        ],
      };

    case 'BG2.48': // Samatvam (Equanimity & Balance)
      return {
        title: 'Anchor Yourself in Inner Equanimity (Samatvam)',
        summary:
          'When external circumstances swing like a pendulum, your anchor must remain within. Equanimity is treating both setbacks and victories as stepping stones.',
        conversationalReply:
          `It sounds like you are going through a phase where things feel unpredictable and emotionally volatile. When external situations swing between praise and criticism, or success and setbacks, it is exhausting if our self-worth swings with them.\n\n` +
          `In Gita 2.48, Krishna introduces one of the most beautiful definitions of Yoga: "Samatvam Yoga Uchyate"—Equanimity is Yoga. He asks us to remain poised, neither intoxicated by quick wins nor crushed by temporary delays.\n\n` +
          `Notice how steady you can be beneath the surface ripples of your life. Setbacks do not mean you have failed; they are simply feedback. Breathe into your center today.`,
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
          `In Gita 2.14, Krishna reminds us of a fundamental truth of existence: pleasure and pain, warmth and cold, come and go like the changing seasons. They are impermanent, and we are asked to endure them with patient endurance (Titiksha).\n\n` +
          `You do not have to force yourself to be cheerful today. It is okay to be hurting, and it is okay to rest. Give yourself the kindness you would give to a dear friend in tears. This storm will pass, and quiet clarity will return.`,
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
          `In Gita 3.8, Krishna cuts straight to the core: "Perform your prescribed duty, for action is always superior to inaction."\n\n` +
          `The secret is that motivation does not strike while you are sitting still thinking about the task. Motivation is a byproduct of movement. Lower your standards for starting. Do not try to write the entire paper, clean the entire room, or finish the entire project. Just do the first two minutes. Once you move your hands, the paralysis dissolves.`,
        reflectionPrompt:
          'What is a 2-minute starting action you can take right now that requires almost zero willpower?',
        steps: [
          'Shrink the intimidating task down to a ridiculous 2-minute micro-action.',
          'Remove your phone or close extra browser tabs to eliminate easy escape routes.',
          'Count backward 3-2-1 and initiate the micro-action without waiting to "feel like it."',
        ],
      };

    case 'BG3.35': // Svadharma & Purpose
      return {
        title: 'Honor Your Svadharma: Stop Living Someone Else’s Story',
        summary:
          'True fulfillment is found in doing your own natural work sincerely, rather than chasing societal applause on an borrowed path.',
        conversationalReply:
          `What you are sharing touches on one of the deepest existential questions we face. It is completely exhausting to work hard day after day when your heart cannot find genuine meaning in the labor.\n\n` +
          `In Gita 3.35, Krishna offers timeless counsel: "Better is one’s own duty, though imperfectly done, than another’s path mastered with perfection."\n\n` +
          `So much of modern unhappiness comes from living other people’s scripts—measuring our success by social status, salaries, or external approval. Your purpose (Svadharma) is not an elusive trophy hidden in the distant future; it begins where your natural strengths, honest curiosity, and sincere service intersect. Let go of comparing your timeline to others.`,
        reflectionPrompt:
          'If you did not care what anyone else thought of your life, what kind of work or service would you gravitate toward?',
        steps: [
          'Write down 3 moments from your past where you felt genuine, quiet pride in your effort.',
          'Notice which daily activities energize your spirit versus which ones drain you to please others.',
          'Carve out 30 minutes this week to explore a personal interest without any need for monetization.',
        ],
      };

    case 'BG6.5': // Mind as Friend or Foe
      return {
        title: 'Transform Your Mind into Your Deepest Ally',
        summary:
          'You are the custodian of your inner dialogue. Stop treating yourself with harsh self-judgment, and train your mind with patient friendship.',
        conversationalReply:
          `Notice how harshly you might be speaking to yourself right now. When things go wrong, our internal voice often turns into our cruelest prosecutor.\n\n` +
          `In Gita 6.5, Krishna teaches: "Elevate yourself by your own mind, and do not degrade yourself. For the mind alone is your greatest friend, and the mind alone can be your worst enemy."\n\n` +
          `You cannot build a peaceful, resilient life on a foundation of self-hatred. If you spoke to a friend the way your inner voice speaks to you during setbacks, they would have walked away long ago. Today, choose to be the steady, compassionate ally you have been searching for on the outside.`,
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
          `Arjuna had the exact same complaint 5,000 years ago—he told Krishna that controlling the mind felt as impossible as catching the raging wind! Krishna did not scold him. In Gita 6.35, he acknowledged: "Undoubtedly, the mind is restless and stubborn, but it can be mastered through gentle practice (Abhyasa) and detachment from distractions (Vairagya)."\n\n` +
          `Meditation is not about forcing all thoughts to halt. Every time you notice your mind has wandered and you bring it back to your breath without frustration, that is the meditation. Be patient with your mind like a mother with a curious toddler.`,
        reflectionPrompt:
          'Can you sit for just 5 minutes today and simply observe your breath without expecting perfection?',
        steps: [
          'Sit in a quiet space and close your eyes for just 5 minutes.',
          'When thoughts inevitably arise, silently label them "thinking" and gently return focus to the inhale and exhale.',
          'End the session with gratitude for having shown up, rather than judging its quality.',
        ],
      };

    default:
      return {
        title: `${shloka.coreWisdom}`,
        summary: shloka.meaning,
        conversationalReply:
          `I hear the sincerity in your inquiry. In life, we often encounter situations where our usual habits of thinking cannot resolve our inner turmoil.\n\n` +
          `In Chapter ${shloka.chapter} of the Bhagavad Gita (Verse ${shloka.verse}), we find guidance that speaks to this exact moment: "${shloka.translation}"\n\n` +
          `When you look at your situation through this lens, what changes? Often, the solution is not to fight harder against external reality, but to cultivate a deeper inner stillness that can see clearly through the storm. Take this moment to center yourself.`,
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
Your tone is like a wise, loving elder mentor or compassionate friend (reminiscent of Lord Krishna guiding Arjuna through confusion and sorrow).

CRITICAL GUIDELINES:
1. Speak naturally like an empathetic human—DO NOT sound like a robotic template, bullet-list machine, or preachy lecturer.
2. Acknowledge and validate the user's emotional state with warmth and active listening.
3. ${
  input.isShlokaRelevant && input.shloka
    ? `A relevant Bhagavad Gita shloka has been retrieved by RAG:
   - Reference: Chapter ${input.shloka.chapter}, Verse ${input.shloka.verse} (${input.shloka.chapterName})
   - Sanskrit: ${input.shloka.sanskrit}
   - Translation: "${input.shloka.translation}"
   - Core Wisdom: ${input.shloka.coreWisdom}
   Weave the wisdom of this shloka into your conversational reply NATURALLY. Explain how it directly relieves their current struggle without sounding archaic or forceful.`
    : `NO shloka is relevant for this query. DO NOT force any Gita verse or Sanskrit quotes. Respond with genuine human empathy, calm perspective, and active listening.`
}
4. Conclude your response with:
   - A short, thought-provoking reflective question.
   - 3 actionable, low-friction next steps for today.

Return your response in strict valid JSON format:
{
  "title": "A short, inspiring title (max 8 words)",
  "summary": "A 1-2 sentence core insight",
  "conversationalReply": "Your full, warm, human conversational dialogue (2-3 paragraphs)",
  "reflectionPrompt": "A single contemplative question",
  "steps": ["Step 1", "Step 2", "Step 3"]
}`;

    const prompt = `User's Question: "${input.question}"
Detected Emotion: ${input.detectedEmotion}
Is Shloka Relevant: ${input.isShlokaRelevant ? 'YES' : 'NO'}`;

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
