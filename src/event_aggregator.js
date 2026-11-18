import bindAll from './bind_all.js';

function EventAggregator(){
  bindAll(this, 'subscribe', 'publish');
  this.subscribers = {};
};

EventAggregator.prototype.subscribe = function(event, subscriber) {
  this.subscribers[event] = this.subscribers[event] || [];
  this.subscribers[event].push(subscriber);
}

EventAggregator.prototype.publish = function(event, message) {
  (this.subscribers[event] || []).forEach((subscriber) => subscriber(message));
}

export default EventAggregator;
