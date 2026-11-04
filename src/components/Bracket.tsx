import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { BracketTie, CupView } from '@/api/types';
import { alpha, compColor, condensed, font, useTheme } from '@/theme';

const TIE_H = 58;
const GAP = 8;
const COL_W = 168;

/**
 * Chave do mata-mata em colunas (uma por fase), roláveis para o lado quando não cabem. Os confrontos de
 * cada fase ficam alinhados no meio dos dois que os originaram, como numa chave de verdade.
 */
export function Bracket({ cup }: { cup: CupView }) {
  const t = useTheme();
  const col = compColor(t, cup.kind);
  const [width, setWidth] = useState(0);
  // fases muito grandes (ex.: terceira fase com 16 jogos) viram uma lista com o seu confronto em destaque
  const big = cup.bracket.filter((r) => r.ties.length > 8);
  const cols = cup.bracket.filter((r) => r.ties.length <= 8);
  const first = Math.max(1, cols[0]?.ties.length ?? 1);
  const height = first * (TIE_H + GAP);
  // com poucas fases, as colunas dividem a largura do cartão; com muitas, a chave rola para o lado
  const colW = cols.length && width ? Math.max(COL_W, (width - 10 * (cols.length - 1)) / Math.min(cols.length, 2)) : COL_W;
  const fit = cols.length <= 2 && width > 0;
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {big.map((round) => (
        <BigRound key={round.name} round={round} color={col} />
      ))}
      <ScrollView horizontal scrollEnabled={!fit} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: fit ? 0 : 8 }}>
        {cols.map((round) => (
          <View key={round.name} style={{ width: fit ? (width - 10 * (cols.length - 1)) / cols.length : colW }}>
            <RoundHead name={round.name} current={round.current} color={col} />
            <View style={{ height, justifyContent: 'space-around' }}>
              {round.ties.map((tie, i) => (
                <Tie key={i} tie={tie} color={col} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function RoundHead({ name, current, color }: { name: string; current: boolean; color: string }) {
  const t = useTheme();
  return (
    <View style={[styles.head, { backgroundColor: current ? alpha(color, 0.25) : t.cardHi, borderColor: current ? color : t.line }]}>
      <Text style={{ color: current ? t.ink : t.mut, fontFamily: font.bold, fontSize: 12, letterSpacing: 0.6 }}>{name.toUpperCase()}</Text>
    </View>
  );
}

/** Fase com muitos jogos: o confronto do jogador e, ao tocar, todos os outros em duas colunas. */
function BigRound({ round, color }: { round: CupView['bracket'][number]; color: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const mine = round.ties.find((x) => x.mine);
  return (
    <View style={{ marginBottom: 14 }}>
      <RoundHead name={round.name} current={round.current} color={color} />
      {!open && mine && <Tie tie={mine} color={color} />}
      {open && (
        <View style={styles.grid}>
          {round.ties.map((tie, i) => (
            <View key={i} style={{ width: '48.5%' }}>
              <Tie tie={tie} color={color} />
            </View>
          ))}
        </View>
      )}
      <Pressable onPress={() => setOpen((v) => !v)} hitSlop={8} style={{ marginTop: 6 }}>
        <Text style={{ color: t.acc, fontFamily: font.semibold, fontSize: 12 }}>
          {open ? 'Mostrar só o seu confronto ▲' : `Ver os ${round.ties.length} confrontos ▼`}
        </Text>
      </Pressable>
    </View>
  );
}

function Tie({ tie, color }: { tie: BracketTie; color: string }) {
  const t = useTheme();
  const pending = tie.home === 'A definir';
  const line = (name: string | null, goals: number | null, won: boolean) => (
    <View style={styles.line}>
      <Text
        numberOfLines={1}
        style={{ flex: 1, fontSize: 12, color: pending ? t.mut : won ? t.ink : tie.winner ? t.mut : t.ink, fontFamily: won ? font.bold : font.medium }}
      >
        {name ?? '—'}
      </Text>
      <Text style={[condensed, { fontSize: 14, color: won ? t.ink : t.mut, minWidth: 14, textAlign: 'right' }]}>{goals ?? ''}</Text>
    </View>
  );
  return (
    <View
      style={[
        styles.tie,
        { backgroundColor: tie.mine ? alpha(color, 0.18) : t.cardHi, borderColor: tie.mine ? color : t.line, opacity: pending ? 0.55 : 1 },
      ]}
    >
      {line(tie.home, tie.homeGoals, tie.winner === 'home')}
      {line(tie.away, tie.awayGoals, tie.winner === 'away')}
      {tie.penalties && <Text style={[styles.pen, { color: t.mut }]}>pênaltis</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { borderWidth: 1, borderRadius: 8, paddingVertical: 4, alignItems: 'center', marginBottom: 6 },
  tie: { height: TIE_H, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, justifyContent: 'center', gap: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6 },
  pen: { position: 'absolute', right: 6, bottom: 1, fontSize: 9, fontFamily: font.medium },
});
