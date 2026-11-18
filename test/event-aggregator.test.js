import EventAggregator from '../src/event_aggregator.js';

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

    it('does nothing when there are no subscribers', () => {
      expect(() => subject.publish('nobody', 1)).not.toThrow();
    });
  });
});
