import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../lib/api';

interface MapMarker {
  id: string; code: string; name: string; type: string; status: string;
  latitude: number; longitude: number; monthlyRate: number; color: string;
}

export default function MapScreen() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assets/map')
      .then(({ data }) => setMarkers(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const colorMap: Record<string, string> = {
    green: '#22c55e', orange: '#f97316', red: '#ef4444', grey: '#9ca3af',
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>🗺️ Map View</Text>
          <Text style={styles.mapSubtext}>{markers.length} assets loaded</Text>
          <Text style={styles.mapSubtext}>Add Google Maps API key to enable</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[['green', 'Available'], ['orange', 'Partial'], ['red', 'Booked'], ['grey', 'Maintenance']].map(([c, l]) => (
            <View key={c} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colorMap[c] }]} />
              <Text style={styles.legendText}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Asset list */}
      <FlatList
        data={markers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <View style={styles.cardRow}>
              <View style={[styles.dot, { backgroundColor: colorMap[item.color] }]} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.code} - {item.name}</Text>
                <Text style={styles.cardSub}>{item.type.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.cardRate}>₹{(item.monthlyRate / 1000).toFixed(0)}K/mo</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapContainer: { height: 250, backgroundColor: '#e5edff', justifyContent: 'center', alignItems: 'center' },
  mapPlaceholder: { alignItems: 'center' },
  mapText: { fontSize: 24, fontWeight: '600', color: '#6b7280' },
  mapSubtext: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  legend: { flexDirection: 'row', position: 'absolute', bottom: 10, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, color: '#6b7280' },
  list: { flex: 1, padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  cardSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardRate: { fontSize: 13, fontWeight: '600', color: '#3b82f6' },
});
