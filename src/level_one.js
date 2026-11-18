import bindAll from './bind_all.js';
import Monster from './monster.js';
import Sprite from './sprite.js';
import Heading from './heading.js';
import Utility from './utility.js';
import Images from './images.js';
import Rocketship from './rocketship.js';
import Sound from './sound.js';

function LevelOne(world, eventAggregator){
  bindAll(this, 'run', 'deployMonster', 'deployShip');
  this.world = world;
  this.eventAggregator = eventAggregator;
  this.countdown = 0;

  this.eventAggregator.subscribe('rocketship-died', function(){
    Sound.play(Sound.explosion);
  });
}

LevelOne.prototype.run = function(game) {
  if (this.countdown < 0) {
    if (this.world.props.length <= 10) {
      this.deployMonster();
    }
  }

  this.countdown -= 1;
  game.add(this.run);
};

LevelOne.prototype.deployMonster = function() {
  this.world.add(new Monster(new Sprite({
    x: Utility.randomIntFromRange(0, this.world.width),
    y: 0,
    heading: Heading.random(),
    speed: Utility.randomIntFromRange(1, 3),
    image: Images.load(Images.monster),
  })));
  this.countdown = 100;
};

LevelOne.prototype.deployShip = function() {
  this.world.add(new Rocketship(new Sprite({
    x: 250,
    y: 400,
    heading: Heading.NORTH,
    speed: 2,
    image: Images.load(Images.rocketship),
  }), this.eventAggregator));
};

export default LevelOne;
