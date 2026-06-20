// Single source of truth for app-level constants.
export const APP_NAME = 'Catchrate';
export const APP_URL = 'catchrate.app';
export const APP_TAGLINE = 'Can you catch what AI gets wrong?';

// Track definitions. `id` matches the scenario file's `track` field.
export const TRACKS = [
  {
    id: 'sales',
    name: 'Sales',
    blurb: 'Account briefs, renewal calls, pipeline reads.',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    blurb: 'Campaign readouts, channel performance, attribution.',
  },
  {
    id: 'finance',
    name: 'Finance',
    blurb: 'Forecast commentary, P&L narratives, cash reads.',
  },
  {
    id: 'hr',
    name: 'HR & Recruiting',
    blurb: 'Shortlist briefs, reference checks, scoring panels.',
  },
  {
    id: 'strategy',
    name: 'Strategy & Ops',
    blurb: 'Market-entry briefs, go/no-go calls, sizing.',
  },
];

export const TRACK_BY_ID = TRACKS.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

export const TOTAL_FLAWS = 4;
