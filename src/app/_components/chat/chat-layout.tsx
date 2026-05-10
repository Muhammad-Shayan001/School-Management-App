'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { getConversations, getMessages, sendMessage, getChatContacts } from '@/app/_lib/actions/messages';
import { useChat } from '@/app/_hooks/use-chat';
import { Avatar } from '@/app/_components/ui/avatar';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { MessageBubble } from '@/app/_components/chat/message-bubble';
import { TypingIndicator } from '@/app/_components/chat/typing-indicator';
import { formatTime } from '@/app/_lib/utils/format';
import { cn } from '@/app/_lib/utils/cn';
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react';
import type { MessageWithSender } from '@/app/_lib/types/database';

export function ChatLayout() {
  const { user } = useAuthStore();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [view, setView] = useState<'list' | 'chat'>('list'); // Mobile view state
  
  const { messages, setMessages, newMessageArrived } = useChat(activeConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load: Get contacts and conversations
  useEffect(() => {
    async function loadInitialData() {
      const [contactsRes, convsRes] = await Promise.all([
        getChatContacts(),
        getConversations()
      ]);
      
      if (contactsRes.data) setContacts(contactsRes.data);
      if (convsRes.data) setConversations(convsRes.data);
    }
    loadInitialData();
  }, []);

  // Handle new message from subscription
  useEffect(() => {
    if (newMessageArrived) {
      setMessages((prev) => [...prev, newMessageArrived]);
    }
  }, [newMessageArrived, setMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle contact select
  async function handleContactSelect(contact: any) {
    setActiveContact(contact);
    setView('chat');
    
    // Find if we already have a conversation with this contact
    const existingConv = conversations.find(c => 
      c.participants?.some((p: any) => p.user_id === contact.id)
    );

    if (existingConv) {
      setActiveConversationId(existingConv.id);
      setLoadingMessages(true);
      const { data } = await getMessages(existingConv.id);
      setMessages((data as MessageWithSender[]) || []);
      setLoadingMessages(false);
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  // Handle sending message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !activeContact) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    // Optimistic UI update
    const tempMsg: MessageWithSender = {
      id: 'temp-' + Date.now(),
      conversation_id: activeConversationId || '',
      sender_id: user!.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: user as any
    };
    setMessages(prev => [...prev, tempMsg]);

    const result = await sendMessage(content, activeContact.id, activeConversationId || undefined);
    
    if (result.error) {
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert('Failed to send message: ' + result.error);
    } else if (result.conversationId && !activeConversationId) {
      // If a new conversation was created, update state
      setActiveConversationId(result.conversationId);
      
      // Refresh conversations list to show the new one
      const convsRes = await getConversations();
      if (convsRes.data) setConversations(convsRes.data);
    }

    setIsSending(false);
  }

  // Combine contacts and recent conversations for the list
  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-card flex h-[calc(100vh-140px)] min-h-[500px] overflow-hidden">
      
      {/* LEFT PANEL: Contacts List */}
      <div className={cn(
        "flex flex-col border-r border-glass-border w-full md:w-80 flex-shrink-0 transition-transform duration-300",
        view === 'chat' ? 'hidden md:flex' : 'flex'
      )}>
        <div className="p-4 border-b border-glass-border space-y-4">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-tertiary">No contacts found.</div>
          ) : (
            <div className="py-2">
              {filteredContacts.map(contact => {
                // Find if there's an existing conversation to show unread status or last message preview
                const existingConv = conversations.find(c => 
                  c.participants?.some((p: any) => p.user_id === contact.id)
                );
                const lastMessage = existingConv?.last_message;
                const isUnread = lastMessage && !lastMessage.is_read && lastMessage.sender_id !== user?.id;

                return (
                  <button
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-glass-hover transition-colors text-left",
                      activeContact?.id === contact.id && "bg-accent-subtle/50"
                    )}
                  >
                    <Avatar src={contact.avatar_url} name={contact.full_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm truncate", isUnread ? "font-bold text-text-primary" : "font-medium text-text-primary")}>
                          {contact.full_name}
                        </p>
                        {lastMessage && (
                          <span className={cn("text-[10px] flex-shrink-0", isUnread ? "text-accent font-medium" : "text-text-tertiary")}>
                            {formatTime(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={cn("text-xs truncate", isUnread ? "font-medium text-text-primary" : "text-text-tertiary")}>
                          {lastMessage ? lastMessage.content : <span className="capitalize text-[10px] text-text-tertiary">{contact.role}</span>}
                        </p>
                        {isUnread && <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat */}
      <div className={cn(
        "flex-1 flex flex-col bg-bg-secondary/30",
        view === 'list' ? 'hidden md:flex' : 'flex'
      )}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-4 border-b border-glass-border flex items-center gap-4 bg-bg-secondary">
              <button onClick={() => setView('list')} className="md:hidden p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-glass-hover">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar src={activeContact.avatar_url} name={activeContact.full_name} size="md" online />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{activeContact.full_name}</h3>
                <p className="text-xs text-text-tertiary capitalize">{activeContact.role}</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col">
              {loadingMessages ? (
                <div className="m-auto text-sm text-text-tertiary">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="m-auto text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <h4 className="text-sm font-medium text-text-secondary">Start the conversation</h4>
                  <p className="text-xs text-text-tertiary max-w-xs">Send a message to {activeContact.full_name} to start chatting.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user?.id;
                  const time = formatTime(msg.created_at);
                  
                  // Simple check to add margin between different senders
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const addMargin = prevMsg && prevMsg.sender_id !== msg.sender_id;

                  return (
                    <div key={msg.id} className={cn("flex flex-col", addMargin && "mt-6")}>
                      <MessageBubble content={msg.content} isOwn={isOwn} time={time} />
                    </div>
                  );
                })
              )}
              {isSending && (
                <div className="self-end">
                   <div className="px-4 py-2.5 bg-accent/70 text-white rounded-2xl rounded-br-sm text-sm opacity-50 flex gap-2 items-center">
                     {messageInput || "Sending..."} 
                     <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-bg-secondary border-t border-glass-border">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
                />
                <Button 
                  type="submit" 
                  disabled={!messageInput.trim() || isSending}
                  className="h-[42px] w-[42px] p-0 flex-shrink-0 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="m-auto text-center">
            <div className="h-16 w-16 rounded-full bg-glass-bg border border-glass-border flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-text-tertiary" />
            </div>
            <h3 className="text-base font-medium text-text-secondary">Your Messages</h3>
            <p className="text-sm text-text-tertiary mt-1">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
