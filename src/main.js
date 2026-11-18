import Game from './game.js';
import Clock from './clock.js';
import World from './world.js';
import Keyboard from './keyboard.js';
import Music from './music.js';
import LevelOne from './level_one.js';
import EventAggregator from './event_aggregator.js';

window.addEventListener('keyup', function(event) { Keyboard.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Keyboard.onKeydown(event); }, false);

var eventAggregator = new EventAggregator();
var world = new World({height: 600, width: 960}).bindTo(document);
var levelOne = new LevelOne(world, eventAggregator);

var game = new Game();
game.add(new Clock(window).run);
game.add(levelOne.deployShip);
game.add(levelOne.run);
game.add(new Music("audio/main.mp3", window).run);
game.add(world.run);
game.run();
