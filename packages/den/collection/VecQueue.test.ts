// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { VecQueue } from "./VecQueue";

describe("VecQueue", () => {
  it("should make an empty queue", () => {
    const queue = new VecQueue();
    expect(queue.size()).toEqual(0);
    expect(queue.dequeue()).toEqual(undefined);
  });

  it("should add and remove one item", () => {
    const queue = new VecQueue<string>();
    queue.enqueue("a");
    expect(queue.size()).toEqual(1);
    expect(queue.dequeue()).toEqual("a");
    expect(queue.size()).toEqual(0);
  });

  it("should add many items and remove them", () => {
    const queue = new VecQueue<number>();
    for (let i = 0; i < 10; ++i) {
      queue.enqueue(i);
    }
    expect(queue.size()).toEqual(10);
    for (let i = 0; i < 10; ++i) {
      expect(queue.dequeue()).toEqual(i);
    }
    expect(queue.size()).toEqual(0);
  });

  it("should add and remove items interleaves", () => {
    const queue = new VecQueue<number>();
    for (let i = 0; i < 10; ++i) {
      queue.enqueue(i);
      expect(queue.size()).toEqual(1);
      expect(queue.dequeue()).toEqual(i);
    }
    expect(queue.size()).toEqual(0);
  });

  it("should clear", () => {
    const queue = new VecQueue<number>();
    for (let i = 0; i < 10; ++i) {
      queue.enqueue(i);
    }
    for (let i = 0; i < 3; ++i) {
      expect(queue.dequeue()).toEqual(i);
    }
    queue.clear();
    expect(queue.size()).toEqual(0);
  });

  it("should read then write without growing", () => {
    const queue = new VecQueue<number>();
    for (let i = 0; i < 10; ++i) {
      queue.enqueue(i);
    }
    expect(queue.size()).toEqual(10);
    expect(queue.capacity()).toEqual(16);

    for (let i = 0; i < 3; ++i) {
      expect(queue.dequeue()).toEqual(i);
    }
    expect(queue.size()).toEqual(7);
    expect(queue.capacity()).toEqual(16);

    for (let i = 10; i < 12; ++i) {
      queue.enqueue(i);
    }
    expect(queue.size()).toEqual(9);

    for (let i = 3; i < 12; ++i) {
      expect(queue.dequeue()).toEqual(i);
    }
    expect(queue.size()).toEqual(0);
    expect(queue.capacity()).toEqual(16);
  });

  it("should stop reading when no more items", () => {
    const queue = new VecQueue<number>();
    for (let i = 0; i < 10; ++i) {
      queue.enqueue(i);
    }
    for (let i = 0; i < 10; ++i) {
      expect(queue.dequeue()).toEqual(i);
    }
    expect(queue.size()).toEqual(0);
    for (let i = 0; i < 2; ++i) {
      expect(queue.dequeue()).toEqual(undefined);
    }

    queue.enqueue(11);
    expect(queue.dequeue()).toEqual(11);
  });
});
