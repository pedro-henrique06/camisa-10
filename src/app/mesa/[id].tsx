import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Switch, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { MesaView } from '@/api/types';
import { Badge } from '@/components/art';
import { Screen } from '@/components/Screen';
import { Btn, Card, Eyebrow, H1, P, PressableScale } from '@/components/ui';
import { condensed, font, useTheme } from '@/theme';

/** Mesa com amigos: código para chamar a galera, carreiras de cada um, duelos e o diário da mesa. */
export default function MesaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [mesa, setMesa] = useState<MesaView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setMesa(await api.mesa(id));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // a mesa muda quando os amigos jogam: atualiza a cada 5 segundos
  useEffect(() => {
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  if (!mesa) {
    return (
      <Screen>
        {error ? (
          <Card>
            <P>{error}</P>
            <Btn label="Voltar ao início" onPress={() => router.replace('/')} />
          </Card>
        ) : (
          <ActivityIndicator color={t.acc} size="large" style={{ marginTop: 120 }} />
        )}
      </Screen>
    );
  }

  const me = mesa.members.find((m) => m.me);
  const share = () =>
    Share.share({ message: `Entra na minha mesa do Camisa 10! Código: ${mesa.code}` }).catch(() => {});

  const challenge = async (playerId: string) => {
    setBusy(true);
    try {
      const d = await api.challenge(mesa.id, playerId);
      router.push({ pathname: '/duel/[id]', params: { id: d.id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSync = async (v: boolean) => {
    try {
      setMesa(await api.setSync(mesa.id, v));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openDuels = mesa.duels.filter((d) => d.mine && !d.finished);
  const pastDuels = mesa.duels.filter((d) => d.finished).slice(0, 8);

  return (
    <Screen>
      <Btn small label="‹ Início" onPress={() => router.replace('/')} />
      <View style={{ height: 10 }} />
      <Eyebrow>Mesa com amigos</Eyebrow>
      <H1 style={{ fontSize: 40, lineHeight: 42 }}>{mesa.name}</H1>

      <Card>
        <Text style={[styles.section, { color: t.mut }]}>CÓDIGO PARA OS AMIGOS ENTRAREM</Text>
        <View style={styles.codeRow}>
          <Text selectable style={[condensed, { color: t.acc, fontSize: 44, letterSpacing: 6 }]}>
            {mesa.code}
          </Text>
          <Btn small icon="📤" label="Compartilhar" onPress={share} />
        </View>
        <View style={[styles.syncRow, { borderTopColor: t.line }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink, fontFamily: font.bold }}>Calendário junto</Text>
            <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 13 }}>
              {mesa.sync ? 'Ninguém passa da data em que um amigo ainda está.' : 'Cada um joga no seu ritmo.'}
            </Text>
          </View>
          <Switch value={mesa.sync} onValueChange={toggleSync} disabled={!mesa.isOwner} />
        </View>
      </Card>

      {error && (
        <Card accent={t.bad}>
          <Text style={{ color: t.bad, fontFamily: font.semibold }}>{error}</Text>
        </Card>
      )}

      {openDuels.length > 0 && (
        <Card accent={t.acc}>
          <Text style={[styles.section, { color: t.mut }]}>DUELOS EM ANDAMENTO</Text>
          {openDuels.map((d) => (
            <PressableScale
              key={d.id}
              onPress={() => router.push({ pathname: '/duel/[id]', params: { id: d.id } })}
              style={[styles.duel, { borderColor: d.myTurn ? t.acc : t.line, backgroundColor: d.myTurn ? t.accSoft : t.cardHi }]}
            >
              <Text style={{ fontSize: 22 }}>{d.kind === 'league' ? '🏟️' : '⚔️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontFamily: font.bold }}>
                  {d.home} x {d.away}
                </Text>
                <Text style={{ color: t.mut, fontSize: 12, fontFamily: font.medium }}>
                  {d.competition} · {d.homeGoals} x {d.awayGoals}
                </Text>
              </View>
              <Text style={{ color: d.myTurn ? t.acc : t.mut, fontFamily: font.bold }}>{d.myTurn ? 'Sua vez ›' : 'Esperando ›'}</Text>
            </PressableScale>
          ))}
        </Card>
      )}

      <Card>
        <Text style={[styles.section, { color: t.mut }]}>
          JOGADORES ({mesa.members.length} de 6)
        </Text>
        {mesa.members.map((m) => {
          const c = m.career;
          return (
            <View key={m.playerId} style={[styles.member, { borderColor: m.me ? t.acc : t.line, backgroundColor: m.me ? t.accSoft : t.cardHi }]}>
              {m.badge ? <Badge badge={m.badge} size={34} /> : <Text style={{ fontSize: 26 }}>👤</Text>}
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontFamily: font.bold }}>
                  {m.name}
                  {m.me ? ' (você)' : ''}
                </Text>
                <Text style={{ color: t.mut, fontSize: 12, fontFamily: font.medium }} numberOfLines={2}>
                  {c
                    ? `${c.club} · ${c.date ?? 'pré-temporada'} · temp. ${c.season}${c.position ? ` · ${c.position}º` : ''} · OVR ${c.overall} · ${m.titles} títulos`
                    : 'Ainda não começou a carreira'}
                </Text>
              </View>
              {!m.me && c && me?.careerId && <Btn small icon="⚔️" label="Desafiar" onPress={() => challenge(m.playerId)} disabled={busy} />}
            </View>
          );
        })}
        <View style={{ marginTop: 8 }}>
          {me?.careerId ? (
            <Btn primary label="Jogar a minha carreira  ⚽" onPress={() => router.push({ pathname: '/career/[id]', params: { id: me.careerId! } })} />
          ) : (
            <Btn primary label="Criar o meu jogador nesta mesa  ⚽" onPress={() => router.push({ pathname: '/', params: { mesa: mesa.id } })} />
          )}
        </View>
      </Card>

      {pastDuels.length > 0 && (
        <Card>
          <Text style={[styles.section, { color: t.mut }]}>ÚLTIMOS DUELOS</Text>
          {pastDuels.map((d) => (
            <PressableScale key={d.id} onPress={() => d.mine && router.push({ pathname: '/duel/[id]', params: { id: d.id } })} style={styles.past}>
              <Text style={{ fontSize: 16 }}>{d.kind === 'league' ? '🏟️' : '⚔️'}</Text>
              <Text style={{ flex: 1, color: t.ink, fontFamily: font.medium }} numberOfLines={1}>
                {d.home} <Text style={[condensed, { fontSize: 17 }]}>{d.homeGoals} x {d.awayGoals}</Text> {d.away}
              </Text>
              <Text style={{ color: t.mut, fontSize: 12 }}>{d.kind === 'league' ? 'liga' : 'amistoso'}</Text>
            </PressableScale>
          ))}
        </Card>
      )}

      <Card>
        <Text style={[styles.section, { color: t.mut }]}>DIÁRIO DA MESA</Text>
        {mesa.feed.map((f, i) => (
          <View key={i} style={[styles.feed, i > 0 && { borderTopColor: t.line, borderTopWidth: 1 }]}>
            <Text style={{ fontSize: 18, width: 26 }}>{f.icon}</Text>
            <Text style={{ flex: 1, color: t.ink, fontFamily: font.regular, fontSize: 14 }}>{f.text}</Text>
            <Text style={{ color: t.mut, fontSize: 11 }}>{ago(f.at)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

/** "agora", "5 min", "2 h", "3 d". */
function ago(at: string) {
  const s = (Date.now() - new Date(at).getTime()) / 1000;
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
}

const styles = StyleSheet.create({
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2, marginBottom: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 6 },
  duel: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 6 },
  past: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  feed: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 7 },
});

