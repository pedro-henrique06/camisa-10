// Tipos que espelham as views devolvidas pelo backend (camisa_10_back, Camisa10.Domain/Views).

export type Phase =
  | 'Calendar'
  | 'Event'
  | 'Penalty'
  | 'Result'
  | 'Market'
  | 'Swap'
  | 'Promotion'
  | 'SeasonSummary'
  | 'Decision'
  | 'Finished';

export type ActionType = 'Continue' | 'Choose' | 'Stay' | 'SearchClub' | 'Retire';

export interface Badge {
  primary: string;
  secondary: string;
  initials: string;
}

export interface BarView {
  key: string;
  label: string;
  value: number;
}

export interface AttributeView {
  key: string;
  name: string;
  short: string;
  value: number;
  delta: number;
  weightPercent: number;
}

export interface HudView {
  name: string;
  age: number;
  position: string;
  nation: string;
  nationFlag: string;
  seasonDay: number;
  club: string;
  clubBadge: Badge;
  clubLine: string;
  captain: boolean;
  base: boolean;
  contract: number;
  windowOpen: boolean;
  injury: number;
  money: number;
  salary: number;
  overall: number;
  bars: BarView[];
  attributes: AttributeView[];
  goals: number;
  assists: number;
  seasonGoals: number;
  seasonAssists: number;
  warnings: string[];
  canSearchClub: boolean;
}

export interface CheckView {
  attribute: string;
  attributeName: string;
  value: number;
  difficulty: number;
  chance: number;
}

export interface EventView {
  id: string | null;
  title: string;
  text: string;
  competition: { name: string; subtitle: string } | null;
  routine: { club: string; clubBadge: Badge; sessions: number; focus: string; focusName: string } | null;
  visual: 'trophy' | 'ball' | null;
  isPenalty: boolean;
  options: { label: string; check: CheckView | null }[];
  penaltyZones: string[] | null;
  shotSkill: number | null;
  /** Faixa de força ideal da barra do pênalti. */
  penaltyPower: { idealMin: number; idealMax: number } | null;
}

export interface PenaltyShot {
  /** 0-2 em cima, 3-5 embaixo, da esquerda para a direita. */
  zone: number;
  power: number;
  outcome: 'goal' | 'save' | 'post' | 'out';
  keeperZone: number;
}

export interface DiceView {
  attribute: string;
  attributeName: string;
  value: number;
  modifier: number;
  difficulty: number;
  roll: number;
  total: number;
}

export interface ResultView {
  title: string;
  chosen: string;
  text: string;
  success: boolean;
  dice: DiceView | null;
  chips: { text: string; up: boolean }[];
  anim: 'capt' | 'trophy' | 'ball' | null;
  penalty: PenaltyShot | null;
}

export interface CalendarView {
  dayDone: number;
  nextDay: number;
  intro: string;
  cells: { day: number; done: boolean; match: boolean; window: boolean }[];
  strip: { offset: number; weekday: string; day: number; month: string; icon: string }[];
  stripFrom: number;
  stripTo: number;
  agenda: { icon: string; title: string; detail: string }[];
}

export interface OfferView {
  index: number;
  club: string;
  clubBadge: Badge;
  country: string;
  countryFlag: string;
  signingBonus: number;
  salary: number;
  fee: number;
  sessions: number;
  focusName: string;
}

export interface MarketView {
  mode: 'ev' | 'ag' | 'bt';
  intro: string;
  releaseClause: number;
  offers: OfferView[];
  stayLabel: string;
}

export interface SeasonReport {
  season: number;
  club: string;
  games: number;
  goals: number;
  assists: number;
  decisiveGoals: number;
  decisiveAssists: number;
  rating: number;
  overallBefore: number;
  overallAfter: number;
  salary: number;
  net: number;
  commission: number;
  releaseClause: number;
  headline: string;
  era: string;
  profile: string;
  title: boolean;
}

export interface SeasonView {
  report: SeasonReport;
  rival: string;
  rivalClub: string | null;
  rivalOverall: number;
  rivalGoals: number;
  rivalTitles: number;
  totalGoals: number;
  totalAssists: number;
}

export interface FinalView {
  title: string;
  subtitle: string;
  games: number;
  goals: number;
  assists: number;
  titles: number;
  ballons: number;
  money: number;
  nationalTitles: number;
  profile: string;
  rival: string;
  rivalTitles: number;
  headlines: string[];
  shareText: string;
}

export interface GameView {
  id: string;
  version: number;
  phase: Phase;
  status: 'Active' | 'Finished';
  hud: HudView;
  event: EventView | null;
  result: ResultView | null;
  calendar: CalendarView | null;
  market: MarketView | null;
  swap: { current: string; suggested: string } | null;
  promotion: { club: string; clubBadge: Badge } | null;
  season: SeasonView | null;
  decision: { age: number } | null;
  final: FinalView | null;
}

export interface HistoryView {
  name: string;
  position: string;
  overall: number;
  attributes: AttributeView[];
  seasons: { age: number; club: string; overall: number; goals: number; assists: number; title: boolean }[];
  headlines: string[];
}

export interface PositionOption {
  name: string;
  short: string;
  description: string;
  /** Peso de cada atributo no overall, do maior para o menor. */
  weights: { key: string; name: string; percent: number }[];
}

export interface MetaView {
  baseClubs: { name: string; tier: number; badge: Badge }[];
  nations: { name: string; flag: string }[];
  positions: string[];
  /** Ausente em servidores antigos. */
  positionInfo?: PositionOption[];
}

export interface CareerSummary {
  id: string;
  name: string;
  age: number;
  club: string;
  position: string;
  status: 'Active' | 'Finished';
  finalTitle: string | null;
  updatedAt: string;
}
