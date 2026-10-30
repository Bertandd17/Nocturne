import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAppStore } from '../../src/store/appStore';
import { theme } from '../../src/theme/theme';
import { format } from 'date-fns';

export default function KillLogScreen() {
  const killLog = useAppStore((s) => s.killLog);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.entry}>
      <View style={styles.header}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <Text style={styles.time}>{format(item.timestamp, 'HH:mm:ss')}</Text>
      </View>
      <Text style={styles.rule}>Rejected: {item.ruleViolated}</Text>
      <Text style={styles.details}>{item.details}</Text>
    </View>
  );

  return (
    <FlatList
      data={killLog}
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
  entry: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  symbol: {
    fontSize: theme.type.titleMd.fontSize,
    fontWeight: '700',
    color: theme.colors.danger,
  },
  time: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.onSurfaceMuted,
  },
  rule: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  details: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.onSurfaceMuted,
    marginTop: theme.spacing.xs,
  },
});