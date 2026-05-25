import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Theme } from '../components/Theme';
import { fetchHistory, fetchSessionDetails } from '../services/notesService';
import { HistoryItem, Session } from '../types';

interface HistoryScreenProps {
  onSelectSession: (session: Session) => void;
  onBack: () => void;
}

function formatDate(isoString: string) {
  if (!isoString) return 'Unknown';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onSelectSession, onBack }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const items = await fetchHistory(50);
      setHistoryItems(items);
    } catch (err: any) {
      console.error('History load error:', err);
      setErrorMsg(err.message || 'Failed to load session history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelectItem = async (item: HistoryItem) => {
    if (selectingId) return;
    setSelectingId(item.session_id);
    
    try {
      const details = await fetchSessionDetails(item.session_id);
      onSelectSession(details);
    } catch (err: any) {
      console.error('Fetch details failed:', err);
      alert(err.message || 'Failed to load session details.');
    } finally {
      setSelectingId(null);
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isSelecting = selectingId === item.session_id;

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleSelectItem(item)}
        disabled={selectingId !== null}
        activeOpacity={0.7}
      >
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.filename || 'Untitled Lecture'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {item.chunk_count || 0} section{item.chunk_count !== 1 ? 's' : ''} processed
          </Text>
        </View>
        
        <View style={styles.cardMeta}>
          {isSelecting ? (
            <ActivityIndicator size="small" color={Theme.colors.brand} />
          ) : (
            <>
              <Text style={styles.cardDate}>{formatDate(item.updated_at)}</Text>
              <Text style={styles.cardId}>{item.session_id.slice(0, 8)}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← Back to Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadHistory} disabled={loading || selectingId !== null}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.brand} />
          <Text style={styles.loadingText}>Fetching history...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadHistory}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : historyItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>No Sessions Found</Text>
          <Text style={styles.emptyText}>Upload your first lecture audio to generate structured study notes.</Text>
        </View>
      ) : (
        <FlatList
          data={historyItems}
          keyExtractor={(item) => item.session_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgPage,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  backLink: {
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.brandDark,
  },
  refreshBtn: {
    paddingVertical: 4,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: Theme.colors.brand,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: Theme.radius.sm,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    ...Theme.shadow.sm,
  },
  cardMain: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  cardMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 90,
  },
  cardDate: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  cardId: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Theme.colors.textMuted,
    backgroundColor: Theme.colors.bgSubtle,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
});
