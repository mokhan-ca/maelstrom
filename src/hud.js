const $ = (id) => document.getElementById(id);

export default class Hud {
  constructor() {
    this.fields = { score: $('score'), wave: $('wave'), best: $('best'), lives: $('lives'), multiplier: $('multiplier') };
    this.toastElement = $('toast');
    this.shown = {};
  }

  render(session) {
    this.#set('score', session.score.toLocaleString());
    this.#set('wave', session.wave);
    this.#set('best', session.best.toLocaleString());
    this.#set('lives', '▲'.repeat(session.lives));
    this.#set('multiplier', session.multiplier > 1 ? `×${session.multiplier}` : '');
  }

  toast(text, seconds = 1.6) {
    clearTimeout(this.toastTimer);
    this.toastElement.textContent = text;
    this.toastElement.classList.add('show');
    this.toastTimer = setTimeout(() => this.toastElement.classList.remove('show'), seconds * 1000);
  }

  #set(name, value) {
    if (this.shown[name] === value) return;
    this.shown[name] = value;
    this.fields[name].textContent = value;
  }
}
