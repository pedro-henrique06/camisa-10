import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { DuelMoment, DuelView } from '@/api/types';
import { Badge, D20 } from '@/components/art';
import { Screen } from '@/components/Screen';
import { Btn, Card, Eyebrow, FadeIn, H2, haptic, P, PressableScale } from '@/components/ui';
import { alpha, chanceColor, condensed, font, useTheme } from '@/theme';

const ATTACK_ICON: Record<string, string> = { chu: '🎯', dri: '🌀', pas: '🤝' };
const DEFENSE_ICON: Record<string, string> = { def: '🧱', fis: '💪', rit: '⚡' };

/**
 * Duelo da Mesa: 6 lances. Quem ataca escolhe chute, drible ou passe; quem defende tenta adivinhar.
 * Os dois rolam o d20 com o atributo. A tela se atualiza sozinha enquanto espera o amigo.
 */
export default function DuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [duel, setDuel] = useState<DuelView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seen = useRef(0);

  const load = useCallback(async () => {
    try {
      const d = await api.duel(id);
      setDuel(d);
      setError(null);
      // lance novo resolvido: vibra (gol a favor ou contra)
      if (d.history.length > seen.current) {
        const last = d.history[d.history.length - 1];
        if (seen.current > 0 && last.goal) (last.attacker === d.mySide ? haptic.success : haptic.fail)();
        seen.current = d.history.length;
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 2000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const choose = async (i: number) => {
    if (busy) return;
    setBusy(true);
    haptic.tap();
    try {
      setDuel(await api.duelChoose(id, i));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const auto = async () => {
    setBusy(true);
    try {
      setDuel(await api.duelAuto(id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!duel) {
    return (
      <Screen>
        {error ? (
          <Card>
            <P>{error}</P>
            <Btn label="Voltar" onPress={() => router.back()} />
          </Card>
        ) : (
          <ActivityIndicator color={t.acc} size="large" style={{ marginTop: 120 }} />
        )}
      </Screen>
    );
  }

  const me = duel.mySide === 'home' ? duel.home : duel.away;
  const op = duel.mySide === 'home' ? duel.away : duel.home;
  const last = duel.history[duel.history.length - 1];
  const turn = duel.turn;

  return (
    <Screen>
      <Btn small label="‹ Voltar" onPress={() => router.back()} />
      <View style={{ height: 10 }} />

      {/* placar */}
      <View style={[styles.board, { backgroundColor: t.card, borderColor: t.line }]}>
        <Side name={duel.home.name} club={duel.home.club} badge={duel.home.badge} me={duel.home.me} />
        <View style={{ alignItems: 'center', minWidth: 90 }}>
          <Text style={[condensed, { color: t.ink, fontSize: 44, lineHeight: 46 }]}>
            {duel.home.goals} <Text style={{ color: t.mut }}>x</Text> {duel.away.goals}
          </Text>
          <Text style={{ color: duel.finished ? t.mut : t.bad, fontFamily: font.bold, fontSize: 11, letterSpacing: 0.8 }}>
            {duel.finished ? 'FIM' : `LANCE ${duel.current} DE ${duel.total}${turn ? ` · ${turn.minute}'` : ''}`}
          </Text>
        </View>
        <Side name={duel.away.name} club={duel.away.club} badge={duel.away.badge} me={duel.away.me} />
      </View>
      <Text style={{ color: t.mut, fontFamily: font.medium, textAlign: 'center', marginBottom: 10 }}>
        {duel.competition}
      </Text>

      {error && (
        <Card accent={t.bad}>
          <Text style={{ color: t.bad, fontFamily: font.semibold }}>{error}</Text>
        </Card>
      )}

      {/* último lance resolvido */}
      {last && <MomentCard key={duel.history.length} m={last} duel={duel} />}

      {/* lance atual */}
      {turn && (
        <Card accent={turn.myChoice == null ? t.acc : undefined}>
          <Eyebrow>{turn.role === 'attack' ? 'Você ataca' : 'Você defende'}</Eyebrow>
          <H2>{turn.role === 'attack' ? 'A bola é sua. Qual a jogada?' : `${op.name} vem para cima. Como você marca?`}</H2>
          <P muted>
            {turn.role === 'attack'
              ? 'Se o defensor adivinhar, ele ganha +4 no dado. Se errar, você ganha +2.'
              : 'Adivinhe a jogada para ganhar +4. Se errar, o atacante ganha +2.'}
          </P>
          {turn.myChoice == null ? (
            turn.options.map((o, i) => (
              <PressableScale
                key={o.label}
                onPress={() => choose(i)}
                disabled={busy}
                style={[styles.option, { borderColor: t.line, backgroundColor: t.cardHi }]}
              >
                <Text style={{ fontSize: 26 }}>{(turn.role === 'attack' ? ATTACK_ICON : DEFENSE_ICON)[o.attribute] ?? '⚽'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 16 }}>{o.label}</Text>
                  <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 13 }}>
                    🎲 d20 + {o.attributeName} {o.value}
                  </Text>
                </View>
                <View style={[styles.bonus, { backgroundColor: alpha(chanceColor(t, 50 + o.bonus * 5), 0.2) }]}>
                  <Text style={[condensed, { color: chanceColor(t, 50 + o.bonus * 5), fontSize: 20 }]}>
                    {o.bonus >= 0 ? `+${o.bonus}` : o.bonus}
                  </Text>
                </View>
              </PressableScale>
            ))
          ) : (
            <View style={styles.waiting}>
              <ActivityIndicator color={t.acc} />
              <Text style={{ color: t.ink, fontFamily: font.semibold, flex: 1 }}>
                Você escolheu “{turn.options[turn.myChoice].label}”. Esperando {op.name}…
              </Text>
            </View>
          )}
          {turn.myChoice != null && duel.autoPickIn != null && (
            <View style={{ marginTop: 8 }}>
              {duel.autoPickIn > 0 ? (
                <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 12, textAlign: 'center' }}>
                  Se {op.name} não escolher em {duel.autoPickIn} s, você pode decidir por ele.
                </Text>
              ) : (
                <Btn small icon="⏱" label={`Decidir por ${op.name}`} onPress={auto} disabled={busy} />
              )}
            </View>
          )}
        </Card>
      )}

      {duel.finished && (
        <Card accent={me.goals > op.goals ? t.good : me.goals < op.goals ? t.bad : t.acc}>
          <Eyebrow>Fim do duelo</Eyebrow>
          <H2>{me.goals > op.goals ? `Você venceu ${op.name}!` : me.goals < op.goals ? `${op.name} venceu desta vez` : 'Empate no duelo'}</H2>
          <P muted>
            {duel.kind === 'league'
              ? 'O placar vale na tabela de vocês dois. Volte para a carreira e toque em Continuar.'
              : 'Amistoso da mesa: o resultado fica no diário.'}
          </P>
          <Btn primary label="Voltar" onPress={() => router.back()} />
        </Card>
      )}

      {duel.history.length > 1 && (
        <Card>
          <Text style={[styles.section, { color: t.mut }]}>LANCES</Text>
          {duel.history
            .slice()
            .reverse()
            .map((m, i) => (
              <View key={i} style={[styles.line, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}>
                <Text style={{ color: t.mut, fontFamily: font.bold, width: 34 }}>{`${m.minute}'`}</Text>
                <Text style={{ flex: 1, color: m.goal ? t.ink : t.mut, fontFamily: m.goal ? font.bold : font.regular, fontSize: 13 }}>{m.text}</Text>
                <Text style={[condensed, { color: t.ink, fontSize: 15 }]}>
                  {m.homeGoals}–{m.awayGoals}
                </Text>
              </View>
            ))}
        </Card>
      )}
    </Screen>
  );
}

function Side({ name, club, badge, me }: { name: string; club: string; badge: DuelView['home']['badge']; me: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Badge badge={badge} size={40} />
      <Text numberOfLines={1} style={{ color: me ? t.acc : t.ink, fontFamily: font.bold, fontSize: 14 }}>
        {name}
        {me ? ' (você)' : ''}
      </Text>
      <Text numberOfLines={1} style={{ color: t.mut, fontFamily: font.medium, fontSize: 11 }}>
        {club}
      </Text>
    </View>
  );
}

/** O lance que acabou de acontecer: as duas jogadas, os dados e o que deu. */
function MomentCard({ m, duel }: { m: DuelMoment; duel: DuelView }) {
  const t = useTheme();
  const atk = m.attacker === 'home' ? duel.home : duel.away;
  const def = m.attacker === 'home' ? duel.away : duel.home;
  const good = m.goal ? atk.me : def.me;
  return (
    <FadeIn>
      <Card accent={good ? t.good : t.bad}>
        <Eyebrow color={m.goal ? t.acc : t.mut}>
          {`${m.goal ? 'GOL!' : 'Defendeu!'} · ${m.minute}'`}
        </Eyebrow>
        <View style={styles.rolls}>
          <Roll who={atk.name} play={m.attackLabel} roll={m.attackRoll} total={m.attackTotal} win={m.goal} />
          <Text style={[condensed, { color: t.mut, fontSize: 22 }]}>vs</Text>
          <Roll who={def.name} play={m.defenseLabel} roll={m.defenseRoll} total={m.defenseTotal} win={!m.goal} />
        </View>
        <P style={{ fontSize: 16, marginTop: 6 }}>{m.text}</P>
        {m.read && <Text style={{ color: t.good, fontFamily: font.semibold, fontSize: 12 }}>{def.name} adivinhou a jogada (+4).</Text>}
        {m.autoPicked && (
          <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 12 }}>
            O jogo escolheu por {m.autoPicked === 'home' ? duel.home.name : duel.away.name}, que demorou.
          </Text>
        )}
      </Card>
    </FadeIn>
  );
}

function Roll({ who, play, roll, total, win }: { who: string; play: string; roll: number; total: number; win: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <D20 value={roll} />
      <Text style={[condensed, { color: win ? t.good : t.mut, fontSize: 22 }]}>{total}</Text>
      <Text numberOfLines={1} style={{ color: t.ink, fontFamily: font.bold, fontSize: 13 }}>
        {who}
      </Text>
      <Text numberOfLines={2} style={{ color: t.mut, fontFamily: font.medium, fontSize: 11, textAlign: 'center' }}>
        {play}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 8 },
  bonus: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, minWidth: 48, alignItems: 'center' },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2, marginBottom: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  rolls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
});
