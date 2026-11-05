import { StyleSheet, Text, View } from 'react-native';

import type { StoryView } from '@/api/types';
import { alpha, condensed, font, useTheme } from '@/theme';
import { Card } from './ui';

/**
 * A história do jogador: a origem sorteada, os rótulos de reputação, os seis eixos (de um lado ao outro)
 * e, quando a carreira acaba, o epílogo.
 */
export function StoryCard({ story }: { story: StoryView }) {
  const t = useTheme();
  return (
    <>
      {story.epilogue.length > 0 && (
        <Card accent={t.acc}>
          <Text style={[styles.section, { color: t.acc }]}>📖 COMO A HISTÓRIA TERMINOU</Text>
          {story.epilogue.map((line, i) => (
            <Text key={`epi-${i}`} style={{ color: t.ink, fontFamily: i === 0 ? font.semibold : font.regular, fontSize: 15, lineHeight: 22, marginTop: 8 }}>
              {line}
            </Text>
          ))}
        </Card>
      )}
      <Card>
        <Text style={[styles.section, { color: t.mut }]}>🧬 SUA HISTÓRIA</Text>
        {story.originName && (
          <View style={styles.origin}>
            <Text style={{ fontSize: 30 }}>{story.originIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[condensed, { color: t.ink, fontSize: 20 }]}>{story.originName}</Text>
              <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 13 }}>{story.originText}</Text>
            </View>
          </View>
        )}

        {story.tags.length > 0 ? (
          <View style={styles.tags}>
            {story.tags.map((tag) => (
              <View key={tag.label} style={[styles.tag, { borderColor: t.acc, backgroundColor: alpha(t.acc, 0.12) }]}>
                <Text style={{ color: t.ink, fontFamily: font.bold, fontSize: 13 }}>
                  {tag.icon} {tag.label}
                </Text>
                <Text style={{ color: t.mut, fontFamily: font.medium, fontSize: 11 }}>{tag.hint}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 13, marginTop: 10 }}>
            A sua fama ainda está se formando. Cada escolha empurra a reputação para um lado.
          </Text>
        )}

        <Text style={[styles.sub, { color: t.mut }]}>REPUTAÇÃO</Text>
        {story.reputation.map((a) => (
          <Axis key={a.key} low={a.low} high={a.high} value={a.value} />
        ))}
      </Card>
    </>
  );
}

/** Um eixo de −10 a +10: a marca anda para o lado em que as escolhas empurraram. */
function Axis({ low, high, value }: { low: string; high: string; value: number }) {
  const t = useTheme();
  const pos = ((value + 10) / 20) * 100;
  const strong = Math.abs(value) >= 5;
  return (
    <View style={{ marginBottom: 8 }} accessibilityLabel={`${low} ou ${high}: ${value}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: value <= -5 ? t.ink : t.mut, fontFamily: value <= -5 ? font.bold : font.medium, fontSize: 12 }}>{low}</Text>
        <Text style={{ color: value >= 5 ? t.ink : t.mut, fontFamily: value >= 5 ? font.bold : font.medium, fontSize: 12 }}>{high}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: t.line }]}>
        <View style={[styles.mid, { backgroundColor: t.mut }]} />
        <View
          style={[
            styles.fill,
            {
              left: `${Math.min(50, pos)}%`,
              width: `${Math.abs(pos - 50)}%`,
              backgroundColor: strong ? t.acc : alpha(t.acc, 0.55),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2 },
  sub: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  origin: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  tags: { gap: 6, marginTop: 12 },
  tag: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  track: { height: 8, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  mid: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, marginLeft: -1 },
  fill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },
});
