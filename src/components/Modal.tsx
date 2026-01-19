/**
 * Modal - Reusable modal/bottom sheet wrapper component
 */

import React, { ReactNode } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  closeButtonText?: string;
  fullScreen?: boolean;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeButtonText = 'Done',
  fullScreen = false,
  scrollable = true,
  contentStyle,
}: ModalProps) {
  const theme = useTheme();

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }
    return <View style={[styles.content, contentStyle]}>{children}</View>;
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle={fullScreen ? 'fullScreen' : 'pageSheet'}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {(title || showCloseButton) && (
            <View
              style={[
                styles.header,
                {
                  backgroundColor: theme.colors.background.secondary,
                  borderBottomColor: theme.colors.border.light,
                },
              ]}
            >
              <View style={styles.headerLeft}>
                {title && (
                  <Text
                    style={[styles.title, { color: theme.colors.text.primary }]}
                    accessibilityRole="header"
                  >
                    {title}
                  </Text>
                )}
              </View>
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <Text style={[styles.closeText, { color: theme.colors.primary.main }]}>
                    {closeButtonText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {renderContent()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RNModal>
  );
}

/**
 * ModalHeader - Custom header for complex modal layouts
 */
interface ModalHeaderProps {
  title?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  style?: ViewStyle;
}

export function ModalHeader({ title, leftAction, rightAction, style }: ModalHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background.secondary,
          borderBottomColor: theme.colors.border.light,
        },
        style,
      ]}
    >
      <View style={styles.headerLeft}>{leftAction}</View>
      {title && (
        <Text
          style={[styles.headerTitle, { color: theme.colors.text.primary }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
      )}
      <View style={styles.headerRight}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeText: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});

export default Modal;
