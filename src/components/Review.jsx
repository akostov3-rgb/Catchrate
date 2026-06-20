import { useState } from 'react';
import SourcesDrawer from './SourcesDrawer.jsx';

export default function Review({ scenario, initialFlags, onAdvance }) {
  const [flags, setFlags] = useState(() => new Set(initialFlags || []));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSource, setDrawerSource] = useState(scenario.sources[0]?.id);

  function toggle(id) {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openSource(id) {
    setDrawerSource(id);
    setDrawerOpen(true);
  }

  const count = flags.size;

  return (
    <div className="screen review">
      <div className="review__topbar">
        <div className="review__topbar-inner">
          <span className="review__crumb">Reviewing the brief</span>
          <button type="button" className="sources-toggle" onClick={() => setDrawerOpen(true)}>
            Sources ({scenario.sources.length})
          </button>
        </div>
        <div className="source-chips">
          <span className="source-chips__hint">Cross-check:</span>
          {scenario.sources.map((s) => (
            <button
              key={s.id}
              type="button"
              className="source-chip"
              onClick={() => openSource(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="artifact">
        <div className="artifact__header">
          <h1 className="artifact__title">{scenario.artifactTitle}</h1>
          <div className="artifact__meta">{scenario.artifactMeta}</div>
        </div>

        <p className="artifact__instruction">
          Tap any line you don’t trust. Some problems are only visible in the sources.
        </p>

        <div className="claims">
          {scenario.claims.map((c, i) => {
            const flagged = flags.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`claim${flagged ? ' claim--flagged' : ''}`}
                onClick={() => toggle(c.id)}
                aria-pressed={flagged}
              >
                <span className="claim__index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="claim__text">{c.text}</span>
                <span className="claim__flag" aria-hidden="true">
                  {flagged ? 'FLAGGED' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="review__spacer" />

      <div className="action-bar">
        <div className="action-bar__count">
          <span className="action-bar__num">{count}</span>
          <span className="action-bar__label">{count === 1 ? 'line flagged' : 'lines flagged'}</span>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onAdvance([...flags])}
        >
          Make my call →
        </button>
      </div>

      <SourcesDrawer
        sources={scenario.sources}
        open={drawerOpen}
        activeId={drawerSource}
        onClose={() => setDrawerOpen(false)}
        onSelect={setDrawerSource}
      />
    </div>
  );
}
