import { useEffect, useMemo, useRef, useState } from 'react';
import CalibrationBar from './CalibrationBar.jsx';

const STAGGER_MS = 650;

export default function Reveal({ scenario, flags, bet, decision, onFinish }) {
  const flagSet = useMemo(() => new Set(flags || []), [flags]);

  // Build the ordered list of reveal items.
  const items = useMemo(() => {
    const list = [];

    const flaws = scenario.claims.filter((c) => c.flawed);
    flaws.forEach((c) => {
      list.push({
        kind: 'flaw',
        id: c.id,
        caught: flagSet.has(c.id),
        text: c.text,
        flaw: c.flaw,
      });
    });

    const falseFlags = scenario.claims.filter((c) => !c.flawed && flagSet.has(c.id));
    falseFlags.forEach((c) => {
      list.push({
        kind: 'falseFlag',
        id: c.id,
        text: c.text,
        note: scenario.soundNotes?.[c.id] || 'This one held up against the sources.',
      });
    });

    list.push({ kind: 'calibration', id: 'calib' });
    list.push({ kind: 'verdict', id: 'verdict' });
    return list;
  }, [scenario, flagSet]);

  const [shown, setShown] = useState(0);
  const timerRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    // Reveal first item promptly, then stagger the rest.
    setShown(1);
    let i = 1;
    timerRef.current = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= items.length) {
        clearInterval(timerRef.current);
      }
    }, STAGGER_MS);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  // Keep the latest revealed card in view.
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [shown]);

  const caughtCount = items.filter((it) => it.kind === 'flaw' && it.caught).length;
  const totalFlaws = items.filter((it) => it.kind === 'flaw').length;
  const allShown = shown >= items.length;

  return (
    <div className="screen reveal">
      <div className="reveal__head">
        <span className="eyebrow">The reveal</span>
        <h1 className="mission-title reveal__title">What was planted in this brief</h1>
        <p className="mission-role">
          Four problems were built into it — two visible in the brief itself, two only in the
          sources.
        </p>
      </div>

      <div className="reveal__stream">
        {items.slice(0, shown).map((it) => (
          <RevealItem
            key={it.id}
            item={it}
            bet={bet}
            reality={scenario.objectiveReliability}
            scenario={scenario}
            decision={decision}
            caughtCount={caughtCount}
            totalFlaws={totalFlaws}
          />
        ))}
        <div ref={endRef} />
      </div>

      <div className={`reveal__cta${allShown ? ' reveal__cta--ready' : ''}`}>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={onFinish}
          disabled={!allShown}
        >
          {allShown ? 'See your results →' : 'Revealing…'}
        </button>
      </div>
    </div>
  );
}

function RevealItem({ item, bet, reality, scenario, decision, caughtCount, totalFlaws }) {
  if (item.kind === 'flaw') {
    return (
      <div className={`reveal-card reveal-card--${item.caught ? 'caught' : 'missed'} animate-in`}>
        <div className="reveal-card__top">
          <span className={`verdict-pill verdict-pill--${item.caught ? 'caught' : 'missed'}`}>
            {item.caught ? 'Caught' : 'Missed'}
          </span>
          <span className="reveal-card__type">{item.flaw.label}</span>
        </div>
        <p className="reveal-card__claim">“{item.text}”</p>
        <p className="reveal-card__explain">{item.flaw.explanation}</p>
        <div className="reveal-card__consequence">
          <span className="reveal-card__conseq-label">If it had shipped</span>
          {item.flaw.consequence}
        </div>
      </div>
    );
  }

  if (item.kind === 'falseFlag') {
    return (
      <div className="reveal-card reveal-card--false animate-in">
        <div className="reveal-card__top">
          <span className="verdict-pill verdict-pill--false">Actually solid</span>
        </div>
        <p className="reveal-card__claim">“{item.text}”</p>
        <p className="reveal-card__explain">{item.note}</p>
      </div>
    );
  }

  if (item.kind === 'calibration') {
    return (
      <div className="reveal-card reveal-card--calib animate-in">
        <CalibrationBar bet={bet} reality={reality} />
      </div>
    );
  }

  if (item.kind === 'verdict') {
    const text = scenario.decision.verdicts[decision];
    return (
      <div className="reveal-card reveal-card--verdict animate-in">
        <div className="reveal-card__top">
          <span className="reveal-card__type">Your decision</span>
        </div>
        <p className="reveal-card__verdict">{text}</p>
        <div className="reveal-card__tally">
          You caught {caughtCount} of {totalFlaws}.
        </div>
      </div>
    );
  }

  return null;
}
