import { GitaShloka } from '../types/guidance.ts';

/**
 * Authentic Bhagavad Gita Knowledge Base for KAAL AI RAG Retrieval Engine
 * Contains curated foundational verses mapped to human emotions, dilemmas, and practical wisdom.
 */
export const BHAGAVAD_GITA_CORPUS: GitaShloka[] = [
  // 1. Action without Anxiety of Results (Overwhelm, Burnout, Paralysis, Stress)
  {
    id: 'BG2.47',
    chapter: 2,
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    transliteration:
      'karmaṇy-evādhikāras te mā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi',
    translation:
      'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to inaction.',
    author: 'Swami Sivananda / Swami Gambhirananda',
    meaning:
      'Anxiety and overwhelm occur when the mind obsesses over outcomes it cannot guarantee. True freedom and peak effectiveness come from investing 100% of your energy into the immediate action before you, releasing anxiety over how it will be judged.',
    coreWisdom: 'Focus entirely on the quality of your effort, and gently surrender anxiety about the outcome.',
    themes: ['action', 'results', 'anxiety', 'overwhelm', 'stress', 'burnout', 'control', 'inaction', 'detachment'],
    emotions: ['overwhelmed', 'anxious', 'paralyzed', 'stressed', 'pressured', 'drowning', 'exhausted'],
    situations: ['competing priorities', 'fear of failing exams', 'career interview anxiety', 'workplace pressure'],
  },

  // 2. Equanimity in Ups and Downs (Emotional Volatility, Stress, Balance)
  {
    id: 'BG2.48',
    chapter: 2,
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    verse: 48,
    sanskrit: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
    transliteration:
      'yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya\nsiddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga uchyate',
    translation:
      'Perform your duty poised in Yoga, O Arjuna, abandoning all attachment to success or failure. Such equanimity of mind is called Yoga.',
    author: 'Swami Sivananda',
    meaning:
      'Equanimity (Samatvam) is the ability to remain internally centered regardless of whether external circumstances are favorable or unfavorable. When you treat success and setback as feedback rather than identity, your mental energy remains stable.',
    coreWisdom: 'True mastery is maintaining an unshakeable inner calm through both triumph and turbulence.',
    themes: ['equanimity', 'samatvam', 'balance', 'success', 'failure', 'calm', 'peace', 'inner stability'],
    emotions: ['anxious', 'restless', 'volatile', 'frustrated', 'stressed', 'insecure'],
    situations: ['dealing with setbacks', 'fear of rejection', 'unpredictable outcomes', 'mood swings'],
  },

  // 3. Impermanence of Pleasure and Pain (Grief, Hard Times, Resilience)
  {
    id: 'BG2.14',
    chapter: 2,
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    verse: 14,
    sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥',
    transliteration:
      'mātrā-sparśhās tu kaunteya śhītoṣhṇa-sukha-duḥkha-dāḥ\nāgamāpāyino ’nityās tans-titikṣhasva bhārata',
    translation:
      'The contact of the senses with their objects gives rise to cold and heat, pleasure and pain. They come and go, and are impermanent. Endure them patiently, O descendant of Bharata.',
    author: 'Swami Sivananda',
    meaning:
      'Emotional and physical discomfort are seasonal. Just as winter yields to spring, every phase of hardship or sadness is fleeting. Cultivating forbearance (Titiksha) allows you to witness pain without letting it define your soul.',
    coreWisdom: 'This difficult phase is temporary. Bear it with quiet patience, knowing that seasons always change.',
    themes: ['impermanence', 'resilience', 'grief', 'endurance', 'hardship', 'pain', 'patience', 'titiksha'],
    emotions: ['sad', 'grieving', 'hopeless', 'suffering', 'heartbroken', 'discouraged', 'weary'],
    situations: ['loss of loved one', 'breakup', 'period of hardship', 'feeling down', 'chronic struggle'],
  },

  // 4. Overcoming Anger and Mental Chaos (Anger, Resentment, Rage)
  {
    id: 'BG2.63',
    chapter: 2,
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    verse: 63,
    sanskrit: 'क्रोधाद्भवति संमोहः संमोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥',
    transliteration:
      'krodhād bhavati sammohaḥ sammohāt smṛiti-vibhramaḥ\nsmṛiti-bhranśhād buddhi-nāśho buddhi-nāśhāt praṇaśhyati',
    translation:
      'From anger arises delusion; from delusion comes confusion of memory; from confusion of memory comes the loss of reason; and from the loss of reason, a person is ruined.',
    author: 'Swami Gambhirananda',
    meaning:
      'Anger acts as a cognitive fog that hijacks discrimination and memory of your core values. The moment you notice indignation rising, pause immediately before speaking or reacting, so reason can remain at the helm.',
    coreWisdom: 'When anger surges, pause. Reacting in anger destroys clarity; stepping back preserves wisdom.',
    themes: ['anger', 'krodha', 'rage', 'conflict', 'loss of control', 'clarity', 'buddhi', 'reaction'],
    emotions: ['angry', 'furious', 'resentful', 'irritated', 'agitated', 'bitter'],
    situations: ['heated arguments', 'feeling wronged', 'conflict with partner or family', 'road rage'],
  },

  // 5. Living One’s Own Authentic Calling / Svadharma (Career Dilemma, Purpose)
  {
    id: 'BG3.35',
    chapter: 3,
    chapterName: 'Karma Yoga (The Yoga of Action)',
    verse: 35,
    sanskrit: 'श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।\nस्वधर्मे निधनं श्रेयः परधर्मो भयावहः॥',
    transliteration:
      'śhreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣhṭhitāt\nsva-dharme nidhanaṁ śhreyaḥ para-dharmo bhayāvahaḥ',
    translation:
      'Better is one’s own duty, though devoid of merit, than the duty of another well performed. Better is death in the discharge of one’s own duty; the duty of another is fraught with danger.',
    author: 'Swami Sivananda',
    meaning:
      'Comparison kills authenticity. Living someone else’s definition of success creates chronic emptiness and spiritual dissonance. Your duty (Svadharma) lies where your natural traits, ethical responsibilities, and sincere effort meet.',
    coreWisdom: 'Do not measure your worth against another’s path. Honor your authentic calling with sincerity.',
    themes: ['purpose', 'svadharma', 'calling', 'comparison', 'career', 'meaning', 'authenticity', 'identity'],
    emotions: ['lost', 'unfulfilled', 'jealous', 'envious', 'confused', 'insecure', 'empty'],
    situations: ['career crossroads', 'feeling inadequate', 'imposter syndrome', 'societal expectations'],
  },

  // 6. Overcoming Procrastination and Inertia (Discipline, Laziness)
  {
    id: 'BG3.8',
    chapter: 3,
    chapterName: 'Karma Yoga (The Yoga of Action)',
    verse: 8,
    sanskrit: 'नियतं कुरु कर्म त्वं कर्म ज्यायो ह्यकर्मणः।\nशरीरयात्रापि च ते न प्रसिद्ध्येदकर्मणः॥',
    transliteration:
      'niyataṁ kuru karma tvaṁ karma jyāyo hy akarmaṇaḥ\nśharīra-yātrāpi cha te na prasiddhyed akarmaṇaḥ',
    translation:
      'Perform your prescribed duty, for action is better than inaction. Even the maintenance of the body would not be possible through inaction.',
    author: 'Swami Sivananda',
    meaning:
      'Waiting for the "perfect mood" before acting is a trap of the ego. Movement creates motivation, not the other way around. Action, even if imperfect and small, cuts through mental fog far better than endless rumination.',
    coreWisdom: 'Action is always superior to stagnant thought. Begin with one micro-step, even before you feel ready.',
    themes: ['action', 'discipline', 'procrastination', 'duty', 'momentum', 'habit', 'laziness'],
    emotions: ['lazy', 'procrastinating', 'paralyzed', 'hesitant', 'stuck', 'unmotivated'],
    situations: ['delaying important work', 'starting a healthy habit', 'breaking inertia', 'daily routine'],
  },

  // 7. Doubts Destroying Peace (Confusion, Skepticism, Indecision)
  {
    id: 'BG4.40',
    chapter: 4,
    chapterName: 'Jnana Karma Sanyasa Yoga',
    verse: 40,
    sanskrit: 'अज्ञश्चाश्रद्दधानश्च संशयात्मा विनश्यति।\nनायं लोकोऽस्ति न परो न सुखं संशयात्मनः॥',
    transliteration:
      'ajñaśh chāśhraddadhānaśh cha saṁśhayātmā vinaśhyati\nnāyaṁ loko ’sti na paro na sukhaṁ saṁśhayātmanaḥ',
    translation:
      'The ignorant, the faithless, and the doubting self go to destruction. For the doubting soul, there is neither this world, nor the world beyond, nor any happiness.',
    author: 'Swami Gambhirananda',
    meaning:
      'Chronic indecision and perpetual skepticism poison joy and prevent meaningful progress. At some point, you must gather the best evidence available, choose a direction with sincere faith, and commit to seeing it through.',
    coreWisdom: 'Overthinking feeds doubt. Choose an honest path, place faith in your choice, and commit forward.',
    themes: ['doubt', 'indecision', 'overthinking', 'faith', 'clarity', 'commitment', 'paralysis by analysis'],
    emotions: ['confused', 'skeptical', 'indecisive', 'doubtful', 'torn', 'hesitant'],
    situations: ['life decision crossroads', 'second-guessing yourself', 'relationship commitment', 'paralysis by analysis'],
  },

  // 8. The Mind as Best Friend or Worst Enemy (Self-Mastery, Mental Health)
  {
    id: 'BG6.5',
    chapter: 6,
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    verse: 5,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    transliteration:
      'uddhared ātmanātmānaṁ nātmānam avasādayet\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
    translation:
      'Let a person elevate themselves by their own mind, and not degrade themselves. For the mind alone is the friend of the self, and the mind alone is the enemy of the self.',
    author: 'Swami Sivananda',
    meaning:
      'No external critic is harsher than an unmanaged mind, and no supporter is stronger than a compassionate one. You are the custodian of your inner dialogue. Stop degrading yourself through harsh self-criticism, and become your own steadier friend.',
    coreWisdom: 'Your mind can either be your fiercest ally or your harshest foe. Choose self-compassion over cruelty.',
    themes: ['self-mastery', 'mind', 'self-compassion', 'mental wellness', 'inner dialogue', 'elevation'],
    emotions: ['self-hating', 'depressed', 'worthless', 'insecure', 'discouraged', 'guilty'],
    situations: ['negative self-talk', 'recovering from mistakes', 'building self-respect', 'mental loneliness'],
  },

  // 9. Calming the Restless Mind through Practice & Detachment (Meditation, ADHD/Distraction)
  {
    id: 'BG6.35',
    chapter: 6,
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    verse: 35,
    sanskrit: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्।\nअभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥',
    transliteration:
      'asaṁśhayaṁ mahā-bāho mano durnigrahaṁ chalam\nabhyāsena tu kaunteya vairāgyeṇa cha gṛihyate',
    translation:
      'Without doubt, O mighty-armed one, the mind is restless and difficult to curb; but by constant practice (Abhyasa) and detachment (Vairagya), it can be restrained.',
    author: 'Swami Gambhirananda',
    meaning:
      'Krishna does not deny that training the mind is difficult—he validates Arjuna’s struggle. The solution is dual: gentle, repeated practice of returning focus without frustration (Abhyasa), combined with disengaging from trivial distractions (Vairagya).',
    coreWisdom: 'Do not expect immediate perfection from a wandering mind. Train it with gentle, daily patience.',
    themes: ['meditation', 'abhyasa', 'vairagya', 'focus', 'restless mind', 'distraction', 'stillness', 'patience'],
    emotions: ['restless', 'distracted', 'scattered', 'impatient', 'frustrated with focus'],
    situations: ['struggling to meditate', 'cannot focus on study/work', 'doom-scrolling', 'overactive thoughts'],
  },

  // 10. The Steady Flame in a Windless Place (Deep Inner Peace, Presence)
  {
    id: 'BG6.19',
    chapter: 6,
    chapterName: 'Dhyana Yoga (The Yoga of Meditation)',
    verse: 19,
    sanskrit: 'यथा दीपो निवातस्थो नेङ्गते सोपमा स्मृता।\nयोगिनो यतचित्तस्य युञ्जतो योगमात्मनः॥',
    transliteration:
      'yathā dīpo nivāta-stho neṅgate sopamā smṛitā\nyogino yata-chittasya yuñjato yogam ātmanaḥ',
    translation:
      'As a lamp in a windless place does not flicker, so is the steady mind of a Yogi practicing meditation on the Self.',
    author: 'Swami Sivananda',
    meaning:
      'The "winds" are external triggers, notifications, opinions, and fears that make your mind flutter. When you retreat into quiet awareness, the flame of consciousness burns tall, bright, and still.',
    coreWisdom: 'Step away from the noisy winds of external input. In silence, your clarity naturally restores itself.',
    themes: ['peace', 'stillness', 'meditation', 'serenity', 'unwavering', 'silence', 'centeredness'],
    emotions: ['overstimulated', 'anxious', 'craving peace', 'tired of noise', 'overwhelmed'],
    situations: ['seeking quiet time', 'evening reflection', 'meditation session', 'sensory detox'],
  },

  // 11. Overcoming Fear of Failure and Judgment (Courage, Abhaya)
  {
    id: 'BG2.38',
    chapter: 2,
    chapterName: 'Sankhya Yoga (The Yoga of Knowledge)',
    verse: 38,
    sanskrit: 'सुखदुःखे समे कृत्वा लाभालाभौ जयाजयौ।\nततो युद्धाय युज्यस्व नैवं पापमवाप्स्यसि॥',
    transliteration:
      'sukha-duḥkhe same kṛitvā lābhālābhau jayājayau\ntato yuddhāya yujyasva naivaṁ pāpam avāpsyasi',
    translation:
      'Holding pleasure and pain, gain and loss, victory and defeat as alike, gird yourself for the battle. Thus you shall incur no sin.',
    author: 'Swami Sivananda',
    meaning:
      'When you act purely for the honor of doing the right thing, without being bribed by gain or terrified of defeat, failure loses its power to hurt you. You become fundamentally courageous.',
    coreWisdom: 'Do what is right regardless of praise or criticism. Pure intention dissolves fear of defeat.',
    themes: ['courage', 'fearlessness', 'abhaya', 'duty', 'victory', 'defeat', 'dignity', 'integrity'],
    emotions: ['afraid', 'fearful', 'intimidated', 'hesitant', 'scared of failure', 'anxious'],
    situations: ['facing a tough confrontation', 'taking a bold life risk', 'standing up for values'],
  },

  // 12. Compassion and Freedom from Malice in Relationships (Relationships, Forgiveness)
  {
    id: 'BG12.13',
    chapter: 12,
    chapterName: 'Bhakti Yoga (The Yoga of Devotion)',
    verse: 13,
    sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च।\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥',
    transliteration:
      'adveṣhṭā sarva-bhūtānāṁ maitraḥ karuṇa eva cha\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣhamī',
    translation:
      'One who is free from malice toward all beings, friendly and compassionate, free from possessiveness and ego, balanced in joy and grief, and forgiving—that devotee is dear to Me.',
    author: 'Swami Sivananda',
    meaning:
      'Carrying grudge or malice burns the vessel holding it. True strength in relationships lies in friendliness (Maitri), compassion (Karuna), and the ability to forgive, recognizing that other people’s harshness is a symptom of their own internal pain.',
    coreWisdom: 'Release malice and defensiveness. Compassion is not weakness; it is the ultimate emotional strength.',
    themes: ['relationships', 'forgiveness', 'compassion', 'maitri', 'ego', 'conflict', 'love', 'kindness'],
    emotions: ['resentful', 'hurt', 'betrayed', 'bitter', 'vengeful', 'lonely', 'misunderstood'],
    situations: ['relationship fight', 'friendship dispute', 'dealing with difficult colleagues', 'family conflict'],
  },

  // 13. Neither Agitating Others nor Being Agitated by the World (Social Peace, Boundaries)
  {
    id: 'BG12.15',
    chapter: 12,
    chapterName: 'Bhakti Yoga (The Yoga of Devotion)',
    verse: 15,
    sanskrit: 'यस्मान्नोद्विजते लोको लोकान्नोद्विजते च यः।\nहर्षामर्षभयोद्वेगैर्मुक्तो यः स च मे प्रियः॥',
    transliteration:
      'yasmān nodvijate loko lokān nodvijate cha yaḥ\nharṣhāmarṣha-bhayodvegair mukto yaḥ sa cha me priyaḥ',
    translation:
      'He by whom the world is not agitated and who cannot be agitated by the world, who is freed from joy, envy, fear, and anxiety—he is dear to Me.',
    author: 'Swami Sivananda',
    meaning:
      'To walk through life without projecting drama onto others and without absorbing their emotional chaos is the mark of emotional maturity. Set calm boundaries: you are not responsible for carrying everyone else’s reactive storms.',
    coreWisdom: 'Do not stir unnecessary drama, and do not let others shake your inner peace. Walk with quiet dignity.',
    themes: ['boundaries', 'social peace', 'drama', 'serenity', 'envy', 'anxiety', 'emotional freedom'],
    emotions: ['annoyed', 'pressured by others', 'drained by drama', 'overly sensitive'],
    situations: ['toxic environments', 'social media exhaustion', 'office politics', 'setting emotional boundaries'],
  },

  // 14. What Appears like Poison First Tastes like Nectar at the End (Delayed Gratification)
  {
    id: 'BG18.37',
    chapter: 18,
    chapterName: 'Moksha Sanyasa Yoga',
    verse: 37,
    sanskrit: 'यत्तदग्रे विषमिव परिणामेऽमृतोपमम्।\nतत्सुखं सात्त्विकं प्रोक्तमात्मबुद्धिप्रसादजम्॥',
    transliteration:
      'yat tad agre viṣham iva pariṇāme ’mṛitopamam\ntat sukhaṁ sāttvikaṁ proktam ātma-buddhi-prasāda-jam',
    translation:
      'That happiness which appears like poison in the beginning, but tastes like nectar in the end, born of the clear understanding of the Self, is said to be Sattvic (pure).',
    author: 'Swami Gambhirananda',
    meaning:
      'Discipline, exercise, meditation, and honest study always feel uncomfortable or bitter at the start. Instant gratification is sweet at first but turns into poison. Endure the early friction for lasting freedom.',
    coreWisdom: 'The hardest steps at the beginning bring the sweetest peace in the end. Trust the process of discipline.',
    themes: ['discipline', 'delayed gratification', 'growth', 'resilience', 'sattva', 'effort', 'long-term peace'],
    emotions: ['unmotivated', 'craving comfort', 'tired', 'resisting effort', 'procrastinating'],
    situations: ['exercising', 'studying for exams', 'quitting bad habits', 'deep focused work'],
  },

  // 15. The Mind Free of Agitation Speaks Gentle Truth (Speech, Communication)
  {
    id: 'BG17.15',
    chapter: 17,
    chapterName: 'Shraddha Traya Vibhaga Yoga',
    verse: 15,
    sanskrit: 'अनुद्वेगकरं वाक्यं सत्यं प्रियहितं च यत्।\nस्वाध्यायाभ्यसनं चैव वाङ्मयं तप उच्यते॥',
    transliteration:
      'anudvega-karaṁ vākyaṁ satyaṁ priya-hitaṁ cha yat\nsvādhyāyābhyasanaṁ chaiva vāṅ-mayaṁ tapa uchyate',
    translation:
      'Speech that causes no distress, which is truthful, pleasant, and beneficial, and the regular recitation of sacred study, is declared to be the austerity of speech.',
    author: 'Swami Sivananda',
    meaning:
      'Before speaking in difficult times, apply the four tests: Is it non-injurious? Is it true? Is it gentle? Is it genuinely beneficial? When communication follows these pillars, conflict naturally dissolves.',
    coreWisdom: 'Speak truth, but speak it without malice or desire to wound. Words should heal, not harm.',
    themes: ['communication', 'speech', 'truth', 'kindness', 'conflict resolution', 'relationships'],
    emotions: ['misunderstood', 'harsh', 'regretful of words', 'defensive'],
    situations: ['difficult conversations', 'giving feedback', 'resolving arguments', 'active listening'],
  },

  // 16. Total Surrender of Anxiety and Fear (Despair, Surrender, Hope)
  {
    id: 'BG18.66',
    chapter: 18,
    chapterName: 'Moksha Sanyasa Yoga',
    verse: 66,
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
    transliteration:
      'sarva-dharmān parityajya mām ekaṁ śharaṇaṁ vraja\nahaṁ tvā sarva-pāpebhyo mokṣhayiṣhyāmi mā śhuchaḥ',
    translation:
      'Abandon all varieties of anxieties and duties, and simply surrender unto Me alone. I shall deliver you from all sorrow and afflictions. Do not grieve.',
    author: 'Swami Sivananda / Swami Mukundananda',
    meaning:
      'When you have done all you humanly can and your strength is exhausted, let go. Hand your burdens over to the Divine intelligence that holds the universe. You do not have to carry the weight of the cosmos on your fragile shoulders.',
    coreWisdom: 'When your personal strength feels depleted, surrender your worries. You are held by a greater grace. Do not grieve.',
    themes: ['surrender', 'faith', 'sharanagati', 'hope', 'release', 'grief', 'solace', 'grace'],
    emotions: ['exhausted', 'hopeless', 'grieving', 'defeated', 'overwhelmed to breaking point'],
    situations: ['rock bottom moments', 'facing insurmountable odds', 'deep burnout', 'existential fatigue'],
  },
];
