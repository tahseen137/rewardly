/**
 * SageScreen - AI Assistant Chat Interface
 * 
 * Main screen for interacting with Sage, the AI rewards advisor.
 * Features chat messages, quick actions, and card recommendation cards.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ListRenderItem,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MessageCircle, Plus, History, Sparkles } from 'lucide-react-native';

import { useTheme } from '../theme';
import { colors } from '../theme/colors';
import { 
  ChatBubble, 
  ChatInput, 
  QuickActions, 
  CardRecommendationCard 
} from '../components/chat';
import { GlassCard } from '../components';
import { 
  SageService, 
  SageMessage, 
  Conversation,
  CardRecommendation,
  SageError,
  QUICK_ACTIONS,
} from '../services/SageService';
import { getCards } from '../services/CardPortfolioManager';
import { getPreferences } from '../services/PreferenceManager';
import { getCardByIdSync } from '../services/CardDataService';
import { UserPreferences, Card } from '../types';

// ============================================================================
// Types
// ============================================================================

interface DisplayMessage extends SageMessage {
  cardRecommendation?: CardRecommendation;
}

// ============================================================================
// Welcome Screen Component
// ============================================================================

interface WelcomeScreenProps {
  onQuickAction: (message: string) => void;
  onViewHistory: () => void;
  hasHistory: boolean;
}

interface CategoryChip {
  id: string;
  label: string;
  icon: string;
  message: string;
}

const categoryChips: CategoryChip[] = [
  { id: 'groceries', label: 'Groceries', icon: '🛒', message: "What's my best card for groceries?" },
  { id: 'dining', label: 'Dining', icon: '🍽️', message: "What's my best card for dining?" },
  { id: 'gas', label: 'Gas', icon: '⛽', message: "What's my best card for gas?" },
  { id: 'travel', label: 'Travel', icon: '✈️', message: "What's my best card for travel?" },
  { id: 'online', label: 'Online', icon: '🛍️', message: "What's my best card for online shopping?" },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', message: "What's my best card for entertainment?" },
  { id: 'pharmacy', label: 'Pharmacy', icon: '💊', message: "What's my best card for pharmacy?" },
  { id: 'home', label: 'Home', icon: '🏠', message: "What's my best card for home improvement?" },
  { id: 'other', label: 'Other', icon: '📦', message: "What's my best card for other purchases?" },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onQuickAction,
  onViewHistory,
  hasHistory,
}) => {
  return (
    <Animated.View 
      entering={FadeIn.duration(500)}
      style={styles.welcomeContainer}
    >
      {/* Avatar and greeting */}
      <View style={styles.welcomeHeader}>
        <View style={styles.sageAvatar}>
          <Text style={styles.sageAvatarText}>🧙</Text>
        </View>
        <Text style={styles.welcomeTitle}>Hey! I'm Sage</Text>
        <Text style={styles.welcomeSubtitle}>
          Your AI credit card rewards advisor. Ask me anything about maximizing 
          your rewards, comparing cards, or planning trips with points.
        </Text>
      </View>
      
      {/* Category quick actions */}
      <View style={styles.welcomeActions}>
        <Text style={styles.sectionTitle}>Find Your Best Card</Text>
        <View style={styles.categoryGrid}>
          {categoryChips.map((chip) => (
            <TouchableOpacity
              key={chip.id}
              style={styles.categoryChip}
              onPress={() => onQuickAction(chip.message)}
              accessibilityLabel={`Ask about ${chip.label}`}
            >
              <Text style={styles.categoryChipIcon}>{chip.icon}</Text>
              <Text style={styles.categoryChipLabel}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Quick actions */}
      <View style={styles.welcomeActions}>
        <Text style={styles.sectionTitle}>Quick Questions</Text>
        <QuickActions
          actions={QUICK_ACTIONS.slice(0, 4).map(a => ({
            ...a,
            icon: undefined // Let QuickActions use default icons
          }))}
          onActionPress={onQuickAction}
          variant="grid"
        />
      </View>
      
      {/* History button */}
      {hasHistory && (
        <TouchableOpacity
          style={styles.historyButton}
          onPress={onViewHistory}
          accessibilityLabel="View conversation history"
        >
          <History size={16} color={colors.text.secondary} />
          <Text style={styles.historyButtonText}>View Previous Conversations</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// ============================================================================
// Main Screen Component
// ============================================================================

export const SageScreen: React.FC = () => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  
  // State
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SageError | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [portfolio, setPortfolio] = useState<ReturnType<typeof getCards>>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const userCards = getCards();
      const userPrefs = await getPreferences();
      setPortfolio(userCards);
      setPreferences(userPrefs);
    };
    loadUserData();
  }, []);
  
  // Load conversation history
  useEffect(() => {
    const loadHistory = async () => {
      const convs = await SageService.getConversations(10);
      setConversations(convs);
    };
    loadHistory();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Send message handler
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading || !preferences) return;
    
    setError(null);
    setIsLoading(true);
    
    // Add user message optimistically
    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date(),
    };
    
    // Prepare assistant message placeholder
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMessage: DisplayMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    
    try {
      // Use streaming method
      const result = await SageService.streamMessage(
        messageText,
        conversationId,
        portfolio,
        preferences,
        (token) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMsgId 
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        }
      );
      
      // Update conversation ID if needed
      if (!conversationId) {
        setConversationId(result.conversationId);
      }
      
      // Update final message with metadata (recommendations, etc.)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: result.reply, // Ensure content is exact
                cardRecommendation: result.cardRecommendation,
                metadata: {
                  toolsUsed: result.toolsUsed,
                  cardRecommendation: result.cardRecommendation,
                }
              }
            : msg
        )
      );
      
    } catch (err) {
      const sageError = err as SageError;
      setError(sageError);
      
      // Update the assistant message to show error or remove it?
      // Usually better to show what was received so far, plus error
      setMessages(prev => [
        ...prev, 
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `I'm sorry, ${sageError.message}${sageError.retryable ? ' Please try again.' : ''}`,
          createdAt: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, portfolio, preferences, isLoading]);
  
  // Quick action handler
  const handleQuickAction = useCallback((message: string) => {
    handleSendMessage(message);
  }, [handleSendMessage]);
  
  // Start new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    SageService.startNewConversation();
    setShowHistory(false);
  }, []);
  
  // Load existing conversation
  const handleLoadConversation = useCallback(async (convId: string) => {
    setRefreshing(true);
    try {
      const conv = await SageService.getConversation(convId);
      if (conv?.messages) {
        setMessages(conv.messages.map(m => ({
          ...m,
          cardRecommendation: m.metadata?.cardRecommendation,
        })));
        setConversationId(convId);
        SageService.setCurrentConversation(convId);
      }
    } finally {
      setRefreshing(false);
      setShowHistory(false);
    }
  }, []);
  
  // Card recommendation action handlers
  const handleCardLearnMore = useCallback((cardId: string) => {
    // TODO: Navigate to card detail modal
    console.log('Learn more about card:', cardId);
  }, []);
  
  // Render message item
  const renderMessage: ListRenderItem<DisplayMessage> = useCallback(({ item, index }) => {
    const showTimestamp = index === 0 || 
      (messages[index - 1]?.createdAt.getTime() - item.createdAt.getTime() > 60000);
    
    return (
      <View>
        <ChatBubble
          message={item.content}
          role={item.role}
          timestamp={item.createdAt}
          showTimestamp={showTimestamp}
        />
        
        {/* Card recommendation card */}
        {item.cardRecommendation && (
          <View style={styles.recommendationWrapper}>
            {(() => {
              const card = getCardByIdSync(item.cardRecommendation!.cardId);
              if (!card) return null;
              
              return (
                <CardRecommendationCard
                  card={card}
                  reason={item.cardRecommendation!.reason}
                  rewardRate={item.cardRecommendation!.rewardRate}
                  category={item.cardRecommendation!.category}
                  onLearnMore={() => handleCardLearnMore(item.cardRecommendation!.cardId)}
                />
              );
            })()}
          </View>
        )}
      </View>
    );
  }, [messages, handleCardLearnMore]);
  
  // Render history list
  if (showHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setShowHistory(false)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversations</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => handleLoadConversation(item.id)}
            >
              <MessageCircle size={20} color={colors.text.secondary} />
              <View style={styles.conversationInfo}>
                <Text style={styles.conversationTitle} numberOfLines={1}>
                  {item.title || 'New Conversation'}
                </Text>
                <Text style={styles.conversationDate}>
                  {item.updatedAt.toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No previous conversations</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }
  
  // Main chat view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleNewConversation}
          accessibilityLabel="New conversation"
        >
          <Plus size={20} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Sparkles size={18} color={colors.primary.main} />
          <Text style={styles.headerTitle}>Sage</Text>
        </View>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowHistory(true)}
          accessibilityLabel="View history"
        >
          <History size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Messages or Welcome Screen */}
      {messages.length === 0 ? (
        <WelcomeScreen
          onQuickAction={handleQuickAction}
          onViewHistory={() => setShowHistory(true)}
          hasHistory={conversations.length > 0}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {}}
              tintColor={colors.primary.main}
            />
          }
          ListFooterComponent={null}
        />
      )}
      
      {/* Quick actions bar (when chat has messages) */}
      {messages.length > 0 && !isLoading && (
        <QuickActions
          actions={QUICK_ACTIONS.slice(0, 4).map(a => ({
            ...a,
            icon: undefined
          }))}
          onActionPress={handleQuickAction}
          disabled={isLoading}
        />
      )}
      
      {/* Input bar */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={!preferences}
        isLoading={isLoading}
        placeholder={portfolio.length === 0 
          ? "Add cards to get personalized advice..." 
          : "Ask Sage anything..."}
      />
      
      {/* Bottom safe area padding for tab bar */}
      <View style={styles.bottomPadding} />
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary.main,
  },
  messagesList: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 8,
  },
  recommendationWrapper: {
    marginLeft: 36,
    marginRight: 12,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 70 : 60,
  },
  
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sageAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  sageAvatarText: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  welcomeActions: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: -2,
  },
  categoryChip: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 72,
  },
  categoryChipIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryChipLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 24,
    gap: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  
  // History list styles
  historyList: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  conversationDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 15,
    color: colors.text.tertiary,
  },
});

export default SageScreen;
