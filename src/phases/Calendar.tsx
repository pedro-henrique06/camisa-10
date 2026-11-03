import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarView } from '@/api/types';
import { Btn, Card, H2, P } from '@/components/ui';
import { condensed, useTheme } from '@/theme';

const CHIP = 56;
const SKIP_KEY = 'c10.skip';

/** Calendário da temporada com a fita de datas deslizando até o próximo dia (calScreen). */
export function Calendar({ cal, onNext, busy }: { cal: CalendarView; onNext: () => void; busy: boolean }) {
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
      <H2>Calendário da temporada</H2>
      <P muted>{cal.intro}</P>

      <Pressable onPress={finish} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.strip, { borderColor: t.line }]}>
        <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
          {cal.strip.map((c, i) => {
            const on = i === target;
            return (
              <View key={c.offset} style={[styles.dc, { opacity: on ? 1 : 0.5, backgroundColor: on ? t.acc : 'transparent' }]}>
                <Text style={[styles.dcSmall, { color: on ? t.accText : t.mut }]}>{c.weekday}</Text>
                <Text style={[condensed, { fontSize: 28, color: on ? t.accText : t.ink }]}>{c.day}</Text>
                <Text style={[styles.dcSmall, { color: on ? t.accText : t.mut }]}>{c.month}</Text>
                {!!c.icon && <Text style={styles.dcIcon}>{c.icon}</Text>}
              </View>
            );
          })}
        </Animated.View>
        <View style={[styles.ptr, { backgroundColor: t.acc }]} />
      </Pressable>

      <View style={styles.grid}>
        {cal.cells.map((c) => {
          const now = c.day === shownDay;
          const isDone = c.done || (done && c.day === cal.nextDay);
          return (
            <View
              key={c.day}
              style={[
                styles.cell,
                {
                  borderColor: now ? t.acc : c.match ? t.acc : t.line,
                  opacity: isDone || now ? 1 : 0.55,
                  backgroundColor: now ? t.acc : isDone ? 'rgba(123,228,149,0.14)' : 'transparent',
                  transform: [{ scale: now ? 1.08 : 1 }],
                },
              ]}
            >
              <Text style={[condensed, { fontSize: 16, color: now ? t.accText : t.ink }]}>{c.day}</Text>
              {c.match && <Text style={styles.cellIcon}>⚽</Text>}
              {c.window && <View style={[styles.dot, { backgroundColor: t.good }]} />}
            </View>
          );
        })}
      </View>
      <Text style={{ color: t.mut, fontSize: 13, marginBottom: 12 }}>
        ⚽ jogo · <Text style={{ color: t.good }}>●</Text> janela de transferências
      </Text>

      <View style={styles.dtop}>
        <Text style={{ color: t.mut }}>Dia</Text>
        <Text style={[condensed, { fontSize: 54, color: t.acc, minWidth: 64, textAlign: 'center' }]}>{shownDay}</Text>
        <Text style={{ color: t.mut }}>de 20</Text>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: t.line, paddingTop: 8, marginBottom: 12 }}>
        <Text style={{ color: t.ink, fontWeight: '700' }}>Agenda do dia {cal.nextDay}</Text>
        {cal.agenda.map((a, i) => (
          <Animated.View
            key={a.title}
            style={[
              styles.ai,
              { opacity: agenda[i], transform: [{ translateY: agenda[i].interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
            ]}
          >
            <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{a.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.ink, fontWeight: '700' }}>{a.title}</Text>
              <Text style={{ color: t.mut, fontSize: 14 }}>{a.detail}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Btn primary label={`Começar o dia ${cal.nextDay}`} onPress={onNext} busy={busy} />
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Btn small label={skip ? 'Animação: desligada' : 'Animação: ligada'} onPress={toggleSkip} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  strip: { borderWidth: 1.5, borderRadius: 8, marginVertical: 10, height: 84, overflow: 'hidden' },
  track: { flexDirection: 'row', position: 'absolute', left: 0, top: 0, height: '100%' },
  dc: { width: CHIP, alignItems: 'center', justifyContent: 'center' },
  dcSmall: { fontSize: 11, textTransform: 'uppercase' },
  dcIcon: { position: 'absolute', top: 2, right: 4, fontSize: 11 },
  ptr: { position: 'absolute', left: '50%', top: 0, width: 2, height: 6, marginLeft: -1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10, marginHorizontal: -3 },
  cell: { width: '18%', marginHorizontal: '1%', marginVertical: 3, aspectRatio: 1.25, borderWidth: 1.5, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cellIcon: { position: 'absolute', top: -1, right: 2, fontSize: 11 },
  dot: { position: 'absolute', left: 4, bottom: 4, width: 6, height: 6, borderRadius: 3 },
  dtop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginTop: 4, marginBottom: 10 },
  ai: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 },
});
