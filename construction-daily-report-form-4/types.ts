export interface WeatherReport {
  lowTemp: string;
  highTemp: string;
  avgTemp: string;
  morning: string;
  afternoon: string;
  evening: string;
  avgWind: string;
  maxWind: string;
  gustWind: string;
  comments: string;
}

export interface ManpowerLogEntry {
  id: string;
  company: string;
  trades: string;
  manpower: number;
  workDone: string;
  majorEquipment: string;
}

export interface ConcreteLogEntry {
  id:string;
  building: string;
  orderNumber: string;
  previousVolume: string;
  date: string;
  concreteMix: string;
  application: string;
  location: string;
  volumeAddedToday: string;
  newTotalVolume: string;
}

export interface SteelLogEntry {
  id: string;
  building: string;
  orderNumber: string;
  previousWeight: string;
  date: string;
  location: string;
  totalWeightAddedToday: string;
  newTotalWeight: string;
}

export interface DelayLogEntry {
  id: string;
  delayType: string;
  comments: string;
}

export interface AccidentLogEntry {
  id: string;
  details: string;
}

export interface VisitorLogEntry {
  id: string;
  visitor: string;
  startTime: string;
  endTime: string;
  details: string;
}

export interface RentalLogEntry {
  id: string;
  time: string;
  deliveryFrom: string;
  trackingNumber: string;
  contents: string;
}

export interface NotesLogEntry {
  id: string;
  issue: string;
  comments: string;
  issueDetails: string;
}

export interface PhotoLogEntry {
  id: string;
  file?: File;
  previewUrl: string;
  caption: string;
  isLoading?: boolean;
  progress?: number;
}

export interface DailyLogState {
  reportDate: string;
  address: string;
  project: string;
  weather: WeatherReport;
  manpower: ManpowerLogEntry[];
  concrete: ConcreteLogEntry[];
  steel: SteelLogEntry[];
  delay: DelayLogEntry[];
  accident: AccidentLogEntry[];
  visitor: VisitorLogEntry[];
  rental: RentalLogEntry[];
  notes: NotesLogEntry[];
  photos: PhotoLogEntry[];
}