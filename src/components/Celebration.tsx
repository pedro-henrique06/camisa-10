import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

/*
 * Comemorações em Lottie. Os arquivos ficam em assets/lottie e são gerados por
 * tools/lottie/generate.py; para usar uma animação do LottieFiles, troque o .json
 * mantendo o nome.
 */
const SOURCES = {
  /** Fogos de artifício (gol). */
  fogos: require('../../assets/lottie/fogos.json'),
  /** Chuva de confete (títulos, promoção, Bola de Ouro). */
  confete: require('../../assets/lottie/confete.json'),
  /** Raios de luz girando atrás de troféus (em loop). */
  raios: require('../../assets/lottie/raios.json'),
};

export type CelebrationKind = keyof typeof SOURCES;

type Props = {
  kind: CelebrationKind;
  /** Repete sem parar (usado nos raios). */
  loop?: boolean;
  /** Espera antes de começar, em ms. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Animação de comemoração por cima do conteúdo, sem bloquear toques.
 * Não aparece quando o sistema pede para reduzir movimento.
 */
export function Celebration({ kind, loop, delay = 0, style }: Props) {
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [started, setStarted] = useState(delay === 0);
  const [finished, setFinished] = useState(false);
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => alive && setReduced(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (delay === 0) return;
    const id = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  useEffect(() => {
    if (!started || reduced !== false) return;
    Animated.timing(fade, { toValue: 1, duration: loop ? 500 : 120, useNativeDriver: true }).start();
  }, [started, reduced, loop, fade]);

  if (reduced !== false || !started || finished) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 10 }, style]}>
      <LottieView
        source={SOURCES[kind]}
        autoPlay
        loop={!!loop}
        resizeMode={kind === 'confete' ? 'cover' : 'contain'}
        style={StyleSheet.absoluteFill}
        webStyle={{ width: '100%', height: '100%' }}
        onAnimationFinish={(cancelled) => {
          if (!loop && !cancelled) setFinished(true);
        }}
      />
    </Animated.View>
  );
}
