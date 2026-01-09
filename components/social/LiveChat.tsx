'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatMessages } from '@/lib/realtime/useChatMessages';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, Pin, Trash2 } from 'lucide-react';

interface LiveChatProps {
  userId: string | null;
  userName?: string;
  isAdmin?: boolean;
  maxHeight?: string;
  showHeader?: boolean;
}

/**
 * Live Chat Component
 * Real-time chat for game day engagement
 */
export default function LiveChat({
  userId,
  userName = 'Anonymous',
  isAdmin = false,
  maxHeight = '400px',
  showHeader = true,
}: LiveChatProps) {
  const { messages, loading, sendMessage } = useChatMessages(100);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!userId || !newMessage.trim() || sending) return;

    setSending(true);
    const { error } = await sendMessage(userId, newMessage.trim());
    
    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-2 p-4 border-b">
          <MessageCircle className="w-5 h-5 text-[#CDA33B]" />
          <h3 className="font-bold text-gray-900">Live Chat</h3>
          <span className="ml-auto text-sm text-gray-500">
            {messages.length} messages
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Be the first to say something!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.user_id === userId;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-[#CDA33B] text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    } ${msg.is_pinned ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    {!isOwnMessage && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#CDA33B]">
                          {msg.profile?.name || 'Unknown'}
                        </span>
                        {msg.is_pinned && <Pin className="w-3 h-3 text-yellow-500" />}
                      </div>
                    )}
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {userId ? (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#CDA33B] focus:border-transparent"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="rounded-full bg-[#CDA33B] hover:bg-[#b8922f] px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {newMessage.length}/500 characters
          </p>
        </div>
      ) : (
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-500">
            <a href="/auth/login" className="text-[#CDA33B] hover:underline">
              Sign in
            </a>{' '}
            to join the conversation
          </p>
        </div>
      )}
    </Card>
  );
}

