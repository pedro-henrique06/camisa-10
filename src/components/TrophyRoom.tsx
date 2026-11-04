import { StyleSheet, Text, View } from 'react-native';

import type { TrophyRoom as Room } from '@/api/types';
import { alpha, compColor, condensed, font, useTheme } from '@/theme';
import { Card } from './ui';

const ICON: Record<string, string> = { award: '⭐', national: '🌎', continental: '🏆', league: '🏆', cup: '🏆', state: '🏆' };

/** "Palmeiras · 25 e 26 anos · Flamengo · 29 anos": conquistas agrupadas por time. */
function byTeam(wins: Room['groups'][number]['wins']) {
  const teams: { team: string; ages: number[] }[] = [];
  for (const w of wins) {
    const last = teams.find((x) => x.team === w.team);
    if (last) last.ages.push(w.age);
    else teams.push({ team: w.team, ages: [w.age] });
  }
  const list = (a: number[]) => (a.length === 1 ? `${a[0]}` : `${a.slice(0, -1).join(', ')} e ${a[a.length - 1]}`);
  return teams.map((x) => `${x.team} · ${list(x.ages)} anos`).join('  ·  ');
}

/** Sala de troféus: cada competição vencida, quantas vezes, em que temporada, com que idade e por qual time. */
export function TrophyRoom({ room }: { room: Room }) {
  const t = useTheme();
  const empty = room.groups.length === 0 && room.untracked === 0;
  return (
    <Card>
      <Text style={[styles.section, { color: t.mut }]}>SALA DE TROFÉUS</Text>
      <View style={styles.totals}>
        <Total value={room.titles} label={room.titles === 1 ? 'título' : 'títulos'} color={t.acc} />
        <Total value={room.nationalTitles} label="pela seleção" color={compColor(t, 'national')} />
        <Total value={room.ballons} label={room.ballons === 1 ? 'Bola de Ouro' : 'Bolas de Ouro'} color={t.acc} />
      </View>
      {empty && (
        <Text style={{ color: t.mut, fontFamily: font.medium, textAlign: 'center', paddingVertical: 10 }}>
          Nenhum título ainda. A primeira taça está por vir.
        </Text>
      )}
      {room.groups.map((g) => {
        const col = g.kind === 'award' ? t.acc : compColor(t, g.kind);
        return (
          <View key={g.name + g.kind} style={[styles.item, { borderColor: alpha(col, 0.45), backgroundColor: alpha(col, 0.1) }]}>
            <View style={[styles.cup, { backgroundColor: alpha(col, 0.25) }]}>
              <Text style={{ fontSize: 22 }}>{ICON[g.kind] ?? '🏆'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: t.ink, fontFamily: font.bold, fontSize: 15 }}>
                {g.name}
              </Text>
              <Text numberOfLines={2} style={{ color: t.mut, fontFamily: font.medium, fontSize: 12 }}>
                {byTeam(g.wins)}
              </Text>
            </View>
            <Text style={[condensed, { color: col, fontSize: 26 }]}>{g.count}×</Text>
          </View>
        );
      })}
      {room.untracked > 0 && (
        <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 12, marginTop: 4 }}>
          + {room.untracked} {room.untracked === 1 ? 'título conquistado' : 'títulos conquistados'} antes da sala de troféus
        </Text>
      )}
    </Card>
  );
}

function Total({ value, label, color }: { value: number; label: string; color: string }) {
  const t = useTheme();
  return (
    <View style={[styles.total, { backgroundColor: t.cardHi, borderColor: t.line }]}>
      <Text style={[condensed, { color: value > 0 ? color : t.mut, fontSize: 28, lineHeight: 30 }]}>{value}</Text>
      <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 11, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2, marginBottom: 8 },
  totals: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  total: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 8, marginBottom: 6 },
  cup: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
