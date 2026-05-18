export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed(array, seed) {
  const rand = mulberry32(seed);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function selectTopicBalancedBaseQuestions(pool, size, seed = 2026) {
  const grouped = pool.reduce((acc, q) => {
    if (!acc[q.topic]) acc[q.topic] = [];
    acc[q.topic].push(q);
    return acc;
  }, {});

  const topics = Object.keys(grouped);
  if (topics.length > size) {
    throw new Error(
      `Cannot cover all topics: ${topics.length} topics for only ${size} questions`
    );
  }

  topics.forEach((topic, idx) => {
    grouped[topic] = shuffleWithSeed(grouped[topic], seed + idx * 17);
  });

  const selected = topics.map((topic) => grouped[topic].shift());

  const topicOrder = shuffleWithSeed(topics, seed + 999);
  while (selected.length < size) {
    let progressed = false;
    for (const topic of topicOrder) {
      if (grouped[topic].length > 0) {
        selected.push(grouped[topic].shift());
        progressed = true;
      }
      if (selected.length === size) break;
    }
    if (!progressed) break;
  }

  return selected.slice(0, size);
}

/** Final exam: topic coverage + at least 30% programming/code questions */
export function selectFinalExamQuestions(pool, size, seed = 3030) {
  const minProgramming = Math.ceil(size * 0.3);

  const grouped = pool.reduce((acc, q) => {
    if (!acc[q.topic]) acc[q.topic] = [];
    acc[q.topic].push(q);
    return acc;
  }, {});

  const topics = Object.keys(grouped);
  if (topics.length > size) {
    throw new Error(
      `Cannot cover all topics: ${topics.length} topics for only ${size} questions`
    );
  }

  topics.forEach((topic, idx) => {
    grouped[topic] = shuffleWithSeed(grouped[topic], seed + idx * 17);
  });

  const selected = [];
  let progCount = 0;

  // One per topic — prefer programming while under quota
  for (const topic of topics) {
    const available = grouped[topic];
    const pick =
      (progCount < minProgramming &&
        available.find((q) => q.isProgramming)) ||
      available[0];
    selected.push(pick);
    grouped[topic] = available.filter((q) => q.id !== pick.id);
    if (pick.isProgramming) progCount++;
  }

  const topicOrder = shuffleWithSeed(topics, seed + 999);
  while (selected.length < size) {
    let progressed = false;
    for (const topic of topicOrder) {
      if (grouped[topic].length === 0) continue;
      const needProg = progCount < minProgramming;
      const pick =
        (needProg && grouped[topic].find((q) => q.isProgramming)) ||
        grouped[topic][0];
      selected.push(pick);
      grouped[topic] = grouped[topic].filter((q) => q.id !== pick.id);
      if (pick.isProgramming) progCount++;
      progressed = true;
      if (selected.length === size) break;
    }
    if (!progressed) break;
  }

  return selected.slice(0, size);
}

export function ensureNoAdjacentSameTopic(questions) {
  const arr = [...questions];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].topic === arr[i - 1].topic) {
      let swapIndex = -1;
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j].topic !== arr[i - 1].topic) {
          swapIndex = j;
          break;
        }
      }
      if (swapIndex !== -1) {
        [arr[i], arr[swapIndex]] = [arr[swapIndex], arr[i]];
      }
    }
  }
  return arr;
}

export function buildSetQuestions(baseQuestions, seedBase) {
  const shuffled = shuffleWithSeed(baseQuestions, seedBase);
  const spaced = ensureNoAdjacentSameTopic(shuffled);

  return spaced.map((q, index) => {
    const optionIndices = q.opts.map((_, i) => i);
    const shuffledOptionIndices = shuffleWithSeed(
      optionIndices,
      seedBase * 1000 + index + 1
    );
    const newOpts = shuffledOptionIndices.map((i) => q.opts[i]);
    const newAns = shuffledOptionIndices.indexOf(q.ans);
    return { ...q, opts: newOpts, ans: newAns };
  });
}
