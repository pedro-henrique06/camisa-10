import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { api, API_URL } from '@/api/client';
import type { CareerSummary, MetaView } from '@/api/types';
import { Badge, Pitch } from '@/components/art';
import { Screen } from '@/components/Screen';
import { Btn, Card, H1, P, Row } from '@/components/ui';
import { useTheme } from '@/theme';

/** Tela inicial: continuar carreira, galeria e criação de jogador (home). */
export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const [meta, setMeta] = useState<MetaView | null>(null);
  const [active, setActive] = useState<CareerSummary[]>([]);
  const [gallery, setGallery] = useState<CareerSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [club, setClub] = useState('Flamengo');
  const [nation, setNation] = useState('Brasil');
  const [open, setOpen] = useState<'club' | 'nation' | null>(null);
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

  const start = async (position: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const v = await api.create({ name: name.trim() || 'Craque', club, nation, position });
      router.push({ pathname: '/career/[id]', params: { id: v.id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const clubInfo = meta?.baseClubs.find((c) => c.name === club);
  const nationInfo = meta?.nations.find((n) => n.name === nation);

  return (
    <Screen>
      <H1>Camisa 10</H1>
      <P muted>Do clube de bairro ao título mundial. Cada dia traz uma decisão sobre a sua vida e a sua carreira.</P>

      {error && (
        <Card style={{ borderColor: t.bad, marginBottom: 16 }}>
          <P>{error}</P>
          <P muted>Servidor: {API_URL}</P>
          <Btn primary label="Tentar de novo" onPress={load} />
        </Card>
      )}

      {active.map((c) => (
        <Card key={c.id} style={{ marginBottom: 16 }}>
          <Text style={{ color: t.ink, fontSize: 17 }}>
            <Text style={{ fontWeight: '700' }}>{c.name}</Text> · {c.age} anos · {c.club}
          </Text>
          <Btn primary label="Continuar carreira" onPress={() => router.push({ pathname: '/career/[id]', params: { id: c.id } })} />
        </Card>
      ))}

      {gallery.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: t.ink, fontWeight: '700', fontSize: 17 }}>Galeria de carreiras</Text>
          {gallery.map((g) => (
            <Row key={g.id} label={`${g.name} · ${g.club}`} value={g.finalTitle ?? ''} />
          ))}
        </Card>
      )}

      {!meta && !error ? (
        <ActivityIndicator color={t.acc} style={{ marginTop: 24 }} />
      ) : meta ? (
        <Card>
          <Text style={[styles.label, { color: t.ink }]}>Nome do jogador</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={20}
            placeholder="Seu nome"
            placeholderTextColor={t.mut}
            style={[styles.input, { color: t.ink, borderColor: t.line }]}
          />

          <Text style={[styles.label, { color: t.ink }]}>Clube da sua base</Text>
          <Pressable onPress={() => setOpen(open === 'club' ? null : 'club')} style={[styles.select, { borderColor: t.line }]}>
            {clubInfo && <Badge badge={clubInfo.badge} size={28} />}
            <Text style={{ color: t.ink, fontSize: 17, flex: 1 }}>{club}</Text>
            <Text style={{ color: t.mut }}>{open === 'club' ? '▲' : '▼'}</Text>
          </Pressable>
          {open === 'club' && (
            <View style={[styles.list, { borderColor: t.line }]}>
              {meta.baseClubs.map((c) => (
                <Pressable
                  key={c.name}
                  onPress={() => {
                    setClub(c.name);
                    setOpen(null);
                  }}
                  style={[styles.item, c.name === club && { backgroundColor: t.line }]}
                >
                  <Badge badge={c.badge} size={22} />
                  <Text style={{ color: t.ink, fontSize: 16 }}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[styles.label, { color: t.ink }]}>Sua seleção</Text>
          <Pressable onPress={() => setOpen(open === 'nation' ? null : 'nation')} style={[styles.select, { borderColor: t.line }]}>
            <Text style={{ fontSize: 20 }}>{nationInfo?.flag}</Text>
            <Text style={{ color: t.ink, fontSize: 17, flex: 1 }}>{nation}</Text>
            <Text style={{ color: t.mut }}>{open === 'nation' ? '▲' : '▼'}</Text>
          </Pressable>
          {open === 'nation' && (
            <View style={[styles.list, { borderColor: t.line }]}>
              {meta.nations.map((n) => (
                <Pressable
                  key={n.name}
                  onPress={() => {
                    setNation(n.name);
                    setOpen(null);
                  }}
                  style={[styles.item, n.name === nation && { backgroundColor: t.line }]}
                >
                  <Text style={{ fontSize: 18 }}>{n.flag}</Text>
                  <Text style={{ color: t.ink, fontSize: 16 }}>{n.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[styles.label, { color: t.ink }]}>Toque na posição em que quer jogar</Text>
          {creating ? <ActivityIndicator color={t.acc} style={{ marginVertical: 40 }} /> : <Pitch onPick={start} />}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '700', fontSize: 17, marginTop: 12 },
  input: { borderWidth: 2, borderRadius: 6, padding: 12, fontSize: 17, marginTop: 8 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 6, padding: 10, marginTop: 8 },
  list: { borderWidth: 1, borderRadius: 6, marginTop: 4, maxHeight: 320, overflow: 'scroll' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10 },
});
