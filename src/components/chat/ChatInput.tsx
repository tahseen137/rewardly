/**
 * ChatInput - Message input component for chat UI
 * 
 * Features a text input with send button and optional voice input.
 * Handles multi-line input and keyboard management.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Send, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { colors } from '../../theme/colors';

export interface ChatInputProps {
  onSend: (message: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onFocus,
  onBlur,
  placeholder = 'Ask Sage anything...',
  disabled = false,
  isLoading = false,
  maxLength = 2000,
}) => {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  
  const sendScale = useSharedValue(1);
  
  const canSend = message.trim().length > 0 && !disabled && !isLoading;
  
  const handleSend = useCallback(() => {
    if (!canSend) return;
    
    const trimmedMessage = message.trim();
    setMessage('');
    setInputHeight(44);
    
    // Animate send button
    sendScale.value = withSpring(0.8, { damping: 15 }, () => {
      sendScale.value = withSpring(1, { damping: 15 });
    });
    
    onSend(trimmedMessage);
    
    // Keep keyboard open for quick follow-up
    // Keyboard.dismiss();
  }, [canSend, message, onSend, sendScale]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);
  
  const handleContentSizeChange = useCallback((event: any) => {
    const height = event.nativeEvent.contentSize.height;
    // Clamp between min and max height
    const newHeight = Math.min(Math.max(44, height), 120);
    setInputHeight(newHeight);
  }, []);
  
  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));
  
  const containerStyle: ViewStyle = {
    ...styles.container,
    borderColor: isFocused ? colors.primary.main : colors.border.light,
    backgroundColor: colors.background.secondary,
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.wrapper}>
        <View style={containerStyle}>
          {/* Sparkle icon */}
          <View style={styles.iconContainer}>
            <Sparkles
              size={18}
              color={isFocused ? colors.primary.main : colors.text.tertiary}
            />
          </View>
          
          {/* Text input */}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { height: Math.max(inputHeight, 44), color: colors.text.primary }
            ]}
            value={message}
            onChangeText={setMessage}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onContentSizeChange={handleContentSizeChange}
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={maxLength}
            editable={!disabled}
            returnKeyType="default"
            blurOnSubmit={false}
            textAlignVertical="center"
            accessibilityLabel="Message input"
            accessibilityHint="Type your message to Sage"
          />
          
          {/* Send button */}
          <AnimatedTouchable
            style={[
              styles.sendButton,
              sendButtonStyle,
              {
                backgroundColor: canSend ? colors.primary.main : colors.background.tertiary,
                opacity: canSend ? 1 : 0.5,
              }
            ]}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSend }}
          >
            <Send
              size={18}
              color={canSend ? colors.text.inverse : colors.text.tertiary}
            />
          </AnimatedTouchable>
        </View>
        
        {/* Character count when near limit */}
        {message.length > maxLength * 0.8 && (
          <Animated.Text style={styles.charCount}>
            {message.length}/{maxLength}
          </Animated.Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 52,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    maxHeight: 120,
    minHeight: 44,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  charCount: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 8,
  },
});

export default ChatInput;
