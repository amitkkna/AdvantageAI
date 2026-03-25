import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import api from '../../lib/api';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: string; }

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data } = await api.post('/chat/message', { sessionId, message: userMessage });
      setSessionId(data.data.sessionId);
      setStage(data.data.stage);
      setMessages([...newMessages, { role: 'assistant', content: data.data.message, timestamp: new Date().toISOString() }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong.', timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Stage indicator */}
      <View style={styles.stageBar}>
        {['Brand', 'Location', 'Budget', 'Match', 'Proposal'].map((s, i) => (
          <View key={s} style={styles.stageItem}>
            <View style={[styles.stageCircle, i + 1 <= stage && styles.stageActive]}>
              <Text style={[styles.stageNum, i + 1 <= stage && styles.stageNumActive]}>{i + 1}</Text>
            </View>
            <Text style={styles.stageLabel}>{s}</Text>
          </View>
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>AI Campaign Planner</Text>
            <Text style={styles.emptyText}>Tell me about your brand and advertising goals</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.messageText, item.role === 'user' && styles.userText]}>{item.content}</Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          multiline
          maxLength={1000}
          editable={!loading}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading || !input.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  stageBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fafafa' },
  stageItem: { alignItems: 'center' },
  stageCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  stageActive: { backgroundColor: '#3b82f6' },
  stageNum: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  stageNumActive: { color: '#fff' },
  stageLabel: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  messageList: { padding: 16, flexGrow: 1 },
  emptyChat: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1f2937', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  messageBubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#3b82f6' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6' },
  messageText: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
  userText: { color: '#fff' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  typingText: { fontSize: 12, color: '#6b7280' },
  inputBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#e5e7eb', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#3b82f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
