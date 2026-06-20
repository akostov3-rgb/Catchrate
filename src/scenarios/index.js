// Loads all scenario content files and validates them at startup.
// Scenarios are content, never code. Each malformed scenario is console.warned.

import { validateScenario } from '../lib/scoring.js';

import sales from './sales.json';
import marketing from './marketing.json';
import finance from './finance.json';
import hr from './hr.json';
import strategy from './strategy.json';

const ALL = [sales, marketing, finance, hr, strategy];

// Validate every scenario once at module load.
ALL.forEach((s) => validateScenario(s));

export const SCENARIOS_BY_TRACK = ALL.reduce((acc, s) => {
  acc[s.track] = s;
  return acc;
}, {});

export function getScenarioForTrack(track) {
  return SCENARIOS_BY_TRACK[track] || null;
}

export default ALL;
