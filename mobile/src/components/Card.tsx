import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from './Theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.bgSurface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.lg,
    padding: 16,
    ...Theme.shadow.sm,
  },
});
