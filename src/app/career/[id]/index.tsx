import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { ActionType, GameView } from '@/api/types';
import { CareerTabs, type CareerTab } from '@/components/CareerTabs';
import { Hud } from '@/components/Hud';
import { Screen } from '@/components/Screen';
import { Btn, Card, P } from '@/components/ui';
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

  const act = async (type: ActionType, index?: number, power?: number) => {
    if (!view || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await api.act(view.id, view.version, type, index, power);
      setView(next);
      // toda ação leva de volta para a aba Hoje, onde a próxima decisão aparece
      setTab('hoje');
      scroll.current?.scrollTo({ y: 0, animated: true });
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
  const choose = (i: number, power?: number) => act('Choose', i, power);
  // Remonta a tela a cada nova versão para reiniciar as animações.
  const key = `${view.phase}-${view.version}`;

  // Ação principal fixa no rodapé, quando a fase tem uma.
  let footer: ReactNode = null;
  switch (view.phase) {
    case 'Calendar':
      footer = <Btn primary label={view.calendar?.nextDate ? `Ir para ${view.calendar.nextDate}  ›` : `Começar o dia ${view.calendar?.nextDay ?? ''}  ›`} onPress={next} busy={busy} />;
      break;
    case 'Result':
      footer = <Btn primary label="Continuar  ›" onPress={next} busy={busy} />;
      break;
    case 'Promotion':
      footer = <Btn primary label="Começar a carreira profissional  ›" onPress={next} busy={busy} />;
      break;
    case 'SeasonSummary':
      footer = <Btn primary label="Próxima temporada  ›" onPress={next} busy={busy} />;
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
  const waiting = view.phase !== 'Calendar';
  const bottom = (
    <View style={{ gap: 8 }}>
      {footer}
      <CareerTabs tab={tab} onChange={changeTab} alert={waiting} />
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
      {tab === 'jogador' && <PlayerExtras view={view} />}
      {tab === 'hoje' && (
        <>
          {view.phase === 'Calendar' && view.calendar && <Calendar key={key} cal={view.calendar} />}
          {(view.phase === 'Event' || view.phase === 'Penalty') && view.event && (
            <EventCard key={key} ev={view.event} onChoose={choose} busy={busy} />
          )}
          {view.phase === 'Result' && view.result && <ResultCard key={key} r={view.result} />}
          {view.phase === 'Market' && view.market && (
            <MarketCard key={key} m={view.market} onChoose={choose} onStay={() => act('Stay')} busy={busy} />
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
