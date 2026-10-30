import { Tabs } from 'expo-router';
import { theme } from '../../src/theme/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: theme.colors.shellBorder,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onShellMuted,
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="feed" options={{ title: 'Live Feed' }} />
      <Tabs.Screen name="positions" options={{ title: 'Positions' }} />
      <Tabs.Screen name="kill-log" options={{ title: 'Kill Log' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
