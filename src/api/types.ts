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
  /** Liga atual (nula na base). */
  league: string | null;
  /** "A", "B" ou "C" (nula na base). */
  division: string | null;
  clubCountryFlag: string;
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
  /** Competição de cada dia da temporada (20 posições; nulo = sem jogo). */
  matchDays?: (CompetitionKind | null)[];
  /** Data atual (ex.: "18 de janeiro"); nula antes da primeira rodada. */
  date?: string | null;
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
  competition: { name: string; subtitle: string; kind: CompetitionKind } | null;
  routine: { club: string; clubBadge: Badge; sessions: number; focus: string; focusName: string } | null;
  visual: 'trophy' | 'ball' | null;
  isPenalty: boolean;
  options: { label: string; check: CheckView | null }[];
  penaltyZones: string[] | null;
  shotSkill: number | null;
  /** Faixa de força ideal da barra do pênalti. */
  penaltyPower: { idealMin: number; idealMax: number } | null;
  /** Lance de partida: campo com placar e narração até o lance. */
  match?: MatchView | null;
}

export type MatchLineType = 'info' | 'chance-for' | 'chance-against' | 'goal-for' | 'goal-against' | 'whistle' | 'decision';

export interface MatchLine {
  minute: number;
  text: string;
  type: MatchLineType;
  /** Placar do time do jogador depois da linha. */
  for: number;
  against: number;
}

/** Jogo ao vivo. for/against são do time do jogador. */
export interface MatchView {
  team: string;
  opponent: string;
  teamBadge: Badge;
  opponentBadge: Badge;
  home: boolean;
  kind: CompetitionKind;
  competition: string;
  startFor: number;
  startAgainst: number;
  lines: MatchLine[];
  /** Onde está a bola no lance: pre, attack, defense, center, penalty, cup (ou result depois da decisão). */
  focus: 'pre' | 'attack' | 'defense' | 'center' | 'penalty' | 'cup' | 'result';
  final: boolean;
  position: string;
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
  match?: MatchView | null;
}

export interface CalendarView {
  dayDone: number;
  nextDay: number;
  intro: string;
  cells: {
    day: number;
    done: boolean;
    match: boolean;
    window: boolean;
    kind: CompetitionKind | null;
    competition: string | null;
    month?: number;
    dayOfMonth?: number;
    monthLabel?: string;
  }[];
  strip: { offset: number; weekday: string; day: number; month: string; icon: string; kind?: CompetitionKind | null }[];
  stripFrom: number;
  stripTo: number;
  agenda: { icon: string; title: string; detail: string; kind: CompetitionKind | null }[];
  /** Legenda: competições da temporada e como cada uma está. */
  competitions: { kind: CompetitionKind; name: string; status: string; out: boolean; champion: boolean; games: number }[];
  /** Data da próxima rodada (ex.: "29 de março"). */
  nextDate?: string;
  total?: number;
  /** Ex.: "Temporada de janeiro a dezembro". */
  seasonSpan?: string;
}

/** league (liga), state (estadual), cup (copa nacional), continental ou national (seleção). */
export type CompetitionKind = 'league' | 'state' | 'cup' | 'continental' | 'national';

export interface OfferView {
  index: number;
  clubId: string | null;
  club: string;
  clubBadge: Badge;
  country: string;
  countryFlag: string;
  signingBonus: number;
  salary: number;
  fee: number;
  sessions: number;
  focusName: string;
  league: string | null;
  division: string | null;
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
  leagueName: string | null;
  rank: number;
  leagueSize: number;
  /** "up" (acesso), "down" (rebaixamento) ou nulo. */
  movement: 'up' | 'down' | null;
  table: { position: number; club: string; mine: boolean; zone: 'up' | 'down' | null }[];
  /** Copas da temporada (estadual, copa nacional, continental). */
  cups?: { kind: CompetitionKind; name: string; result: string; champion: boolean }[];
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
  /** Clubes em destaque para começar rápido. */
  baseClubs: { id: string; name: string; tier: number; badge: Badge }[];
  /** As 211 seleções, da mais forte para a mais fraca. */
  nations: { name: string; flag: string; confederation: string }[];
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

// ---------------------------------------------------------------- mundo

export interface CountrySummary {
  iso: string;
  name: string;
  flag: string;
  confederation: string;
  quality: number;
  leagues: { division: number; letter: string; name: string; clubs: number }[];
}

export interface WorldClubView {
  id: string;
  name: string;
  tier: number;
  fictional: boolean;
  badge: Badge;
}

export interface CountryView {
  iso: string;
  name: string;
  flag: string;
  confederation: string;
  leagues: { division: number; letter: string; name: string; clubs: WorldClubView[] }[];
}

export interface ClubSearchResult {
  id: string;
  name: string;
  country: string;
  flag: string;
  league: string;
  letter: string;
  tier: number;
  fictional: boolean;
  badge: Badge;
}
