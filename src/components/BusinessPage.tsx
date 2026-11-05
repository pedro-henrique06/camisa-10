import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActionType, BusinessView, CompanyKind, CompanyView, InvestmentView } from '@/api/types';
import { alpha, condensed, font, useTheme } from '@/theme';
import { Btn, Card, PressableScale } from './ui';

const mi = (v: number) => {
  const a = Math.abs(v);
  const s = a >= 100 ? a.toFixed(0) : a.toFixed(1).replace(/\.0$/, '');
  return `${v < 0 ? '−' : ''}R$ ${s.replace('.', ',')} mi`;
};
const pct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Math.round(v * 100))}%`;

type Act = (type: ActionType, index?: number, power?: number, item?: string) => void;

/** Aba Negócios: patrimônio, empresas com o lucro de cada temporada, abrir empresas e investimentos. */
export function BusinessPage({ biz, act, busy, active }: { biz: BusinessView; act: Act; busy?: boolean; active: boolean }) {
  const t = useTheme();
  const mine = biz.companies.filter((c) => c.status === 'ativa');
  const past = biz.companies.filter((c) => c.status !== 'ativa');
  const invested = biz.investments.reduce((s, i) => s + i.value, 0);
  const firms = mine.reduce((s, c) => s + c.value, 0);
  return (
    <>
      <Card>
        <Text style={[styles.section, { color: t.mut }]}>💰 PATRIMÔNIO</Text>
        <Text style={[condensed, { color: t.ink, fontSize: 34, marginTop: 4 }]}>{mi(biz.netWorth)}</Text>
        <View style={styles.split}>
          <Split label="Na conta" value={mi(biz.money)} />
          <Split label="Empresas" value={mi(firms)} />
          <Split label="Investido" value={mi(invested)} />
        </View>
        {mine.length > 0 && (
          <Text style={{ color: biz.seasonProfit >= 0 ? t.good : t.bad, fontFamily: font.semibold, fontSize: 13, marginTop: 8 }}>
            {biz.seasonProfit >= 0 ? 'Lucro' : 'Prejuízo'} das empresas na última temporada: {mi(Math.abs(biz.seasonProfit))}
          </Text>
        )}
      </Card>

      <Card>
        <Text style={[styles.section, { color: t.mut, marginBottom: 8 }]}>🏢 SUAS EMPRESAS</Text>
        {mine.length === 0 && (
          <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 13 }}>
            Você ainda não tem nenhuma empresa. Abra a primeira aqui embaixo e o lucro cai na conta no fim de cada temporada.
          </Text>
        )}
        {mine.map((c) => (
          <Company key={c.id} c={c} act={act} busy={busy || !active} money={biz.money} />
        ))}
        {past.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={[styles.sub, { color: t.mut }]}>JÁ FORAM SUAS</Text>
            {past.map((c) => (
              <View key={c.id} style={styles.pastRow}>
                <Text style={{ fontSize: 15 }}>{c.icon}</Text>
                <Text style={{ color: t.ink, fontFamily: font.medium, fontSize: 13, flex: 1 }}>{c.name}</Text>
                <Text style={{ color: c.status === 'vendida' ? t.good : t.bad, fontFamily: font.semibold, fontSize: 12 }}>
                  {c.status === 'vendida' ? `vendida por ${mi(c.sellPrice)}` : c.status === 'falida' ? 'faliu' : 'fechada'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {active && <Catalog kinds={biz.catalog} act={act} busy={busy} />}

      <Card>
        <Text style={[styles.section, { color: t.mut, marginBottom: 8 }]}>📊 INVESTIMENTOS</Text>
        {biz.investments.map((i) => (
          <Investment key={i.id} i={i} act={act} busy={busy || !active} money={biz.money} />
        ))}
        <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 12, marginTop: 4 }}>O rendimento cai no fim de cada temporada.</Text>
      </Card>
    </>
  );
}

function Split({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 14 }}>{value}</Text>
    </View>
  );
}

/** Uma empresa: valor, lucro, gráfico das temporadas e os botões de expandir e vender. */
function Company({ c, act, busy, money }: { c: CompanyView; act: Act; busy?: boolean; money: number }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const seasons = c.history.filter((h) => h.note !== 'Inauguração' || h.profit !== 0);
  const max = Math.max(0.1, ...seasons.map((h) => Math.abs(h.profit)));
  const units = `${c.level} ${c.unit}${c.level > 1 ? 's' : ''}`;
  return (
    <View style={[styles.company, { borderColor: open ? t.acc : t.line, backgroundColor: t.cardHi }]}>
      <PressableScale onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 26 }}>{c.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 15 }}>{c.name}</Text>
          <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 12 }}>
            {c.kindName} · {units}
            {c.manager ? ' · com gerente' : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[condensed, { color: t.ink, fontSize: 18 }]}>{mi(c.value)}</Text>
          <Text style={{ color: c.lastProfit >= 0 ? t.good : t.bad, fontFamily: font.semibold, fontSize: 11 }}>
            {c.history.length > 1 ? `${c.lastProfit >= 0 ? '+' : ''}${mi(c.lastProfit)} na temporada` : 'recém-aberta'}
          </Text>
        </View>
      </PressableScale>

      {seasons.length > 0 && (
        <View style={styles.chart} accessibilityLabel={`Lucro por temporada de ${c.name}`}>
          {seasons.map((h, i) => {
            const height = Math.max(3, (Math.abs(h.profit) / max) * 46);
            return (
              <View key={`bar-${i}`} style={styles.barCol}>
                <View style={{ height: 48, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {h.profit >= 0 && <View style={[styles.bar, { height, backgroundColor: t.good }]} />}
                </View>
                <View style={{ height: 24, width: '100%', alignItems: 'center' }}>
                  {h.profit < 0 && <View style={[styles.bar, { height: Math.max(3, (Math.abs(h.profit) / max) * 24), backgroundColor: t.bad }]} />}
                </View>
                <Text style={{ color: t.mut, fontSize: 9, fontFamily: font.medium }}>{h.age}</Text>
              </View>
            );
          })}
        </View>
      )}

      {open && (
        <View style={{ gap: 6, marginTop: 6 }}>
          <View style={styles.split}>
            <Split label="Investido" value={mi(c.invested)} />
            <Split label="Lucro total" value={mi(c.totalProfit)} />
            <Split label="Desde" value={`${c.openedAge} anos`} />
          </View>
          {c.history
            .filter((h) => h.note)
            .slice(-6)
            .reverse()
            .map((h, i) => (
              <Text key={`note-${i}`} style={{ color: t.ink, fontFamily: font.regular, fontSize: 12 }}>
                <Text style={{ color: t.mut }}>{h.age} anos · </Text>
                {h.note}
              </Text>
            ))}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            {c.expandCost != null && (
              <View style={{ flex: 1 }}>
                <Btn
                  small
                  primary={money >= c.expandCost}
                  disabled={busy || money < c.expandCost}
                  label={`+1 ${c.unit} (${mi(c.expandCost)})`}
                  onPress={() => act('ExpandCompany', undefined, undefined, c.id)}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Btn
                small
                disabled={busy}
                label={confirm ? `Confirmar: ${mi(c.sellPrice)}` : 'Vender'}
                onPress={() => {
                  if (!confirm) setConfirm(true);
                  else {
                    setConfirm(false);
                    act('SellCompany', undefined, undefined, c.id);
                  }
                }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/** Tipos de empresa para abrir. */
function Catalog({ kinds, act, busy }: { kinds: CompanyKind[]; act: Act; busy?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card>
      <Text style={[styles.section, { color: t.mut, marginBottom: 8 }]}>➕ ABRIR UMA EMPRESA</Text>
      {kinds.map((k) => {
        const on = open === k.id;
        return (
          <View key={k.id} style={[styles.kind, { borderColor: on ? t.acc : t.line, opacity: k.affordable || on ? 1 : 0.7 }]}>
            <PressableScale onPress={() => setOpen(on ? null : k.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 22 }}>{k.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontFamily: font.bold }}>{k.name}</Text>
                <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 12 }}>
                  {k.risk} · {k.expected}
                </Text>
              </View>
              <Text style={[condensed, { color: k.affordable ? t.ink : t.bad, fontSize: 17 }]}>{mi(k.cost)}</Text>
            </PressableScale>
            {on && (
              <View style={{ gap: 8, marginTop: 8 }}>
                <Text style={{ color: t.ink, fontFamily: font.regular, fontSize: 13 }}>{k.description}</Text>
                <Btn
                  small
                  primary={k.affordable}
                  disabled={!k.affordable || busy}
                  label={k.affordable ? `Abrir por ${mi(k.cost)}` : 'Dinheiro insuficiente'}
                  onPress={() => {
                    setOpen(null);
                    act('OpenCompany', undefined, undefined, k.id);
                  }}
                />
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
}

const AMOUNTS = [1, 5, 10];

/** Um investimento: valor, último rendimento e botões para aplicar e resgatar. */
function Investment({ i, act, busy, money }: { i: InvestmentView; act: Act; busy?: boolean; money: number }) {
  const t = useTheme();
  const gain = i.value - i.principal;
  return (
    <View style={[styles.invest, { borderColor: t.line }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 22 }}>{i.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink, fontFamily: font.bold }}>{i.name}</Text>
          <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 12 }}>
            {i.risk} · {i.expected}
          </Text>
        </View>
        {i.value > 0 && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[condensed, { color: t.ink, fontSize: 17 }]}>{mi(i.value)}</Text>
            {i.history.length > 0 && (
              <Text style={{ color: i.lastReturn >= 0 ? t.good : t.bad, fontFamily: font.semibold, fontSize: 11 }}>{pct(i.lastReturn)} na temporada</Text>
            )}
          </View>
        )}
      </View>
      {i.value > 0 && i.principal > 0 && Math.abs(gain) >= 0.05 && (
        <Text style={{ color: gain >= 0 ? t.good : t.bad, fontFamily: font.medium, fontSize: 12, marginTop: 4 }}>
          {gain >= 0 ? 'Ganho' : 'Perda'} desde que você aplicou: {mi(Math.abs(gain))}
        </Text>
      )}
      <View style={styles.chips}>
        {AMOUNTS.map((a) => (
          <PressableScale
            key={a}
            disabled={busy || money < a}
            onPress={() => act('Invest', a * 10, undefined, i.id)}
            style={[styles.chip, { borderColor: t.acc, backgroundColor: alpha(t.acc, 0.1), opacity: busy || money < a ? 0.4 : 1 }]}
          >
            <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 12 }}>+ {a} mi</Text>
          </PressableScale>
        ))}
        {i.value > 0 && (
          <PressableScale
            disabled={busy}
            onPress={() => act('Withdraw', undefined, undefined, i.id)}
            style={[styles.chip, { borderColor: t.line, opacity: busy ? 0.4 : 1 }]}
          >
            <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 12 }}>Resgatar tudo</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2 },
  sub: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  split: { flexDirection: 'row', gap: 8, marginTop: 8 },
  company: { borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 8 },
  chart: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 10 },
  barCol: { flex: 1, maxWidth: 28, alignItems: 'center' },
  bar: { width: '80%', borderRadius: 3 },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  kind: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 6 },
  invest: { borderBottomWidth: 1, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
