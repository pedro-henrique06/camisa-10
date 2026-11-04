import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MatchSummary, TableRow } from '@/api/types';
import { alpha, compColor, condensed, font, useTheme } from '@/theme';

/**
 * Tabela da liga: posição, clube, jogos, vitórias, empates, derrotas, saldo e pontos, com as zonas de
 * acesso e rebaixamento. Com `compact`, mostra só as linhas em volta do clube do jogador e um botão
 * para abrir a tabela inteira.
 */
export function LeagueTable({ rows, compact = false }: { rows: TableRow[]; compact?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(!compact);
  const mine = rows.findIndex((r) => r.mine);
  const from = Math.max(0, Math.min(mine - 2, rows.length - 5));
  const shown = open ? rows : rows.slice(from, from + 5);
  const hasZones = rows.some((r) => r.zone);
  return (
    <View>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.pos, styles.headText, { color: t.mut }]}>#</Text>
        <Text style={[styles.club, styles.headText, { color: t.mut }]}>Clube</Text>
        <Text style={[styles.num, styles.headText, { color: t.mut }]}>J</Text>
        <Text style={[styles.num, styles.headText, { color: t.mut }]}>V</Text>
        <Text style={[styles.num, styles.headText, { color: t.mut }]}>E</Text>
        <Text style={[styles.num, styles.headText, { color: t.mut }]}>D</Text>
        <Text style={[styles.sg, styles.headText, { color: t.mut }]}>SG</Text>
        <Text style={[styles.pts, styles.headText, { color: t.mut }]}>Pts</Text>
      </View>
      {shown.map((r) => {
        const sg = (r.goalsFor ?? 0) - (r.goalsAgainst ?? 0);
        return (
          <View
            key={r.position}
            style={[
              styles.row,
              { borderLeftColor: r.zone === 'up' ? t.good : r.zone === 'down' ? t.bad : 'transparent' },
              r.mine && { backgroundColor: t.accSoft },
            ]}
          >
            <Text style={[styles.pos, { color: t.mut, fontFamily: font.bold }]}>{r.position}</Text>
            <Text numberOfLines={1} style={[styles.club, { color: t.ink, fontFamily: r.mine ? font.bold : font.medium }]}>
              {r.club}
              {r.mine ? ' ⭐' : ''}
            </Text>
            <Text style={[styles.num, { color: t.mut }]}>{r.played ?? 0}</Text>
            <Text style={[styles.num, { color: t.mut }]}>{r.won ?? 0}</Text>
            <Text style={[styles.num, { color: t.mut }]}>{r.drawn ?? 0}</Text>
            <Text style={[styles.num, { color: t.mut }]}>{r.lost ?? 0}</Text>
            <Text style={[styles.sg, { color: sg > 0 ? t.good : sg < 0 ? t.bad : t.mut }]}>{sg > 0 ? `+${sg}` : sg}</Text>
            <Text style={[condensed, styles.pts, { color: r.mine ? t.acc : t.ink }]}>{r.points ?? 0}</Text>
          </View>
        );
      })}
      <View style={styles.foot}>
        {hasZones ? (
          <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 12 }}>
            <Text style={{ color: t.good }}>▎</Text>sobe · <Text style={{ color: t.bad }}>▎</Text>cai
          </Text>
        ) : (
          <View />
        )}
        {compact && rows.length > 5 && (
          <Pressable onPress={() => setOpen((v) => !v)} hitSlop={8}>
            <Text style={{ color: t.acc, fontFamily: font.semibold, fontSize: 12 }}>{open ? 'Mostrar menos ▲' : 'Tabela completa ▼'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Últimos jogos: resultado (V, E, D), placar, adversário e a nota do jogador. */
export function RecentMatches({ matches }: { matches: MatchSummary[] }) {
  const t = useTheme();
  if (!matches.length) return null;
  return (
    <View style={{ gap: 4 }}>
      {matches.map((m, i) => {
        const col = m.result === 'V' ? t.good : m.result === 'D' ? t.bad : t.mut;
        return (
          <View key={i} style={[styles.match, { borderColor: t.line }]}>
            <View style={[styles.res, { backgroundColor: col }]}>
              <Text style={styles.resText}>{m.result}</Text>
            </View>
            <View style={[styles.dot, { backgroundColor: compColor(t, m.kind) }]} />
            <Text numberOfLines={1} style={{ flex: 1, color: t.ink, fontFamily: font.medium, fontSize: 13 }}>
              {m.home ? 'x' : '@'} {m.opponent}
            </Text>
            <Text style={[condensed, { color: t.ink, fontSize: 15 }]}>
              {m.for}–{m.against}
            </Text>
            <Text style={{ color: t.mut, fontSize: 12, fontFamily: font.medium, width: 58, textAlign: 'right' }}>
              {m.goals ? `⚽${m.goals} ` : ''}
              {m.assists ? `🅰${m.assists}` : ''}
            </Text>
            <View style={[styles.rating, { backgroundColor: alpha(m.rating >= 7.5 ? t.good : m.rating < 6 ? t.bad : t.acc, 0.2) }]}>
              <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 12 }}>{m.rating.toFixed(1)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingRight: 4, borderLeftWidth: 3, borderRadius: 4 },
  head: { borderLeftColor: 'transparent', paddingBottom: 2 },
  headText: { fontFamily: font.bold, fontSize: 11, letterSpacing: 0.4 },
  pos: { width: 26, textAlign: 'right', fontSize: 13, marginRight: 8 },
  club: { flex: 1, fontSize: 14 },
  num: { width: 22, textAlign: 'center', fontSize: 12, fontFamily: font.medium },
  sg: { width: 32, textAlign: 'center', fontSize: 12, fontFamily: font.semibold },
  pts: { width: 30, textAlign: 'right', fontSize: 16 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  match: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  res: { width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  resText: { color: '#fff', fontFamily: font.bold, fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rating: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, minWidth: 34, alignItems: 'center' },
});
