import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
        </Text>
      </View>

      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{user?.role}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{user?.role}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 60 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: '700', color: '#1f2937', marginTop: 16 },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  roleBadge: { backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  roleText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  section: { width: '100%', paddingHorizontal: 24, marginTop: 40 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  logoutBtn: { marginTop: 40, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
