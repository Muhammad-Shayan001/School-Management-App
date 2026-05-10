'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/_lib/supabase/client';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import type { MessageWithSender } from '@/app/_lib/types/database';

export function useChat(conversationId?: string | null) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessageArrived, setNewMessageArrived] = useState<MessageWithSender | null>(null);

  useEffect(() => {
    if (!user || !conversationId) return;

    const supabase = createClient();

    // Subscribe to new messages for this conversation
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as MessageWithSender;
          // Fetch sender info if missing
          if (!newMsg.sender) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();
            if (senderProfile) {
              newMsg.sender = senderProfile as any;
            }
          }
          setNewMessageArrived(newMsg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId]);

  return { messages, setMessages, newMessageArrived, setNewMessageArrived };
}
