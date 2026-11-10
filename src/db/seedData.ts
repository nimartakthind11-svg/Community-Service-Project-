export const SEED_TOPICS = [
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
  {
    topic_slug: 'myths-vs-facts',
    myth: "You can't exercise during your period.",
    fact: "You can move if it feels good. Gentle movement, like walking or stretching, may help ease cramps. Rest is okay too — choose what feels comfortable for you.",
    source: 'ACOG - Dysmenorrhea: Painful Periods',
    position: 1,
  },
  {
    topic_slug: 'myths-vs-facts',
    myth: "Periods sync up when people spend time together.",
    fact: "Science shows cycle synchrony is a statistical coincidence. Every body has its own unique hormonal rhythm.",
    source: 'Human Reproduction (Oxford Academic) - Menstrual cycle synchrony analysis',
    position: 2,
  },
  {
    topic_slug: 'myths-vs-facts',
    myth: "You shouldn't wash your hair or bathe during your period.",
    fact: "Washing your hair and taking warm baths or showers is completely safe and healthy. Warm water can relax tense muscles and soothe cramp discomfort.",
    source: 'UNICEF - Guide to Menstrual Hygiene Materials',
    position: 3,
  },
  {
    topic_slug: 'myths-vs-facts',
    myth: "Using a pad will feel obvious to everyone around you.",
    fact: "Pads are designed to fit discreetly inside your underwear. No one can see or tell that you are wearing one.",
    source: 'WHO - Adolescent Health and Menstrual Hygiene',
    position: 4,
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

