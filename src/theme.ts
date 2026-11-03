import { useColorScheme } from 'react-native';

/** Paleta do jogo (gramado escuro e o amarelo da camisa 10), com variante clara. */
const dark = {
  bg: '#0b2419',
  bg2: '#123d2c',
  card: '#12382a',
  cardHi: '#174632',
  ink: '#f4f2ea',
  mut: '#9db8a8',
  line: 'rgba(241,239,230,0.16)',
  lineStrong: 'rgba(241,239,230,0.3)',
  acc: '#f4c20d',
  accHi: '#ffdb4d',
  accSoft: 'rgba(244,194,13,0.14)',
  accText: '#10261c',
  bad: '#ff7a70',
  badSoft: 'rgba(255,122,112,0.14)',
  good: '#7be495',
  goodSoft: 'rgba(123,228,149,0.14)',
  warn: '#ffb547',
  stripe: 'rgba(255,255,255,0.025)',
  shadow: '#000000',
};

const light: typeof dark = {
  bg: '#e3eee0',
  bg2: '#cfe3cb',
  card: '#ffffff',
  cardHi: '#f6faf4',
  ink: '#10261c',
  mut: '#4d6a58',
  line: 'rgba(16,38,28,0.12)',
  lineStrong: 'rgba(16,38,28,0.25)',
  acc: '#e0ae00',
  accHi: '#f7cb2a',
  accSoft: 'rgba(224,174,0,0.14)',
  accText: '#10261c',
  bad: '#c0362c',
  badSoft: 'rgba(192,54,44,0.1)',
  good: '#1b7a3d',
  goodSoft: 'rgba(27,122,61,0.1)',
  warn: '#b86e00',
  stripe: 'rgba(16,38,28,0.03)',
  shadow: '#2b4a37',
};

export type Theme = typeof dark;

export function useTheme(): Theme {
  return useColorScheme() === 'light' ? light : dark;
}

/** Famílias carregadas em src/app/_layout.tsx. */
export const font = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  bold: 'Barlow_700Bold',
  display: 'BarlowCondensed_800ExtraBold',
  displayBold: 'BarlowCondensed_700Bold',
  displayMedium: 'BarlowCondensed_600SemiBold',
};

/** Títulos e números grandes. */
export const condensed = { fontFamily: font.display };

/** Cor da chance de sucesso: verde, amarelo ou vermelho. */
export function chanceColor(t: Theme, chance: number) {
  return chance >= 65 ? t.good : chance >= 40 ? t.acc : t.bad;
}
