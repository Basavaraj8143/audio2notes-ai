import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Theme } from './Theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, onSettings }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftRow}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.iconButton} accessibilityLabel="Go back">
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.logoMark}>
              <View style={styles.logoCircle} />
              <View style={styles.logoBar1} />
              <View style={styles.logoBar2} />
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title || 'Audio2Notes'}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        {onSettings ? (
          <TouchableOpacity
            onPress={onSettings}
            style={styles.settingsButton}
            accessibilityLabel="Settings"
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.settingsButtonPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  logoMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.colors.brand,
  },
  logoBar1: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Theme.colors.brandDark,
  },
  logoBar2: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: Theme.colors.brandLight,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  settingsIcon: {
    fontSize: 20,
    color: Theme.colors.textSecondary,
  },
});
