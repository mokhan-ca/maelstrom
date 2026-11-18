import bindAll from './bind_all.js';
import Monster from './monster.js';
import Sound from './sound.js';

function Laser(sprite) {
  bindAll(this, 'redrawOn', 'collideWith');
  this.sprite = sprite;
  this.destroyed = false;
}

Laser.prototype.redrawOn = function(world) {
  if (this.destroyed) {
    world.remove(this);
  }
  else {
    if (world.inBounds(this.sprite)) {
      this.sprite = this.sprite.moveForward(world);
      world.render(this.sprite);
    } else {
      world.remove(this);
    }
  }
};

Laser.prototype.collideWith = function(otherProp) {
  if (otherProp.constructor === Monster) {
    this.destroyed = true;
    Sound.play(Sound.smash);
  }
};

export default Laser;
