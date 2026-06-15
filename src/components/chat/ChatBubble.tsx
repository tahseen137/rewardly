/**
 * ChatBubble - Message bubble component for chat UI
 *
 * Renders user and assistant messages with appropriate styling.
 * Supports markdown-like formatting for assistant messages.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
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
 * Parse markdown table into structured data
 */
function parseTable(
  lines: string[],
  startIndex: number
): { table: string[][]; endIndex: number } | null {
  const rows: string[][] = [];
  let i = startIndex;

  // Must have at least header row + separator + data row
  if (i + 2 >= lines.length) return null;

  // Check if this looks like a table (has | characters)
  if (!lines[i].includes('|')) return null;

  // Parse header row
  const headerCells = lines[i]
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c);
  if (headerCells.length < 2) return null;
  rows.push(headerCells);
  i++;

  // Skip separator row (|---|---|)
  if (!lines[i]?.match(/^\|?[\s\-:|]+\|?$/)) return null;
  i++;

  // Parse data rows
  while (i < lines.length && lines[i].includes('|')) {
    const cells = lines[i]
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c);
    if (cells.length > 0) {
      rows.push(cells);
    }
    i++;
  }

  return { table: rows, endIndex: i - 1 };
}

/**
 * Render a table as React Native views
 */
function renderTable(table: string[][], key: string): React.ReactNode {
  const headers = table[0];
  const dataRows = table.slice(1);

  return (
    <View key={key} style={styles.tableContainer}>
      {/* Header row */}
      <View style={styles.tableHeaderRow}>
        {headers.map((header, colIndex) => (
          <View
            key={`h-${colIndex}`}
            style={[
              styles.tableCell,
              styles.tableHeaderCell,
              colIndex === 0 && styles.tableCellFirst,
            ]}
          >
            <Text style={styles.tableHeaderText}>{header}</Text>
          </View>
        ))}
      </View>

      {/* Data rows */}
      {dataRows.map((row, rowIndex) => (
        <View
          key={`r-${rowIndex}`}
          style={[styles.tableRow, rowIndex % 2 === 1 && styles.tableRowAlt]}
        >
          {row.map((cell, colIndex) => (
            <View
              key={`c-${colIndex}`}
              style={[styles.tableCell, colIndex === 0 && styles.tableCellFirst]}
            >
              <Text style={styles.tableCellText}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Render inline formatting (bold **text**) within a string.
 * Returns an array of React nodes (strings and <Text> components).
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Text key={`${keyPrefix}-bold-${match.index}`} style={styles.bold}>
        {match[1]}
      </Text>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Parse simple markdown-like formatting in messages
 */
function parseMessage(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Add line break if not first element
    if (parts.length > 0 && i > 0) {
      parts.push(<Text key={`br-${i}`}>{'\n'}</Text>);
    }

    // Try to parse table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableResult = parseTable(lines, i);
      if (tableResult && tableResult.table.length >= 2) {
        parts.push(renderTable(tableResult.table, `table-${i}`));
        i = tableResult.endIndex + 1;
        continue;
      }
    }

    // Handle horizontal rules (---  ***  ___)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      parts.push(<View key={`hr-${i}`} style={styles.divider} />);
      i++;
      continue;
    }

    // Handle h1 headings (#)
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      parts.push(
        <Text key={`h1-${i}`} style={styles.h1}>
          {renderInline(line.slice(2), `h1-${i}`)}
        </Text>
      );
      i++;
      continue;
    }

    // Handle h2 headings (##)
    if (line.startsWith('## ')) {
      parts.push(
        <Text key={`h2-${i}`} style={styles.header}>
          {renderInline(line.slice(3), `h2-${i}`)}
        </Text>
      );
      i++;
      continue;
    }

    // Handle bullet points
    if (line.startsWith('• ') || line.startsWith('- ')) {
      parts.push(
        <Text key={`bullet-${i}`} style={styles.bulletPoint}>
          {'  • '}
          {renderInline(line.slice(2), `bullet-${i}`)}
        </Text>
      );
      i++;
      continue;
    }

    // Handle numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      parts.push(
        <Text key={`num-${i}`} style={styles.bulletPoint}>
          {'  '}
          {renderInline(line, `num-${i}`)}
        </Text>
      );
      i++;
      continue;
    }

    // Handle inline bold (**text**) in regular lines
    const inlineParts = renderInline(line, `line-${i}`);
    if (inlineParts.length > 1 || (inlineParts.length === 1 && inlineParts[0] !== line)) {
      parts.push(<Text key={`line-${i}`}>{inlineParts}</Text>);
    } else {
      parts.push(line);
    }

    i++;
  }

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
  const _theme = useTheme();
  const isUser = role === 'user';

  const bubbleStyle: ViewStyle = useMemo(
    () => ({
      ...styles.bubble,
      backgroundColor: isUser ? colors.primary.main : colors.background.secondary,
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      borderBottomRightRadius: isUser ? 4 : 16,
      borderBottomLeftRadius: isUser ? 16 : 4,
      borderWidth: isUser ? 0 : 1,
      borderColor: colors.border.light,
      maxWidth: '85%',
    }),
    [isUser]
  );

  const textStyle: TextStyle = useMemo(
    () => ({
      ...styles.messageText,
      color: isUser ? colors.text.inverse : colors.text.primary,
    }),
    [isUser]
  );

  const parsedMessage = useMemo(() => {
    if (isUser) return message;
    return parseMessage(message);
  }, [message, isUser]);

  const formattedTime = useMemo(() => {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [timestamp]);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}
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
          <Text style={[styles.timestamp, isUser ? styles.timestampRight : styles.timestampLeft]}>
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
  h1: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
    color: colors.text.primary,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 8,
    width: '100%',
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

  // Table styles for card comparisons
  tableContainer: {
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main + '15',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tableRowAlt: {
    backgroundColor: colors.background.tertiary + '30',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  tableCellFirst: {
    flex: 1.5,
  },
  tableHeaderCell: {
    paddingVertical: 10,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tableCellText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default ChatBubble;
