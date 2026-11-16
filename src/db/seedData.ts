export const SEED_TOPICS = [
  {
    slug: 'periods-movement',
    title: 'Periods & movement',
    subtitle: 'Movement, activity & staying comfortable.',
    icon: 'activity',
    read_count: 0,
    category: 'learn',
  },
  {
    slug: 'hygiene',
    title: 'Hygiene',
    subtitle: 'Products, changing & feeling comfortable.',
    icon: 'droplets',
    read_count: 6,
    category: 'learn',
  },
  {
    slug: 'first-period',
    title: 'First period',
    subtitle: 'What to expect. What to keep handy.',
    icon: 'heart',
    read_count: 5,
    category: 'learn',
  },
  {
    slug: 'myths-vs-facts',
    title: 'Myths vs facts',
    subtitle: "Let's clear up the things you've heard.",
    icon: 'sparkles',
    read_count: 8,
    category: 'learn',
  },
  {
    slug: 'body-changes',
    title: 'Body changes',
    subtitle: 'Growing, moods & your own pace.',
    icon: 'flower',
    read_count: 7,
    category: 'learn',
  },
  {
    slug: 'first-periods',
    title: 'First periods',
    subtitle: 'Everything about your first experience.',
    icon: 'heart',
    read_count: 0,
    category: 'ask',
  },
  {
    slug: 'cycle-changes',
    title: 'Cycle changes',
    subtitle: 'Understanding changes in your dates.',
    icon: 'calendar',
    read_count: 0,
    category: 'ask',
  },
  {
    slug: 'hygiene-ask',
    title: 'Hygiene',
    subtitle: 'Daily cleanliness and comfort tips.',
    icon: 'droplets',
    read_count: 0,
    category: 'ask',
  },
  {
    slug: 'feelings-discomfort',
    title: 'Feelings & discomfort',
    subtitle: 'Dealing with cramps and mood changes.',
    icon: 'users',
    read_count: 0,
    category: 'ask',
  },
];

export const SEED_ARTICLES = [
  {
    topic_slug: 'first-period',
    title: 'Your first period, without the guesswork',
    body: 'Starting your period is a normal and healthy sign that your body is growing. You might notice small changes first, like light spotting or feeling a bit more tired. Keeping a pad and a change of underwear in your bag can give you peace of mind wherever you go.',
    read_minutes: 4,
    source: 'ACOG - Your First Period (Ages 11-14)',
  },
  {
    topic_slug: 'first-period',
    title: 'Period basics',
    body: 'A menstrual cycle is measured from the first day of one period to the first day of the next. For teens, cycles often range between 21 to 45 days as your body establishes its natural rhythm.',
    read_minutes: 3,
    source: 'AAP - Menstruation in Girls and Adolescents',
  },
  {
    topic_slug: 'hygiene',
    title: 'Pad care & comfortable changing',
    body: 'Changing your pad every 4 to 6 hours keeps you clean, dry, and comfortable. Wash your hands with soap and water before and after changing. Wrap the used pad in toilet paper or the wrapper from the new one before placing it in a trash bin. Never flush pads or wrappers down the toilet.',
    read_minutes: 3,
    source: 'UNICEF - Guide to Menstrual Hygiene Materials',
  },
  {
    topic_slug: 'hygiene',
    title: 'Baths, showers & everyday freshness',
    body: 'Taking a warm bath or shower during your period is completely safe and healthy. Warm water can relax tense abdominal muscles and soothe cramp discomfort. Use gentle, unscented soap on the outside only — your vagina naturally cleanses itself internally with natural fluids.',
    read_minutes: 2,
    source: 'ACOG - Caring for Your Body During Puberty',
  },
  {
    topic_slug: 'body-changes',
    title: 'Puberty, hormones & changing moods',
    body: 'During puberty, your brain begins producing hormones that signal changes throughout your body. Along with physical growth, you might feel sudden shifts in mood or energy. These ups and downs are completely normal. Giving yourself time to rest and talking to a trusted friend or adult can help.',
    read_minutes: 3,
    source: 'AAP - Understanding Puberty in Adolescents',
  },
  {
    topic_slug: 'body-changes',
    title: 'Growing at your own pace',
    body: "Puberty doesn't happen on a set schedule. Some girls start experiencing changes around age 9 or 10, while others begin at 13 or 14. Both timelines are healthy and normal. There is no right or wrong way for your body to grow.",
    read_minutes: 3,
    source: 'WHO - Adolescent Growth and Development Guidelines',
  },
];

export const SEED_MYTHS = [
  // Periods & Movement
  {
    topic_slug: 'periods-movement',
    myth: "You can't exercise during your period.",
    fact: "You can move if it feels good. Gentle movement, like walking or stretching, may help ease cramps. Rest is okay too — choose what feels comfortable for you.",
    source: 'ACOG - Dysmenorrhea: Painful Periods',
    position: 1,
  },
  {
    topic_slug: 'periods-movement',
    myth: "Swimming during your period is harmful or dirty.",
    fact: "Swimming during your period is entirely safe and healthy. Water cannot enter the cervix or uterus, and gentle swimming often relieves menstrual cramps.",
    source: 'AAP - Menstruation in Girls and Adolescents',
    position: 2,
  },
  {
    topic_slug: 'periods-movement',
    myth: "Strenuous physical activity can damage your reproductive health.",
    fact: "Normal sports and physical activities do not harm your internal organs. Regular movement promotes blood flow and releases endorphins that reduce cramps.",
    source: 'ACOG - Exercise and Fitness Guidelines',
    position: 3,
  },
  {
    topic_slug: 'periods-movement',
    myth: "You should avoid any running or jumping while on your period.",
    fact: "Running and jumping are completely safe during your period if you feel up to it. Wearing a comfortable pad or supportive underwear is all you need.",
    source: 'WHO - Adolescent Health and Menstrual Hygiene',
    position: 4,
  },

  // Hygiene
  {
    topic_slug: 'hygiene',
    myth: "You shouldn't wash your hair or bathe during your period.",
    fact: "Washing your hair and taking warm baths or showers is completely safe and healthy. Warm water can relax tense muscles and soothe cramp discomfort.",
    source: 'UNICEF - Guide to Menstrual Hygiene Materials',
    position: 5,
  },
  {
    topic_slug: 'hygiene',
    myth: "Touching certain foods or plants during your period will spoil them.",
    fact: "Menstruation is a completely natural biological process. It has zero effect on food, plants, or objects you touch. Clean handwashing keeps everything safe.",
    source: 'WHO - Myths and Realities of Menstrual Health',
    position: 6,
  },
  {
    topic_slug: 'hygiene',
    myth: "You should use perfumed soaps or sprays to stay fresh during periods.",
    fact: "Scented soaps, deodorants, and perfumed pads can irritate sensitive skin and disrupt natural pH balance. Clean warm water and mild unscented soap on the outside are best.",
    source: 'ACOG - Caring for Your Body During Puberty',
    position: 7,
  },
  {
    topic_slug: 'hygiene',
    myth: "You only need to change your pad once a day if your flow is light.",
    fact: "Pads should be changed every 4 to 6 hours regardless of flow to prevent bacterial buildup, reduce dampness, and prevent skin irritation.",
    source: 'UNICEF - Guide to Menstrual Hygiene Materials',
    position: 8,
  },

  // First periods
  {
    topic_slug: 'first-periods',
    myth: "Using a pad will feel obvious to everyone around you.",
    fact: "Pads are designed to fit discreetly inside your underwear. No one can see or tell that you are wearing one.",
    source: 'WHO - Adolescent Health and Menstrual Hygiene',
    position: 9,
  },
  {
    topic_slug: 'first-periods',
    myth: "Everyone gets their first period at the exact same age.",
    fact: "The normal range for starting periods is between ages 9 and 15. Every body develops according to its own genetics and hormonal timeline.",
    source: 'AAP - Menstruation in Girls and Adolescents',
    position: 10,
  },
  {
    topic_slug: 'first-periods',
    myth: "You lose large amounts of blood during your period.",
    fact: "Although it may seem like a lot, the average person only loses about 2 to 3 tablespoons (30 to 50 ml) of menstrual fluid over their entire period.",
    source: 'ACOG - Your First Period (Ages 11-14)',
    position: 11,
  },
  {
    topic_slug: 'first-periods',
    myth: "Severe, unbearable period pain is just something you must live with.",
    fact: "Mild cramping is common, but pain that keeps you home from school or does not respond to a warm compress should be checked by a doctor.",
    source: 'ACOG - Dysmenorrhea: Painful Periods in Teens',
    position: 12,
  },

  // Cycle changes
  {
    topic_slug: 'cycle-changes',
    myth: "Periods sync up when people spend time together.",
    fact: "Science shows cycle synchrony is a statistical coincidence. Every body has its own unique hormonal rhythm.",
    source: 'Human Reproduction (Oxford Academic) - Menstrual cycle synchrony analysis',
    position: 13,
  },
  {
    topic_slug: 'cycle-changes',
    myth: "Every healthy person has a strict 28-day cycle.",
    fact: "Cycles naturally vary between 21 and 45 days, especially during teenage years when hormones are still settling into a rhythm.",
    source: 'AAP & ACOG - Menstruation in Adolescents: Using the Menstrual Cycle as a Vital Sign',
    position: 14,
  },
  {
    topic_slug: 'cycle-changes',
    myth: "Drinking cold water makes menstrual cramps worse.",
    fact: "Drinking cold water does not cause or worsen menstrual cramps. Cramps are caused by chemical prostaglandins in the uterus, not temperature in your digestive system.",
    source: 'WHO - Adolescent Health and Menstrual Hygiene',
    position: 15,
  },
  {
    topic_slug: 'cycle-changes',
    myth: "An irregular cycle in your first two years means something is wrong.",
    fact: "It is completely normal for periods to be irregular in the first two to three years as your reproductive system and hormone cycles mature.",
    source: 'ACOG - Your First Period (Ages 11-14)',
    position: 16,
  },
];

export const SEED_QUESTIONS = [
  {
    topic_slug: 'first-periods',
    question: 'What if my period starts at school?',
    answer: 'It is very normal and happens to almost everyone! Keep a spare pad in your bag. If you do not have one, you can visit the school nurse, ask a female teacher, or ask a trusted friend. You can also fold clean toilet paper temporarily while you get a pad.',
    source: 'AAP - Menstruation in Girls and Adolescents',
  },
  {
    topic_slug: 'cycle-changes',
    question: "Why doesn't my period come on time?",
    answer: 'During the first two years after your first period, irregular cycles are very common while your hormones balance out. It may take some time to settle into a predictable pattern.',
    source: 'ACOG - Menstruation in Girls and Adolescents',
  },
  {
    topic_slug: 'hygiene-ask',
    question: 'How often should I change my pad?',
    answer: 'It is recommended to change your pad every 4 to 6 hours, or sooner if it feels heavy or damp. Changing regularly keeps you feeling clean, dry, and comfortable.',
    source: 'WHO & UNICEF - Menstrual Hygiene Guidelines',
  },
  {
    topic_slug: 'feelings-discomfort',
    question: 'What can help when I have cramps?',
    answer: 'A warm heating pad or warm water bottle placed on your tummy, gentle stretching or walking, resting, and sipping warm water can help soothe cramps.',
    source: 'ACOG - Dysmenorrhea: Painful Periods',
  },
];

export const SEED_PERIOD_LOGS = [
  {
    start_date: '2026-09-03',
    end_date: '2026-09-07',
  },
];

export const SEED_SETTINGS = [
  { key: 'user_name', value: 'Amara' },
  { key: 'cycle_length', value: '29' },
  { key: 'period_length', value: '5' },
  { key: 'language', value: 'en' },
];

