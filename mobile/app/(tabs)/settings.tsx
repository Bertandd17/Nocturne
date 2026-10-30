import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { theme } from '../../src/theme/theme';
import { useAppStore } from '../../src/store/appStore';
import { BACKEND_HTTP_URL } from '../../src/config/backend';

export default function SettingsScreen() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const wallet = useAppStore((s) => s.wallet);
  const setWallet = useAppStore((s) => s.setWallet);

  const killSwitchActive = config.killSwitchActive;
  const [localCfg, setLocalCfg] = useState({ ...config });
  const [burnerAddress, setBurnerAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  useEffect(() => {
    // Fetch burner address on mount
    fetch(`${BACKEND_HTTP_URL}/real/burner`)
      .then((res) => res.json())
      .then((data) => setBurnerAddress(data.address || ''))
      .catch(() => {});
  }, []);

  const connectPhantom = async () => {
    // Universal link to open Phantom
    const phantomUrl = 'https://phantom.app/ul/v1/connect?app_url=https://nocturne.desk&redirect_link=nocturne://connected';
    const canOpen = await Linking.canOpenURL(phantomUrl);
    if (canOpen) {
      await Linking.openURL(phantomUrl);
    } else {
      Alert.alert('Phantom Wallet', 'Phantom wallet app is not installed.');
    }
  };

  const handleModeSwitch = async (value: boolean) => {
    const targetMode = value ? 'real' : 'demo';

    if (targetMode === 'real') {
      Alert.alert(
        'Risk Confirmation',
        'Real mode executes live on-chain swaps with real capital. Ensure your daily loss limit is properly set. Proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I Understand & Accept Risk',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await fetch(`${BACKEND_HTTP_URL}/mode`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mode: 'real', demoDaysActive: wallet.demoDaysActive }),
                });
                const data = await res.json();
                if (!res.ok) {
                  Alert.alert('Activation Failed', data.error || 'Failed to activate real mode');
                  return;
                }
                setMode('real');
              } catch (e) {
                Alert.alert('Error', 'Could not reach backend');
              }
            },
          },
        ]
      );
    } else {
      setMode('demo');
      await fetch(`${BACKEND_HTTP_URL}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'demo' }),
      });
    }
  };

  const toggleKillSwitch = async () => {
    try {
      await fetch(`${BACKEND_HTTP_URL}/kill-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !killSwitchActive }),
      });
      setConfig({ ...config, killSwitchActive: !killSwitchActive });
    } catch (e) {
      console.error(e);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      Alert.alert('Validation Error', 'Enter a valid SOL amount');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_HTTP_URL}/real/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: wallet.userAddress || burnerAddress,
          amountSol: Number(withdrawAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Withdraw Error', data.error || 'Transaction failed');
        return;
      }
      Alert.alert('Success', `Withdrawal submitted: ${data.signature.slice(0, 10)}...`);
      setWithdrawAmount('');
    } catch (e) {
      Alert.alert('Error', 'Withdraw request failed');
    }
  };

  const saveThresholds = async () => {
    try {
      await fetch(`${BACKEND_HTTP_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localCfg),
      });
      setConfig(localCfg);
      Alert.alert('Saved', 'Thresholds successfully updated');
    } catch (e) {
      console.error(e);
    }
  };

  const onChange = (key: keyof typeof localCfg, value: string) => {
    setLocalCfg({ ...localCfg, [key]: Number(value) });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>System Control</Text>

      {/* Mode Toggle */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Live / Real Trading Mode</Text>
          <Text style={styles.subtext}>Locked until Demo runs for 7+ days</Text>
        </View>
        <Switch value={mode === 'real'} onValueChange={handleModeSwitch} />
      </View>

      {/* Emergency Kill Switch */}
      <View style={[styles.row, { borderColor: theme.colors.danger }]}>
        <View>
          <Text style={[styles.label, { color: theme.colors.danger, fontWeight: '700' }]}>EMERGENCY KILL SWITCH</Text>
          <Text style={styles.subtext}>Immediately halts pipeline & active entries</Text>
        </View>
        <Switch
          value={killSwitchActive}
          onValueChange={toggleKillSwitch}
          trackColor={{ false: theme.colors.surfaceSoft, true: theme.colors.danger }}
        />
      </View>

      {/* Phantom Wallet Integration */}
      <Text style={styles.section}>Phantom Wallet</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.connectBtn} onPress={connectPhantom}>
          <Text style={styles.connectText}>Connect Phantom Wallet</Text>
        </TouchableOpacity>
        <Text style={styles.subtext}>Connects securely via DeepLink / Adapter</Text>
      </View>

      {/* Real Mode Execution Burner */}
      <Text style={styles.section}>Execution Burner Wallet</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>BACKEND BURNER ADDRESS</Text>
        <Text style={styles.pubkey} selectable={true}>
          {burnerAddress || 'Generating...'}
        </Text>
        <Text style={styles.subtext}>Fund this wallet manually from Phantom up to max deposit limit</Text>

        <View style={styles.withdrawRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Amount SOL"
            placeholderTextColor={theme.colors.onSurfaceMuted}
            keyboardType="numeric"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
          />
          <TouchableOpacity style={[styles.saveBtn, { flex: 1, marginTop: 0 }]} onPress={handleWithdraw}>
            <Text style={styles.saveText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pipeline Config & Thresholds */}
      <Text style={styles.section}>Agent Thresholds</Text>
      {Object.entries(localCfg).map(([key, val]) => {
        if (key === 'killSwitchActive') return null;
        return (
          <View key={key} style={styles.inputRow}>
            <Text style={styles.inputLabel}>{key}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(val)}
              onChangeText={(t) => onChange(key as any, t)}
            />
          </View>
        );
      })}
      <TouchableOpacity style={styles.saveBtn} onPress={saveThresholds}>
        <Text style={styles.saveText}>Save Thresholds</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.type.headlineLg.fontSize,
    fontWeight: '700',
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  label: {
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 11,
    color: theme.colors.onSurfaceMuted,
    marginTop: 2,
  },
  section: {
    fontSize: theme.type.labelSm.fontSize,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginBottom: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: theme.type.labelSm.fontSize,
    color: theme.colors.onSurfaceMuted,
    fontWeight: '600',
  },
  pubkey: {
    fontSize: 11,
    color: theme.colors.primaryFocus,
    marginVertical: theme.spacing.xs,
  },
  connectBtn: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.outlineStrong,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  connectText: {
    color: theme.colors.onBackground,
    fontWeight: '600',
    fontSize: theme.type.bodySm.fontSize,
  },
  withdrawRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  inputLabel: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.onBackground,
    flex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.rounded.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    color: theme.colors.onBackground,
    backgroundColor: theme.colors.surfaceElevated,
  },
  saveBtn: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.sm,
    alignItems: 'center',
  },
  saveText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    fontSize: theme.type.bodySm.fontSize,
  },
});
