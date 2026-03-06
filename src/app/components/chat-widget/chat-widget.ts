import { DatePipe } from '@angular/common';
import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../services/auth.service';
import { ChatService, Conversation, Message } from '../../services/chat.service';

@Component({
  selector: 'app-chat-widget',
  imports: [DatePipe],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
})
export class ChatWidget implements OnDestroy {
  private auth = inject(AuthService);
  private chatService = inject(ChatService);

  readonly isOpen = signal(false);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly conversation = signal<Conversation | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly inputText = signal('');

  private channel: RealtimeChannel | null = null;
  private pendingOpen = false;
  private previousUserId: string | null | undefined = undefined;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const userId = user?.id ?? null;

      if (this.previousUserId !== undefined && this.previousUserId !== userId) {
        this.resetChat();
      }
      this.previousUserId = userId;

      if (user && this.pendingOpen) {
        this.pendingOpen = false;
        this.isOpen.set(true);
        this.init();
      }
    });
  }

  get currentUser() {
    return this.auth.currentUser();
  }

  ngOnDestroy() {
    this.channel?.unsubscribe();
  }

  private resetChat() {
    this.channel?.unsubscribe();
    this.channel = null;
    this.conversation.set(null);
    this.messages.set([]);
    this.inputText.set('');
    this.isOpen.set(false);
  }

  async toggle() {
    if (!this.currentUser) {
      this.pendingOpen = true;
      this.auth.showAuthModal.set(true);
      return;
    }
    this.isOpen.update((v) => !v);
    if (this.isOpen() && !this.conversation()) {
      await this.init();
    }
  }

  private async init() {
    this.loading.set(true);
    const conv = await this.chatService.getOrCreateConversation();
    if (!conv) {
      this.loading.set(false);
      return;
    }
    this.conversation.set(conv);
    const msgs = await this.chatService.getMessages(conv.id);
    this.messages.set(msgs);
    this.loading.set(false);

    this.channel = this.chatService.subscribeToMessages(conv.id, (msg) => {
      this.messages.update((list) =>
        list.some((m) => m.id === msg.id) ? list : [...list, msg]
      );
      this.scrollToBottom();
    });

    setTimeout(() => this.scrollToBottom(), 50);
  }

  async send() {
    const text = this.inputText().trim();
    const conv = this.conversation();
    if (!text || !conv) return;
    this.sending.set(true);
    const msg = await this.chatService.sendMessage(conv.id, text, false);
    if (msg) {
      this.inputText.set('');
    }
    this.sending.set(false);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = document.querySelector('.chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
}
