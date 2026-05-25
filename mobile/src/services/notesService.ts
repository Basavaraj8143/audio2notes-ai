import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { request, apiUrl } from './apiClient';
import { Session, QAResponse, HistoryItem } from '../types';

const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/x-m4a';
    case 'ogg':
      return 'audio/ogg';
    case 'flac':
      return 'audio/flac';
    default:
      return 'application/octet-stream';
  }
};

export const uploadAudioFile = async (fileUri: string, filename: string): Promise<Session> => {
  const formData = new FormData();

  // React Native FormData expects an object with uri, name, type for files
  const fileDetail = {
    uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
    name: filename,
    type: getMimeType(filename),
  };

  formData.append('file', fileDetail as any);

  const data = await request<any>('/api/v1/audio/upload', {
    method: 'POST',
    body: formData,
    timeoutMs: 120000,
  });

  // Backend returns 'transcript_chunks' after upload
  return {
    session_id: data.session_id,
    filename: data.filename,
    status: data.status || 'transcribed',
    transcript_chunks: data.transcript_chunks || [],
    chunk_count: data.chunk_count,
    notes_chunks: null,
    merged_notes: null,
  };
};

export const processSession = async (sessionId: string): Promise<Session> => {
  const data = await request<any>('/api/v1/audio/process', {
    method: 'POST',
    body: { session_id: sessionId },
    timeoutMs: 90000,
  });

  // Backend returns 'notes' (not 'notes_chunks')
  return {
    session_id: data.session_id,
    filename: data.filename,
    status: data.status || 'completed',
    notes_chunks: data.notes || [],
    merged_notes: data.merged_notes || null,
    chunk_count: data.chunk_count,
  };
};

export const fetchSessionDetails = async (sessionId: string): Promise<Session> => {
  const data = await request<any>(`/api/v1/notes/${sessionId}`);
  // Backend returns 'notes' field (maps to our notes_chunks)
  return {
    session_id: data.session_id,
    filename: data.filename,
    notes_chunks: data.notes || [],
    merged_notes: data.merged_notes || null,
    status: 'completed',
  };
};

export const fetchHistory = async (limit: number = 30): Promise<HistoryItem[]> => {
  const response = await request<{ items: HistoryItem[] }>(`/api/v1/notes/history?limit=${limit}`);
  return response.items || [];
};

export const askQuestion = async (sessionId: string, question: string): Promise<QAResponse> => {
  return request<QAResponse>('/api/v1/qa/ask', {
    method: 'POST',
    body: { session_id: sessionId, question },
  });
};

export const exportFile = async (sessionId: string, format: 'pdf' | 'docx' | 'txt', filename: string): Promise<void> => {
  const downloadUrl = apiUrl(`/api/v1/export/${sessionId}/${format}`);
  const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  const localUri = `${FileSystem.documentDirectory}${safeFilename}.${format}`;

  try {
    const downloadResult = await FileSystem.downloadAsync(downloadUrl, localUri);
    
    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download export file. HTTP Status: ${downloadResult.status}`);
    }

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(localUri, {
      mimeType: format === 'pdf' ? 'application/pdf' : format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
      dialogTitle: `Export notes as ${format.toUpperCase()}`,
    });
  } catch (err: any) {
    console.error('Export error:', err);
    throw new Error(err.message || 'Error occurred while exporting the file.');
  }
};
