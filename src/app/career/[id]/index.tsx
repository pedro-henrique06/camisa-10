import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

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
import { font, useTheme } from '@/theme';

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
      footer = <Btn primary label={`Começar o dia ${view.calendar?.nextDay ?? ''}  ›`} onPress={next} busy={busy} />;
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

  return (
    <Screen scrollRef={scroll} footer={footer}>
      <Hud
        hud={view.hud}
        compact={view.phase === 'Penalty' || (view.phase === 'Result' && !!view.result?.penalty)}
        busy={busy}
        onHistory={() => router.push({ pathname: '/career/[id]/history', params: { id: view.id } })}
        onSearchClub={() => act('SearchClub')}
      />
      {error && (
        <Card accent={t.bad} style={{ marginBottom: 12 }}>
          <Text style={{ color: t.bad, fontFamily: font.semibold }}>{error}</Text>
          <Btn small label="Recarregar" onPress={load} />
        </Card>
      )}
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
    </Screen>
  );
}
