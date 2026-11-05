import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GossipItem, LoveView } from '@/api/types';
import { alpha, condensed, font, useTheme } from '@/theme';
import { Bar, Card, PressableScale } from './ui';

const STAGES = ['ficando', 'namorando', 'noivo', 'casado'] as const;
const STAGE_ICON: Record<string, string> = { solteiro: '🕊️', ficando: '✨', namorando: '❤️', noivo: '💍', casado: '💒', separado: '💔' };

/** Vida amorosa: estágio do relacionamento, afeto e a linha do tempo da história. */
export function LoveCard({ love }: { love: LoveView }) {
  const t = useTheme();
  const together = STAGES.includes(love.stage as (typeof STAGES)[number]);
  const step = STAGES.indexOf(love.stage as (typeof STAGES)[number]);
  const color = love.affection >= 60 ? t.good : love.affection >= 30 ? t.warn : t.bad;
  return (
    <Card>
      <Text style={[styles.section, { color: t.mut }]}>❤️ VIDA AMOROSA</Text>
      <View style={styles.head}>
        <Text style={{ fontSize: 30 }}>{STAGE_ICON[love.stage] ?? '🕊️'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[condensed, { color: t.ink, fontSize: 22 }]}>{love.stageLabel}</Text>
          {together && love.partner ? (
            <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 13 }}>
              com {love.partner}
              {love.partnerJob ? `, ${love.partnerJob}` : ''}
              {love.years > 0 ? ` · há ${love.years} ${love.years === 1 ? 'temporada' : 'temporadas'}` : ''}
            </Text>
          ) : (
            <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 13 }}>
              {love.stage === 'separado' ? 'Um tempo para se recuperar.' : 'Coração livre. Alguém pode aparecer a qualquer momento.'}
            </Text>
          )}
        </View>
      </View>

      {together && (
        <>
          <View style={styles.steps}>
            {STAGES.map((st, i) => (
              <View key={st} style={styles.stepItem}>
                <View style={[styles.dot, { borderColor: i <= step ? t.acc : t.line, backgroundColor: i <= step ? alpha(t.acc, 0.18) : 'transparent' }]}>
                  <Text style={{ fontSize: 12, opacity: i <= step ? 1 : 0.35 }}>{STAGE_ICON[st]}</Text>
                </View>
                <Text style={{ color: i <= step ? t.ink : t.mut, fontFamily: font.semibold, fontSize: 10 }}>
                  {st === 'noivo' ? 'Noivado' : st === 'casado' ? 'Casamento' : st === 'namorando' ? 'Namoro' : 'Ficando'}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: t.mut, fontFamily: font.semibold, fontSize: 12, flex: 1 }}>Afeto</Text>
            <Text style={{ color, fontFamily: font.bold, fontSize: 12 }}>
              {love.affection}
              {love.affection < 30 ? ' · a relação está por um fio' : ''}
            </Text>
          </View>
          <Bar value={love.affection} color={color} height={8} />
        </>
      )}

      {love.milestones.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sub, { color: t.mut }]}>SUA HISTÓRIA</Text>
          {love.milestones
            .slice()
            .reverse()
            .map((m, i) => (
              <View key={`ms-${i}`} style={styles.milestone}>
                <View style={[styles.line, { backgroundColor: i === love.milestones.length - 1 ? 'transparent' : t.line }]} />
                <Text style={{ fontSize: 15, width: 24 }}>{m.icon}</Text>
                <Text style={{ color: t.ink, fontFamily: font.medium, fontSize: 13, flex: 1 }}>{m.text}</Text>
                <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 12 }}>{m.age} anos</Text>
              </View>
            ))}
        </View>
      )}
    </Card>
  );
}

/** Revistas e sites de fofoca falando da vida do jogador. */
export function GossipFeed({ items }: { items: GossipItem[] }) {
  const t = useTheme();
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 4);
  return (
    <Card>
      <Text style={[styles.section, { color: t.mut, marginBottom: 8 }]}>📰 REVISTAS E SITES DE FOFOCA</Text>
      {shown.map((g, i) => {
        const scandal = g.kind === 'escandalo';
        const accent = scandal ? t.bad : g.kind === 'luxo' ? t.warn : t.acc;
        return (
          <View key={`gossip-${i}`} style={[styles.news, { borderLeftColor: accent, backgroundColor: scandal ? alpha(t.bad, 0.08) : t.cardHi }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: accent, fontFamily: font.bold, fontSize: 10, letterSpacing: 1, flex: 1 }}>
                {g.outlet.toUpperCase()}
                {scandal ? ' · EXCLUSIVO' : ''}
              </Text>
              <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 11 }}>{g.age} anos</Text>
            </View>
            <Text style={{ color: t.ink, fontFamily: scandal ? font.bold : font.semibold, fontSize: 14, marginTop: 2 }}>{g.headline}</Text>
          </View>
        );
      })}
      {items.length > 4 && (
        <PressableScale onPress={() => setAll(!all)} style={{ paddingVertical: 6, alignItems: 'center' }}>
          <Text style={{ color: t.acc, fontFamily: font.semibold, fontSize: 13 }}>{all ? 'Mostrar menos' : `Ver todas (${items.length})`}</Text>
        </PressableScale>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2 },
  sub: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, marginBottom: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stepItem: { alignItems: 'center', gap: 3, flex: 1 },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  line: { position: 'absolute', left: 11, top: 24, width: 2, height: 14 },
  news: { borderLeftWidth: 3, borderRadius: 8, padding: 8, marginBottom: 6 },
});
