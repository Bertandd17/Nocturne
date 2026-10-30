import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAppStore } from '../../src/store/appStore';
import { theme } from '../../src/theme/theme';
import { format } from 'date-fns';
import { BACKEND_HTTP_URL } from '../../src/config/backend';

export default function PositionsScreen() {
  const positions = useAppStore((s) => s.positions);
  const closePosition = async (id: string) => {
    try {
      await fetch(`${BACKEND_HTTP_URL}/positions/${id}/close`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.status !== 'open') return null;
    const pnlUsd = (item.currentPriceUsd - item.entryPriceUsd) * item.amountToken;
    const pnlPercent = (pnlUsd / (item.entryPriceUsd * item.amountToken)) * 100;
    return (
      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => closePosition(item.id)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.info}>Entry $ {item.entryPriceUsd.toFixed(4)}</Text>
        <Text style={styles.info}>Current $ {item.currentPriceUsd.toFixed(4)}</Text>
        <Text style={styles.info}>SL $ {item.stopLossPriceUsd.toFixed(4)}</Text>
        <Text style={styles.info}>PNL {pnlUsd.toFixed(2)} USD ({pnlPercent.toFixed(1)}%)</Text>
        {item.trailingActive && (
          <Text style={styles.info}>Trailing Stop @ $ {item.trailingStopPriceUsd?.toFixed(4)}</Text>
        )}
        <Text style={styles.timestamp}>Opened {format(item.entryTimestamp, 'dd MMM HH:mm')}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={positions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  symbol: {
    fontSize: theme.type.titleMd.fontSize,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  closeBtn: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.rounded.sm,
  },
  closeText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    fontSize: theme.type.bodySm.fontSize,
  },
  info: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.onSurfaceMuted,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.onSurfaceMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },
});
