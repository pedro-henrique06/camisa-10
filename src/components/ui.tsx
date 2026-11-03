import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { condensed, font, useTheme } from '@/theme';

const native = Platform.OS !== 'web';

/** Vibração leve nos toques (só no celular). */
export const haptic = {
  tap: () => native && Haptics.selectionAsync().catch(() => {}),
  success: () => native && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  fail: () => native && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

/** Entrada suave: sobe, aparece e cresce um pouco. `delay` permite cascata. */
export function FadeIn({ children, delay = 0, style, from = 10 }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; from?: number }) {
  const [a] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 360, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: a,
          transform: [
            { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
            { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Botão que "afunda" ao toque, com mola na volta. */
export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const [s] = useState(() => new Animated.Value(1));
  const to = (v: number) => Animated.spring(s, { toValue: v, speed: 40, bounciness: 8, useNativeDriver: true }).start();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={() => to(0.96)}
      onPressOut={() => to(1)}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: s }], opacity: disabled ? 0.5 : 1 }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Cartão principal das telas. */
export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  const t = useTheme();
  return (
    <FadeIn>
      <View
        style={[
          styles.card,
          { backgroundColor: t.card, borderColor: accent ?? t.line, shadowColor: t.shadow },
          style,
        ]}
      >
        {children}
      </View>
    </FadeIn>
  );
}

export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[styles.h1, condensed, { color: t.ink }, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[styles.h2, condensed, { color: t.ink }, style]}>{children}</Text>;
}

/** Rótulo pequeno em caixa alta acima de títulos. */
export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  const t = useTheme();
  return <Text style={[styles.eyebrow, { color: color ?? t.acc }]}>{children}</Text>;
}

export function P({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[styles.p, { color: muted ? t.mut : t.ink }, style]}>{children}</Text>;
}

type BtnProps = {
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  primary?: boolean;
  small?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: string;
};

export function Btn({ label, children, onPress, primary, small, disabled, busy, icon }: BtnProps) {
  const t = useTheme();
  if (small) {
    return (
      <PressableScale onPress={onPress} disabled={disabled} style={[styles.pill, { borderColor: t.lineStrong, backgroundColor: t.cardHi }]}>
        <Text style={{ color: t.ink, fontFamily: font.semibold, fontSize: 14 }}>
          {icon ? icon + '  ' : ''}
          {label}
        </Text>
      </PressableScale>
    );
  }
  const content = busy ? (
    <ActivityIndicator color={primary ? t.accText : t.ink} />
  ) : label != null ? (
    <Text style={[styles.btnText, { color: primary ? t.accText : t.ink, textAlign: primary ? 'center' : 'left' }]}>
      {icon ? icon + '  ' : ''}
      {label}
    </Text>
  ) : (
    children
  );
  if (primary) {
    return (
      <PressableScale onPress={onPress} disabled={disabled || busy} style={[styles.primaryWrap, { shadowColor: t.acc }]}>
        <LinearGradient colors={[t.accHi, t.acc]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.primary}>
          {content}
        </LinearGradient>
      </PressableScale>
    );
  }
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || busy}
      style={[styles.btn, { borderColor: t.lineStrong, backgroundColor: t.cardHi }]}
    >
      {content}
    </PressableScale>
  );
}

export function Chip({ text, up, delay = 0 }: { text: string; up: boolean; delay?: number }) {
  const t = useTheme();
  const c = up ? t.good : t.bad;
  return (
    <FadeIn delay={delay} from={6}>
      <View style={[styles.chip, { backgroundColor: up ? t.goodSoft : t.badSoft }]}>
        <Text style={{ color: c, fontSize: 14, fontFamily: font.bold }}>
          {up ? '▲ ' : '▼ '}
          {text}
        </Text>
      </View>
    </FadeIn>
  );
}

export function Row({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.line }]}>
      <Text style={{ color: t.mut, fontSize: 15, fontFamily: font.medium, flexShrink: 1 }}>{label}</Text>
      <Text style={{ color: highlight ? t.acc : t.ink, fontSize: 16, fontFamily: font.bold, textAlign: 'right', flexShrink: 1 }}>{value}</Text>
    </View>
  );
}

/** Bloco de número grande com legenda. */
export function Stat({ value, label, color }: { value: ReactNode; label: string; color?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: t.cardHi, borderColor: t.line }]}>
      <Text style={[condensed, { fontSize: 30, lineHeight: 32, color: color ?? t.ink }]}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.mut, fontFamily: font.semibold, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

/** Barra que anima quando o valor muda. */
export function Bar({ value, height = 6, color }: { value: number; height?: number; color?: string }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(100, value));
  const [w] = useState(() => new Animated.Value(v));
  useEffect(() => {
    Animated.timing(w, { toValue: v, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, w]);
  return (
    <View style={{ height, backgroundColor: t.line, borderRadius: height / 2, overflow: 'hidden' }}>
      <Animated.View
        style={{
          width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          height: '100%',
          backgroundColor: color ?? t.acc,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

export const money = (v: number) => v.toFixed(1).replace(/\.0$/, '');

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  h1: { fontSize: 52, lineHeight: 54 },
  h2: { fontSize: 30, lineHeight: 32, marginBottom: 8 },
  eyebrow: { fontFamily: font.bold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },
  p: { fontSize: 17, lineHeight: 25, marginVertical: 6, fontFamily: font.regular },
  btn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginTop: 10, minHeight: 52, justifyContent: 'center' },
  btnText: { fontSize: 17, lineHeight: 22, fontFamily: font.semibold },
  primaryWrap: { marginTop: 12, borderRadius: 14, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
  primary: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16, minHeight: 54, justifyContent: 'center', alignItems: 'center' },
  pill: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, marginRight: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: 9, gap: 12 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', minWidth: 72 },
});
