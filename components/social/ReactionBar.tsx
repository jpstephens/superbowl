'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactions } from '@/lib/realtime/useChatMessages';
import type { ReactionEmoji } from '@/lib/supabase/types';

const REACTION_EMOJIS: ReactionEmoji[] = ['🏈', '🎉', '🔥', '😱', '💰', '😭', '👏', '🍀'];

interface ReactionBarProps {
  userId: string | null;
  eventType?: 'score_change' | 'quarter_end' | 'winner' | 'prop_result' | 'general';
  eventId?: string;
  compact?: boolean;
}

/**
 * Reaction Bar Component
 * Quick emoji reactions for game events
 */
export default function ReactionBar({
  userId,
  eventType = 'general',
  eventId,
  compact = false,
}: ReactionBarProps) {
  const { recentReactions, reactionCounts, sendReaction } = useReactions();
  const [recentlySent, setRecentlySent] = useState<Set<ReactionEmoji>>(new Set());

  const handleReaction = async (emoji: ReactionEmoji) => {
    if (!userId || recentlySent.has(emoji)) return;

    // Add to recently sent to prevent spam
    setRecentlySent((prev) => new Set(prev).add(emoji));
    
    await sendReaction(userId, emoji, eventType, eventId);

    // Remove from recently sent after 2 seconds
    setTimeout(() => {
      setRecentlySent((prev) => {
        const next = new Set(prev);
        next.delete(emoji);
        return next;
      });
    }, 2000);
  };

  // Floating reactions animation
  const FloatingReaction = ({ emoji, index }: { emoji: ReactionEmoji; index: number }) => (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{
        opacity: 0,
        y: -100,
        scale: 1.5,
        x: Math.sin(index * 0.5) * 50,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className="absolute bottom-full text-2xl pointer-events-none"
    >
      {emoji}
    </motion.div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1 relative">
        {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(emoji)}
            disabled={!userId || recentlySent.has(emoji)}
            className="text-lg p-1 rounded hover:bg-gray-100 disabled:opacity-50 relative"
          >
            {emoji}
            {reactionCounts[emoji] > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#CDA33B] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {reactionCounts[emoji]}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating reactions */}
      <AnimatePresence>
        {recentReactions.slice(0, 10).map((reaction, index) => (
          <FloatingReaction
            key={reaction.id}
            emoji={reaction.emoji}
            index={index}
          />
        ))}
      </AnimatePresence>

      {/* Reaction buttons */}
      <div className="bg-white rounded-xl border shadow-sm p-3">
        <div className="flex justify-between items-center">
          {REACTION_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReaction(emoji)}
              disabled={!userId || recentlySent.has(emoji)}
              className="relative text-2xl p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {emoji}
              
              {/* Count badge */}
              <AnimatePresence>
                {reactionCounts[emoji] > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-[#CDA33B] text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1"
                  >
                    {reactionCounts[emoji] > 99 ? '99+' : reactionCounts[emoji]}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Ripple effect when sent */}
              <AnimatePresence>
                {recentlySent.has(emoji) && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#CDA33B] rounded-full"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>

      {!userId && (
        <p className="text-center text-xs text-gray-500 mt-2">
          Sign in to react
        </p>
      )}
    </div>
  );
}

