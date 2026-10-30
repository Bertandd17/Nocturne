import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAppStore } from '../../src/store/appStore';
import { theme } from '../../src/theme/theme';
import { format } from 'date-fns';

export default function LiveFeedScreen() {
  const feed = useAppStore((s) => s.liveFeed);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.entry}>
      <Text style={styles.time}>{format(item.ts, 'HH:mm:ss')}</Text>
      <Text style={styles.message}>{item.message}</Text>
    </View>
  );

  return (
    <FlatList
      data={feed}
      renderItem={renderItem}
      keyExtractor={(item, idx) => `${item.type}-${idx}`}
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
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  time: {
    fontSize: theme.type.bodySm.fontSize,
    color: theme.colors.onSurfaceMuted,
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: theme.type.bodyMd.fontSize,
    color: theme.colors.onBackground,
  },
});
