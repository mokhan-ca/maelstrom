export default class EventAggregator {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(event, subscriber) {
    if (!this.subscribers.has(event)) this.subscribers.set(event, []);
    this.subscribers.get(event).push(subscriber);
    return () => {
      const list = this.subscribers.get(event);
      const index = list.indexOf(subscriber);
      if (index >= 0) list.splice(index, 1);
    };
  }

  publish(event, message) {
    const list = this.subscribers.get(event);
    if (!list) return;
    for (const subscriber of [...list]) subscriber(message);
  }
}
