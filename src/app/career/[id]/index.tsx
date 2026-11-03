import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text } from 'react-native';

import { api } from '@/api/client';
import type { ActionType, GameView } from '@/api/types';
import { Hud } from '@/components/Hud';
import { Screen } from '@/components/Screen';
import { Btn, Card, P } from '@/components/ui';
import { Calendar } from '@/phases/Calendar';
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
import { useTheme } from '@/theme';

/** Tela de jogo: mostra a fase atual vinda do servidor e envia as ações do jogador. */
export default function CareerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [view, setView] = useState<GameView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setView(await api.get(id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

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

  const act = async (type: ActionType, index?: number) => {
    if (!view || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await api.act(view.id, view.version, type, index);
      setView(next);
      scroll.current?.scrollTo({ y: 0, animated: false });
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
          <ActivityIndicator color={t.acc} style={{ marginTop: 80 }} />
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
  const choose = (i: number) => act('Choose', i);
  // Remonta a tela a cada nova versão para reiniciar as animações.
  const key = `${view.phase}-${view.version}`;

  return (
    <Screen scrollRef={scroll}>
      <Hud
        hud={view.hud}
        busy={busy}
        onHistory={() => router.push({ pathname: '/career/[id]/history', params: { id: view.id } })}
        onSearchClub={() => act('SearchClub')}
      />
      {error && (
        <Card style={{ borderColor: t.bad, marginBottom: 12 }}>
          <Text style={{ color: t.bad }}>{error}</Text>
          <Btn small label="Recarregar" onPress={load} />
        </Card>
      )}
      {view.phase === 'Calendar' && view.calendar && <Calendar key={key} cal={view.calendar} onNext={next} busy={busy} />}
      {(view.phase === 'Event' || view.phase === 'Penalty') && view.event && (
        <EventCard key={key} ev={view.event} onChoose={choose} busy={busy} />
      )}
      {view.phase === 'Result' && view.result && <ResultCard key={key} r={view.result} onNext={next} busy={busy} />}
      {view.phase === 'Market' && view.market && (
        <MarketCard key={key} m={view.market} onChoose={choose} onStay={() => act('Stay')} busy={busy} />
      )}
      {view.phase === 'Swap' && view.swap && (
        <SwapCard key={key} current={view.swap.current} suggested={view.swap.suggested} onChoose={choose} busy={busy} />
      )}
      {view.phase === 'Promotion' && view.promotion && (
        <PromotionCard key={key} club={view.promotion.club} onNext={next} busy={busy} />
      )}
      {view.phase === 'SeasonSummary' && view.season && <SeasonCard key={key} s={view.season} onNext={next} busy={busy} />}
      {view.phase === 'Decision' && view.decision && (
        <DecisionCard key={key} age={view.decision.age} onContinue={next} onRetire={() => act('Retire')} busy={busy} />
      )}
    </Screen>
  );
}
