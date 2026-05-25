export interface TranscriptChunk {
  raw_text: string;
  cleaned_text: string;
  segments: any[];
  avg_confidence: number;
  chunk_start_sec: number;
  chunk_end_sec: number | null;
}

export interface NoteChunk {
  topic: string;
  key_points: string[];
  definitions: Record<string, string>;
  important_explanations?: string[];
  examples?: string[];
  summary: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  raw?: string;
}

export interface Session {
  session_id: string;
  filename: string;
  status: 'transcribed' | 'completed';
  transcript_chunks?: TranscriptChunk[];
  notes_chunks?: NoteChunk[] | null;
  merged_notes?: string | null;
  chunk_count?: number;
}

export interface QARequest {
  session_id: string;
  question: string;
}

export interface QAResponse {
  question: string;
  answer: string;
  source_chunks: string[];
}

export interface HistoryItem {
  session_id: string;
  filename: string;
  status: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}
