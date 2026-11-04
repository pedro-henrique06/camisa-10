import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, useTheme } from '@/theme';
import { haptic } from './ui';

export type CareerTab = 'hoje' | 'calendario' | 'tabela' | 'jogador';

const TABS: { key: CareerTab; icon: string; label: string }[] = [
  { key: 'hoje', icon: '⚽', label: 'Hoje' },
  { key: 'calendario', icon: '📅', label: 'Calendário' },
  { key: 'tabela', icon: '🏆', label: 'Tabela' },
  { key: 'jogador', icon: '👤', label: 'Jogador' },
];

/**
 * Abas da carreira no rodapé. `alert` marca a aba Hoje quando há uma decisão esperando
 * (evento, mercado, resultado) e o jogador está olhando outra aba.
 */
export function CareerTabs({ tab, onChange, alert }: { tab: CareerTab; onChange: (t: CareerTab) => void; alert?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: t.card, borderColor: t.line }]} accessibilityRole="tablist">
      {TABS.map((x) => {
        const on = x.key === tab;
        return (
          <Pressable
            key={x.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={x.label}
            onPress={() => {
              if (!on) haptic.tap();
              onChange(x.key);
            }}
            style={[styles.tab, on && { backgroundColor: t.accSoft }]}
          >
            <View>
              <Text style={{ fontSize: 18, textAlign: 'center', opacity: on ? 1 : 0.7 }}>{x.icon}</Text>
              {alert && x.key === 'hoje' && !on && <View style={[styles.dot, { backgroundColor: t.bad, borderColor: t.card }]} />}
            </View>
            <Text style={{ color: on ? t.acc : t.mut, fontFamily: on ? font.bold : font.medium, fontSize: 11 }}>{x.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 4, gap: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 12, gap: 2 },
  dot: { position: 'absolute', top: -2, right: -6, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
