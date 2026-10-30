import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../src/theme/theme';
import { useAppStore } from '../../src/store/appStore';
import { usePipelineSocket } from '../../src/hooks/usePipelineSocket';
import { BACKEND_HTTP_URL } from '../../src/config/backend';

export default function DashboardScreen() {
  usePipelineSocket();

  const agents = useAppStore((s) => s.agents);
  const wallet = useAppStore((s) => s.wallet);
  const positions = useAppStore((s) => s.positions);
  const openPositions = positions.filter((p) => p.status === 'open');

  const handleReset = async () => {
    try {
      await fetch(`${BACKEND_HTTP_URL}/demo/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sol: 10 }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Top Banner / Mode Badge */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nocturne Desk</Text>
          <Text style={styles.subtitle}>Solana Memecoin Engine</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>DEMO</Text>
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>DEMO BALANCE</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceValue}>{wallet.balanceSol.toFixed(2)} SOL</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceSub}>Open Positions: {openPositions.length}</Text>
      </View>

      {/* Agents Telemetry Panel */}
      <Text style={styles.sectionTitle}>6-AGENT PIPELINE</Text>
      <View style={styles.agentGrid}>
        {agents.map((agent) => (
          <View key={agent.name} style={styles.agentCard}>
            <View style={styles.agentHeader}>
              <Text style={styles.agentName}>{agent.name.toUpperCase()}</Text>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      agent.status === 'running'
                        ? theme.colors.success
                        : agent.status === 'error'
                        ? theme.colors.danger
                        : theme.colors.warning,
                  },
                ]}
              />
            </View>
            <Text style={styles.agentProcessed}>Hits: {agent.processedCount}</Text>
            <Text style={styles.agentStatusText}>Status: {agent.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.type.headlineLg.fontSize,
    fontWeight: '700',
    color: theme.colors.onBackground,
  },
  subtitle: {
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.colors.onSurfaceMuted,
  },
  modeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.rounded.pill,
  },
  modeText: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
    fontSize: theme.type.labelSm.fontSize,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cardLabel: {
    fontSize: theme.type.labelSm.fontSize,
    fontWeight: '600',
    color: theme.colors.onSurfaceMuted,
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  balanceValue: {
    fontSize: theme.type.headlineXl.fontSize,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  balanceSub: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.onSurfaceMuted,
  },
  resetButton: {
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.rounded.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineStrong,
  },
  resetButtonText: {
    color: theme.colors.onSurface,
    fontWeight: '600',
    fontSize: theme.type.bodySm.fontSize,
  },
  sectionTitle: {
    fontSize: theme.type.labelSm.fontSize,
    fontWeight: '700',
    color: theme.colors.onSurfaceMuted,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  agentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  agentCard: {
    flexBasis: '48%',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginBottom: theme.spacing.sm,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  agentName: {
    fontSize: theme.type.labelSm.fontSize,
    fontWeight: '700',
    color: theme.colors.onBackground,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentProcessed: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.onSurfaceMuted,
  },
  agentStatusText: {
    fontSize: 11,
    color: theme.colors.primaryFocus,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
