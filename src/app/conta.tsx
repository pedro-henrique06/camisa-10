import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { api, useAccount } from '@/api/client';
import { Screen } from '@/components/Screen';
import { Btn, Card, Eyebrow, FadeIn, H1, P, PressableScale, haptic } from '@/components/ui';
import { font, useTheme } from '@/theme';

/** Conta: entrar, criar conta ou sair. Com a conta, as carreiras e as mesas seguem para qualquer aparelho. */
export default function AccountScreen() {
  const router = useRouter();
  const t = useTheme();
  const account = useAccount();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const input = [styles.input, { color: t.ink, borderColor: t.line, backgroundColor: t.cardHi }];

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = mode === 'login' ? await api.login(email.trim(), password) : await api.register(email.trim(), password, name.trim());
      haptic.success();
      setPassword('');
      const brought = r.imported > 0 ? ` ${r.imported === 1 ? 'A carreira' : `As ${r.imported} carreiras`} deste aparelho ${r.imported === 1 ? 'veio' : 'vieram'} junto.` : '';
      setDone((mode === 'login' ? `Bem-vindo de volta, ${r.account.name}!` : `Conta criada, ${r.account.name}!`) + brought);
    } catch (e) {
      haptic.fail();
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    await api.logout();
    setBusy(false);
    setDone(null);
  };

  const ready =
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && password.length >= 6 && (mode === 'login' || name.trim().length >= 2);

  return (
    <Screen>
      <Btn small label="‹ Início" onPress={() => router.replace('/')} />
      <View style={{ height: 10 }} />

      {account ? (
        <FadeIn>
          <Eyebrow>Sua conta</Eyebrow>
          <H1 style={{ fontSize: 40, lineHeight: 42 }}>{account.name}</H1>
          <P muted>{account.email}</P>
          {done && (
            <Card accent={t.good}>
              <Text style={{ color: t.good, fontFamily: font.semibold }}>{done}</Text>
            </Card>
          )}
          <Card>
            <P style={{ marginTop: 0 }}>
              ✅ Suas carreiras e mesas ficam guardadas na conta. Em outro celular ou no computador, entre com o mesmo e-mail e senha
              para continuar de onde parou.
            </P>
            <Btn primary label="Jogar  ⚽" onPress={() => router.replace('/')} />
          </Card>
          <Btn label="Sair da conta" onPress={logout} busy={busy} />
          <P muted style={{ textAlign: 'center', fontSize: 13 }}>
            Ao sair, este aparelho volta a jogar como convidado. Nada é apagado da conta.
          </P>
        </FadeIn>
      ) : (
        <FadeIn>
          <Eyebrow>Conta</Eyebrow>
          <H1 style={{ fontSize: 40, lineHeight: 42 }}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</H1>
          <P muted>
            Com a conta, suas carreiras e mesas não se perdem se você trocar de celular, e os amigos da mesa te acham em qualquer aparelho.
          </P>

          <View style={[styles.tabs, { borderColor: t.line, backgroundColor: t.cardHi }]}>
            {(['login', 'register'] as const).map((m) => (
              <PressableScale
                key={m}
                containerStyle={{ flex: 1 }}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                style={[styles.tab, mode === m && { backgroundColor: t.acc }]}
              >
                <Text style={{ color: mode === m ? t.bg : t.mut, fontFamily: font.bold, textAlign: 'center' }}>
                  {m === 'login' ? 'Já tenho conta' : 'Sou novo'}
                </Text>
              </PressableScale>
            ))}
          </View>

          <Card>
            {mode === 'register' && (
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={24}
                placeholder="Seu nome (aparece para os amigos)"
                placeholderTextColor={t.mut}
                autoComplete="name"
                style={input}
              />
            )}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor={t.mut}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              style={input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'register' ? 'Senha (pelo menos 6 caracteres)' : 'Senha'}
              placeholderTextColor={t.mut}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              textContentType={mode === 'register' ? 'newPassword' : 'password'}
              onSubmitEditing={() => ready && submit()}
              style={input}
            />
            {error && <Text style={{ color: t.bad, fontFamily: font.semibold, marginBottom: 8 }}>{error}</Text>}
            <Btn primary label={mode === 'login' ? 'Entrar' : 'Criar conta'} onPress={submit} busy={busy} disabled={!ready} />
            <P muted style={{ fontSize: 13, marginBottom: 0 }}>
              {mode === 'login'
                ? 'Se você já jogou neste aparelho como convidado, essas carreiras vêm para a conta.'
                : 'As carreiras e mesas que você já tem neste aparelho passam a ser da conta.'}
            </P>
          </Card>
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 10 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4, marginBottom: 12 },
  tab: { borderRadius: 9, paddingVertical: 10 },
});
