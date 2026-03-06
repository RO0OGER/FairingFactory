import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface Conversation {
  id: string;
  user_id: string;
  user_email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  is_from_admin: boolean;
  content: string;
  created_at: string;
  read_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private supabase = inject(SupabaseService);

  async getOrCreateConversation(): Promise<Conversation | null> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) return null;

    const { data: existing } = await this.supabase.client
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return { ...existing, user_email: existing.user_email ?? user.email ?? '', last_message: '', unread_count: 0 };
    }

    const { data: created, error } = await this.supabase.client
      .from('conversations')
      .insert({ user_id: user.id, user_email: user.email ?? '' })
      .select()
      .single();

    if (error || !created) return null;
    return { ...created, user_email: user.email ?? '', last_message: '', unread_count: 0 };
  }

  async sendMessage(conversationId: string, content: string, isFromAdmin: boolean): Promise<Message | null> {
    const { data: { user } } = await this.supabase.client.auth.getUser();

    const { data, error } = await this.supabase.client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user?.id ?? null,
        is_from_admin: isFromAdmin,
        content,
      })
      .select()
      .single();

    if (error || !data) return null;

    await this.supabase.client
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as Message;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data } = await this.supabase.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');
    return (data ?? []) as Message[];
  }

  subscribeToMessages(conversationId: string, onNew: (msg: Message) => void): RealtimeChannel {
    return this.supabase.client
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => onNew(payload.new as Message),
      )
      .subscribe();
  }

  async getAllConversations(): Promise<Conversation[]> {
    const { data: convs } = await this.supabase.client
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!convs?.length) return [];

    const enriched: Conversation[] = await Promise.all(
      convs.map(async (conv) => {
        const { data: msgs } = await this.supabase.client
          .from('messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const { count } = await this.supabase.client
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_from_admin', false)
          .is('read_at', null);

        return {
          ...conv,
          user_email: conv.user_email ?? conv.user_id,
          last_message: msgs?.[0]?.content ?? '',
          unread_count: count ?? 0,
        } as Conversation;
      }),
    );

    return enriched;
  }

  subscribeToConversations(onUpdate: () => void): RealtimeChannel {
    return this.supabase.client
      .channel('admin_conv_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onUpdate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onUpdate)
      .subscribe();
  }

  async markMessagesRead(conversationId: string): Promise<void> {
    await this.supabase.client
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('is_from_admin', false)
      .is('read_at', null);
  }
}
