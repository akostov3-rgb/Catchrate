import { useEffect, useMemo, useState } from 'react';
import { TRACK_BY_ID } from './config.js';
import { getScenarioForTrack } from './scenarios/index.js';
import { score } from './lib/scoring.js';
import {
  loadState,
  setTrack as persistTrack,
  recordResult,
  playedTrackToday,
  latestTodayForTrack,
} from './lib/storage.js';

import RoleSelect from './components/RoleSelect.jsx';
import Setup from './components/Setup.jsx';
import Bet from './components/Bet.jsx';
import Review from './components/Review.jsx';
import Decision from './components/Decision.jsx';
import Reveal from './components/Reveal.jsx';
import Scorecard from './components/Scorecard.jsx';
import Phase from './components/Phase.jsx';

// Phase machine: roleSelect → setup → bet → review → decision → reveal → scorecard
const PHASES = ['roleSelect', 'setup', 'bet', 'review', 'decision', 'reveal', 'scorecard'];

export default function App() {
  const [store, setStore] = useState(() => loadState());
  const [phase, setPhase] = useState('roleSelect');

  // In-run state
  const [track, setTrackState] = useState(store.track);
  const [bet, setBet] = useState(null);
  const [flags, setFlags] = useState([]);
  const [decision, setDecision] = useState(null);
  // Result of the completed run (persisted entry + scoring), shown on scorecard.
  const [result, setResult] = useState(null);

  const scenario = useMemo(() => (track ? getScenarioForTrack(track) : null), [track]);

  // On first mount, decide the landing phase.
  useEffect(() => {
    if (store.track) {
      setTrackState(store.track);
      if (playedTrackToday(store, store.track)) {
        // Already completed today's mission for this track → land on the scorecard.
        const entry = latestTodayForTrack(store, store.track);
        if (entry) {
          setResult(buildResultFromEntry(entry));
          setPhase('scorecard');
          return;
        }
      }
      setPhase('setup');
    } else {
      setPhase('roleSelect');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseTrack(nextTrack) {
    const next = persistTrack(store, nextTrack);
    setStore(next);
    setTrackState(nextTrack);
    resetRun();
    if (playedTrackToday(next, nextTrack)) {
      const entry = latestTodayForTrack(next, nextTrack);
      setResult(buildResultFromEntry(entry));
      setPhase('scorecard');
    } else {
      setPhase('setup');
    }
  }

  function resetRun() {
    setBet(null);
    setFlags([]);
    setDecision(null);
    setResult(null);
  }

  function commitBet(value) {
    setBet(value);
    setPhase('review');
  }

  function finishReview(flaggedIds) {
    setFlags(flaggedIds);
    setPhase('decision');
  }

  function commitDecision(choice) {
    setDecision(choice);
    setPhase('reveal');
  }

  function finishReveal() {
    // Compute score, persist, and move to the scorecard.
    const s = score(scenario, flags, bet);
    const persisted = recordResult(store, {
      scenarioId: scenario.id,
      track: scenario.track,
      caughtFlaws: s.caughtFlaws,
      totalFlaws: s.totalFlaws,
      calibrationGap: s.calibrationGap,
      precision: s.precision,
      decision,
    });
    setStore(persisted);
    setResult({
      scenario,
      bet,
      flags,
      decision,
      scoring: s,
      streak: persisted.streak,
      replay: false,
    });
    setPhase('scorecard');
  }

  // Rebuild a lightweight result object for the landing scorecard (replay case).
  function buildResultFromEntry(entry) {
    const sc = getScenarioForTrack(entry.track);
    return {
      scenario: sc,
      bet: null,
      flags: null,
      decision: entry.decision,
      scoring: {
        caughtFlaws: entry.catch,
        totalFlaws: entry.of,
        catchRate: entry.catch / entry.of,
        precision: entry.precision == null ? null : entry.precision / 100,
        totalFlags: null,
        calibrationGap: entry.calibrationGap,
      },
      streak: store.streak,
      replay: true,
    };
  }

  function tryAnotherTrack() {
    resetRun();
    setPhase('roleSelect');
  }

  return (
    <div className="app">
      {phase === 'roleSelect' && (
        <Phase keyName="roleSelect">
          <RoleSelect currentTrack={track} onChoose={chooseTrack} streak={store.streak} />
        </Phase>
      )}

      {phase === 'setup' && scenario && (
        <Phase keyName="setup">
          <Setup scenario={scenario} onBegin={() => setPhase('bet')} />
        </Phase>
      )}

      {phase === 'bet' && scenario && (
        <Phase keyName="bet">
          <Bet scenario={scenario} onCommit={commitBet} />
        </Phase>
      )}

      {phase === 'review' && scenario && (
        <Phase keyName="review">
          <Review scenario={scenario} initialFlags={flags} onAdvance={finishReview} />
        </Phase>
      )}

      {phase === 'decision' && scenario && (
        <Phase keyName="decision">
          <Decision scenario={scenario} onCommit={commitDecision} />
        </Phase>
      )}

      {phase === 'reveal' && scenario && (
        <Phase keyName="reveal">
          <Reveal
            scenario={scenario}
            flags={flags}
            bet={bet}
            decision={decision}
            onFinish={finishReveal}
          />
        </Phase>
      )}

      {phase === 'scorecard' && result && (
        <Phase keyName="scorecard">
          <Scorecard
            result={result}
            trackName={TRACK_BY_ID[result.scenario.track]?.name}
            onAnotherTrack={tryAnotherTrack}
          />
        </Phase>
      )}
    </div>
  );
}
