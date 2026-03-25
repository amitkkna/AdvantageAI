import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../lib/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (e: string, p: string) => {
    setLoading(true);
    try { await login(e, p); router.replace('/(tabs)'); }
    catch { Alert.alert('Error', 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>AV</Text>
          </View>
          <Text style={styles.title}>AdVantage AI</Text>
          <Text style={styles.subtitle}>OOH Campaign Manager</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@advantage.ai"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <Text style={styles.demoLabel}>Quick Login (Demo)</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity style={styles.demoBtn} onPress={() => quickLogin('admin@advantage.ai', 'admin123')}>
              <Text style={styles.demoBtnText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoBtn} onPress={() => quickLogin('sales@advantage.ai', 'sales123')}>
              <Text style={styles.demoBtnText}>Sales</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoBtn} onPress={() => quickLogin('field@advantage.ai', 'field123')}>
              <Text style={styles.demoBtnText}>Field</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoBtn} onPress={() => quickLogin('sanjay@raipurmotors.com', 'client123')}>
              <Text style={styles.demoBtnText}>Client</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1e3a5f' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9fafb' },
  button: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  demoLabel: { textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20, marginBottom: 10 },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  demoBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  demoBtnText: { fontSize: 12, color: '#6b7280' },
});
