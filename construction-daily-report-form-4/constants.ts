
import { DailyLogState } from './types';

export const INITIAL_STATE: DailyLogState = {
  reportDate: new Date().toISOString().split('T')[0],
  address: '1 Promenade Circle',
  project: 'Promenade Subdivision Phase 1 - Stage 1',
  weather: {
    lowTemp: '',
    highTemp: '',
    avgTemp: '',
    morning: '',
    afternoon: '',
    evening: '',
    avgWind: '',
    maxWind: '',
    gustWind: '',
    comments: '',
  },
  manpower: [],
  concrete: [],
  steel: [],
  delay: [],
  accident: [],
  visitor: [],
  rental: [],
  notes: [],
  photos: [],
};
   