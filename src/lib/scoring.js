// Pure, deterministic scoring + scenario schema validation.
// No side effects, no I/O, no LLM calls.

import { TOTAL_FLAWS } from '../config.js';

const VALID_FLAW_TYPES = new Set([
  'fabricated_statistic',
  'contradicts_data',
  'misread_trend',
  'missed_signal',
  'phantom_source',
  'stale_information',
]);

const VALID_DECISIONS = new Set(['use_as_is', 'fix_first', 'reject']);

/**
 * Returns the set of claim ids that are flawed.
 */
export function flawedClaimIds(scenario) {
  return scenario.claims.filter((c) => c.flawed).map((c) => c.id);
}

/**
 * Core scoring. Pure function.
 * @param {object} scenario - the loaded scenario
 * @param {string[]} flaggedIds - claim ids the player flagged
 * @param {number} preTrustRating - 0..100 the player committed at the bet
 * @returns scoring breakdown
 */
export function score(scenario, flaggedIds, preTrustRating) {
  const flagged = new Set(flaggedIds);
  const flaws = scenario.claims.filter((c) => c.flawed);
  const totalFlaws = flaws.length; // expected to be TOTAL_FLAWS (4)

  const caughtFlaws = flaws.filter((c) => flagged.has(c.id)).length;
  const totalFlags = flagged.size;

  // Precision: of the flags placed, how many were real flaws.
  // If zero flags placed, precision is undefined → display "—".
  const precision = totalFlags === 0 ? null : caughtFlaws / totalFlags;

  const calibrationGap = preTrustRating - scenario.objectiveReliability;

  return {
    caughtFlaws,
    totalFlaws,
    totalFlags,
    catchRate: caughtFlaws / totalFlaws,
    precision, // number 0..1 or null
    calibrationGap, // signed integer
    calibrationLabel: calibrationLabel(calibrationGap),
    judgment: judgmentLine({ caughtFlaws, totalFlaws, totalFlags, precision, calibrationGap }),
  };
}

export function calibrationLabel(gap) {
  if (gap > 15) return 'Over-trusting';
  if (gap < -15) return 'Over-skeptical';
  return 'Calibrated';
}

/**
 * Judgment summary, chosen by the rules in spec §4, in priority order.
 */
export function judgmentLine({ caughtFlaws, totalFlaws, totalFlags, precision, calibrationGap }) {
  const catchRate = caughtFlaws / totalFlaws;
  const prec = precision == null ? 0 : precision;

  if (catchRate >= 3 / 4 && prec >= 0.7) {
    return 'Sharp eye, disciplined flags. This is what strong verification looks like.';
  }
  if (catchRate >= 3 / 4 && prec < 0.7) {
    return 'You catch what’s wrong — but you also shoot at things that aren’t. Precision is the next gear.';
  }
  if (catchRate <= 1 / 4 && calibrationGap > 15) {
    return 'The brief sounded confident, and you believed it. That’s exactly how bad AI output travels.';
  }
  if (totalFlags === 0) {
    return 'You trusted it completely. Tomorrow’s call would have been built on it.';
  }
  return 'You sensed something was off — sharpening *where* it’s off is the skill to build.';
}

/**
 * Format precision for display. Returns "—" when null.
 */
export function formatPrecision(precision) {
  if (precision == null) return '—';
  return `${Math.round(precision * 100)}%`;
}

export function formatGap(gap) {
  return gap > 0 ? `+${gap}` : `${gap}`;
}

// ---------------------------------------------------------------------------
// Schema validation. Console.warns on any malformed scenario; returns boolean.
// ---------------------------------------------------------------------------

export function validateScenario(scenario) {
  const problems = [];
  const id = scenario && scenario.id ? scenario.id : '(unknown)';

  if (!scenario || typeof scenario !== 'object') {
    console.warn('[Catchrate] scenario is not an object');
    return false;
  }

  requireString('id', scenario.id);
  requireString('track', scenario.track);
  requireString('title', scenario.title);
  requireString('roleLine', scenario.roleLine);
  requireString('setup', scenario.setup);
  requireString('artifactTitle', scenario.artifactTitle);
  requireString('artifactMeta', scenario.artifactMeta);

  if (typeof scenario.missionNumber !== 'number') {
    problems.push('missionNumber must be a number');
  }
  if (
    typeof scenario.objectiveReliability !== 'number' ||
    scenario.objectiveReliability < 0 ||
    scenario.objectiveReliability > 100
  ) {
    problems.push('objectiveReliability must be a number 0..100');
  }

  // Claims
  if (!Array.isArray(scenario.claims)) {
    problems.push('claims must be an array');
  } else {
    if (scenario.claims.length < 10 || scenario.claims.length > 12) {
      problems.push(`claims length must be 10..12 (got ${scenario.claims.length})`);
    }
    const ids = new Set();
    let flawCount = 0;
    let internalCount = 0;
    let contextCount = 0;
    scenario.claims.forEach((c, i) => {
      if (!c || typeof c !== 'object') {
        problems.push(`claim[${i}] is not an object`);
        return;
      }
      if (typeof c.id !== 'string') problems.push(`claim[${i}].id missing`);
      else if (ids.has(c.id)) problems.push(`duplicate claim id "${c.id}"`);
      else ids.add(c.id);
      if (typeof c.text !== 'string' || c.text.trim() === '') {
        problems.push(`claim "${c.id}" missing text`);
      }
      if (typeof c.flawed !== 'boolean') {
        problems.push(`claim "${c.id}" missing boolean "flawed"`);
      }
      if (c.flawed) {
        flawCount += 1;
        const f = c.flaw;
        if (!f || typeof f !== 'object') {
          problems.push(`flawed claim "${c.id}" missing flaw object`);
        } else {
          if (!VALID_FLAW_TYPES.has(f.type)) {
            problems.push(`claim "${c.id}" invalid flaw.type "${f.type}"`);
          }
          if (f.detectability !== 'internal' && f.detectability !== 'context') {
            problems.push(`claim "${c.id}" flaw.detectability must be internal|context`);
          } else if (f.detectability === 'internal') {
            internalCount += 1;
          } else {
            contextCount += 1;
          }
          requireFlawString(problems, c.id, 'label', f.label);
          requireFlawString(problems, c.id, 'explanation', f.explanation);
          requireFlawString(problems, c.id, 'consequence', f.consequence);
        }
      } else if (c.flaw) {
        problems.push(`claim "${c.id}" is not flawed but has a flaw object`);
      }
    });

    if (flawCount !== TOTAL_FLAWS) {
      problems.push(`must have exactly ${TOTAL_FLAWS} flawed claims (got ${flawCount})`);
    }
    if (internalCount !== 2) {
      problems.push(`must have exactly 2 internal flaws (got ${internalCount})`);
    }
    if (contextCount !== 2) {
      problems.push(`must have exactly 2 context flaws (got ${contextCount})`);
    }
  }

  // soundNotes
  if (scenario.soundNotes && typeof scenario.soundNotes === 'object') {
    const noteCount = Object.keys(scenario.soundNotes).length;
    if (noteCount < 4) {
      problems.push(`soundNotes should cover at least 4 sound claims (got ${noteCount})`);
    }
  } else {
    problems.push('soundNotes missing or not an object');
  }

  // Sources
  if (!Array.isArray(scenario.sources)) {
    problems.push('sources must be an array');
  } else if (scenario.sources.length < 2 || scenario.sources.length > 3) {
    problems.push(`sources must be 2..3 documents (got ${scenario.sources.length})`);
  } else {
    scenario.sources.forEach((s, i) => {
      if (typeof s.id !== 'string') problems.push(`source[${i}].id missing`);
      if (typeof s.label !== 'string') problems.push(`source[${i}].label missing`);
      if (typeof s.content !== 'string' || s.content.trim() === '') {
        problems.push(`source[${i}].content missing`);
      } else {
        const words = s.content.trim().split(/\s+/).length;
        if (words > 150) {
          problems.push(`source "${s.id}" exceeds 150 words (${words})`);
        }
      }
    });
  }

  // Decision
  if (!scenario.decision || typeof scenario.decision !== 'object') {
    problems.push('decision missing');
  } else {
    requireString('decision.question', scenario.decision.question);
    const v = scenario.decision.verdicts;
    if (!v || typeof v !== 'object') {
      problems.push('decision.verdicts missing');
    } else {
      VALID_DECISIONS.forEach((d) => {
        if (typeof v[d] !== 'string' || v[d].trim() === '') {
          problems.push(`decision.verdicts.${d} missing`);
        }
      });
    }
  }

  if (problems.length > 0) {
    console.warn(
      `[Catchrate] scenario "${id}" failed validation:\n  - ${problems.join('\n  - ')}`
    );
    return false;
  }
  return true;

  function requireString(key, val) {
    if (typeof val !== 'string' || val.trim() === '') {
      problems.push(`missing/empty string field "${key}"`);
    }
  }
}


function requireFlawString(problems, claimId, key, val) {
  if (typeof val !== 'string' || val.trim() === '') {
    problems.push(`claim "${claimId}" flaw.${key} missing`);
  }
}
