import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Theme } from '../components/Theme';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { checkApiHealth, getApiBaseUrl, getSuggestedApiBaseUrl, setApiBaseUrl } from '../services/apiClient';

interface SettingsScreenProps {
  onBack: () => void;
}

const PRESETS = [
  {
    label: 'Android Emulator',
    url: 'http://10.0.2.2:8000',
    desc: 'Default for Android AVD',
  },
  {
    label: 'iOS Simulator',
    url: 'http://localhost:8000',
    desc: 'Default for iOS Simulator',
  },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const suggestedUrl = getSuggestedApiBaseUrl();

  const handleSave = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Invalid URL', 'Please enter a valid API base URL.');
      return;
    }
    setApiBaseUrl(trimmed);
    setUrl(getApiBaseUrl()); // Normalize it (adds http:// if missing)
    setSaved(true);
    setTestMessage(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    setApiBaseUrl(presetUrl);
    setSaved(true);
    setTestMessage(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUseSuggested = () => {
    setUrl(suggestedUrl);
    setApiBaseUrl(suggestedUrl);
    setSaved(true);
    setTestMessage(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestMessage(null);
    try {
      setApiBaseUrl(url);
      const result = await checkApiHealth();
      setUrl(result.baseUrl);
      setTestMessage(`Connected to ${result.baseUrl} in ${result.elapsedMs} ms.`);
    } catch (err: any) {
      setTestMessage(err.message || 'Unable to reach backend.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Card */}
      <Card style={styles.heroCard}>
        <Text style={styles.heroIcon}>⚙️</Text>
        <Text style={styles.heroTitle}>API Connection Settings</Text>
        <Text style={styles.heroDesc}>
          Configure the backend server URL. On a physical device, this must be
          your computer's local IP address (e.g., http://192.168.1.x:8000).
        </Text>
      </Card>

      {/* Current URL Input */}
      <Card style={styles.inputCard}>
        <Text style={styles.inputLabel}>Backend API Base URL</Text>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={(v) => { setUrl(v); setSaved(false); setTestMessage(null); }}
          placeholder="http://192.168.1.X:8000"
          placeholderTextColor={Theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <CustomButton
          title={saved ? '✓ Saved!' : 'Save URL'}
          variant={saved ? 'secondary' : 'primary'}
          onPress={handleSave}
          style={styles.saveBtn}
        />
        <CustomButton
          title="Test Connection"
          variant="secondary"
          onPress={handleTestConnection}
          loading={testing}
          style={styles.testBtn}
        />
        {testMessage ? (
          <Text style={[styles.statusText, testMessage.startsWith('Connected') ? styles.statusOk : styles.statusError]}>
            {testMessage}
          </Text>
        ) : null}
      </Card>

      {suggestedUrl !== 'http://10.0.2.2:8000' && suggestedUrl !== 'http://localhost:8000' ? (
        <TouchableOpacity
          style={styles.suggestedRow}
          onPress={handleUseSuggested}
          activeOpacity={0.7}
        >
          <View style={styles.presetTextWrap}>
            <Text style={styles.presetLabel}>Suggested From Expo</Text>
            <Text style={styles.presetUrl}>{suggestedUrl}</Text>
            <Text style={styles.presetDesc}>Uses the same computer running Expo and usually works on a physical device.</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Quick Presets */}
      <Text style={styles.sectionTitle}>Quick Presets</Text>
      {PRESETS.map((preset) => (
        <TouchableOpacity
          key={preset.url}
          style={[styles.presetRow, url === preset.url && styles.presetRowActive]}
          onPress={() => applyPreset(preset.url)}
          activeOpacity={0.7}
        >
          <View style={styles.presetTextWrap}>
            <Text style={styles.presetLabel}>{preset.label}</Text>
            <Text style={styles.presetUrl}>{preset.url}</Text>
            <Text style={styles.presetDesc}>{preset.desc}</Text>
          </View>
          {url === preset.url && (
            <View style={styles.activeCheck}>
              <Text style={styles.activeCheckText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Tips */}
      <Card style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>📋 Setup Tips</Text>
        <Text style={styles.tipItem}>
          1. Start the backend from the <Text style={styles.code}>backend</Text> folder: <Text style={styles.code}>uvicorn main:app --host 0.0.0.0 --port 8000</Text>
        </Text>
        <Text style={styles.tipItem}>
          2. Find your LAN IP:{' '}
          <Text style={styles.code}>{Platform.OS === 'android' ? 'ipconfig (Windows)' : 'ifconfig | grep inet'}</Text>
        </Text>
        <Text style={styles.tipItem}>
          3. Set URL to <Text style={styles.code}>http://YOUR_LAN_IP:8000</Text> above.
        </Text>
        <Text style={styles.tipItem}>
          4. Make sure your phone and computer are on the <Text style={styles.code}>same Wi-Fi network</Text>.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgPage,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 20,
  },
  heroIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  inputCard: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1.5,
    borderColor: Theme.colors.borderStrong,
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.bgSurfaceSoft,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  saveBtn: {
    width: '100%',
  },
  testBtn: {
    width: '100%',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statusText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  statusOk: {
    color: '#166534',
  },
  statusError: {
    color: Theme.colors.danger,
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eefbf3',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: Theme.radius.md,
    padding: 14,
    marginBottom: 16,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  presetRowActive: {
    borderColor: Theme.colors.brand,
    backgroundColor: '#eef4ff',
  },
  presetTextWrap: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  presetUrl: {
    fontSize: 12,
    color: Theme.colors.brand,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  activeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  activeCheckText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  tipsCard: {
    marginTop: 10,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 19,
    marginBottom: 8,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#fef3c7',
    fontSize: 11,
  },
});
