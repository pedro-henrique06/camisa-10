import { StyleSheet, Text, View } from 'react-native';

import type { AttributeView, HudView } from '@/api/types';
import { condensed, useTheme } from '@/theme';
import { Badge } from './art';
import { Bar, Btn, Chip, money } from './ui';

type Props = {
  hud: HudView;
  onHistory: () => void;
  onSearchClub?: () => void;
  busy?: boolean;
};

/** Cabeçalho com idade, clube, barras, atributos e números da carreira (hud). */
export function Hud({ hud, onHistory, onSearchClub, busy }: Props) {
  const t = useTheme();
  return (
    <View>
      <View style={[styles.top, { borderBottomColor: t.line }]}>
        <View>
          <Text style={[styles.age, condensed, { color: t.acc }]}>{hud.age}</Text>
          <Text style={{ color: t.mut }}>
            anos · {hud.position} · {hud.nationFlag} · dia {hud.seasonDay}/20
          </Text>
        </View>
        <View style={styles.club}>
          <Badge badge={hud.clubBadge} />
          <Text style={{ color: t.ink, fontSize: 19, fontWeight: '700', textAlign: 'right' }}>
            {hud.name}
            {hud.captain ? ' · C' : ''}
          </Text>
          <Text style={{ color: t.mut, textAlign: 'right' }}>{hud.clubLine}</Text>
          <Text style={{ color: t.mut, textAlign: 'right' }}>
            R$ {money(hud.money)} mi · {hud.salary} mil/mês
          </Text>
        </View>
      </View>

      <View style={styles.bars}>
        {hud.bars.map((b) => (
          <View key={b.key} style={styles.barCell}>
            <Text style={{ color: t.mut, fontSize: 13 }} numberOfLines={1}>
              {b.label}
            </Text>
            <Bar value={b.value} />
          </View>
        ))}
      </View>

      <AttributeRow overall={hud.overall} attributes={hud.attributes} />

      <Text style={{ color: t.mut, fontSize: 14, marginBottom: 10 }}>
        ⚽ {hud.goals} gols · 🅰 {hud.assists} assistências · G+A {hud.goals + hud.assists}
        {'\n'}Nesta temporada, nos lances decisivos: {hud.seasonGoals} gols e {hud.seasonAssists} assistências
      </Text>

      {hud.warnings.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {hud.warnings.map((w) => (
            <Chip key={w} text={w} up={false} />
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {hud.canSearchClub && onSearchClub && <Btn small label="🚪 Procurar clube" onPress={onSearchClub} disabled={busy} />}
        <Btn small label="📈 Evolução" onPress={onHistory} />
      </View>
    </View>
  );
}

/** Linha OVR + seis atributos (atrRow). */
export function AttributeRow({ overall, attributes }: { overall: number; attributes: AttributeView[] }) {
  const t = useTheme();
  return (
    <View style={styles.atr}>
      <View style={[styles.atrCell, { flex: 1.3, backgroundColor: t.acc, borderColor: t.acc }]}>
        <Text style={{ fontSize: 10, color: t.accText }}>OVR</Text>
        <Text style={[condensed, { fontSize: 22, color: t.accText }]}>{overall}</Text>
      </View>
      {attributes.map((a) => (
        <View key={a.key} style={[styles.atrCell, { borderColor: t.line }]}>
          <Text style={{ fontSize: 10, color: t.mut }}>{a.short}</Text>
          <Text style={[condensed, { fontSize: 17, color: a.value >= 80 ? t.good : a.value < 50 ? t.bad : t.ink }]}>{a.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** Ficha detalhada dos atributos com peso por posição e variação na temporada (acard). */
export function AttributeCard({ overall, position, attributes }: { overall: number; position: string; attributes: AttributeView[] }) {
  const t = useTheme();
  return (
    <View>
      <View style={[styles.fc, { borderColor: t.acc }]}>
        <View style={{ alignItems: 'center', minWidth: 76 }}>
          <Text style={[condensed, { fontSize: 52, color: t.acc, lineHeight: 54 }]}>{overall}</Text>
          <Text style={{ fontSize: 11, color: t.mut }}>OVERALL</Text>
          <Text style={{ fontSize: 11, color: t.mut }}>{position.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {attributes.map((a) => (
            <View key={a.key} style={styles.fr}>
              <Text style={{ color: t.ink, fontSize: 13, width: 90 }} numberOfLines={1}>
                {a.name}
                {a.weightPercent > 0 ? <Text style={{ color: t.mut }}> {a.weightPercent}%</Text> : null}
              </Text>
              <View style={{ flex: 1 }}>
                <Bar value={a.value} />
              </View>
              <Text style={{ color: t.ink, width: 26, textAlign: 'right', fontWeight: '700' }}>{a.value}</Text>
              <Text style={{ width: 28, fontSize: 12, color: a.delta > 0 ? t.good : t.bad }}>
                {a.delta ? (a.delta > 0 ? '+' : '') + a.delta : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ color: t.mut, fontSize: 13 }}>
        O overall é a média dos atributos ponderada pela posição. Mudar de posição muda o seu overall. A variação mostrada é da temporada.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 2, paddingBottom: 10, marginBottom: 12, gap: 8 },
  age: { fontSize: 64, lineHeight: 64 },
  club: { alignItems: 'flex-end', flexShrink: 1 },
  bars: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, rowGap: 8 },
  barCell: { width: '33.33%', paddingRight: 12 },
  atr: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  atrCell: { flex: 1, borderWidth: 1, borderRadius: 6, alignItems: 'center', paddingVertical: 2 },
  fc: { flexDirection: 'row', gap: 14, alignItems: 'center', borderWidth: 2, borderRadius: 10, padding: 12, marginVertical: 8 },
  fr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 3 },
});
