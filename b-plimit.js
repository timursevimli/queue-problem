'use strict';

(async () => {
  const pLimit = (await import('p-limit')).default;

  const CONCURRENCY = 1;

  const limit = pLimit(CONCURRENCY);

  let start = console.time('bench');
  let count = 0;

  const someAsync = () => new Promise((resolve) => {
    setTimeout(async () => {
      if (count-- % 1000 === 0) {
        console.timeEnd('bench');
        start = console.time('bench');
        console.log({ concurrency: CONCURRENCY, queue: count });
      }
      resolve();
    }, 0);
  });

  const tasks = [];

  for (let i = 0; i < 1_000_000; i++) {
    tasks.push(limit(() => someAsync()));
  }

  count = tasks.length;

  await Promise.all(tasks);
})();
