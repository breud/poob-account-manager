import type { ActivityPoint, ActivityEvent, Tag } from '../types';

export const TAGS: Tag[] = [
  { id: 1, name: 'Example', color: '#9EFF00' },
];

export const ACTIVITY_DATA: ActivityPoint[] = [
  { day: 'Mon', sessions: 0, launches: 0 },
  { day: 'Tue', sessions: 0, launches: 0 },
  { day: 'Wed', sessions: 0, launches: 0 },
  { day: 'Thu', sessions: 0, launches: 0 },
  { day: 'Fri', sessions: 0, launches: 0 },
  { day: 'Sat', sessions: 0, launches: 0 },
  { day: 'Sun', sessions: 0, launches: 0 },
];

export const RECENT_EVENTS: ActivityEvent[] = [];
