import { useEffect, useRef, useState } from 'react';
import { APP_NAME, APP_URL, APP_TAGLINE } from '../config.js';
import {
  formatPrecision,
  formatGap,
  calibrationLabel,
  judgmentLine,
} from '../lib/scoring.js';

// Count-up from 0 to target over ~1.2s. Returns the current integer value.
function useCountUp(target, run = true, duration = 1200) {
  const [val, setVal] = useState(run ? 0 : target);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!run) {
      setVal(target);
      return undefined;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, run, duration]);

  return val;
}

export default function Scorecard({ result, trackName, onAnotherTrack }) {
  const { scenario, scoring, streak, replay } = result;
  const { caughtFlaws, totalFlaws, precision, calibrationGap } = scoring;

  const caughtAnim = useCountUp(caughtFlaws, !replay);
  const gapAnim = useCountUp(Math.abs(calibrationGap), !replay);
  const precPct = precision == null ? null : Math.round(precision * 100);
  const precAnim = useCountUp(precPct ?? 0, !replay && precPct != null);

  const [toast, setToast] = useState(false);

  const label = calibrationLabel(calibrationGap);
  const judgment = judgmentLine({
    caughtFlaws,
    totalFlaws,
    totalFlags: scoring.totalFlags,
    precision,
    calibrationGap,
  });

  function buildShareText() {
    const blocks =
      '▓'.repeat(caughtFlaws) + '░'.repeat(Math.max(0, totalFlaws - caughtFlaws));
    return [
      `${APP_NAME} — ${trackName} · Mission ${scenario.missionNumber}`,
      `Caught ${blocks} ${caughtFlaws}/${totalFlaws}`,
      `Calibration ${formatGap(calibrationGap)} (${label.toLowerCase()})`,
      `Precision ${formatPrecision(precision)}`,
      `${APP_TAGLINE} ${APP_URL}`,
    ].join('\n');
  }

  async function share() {
    const text = buildShareText();
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Fallback for browsers / contexts without async clipboard.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setToast(true);
      window.clearTimeout(share._t);
      share._t = window.setTimeout(() => setToast(false), 1800);
    }
  }

  const segments = Array.from({ length: totalFlaws }, (_, i) => i < caughtFlaws);

  return (
    <div className="screen screen--center scorecard">
      <div className="mission-head">
        <span className="eyebrow">
          {trackName} · Mission {scenario.missionNumber}
        </span>
        <h1 className="mission-title">{scenario.title}</h1>
        {replay && <p className="mission-role">You’ve already run this one today. Here’s how it went.</p>}
      </div>

      <div className="card metric metric--hero">
        <div className="metric__label">Catch rate</div>
        <div className="metric__value metric__value--hero">
          {caughtAnim}
          <span className="metric__denom">/{totalFlaws}</span>
        </div>
        <div className="segbar">
          {segments.map((on, i) => (
            <span key={i} className={`segbar__seg${on ? ' segbar__seg--on' : ''}`} />
          ))}
        </div>
      </div>

      <div className="metric-row">
        <div className="card metric">
          <div className="metric__label">Calibration gap</div>
          <div className="metric__value">
            {calibrationGap < 0 ? '−' : calibrationGap > 0 ? '+' : ''}
            {gapAnim}
          </div>
          <div className="metric__sub">{label}</div>
        </div>

        <div className="card metric">
          <div className="metric__label">Precision</div>
          <div className="metric__value">
            {precPct == null ? '—' : `${precAnim}%`}
          </div>
          <div className="metric__sub">
            {precPct == null ? 'No flags placed' : 'of your flags were real'}
          </div>
        </div>
      </div>

      <div className="card judgment">{judgment}</div>

      <div className="scorecard__streak">
        <span className="streak-dot" />
        {streak}-day streak
      </div>

      <div className="scorecard__actions">
        <button type="button" className="btn btn--primary btn--block" onClick={share}>
          Share result
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={onAnotherTrack}>
          Try another track →
        </button>
      </div>

      <div className={`toast${toast ? ' toast--show' : ''}`} role="status" aria-live="polite">
        Copied
      </div>
    </div>
  );
}
