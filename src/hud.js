const $ = (id) => document.getElementById(id);

const NAMES = { spread: 'Spread', rapid: 'Rapid', shield: 'Shield' };

const describe = (powers) => Object.entries(powers)
  .filter(([, remaining]) => remaining > 0)
  .map(([power, remaining]) => `${NAMES[power]} ${Math.ceil(remaining)}`)
  .join(' · ');

export default class Hud {
  constructor() {
    this.fields = { score: $('score'), wave: $('wave'), lives: $('lives'), livesText: $('lives-text'), multiplier: $('multiplier'), powers: $('powers') };
    this.toastElement = $('toast');
    this.shown = {};
  }

  render(session, ship) {
    if (this.#set('score', session.score.toLocaleString())) this.#pulse(this.fields.score);
    this.#set('wave', session.wave);
    this.#set('lives', '▲'.repeat(session.lives));
    this.#set('livesText', `${session.lives} lives`);
    this.#set('powers', describe(ship.powers));
    this.#set('multiplier', session.multiplier > 1 ? `×${session.multiplier}` : '');
  }

  toast(text, seconds = 1.6) {
    clearTimeout(this.toastTimer);
    this.toastElement.textContent = text;
    this.toastElement.classList.add('show');
    this.toastTimer = setTimeout(() => this.toastElement.classList.remove('show'), seconds * 1000);
  }

  #set(name, value) {
    if (this.shown[name] === value) return false;
    this.shown[name] = value;
    this.fields[name].textContent = value;
    return true;
  }

  #pulse(element) {
    element.classList.remove('pulse');
    void element.offsetWidth;
    element.classList.add('pulse');
  }
}
