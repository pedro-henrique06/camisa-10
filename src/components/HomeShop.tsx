import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { HomeItem, HomeView } from '@/api/types';
import { alpha, condensed, font, useTheme } from '@/theme';
import { Btn, Card, PressableScale } from './ui';

const money = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, ''));

/**
 * Sua casa: equipamentos e profissionais comprados com o dinheiro da carreira. Seguram a evolução quando
 * você fica mais velho, diminuem lesões e alongam a carreira.
 */
export function HomeShop({ home, onBuy, busy }: { home: HomeView; onBuy: (id: string) => void; busy?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  const owned = home.items.filter((i) => i.owned);
  const shop = home.items.filter((i) => !i.owned);
  return (
    <Card>
      <View style={styles.head}>
        <Text style={[styles.section, { color: t.mut, flex: 1 }]}>🏠 SUA CASA</Text>
        <Text style={[condensed, { color: t.good, fontSize: 20 }]}>R$ {money(home.money)} mi</Text>
      </View>
      <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 13, marginBottom: 8 }}>{home.note}</Text>

      {owned.length > 0 && (
        <View style={styles.ownedRow}>
          {owned.map((i) => (
            <View key={i.id} style={[styles.ownedChip, { borderColor: t.good, backgroundColor: alpha(t.good, 0.12) }]}>
              <Text style={{ fontSize: 14 }}>{i.icon}</Text>
              <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 12 }}>{i.name}</Text>
            </View>
          ))}
        </View>
      )}
      {home.upkeep > 0 && (
        <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 12, marginBottom: 8 }}>
          Profissionais contratados: R$ {money(home.upkeep)} mi por temporada.
        </Text>
      )}

      {shop.map((i) => (
        <ShopItem key={i.id} item={i} open={open === i.id} onToggle={() => setOpen(open === i.id ? null : i.id)} onBuy={() => onBuy(i.id)} busy={busy} />
      ))}
      {shop.length === 0 && (
        <Text style={{ color: t.good, fontFamily: font.semibold, textAlign: 'center', paddingVertical: 8 }}>
          Você tem tudo o que um atleta de elite precisa em casa!
        </Text>
      )}
    </Card>
  );
}

function ShopItem({ item, open, onToggle, onBuy, busy }: { item: HomeItem; open: boolean; onToggle: () => void; onBuy: () => void; busy?: boolean }) {
  const t = useTheme();
  const can = item.affordable && !item.locked;
  return (
    <View style={[styles.item, { borderColor: open ? t.acc : t.line, backgroundColor: t.cardHi, opacity: can || open ? 1 : 0.75 }]}>
      <PressableScale onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 24 }}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink, fontFamily: font.bold }}>{item.name}</Text>
          <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 12 }} numberOfLines={open ? undefined : 1}>
            {item.effect}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[condensed, { color: item.affordable ? t.ink : t.bad, fontSize: 18 }]}>R$ {money(item.price)} mi</Text>
          {item.perSeason && <Text style={{ color: t.mut, fontSize: 10, fontFamily: font.medium }}>por temporada</Text>}
        </View>
      </PressableScale>
      {open && (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ color: t.ink, fontFamily: font.regular, fontSize: 13 }}>{item.description}</Text>
          {item.locked ? (
            <Text style={{ color: t.mut, fontFamily: font.semibold, fontSize: 12 }}>🔒 {item.locked}.</Text>
          ) : (
            <Btn
              small
              primary={can}
              disabled={!can || busy}
              label={!item.affordable ? 'Dinheiro insuficiente' : item.perSeason ? 'Contratar' : 'Comprar'}
              onPress={onBuy}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2 },
  ownedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  ownedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  item: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 6 },
});
