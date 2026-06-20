import { TRACK_BY_ID } from '../config.js';

export default function Setup({ scenario, onBegin }) {
  const track = TRACK_BY_ID[scenario.track];
  return (
    <div className="screen screen--center">
      <div className="mission-head">
        <span className="eyebrow">
          {track?.name} · Mission {scenario.missionNumber}
        </span>
        <h1 className="mission-title">{scenario.title}</h1>
        <p className="mission-role">{scenario.roleLine}</p>
      </div>

      <div className="card setup-card">
        <p className="setup-text">{scenario.setup}</p>
        <div className="setup-meta">
          <span className="dot" /> Source documents are attached. Some problems only show up there.
        </div>
      </div>

      <button type="button" className="btn btn--primary btn--block" onClick={onBegin}>
        Open the brief →
      </button>
    </div>
  );
}
