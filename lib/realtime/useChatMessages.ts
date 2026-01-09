'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage, Reaction, ReactionEmoji } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for real-time chat messages
 */
export function useChatMessages(limit = 50) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const lastMessageTime = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profile:profiles(name, photo_url)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Reverse to show oldest first
      const sortedMessages = (data || []).reverse();
      setMessages(sortedMessages);
      
      if (sortedMessages.length > 0) {
        lastMessageTime.current = sortedMessages[sortedMessages.length - 1].created_at;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    fetchMessages();

    // Subscribe to new messages
    channel = supabase
      .channel('chat_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          console.log('New chat message:', payload);
          const newMessage = payload.new as ChatMessage;

          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, photo_url')
            .eq('id', newMessage.user_id)
            .single();

          newMessage.profile = profile;

          setMessages((prev) => [...prev, newMessage].slice(-limit));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) =>
            updated.is_deleted
              ? prev.filter((m) => m.id !== updated.id)
              : prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchMessages, limit]);

  // Send a message
  const sendMessage = async (userId: string, message: string) => {
    if (!message.trim() || message.length > 500) {
      return { error: new Error('Message must be 1-500 characters') };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        message: message.trim(),
      })
      .select()
      .single();

    return { data, error };
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
}

/**
 * Hook for real-time reactions
 */
export function useReactions() {
  const [recentReactions, setRecentReactions] = useState<Reaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionEmoji, number>>({
    '🏈': 0,
    '🎉': 0,
    '🔥': 0,
    '😱': 0,
    '💰': 0,
    '😭': 0,
    '👏': 0,
    '🍀': 0,
  });

  const fetchRecentReactions = useCallback(async () => {
    try {
      const supabase = createClient();
      
      // Get reactions from last 30 seconds
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
      
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .gte('created_at', thirtySecondsAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecentReactions(data || []);

      // Count reactions
      const counts: Record<string, number> = {
        '🏈': 0, '🎉': 0, '🔥': 0, '😱': 0, '💰': 0, '😭': 0, '👏': 0, '🍀': 0,
      };
      (data || []).forEach((r) => {
        if (counts[r.emoji] !== undefined) {
          counts[r.emoji]++;
        }
      });
      setReactionCounts(counts as Record<ReactionEmoji, number>);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    fetchRecentReactions();

    // Subscribe to new reactions
    channel = supabase
      .channel('reactions_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
        },
        (payload) => {
          const newReaction = payload.new as Reaction;
          setRecentReactions((prev) => [newReaction, ...prev].slice(0, 50));
          setReactionCounts((prev) => ({
            ...prev,
            [newReaction.emoji]: (prev[newReaction.emoji as ReactionEmoji] || 0) + 1,
          }));

          // Decay the reaction count after 30 seconds
          setTimeout(() => {
            setReactionCounts((prev) => ({
              ...prev,
              [newReaction.emoji]: Math.max(0, (prev[newReaction.emoji as ReactionEmoji] || 0) - 1),
            }));
          }, 30000);
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchRecentReactions]);

  // Send a reaction
  const sendReaction = async (
    userId: string,
    emoji: ReactionEmoji,
    eventType?: 'score_change' | 'quarter_end' | 'winner' | 'prop_result' | 'general',
    eventId?: string
  ) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        user_id: userId,
        emoji,
        event_type: eventType || 'general',
        event_id: eventId,
      })
      .select()
      .single();

    return { data, error };
  };

  return { recentReactions, reactionCounts, sendReaction, refetch: fetchRecentReactions };
}

