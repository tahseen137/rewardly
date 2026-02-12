/**
 * SageService - AI Assistant API Client
 * 
 * Calls Supabase Edge Function `sage-chat-stream` for streaming responses.
 * Maintains conversation history in memory and provides card recommendations.
 */

import { Card, UserCard, UserPreferences } from '../types';
import { getCardByIdSync } from './CardDataService';
import { generateSageSystemPrompt, SageUserContext } from '../data/sage_system_prompt';
import { supabase } from './supabase/client';

// ============================================================================
// Constants
// ============================================================================

const SUPABASE_PROJECT_REF = 'zdlozhpmqrtvvhdzbmrv';
const SAGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/sage-chat-stream`;
const MAX_HISTORY = 10; // Keep last 10 messages in conversation

// ============================================================================
// Types
// ============================================================================

export interface SageMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  metadata?: {
    toolsUsed?: string[];
    cardRecommendation?: CardRecommendation;
  };
}

export interface Conversation {
  id: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: SageMessage[];
}

export interface CardRecommendation {
  cardId: string;
  cardName: string;
  reason: string;
  rewardRate: number;
  estimatedValue?: number;
  category?: string;
}

export interface SendMessageResult {
  reply: string;
  conversationId: string;
  suggestions?: string[];
  cardRecommendation?: CardRecommendation;
  toolsUsed?: string[];
}

export interface SageError {
  code: 'NETWORK_ERROR' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'UNKNOWN';
  message: string;
  retryable: boolean;
}

// Quick action suggestions
export const QUICK_ACTIONS = [
  { id: 'dining', label: 'Best card for dining', message: 'What\'s my best card for dining and restaurants?' },
  { id: 'groceries', label: 'Best card for groceries', message: 'Which card should I use for grocery shopping?' },
  { id: 'travel', label: 'Best card for travel', message: 'What\'s the best card in my wallet for travel purchases?' },
  { id: 'compare', label: 'Compare my cards', message: 'Compare all my cards side-by-side and show me which is best for each category.' },
  { id: 'compare_two', label: 'Compare two cards', message: 'Compare my Cobalt vs Gold card - which one is better overall?' },
  { id: 'redeem', label: 'How to redeem points', message: 'What\'s the best way to redeem my points for maximum value?' },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert portfolio UserCards to full Card objects
 */
function enrichPortfolio(portfolio: UserCard[]): Card[] {
  return portfolio
    .map(uc => getCardByIdSync(uc.cardId))
    .filter((card): card is Card => card !== null);
}

/**
 * Generate a conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract card recommendation from response text
 * Looks for patterns like "use the [Card Name]" or "I recommend [Card Name]"
 */
function extractCardRecommendation(
  responseText: string,
  portfolio: Card[]
): CardRecommendation | undefined {
  // Simple heuristic: look for card names in the response
  for (const card of portfolio) {
    const cardNameLower = card.name.toLowerCase();
    const responseLower = responseText.toLowerCase();
    
    // Check if card name appears in recommendation context
    if (
      responseLower.includes(`use the ${cardNameLower}`) ||
      responseLower.includes(`recommend the ${cardNameLower}`) ||
      responseLower.includes(`best card is the ${cardNameLower}`) ||
      responseLower.includes(`go with the ${cardNameLower}`)
    ) {
      // Extract a short reason (first sentence mentioning the card)
      const sentences = responseText.split(/[.!?]+/);
      const relevantSentence = sentences.find(s => 
        s.toLowerCase().includes(cardNameLower)
      );
      
      return {
        cardId: card.id,
        cardName: card.name,
        reason: relevantSentence?.trim() || `Best card for this purchase`,
        rewardRate: card.baseRewardRate.value,
      };
    }
  }
  
  return undefined;
}

// ============================================================================
// Main Service Class
// ============================================================================

class SageServiceClass {
  private conversationHistory: Map<string, SageMessage[]> = new Map();
  private currentConversationId: string | null = null;
  
  /**
   * Send a message to Sage and get a streaming response
   */
  async streamMessage(
    message: string,
    conversationId: string | null,
    portfolio: UserCard[],
    preferences: UserPreferences,
    onToken: (token: string) => void,
    pointBalances?: Map<string, number>
  ): Promise<SendMessageResult> {
    // Get or create conversation ID
    const convId = conversationId || this.currentConversationId || generateConversationId();
    
    // Enrich portfolio with full card data
    const enrichedPortfolio = enrichPortfolio(portfolio);
    
    // Build user context
    const userContext: SageUserContext = {
      cards: enrichedPortfolio,
      preferences,
      pointBalances,
      country: 'CA', // TODO: Get from preferences
      subscriptionTier: 'free',
    };
    
    // Get session for auth - MUST have valid user session
    const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
    
    if (!session?.access_token) {
      throw {
        code: 'AUTH_ERROR' as const,
        message: 'Please sign in to use Sage',
        retryable: false
      } as SageError;
    }
    
    const token = session.access_token;

    // Get conversation history (last 10 messages)
    const history = this.conversationHistory.get(convId) || [];
    const recentHistory = history.slice(-MAX_HISTORY);

    try {
      const response = await fetch(SAGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message,
          conversationId: convId,
          history: recentHistory.map(m => ({ role: m.role, content: m.content })),
          userContext // Pass context so backend knows about cards
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      // Manual SSE Parsing (Option 2)
      // @ts-ignore - ReadableStream/getReader depends on RN version/polyfills
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let remoteConversationId = convId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete chunk

        for (const line of lines) {
          if (!line.trim()) continue;

          const [eventLine, dataLine] = line.split('\n');
          const event = eventLine?.replace('event: ', '') || 'message';
          const dataStr = dataLine?.replace('data: ', '');

          if (!dataStr) continue;

          if (event === 'text') {
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                accumulatedText += data.text;
                onToken(data.text);
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e);
            }
          }

          if (event === 'done') {
            try {
              const data = JSON.parse(dataStr);
              if (data.conversationId) {
                remoteConversationId = data.conversationId;
              }
            } catch (e) {
              // Ignore
            }
          }
          
          if (event === 'error') {
             throw new Error(dataStr);
          }
        }
      }

      // Store messages in history
      const userMessage: SageMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date(),
      };
      
      const assistantMessage: SageMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: accumulatedText,
        createdAt: new Date(),
      };
      
      // Update conversation history
      const updatedHistory = [...recentHistory, userMessage, assistantMessage];
      this.conversationHistory.set(convId, updatedHistory);
      this.currentConversationId = convId;
      
      // Try to extract card recommendation
      const cardRecommendation = extractCardRecommendation(
        accumulatedText,
        enrichedPortfolio
      );
      
      return {
        reply: accumulatedText,
        conversationId: remoteConversationId,
        cardRecommendation,
        suggestions: [],
        toolsUsed: [],
      };

    } catch (error: any) {
      console.error('Stream error:', error);
      throw {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to connect to Sage',
        retryable: true
      };
    }
  }

  // Backwards compatibility wrapper if needed, or alias
  async sendMessage(
    message: string,
    conversationId: string | null,
    portfolio: UserCard[],
    preferences: UserPreferences,
    pointBalances?: Map<string, number>
  ): Promise<SendMessageResult> {
    // Non-streaming fallback or just use stream and wait?
    // We'll just call streamMessage with a no-op callback to behave like a promise
    return this.streamMessage(
      message, 
      conversationId, 
      portfolio, 
      preferences, 
      () => {}, 
      pointBalances
    );
  }
  
  /**
   * Get list of user's conversations (in-memory only for now)
   */
  async getConversations(limit = 20): Promise<Conversation[]> {
    const conversations: Conversation[] = [];
    
    for (const [id, messages] of this.conversationHistory.entries()) {
      if (messages.length > 0) {
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        
        conversations.push({
          id,
          title: messages.find(m => m.role === 'user')?.content.slice(0, 50),
          createdAt: firstMessage.createdAt,
          updatedAt: lastMessage.createdAt,
        });
      }
    }
    
    // Sort by most recent first
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return conversations.slice(0, limit);
  }
  
  /**
   * Get a specific conversation with messages
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const messages = this.conversationHistory.get(conversationId);
    
    if (!messages || messages.length === 0) {
      return null;
    }
    
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    
    return {
      id: conversationId,
      title: messages.find(m => m.role === 'user')?.content.slice(0, 50),
      createdAt: firstMessage.createdAt,
      updatedAt: lastMessage.createdAt,
      messages,
    };
  }
  
  /**
   * Start a new conversation
   */
  startNewConversation(): void {
    this.currentConversationId = null;
  }
  
  /**
   * Set the current conversation
   */
  setCurrentConversation(conversationId: string | null): void {
    this.currentConversationId = conversationId;
  }
  
  /**
   * Get the current conversation ID
   */
  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }
  
  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    if (this.conversationHistory.has(conversationId)) {
      this.conversationHistory.delete(conversationId);
      
      if (this.currentConversationId === conversationId) {
        this.currentConversationId = null;
      }
      
      return true;
    }
    
    return false;
  }
}

// Export singleton instance
export const SageService = new SageServiceClass();
export default SageService;
