export default class Pool {
  constructor(create, limit = Infinity) {
    this.create = create;
    this.limit = limit;
    this.items = [];
  }

  spawn(init) {
    let item = this.items.find((candidate) => !candidate.active);
    if (!item) {
      if (this.items.length >= this.limit) return null;
      item = this.create();
      this.items.push(item);
    }
    item.active = true;
    init(item);
    return item;
  }

  *[Symbol.iterator]() {
    for (const item of this.items) {
      if (item.active) yield item;
    }
  }

  get count() {
    let total = 0;
    for (const item of this.items) if (item.active) total++;
    return total;
  }

  clear() {
    for (const item of this.items) item.active = false;
  }
}
