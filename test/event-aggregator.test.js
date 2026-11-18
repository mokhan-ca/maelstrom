import EventAggregator from '../src/engine/event-aggregator.js';

describe('EventAggregator', () => {
  let subject;

  beforeEach(() => {
    subject = new EventAggregator();
  });

  describe('publish', () => {
    it('notifies all subscribers', () => {
      let called = false;
      subject.subscribe('greeting', (message) => { called = message; });

      subject.publish('greeting', 'hello');
      expect(called).toEqual('hello');
    });

    it('does not notify subscribers for a different event', () => {
      let called = false;
      subject.subscribe('other', (message) => { called = message; });

      subject.publish('greeting', 'hello');
      expect(called).toEqual(false);
    });

    it('lets a subscriber unsubscribe', () => {
      let calls = 0;
      const unsubscribe = subject.subscribe('greeting', () => calls++);
      unsubscribe();

      subject.publish('greeting');
      expect(calls).toEqual(0);
    });

    it('does nothing when there are no subscribers', () => {
      expect(() => subject.publish('nobody', 1)).not.toThrow();
    });
  });
});
