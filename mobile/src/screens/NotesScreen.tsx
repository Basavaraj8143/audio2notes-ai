import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Theme } from '../components/Theme';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { exportFile, askQuestion } from '../services/notesService';
import { Session, NoteChunk } from '../types';

interface NotesScreenProps {
  session: Session;
  onBack: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: number;
}

const QA_SUGGESTED = [
  'What are the main topics covered?',
  'Can you explain the key definitions?',
  'Give me a summary of this lecture.',
];

export const NotesScreen: React.FC<NotesScreenProps> = ({ session, onBack }) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'qa'>('notes');
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'docx' | 'txt' | null>(null);

  // QA Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Ask any question about this lecture. Responses are grounded in the transcript context.',
    },
  ]);
  const [qaInput, setQaInput] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const chatScrollViewRef = useRef<ScrollView>(null);

  const notes: NoteChunk[] = useMemo(() => session.notes_chunks || [], [session]);
  
  const highConfidenceCount = useMemo(() => {
    return notes.filter((n) => n.confidence === 'HIGH').length;
  }, [notes]);

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    setExportingFormat(format);
    try {
      await exportFile(session.session_id, format, session.filename);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export file.');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleSendQA = async (text?: string) => {
    const query = (text || qaInput).trim();
    if (!query || qaLoading) return;

    setQaInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setQaLoading(true);

    try {
      const response = await askQuestion(session.session_id, query);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          sources: response.source_chunks?.length || 0,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message || 'Failed to retrieve answer.'}`,
        },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'qa') {
      setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, activeTab]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
      style={styles.container}
    >
      <View style={styles.tabHeader}>
        <View style={styles.tabButtons}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'notes' && styles.tabBtnActive]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>Study Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'qa' && styles.tabBtnActive]}
            onPress={() => setActiveTab('qa')}
          >
            <Text style={[styles.tabText, activeTab === 'qa' && styles.tabTextActive]}>Grounded Q&A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'notes' ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaNum}>{notes.length}</Text>
              <Text style={styles.metaLabel}>Sections</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaNum}>{highConfidenceCount}</Text>
              <Text style={styles.metaLabel}>High Conf.</Text>
            </View>
          </View>

          {/* Export Panel */}
          <Card style={styles.exportCard}>
            <Text style={styles.exportTitle}>Export Lecture Notes</Text>
            <View style={styles.exportButtonsRow}>
              {(['pdf', 'docx', 'txt'] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[styles.exportBtn, exportingFormat === fmt && styles.exportBtnLoading]}
                  onPress={() => handleExport(fmt)}
                  disabled={exportingFormat !== null}
                >
                  {exportingFormat === fmt ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.exportBtnText}>{fmt.toUpperCase()}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Notes Grid List */}
          {notes.map((chunk, i) => (
            <Card key={i} style={styles.notesChunkCard}>
              <View style={styles.chunkHeader}>
                <Text style={styles.chunkTopic} numberOfLines={2}>
                  Section {i + 1}: {chunk.topic || 'Untitled Topic'}
                </Text>
                <View style={[
                  styles.confBadge,
                  chunk.confidence === 'HIGH' && styles.confHigh,
                  chunk.confidence === 'MEDIUM' && styles.confMed,
                  chunk.confidence === 'LOW' && styles.confLow
                ]}>
                  <Text style={styles.confBadgeText}>{chunk.confidence}</Text>
                </View>
              </View>

              {/* Key points */}
              {chunk.key_points && chunk.key_points.length > 0 ? (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionLabel}>Key Points</Text>
                  {chunk.key_points.map((kp, j) => (
                    <Text key={j} style={styles.bulletItem}>• {kp}</Text>
                  ))}
                </View>
              ) : null}

              {/* Definitions */}
              {chunk.definitions && Object.keys(chunk.definitions).length > 0 ? (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionLabel}>Definitions</Text>
                  {Object.entries(chunk.definitions).map(([term, defn]) => (
                    <Text key={term} style={styles.defItem}>
                      <Text style={styles.defTerm}>{term}: </Text>
                      {defn}
                    </Text>
                  ))}
                </View>
              ) : null}

              {/* Summary */}
              {chunk.summary ? (
                <View style={styles.summaryWrap}>
                  <Text style={styles.summaryText}>{chunk.summary}</Text>
                </View>
              ) : null}
            </Card>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.qaContainer}>
          <ScrollView 
            ref={chatScrollViewRef} 
            style={styles.chatScroll} 
            contentContainerStyle={styles.chatScrollContent}
          >
            {/* Starter Prompts */}
            <View style={styles.suggestedContainer}>
              <Text style={styles.suggestedLabel}>Suggested Questions:</Text>
              <View style={styles.suggestedGrid}>
                {QA_SUGGESTED.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    style={styles.suggestedItem}
                    onPress={() => handleSendQA(prompt)}
                    disabled={qaLoading}
                  >
                    <Text style={styles.suggestedItemText} numberOfLines={1}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message History */}
            {messages.map((msg, i) => (
              <View key={i} style={[
                styles.messageRow,
                msg.role === 'user' ? styles.userRow : styles.assistantRow
              ]}>
                <View style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.assistantText
                  ]}>
                    {msg.content}
                  </Text>
                  {msg.sources ? (
                    <Text style={styles.sourcesText}>
                      Based on {msg.sources} source chunk{msg.sources > 1 ? 's' : ''}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}

            {qaLoading ? (
              <View style={styles.loadingBubbleRow}>
                <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color={Theme.colors.brand} />
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Ask a question about the lecture..."
              placeholderTextColor={Theme.colors.textMuted}
              value={qaInput}
              onChangeText={setQaInput}
              multiline={false}
              editable={!qaLoading}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !qaInput.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendQA()}
              disabled={qaLoading || !qaInput.trim()}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgPage,
  },
  tabHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#e6f0fa',
    borderRadius: 8,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  tabTextActive: {
    color: Theme.colors.brandDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.brandDark,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  exportCard: {
    marginBottom: 16,
  },
  exportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  exportButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: Theme.colors.brandDark,
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnLoading: {
    backgroundColor: Theme.colors.textMuted,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  notesChunkCard: {
    marginBottom: 14,
  },
  chunkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  chunkTopic: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  confBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  confHigh: {
    backgroundColor: Theme.colors.successBg,
  },
  confMed: {
    backgroundColor: '#fffbeb',
  },
  confLow: {
    backgroundColor: Theme.colors.dangerBg,
  },
  confBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
  },
  sectionWrap: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    paddingLeft: 4,
  },
  defItem: {
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    paddingLeft: 4,
  },
  defTerm: {
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  summaryWrap: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    color: Theme.colors.textSecondary,
  },
  // Q&A Chat Styles
  qaContainer: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 16,
  },
  suggestedContainer: {
    marginBottom: 16,
  },
  suggestedLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  suggestedGrid: {
    gap: 8,
  },
  suggestedItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Theme.colors.borderStrong,
    borderRadius: Theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestedItemText: {
    fontSize: 12,
    color: Theme.colors.brandDark,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: Theme.radius.md,
  },
  userBubble: {
    backgroundColor: Theme.colors.brand,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderBottomLeftRadius: 2,
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  loadingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  assistantText: {
    color: Theme.colors.textPrimary,
  },
  sourcesText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.borderStrong,
    borderRadius: Theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.bgSurfaceSoft,
  },
  sendBtn: {
    backgroundColor: Theme.colors.brand,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: Theme.radius.md,
  },
  sendBtnDisabled: {
    backgroundColor: Theme.colors.borderStrong,
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
