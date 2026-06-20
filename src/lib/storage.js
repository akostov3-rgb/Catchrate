// localStorage persistence. Tolerant of missing/corrupt data.

const KEY = 'catchrate.v1';

function emptyState() {
  return {
    track: null,
    history: [],
    streak: 0,
    lastPlayed: null,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      track: parsed.track ?? null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      lastPlayed: parsed.lastPlayed ?? null,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode etc.) — fail silently.
  }
}

export function setTrack(state, track) {
  const next = { ...state, track };
  saveState(next);
  return next;
}

// Local YYYY-MM-DD (not UTC) so "today" matches the player's calendar.
export function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(aISO, bISO) {
  const a = new Date(`${aISO}T00:00:00`);
  const b = new Date(`${bISO}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

/**
 * Record a completed run. Handles streak logic and same-day replays.
 * - Streak +1 if lastPlayed was yesterday.
 * - Streak reset to 1 if lastPlayed older than yesterday.
 * - Streak unchanged if already played today.
 * Completing other tracks the same day does not double-count the streak.
 */
export function recordResult(state, result, today = todayISO()) {
  const entry = {
    date: today,
    scenarioId: result.scenarioId,
    track: result.track,
    catch: result.caughtFlaws,
    of: result.totalFlaws,
    calibrationGap: result.calibrationGap,
    precision: result.precision == null ? null : Math.round(result.precision * 100),
    decision: result.decision,
  };

  let streak = state.streak || 0;
  if (!state.lastPlayed) {
    streak = 1;
  } else {
    const gap = daysBetween(state.lastPlayed, today);
    if (gap === 0) {
      // Already played today — streak unchanged (could be a different track).
      streak = streak || 1;
    } else if (gap === 1) {
      streak = streak + 1;
    } else if (gap > 1) {
      streak = 1;
    }
    // gap < 0 (clock moved back) — leave streak as-is.
  }

  const next = {
    ...state,
    history: [...state.history, entry],
    streak,
    lastPlayed: today,
  };
  saveState(next);
  return next;
}

/**
 * Has the player already completed this track's mission today?
 */
export function playedTrackToday(state, track, today = todayISO()) {
  return state.history.some((h) => h.date === today && h.track === track);
}

/**
 * Most recent history entry for a track today (for the landing scorecard).
 */
export function latestTodayForTrack(state, track, today = todayISO()) {
  const matches = state.history.filter((h) => h.date === today && h.track === track);
  return matches.length ? matches[matches.length - 1] : null;
}
