import { useColorScheme } from 'react-native';

/** Paleta do jogo original (gramado escuro e amarelo da camisa 10), com variante clara. */
const dark = {
  bg: '#0d2b20',
  card: '#12382a',
  ink: '#f1efe6',
  mut: '#9db8a8',
  line: 'rgba(241,239,230,0.25)',
  acc: '#f4c20d',
  accText: '#10261c',
  bad: '#ff7a70',
  good: '#7be495',
};

const light: typeof dark = {
  bg: '#e6efe2',
  card: '#ffffff',
  ink: '#10261c',
  mut: '#4d6a58',
  line: 'rgba(16,38,28,0.25)',
  acc: '#d9a900',
  accText: '#ffffff',
  bad: '#b3261e',
  good: '#1b7a3d',
};

export type Theme = typeof dark;

export function useTheme(): Theme {
  return useColorScheme() === 'light' ? light : dark;
}

/** Fonte condensada para números e títulos (cai na fonte do sistema se não houver). */
export const condensed = { fontWeight: '800' as const, letterSpacing: -0.5 };
