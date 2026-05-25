import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Theme } from './Theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return [styles.btn, styles.btnPrimary, style];
      case 'secondary':
        return [styles.btn, styles.btnSecondary, style];
      case 'danger':
        return [styles.btn, styles.btnDanger, style];
      case 'link':
        return [styles.btnLink, style];
      default:
        return [styles.btn, styles.btnPrimary, style];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.text, styles.textPrimary, textStyle];
      case 'secondary':
        return [styles.text, styles.textSecondary, textStyle];
      case 'danger':
        return [styles.text, styles.textPrimary, textStyle];
      case 'link':
        return [styles.textLink, textStyle];
      default:
        return [styles.text, styles.textPrimary, textStyle];
    }
  };

  const buttonStyle = getButtonStyles();
  const textStyles = getTextStyle();

  return (
    <TouchableOpacity
      style={[buttonStyle as any, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'link' ? Theme.colors.brand : '#ffffff'} size="small" />
      ) : (
        <>
          {icon && icon}
          <Text style={textStyles as any}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Theme.radius.md,
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: Theme.colors.brand,
    borderWidth: 1,
    borderColor: Theme.colors.brand,
    ...Theme.shadow.sm,
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Theme.colors.borderStrong,
  },
  btnDanger: {
    backgroundColor: Theme.colors.danger,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
  },
  btnLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  textPrimary: {
    color: '#ffffff',
  },
  textSecondary: {
    color: Theme.colors.brandDark,
  },
  textLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.brand,
  },
  disabled: {
    opacity: 0.5,
  },
});
