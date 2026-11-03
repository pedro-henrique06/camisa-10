import { Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useState } from 'react';

import type { EventView, FinalView, MarketView, ResultView, SeasonView } from '@/api/types';
import { Armband, Badge, D20, GoldenBall, Pitch, Trophy } from '@/components/art';
import { Btn, Card, Chip, H1, H2, money, P, Row } from '@/components/ui';
import { condensed, useTheme } from '@/theme';

type Act = { busy: boolean };

/** Barra com o nome da competição (compBar). */
function Competition({ c }: { c: NonNullable<EventView['competition']> }) {
  const t = useTheme();
  const slot = (label: string) => (
    <View style={[styles.slot, { borderColor: t.mut }]}>
      <Text style={{ fontSize: 9, color: t.mut, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
  return (
    <View style={[styles.comp, { borderColor: t.line }]}>
      {slot('emblema')}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[condensed, { fontSize: 18, color: t.ink, textTransform: 'uppercase', textAlign: 'center' }]}>{c.name}</Text>
        <Text style={{ color: t.mut, fontSize: 13 }}>{c.subtitle}</Text>
      </View>
      {slot('taça')}
    </View>
  );
}

/** Evento com opções (show) ou cobrança de pênalti (showPen). */
export function EventCard({ ev, onChoose, busy }: { ev: EventView; onChoose: (i: number) => void } & Act) {
  const t = useTheme();
  return (
    <Card>
      {ev.competition && <Competition c={ev.competition} />}
      {ev.routine && (
        <View style={[styles.tpbar, { borderColor: t.line }]}>
          <Badge badge={ev.routine.clubBadge} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink, fontWeight: '700' }}>Rotina do {ev.routine.club}</Text>
            <Text style={{ color: t.mut, fontSize: 13 }}>
              {ev.routine.sessions === 2 ? 'Dois períodos: manhã e tarde' : 'Período único: manhã'} · foco do clube: {ev.routine.focusName}
            </Text>
          </View>
        </View>
      )}
      <H2>{ev.title}</H2>
      {ev.visual === 'trophy' && <Trophy />}
      {ev.visual === 'ball' && <GoldenBall />}
      <P>{ev.text}</P>

      {ev.isPenalty && ev.penaltyZones ? (
        <>
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <Svg viewBox="0 0 300 130" width="100%" height={150} style={{ maxWidth: 340 }}>
              {ev.penaltyZones.map((label, i) => (
                <Rect
                  key={label}
                  x={5 + (i % 3) * 96.7}
                  y={5 + (i > 2 ? 60 : 0)}
                  width={96.7}
                  height={60}
                  fill={t.acc}
                  fillOpacity={0.08}
                  stroke={t.line}
                  strokeWidth={2}
                  onPress={busy ? undefined : () => onChoose(i)}
                />
              ))}
            </Svg>
          </View>
          <P muted style={{ textAlign: 'center' }}>
            Toque no ponto do gol · Chute {ev.shotSkill}
          </P>
        </>
      ) : (
        ev.options.map((o, i) => (
          <Btn key={i} onPress={() => onChoose(i)} disabled={busy}>
            <Text style={{ color: t.ink, fontSize: 17, fontWeight: '600' }}>{o.label}</Text>
            {o.check && (
              <Text style={{ color: t.mut, fontSize: 13, marginTop: 2 }}>
                🎲 {o.check.attributeName} {o.check.value} · dificuldade {o.check.difficulty} · {o.check.chance}% de chance
              </Text>
            )}
          </Btn>
        ))
      )}
    </Card>
  );
}

/** Resultado da escolha, com o dado quando houve teste (pick + dice). */
export function ResultCard({ r, onNext, busy }: { r: ResultView; onNext: () => void } & Act) {
  const t = useTheme();
  const d = r.dice;
  return (
    <Card>
      <H2>{r.title}</H2>
      <P muted>Você escolheu: {r.chosen}</P>
      {d && (
        <View style={[styles.dice, { borderColor: r.success ? t.good : t.bad }]}>
          <D20 value={d.roll} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink }}>
              <Text style={{ fontWeight: '700' }}>
                {d.attributeName} {d.value}
              </Text>{' '}
              · dado {d.roll} {d.modifier >= 0 ? '+' : '-'} {Math.abs(d.modifier)} = {d.total} contra dificuldade {d.difficulty}
            </Text>
            <Text style={{ color: t.ink, fontWeight: '700' }}>
              {d.roll === 20 ? 'Crítico! ' : d.roll === 1 ? 'Falha crítica. ' : ''}
              {r.success ? 'Sucesso' : 'Falha'}
            </Text>
          </View>
        </View>
      )}
      <P>{r.text}</P>
      {r.anim === 'capt' && <Armband />}
      {r.anim === 'trophy' && <Trophy />}
      {r.anim === 'ball' && <GoldenBall />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {r.chips.map((c, i) => (
          <Chip key={i} text={c.text} up={c.up} />
        ))}
      </View>
      <Btn primary label="Continuar" onPress={onNext} busy={busy} />
    </Card>
  );
}

/** Janela de transferências (market). */
export function MarketCard({ m, onChoose, onStay, busy }: { m: MarketView; onChoose: (i: number) => void; onStay: () => void } & Act) {
  const t = useTheme();
  return (
    <Card>
      <H2>Janela de transferências</H2>
      <P>{m.intro}</P>
      {m.offers.map((o) => (
        <Btn key={o.index} onPress={() => onChoose(o.index)} disabled={busy}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Badge badge={o.clubBadge} size={22} />
            <Text style={{ color: t.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 }}>
              {o.club} <Text style={{ fontWeight: '400' }}>· {o.countryFlag} {o.country}</Text>
            </Text>
          </View>
          <Text style={{ color: t.mut, fontSize: 13, marginTop: 4 }}>
            Luvas R$ {o.signingBonus} mi · salário R$ {o.salary} mil/mês{'\n'}Valor da transferência R$ {o.fee} mi{'\n'}Rotina:{' '}
            {o.sessions === 2 ? 'treino em 2 períodos' : 'treino em período único'} · foco {o.focusName}
          </Text>
        </Btn>
      ))}
      <Btn label={m.stayLabel} onPress={onStay} disabled={busy} />
    </Card>
  );
}

export function SwapCard({ current, suggested, onChoose, busy }: { current: string; suggested: string; onChoose: (i: number) => void } & Act) {
  return (
    <Card>
      <H2>O treinador quer te mudar de posição</H2>
      <P>
        “Acho que você rende mais de {suggested}.” Hoje você joga de {current}.
      </P>
      <Pitch selected={suggested} current={current} />
      <P muted>Linha tracejada: posição atual. Amarelo: sugestão.</P>
      <Btn primary label="Aceitar a mudança" onPress={() => onChoose(0)} busy={busy} />
      <Btn label={`Prefiro continuar de ${current}`} onPress={() => onChoose(1)} disabled={busy} />
    </Card>
  );
}

export function PromotionCard({ club, onNext, busy }: { club: string; onNext: () => void } & Act) {
  return (
    <Card>
      <H2>Você foi promovido!</H2>
      <P>O {club} chama você para o time profissional.</P>
      <Btn primary label="Começar a carreira profissional" onPress={onNext} busy={busy} />
    </Card>
  );
}

/** Balanço da temporada (endSeason). */
export function SeasonCard({ s, onNext, busy }: { s: SeasonView; onNext: () => void } & Act) {
  const r = s.report;
  return (
    <Card>
      <H2>
        Temporada {r.season} · {r.club}
      </H2>
      <Row label="Jogos" value={r.games} />
      <Row label="Gols" value={`${r.goals} · total ${s.totalGoals}`} />
      <Row label="Assistências" value={`${r.assists} · total ${s.totalAssists}`} />
      <Row label="Gols + assistências" value={r.goals + r.assists} />
      <P muted>
        Nos lances decisivos que você jogou: {r.decisiveGoals} gols e {r.decisiveAssists} assistências.
      </P>
      <Row label="Nota média" value={r.rating.toFixed(1)} />
      <Row label="Evolução da habilidade" value={`${r.overallBefore} → ${r.overallAfter}`} />
      <Row label="Salário" value={`R$ ${r.salary} mil/mês`} />
      <Row label="Ganho líquido" value={`R$ ${r.net} mi`} />
      {r.commission > 0 && <Row label="Comissão do empresário" value={`R$ ${r.commission} mi`} />}
      {r.releaseClause > 0 && <Row label="Multa rescisória" value={`R$ ${r.releaseClause} mi`} />}
      <P muted>📰 {r.headline}</P>
      <P muted>
        {r.era} · Rival {s.rival} ({s.rivalClub}): habilidade {s.rivalOverall}, {s.rivalGoals} gols, {s.rivalTitles} títulos · seu perfil:{' '}
        {r.profile}
      </P>
      {r.title ? (
        <>
          <Trophy />
          <P>Seu time foi campeão!</P>
        </>
      ) : (
        <P>Sem título nesta temporada.</P>
      )}
      <Btn primary label="Próxima temporada" onPress={onNext} busy={busy} />
    </Card>
  );
}

export function DecisionCard({ age, onContinue, onRetire, busy }: { age: number; onContinue: () => void; onRetire: () => void } & Act) {
  return (
    <Card>
      <H2>Hora de decidir</H2>
      <P>{age} anos. O corpo cobra a conta, mas ainda tem bola no pé.</P>
      <Btn label="Continuar jogando" onPress={onContinue} disabled={busy} />
      <Btn label="Pendurar as chuteiras" onPress={onRetire} disabled={busy} />
    </Card>
  );
}

/** Fim de carreira (fim). */
export function FinalScreen({ f, onHome }: { f: FinalView; onHome: () => void }) {
  const [shared, setShared] = useState<string | null>(null);
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
      <H1>{f.title}</H1>
      <P muted>{f.subtitle}</P>
      <Card>
        <Row label="Jogos" value={f.games} />
        <Row label="Gols" value={f.goals} />
        <Row label="Assistências" value={f.assists} />
        <Row label="Títulos" value={f.titles} />
        <Row label="Melhor do mundo" value={f.ballons} />
        <Row label="Patrimônio" value={`R$ ${money(f.money)} mi`} />
        <Row label="Títulos com a seleção" value={f.nationalTitles} />
        <Row label="Perfil" value={f.profile} />
        <Row label={`Rival ${f.rival}`} value={`${f.rivalTitles} títulos`} />
        <P muted>📰 {f.headlines.join(' · ')}</P>
        <Btn label={shared ?? 'Compartilhar resumo'} onPress={share} />
        <Btn primary label="Nova carreira" onPress={onHome} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  comp: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, marginBottom: 12, borderWidth: 1, borderRadius: 10 },
  slot: { width: 42, height: 42, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
  tpbar: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 8, marginBottom: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
  dice: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1.5, borderRadius: 8, padding: 10, marginVertical: 8 },
});
