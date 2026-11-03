import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import type { AttributeView, HudView } from '@/api/types';
import { condensed, font, useTheme } from '@/theme';
import { Badge, OvrRing } from './art';
import { Bar, Btn, Chip, money } from './ui';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

/** Barras mostradas sempre; as outras aparecem em "ver tudo". */
const KEY_BARS = ['m', 'p', 't', 'f'];

type Props = {
  hud: HudView;
  /** Só a linha do clube e o overall (usado no pênalti, para a cena caber na tela). */
  compact?: boolean;
  onHistory: () => void;
  onSearchClub?: () => void;
  busy?: boolean;
};

/** Cabeçalho compacto: clube, overall, temporada, atributos e principais barras. */
export function Hud({ hud, onHistory, onSearchClub, busy, compact }: Props) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  const bars = hud.bars.filter((b) => b.key !== 'h' && (open || KEY_BARS.includes(b.key)));
  // Fama cresce com a carreira: valor baixo não é ruim, então fica na cor neutra.
  const barColor = (key: string, v: number) => (key === 'f' ? t.acc : v < 35 ? t.bad : v < 55 ? t.warn : t.good);

  if (compact) {
    return (
      <View style={[styles.panel, styles.top, { backgroundColor: t.card + 'cc', borderColor: t.line, paddingVertical: 10 }]}>
        <Badge badge={hud.clubBadge} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.ink, fontSize: 19 }]} numberOfLines={1}>
            {hud.name}
          </Text>
          <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 12 }} numberOfLines={1}>
            {hud.club} · {hud.age} anos · {hud.position}
          </Text>
        </View>
        <View style={[styles.money, { backgroundColor: t.accSoft, alignItems: 'center' }]}>
          <Text style={{ color: t.acc, fontFamily: font.display, fontSize: 20 }}>{hud.overall}</Text>
          <Text style={{ color: t.mut, fontFamily: font.bold, fontSize: 9 }}>OVR</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.panel, { backgroundColor: t.card + 'cc', borderColor: t.line }]}>
      {/* clube e dinheiro */}
      <View style={styles.top}>
        <Badge badge={hud.clubBadge} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.ink }]} numberOfLines={1}>
            {hud.name}
            {hud.captain ? <Text style={{ color: t.acc }}> · C</Text> : null}
          </Text>
          <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 13 }} numberOfLines={2}>
            {hud.clubLine}
          </Text>
        </View>
        <View style={[styles.money, { backgroundColor: t.accSoft }]}>
          <Text style={{ color: t.acc, fontFamily: font.display, fontSize: 18 }}>R$ {money(hud.money)} mi</Text>
          <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 11 }}>{hud.salary} mil/mês</Text>
        </View>
      </View>

      {/* overall, idade e temporada */}
      <View style={styles.mid}>
        <OvrRing value={hud.overall} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 15 }}>
            <Text style={[condensed, { fontSize: 26, color: t.acc }]}>{hud.age}</Text> anos · {hud.position} · {hud.nationFlag}
          </Text>
          <SeasonProgress day={hud.seasonDay} />
          <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 13 }}>
            ⚽ {hud.goals} gols · 🅰 {hud.assists} assist.
            {hud.seasonGoals + hud.seasonAssists > 0 ? ` · +${hud.seasonGoals + hud.seasonAssists} na temp.` : ''}
          </Text>
        </View>
      </View>

      <AttributeRow attributes={hud.attributes} />

      {/* barras */}
      <View style={styles.bars}>
        {bars.map((b) => (
          <View key={b.key} style={styles.barCell}>
            <View style={styles.barHead}>
              <Text style={{ color: t.mut, fontSize: 12, fontFamily: font.medium, flexShrink: 1 }} numberOfLines={1}>
                {b.label}
              </Text>
              <Text style={{ color: t.ink, fontSize: 12, fontFamily: font.bold }}>{b.value}</Text>
            </View>
            <Bar value={b.value} height={5} color={barColor(b.key, b.value)} />
          </View>
        ))}
      </View>

      {hud.warnings.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {hud.warnings.map((w) => (
            <Chip key={w} text={w} up={false} />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={toggle} hitSlop={8}>
          <Text style={{ color: t.acc, fontFamily: font.semibold, fontSize: 14 }}>{open ? 'Mostrar menos ▲' : 'Ver tudo ▼'}</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {hud.canSearchClub && onSearchClub && <Btn small icon="🚪" label="Procurar clube" onPress={onSearchClub} disabled={busy} />}
          <Btn small icon="📈" label="Evolução" onPress={onHistory} />
        </View>
      </View>
    </View>
  );
}

/** Progresso da temporada (20 dias, jogo a cada 5). */
function SeasonProgress({ day }: { day: number }) {
  const t = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {Array.from({ length: 20 }, (_, i) => {
          const n = i + 1;
          const match = n % 5 === 0;
          return (
            <View
              key={n}
              style={{
                flex: 1,
                height: match ? 8 : 5,
                alignSelf: 'center',
                borderRadius: 2,
                backgroundColor: n <= day ? (match ? t.acc : t.good) : match ? t.accSoft : t.line,
              }}
            />
          );
        })}
      </View>
      <Text style={{ color: t.mut, fontSize: 11, fontFamily: font.medium, marginTop: 2 }}>Temporada · dia {day} de 20</Text>
    </View>
  );
}

/** Seis atributos em fichas. */
export function AttributeRow({ attributes }: { attributes: AttributeView[] }) {
  const t = useTheme();
  return (
    <View style={styles.atr}>
      {attributes.map((a) => {
        const c = a.value >= 80 ? t.good : a.value < 50 ? t.bad : t.ink;
        return (
          <View key={a.key} style={[styles.atrCell, { backgroundColor: t.cardHi, borderColor: a.weightPercent >= 25 ? t.accSoft : t.line }]}>
            <Text style={{ fontSize: 10, color: t.mut, fontFamily: font.bold, letterSpacing: 0.5 }}>{a.short}</Text>
            <Text style={[condensed, { fontSize: 19, lineHeight: 21, color: c }]}>{a.value}</Text>
            {a.delta !== 0 && (
              <Text style={{ fontSize: 9, fontFamily: font.bold, color: a.delta > 0 ? t.good : t.bad }}>
                {a.delta > 0 ? '+' : ''}
                {a.delta}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Ficha detalhada dos atributos com peso por posição e variação na temporada. */
export function AttributeCard({ overall, position, attributes }: { overall: number; position: string; attributes: AttributeView[] }) {
  const t = useTheme();
  return (
    <View>
      <View style={[styles.fc, { borderColor: t.accSoft, backgroundColor: t.cardHi }]}>
        <View style={{ alignItems: 'center' }}>
          <OvrRing value={overall} size={84} />
          <Text style={{ fontSize: 11, color: t.mut, fontFamily: font.bold, marginTop: 4 }}>{position.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {attributes.map((a) => (
            <View key={a.key} style={styles.fr}>
              <Text style={{ color: t.ink, fontSize: 13, fontFamily: font.medium, width: 86 }} numberOfLines={1}>
                {a.name}
                {a.weightPercent > 0 ? <Text style={{ color: t.mut }}> {a.weightPercent}%</Text> : null}
              </Text>
              <View style={{ flex: 1 }}>
                <Bar value={a.value} />
              </View>
              <Text style={{ color: t.ink, width: 24, textAlign: 'right', fontFamily: font.bold }}>{a.value}</Text>
              <Text style={{ width: 26, fontSize: 12, fontFamily: font.bold, color: a.delta > 0 ? t.good : t.bad }}>
                {a.delta ? (a.delta > 0 ? '+' : '') + a.delta : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ color: t.mut, fontSize: 13, fontFamily: font.regular }}>
        O overall é a média dos atributos ponderada pela posição (o % ao lado de cada um). Mudar de posição muda o seu overall. A variação é da
        temporada.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: font.display, fontSize: 22, lineHeight: 24 },
  money: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'flex-end' },
  mid: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  atr: { flexDirection: 'row', gap: 5, marginTop: 12 },
  atrCell: { flex: 1, borderWidth: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 4 },
  bars: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, rowGap: 8, columnGap: 12 },
  barCell: { width: '47%', flexGrow: 1 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 },
  fc: { flexDirection: 'row', gap: 14, alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12, marginVertical: 8 },
  fr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 3 },
});
