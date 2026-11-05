import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { api, API_URL, useAccount } from '@/api/client';
import type { CareerSummary, Difficulty, MesaSummary, MetaView } from '@/api/types';
import { Badge, Jersey } from '@/components/art';
import { ClubPicker, type PickedClub } from '@/components/ClubPicker';
import { PositionPitch } from '@/components/PositionPitch';
import { Screen } from '@/components/Screen';
import { Btn, Card, Eyebrow, FadeIn, H1, H2, P, PressableScale } from '@/components/ui';
import { condensed, font, useTheme } from '@/theme';

const STEPS = ['Nome', 'Clube', 'Seleção', 'Posição'];

/** Tela inicial: capa, continuar carreira, galeria e criação de jogador em 4 passos. */
export default function Home() {
  const t = useTheme();
  const router = useRouter();
  // vindo da tela da mesa: o jogador é criado dentro dela (mesmo mundo dos amigos)
  const { mesa: mesaParam } = useLocalSearchParams<{ mesa?: string }>();
  const account = useAccount();
  const [mesas, setMesas] = useState<MesaSummary[]>([]);
  const [mesaForm, setMesaForm] = useState<'create' | 'join' | null>(null);
  const [mesaName, setMesaName] = useState('');
  const [mesaCode, setMesaCode] = useState('');
  const [mesaBusy, setMesaBusy] = useState(false);
  const [meta, setMeta] = useState<MetaView | null>(null);
  const [active, setActive] = useState<CareerSummary[]>([]);
  const [gallery, setGallery] = useState<CareerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number | null>(mesaParam ? 0 : null);
  const [name, setName] = useState('');
  const [club, setClub] = useState<PickedClub | null>(null);
  const [nationFilter, setNationFilter] = useState('');
  const [nation, setNation] = useState('Brasil');
  const [position, setPosition] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, list, ms] = await Promise.all([api.meta(), api.careers(), api.mesas().catch(() => [] as MesaSummary[])]);
      setMeta(m);
      setMesas(ms);
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

  // entrou ou saiu da conta: as carreiras e as mesas mudam
  useEffect(() => {
    if (account === undefined) return;
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [account, load]);

  const start = async () => {
    if (creating || !position) return;
    setCreating(true);
    try {
      // no difícil sem clube escolhido, o servidor sorteia um da Série C do Brasil
      const body = { name: name.trim() || 'Craque', club: club?.id ?? meta?.baseClubs[0]?.id ?? 'Flamengo', nation, position, difficulty };
      const v = mesaParam ? await api.createMesaCareer(mesaParam, body) : await api.create(body);
      setStep(null);
      router.push({ pathname: '/career/[id]', params: { id: v.id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  // sem escolha, começa no primeiro clube em destaque (Flamengo)
  const clubInfo = club ?? (difficulty !== 'dificil' && meta?.baseClubs[0] ? { ...meta.baseClubs[0], country: 'Brasil', flag: '🇧🇷', league: '' } : null);
  const nationInfo = meta?.nations.find((n) => n.name === nation);

  // ------------------------------------------------------------ criação em passos
  if (step != null && meta) {
    const last = step === STEPS.length - 1;
    const footer = (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Btn label="‹  Voltar" onPress={() => (step === 0 && mesaParam ? router.back() : setStep(step === 0 ? null : step - 1))} />
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
              {clubInfo ? `Base do ${clubInfo.name} ${clubInfo.flag}` : 'Clube da Série C sorteado'} · seleção {nationInfo?.flag} {nation}
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
            {meta.difficulties && (
              <>
                <H2 style={{ marginTop: 16 }}>Dificuldade</H2>
                <View style={{ gap: 8 }}>
                  {meta.difficulties.map((d) => {
                    const on = d.id === difficulty;
                    return (
                      <PressableScale
                        key={d.id}
                        accessibilityLabel={d.name}
                        onPress={() => {
                          setDifficulty(d.id);
                          if (d.id === 'dificil') setClub(null); // o clube precisa ser da Série C
                        }}
                        style={[styles.level, { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.accSoft : t.cardHi }]}
                      >
                        <Text style={{ fontSize: 26 }}>{d.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 16 }}>{d.name}</Text>
                          <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 13 }}>{d.description}</Text>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              </>
            )}
          </Card>
        )}

        {step === 1 && (
          <Card key="s1">
            <Eyebrow>Passo 2</Eyebrow>
            <H2>Clube da sua base</H2>
            {difficulty === 'dificil' ? (
              <P muted>No difícil, você começa num time pequeno: escolha um clube da última divisão (Série C) de qualquer país, ou deixe o jogo sortear.</P>
            ) : (
              <P muted>211 países, cada um com Série A, B e C. Clubes maiores dão mais vitrine, mas a briga por espaço é maior.</P>
            )}
            <ClubPicker selected={club} onPick={setClub} lowestOnly={difficulty === 'dificil'} />
          </Card>
        )}

        {step === 2 && (
          <Card key="s2">
            <Eyebrow>Passo 3</Eyebrow>
            <H2>Sua seleção</H2>
            <P muted>Seleções fortes disputam as copas com mais chance de título.</P>
            <TextInput
              value={nationFilter}
              onChangeText={setNationFilter}
              placeholder="🔎 Buscar entre as 211 seleções"
              placeholderTextColor={t.mut}
              style={[styles.input, { color: t.ink, borderColor: t.line, backgroundColor: t.cardHi, fontSize: 16 }]}
            />
            <View style={styles.grid}>
              {meta.nations
                .filter(
                  (n) =>
                    !nationFilter.trim() ||
                    n.name
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase()
                      .includes(
                        nationFilter
                          .trim()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .toLowerCase(),
                      ),
                )
                .slice(0, nationFilter.trim() ? 211 : 24)
                .map((n) => {
                  const on = n.name === nation;
                  return (
                    <PressableScale
                      key={n.name}
                      onPress={() => setNation(n.name)}
                      containerStyle={styles.tileBox}
                      style={[styles.tile, { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.accSoft : t.cardHi }]}
                      accessibilityLabel={n.name}
                    >
                      <Text style={{ fontSize: 28 }}>{n.flag}</Text>
                      <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 12, textAlign: 'center' }} numberOfLines={2}>
                        {n.name}
                      </Text>
                    </PressableScale>
                  );
                })}
            </View>
            {!nationFilter.trim() && (
              <P muted style={{ textAlign: 'center', fontSize: 13 }}>
                Mostrando as 24 mais fortes. Use a busca para ver todas.
              </P>
            )}
          </Card>
        )}

        {step === 3 && (
          <Card key="s3">
            <Eyebrow>Passo 4</Eyebrow>
            <H2>Onde você joga?</H2>
            <P muted>Toque numa camisa. A posição define quais atributos pesam no seu overall.</P>
            <PositionPitch selected={position} onPick={setPosition} info={meta.positionInfo} width={270} />
            {error && <P style={{ color: t.bad }}>{error}</P>}
          </Card>
        )}
      </Screen>
    );
  }

  // ------------------------------------------------------------ capa
  return (
    <Screen>
      {account !== undefined && (
        <PressableScale
          onPress={() => router.push('/conta')}
          containerStyle={{ alignSelf: 'flex-end' }}
          style={[styles.account, { borderColor: account ? t.line : t.acc, backgroundColor: account ? t.card : t.accSoft }]}
          accessibilityLabel={account ? 'Minha conta' : 'Entrar ou criar conta'}
        >
          <Text style={{ fontSize: 14 }}>👤</Text>
          <Text style={{ color: account ? t.ink : t.acc, fontFamily: font.bold, fontSize: 13 }} numberOfLines={1}>
            {account ? account.name : 'Entrar na conta'}
          </Text>
        </PressableScale>
      )}
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

      {meta && (
        <FadeIn delay={160}>
          <Text style={[styles.section, { color: t.mut }]}>JOGAR COM AMIGOS</Text>
          <Card>
            <P muted style={{ marginTop: 0 }}>
              Monte uma mesa: todos no mesmo mundo, o calendário andando junto e duelo de dados quando os clubes de vocês se enfrentam.
            </P>
            {account === null && (
              <PressableScale onPress={() => router.push('/conta')} style={[styles.hint, { borderColor: t.line, backgroundColor: t.cardHi }]}>
                <Text style={{ fontSize: 16 }}>🔐</Text>
                <Text style={{ flex: 1, color: t.mut, fontFamily: font.medium, fontSize: 13 }}>
                  Crie uma conta para não perder as mesas e carreiras se trocar de celular.
                </Text>
                <Text style={{ color: t.acc, fontFamily: font.bold, fontSize: 13 }}>Criar ›</Text>
              </PressableScale>
            )}
            {mesaForm == null ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Btn
                    label="🎲  Criar mesa"
                    onPress={() => {
                      if (!name && account) setName(account.name);
                      setMesaForm('create');
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Btn
                    label="🔑  Entrar"
                    onPress={() => {
                      if (!name && account) setName(account.name);
                      setMesaForm('join');
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={20}
                  placeholder="Seu nome na mesa"
                  placeholderTextColor={t.mut}
                  style={[styles.input, { color: t.ink, borderColor: t.line, backgroundColor: t.cardHi, fontSize: 16 }]}
                />
                {mesaForm === 'create' ? (
                  <TextInput
                    value={mesaName}
                    onChangeText={setMesaName}
                    maxLength={40}
                    placeholder="Nome da mesa (ex.: Resenha de sexta)"
                    placeholderTextColor={t.mut}
                    style={[styles.input, { color: t.ink, borderColor: t.line, backgroundColor: t.cardHi, fontSize: 16 }]}
                  />
                ) : (
                  <TextInput
                    value={mesaCode}
                    onChangeText={(v) => setMesaCode(v.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    placeholder="Código de 6 letras"
                    placeholderTextColor={t.mut}
                    style={[styles.input, { color: t.ink, borderColor: t.line, backgroundColor: t.cardHi, letterSpacing: 4 }]}
                  />
                )}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Btn label="Cancelar" onPress={() => setMesaForm(null)} />
                  </View>
                  <View style={{ flex: 1.4 }}>
                    <Btn
                      primary
                      busy={mesaBusy}
                      disabled={mesaForm === 'join' && mesaCode.trim().length < 6}
                      label={mesaForm === 'create' ? 'Criar' : 'Entrar'}
                      onPress={async () => {
                        setMesaBusy(true);
                        try {
                          const m =
                            mesaForm === 'create'
                              ? await api.createMesa(mesaName.trim() || 'Mesa dos amigos', name.trim() || 'Jogador')
                              : await api.joinMesa(mesaCode.trim(), name.trim() || 'Jogador');
                          setMesaForm(null);
                          router.push({ pathname: '/mesa/[id]', params: { id: m.id } });
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setMesaBusy(false);
                        }
                      }}
                    />
                  </View>
                </View>
              </View>
            )}
            {mesas.map((m) => (
              <PressableScale
                key={m.id}
                onPress={() => router.push({ pathname: '/mesa/[id]', params: { id: m.id } })}
                style={[styles.resume, { backgroundColor: t.cardHi, borderColor: t.line, marginTop: 8, marginBottom: 0 }]}
              >
                <Text style={{ fontSize: 24 }}>🎲</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.ink, fontFamily: font.bold }}>{m.name}</Text>
                  <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 13 }}>
                    {m.members} jogador{m.members === 1 ? '' : 'es'} · código {m.code}
                  </Text>
                </View>
                <Text style={{ color: t.acc, fontFamily: font.bold }}>Abrir ›</Text>
              </PressableScale>
            ))}
          </Card>
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
  account: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, maxWidth: 200 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 10 },
  section: { fontFamily: font.bold, fontSize: 12, letterSpacing: 1.4, marginTop: 24, marginBottom: 8 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8 },
  gallery: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  galleryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 14 },
  input: { borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 20, marginTop: 8, fontFamily: font.semibold },
  level: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'space-between' },
  tileBox: { width: '31.5%', flexGrow: 1 },
  tile: { width: '100%', minHeight: 92, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4 },
});
