/**
 * ChatBubble - Message bubble component for chat UI
 * 
 * Renders user and assistant messages with appropriate styling.
 * Supports markdown-like formatting for assistant messages.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { colors } from '../../theme/colors';

export interface ChatBubbleProps {
  message: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
  isLoading?: boolean;
  showTimestamp?: boolean;
}

/**
 * Parse simple markdown-like formatting in messages
 */
function parseMessage(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<Text key={`br-${lineIndex}`}>{'\n'}</Text>);
    }
    
    // Handle headers (##)
    if (line.startsWith('## ')) {
      parts.push(
        <Text key={`h2-${lineIndex}`} style={styles.header}>
          {line.slice(3)}
        </Text>
      );
      return;
    }
    
    // Handle bullet points
    if (line.startsWith('• ') || line.startsWith('- ')) {
      parts.push(
        <Text key={`bullet-${lineIndex}`} style={styles.bulletPoint}>
          {'  • '}{line.slice(2)}
        </Text>
      );
      return;
    }
    
    // Handle numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      parts.push(
        <Text key={`num-${lineIndex}`} style={styles.bulletPoint}>
          {'  '}{line}
        </Text>
      );
      return;
    }
    
    // Handle bold (**text**)
    let processed = line;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    const lineParts: React.ReactNode[] = [];
    
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        lineParts.push(line.slice(lastIndex, match.index));
      }
      lineParts.push(
        <Text key={`bold-${lineIndex}-${match.index}`} style={styles.bold}>
          {match[1]}
        </Text>
      );
      lastIndex = match.index + match[0].length;
    }
    
    if (lineParts.length > 0) {
      if (lastIndex < line.length) {
        lineParts.push(line.slice(lastIndex));
      }
      parts.push(
        <Text key={`line-${lineIndex}`}>{lineParts}</Text>
      );
    } else {
      parts.push(processed);
    }
  });
  
  return parts;
}

/**
 * Typing indicator dots animation
 */
function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.primary.main }]}
        entering={FadeInUp.delay(0).duration(300)}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.primary.main, opacity: 0.7 }]}
        entering={FadeInUp.delay(150).duration(300)}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.primary.main, opacity: 0.5 }]}
        entering={FadeInUp.delay(300).duration(300)}
      />
    </View>
  );
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  role,
  timestamp,
  isLoading = false,
  showTimestamp = false,
}) => {
  const theme = useTheme();
  const isUser = role === 'user';
  
  const bubbleStyle: ViewStyle = useMemo(() => ({
    ...styles.bubble,
    backgroundColor: isUser 
      ? colors.primary.main 
      : colors.background.secondary,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    borderBottomRightRadius: isUser ? 4 : 16,
    borderBottomLeftRadius: isUser ? 16 : 4,
    borderWidth: isUser ? 0 : 1,
    borderColor: colors.border.light,
    maxWidth: '85%',
  }), [isUser]);
  
  const textStyle: TextStyle = useMemo(() => ({
    ...styles.messageText,
    color: isUser ? colors.text.inverse : colors.text.primary,
  }), [isUser]);
  
  const parsedMessage = useMemo(() => {
    if (isUser) return message;
    return parseMessage(message);
  }, [message, isUser]);
  
  const formattedTime = useMemo(() => {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [timestamp]);
  
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer
      ]}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🧙</Text>
          </View>
        </View>
      )}
      
      <View style={styles.bubbleWrapper}>
        <View style={bubbleStyle}>
          {isLoading ? (
            <TypingIndicator />
          ) : (
            <Text style={textStyle} selectable>
              {parsedMessage}
            </Text>
          )}
        </View>
        
        {showTimestamp && timestamp && (
          <Text style={[
            styles.timestamp,
            isUser ? styles.timestampRight : styles.timestampLeft
          ]}>
            {formattedTime}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  avatarText: {
    fontSize: 14,
  },
  bubbleWrapper: {
    flexDirection: 'column',
    maxWidth: '85%',
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
    color: colors.text.primary,
  },
  bold: {
    fontWeight: '600',
  },
  bulletPoint: {
    marginVertical: 1,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  timestampRight: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  timestampLeft: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
});

export default ChatBubble;
