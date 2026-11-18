import './style.css';
import { WORLD } from './config.js';
import { load, save } from './storage.js';
import EventAggregator from './engine/event-aggregator.js';
import Input from './engine/input.js';
import Loop from './engine/loop.js';
import Viewport from './engine/viewport.js';
import Session from './session.js';
import Play from './scenes/play.js';
import Starfield from './render/starfield.js';
import { sprites } from './render/sprites.js';
import Mixer from './audio/mixer.js';
import Sfx from './audio/sfx.js';
import Music from './audio/music.js';
import Hud from './hud.js';

const $ = (id) => document.getElementById(id);
const calm = matchMedia('(prefers-reduced-motion: reduce)');

const canvas = $('screen');
const viewport = new Viewport(canvas);
const input = new Input({ pointerTarget: canvas, worldScale: () => viewport.scale });
const events = new EventAggregator();
const session = new Session({ best: load('best', 0) });
const play = new Play({ session, events });
const starfield = new Starfield();
const mixer = new Mixer({ muted: load('muted', false) });
const sfx = new Sfx(mixer);
const music = new Music(mixer);
const hud = new Hud();

const overlays = { title: $('title'), paused: $('paused'), over: $('over') };
let scene = 'title';
let previousBest = session.best;

const show = (name) => {
  scene = name;
  for (const [key, element] of Object.entries(overlays)) element.hidden = key !== name;
  input.reset();
  focus(overlays[name]);
};

const focus = (overlay) => {
  document.activeElement?.blur();
  overlay?.querySelector('.primary')?.focus({ preventScroll: true });
};

const remember = () => save('best', session.best);

const start = () => {
  mixer.unlock();
  previousBest = session.best;
  play.start();
  music.start();
  show('playing');
  hud.toast('Wave 1');
  hint();
};

const pause = () => {
  if (scene !== 'playing') return;
  remember();
  show('paused');
  mixer.suspend();
};

const resume = () => {
  if (scene !== 'paused') return;
  mixer.unlock();
  show('playing');
};

const quit = () => {
  remember();
  music.stop();
  show('title');
};

const finish = () => {
  music.stop();
  remember();
  $('final-score').textContent = session.score.toLocaleString();
  $('final-wave').textContent = session.wave;
  $('final-best').textContent = session.best.toLocaleString();
  $('new-best').hidden = session.score <= previousBest;
  show('over');
};

const toggleMute = () => {
  const muted = mixer.toggleMute();
  save('muted', muted);
  $('mute').setAttribute('aria-pressed', muted);
};

const hint = () => {
  if (!input.usedTouch || load('hinted', false)) return;
  const element = $('hint');
  element.textContent = 'Drag anywhere to fly · firing is automatic';
  element.hidden = false;
  setTimeout(() => (element.hidden = true), 4000);
  save('hinted', true);
};

const actions = { start, resume, quit };
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  actions[action]?.();
});
$('pause').addEventListener('click', () => (scene === 'paused' ? resume() : pause()));
$('mute').addEventListener('click', toggleMute);
$('mute').setAttribute('aria-pressed', mixer.muted);

window.addEventListener('keydown', () => scene === 'playing' && mixer.resume());
window.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch') input.usedTouch = true;
  if (scene === 'playing') mixer.resume();
});
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => document.hidden && pause());

events.subscribe('laser', () => sfx.laser());
events.subscribe('kill', () => sfx.explosion());
events.subscribe('hit', () => sfx.hit());
events.subscribe('powerup', (type) => {
  sfx.powerup();
  hud.toast({ spread: 'Spread shot', rapid: 'Rapid fire', shield: 'Shield' }[type], 1.2);
});
events.subscribe('extra-life', () => {
  sfx.extraLife();
  hud.toast('Extra life', 1.2);
});
events.subscribe('combo', (multiplier) => {
  sfx.combo(multiplier);
  hud.toast(`×${multiplier}`, 0.8);
});
events.subscribe('combo-broken', () => {
  sfx.comboBroken();
  hud.toast('Combo lost', 0.8);
});
events.subscribe('wave', (wave) => {
  hud.toast(`Wave ${wave}`);
  starfield.speed = 1 + (wave - 1) * 0.15;
});
events.subscribe('start', () => (starfield.speed = 1));
events.subscribe('game-over', () => {
  sfx.gameOver();
  music.stop();
});

viewport.onResize = ({ width, height }) => starfield.resize(width, height);
viewport.resize();
sprites();

const commands = {
  title: () => input.consume('confirm') && start(),
  over: () => input.consume('confirm') && start(),
  paused: () => (input.consume('pause') || input.consume('confirm')) && resume(),
  playing: (dt) => {
    if (input.consume('pause')) return pause();
    play.update(dt, input);
    hud.render(session);
    if (play.finished) finish();
  },
};

const update = (dt) => {
  if (input.consume('mute')) toggleMute();
  starfield.update(dt);
  commands[scene](dt);
};

const render = () => {
  const { ctx } = viewport;
  viewport.screenSpace();
  starfield.draw(ctx);
  const shake = calm.matches || scene !== 'playing' ? { x: 0, y: 0 } : play.shakeOffset;
  viewport.worldSpace(shake.x, shake.y);
  frame(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WORLD.width, WORLD.height);
  ctx.clip();
  if (scene !== 'title') play.draw(ctx);
  ctx.restore();
};

const frame = (ctx) => {
  ctx.fillStyle = 'rgba(5, 1, 15, 0.45)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.strokeStyle = 'rgba(138, 92, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
};

hud.render(session);
new Loop({ update, render }).start();
