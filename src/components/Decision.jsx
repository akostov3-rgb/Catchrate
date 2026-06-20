const OPTIONS = [
  {
    id: 'use_as_is',
    label: 'Use it as-is',
    sub: 'Forward it and prep from it tonight.',
  },
  {
    id: 'fix_first',
    label: 'Fix it first',
    sub: 'Correct what’s wrong, then use it.',
  },
  {
    id: 'reject',
    label: 'Don’t use it',
    sub: 'Start the prep from scratch.',
  },
];

export default function Decision({ scenario, onCommit }) {
  return (
    <div className="screen screen--center">
      <div className="mission-head">
        <span className="eyebrow">The call</span>
        <h1 className="mission-title">{scenario.decision.question}</h1>
      </div>

      <ul className="decision-list">
        {OPTIONS.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              className="decision-card"
              onClick={() => onCommit(o.id)}
            >
              <span className="decision-card__label">{o.label}</span>
              <span className="decision-card__sub">{o.sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
