import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../lib/api';

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/campaigns', { params: { limit: 50 } })
      .then(({ data }) => setCampaigns(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    switch (s) { case 'LIVE': return '#22c55e'; case 'DRAFT': return '#9ca3af'; case 'CANCELLED': return '#ef4444'; default: return '#3b82f6'; }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <FlatList
      data={campaigns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No campaigns</Text></View>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.client}>{item.client?.companyName}</Text>
              <Text style={styles.dates}>
                {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
                <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.budget}>₹{(item.totalBudget / 1000).toFixed(0)}K</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  empty: { color: '#9ca3af', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  client: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  dates: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  budget: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginTop: 6 },
});
