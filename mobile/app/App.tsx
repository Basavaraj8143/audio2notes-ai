import React, { useState } from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Theme } from '../src/components/Theme';
import { Header } from '../src/components/Header';
import { UploadScreen } from '../src/screens/UploadScreen';
import { TranscriptReviewScreen } from '../src/screens/TranscriptReviewScreen';
import { NotesScreen } from '../src/screens/NotesScreen';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { Session } from '../src/types';

type ScreenName = 'Upload' | 'TranscriptReview' | 'Notes' | 'History' | 'Settings';

export default function MainApp() {
  const [screen, setScreen] = useState<ScreenName>('Upload');
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [navHistory, setNavHistory] = useState<ScreenName[]>([]);

  const navigateTo = (targetScreen: ScreenName, sessionPayload: Session | null = null) => {
    setNavHistory((prev) => [...prev, screen]);
    setScreen(targetScreen);
    if (sessionPayload) {
      setActiveSession(sessionPayload);
    }
  };

  const goBack = () => {
    if (navHistory.length > 0) {
      const prevScreen = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setScreen(prevScreen);

      // If returning to Upload screen, clean up active session if it was temporary
      if (prevScreen === 'Upload' && screen === 'TranscriptReview') {
        setActiveSession(null);
      }
    } else {
      // If we are at the root screen, prompt exit
      Alert.alert('Exit App', 'Do you want to exit the application?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
      ]);
    }
  };

  // React to hardware back button on Android
  React.useEffect(() => {
    const handleBackButton = () => {
      goBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => {
      subscription.remove();
    };
  }, [navHistory, screen]);

  // Determine back navigation callback for Header
  const getHeaderOnBack = () => {
    if (screen === 'Upload') return undefined;
    return goBack;
  };

  // Determine Header title and subtitle
  const getHeaderDetails = () => {
    switch (screen) {
      case 'Upload':
        return { title: 'Audio2Notes', subtitle: 'AI Lecture Notes' };
      case 'TranscriptReview':
        return {
          title: 'Review Transcript',
          subtitle: activeSession?.filename || 'Lecture Audio'
        };
      case 'Notes':
        return {
          title: 'Lecture Notes',
          subtitle: activeSession?.filename || 'Lecture Audio'
        };
      case 'History':
        return { title: 'Session History', subtitle: 'View past notes' };
      case 'Settings':
        return { title: 'Settings', subtitle: 'API & Network' };
      default:
        return { title: 'Audio2Notes', subtitle: undefined };
    }
  };

  const headerDetails = getHeaderDetails();

  const handleSessionReadyFromUpload = (session: Session) => {
    if (session.status === 'completed') {
      navigateTo('Notes', session);
    } else {
      navigateTo('TranscriptReview', session);
    }
  };

  const handleApprovedFromReview = (completedSession: Session) => {
    navigateTo('Notes', completedSession);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title={headerDetails.title}
        subtitle={headerDetails.subtitle}
        onBack={getHeaderOnBack()}
        onSettings={screen === 'Upload' ? () => navigateTo('Settings') : undefined}
      />

      <View style={styles.body}>
        {screen === 'Upload' && (
          <UploadScreen
            onSessionReady={handleSessionReadyFromUpload}
            onNavigateToHistory={() => navigateTo('History')}
          />
        )}

        {screen === 'TranscriptReview' && activeSession && (
          <TranscriptReviewScreen
            session={activeSession}
            onApprove={handleApprovedFromReview}
            onBack={goBack}
          />
        )}

        {screen === 'Notes' && activeSession && (
          <NotesScreen
            session={activeSession}
            onBack={goBack}
          />
        )}

        {screen === 'History' && (
          <HistoryScreen
            onSelectSession={(session) => navigateTo('Notes', session)}
            onBack={goBack}
          />
        )}

        {screen === 'Settings' && (
          <SettingsScreen onBack={goBack} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgPage,
  },
  body: {
    flex: 1,
  },
});
