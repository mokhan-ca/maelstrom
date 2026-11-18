import Boss from '../boss.js';
import Octopus from './octopus.js';
import Skeleton from './skeleton.js';
import Dragon from './dragon.js';

const behaviours = { octopus: Octopus, skeleton: Skeleton, dragon: Dragon };

export const summon = (type, tier) => new Boss(type, tier, new behaviours[type]());
