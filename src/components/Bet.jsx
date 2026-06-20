import { useState } from 'react';

export default function Bet({ scenario, onCommit }) {
  const [value, setValue] = useState(50);

  return (
    <div className="screen screen--center">
      <div className="mission-head">
        <span className="eyebrow">First impression</span>
        <h1 className="mission-title bet-title">
          At first glance — how much would you trust this brief as-is?
        </h1>
        <p className="mission-role">
          You haven’t read it closely yet. Go with instinct. This is your baseline — once you
          commit, it’s locked.
        </p>
      </div>

      <div className="card bet-card">
        <div className="bet-value" aria-live="polite">
          {value}
          <span className="bet-value__unit">/100</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="slider"
          aria-label="Trust rating from 0 to 100"
        />

        <div className="slider-scale">
          <span>Trust nothing</span>
          <span>Trust completely</span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => onCommit(value)}
      >
        Lock it in →
      </button>
    </div>
  );
}
