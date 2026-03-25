import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../../lib/api';

export default function CheckinScreen() {
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/assets/map').then(({ data }) => setAssets(data.data || []));
  }, []);

  const handleCheckin = async () => {
    if (!selectedAsset) { Alert.alert('Error', 'Select an asset'); return; }
    setLoading(true);
    try {
      await api.post('/field-checkins', {
        assetId: selectedAsset,
        latitude: 21.2514, // Would use GPS in production
        longitude: 81.6296,
        notes,
        condition,
      });
      Alert.alert('Success', 'Check-in recorded!');
      setNotes('');
      setSelectedAsset('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const conditions = ['GOOD', 'NEEDS_REPAIR', 'DAMAGED', 'OBSTRUCTED'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Field Check-in</Text>
      <Text style={styles.subtitle}>Record asset condition and observations</Text>

      <Text style={styles.label}>Select Asset</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
        {assets.slice(0, 10).map((asset) => (
          <TouchableOpacity
            key={asset.id}
            style={[styles.assetChip, selectedAsset === asset.id && styles.assetChipActive]}
            onPress={() => setSelectedAsset(asset.id)}
          >
            <Text style={[styles.assetChipText, selectedAsset === asset.id && styles.assetChipTextActive]}>
              {asset.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Condition</Text>
      <View style={styles.conditionRow}>
        {conditions.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
            onPress={() => setCondition(c)}
          >
            <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
              {c === 'GOOD' ? '✅' : c === 'NEEDS_REPAIR' ? '🔧' : c === 'DAMAGED' ? '❌' : '🚫'}
            </Text>
            <Text style={[styles.conditionLabel, condition === c && styles.conditionLabelActive]}>
              {c.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add observations..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.photoBtn}>
        <Text style={styles.photoBtnText}>📷 Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={handleCheckin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Check-in</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  assetScroll: { flexDirection: 'row', marginBottom: 8 },
  assetChip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  assetChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  assetChipText: { fontSize: 13, color: '#374151' },
  assetChipTextActive: { color: '#fff', fontWeight: '600' },
  conditionRow: { flexDirection: 'row', gap: 8 },
  conditionBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 10, alignItems: 'center' },
  conditionBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  conditionText: { fontSize: 20 },
  conditionLabel: { fontSize: 9, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  conditionLabelActive: { color: '#3b82f6', fontWeight: '600' },
  notesInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, minHeight: 100, backgroundColor: '#f9fafb' },
  photoBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16, borderStyle: 'dashed' },
  photoBtnText: { fontSize: 14, color: '#6b7280' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
