/**
 * SectionHeader - Consistent section header component
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  rightAction?: ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  rightAction,
  style,
  titleStyle,
}: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text.tertiary,
              },
              titleStyle,
            ]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </View>
  );
}

/**
 * SectionDivider - Horizontal divider between sections
 */
interface SectionDividerProps {
  style?: ViewStyle;
}

export function SectionDivider({ style }: SectionDividerProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: theme.colors.border.light,
        },
        style,
      ]}
    />
  );
}

/**
 * ListSectionHeader - Section header styled for grouped lists
 */
interface ListSectionHeaderProps {
  title: string;
  style?: ViewStyle;
}

export function ListSectionHeader({ title, style }: ListSectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.listSectionHeader,
        {
          paddingHorizontal: theme.spacing.screenPadding,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.listSectionTitle,
          {
            color: theme.colors.text.tertiary,
          },
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rightAction: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  listSectionHeader: {},
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default SectionHeader;
