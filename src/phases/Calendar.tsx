import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarView } from '@/api/types';
import { LeagueTable, RecentMatches } from '@/components/LeagueTable';
import { Card, Eyebrow, H2 } from '@/components/ui';
import { alpha, compColor, condensed, font, useTheme } from '@/theme';

const CHIP = 56;
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

type Cell = CalendarView['cells'][number];

/** Agrupa as datas da temporada por mês, na ordem do calendário. */
function byMonth(cells: Cell[]) {
  const groups: { key: string; month: number; label: string; cells: Cell[] }[] = [];
  for (const c of cells) {
    const month = c.month ?? Math.ceil(c.day / 5);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.cells.push(c);
    else groups.push({ key: `${month}-${groups.length}`, month, label: c.monthLabel ?? '', cells: [c] });
  }
  return groups;
}

const dateOf = (c: Cell | undefined) => (c?.dayOfMonth && c.month ? `${c.dayOfMonth} de ${MONTHS[c.month - 1]}` : null);
const SKIP_KEY = 'c10.skip';

/** Calendário da temporada com a fita de datas deslizando até o próximo dia (calScreen). */
export function Calendar({ cal }: { cal: CalendarView }) {
  const t = useTheme();
  const [width, setWidth] = useState(300);
  const [skip, setSkip] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [x] = useState(() => new Animated.Value(0));
  const [agenda] = useState(() => cal.agenda.map(() => new Animated.Value(0)));

  const pos = (i: number) => Math.round(width / 2 - CHIP / 2 - i * CHIP);

  useEffect(() => {
    (async () => {
      let v = false;
      try {
        v = (await AsyncStorage.getItem(SKIP_KEY)) === '1';
      } catch {}
      try {
        v = v || (await AccessibilityInfo.isReduceMotionEnabled());
      } catch {}
      setSkip(v);
    })();
  }, []);

  /** Sem animação (preferência ou toque na fita): já mostra o próximo dia. */
  const jumpToEnd = () => {
    x.stopAnimation();
    x.setValue(pos(cal.stripTo));
    agenda.forEach((a) => a.setValue(1));
  };
  const finish = () => {
    jumpToEnd();
    setFinished(true);
  };
  const done = finished || skip === true;

  useEffect(() => {
    if (skip === null) return;
    if (skip) return jumpToEnd();
    x.setValue(pos(cal.stripFrom));
    Animated.timing(x, { toValue: pos(cal.stripTo), duration: 1700, delay: 80, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(
      (r) => r.finished && setFinished(true),
    );
    Animated.stagger(
      180,
      agenda.map((a) => Animated.timing(a, { toValue: 1, duration: 350, useNativeDriver: true })),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, width]);

  const toggleSkip = async () => {
    const v = !skip;
    setSkip(v);
    try {
      await AsyncStorage.setItem(SKIP_KEY, v ? '1' : '0');
    } catch {}
  };

  const target = done ? cal.stripTo : cal.stripFrom;
  const shownDay = done ? cal.nextDay : cal.dayDone;

  return (
    <Card>
      <Eyebrow>{cal.seasonSpan ?? cal.intro.split('. ')[0].replace(/\.$/, '')}</Eyebrow>
      <H2>{dateOf(cal.cells.find((c) => c.day === (shownDay > 0 ? shownDay : cal.nextDay))) ?? `Dia ${shownDay > 0 ? shownDay : cal.nextDay}`}</H2>
      <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 13, marginTop: -4, marginBottom: 4 }}>
        Rodada {shownDay > 0 ? shownDay : cal.nextDay} de {cal.total ?? cal.cells.length}
      </Text>

      <Pressable onPress={finish} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.strip, { borderColor: t.line, backgroundColor: t.cardHi }]}>
        <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
          {cal.strip.map((c, i) => {
            const on = i === target;
            return (
              <View key={c.offset} style={[styles.dc, on && { backgroundColor: t.acc }, { opacity: on ? 1 : 0.55 }]}>
                <Text style={[styles.dcSmall, { color: on ? t.accText : t.mut }]}>{c.weekday}</Text>
                <Text style={[condensed, { fontSize: 28, lineHeight: 30, color: on ? t.accText : t.ink }]}>{c.day}</Text>
                <Text style={[styles.dcSmall, { color: on ? t.accText : t.mut }]}>{c.month}</Text>
                {!!c.icon && <Text style={styles.dcIcon}>{c.icon}</Text>}
              </View>
            );
          })}
        </Animated.View>
        <View style={[styles.ptr, { borderTopColor: t.acc }]} />
      </Pressable>

      <Text style={[styles.section, { color: t.mut }]}>AGENDA DO DIA {cal.nextDay}</Text>
      {cal.agenda.map((a, i) => (
        <Animated.View
          key={a.title}
          style={[
            styles.ai,
            a.kind
              ? { backgroundColor: alpha(compColor(t, a.kind), a.title === 'Jogo' ? 0.2 : 0.08), borderColor: alpha(compColor(t, a.kind), a.title === 'Jogo' ? 0.9 : 0.4) }
              : { backgroundColor: t.cardHi, borderColor: t.line },
            { opacity: agenda[i], transform: [{ translateX: agenda[i].interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] },
          ]}
        >
          <Text style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{a.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 15 }}>{a.title}</Text>
            <Text style={{ color: t.mut, fontSize: 13, fontFamily: font.regular }}>{a.detail}</Text>
          </View>
        </Animated.View>
      ))}

      <Text style={[styles.section, { color: t.mut }]}>TEMPORADA</Text>
      <View style={styles.months}>
        {byMonth(cal.cells).map((g) => (
          <View key={g.key} style={styles.monthRow}>
            <Text style={[styles.monthLabel, { color: t.mut }]}>{g.label}</Text>
            <View style={styles.monthCells}>
              {g.cells.map((c) => {
                const now = c.day === shownDay;
                const isDone = c.done || (done && c.day === cal.nextDay);
                const col = c.kind ? compColor(t, c.kind) : null;
                return (
                  <View
                    key={c.day}
                    accessibilityLabel={`${dateOf(c) ?? 'Dia ' + c.day}${c.competition ? ', jogo: ' + c.competition : ''}${c.window ? ', janela de transferências' : ''}`}
                    style={[
                      styles.cell,
                      {
                        borderColor: now ? t.acc : col ? alpha(col, 0.75) : t.line,
                        backgroundColor: now ? t.acc : col ? alpha(col, 0.2) : 'transparent',
                        opacity: now ? 1 : isDone ? 0.42 : 1,
                      },
                    ]}
                  >
                    <Text style={[condensed, { fontSize: 15, color: now ? t.accText : t.ink }]}>{c.dayOfMonth ?? c.day}</Text>
                    {c.match && <Text style={styles.cellIcon}>{c.kind === 'league' ? '⚽' : '🏆'}</Text>}
                    {col && <View style={[styles.bar, { backgroundColor: now ? t.accText : col }]} />}
                    {c.window && <View style={[styles.dot, { backgroundColor: t.good }]} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {cal.table && (
        <>
          <Text style={[styles.section, { color: t.mut, marginTop: 14 }]}>
            TABELA · {cal.table.league.toUpperCase()} · RODADA {cal.table.round} DE {cal.table.rounds}
          </Text>
          <LeagueTable rows={cal.table.rows} compact />
          {cal.table.recent.length > 0 && (
            <>
              <Text style={[styles.section, { color: t.mut, marginTop: 12 }]}>ÚLTIMOS JOGOS</Text>
              <RecentMatches matches={cal.table.recent} />
            </>
          )}
        </>
      )}

      <View style={styles.comps}>
        {cal.competitions.map((c) => {
          const col = compColor(t, c.kind);
          return (
            <View key={c.kind} style={[styles.compRow, { borderColor: alpha(col, 0.35), backgroundColor: alpha(col, 0.08) }]}>
              <View style={[styles.swatch, { backgroundColor: col }]} />
              <Text
                numberOfLines={1}
                style={{ flex: 1, color: c.out ? t.mut : t.ink, fontFamily: font.bold, fontSize: 14, textDecorationLine: c.out ? 'line-through' : 'none' }}
              >
                {c.name}
              </Text>
              <Text style={{ color: c.champion ? t.acc : c.out ? t.bad : t.mut, fontFamily: font.semibold, fontSize: 12 }}>
                {c.champion ? '🏆 ' : ''}
                {c.status}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={{ color: t.mut, fontSize: 12, fontFamily: font.medium }}>
          <Text style={{ color: t.good }}>●</Text> janela de transferências
        </Text>
        <Pressable onPress={toggleSkip} hitSlop={8}>
          <Text style={{ color: t.acc, fontSize: 12, fontFamily: font.semibold }}>{skip ? 'Animação: desligada' : 'Animação: ligada'}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  strip: { borderWidth: 1, borderRadius: 14, marginTop: 4, marginBottom: 14, height: 84, overflow: 'hidden' },
  track: { flexDirection: 'row', position: 'absolute', left: 0, top: 0, height: '100%' },
  dc: { width: CHIP, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  dcSmall: { fontSize: 11, textTransform: 'uppercase', fontFamily: font.bold },
  dcIcon: { position: 'absolute', top: 3, right: 4, fontSize: 11 },
  ptr: { position: 'absolute', left: '50%', top: 0, marginLeft: -6, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2, marginTop: 6, marginBottom: 6 },
  ai: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderWidth: 1, borderRadius: 12, marginBottom: 6 },
  months: { gap: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthLabel: { width: 34, fontFamily: font.bold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  monthCells: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 48, height: 34, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellIcon: { position: 'absolute', top: 0, right: 2, fontSize: 9 },
  dot: { position: 'absolute', left: 4, top: 4, width: 5, height: 5, borderRadius: 3 },
  bar: { position: 'absolute', left: 6, right: 6, bottom: 3, height: 3, borderRadius: 2 },
  comps: { gap: 6, marginTop: 10 },
  compRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 6 },
});
