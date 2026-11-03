import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { condensed, useTheme } from '@/theme';

/** Cartão com entrada suave (como a animação .card do original). */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const a = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: t.card, borderColor: t.line },
        { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function H1({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.h1, condensed, { color: t.ink }]}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.h2, condensed, { color: t.ink }]}>{children}</Text>;
}

export function P({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<any> }) {
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
};

export function Btn({ label, children, onPress, primary, small, disabled, busy }: BtnProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        small ? styles.btnSm : styles.btn,
        {
          borderColor: pressed ? t.acc : t.line,
          backgroundColor: primary ? t.acc : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        primary && { borderColor: t.acc },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? t.accText : t.ink} />
      ) : label != null ? (
        <Text
          style={[
            small ? styles.btnSmText : styles.btnText,
            { color: primary ? t.accText : t.ink, textAlign: primary ? 'center' : 'left' },
          ]}
        >
          {label}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function Chip({ text, up }: { text: string; up: boolean }) {
  const t = useTheme();
  const c = up ? t.good : t.bad;
  return (
    <View style={[styles.chip, { borderColor: c }]}>
      <Text style={{ color: c, fontSize: 14, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export function Row({ label, value }: { label: string; value: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.line }]}>
      <Text style={{ color: t.ink, fontSize: 16, flexShrink: 1 }}>{label}</Text>
      <Text style={{ color: t.ink, fontSize: 16, fontWeight: '700', textAlign: 'right', flexShrink: 1 }}>{value}</Text>
    </View>
  );
}

export function Bar({ value, height = 6 }: { value: number; height?: number }) {
  const t = useTheme();
  return (
    <View style={{ height, backgroundColor: t.line, borderRadius: height / 2, marginTop: 3 }}>
      <View
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: t.acc, borderRadius: height / 2 }}
      />
    </View>
  );
}

export const money = (v: number) => v.toFixed(1).replace(/\.0$/, '');

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: 6, padding: 18 },
  h1: { fontSize: 48, lineHeight: 50 },
  h2: { fontSize: 30, lineHeight: 32, marginBottom: 10 },
  p: { fontSize: 17, lineHeight: 25, marginVertical: 6 },
  btn: { borderWidth: 2, borderRadius: 6, paddingVertical: 13, paddingHorizontal: 14, marginTop: 10, minHeight: 50, justifyContent: 'center' },
  btnText: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  btnSm: { borderWidth: 2, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8, marginBottom: 10, alignSelf: 'flex-start' },
  btnSmText: { fontSize: 14, fontWeight: '600' },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 2, marginTop: 8, marginRight: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: 6, gap: 12 },
});
