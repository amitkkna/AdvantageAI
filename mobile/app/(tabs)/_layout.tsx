import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    map: '🗺️', chat: '🤖', campaigns: '📢', checkin: '📋', profile: '👤',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[name] || '📌'}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#9ca3af',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Map', tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} /> }} />
      <Tabs.Screen name="campaigns" options={{ title: 'Campaigns', tabBarIcon: ({ focused }) => <TabIcon name="campaigns" focused={focused} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'AI Chat', tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} /> }} />
      <Tabs.Screen name="checkin" options={{ title: 'Check-in', tabBarIcon: ({ focused }) => <TabIcon name="checkin" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }} />
    </Tabs>
  );
}
