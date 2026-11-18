import Boss from '../boss.js';
import Octopus from './octopus.js';

const behaviours = { octopus: Octopus };

export const summon = (type, tier) => new Boss(type, tier, new behaviours[type]());
