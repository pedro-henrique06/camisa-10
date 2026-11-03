import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/** Página rolável com largura máxima de 560 (como o <main> original). */
export function Screen({ children, scrollRef }: { children: ReactNode; scrollRef?: React.RefObject<React.ComponentRef<typeof ScrollView> | null> }) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 560, padding: 16 },
});
