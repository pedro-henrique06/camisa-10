import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { ActionType, GameView } from '@/api/types';
import { CareerTabs, type CareerTab } from '@/components/CareerTabs';
import { Hud } from '@/components/Hud';
import { TrophyRoom } from '@/components/TrophyRoom';
import { Screen } from '@/components/Screen';
import { Btn, Card, Eyebrow, H2, haptic, P, PressableScale } from '@/components/ui';
import { Calendar, SeasonPage, TablePage } from '@/phases/Calendar';
import {
  DecisionCard,
  EventCard,
  FinalScreen,
  MarketCard,
  PromotionCard,
  ResultCard,
  SeasonCard,
  SwapCard,
} from '@/phases/Phases';
import { font, useTheme } from '@/theme';

/** Tela de jogo: mostra a fase atual vinda do servidor e envia as ações do jogador. */
export default function CareerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [view, setView] = useState<GameView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CareerTab>('hoje');
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const inFlight = useRef(false);

  const load = async () => {
    setError(null);
    try {
      setView(await api.get(id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    let alive = true;
    api.get(id).then(
      (v) => alive && setView(v),
      (e) => alive && setError((e as Error).message),
    );
    return () => {
      alive = false;
    };
  }, [id]);

  // mesa: enquanto espera um amigo chegar na data, atualiza a cada 4 segundos
  const waitingNow = (view?.phase === 'Calendar' || view?.phase === 'SeasonSummary') && (view?.mesa?.waitingFor.length ?? 0) > 0;
  useEffect(() => {
    if (!waitingNow) return;
    const timer = setInterval(async () => {
      try {
        setView(await api.get(id));
      } catch {}
    }, 4000);
    return () => clearInterval(timer);
  }, [waitingNow, id]);

  const act = async (type: ActionType, index?: number, power?: number, clubId?: string) => {
    if (!view || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await api.act(view.id, view.version, type, index, power, clubId);
      setView(next);
      // toda ação leva de volta para a aba Hoje, onde a próxima decisão aparece
      setTab('hoje');
      // oferecer-se a um clube: a resposta aparece ali mesmo, no fim do mercado
      if (type === 'Offer') {
        haptic.tap();
        setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
      } else scroll.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (!view) {
    return (
      <Screen>
        {error ? (
          <Card>
            <P>{error}</P>
            <Btn primary label="Tentar de novo" onPress={load} />
            <Btn label="Voltar ao início" onPress={() => router.replace('/')} />
          </Card>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 120, gap: 12 }}>
            <ActivityIndicator color={t.acc} size="large" />
            <Text style={{ color: t.mut, fontFamily: font.medium }}>Entrando em campo…</Text>
          </View>
        )}
      </Screen>
    );
  }

  if (view.phase === 'Finished' && view.final) {
    return (
      <Screen scrollRef={scroll}>
        <FinalScreen f={view.final} onHome={() => router.replace('/')} />
      </Screen>
    );
  }

  const next = () => act('Continue');
  // mesa: esperando um amigo chegar nesta data
  const waiting = view.phase === 'Calendar' || view.phase === 'SeasonSummary' ? view.mesa?.waitingFor ?? [] : [];
  const choose = (i: number, power?: number) => act('Choose', i, power);
  // Remonta a tela a cada nova versão para reiniciar as animações.
  const key = `${view.phase}-${view.version}`;

  // Ação principal fixa no rodapé, quando a fase tem uma.
  let footer: ReactNode = null;
  switch (view.phase) {
    case 'Calendar':
      footer = view.mesa?.mode === 'turno' ? (
        view.mesa.ready ? (
          <Btn label={`✅  Pronto · esperando ${waiting.join(', ') || 'a mesa'}…`} onPress={load} disabled={busy} />
        ) : (
          <Btn
            primary
            label={`✋  Pronto${view.calendar?.nextDate ? ` · ir para ${view.calendar.nextDate}` : ''}`}
            onPress={next}
            busy={busy}
          />
        )
      ) : waiting.length ? (
        <Btn label={`⏳  Esperando ${waiting.join(', ')}…`} onPress={load} disabled={busy} />
      ) : (
        <Btn primary label={view.calendar?.nextDate ? `Ir para ${view.calendar.nextDate}  ›` : `Começar o dia ${view.calendar?.nextDay ?? ''}  ›`} onPress={next} busy={busy} />
      );
      break;
    case 'Duel':
      footer = <Btn primary label="Ver o resultado do duelo  ›" onPress={next} busy={busy} />;
      break;
    case 'Result':
      footer = <Btn primary label="Continuar  ›" onPress={next} busy={busy} />;
      break;
    case 'Promotion':
      footer = <Btn primary label="Começar a carreira profissional  ›" onPress={next} busy={busy} />;
      break;
    case 'SeasonSummary':
      footer = waiting.length ? (
        <Btn label={`⏳  Esperando ${waiting.join(', ')} fechar a temporada…`} onPress={load} disabled={busy} />
      ) : (
        <Btn primary label="Próxima temporada  ›" onPress={next} busy={busy} />
      );
      break;
    case 'Decision':
      footer = (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Btn label="Pendurar as chuteiras" onPress={() => act('Retire')} disabled={busy} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn primary label="Seguir jogando" onPress={next} busy={busy} />
          </View>
        </View>
      );
      break;
  }

  const changeTab = (next: CareerTab) => {
    setTab(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  // a aba Hoje ganha um aviso quando há uma decisão esperando e o jogador está em outra aba
  const pending = view.phase !== 'Calendar';
  const bottom = (
    <View style={{ gap: 8 }}>
      {footer}
      <CareerTabs tab={tab} onChange={changeTab} alert={pending} />
    </View>
  );

  return (
    <Screen scrollRef={scroll} footer={bottom} footerSpace={footer ? 180 : 110}>
      {tab === 'jogador' ? (
        <Hud
          hud={view.hud}
          busy={busy}
          onHistory={() => router.push({ pathname: '/career/[id]/history', params: { id: view.id } })}
          onSearchClub={() => act('SearchClub')}
        />
      ) : (
        <Hud hud={view.hud} compact onHistory={() => router.push({ pathname: '/career/[id]/history', params: { id: view.id } })} />
      )}
      {error && (
        <Card accent={t.bad} style={{ marginBottom: 12 }}>
          <Text style={{ color: t.bad, fontFamily: font.semibold }}>{error}</Text>
          <Btn small label="Recarregar" onPress={load} />
        </Card>
      )}
      {tab === 'calendario' && view.calendar && <SeasonPage cal={view.calendar} />}
      {tab === 'tabela' && view.calendar && <TablePage cal={view.calendar} />}
      {tab === 'jogador' && view.hud.trophies && <TrophyRoom room={view.hud.trophies} />}
      {tab === 'jogador' && <PlayerExtras view={view} />}
      {tab === 'hoje' && (
        <>
          {view.mesa && (
            <PressableScale
              onPress={() => router.push({ pathname: '/mesa/[id]', params: { id: view.mesa!.id } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, borderRadius: 12, padding: 10, marginBottom: 12 }}
            >
              <Text style={{ fontSize: 18 }}>🎲</Text>
              <Text style={{ flex: 1, color: t.ink, fontFamily: font.semibold }} numberOfLines={1}>
                {view.mesa.name} ·{' '}
                {view.mesa.friends
                  .filter((f) => !f.me)
                  .map((f) => (view.mesa!.mode === 'turno' ? `${f.ready ? '✅' : '⏳'} ${f.name}` : `${f.name} (${f.date ?? 'início'})`))
                  .join(', ') || 'chame os amigos'}
              </Text>
              <Text style={{ color: t.acc, fontFamily: font.bold }}>Mesa ›</Text>
            </PressableScale>
          )}
          {view.phase === 'Duel' && view.duel && (
            <Card accent={t.acc}>
              <Eyebrow>Clássico da Mesa · {view.duel.competition}</Eyebrow>
              <H2>Contra {view.duel.opponentName}</H2>
              <P>
                O jogo da rodada é contra o {view.duel.opponentClub}, de {view.duel.opponentName}. Desta vez a decisão é dos dois: 6 lances, um
                ataca e o outro tenta adivinhar a jogada.
              </P>
              {view.duel.duelId && (
                <Btn primary label="Jogar o duelo  ⚔️" onPress={() => router.push({ pathname: '/duel/[id]', params: { id: view.duel!.duelId! } })} />
              )}
            </Card>
          )}
          {view.phase === 'Calendar' && view.calendar && <Calendar key={key} cal={view.calendar} />}
          {(view.phase === 'Event' || view.phase === 'Penalty') && view.event && (
            <EventCard key={key} ev={view.event} onChoose={choose} busy={busy} />
          )}
          {view.phase === 'Result' && view.result && <ResultCard key={key} r={view.result} />}
          {view.phase === 'Market' && view.market && (
            <MarketCard
              key={key}
              m={view.market}
              onChoose={choose}
              onStay={() => act('Stay')}
              onOffer={(clubId, ask) => act('Offer', ask, undefined, clubId)}
              busy={busy}
            />
          )}
          {view.phase === 'Swap' && view.swap && (
            <SwapCard key={key} current={view.swap.current} suggested={view.swap.suggested} onChoose={choose} busy={busy} />
          )}
          {view.phase === 'Promotion' && view.promotion && <PromotionCard key={key} club={view.promotion.club} />}
          {view.phase === 'SeasonSummary' && view.season && <SeasonCard key={key} s={view.season} />}
          {view.phase === 'Decision' && view.decision && <DecisionCard key={key} age={view.decision.age} />}
        </>
      )}
    </Screen>
  );
}

/** Aba Jogador: a carreira em números (o atalho para a evolução fica no cartão do jogador). */
function PlayerExtras({ view }: { view: GameView }) {
  const t = useTheme();
  const h = view.hud;
  const rows: [string, string][] = [
    ['Temporada', `${h.seasonGoals} gols · ${h.seasonAssists} assistências`],
    ['Carreira', `${h.goals} gols · ${h.assists} assistências`],
    ['Clube', `${h.club}${h.league ? ' · ' + h.league : ''}`],
    ['Contrato', h.base ? 'Categoria de base' : `${h.contract} ano${h.contract === 1 ? '' : 's'}`],
    ['Salário', `R$ ${h.salary} mil/mês`],
  ];
  return (
    <Card>
      <Text style={{ color: t.mut, fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2, marginBottom: 6 }}>CARREIRA</Text>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: t.line }}>
          <Text style={{ color: t.mut, fontFamily: font.medium }}>{k}</Text>
          <Text style={{ color: t.ink, fontFamily: font.semibold, flexShrink: 1, textAlign: 'right' }}>{v}</Text>
        </View>
      ))}
    </Card>
  );
}
