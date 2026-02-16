import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: string;
  isRead?: boolean;
  createdAt: string;
}

// Matches backend response from getUserConversations() exactly
export interface Conversation {
  id: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  specialist?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  lastMessage?: Message;
  messages?: Message[];
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessagesState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
};

export const fetchConversationsAsync = createAsyncThunk(
  'messages/fetchConversations',
  async () => {
    return await apiService.getConversations();
  }
);

export const fetchConversationAsync = createAsyncThunk(
  'messages/fetchConversation',
  async (id: string) => {
    return await apiService.getConversation(id);
  }
);

export const sendMessageAsync = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content }: { conversationId: string; content: string }) => {
    return await apiService.sendMessage(conversationId, content);
  }
);

export const createConversationAsync = createAsyncThunk(
  'messages/createConversation',
  async (participantId: string) => {
    return await apiService.createConversation(participantId);
  }
);

export const markMessagesReadAsync = createAsyncThunk(
  'messages/markRead',
  async (conversationId: string) => {
    await apiService.markMessagesRead(conversationId);
    return conversationId;
  }
);

export const fetchMessageUnreadCountAsync = createAsyncThunk(
  'messages/fetchUnreadCount',
  async () => {
    return await apiService.getMessageUnreadCount();
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action) => {
      const msg = action.payload as Message;
      state.messages.push(msg);
      // Update conversation's lastMessage
      const conv = state.conversations.find(c => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessage = msg;
        conv.updatedAt = msg.createdAt;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.activeConversation = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConversationsAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchConversationsAsync.fulfilled, (state, action: any) => {
      state.isLoading = false;
      const p = action.payload;
      const raw = p.items || p.conversations || (Array.isArray(p) ? p : []);
      state.conversations = raw;
      state.unreadCount = state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    });
    builder.addCase(fetchConversationsAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch conversations';
    });

    builder.addCase(fetchConversationAsync.pending, (state) => {
      state.isLoadingMessages = true;
    });
    builder.addCase(fetchConversationAsync.fulfilled, (state, action: any) => {
      state.isLoadingMessages = false;
      const rawConv = action.payload.conversation || action.payload;
      state.activeConversation = rawConv;
      state.messages = action.payload.messages || [];
    });
    builder.addCase(fetchConversationAsync.rejected, (state, action) => {
      state.isLoadingMessages = false;
      state.error = action.error.message || 'Failed to load conversation';
    });

    builder.addCase(sendMessageAsync.pending, (state) => {
      state.isSending = true;
    });
    builder.addCase(sendMessageAsync.fulfilled, (state, action: any) => {
      state.isSending = false;
      state.messages.push(action.payload);
      const conv = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conv) {
        conv.lastMessage = action.payload;
        conv.updatedAt = action.payload.createdAt;
      }
    });
    builder.addCase(sendMessageAsync.rejected, (state, action) => {
      state.isSending = false;
      state.error = action.error.message || 'Failed to send message';
    });

    builder.addCase(createConversationAsync.fulfilled, (state, action: any) => {
      state.conversations.unshift(action.payload);
      state.activeConversation = action.payload;
    });

    builder.addCase(markMessagesReadAsync.fulfilled, (state, action) => {
      const convId = action.payload;
      const conv = state.conversations.find(c => c.id === convId);
      if (conv) {
        state.unreadCount = Math.max(0, state.unreadCount - conv.unreadCount);
        conv.unreadCount = 0;
      }
      state.messages.forEach(m => {
        if (m.conversationId === convId) {
          m.isRead = true;
          m.readAt = m.readAt || new Date().toISOString();
        }
      });
    });

    builder.addCase(fetchMessageUnreadCountAsync.fulfilled, (state, action: any) => {
      state.unreadCount = action.payload.count ?? action.payload ?? 0;
    });
  },
});

export const { setActiveConversation, addMessage, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
