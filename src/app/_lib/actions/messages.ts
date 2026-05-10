'use server';

import { createClient } from '@/app/_lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ConversationWithDetails, MessageWithSender } from '@/app/_lib/types/database';

/**
 * Get all conversations for the current user.
 */
export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // First get conversation IDs the user is part of
  const { data: participations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (partError || !participations?.length) return { data: [], error: null };

  const conversationIds = participations.map(p => p.conversation_id);

  // Then fetch conversations with participants (excluding self to find "other" users)
  // and latest message
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      participants:conversation_participants(
        user_id,
        profile:profiles(id, full_name, avatar_url, role)
      ),
      messages(
        id, content, created_at, sender_id, is_read
      )
    `)
    .in('id', conversationIds);

  if (convError) return { data: null, error: convError.message };

  // Format data: we just need the other participant and the latest message
  const formattedData = conversations?.map(conv => {
    // Sort messages to find the latest
    const sortedMessages = conv.messages?.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastMessage = sortedMessages?.[0];

    // Filter out the current user to find the recipient
    const otherParticipants = conv.participants?.filter(p => p.user_id !== user.id) || [];
    
    return {
      id: conv.id,
      created_at: conv.created_at,
      participants: otherParticipants,
      last_message: lastMessage,
    };
  }).sort((a, b) => {
    const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
    const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
    return timeB - timeA;
  });

  return { data: formattedData, error: null };
}

/**
 * Get messages for a specific conversation.
 */
export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Verify participation
  const { data: participation } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single();

  if (!participation) return { data: null, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles(id, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return { data: null, error: error.message };

  // Mark unread messages as read
  const unreadMessages = data.filter(m => !m.is_read && m.sender_id !== user.id);
  if (unreadMessages.length > 0) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadMessages.map(m => m.id));
  }

  return { data, error: null };
}

/**
 * Send a new message or create a conversation if it doesn't exist.
 */
export async function sendMessage(content: string, recipientId: string, conversationId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  let activeConversationId = conversationId;

  // If no conversation ID, check if one exists between the two users
  if (!activeConversationId) {
    // This is tricky in Supabase without a custom function, but we can do it in two steps:
    // Get all conversations for current user
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConvs && myConvs.length > 0) {
      // Find if recipient is in any of these
      const { data: shared } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', myConvs.map(c => c.conversation_id))
        .eq('user_id', recipientId)
        .limit(1)
        .single();
      
      if (shared) {
        activeConversationId = shared.conversation_id;
      }
    }

    // If still no conversation, create one
    if (!activeConversationId) {
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
        
      if (newConvError || !newConv) return { error: 'Failed to create conversation' };
      activeConversationId = newConv.id;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: activeConversationId, user_id: user.id },
        { conversation_id: activeConversationId, user_id: recipientId }
      ]);
    }
  }

  // Insert message
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: activeConversationId,
      sender_id: user.id,
      content
    })
    .select('*, sender:profiles(id, full_name, avatar_url)')
    .single();

  if (error) return { error: error.message };

  // Notify recipient
  await supabase.from('notifications').insert({
    user_id: recipientId,
    title: 'New Message',
    message: `You have a new message.`,
    type: 'message',
    link: `/messages`
  });

  return { data, conversationId: activeConversationId, error: null };
}

/**
 * Get available users to chat with in the same school.
 */
export async function getChatContacts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();
  
  if (!profile?.school_id) return { data: null, error: 'No school assigned' };

  // Fetch all users in the same school, excluding self
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('school_id', profile.school_id)
    .eq('status', 'approved')
    .neq('id', user.id)
    .order('full_name');

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
