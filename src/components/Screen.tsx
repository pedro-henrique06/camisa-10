import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/** Fundo de gramado: gradiente com faixas sutis. */
export function PitchBackground() {
  const t = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[t.bg2, t.bg, t.bg]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.stripes}>
        {Array.from({ length: 14 }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? 'transparent' : t.stripe }} />
        ))}
      </View>
    </View>
  );
}

/**
 * Página rolável com largura máxima de 560. `footer` fica fixo no rodapé
 * (ação principal ao alcance do polegar).
 */
export function Screen({
  children,
  footer,
  scrollRef,
  footerSpace = 110,
}: {
  children: ReactNode;
  footer?: ReactNode;
  /** Espaço no fim da rolagem para o rodapé fixo não cobrir o conteúdo. */
  footerSpace?: number;
  scrollRef?: React.RefObject<React.ComponentRef<typeof ScrollView> | null>;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <PitchBackground />
      <SafeAreaView style={{ flex: 1 }} edges={footer ? ['top'] : ['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, footer ? { paddingBottom: footerSpace } : null]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </SafeAreaView>
      {footer && (
        <LinearGradient colors={['transparent', t.bg]} locations={[0, 0.35]} style={styles.footerWrap}>
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            {footer}
          </SafeAreaView>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stripes: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'column' },
  content: { flexGrow: 1, alignItems: 'center', paddingBottom: 8 },
  inner: { width: '100%', maxWidth: 560, padding: 16 },
  footerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 28, alignItems: 'center' },
  footer: { width: '100%', maxWidth: 560, paddingHorizontal: 16, paddingBottom: 12 },
});
