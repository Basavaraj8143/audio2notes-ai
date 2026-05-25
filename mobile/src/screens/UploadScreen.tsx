import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Theme } from '../components/Theme';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { uploadAudioFile } from '../services/notesService';
import { Session } from '../types';

interface UploadScreenProps {
  onSessionReady: (session: Session) => void;
  onNavigateToHistory: () => void;
}

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'chunk', label: 'Chunking' },
  { id: 'transcribe', label: 'ASR Transcription' },
  { id: 'clean', label: 'Review Ready' },
];

export const UploadScreen: React.FC<UploadScreenProps> = ({ onSessionReady, onNavigateToHistory }) => {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [doneSteps, setDoneSteps] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const stepIntervalRef = useRef<any>(null);

  const handlePickFile = async () => {
    if (status === 'processing') return;

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/mpeg', 
          'audio/wav', 
          'audio/x-wav', 
          'audio/mp4', 
          'audio/x-m4a', 
          'audio/ogg', 
          'audio/flac', 
          'audio/*'
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const picked = res.assets[0];
        const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
        const name = picked.name || 'audio.mp3';
        const ext = name.slice(name.lastIndexOf('.')).toLowerCase();

        if (!allowedExtensions.includes(ext) && picked.mimeType && !picked.mimeType.startsWith('audio/')) {
          Alert.alert('Unsupported File', 'Please upload a standard audio file (.mp3, .wav, .m4a, .ogg, or .flac).');
          return;
        }

        if (picked.size && picked.size > 100 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Maximum file size is 100 MB.');
          return;
        }

        setErrorMsg('');
        setFile(picked);
      }
    } catch (err) {
      console.error('File picker error:', err);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setStatus('processing');
    setDoneSteps([]);
    setErrorMsg('');
    setActiveStep('upload');

    // Simulate progress pipeline transitions like the web application
    let index = 0;
    stepIntervalRef.current = setInterval(() => {
      setDoneSteps((prev) => {
        const currentSteps = [...prev];
        if (index < PIPELINE_STEPS.length - 1) {
          const finishedStep = PIPELINE_STEPS[index].id;
          index += 1;
          setActiveStep(PIPELINE_STEPS[index].id);
          return [...currentSteps, finishedStep];
        }
        return prev;
      });
    }, 3000);

    try {
      const sessionResult = await uploadAudioFile(file.uri, file.name);
      
      clearInterval(stepIntervalRef.current);
      setDoneSteps(PIPELINE_STEPS.map(s => s.id));
      setActiveStep(null);
      
      // Delay slightly for visual feedback before loading review screen
      setTimeout(() => {
        onSessionReady(sessionResult);
      }, 500);
    } catch (err: any) {
      clearInterval(stepIntervalRef.current);
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Audio processing failed. Please check backend connection.');
      setStatus('error');
      setActiveStep(null);
      setDoneSteps([]);
    }
  };

  const handleClear = () => {
    setFile(null);
    setStatus('idle');
    setDoneSteps([]);
    setActiveStep(null);
    setErrorMsg('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroSection}>
        <Text style={styles.eyebrow}>Audio2Notes Mobile</Text>
        <Text style={styles.headline}>Transform Lecture Audio into Study Notes</Text>
        <Text style={styles.subtext}>
          Upload or pick a lecture, inspect the transcript segments, and generate high-quality notes on the go.
        </Text>
      </View>

      <Card style={styles.uploadCard}>
        <Text style={styles.cardTitle}>Audio Upload Studio</Text>
        
        {file ? (
          <View style={styles.fileDetail}>
            <Text style={styles.fileIcon}>🎵</Text>
            <View style={styles.fileTextWrap}>
              <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
              <Text style={styles.fileSize}>
                {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.dropzone} 
            onPress={handlePickFile}
            accessibilityRole="button"
            accessibilityLabel="Pick audio file"
          >
            <Text style={styles.dropzoneIcon}>📤</Text>
            <Text style={styles.dropzoneTitle}>Select Lecture Audio</Text>
            <Text style={styles.dropzoneSubtext}>Pick from device files (.mp3, .wav, .m4a, .flac)</Text>
            <View style={styles.formatsRow}>
              {['.mp3', '.wav', '.m4a', '.flac'].map(f => (
                <View key={f} style={styles.formatBadge}>
                  <Text style={styles.formatText}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : null}

        {file && status !== 'processing' ? (
          <View style={styles.actionRow}>
            <CustomButton 
              title="Clear" 
              variant="secondary" 
              onPress={handleClear} 
              style={styles.actionBtn}
            />
            <CustomButton 
              title="Transcribe" 
              variant="primary" 
              onPress={handleTranscribe} 
              style={styles.actionBtn}
            />
          </View>
        ) : null}

        {status === 'processing' ? (
          <View style={styles.pipeline}>
            <Text style={styles.pipelineTitle}>Processing Pipeline</Text>
            {PIPELINE_STEPS.map((step, idx) => {
              const isDone = doneSteps.includes(step.id);
              const isActive = activeStep === step.id;
              
              return (
                <View key={step.id} style={styles.pipelineStep}>
                  <View style={[
                    styles.stepIndicator,
                    isDone && styles.stepDone,
                    isActive && styles.stepActive
                  ]}>
                    <Text style={[
                      styles.stepIndicatorText,
                      (isDone || isActive) && styles.stepTextActive
                    ]}>
                      {isDone ? '✓' : idx + 1}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    isDone && styles.labelDone,
                    isActive && styles.labelActive
                  ]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </Card>

      <CustomButton 
        title="View Past Sessions (History)" 
        variant="link" 
        onPress={onNavigateToHistory}
        style={styles.historyBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgPage,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 20,
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.brandDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    backgroundColor: '#eef4ff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
    marginBottom: 8,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  uploadCard: {
    marginTop: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 16,
  },
  dropzone: {
    borderWidth: 2,
    borderColor: '#c3d6f1',
    borderStyle: 'dashed',
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.bgSurfaceSoft,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  dropzoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  dropzoneSubtext: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  formatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  formatBadge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  fileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgSubtle,
    borderRadius: Theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.borderStrong,
  },
  fileIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  fileTextWrap: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  fileSize: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  pipeline: {
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
    paddingTop: 16,
  },
  pipelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 12,
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.borderStrong,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  stepDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  stepActive: {
    backgroundColor: Theme.colors.brand,
    borderColor: Theme.colors.brand,
  },
  stepTextActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  labelDone: {
    color: '#166534',
  },
  labelActive: {
    color: Theme.colors.brandDark,
  },
  historyBtn: {
    alignSelf: 'center',
    marginVertical: 10,
  },
});
