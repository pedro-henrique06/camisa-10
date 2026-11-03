import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { api, API_URL } from '@/api/client';
import type { CareerSummary, MetaView } from '@/api/types';
import { Badge, Jersey, Pitch } from '@/components/art';
import { Screen } from '@/components/Screen';
import { Btn, Card, Eyebrow, FadeIn, H1, H2, P, PressableScale } from '@/components/ui';
import { condensed, font, useTheme } from '@/theme';

const STEPS = ['Nome', 'Clube', 'Seleção', 'Posição'];

/** Tela inicial: capa, continuar carreira, galeria e criação de jogador em 4 passos. */
export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const [meta, setMeta] = useState<MetaView | null>(null);
  const [active, setActive] = useState<CareerSummary[]>([]);
  const [gallery, setGallery] = useState<CareerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [club, setClub] = useState('Flamengo');
  const [nation, setNation] = useState('Brasil');
  const [position, setPosition] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, list] = await Promise.all([api.meta(), api.careers()]);
      setMeta(m);
      setActive(list.filter((c) => c.status === 'Active').slice(0, 3));
      setGallery(list.filter((c) => c.status === 'Finished').slice(0, 8));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const start = async () => {
    if (creating || !position) return;
    setCreating(true);
    try {
      const v = await api.create({ name: name.trim() || 'Craque', club, nation, position });
      setStep(null);
      router.push({ pathname: '/career/[id]', params: { id: v.id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const clubInfo = meta?.baseClubs.find((c) => c.name === club);
  const nationInfo = meta?.nations.find((n) => n.name === nation);

  // ------------------------------------------------------------ criação em passos
  if (step != null && meta) {
    const last = step === STEPS.length - 1;
    const footer = (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Btn label="‹  Voltar" onPress={() => setStep(step === 0 ? null : step - 1)} />
        </View>
        <View style={{ flex: 1.4 }}>
          {last ? (
            <Btn primary label="Entrar em campo  ⚽" onPress={start} busy={creating} disabled={!position} />
          ) : (
            <Btn primary label="Próximo  ›" onPress={() => setStep(step + 1)} />
          )}
        </View>
      </View>
    );
    return (
      <Screen footer={footer}>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, gap: 4 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? t.acc : t.line }} />
              <Text style={{ color: i === step ? t.ink : t.mut, fontSize: 12, fontFamily: font.semibold }}>{s}</Text>
            </View>
          ))}
        </View>

        {/* prévia do jogador */}
        <View style={[styles.preview, { backgroundColor: t.card, borderColor: t.line }]}>
          {clubInfo && <Badge badge={clubInfo.badge} size={44} />}
          <View style={{ flex: 1 }}>
            <Text style={[condensed, { color: t.ink, fontSize: 24 }]} numberOfLines={1}>
              {name.trim() || 'Craque'}
            </Text>
            <Text style={{ color: t.mut, fontFamily: font.medium }}>
              Base do {club} · {nationInfo?.flag} {nation}
              {position ? ` · ${position}` : ''}
            </Text>
          </View>
        </View>

        {step === 0 && (
          <Card key="s0">
            <Eyebrow>Passo 1</Eyebrow>
            <H2>Como você se chama?</H2>
            <P muted>É o nome que vai estar nas manchetes.</P>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={20}
              placeholder="Seu nome"
              placeholderTextColor={t.mut}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => setStep(1)}
              style={[styles.input, { color: t.ink, borderColor: t.acc, backgroundColor: t.cardHi }]}
            />
          </Card>
        )}

        {step === 1 && (
          <Card key="s1">
            <Eyebrow>Passo 2</Eyebrow>
            <H2>Clube da sua base</H2>
            <P muted>Clubes maiores dão mais vitrine, mas a briga por espaço é maior.</P>
            <View style={styles.grid}>
              {meta.baseClubs.map((c) => {
                const on = c.name === club;
                return (
                  <PressableScale
                    key={c.name}
                    onPress={() => setClub(c.name)}
                    style={[styles.tile, { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.accSoft : t.cardHi }]}
                    accessibilityLabel={c.name}
                  >
                    <Badge badge={c.badge} size={30} />
                    <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 12, textAlign: 'center' }} numberOfLines={2}>
                      {c.name}
                    </Text>
                    <Text style={{ color: t.acc, fontSize: 10 }}>{'★'.repeat(c.tier + 1)}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </Card>
        )}

        {step === 2 && (
          <Card key="s2">
            <Eyebrow>Passo 3</Eyebrow>
            <H2>Sua seleção</H2>
            <P muted>Seleções fortes disputam as copas com mais chance de título.</P>
            <View style={styles.grid}>
              {meta.nations.map((n) => {
                const on = n.name === nation;
                return (
                  <PressableScale
                    key={n.name}
                    onPress={() => setNation(n.name)}
                    style={[styles.tile, { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.accSoft : t.cardHi }]}
                    accessibilityLabel={n.name}
                  >
                    <Text style={{ fontSize: 28 }}>{n.flag}</Text>
                    <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 12, textAlign: 'center' }}>{n.name}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </Card>
        )}

        {step === 3 && (
          <Card key="s3">
            <Eyebrow>Passo 4</Eyebrow>
            <H2>Onde você joga?</H2>
            <P muted>Toque na posição. Ela define quais atributos pesam no seu overall.</P>
            <Pitch selected={position} onPick={setPosition} width={260} />
            {error && <P style={{ color: t.bad }}>{error}</P>}
          </Card>
        )}
      </Screen>
    );
  }

  // ------------------------------------------------------------ capa
  return (
    <Screen>
      <FadeIn>
        <View style={styles.hero}>
          <Jersey size={140} />
          <Eyebrow>Simulador de carreira</Eyebrow>
          <H1 style={{ fontSize: 64, lineHeight: 64 }}>
            Camisa <Text style={{ color: t.acc }}>10</Text>
          </H1>
          <P muted style={{ textAlign: 'center', maxWidth: 360 }}>
            Do clube de bairro ao título mundial. Cada dia traz uma decisão sobre a sua vida e a sua carreira.
          </P>
        </View>
      </FadeIn>

      {error && (
        <Card accent={t.bad} style={{ marginBottom: 16 }}>
          <P>{error}</P>
          <P muted>Servidor: {API_URL}</P>
          <Btn primary label="Tentar de novo" onPress={load} />
        </Card>
      )}

      {!meta && !error && <ActivityIndicator color={t.acc} size="large" style={{ marginTop: 24 }} />}

      {meta && (
        <FadeIn delay={120}>
          <Btn primary label="Nova carreira  ⚽" onPress={() => setStep(0)} />
        </FadeIn>
      )}

      {active.length > 0 && (
        <FadeIn delay={200}>
          <Text style={[styles.section, { color: t.mut }]}>CONTINUAR</Text>
          {active.map((c) => (
            <PressableScale
              key={c.id}
              onPress={() => router.push({ pathname: '/career/[id]', params: { id: c.id } })}
              style={[styles.resume, { backgroundColor: t.card, borderColor: t.accSoft }]}
            >
              <Text style={{ fontSize: 26 }}>▶️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[condensed, { color: t.ink, fontSize: 22 }]}>{c.name}</Text>
                <Text style={{ color: t.mut, fontFamily: font.medium }}>
                  {c.age} anos · {c.position} · {c.club}
                </Text>
              </View>
              <Text style={{ color: t.acc, fontFamily: font.bold }}>Jogar ›</Text>
            </PressableScale>
          ))}
        </FadeIn>
      )}

      {gallery.length > 0 && (
        <FadeIn delay={280}>
          <Text style={[styles.section, { color: t.mut }]}>GALERIA DE CARREIRAS</Text>
          <View style={[styles.gallery, { backgroundColor: t.card, borderColor: t.line }]}>
            {gallery.map((g, i) => (
              <View key={g.id} style={[styles.galleryRow, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}>
                <Text style={{ fontSize: 18 }}>{/Lenda/.test(g.finalTitle ?? '') ? '🏆' : /Ídolo/.test(g.finalTitle ?? '') ? '⭐' : '👟'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.ink, fontFamily: font.bold }}>{g.name}</Text>
                  <Text style={{ color: t.mut, fontSize: 13, fontFamily: font.regular }}>{g.club}</Text>
                </View>
                <Text style={{ color: t.acc, fontFamily: font.semibold, fontSize: 13, textAlign: 'right', flexShrink: 1 }}>{g.finalTitle}</Text>
              </View>
            ))}
          </View>
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 12, paddingBottom: 12 },
  section: { fontFamily: font.bold, fontSize: 12, letterSpacing: 1.4, marginTop: 24, marginBottom: 8 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8 },
  gallery: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  galleryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 14 },
  input: { borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 20, marginTop: 8, fontFamily: font.semibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'space-between' },
  tile: { width: '31.5%', flexGrow: 1, minHeight: 92, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4 },
});
