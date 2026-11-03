import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import type { Badge as BadgeT, ClubSearchResult, CountrySummary, CountryView } from '@/api/types';
import { condensed, font, useTheme } from '@/theme';
import { Badge } from './art';
import { FadeIn, PressableScale } from './ui';

export type PickedClub = { id: string; name: string; badge: BadgeT; tier: number; country: string; flag: string; league: string };

const CONFEDS: { key: string; label: string }[] = [
  { key: 'CONMEBOL', label: 'América do Sul' },
  { key: 'UEFA', label: 'Europa' },
  { key: 'CONCACAF', label: 'Américas do Norte e Central' },
  { key: 'AFC', label: 'Ásia' },
  { key: 'CAF', label: 'África' },
  { key: 'OFC', label: 'Oceania' },
];

/** Países que aparecem primeiro, como atalho. */
const POPULAR = ['BR', 'AR', 'PT', 'ES', 'GB-ENG', 'IT', 'DE', 'FR', 'US', 'MX', 'SA', 'JP'];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Props = { selected: PickedClub | null; onPick: (c: PickedClub) => void };

/**
 * Escolha do clube em qualquer país do mundo: busca pelo nome, ou país → divisão (A, B, C) → clube.
 */
export function ClubPicker({ selected, onPick }: Props) {
  const t = useTheme();
  const [countries, setCountries] = useState<CountrySummary[] | null>(null);
  const [iso, setIso] = useState('BR');
  const [country, setCountry] = useState<CountryView | null>(null);
  const [division, setDivision] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClubSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.countries().then(setCountries, (e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    let alive = true;
    api.country(iso).then(
      (c) => alive && setCountry(c),
      (e) => alive && setError((e as Error).message),
    );
    return () => {
      alive = false;
    };
  }, [iso]);

  // busca com atraso, para não chamar a API a cada letra
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let alive = true;
    const id = setTimeout(() => {
      api.searchClubs(q).then(
        (r) => alive && setResults(r),
        () => alive && setResults([]),
      );
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query]);

  const summary = countries?.find((c) => c.iso === iso);
  const popular = useMemo(() => POPULAR.map((p) => countries?.find((c) => c.iso === p)).filter(Boolean) as CountrySummary[], [countries]);
  const filtered = useMemo(
    () => (countries ?? []).filter((c) => !filter.trim() || norm(c.name).includes(norm(filter.trim()))),
    [countries, filter],
  );

  const chooseCountry = (c: CountrySummary) => {
    setCountry(null);
    setIso(c.iso);
    setDivision(0);
    setShowAll(false);
    setFilter('');
  };

  const searching = query.trim().length >= 2;

  return (
    <View>
      {/* busca */}
      <View style={[styles.search, { borderColor: searching ? t.acc : t.line, backgroundColor: t.cardHi }]}>
        <Text style={{ fontSize: 16 }}>🔎</Text>
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            if (v.trim().length < 2) setResults(null);
          }}
          placeholder="Buscar clube em qualquer país"
          placeholderTextColor={t.mut}
          style={{ flex: 1, color: t.ink, fontFamily: font.medium, fontSize: 16, paddingVertical: 4 }}
          autoCorrect={false}
        />
        {!!query && (
          <Pressable
            onPress={() => {
              setQuery('');
              setResults(null);
            }}
            hitSlop={10}
          >
            <Text style={{ color: t.mut, fontSize: 16 }}>✕</Text>
          </Pressable>
        )}
      </View>

      {error && <Text style={{ color: t.bad, fontFamily: font.medium, marginTop: 8 }}>{error}</Text>}

      {searching ? (
        <View style={{ marginTop: 10 }}>
          {results == null ? (
            <ActivityIndicator color={t.acc} style={{ marginVertical: 20 }} />
          ) : results.length === 0 ? (
            <Text style={{ color: t.mut, fontFamily: font.medium, marginVertical: 12 }}>Nenhum clube encontrado.</Text>
          ) : (
            results.map((r) => (
              <PressableScale
                key={r.id}
                onPress={() =>
                  onPick({ id: r.id, name: r.name, badge: r.badge, tier: r.tier, country: r.country, flag: r.flag, league: r.league })
                }
                style={[styles.result, { borderColor: selected?.id === r.id ? t.acc : t.line, backgroundColor: selected?.id === r.id ? t.accSoft : t.cardHi }]}
              >
                <Badge badge={r.badge} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 15 }}>{r.name}</Text>
                  <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 12 }}>
                    {r.flag} {r.country} · {r.league}
                    {r.fictional ? ' · fictício' : ''}
                  </Text>
                </View>
                <Text style={{ color: t.acc, fontSize: 10 }}>{'★'.repeat(r.tier + 1)}</Text>
              </PressableScale>
            ))
          )}
        </View>
      ) : (
        <>
          {/* país */}
          <Text style={[styles.label, { color: t.mut }]}>PAÍS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
            {popular.map((c) => (
              <Pressable
                key={c.iso}
                onPress={() => chooseCountry(c)}
                style={[styles.chip, { borderColor: c.iso === iso ? t.acc : t.line, backgroundColor: c.iso === iso ? t.accSoft : t.cardHi }]}
              >
                <Text style={{ fontSize: 16 }}>{c.flag}</Text>
                <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 13 }}>{c.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowAll((v) => !v)} style={[styles.chip, { borderColor: t.acc, backgroundColor: t.cardHi }]}>
              <Text style={{ color: t.acc, fontFamily: font.bold, fontSize: 13 }}>{showAll ? 'Fechar' : '🌍 Todos os 211'}</Text>
            </Pressable>
          </ScrollView>

          {showAll && countries && (
            <FadeIn>
              <View style={[styles.all, { borderColor: t.line, backgroundColor: t.cardHi }]}>
                <TextInput
                  value={filter}
                  onChangeText={setFilter}
                  placeholder="Filtrar países"
                  placeholderTextColor={t.mut}
                  style={[styles.filter, { color: t.ink, borderColor: t.line }]}
                />
                <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
                  {CONFEDS.map((cf) => {
                    const list = filtered.filter((c) => c.confederation === cf.key);
                    if (!list.length) return null;
                    return (
                      <View key={cf.key}>
                        <Text style={[styles.confed, { color: t.acc }]}>{cf.label.toUpperCase()}</Text>
                        {list.map((c) => (
                          <Pressable key={c.iso} onPress={() => chooseCountry(c)} style={styles.countryRow}>
                            <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                            <Text style={{ color: t.ink, fontFamily: c.iso === iso ? font.bold : font.medium, fontSize: 15, flex: 1 }}>{c.name}</Text>
                            <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 12 }} numberOfLines={1}>
                              {c.leagues[0].name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </FadeIn>
          )}

          {/* divisão */}
          {summary && (
            <View style={styles.tabs}>
              {summary.leagues.map((l) => {
                const on = l.division === division;
                return (
                  <Pressable
                    key={l.division}
                    onPress={() => setDivision(l.division)}
                    style={[styles.tab, { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.acc : t.cardHi }]}
                  >
                    <Text style={[condensed, { color: on ? t.accText : t.ink, fontSize: 20 }]}>{l.letter}</Text>
                    <Text style={{ color: on ? t.accText : t.mut, fontFamily: font.semibold, fontSize: 10, textAlign: 'center' }} numberOfLines={2}>
                      {l.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* clubes */}
          {!country ? (
            <ActivityIndicator color={t.acc} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.grid}>
              {country.leagues[division].clubs.map((c) => {
                const on = selected?.id === c.id;
                return (
                  <PressableScale
                    key={c.id}
                    accessibilityLabel={c.name}
                    onPress={() =>
                      onPick({
                        id: c.id,
                        name: c.name,
                        badge: c.badge,
                        tier: c.tier,
                        country: country.name,
                        flag: country.flag,
                        league: country.leagues[division].name,
                      })
                    }
                    containerStyle={styles.tileBox}
                    style={[styles.tile, { borderColor: on ? t.acc : t.line, backgroundColor: on ? t.accSoft : t.cardHi }]}
                  >
                    <Badge badge={c.badge} size={28} />
                    <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 12, textAlign: 'center' }} numberOfLines={2}>
                      {c.name}
                    </Text>
                    <Text style={{ color: t.acc, fontSize: 9 }}>{'★'.repeat(c.tier + 1)}</Text>
                    {c.fictional && <Text style={{ color: t.mut, fontSize: 9, fontFamily: font.medium }}>fictício</Text>}
                  </PressableScale>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  label: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2, marginTop: 14, marginBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  all: { borderWidth: 1, borderRadius: 14, padding: 10, marginTop: 8 },
  filter: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, fontFamily: font.medium, marginBottom: 6 },
  confed: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1, marginTop: 10, marginBottom: 2 },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  tabs: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tab: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'space-between' },
  tileBox: { width: '31.5%', flexGrow: 1 },
  tile: { width: '100%', minHeight: 96, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 3 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 6 },
});
