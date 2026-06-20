import { APP_NAME, TRACKS } from '../config.js';

export default function RoleSelect({ currentTrack, onChoose, streak }) {
  return (
    <div className="screen screen--center">
      <header className="masthead">
        <div className="masthead__kicker">The Daily Catch</div>
        <h1 className="masthead__title">{APP_NAME}</h1>
        <p className="masthead__lede">
          Every day, one AI-generated brief lands on your desk — plausible, confident, and
          quietly wrong in places. Read it the way the work demands. See how much you catch.
        </p>
        {streak > 0 && (
          <div className="masthead__streak">
            <span className="streak-dot" /> {streak}-day streak
          </div>
        )}
      </header>

      <div className="role-prompt">
        <span className="eyebrow">Choose your desk</span>
      </div>

      <ul className="track-list">
        {TRACKS.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={`track-card${currentTrack === t.id ? ' track-card--active' : ''}`}
              onClick={() => onChoose(t.id)}
            >
              <span className="track-card__name">{t.name}</span>
              <span className="track-card__blurb">{t.blurb}</span>
              <span className="track-card__chevron" aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="footnote">No accounts. No data leaves this device. About five minutes.</p>
    </div>
  );
}
