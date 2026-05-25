import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Theme } from '../components/Theme';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { processSession } from '../services/notesService';
import { Session } from '../types';

interface TranscriptReviewScreenProps {
  session: Session;
  onApprove: (session: Session) => void;
  onBack: () => void;
}

function formatSeconds(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const TranscriptReviewScreen: React.FC<TranscriptReviewScreenProps> = ({ session, onApprove, onBack }) => {
  const [viewMode, setViewMode] = useState<'full' | 'segments'>('full');
  const [textMode, setTextMode] = useState<'raw' | 'cleaned'>('raw');
  const [loading, setLoading] = useState(false);

  const chunks = useMemo(() => Array.isArray(session.transcript_chunks) ? session.transcript_chunks : [], [session]);

  const fullRawTranscript = useMemo(() => {
    return chunks.map((c) => (c.raw_text || '').trim()).filter(Boolean).join('\n\n');
  }, [chunks]);

  const fullCleanedTranscript = useMemo(() => {
    return chunks.map((c) => (c.cleaned_text || c.raw_text || '').trim()).filter(Boolean).join('\n\n');
  }, [chunks]);

  const activeTranscriptText = textMode === 'cleaned' ? fullCleanedTranscript : fullRawTranscript;
  const wordCount = useMemo(() => activeTranscriptText ? activeTranscriptText.split(/\s+/).length : 0, [activeTranscriptText]);

  const totalDurationSeconds = useMemo(() => {
    return chunks.reduce((acc, chunk) => {
      const start = chunk.chunk_start_sec ?? 0;
      const end = chunk.chunk_end_sec ?? 0;
      return acc + Math.max(0, end - start);
    }, 0);
  }, [chunks]);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await processSession(session.session_id);
      onApprove(result);
    } catch (err: any) {
      console.error('Approve failed:', err);
      alert(err.message || 'Note generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.fileName} numberOfLines={2}>{session.filename}</Text>
          <Text style={styles.headerSubtitle}>Transcription review is required before notes are generated.</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{wordCount}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{formatSeconds(totalDurationSeconds) || 'n/a'}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{chunks.length}</Text>
            <Text style={styles.statLabel}>Segments</Text>
          </View>
        </View>

        <View style={styles.toolbar}>
          {/* View Mode Switcher */}
          <View style={styles.toggleGroup}>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'full' && styles.toggleActive]}
              onPress={() => setViewMode('full')}
            >
              <Text style={[styles.toggleText, viewMode === 'full' && styles.toggleTextActive]}>Full Text</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'segments' && styles.toggleActive]}
              onPress={() => setViewMode('segments')}
            >
              <Text style={[styles.toggleText, viewMode === 'segments' && styles.toggleTextActive]}>Segments</Text>
            </TouchableOpacity>
          </View>

          {/* Text Mode Switcher (only for full view) */}
          {viewMode === 'full' ? (
            <View style={styles.toggleGroup}>
              <TouchableOpacity 
                style={[styles.toggleBtn, textMode === 'raw' && styles.toggleActive]}
                onPress={() => setTextMode('raw')}
              >
                <Text style={[styles.toggleText, textMode === 'raw' && styles.toggleTextActive]}>Raw</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, textMode === 'cleaned' && styles.toggleActive]}
                onPress={() => setTextMode('cleaned')}
              >
                <Text style={[styles.toggleText, textMode === 'cleaned' && styles.toggleTextActive]}>Cleaned</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Card style={styles.transcriptCard}>
          {chunks.length === 0 ? (
            <Text style={styles.emptyText}>No transcript text available.</Text>
          ) : viewMode === 'full' ? (
            <Text style={styles.fullTranscriptText}>{activeTranscriptText}</Text>
          ) : (
            <View style={styles.segmentList}>
              {chunks.map((chunk, idx) => (
                <View key={idx} style={[styles.segmentItem, idx < chunks.length - 1 && styles.borderBottom]}>
                  <View style={styles.segmentHeader}>
                    <Text style={styles.segmentTitle}>Segment {idx + 1}</Text>
                    <Text style={styles.segmentTime}>
                      {formatSeconds(chunk.chunk_start_sec)} - {formatSeconds(chunk.chunk_end_sec || 0)}
                    </Text>
                  </View>
                  
                  <View style={styles.chunkTextSection}>
                    <Text style={styles.chunkTextLabel}>Raw Transcript</Text>
                    <Text style={styles.chunkText}>{chunk.raw_text}</Text>
                  </View>

                  {chunk.cleaned_text && chunk.cleaned_text !== chunk.raw_text ? (
                    <View style={styles.chunkTextSection}>
                      <Text style={styles.chunkTextLabel}>Cleaned Transcript</Text>
                      <Text style={styles.chunkText}>{chunk.cleaned_text}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.chunkConf}>
                    Confidence Score: {chunk.avg_confidence ? chunk.avg_confidence.toFixed(2) : 'n/a'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton 
          title="Back to Upload" 
          variant="secondary" 
          onPress={onBack} 
          disabled={loading}
          style={styles.actionBtn}
        />
        <CustomButton 
          title="Generate Notes" 
          variant="primary" 
          onPress={handleApprove} 
          loading={loading}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgPage,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.sm,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.brandDark,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#e2ebf8',
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: Theme.colors.brandDark,
  },
  transcriptCard: {
    minHeight: 200,
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.textMuted,
    paddingVertical: 40,
  },
  fullTranscriptText: {
    fontSize: 14,
    lineHeight: 22,
    color: Theme.colors.textPrimary,
    padding: 4,
  },
  segmentList: {
    paddingVertical: 4,
  },
  segmentItem: {
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  segmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.brandDark,
  },
  segmentTime: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  chunkTextSection: {
    marginBottom: 8,
  },
  chunkTextLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  chunkText: {
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.textPrimary,
  },
  chunkConf: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
