import { formatGap, calibrationLabel } from '../lib/scoring.js';

export default function CalibrationBar({ bet, reality }) {
  const gap = bet - reality;
  const lo = Math.min(bet, reality);
  const hi = Math.max(bet, reality);
  const label = calibrationLabel(gap);

  return (
    <div className="calib">
      <div className="calib__statement">
        You rated this brief <strong className="calib__amber">{bet}</strong> out of 100. Its
        actual reliability: <strong className="calib__white">{reality}</strong>.
      </div>

      <div className="calib__track">
        <div
          className="calib__gap"
          style={{ left: `${lo}%`, width: `${hi - lo}%` }}
        />
        <div className="calib__marker calib__marker--bet" style={{ left: `${bet}%` }}>
          <span className="calib__tick calib__tick--bet" />
        </div>
        <div className="calib__marker calib__marker--reality" style={{ left: `${reality}%` }}>
          <span className="calib__tick calib__tick--reality" />
        </div>
      </div>

      <div className="calib__legend">
        <span className="calib__legend-item">
          <span className="calib__swatch calib__swatch--bet" /> Your bet
        </span>
        <span className="calib__legend-item">
          <span className="calib__swatch calib__swatch--reality" /> Reality
        </span>
        <span className="calib__legend-gap">
          {formatGap(gap)} · {label}
        </span>
      </div>
    </div>
  );
}
