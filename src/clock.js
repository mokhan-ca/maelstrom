import bindAll from './bind_all.js';

function Clock(window){
  this.window = window;
  bindAll(this, 'run');
}

Clock.prototype.run = function(game) {
  game.add(this.run);
  this.window.requestAnimationFrame(game.run);
};

export default Clock;
