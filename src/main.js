import './style.css';
import { WORLD } from './config.js';
import { load, save } from './storage.js';
import EventAggregator from './engine/event-aggregator.js';
import Input from './engine/input.js';
import Loop from './engine/loop.js';
import Viewport from './engine/viewport.js';
import Session from './session.js';
import Play from './scenes/play.js';
import Paper from './render/paper.js';
import { sprites } from './render/sprites.js';
import Mixer from './audio/mixer.js';
import Sfx from './audio/sfx.js';
import Music from './audio/music.js';
import Hud from './hud.js';
import Konami from './konami.js';

const $ = (id) => document.getElementById(id);
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const sideways = matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 500px)');
const BRUSH_MODE = 30;

const canvas = $('screen');
const viewport = new Viewport(canvas);
const input = new Input({ pointerTarget: canvas, worldScale: () => viewport.scale });
const events = new EventAggregator();
const session = new Session({ best: load('best', 0) });
const play = new Play({ session, events, calm: () => calm.matches });
const paper = new Paper();
const mixer = new Mixer({ muted: load('muted', false) });
const sfx = new Sfx(mixer);
const music = new Music(mixer);
const hud = new Hud();

const overlays = { title: $('title'), paused: $('paused'), over: $('over') };
let scene = 'title';
let previousBest = session.best;
let brushMode = false;

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
  if (brushMode) unleash();
};

const unleash = () => {
  play.ship.boost(BRUSH_MODE);
  hud.toast('Brush mode', 2);
};

const konami = new Konami(() => {
  brushMode = true;
  mixer.unlock();
  sfx.extraLife();
  $('title-best').textContent = 'Brush mode unlocked';
});

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
  showBest();
  show('title');
};

const finish = () => {
  remember();
  $('final-wave').textContent = session.wave;
  $('final-best').textContent = session.best.toLocaleString();
  $('new-best').hidden = session.score <= previousBest;
  show('over');
  countUp($('final-score'), session.score);
};

const countUp = (element, total, seconds = 0.9) => {
  if (calm.matches) return (element.textContent = total.toLocaleString());
  const began = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - began) / (seconds * 1000));
    element.textContent = Math.round(total * (1 - (1 - progress) ** 3)).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const showBest = () => ($('title-best').textContent = session.best ? `Best ${session.best.toLocaleString()}` : '');

const toggleMute = () => {
  const muted = mixer.toggleMute();
  save('muted', muted);
  showMuted(muted);
};

const showMuted = (muted) => {
  $('mute').setAttribute('aria-pressed', muted);
  $('mute').textContent = muted ? '🔇' : '🔊';
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
showMuted(mixer.muted);
showBest();

window.addEventListener('keydown', (event) => {
  if (scene === 'playing') mixer.resume();
  if (scene === 'title') konami.press(event.code);
});
sideways.addEventListener('change', () => sideways.matches && pause());
window.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch') input.usedTouch = true;
  if (scene === 'playing') mixer.resume();
});
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => document.hidden && pause());

events.subscribe('laser', () => sfx.laser());
events.subscribe('kill', () => sfx.explosion());
events.subscribe('hit', () => {
  sfx.hit();
  music.duck();
});
events.subscribe('charge', () => sfx.charge());
events.subscribe('swallow', () => sfx.swallow());
events.subscribe('maelstrom', () => hud.toast('The maelstrom stirs', 2.2));
events.subscribe('expire', (power) => {
  sfx.expire();
  hud.toast(`${power} faded`, 0.8);
});
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
  music.intensify(wave);
  paper.speed = 1 + (wave - 1) * 0.15;
});
events.subscribe('start', () => (paper.speed = 1));
events.subscribe('game-over', () => {
  sfx.gameOver();
  music.fadeOut();
});

viewport.onResize = ({ width, height }) => paper.resize(width, height);
viewport.resize();
sprites();

const commands = {
  title: () => input.consume('confirm') && start(),
  over: () => input.consume('confirm') && start(),
  paused: () => (input.consume('pause') || input.consume('confirm')) && resume(),
  playing: (dt) => {
    if (input.consume('pause')) return pause();
    play.update(dt, input);
    hud.render(session, play.ship);
    if (play.finished) finish();
  },
};

const update = (dt) => {
  if (input.consume('mute')) toggleMute();
  paper.update(dt);
  commands[scene](dt);
};

const render = () => {
  const { ctx } = viewport;
  viewport.screenSpace();
  paper.draw(ctx);
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
  if (!viewport.letterboxed) return;
  ctx.fillStyle = 'rgba(255, 250, 238, 0.35)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.strokeStyle = 'rgba(27, 26, 23, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
};

hud.render(session, play.ship);
new Loop({ update, render }).start();
