import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { api } from '@/api/client';
import type { HistoryView } from '@/api/types';
import { AttributeCard } from '@/components/Hud';
import { Screen } from '@/components/Screen';
import { Btn, Card, H2, P, Row } from '@/components/ui';
import { useTheme } from '@/theme';

/** Evolução da carreira: ficha de atributos e gráfico do overall por temporada (hist). */
export default function History() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [h, setH] = useState<HistoryView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.history(id).then(setH, (e) => setError((e as Error).message));
  }, [id]);

  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/career/[id]', params: { id } }));

  if (!h) {
    return (
      <Screen>
        {error ? (
          <Card>
            <P>{error}</P>
            <Btn primary label="Voltar" onPress={back} />
          </Card>
        ) : (
          <ActivityIndicator color={t.acc} style={{ marginTop: 80 }} />
        )}
      </Screen>
    );
  }

  const n = h.seasons.length;
  const W = 300,
    Q = 110;
  const pts = h.seasons.map((x, i) => [8 + (i * (W - 16)) / Math.max(1, n - 1), Q - 8 - (x.overall / 100) * (Q - 16)]);

  return (
    <Screen>
      <Card>
        <H2>Evolução da carreira</H2>
        <AttributeCard overall={h.overall} position={h.position} attributes={h.attributes} />
        {n > 1 ? (
          <View style={{ marginTop: 8 }}>
            <Svg viewBox={`0 0 ${W} ${Q}`} width="100%" height={Q * 1.2}>
              <Polyline fill="none" stroke={t.acc} strokeWidth={3} points={pts.map((p) => p.join(',')).join(' ')} />
              {pts.map((p, i) => (
                <Circle key={i} cx={p[0]} cy={p[1]} r={3} fill={t.acc} />
              ))}
            </Svg>
          </View>
        ) : (
          <P muted>Termine a primeira temporada para ver o gráfico.</P>
        )}
        <P muted>Overall ao fim de cada temporada</P>
        {h.seasons
          .slice()
          .reverse()
          .map((x, i) => (
            <Row
              key={i}
              label={`${x.age} anos · ${x.club}`}
              value={`${x.overall} · ${x.goals} gols · ${x.assists} assist.${x.title ? ' 🏆' : ''}`}
            />
          ))}
        <P muted>{h.headlines.join(' · ')}</P>
        <Btn primary label="Voltar" onPress={back} />
      </Card>
    </Screen>
  );
}
