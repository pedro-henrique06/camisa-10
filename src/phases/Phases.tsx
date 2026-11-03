import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import type { EventView, FinalView, MarketView, ResultView, SeasonView } from '@/api/types';
import { Armband, Badge, Confetti, D20, GoldenBall, Pitch, Trophy } from '@/components/art';
import { PenaltyAim, PenaltyReplay } from '@/components/PenaltyScene';
import { Btn, Card, Chip, Eyebrow, FadeIn, H1, H2, haptic, money, P, PressableScale, Row, Stat } from '@/components/ui';
import { chanceColor, condensed, font, useTheme } from '@/theme';

type Act = { busy: boolean };
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

/** Faixa com o nome da competição. */
function Competition({ c }: { c: NonNullable<EventView['competition']> }) {
  const t = useTheme();
  return (
    <LinearGradient colors={[t.accSoft, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.comp, { borderColor: t.accSoft }]}>
      <Text style={{ fontSize: 22 }}>🏟️</Text>
      <View style={{ flex: 1 }}>
        <Text style={[condensed, { fontSize: 18, color: t.ink, textTransform: 'uppercase', letterSpacing: 0.5 }]}>{c.name}</Text>
        <Text style={{ color: t.mut, fontSize: 13, fontFamily: font.medium }}>{c.subtitle}</Text>
      </View>
      <View style={[styles.live, { backgroundColor: t.bad }]}>
        <Text style={{ color: '#fff', fontFamily: font.bold, fontSize: 10, letterSpacing: 1 }}>AO VIVO</Text>
      </View>
    </LinearGradient>
  );
}

/** Uma opção do evento, como card com letra e chance de sucesso. */
function Option({ letter, label, check, onPress, disabled, delay }: {
  letter: string;
  label: string;
  check: EventView['options'][number]['check'];
  onPress: () => void;
  disabled: boolean;
  delay: number;
}) {
  const t = useTheme();
  const c = check ? chanceColor(t, check.chance) : t.acc;
  return (
    <FadeIn delay={delay}>
      <PressableScale onPress={onPress} disabled={disabled} accessibilityLabel={label} style={[styles.option, { backgroundColor: t.cardHi, borderColor: t.lineStrong }]}>
        <View style={[styles.letter, { backgroundColor: t.accSoft }]}>
          <Text style={[condensed, { color: t.acc, fontSize: 18 }]}>{letter}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink, fontSize: 17, lineHeight: 22, fontFamily: font.semibold }}>{label}</Text>
          {check && (
            <View style={styles.checkRow}>
              <Text style={{ color: t.mut, fontSize: 13, fontFamily: font.medium }}>
                🎲 {check.attributeName} {check.value} · dif. {check.difficulty}
              </Text>
              <View style={[styles.pct, { backgroundColor: c + '22', borderColor: c }]}>
                <Text style={{ color: c, fontFamily: font.bold, fontSize: 12 }}>{check.chance}%</Text>
              </View>
            </View>
          )}
          {check && (
            <View style={{ height: 3, backgroundColor: t.line, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <View style={{ width: `${check.chance}%`, height: '100%', backgroundColor: c }} />
            </View>
          )}
        </View>
        <Text style={{ color: t.mut, fontSize: 20 }}>›</Text>
      </PressableScale>
    </FadeIn>
  );
}

/** Evento com opções ou cobrança de pênalti. */
export function EventCard({ ev, onChoose, busy }: { ev: EventView; onChoose: (i: number, power?: number) => void } & Act) {
  const t = useTheme();
  const eyebrow = ev.isPenalty ? 'Pênalti' : ev.competition ? 'Lance da partida' : ev.routine ? 'Treino' : 'Sua decisão';
  return (
    <Card>
      {ev.competition && <Competition c={ev.competition} />}
      {ev.routine && (
        <View style={[styles.tpbar, { backgroundColor: t.cardHi, borderColor: t.line }]}>
          <Badge badge={ev.routine.clubBadge} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink, fontFamily: font.bold }}>Rotina do {ev.routine.club}</Text>
            <Text style={{ color: t.mut, fontSize: 13, fontFamily: font.regular }}>
              {ev.routine.sessions === 2 ? 'Dois períodos: manhã e tarde' : 'Período único: manhã'} · foco: {ev.routine.focusName}
            </Text>
          </View>
        </View>
      )}
      <Eyebrow>{eyebrow}</Eyebrow>
      <H2>{ev.title}</H2>
      {ev.visual === 'trophy' && <Trophy />}
      {ev.visual === 'ball' && <GoldenBall />}
      <P>{ev.text}</P>

      {ev.isPenalty && ev.penaltyZones ? (
        <PenaltyAim
          zones={ev.penaltyZones}
          ideal={ev.penaltyPower ?? { idealMin: 60, idealMax: 85 }}
          shotSkill={ev.shotSkill}
          onShoot={(zone, power) => onChoose(zone, power)}
          disabled={busy}
        />
      ) : (
        <View style={{ marginTop: 4 }}>
          {ev.options.map((o, i) => (
            <Option key={i} letter={LETTERS[i]} label={o.label} check={o.check} onPress={() => onChoose(i)} disabled={busy} delay={120 + i * 70} />
          ))}
        </View>
      )}
    </Card>
  );
}

/** Resultado da escolha: faixa de sucesso/falha, dado e efeitos. */
export function ResultCard({ r }: { r: ResultView }) {
  const t = useTheme();
  const d = r.dice;
  const c = r.success ? t.good : t.bad;
  useEffect(() => {
    if (r.penalty) return; // a cena do pênalti já vibrou no lance
    if (r.success) haptic.success();
    else haptic.fail();
  }, [r.success, r.penalty]);
  const big = r.anim === 'capt' || r.anim === 'trophy' || r.anim === 'ball';
  // No pênalti, o resto do resultado aparece depois da animação da cobrança.
  const [replayDone, setReplayDone] = useState(!r.penalty);
  if (r.penalty && !replayDone) {
    return (
      <Card>
        <Eyebrow>Pênalti</Eyebrow>
        <PenaltyReplay shot={r.penalty} onDone={() => setReplayDone(true)} />
        <Text style={{ color: t.mut, fontFamily: font.medium, textAlign: 'center', marginTop: 10 }}>
          “{r.chosen}” · força {r.penalty.power}
        </Text>
      </Card>
    );
  }
  return (
    <Card accent={c}>
      {r.success && big && <Confetti />}
      {r.penalty && <PenaltyReplayStill shot={r.penalty} />}
      <View style={[styles.banner, { backgroundColor: r.success ? t.goodSoft : t.badSoft }]}>
        <Text style={{ fontSize: 22 }}>{r.success ? '✅' : '❌'}</Text>
        <Text style={[condensed, { color: c, fontSize: 22, letterSpacing: 0.5, textTransform: 'uppercase' }]}>
          {d?.roll === 20 ? 'Crítico!' : d?.roll === 1 ? 'Falha crítica' : r.success ? 'Deu certo' : 'Não deu'}
        </Text>
      </View>
      <Eyebrow color={t.mut}>{r.title}</Eyebrow>
      <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 16 }}>“{r.chosen}”</Text>
      {d && (
        <FadeIn delay={100}>
          <View style={[styles.dice, { borderColor: c, backgroundColor: t.cardHi }]}>
            <D20 value={d.roll} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.ink, fontFamily: font.bold }}>
                {d.attributeName} {d.value}
              </Text>
              <Text style={{ color: t.mut, fontFamily: font.medium }}>
                dado {d.roll} {d.modifier >= 0 ? '+' : '−'} {Math.abs(d.modifier)} ={' '}
                <Text style={{ color: c, fontFamily: font.bold }}>{d.total}</Text> · precisava de {d.difficulty}
              </Text>
            </View>
          </View>
        </FadeIn>
      )}
      <P style={{ fontSize: 18, marginTop: 10 }}>{r.text}</P>
      {r.anim === 'capt' && <Armband />}
      {r.anim === 'trophy' && <Trophy />}
      {r.anim === 'ball' && <GoldenBall />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {r.chips.map((ch, i) => (
          <Chip key={i} text={ch.text} up={ch.up} delay={250 + i * 90} />
        ))}
      </View>
    </Card>
  );
}

/** Cena final do pênalti já resolvida (sem repetir a animação). */
function PenaltyReplayStill({ shot }: { shot: NonNullable<ResultView['penalty']> }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <PenaltyReplay shot={shot} still />
    </View>
  );
}

const TIER_STARS = (fee: number) => (fee >= 120 ? 5 : fee >= 70 ? 4 : fee >= 35 ? 3 : fee >= 15 ? 2 : 1);

/** Janela de transferências. */
export function MarketCard({ m, onChoose, onStay, busy }: { m: MarketView; onChoose: (i: number) => void; onStay: () => void } & Act) {
  const t = useTheme();
  return (
    <Card>
      <Eyebrow>Mercado</Eyebrow>
      <H2>Janela de transferências</H2>
      <P muted>{m.intro}</P>
      {m.offers.map((o, i) => (
        <FadeIn key={o.index} delay={100 + i * 80}>
          <PressableScale onPress={() => onChoose(o.index)} disabled={busy} style={[styles.offer, { backgroundColor: t.cardHi, borderColor: t.lineStrong }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Badge badge={o.clubBadge} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[condensed, { color: t.ink, fontSize: 22 }]}>{o.club}</Text>
                <Text style={{ color: t.mut, fontFamily: font.medium }}>
                  {o.countryFlag} {o.country} · {'★'.repeat(TIER_STARS(o.fee))}
                </Text>
              </View>
              <Text style={{ color: t.acc, fontFamily: font.bold }}>Assinar ›</Text>
            </View>
            <View style={styles.offerStats}>
              <OfferStat label="Salário" value={`${o.salary} mil`} />
              <OfferStat label="Luvas" value={`${o.signingBonus} mi`} />
              <OfferStat label="Transferência" value={`${o.fee} mi`} />
            </View>
            <Text style={{ color: t.mut, fontSize: 13, fontFamily: font.regular }}>
              Rotina: {o.sessions === 2 ? 'treino em 2 períodos' : 'período único'} · foco {o.focusName}
            </Text>
          </PressableScale>
        </FadeIn>
      ))}
      <Btn label={m.stayLabel} onPress={onStay} disabled={busy} icon={m.mode === 'bt' ? '↩' : '✍'} />
    </Card>
  );
}

function OfferStat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: t.mut, fontSize: 11, fontFamily: font.bold, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: t.ink, fontFamily: font.display, fontSize: 18 }}>R$ {value}</Text>
    </View>
  );
}

export function SwapCard({ current, suggested, onChoose, busy }: { current: string; suggested: string; onChoose: (i: number) => void } & Act) {
  return (
    <Card>
      <Eyebrow>Conversa com o treinador</Eyebrow>
      <H2>Mudança de posição?</H2>
      <P>
        “Acho que você rende mais de {suggested}.” Hoje você joga de {current}.
      </P>
      <Pitch selected={suggested} current={current} />
      <P muted style={{ textAlign: 'center' }}>
        Tracejado: posição atual · Amarelo: sugestão
      </P>
      <Btn primary label={`Aceitar: jogar de ${suggested}`} onPress={() => onChoose(0)} busy={busy} />
      <Btn label={`Prefiro continuar de ${current}`} onPress={() => onChoose(1)} disabled={busy} />
    </Card>
  );
}

export function PromotionCard({ club }: { club: string }) {
  return (
    <Card>
      <Trophy />
      <Eyebrow>Novo capítulo</Eyebrow>
      <H2>Você foi promovido!</H2>
      <P>O {club} chama você para o time profissional. Agora tem contrato, salário e torcida cobrando.</P>
    </Card>
  );
}

/** Balanço da temporada. */
export function SeasonCard({ s }: { s: SeasonView }) {
  const t = useTheme();
  const r = s.report;
  const ratingColor = r.rating >= 7.5 ? t.good : r.rating < 6 ? t.bad : t.acc;
  const diff = r.overallAfter - r.overallBefore;
  return (
    <Card accent={r.title ? t.acc : undefined}>
      {r.title && <Trophy />}
      <Eyebrow>{r.title ? 'Campeão!' : `Temporada ${r.season}`}</Eyebrow>
      <H2>{r.club}</H2>
      <View style={styles.statGrid}>
        <Stat value={r.rating.toFixed(1)} label="Nota" color={ratingColor} />
        <Stat value={r.games} label="Jogos" />
        <Stat value={r.goals} label="Gols" />
        <Stat value={r.assists} label="Assist." />
      </View>
      <View style={[styles.evo, { backgroundColor: t.cardHi, borderColor: t.line }]}>
        <Text style={{ color: t.mut, fontFamily: font.medium }}>Overall</Text>
        <Text style={[condensed, { color: t.ink, fontSize: 26 }]}>
          {r.overallBefore} → {r.overallAfter}{' '}
          <Text style={{ color: diff >= 0 ? t.good : t.bad, fontSize: 18 }}>
            ({diff >= 0 ? '+' : ''}
            {diff})
          </Text>
        </Text>
      </View>
      <View style={[styles.news, { backgroundColor: t.accSoft }]}>
        <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 16 }}>📰 {r.headline}</Text>
      </View>
      <Row label="Total na carreira" value={`${s.totalGoals} gols · ${s.totalAssists} assist.`} />
      <Row label="Lances decisivos" value={`${r.decisiveGoals} gols · ${r.decisiveAssists} assist.`} />
      <Row label="Salário" value={`R$ ${r.salary} mil/mês`} />
      <Row label="Ganho líquido" value={`R$ ${r.net} mi`} highlight />
      {r.commission > 0 && <Row label="Comissão do empresário" value={`R$ ${r.commission} mi`} />}
      {r.releaseClause > 0 && <Row label="Multa rescisória" value={`R$ ${r.releaseClause} mi`} />}
      <Row label="Fase da carreira" value={`${r.era} · perfil ${r.profile}`} />
      <View style={[styles.rival, { borderColor: t.line }]}>
        <Text style={{ color: t.mut, fontFamily: font.bold, fontSize: 11, letterSpacing: 1 }}>SEU RIVAL</Text>
        <Text style={{ color: t.ink, fontFamily: font.semibold }}>
          {s.rival} ({s.rivalClub}) · overall {s.rivalOverall} · {s.rivalGoals} gols · {s.rivalTitles} títulos
        </Text>
      </View>
    </Card>
  );
}

export function DecisionCard({ age }: { age: number }) {
  return (
    <Card>
      <Eyebrow>Fim de carreira?</Eyebrow>
      <H2>Hora de decidir</H2>
      <P>{age} anos. O corpo cobra a conta, mas ainda tem bola no pé.</P>
    </Card>
  );
}

/** Fim de carreira. */
export function FinalScreen({ f, onHome }: { f: FinalView; onHome: () => void }) {
  const t = useTheme();
  const [shared, setShared] = useState<string | null>(null);
  const legend = /Lenda|Ídolo/.test(f.title);
  const share = async () => {
    try {
      await Share.share({ message: f.shareText });
      setShared('Resumo enviado');
    } catch {
      setShared(f.shareText);
    }
  };
  return (
    <View>
      {legend && <Confetti />}
      <FadeIn>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          {legend ? <Trophy /> : <Text style={{ fontSize: 56 }}>👟</Text>}
          <Eyebrow>Fim de carreira</Eyebrow>
          <H1 style={{ textAlign: 'center', color: legend ? t.acc : t.ink }}>{f.title}</H1>
          <P muted style={{ textAlign: 'center' }}>
            {f.subtitle}
          </P>
        </View>
      </FadeIn>
      <Card style={{ marginTop: 12 }}>
        <View style={styles.statGrid}>
          <Stat value={f.goals} label="Gols" />
          <Stat value={f.assists} label="Assist." />
          <Stat value={f.titles} label="Títulos" color={t.acc} />
          <Stat value={f.ballons} label="Bola de Ouro" />
        </View>
        <Row label="Jogos" value={f.games} />
        <Row label="Patrimônio" value={`R$ ${money(f.money)} mi`} highlight />
        <Row label="Títulos com a seleção" value={f.nationalTitles} />
        <Row label="Perfil" value={f.profile} />
        <Row label={`Rival ${f.rival}`} value={`${f.rivalTitles} títulos`} />
        <P muted>📰 {f.headlines.join(' · ')}</P>
        <Btn label={shared ?? 'Compartilhar resumo'} icon="📤" onPress={share} />
        <Btn primary label="Nova carreira" onPress={onHome} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  comp: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderRadius: 12 },
  live: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tpbar: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, marginBottom: 14, borderWidth: 1, borderRadius: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 10 },
  letter: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8 },
  pct: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 10, marginBottom: 12 },
  dice: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 10, marginTop: 12 },
  offer: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 10, gap: 10 },
  offerStats: { flexDirection: 'row', gap: 8 },
  statGrid: { flexDirection: 'row', gap: 8, marginVertical: 8, flexWrap: 'wrap' },
  evo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 12, marginVertical: 6 },
  news: { borderRadius: 12, padding: 12, marginVertical: 8 },
  rival: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 10, marginTop: 12, gap: 2 },
});
