'use strict';

// Arrays | new_capacity = (old_capacity + 50%) + 16

// Singly linked list
class LinkedList {
  constructor() {
    this.first = null;
    this.last = null;
    this.length = 0;
  }

  push(item) {
    this.length++;
    const last = this.last;
    const element = { prev: last, next: null, item };
    if (last) last.next = element;
    else this.first = element;
    this.last = element;
  }

  shift() {
    const element = this.first;
    if (!element) return null;
    this.length--;
    if (this.last === element) {
      this.first = null;
      this.last = null;
    } else {
      this.first = element.next;
      this.first.prev = null;
    }
    return element.item;
  }
}

class Queue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.count = 0;
    this.waiting = new LinkedList();
    this.onProcess = null;
    this.onDone = null;
    this.onSuccess = null;
    this.onFailure = null;
    this.onDrain = null;
  }

  static channels(concurrency) {
    return new Queue(concurrency);
  }

  add(task) {
    const hasChannel = this.count < this.concurrency;
    if (hasChannel) {
      this.next(task);
      return;
    }
    this.waiting.push(task);
  }

  next(task) {
    this.count++;
    this.onProcess(task, (err, result) => {
      if (err) {
        if (this.onFailure) this.onFailure(err);
      } else if (this.onSuccess) {
        this.onSuccess(result);
      }
      if (this.onDone) this.onDone(err, result);
      this.count--;
      if (this.waiting.length > 0) {
        const task = this.waiting.shift();
        this.next(task);
        return;
      }
      if (this.count === 0 && this.onDrain) {
        this.onDrain();
      }
    });
  }

  process(listener) {
    this.onProcess = listener;
    return this;
  }

  done(listener) {
    this.onDone = listener;
    return this;
  }

  success(listener) {
    this.onSuccess = listener;
    return this;
  }

  failure(listener) {
    this.onFailure = listener;
    return this;
  }

  drain(listener) {
    this.onDrain = listener;
    return this;
  }
}

// Usage

const CHANNELS = 1;

const job = (timeout, next) => {
  setTimeout(() => void next(null, timeout), timeout);
};

let count = 0;

let start = console.time('bench');

const queue = Queue.channels(CHANNELS)
  .process(job)
  .drain(() => {
    console.log('Queue is empty!');
  })
  .done(async () => {
    count++;
    if (count % 1000 === 0) {
      console.log({ count: queue.count, queue: queue.waiting.length });
      console.timeEnd('bench');
      start = console.time('bench');
    }
  });

for (let i = 0; i < 10_000_000; i++) queue.add(0);
