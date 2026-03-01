import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filter: 'all' | 'unread' | 'bookings' | 'system';
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  filter: 'all',
};

export const fetchNotificationsAsync = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: { page?: number; limit?: number; filter?: string }) => {
    return await apiService.getNotifications(params);
  }
);

export const fetchUnreadCountAsync = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    return await apiService.getUnreadNotificationCount();
  }
);

export const markNotificationReadAsync = createAsyncThunk(
  'notifications/markRead',
  async (id: string) => {
    return await apiService.markNotificationRead(id);
  }
);

export const markAllNotificationsReadAsync = createAsyncThunk(
  'notifications/markAllRead',
  async () => {
    return await apiService.markAllNotificationsRead();
  }
);

export const deleteNotificationAsync = createAsyncThunk(
  'notifications/delete',
  async (id: string) => {
    await apiService.deleteNotification(id);
    return id;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    decrementUnread: (state) => {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotificationsAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchNotificationsAsync.fulfilled, (state, action: { payload: Record<string, unknown> }) => {
      state.isLoading = false;
      const p = action.payload;
      state.notifications = p.items || p.notifications || (Array.isArray(p) ? p : []);
      if (p.unreadCount !== undefined) {
        state.unreadCount = p.unreadCount;
      }
      if (p.pagination) {
        state.pagination = {
          page: p.pagination.page || p.pagination.currentPage || 1,
          limit: p.pagination.limit || p.pagination.itemsPerPage || 20,
          total: p.pagination.total || p.pagination.totalItems || 0,
          totalPages: p.pagination.totalPages || 0,
        };
      }
    });
    builder.addCase(fetchNotificationsAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch notifications';
    });

    builder.addCase(fetchUnreadCountAsync.fulfilled, (state, action: { payload: Record<string, unknown> }) => {
      state.unreadCount = action.payload.count ?? action.payload ?? 0;
    });

    builder.addCase(markNotificationReadAsync.fulfilled, (state, action: { payload: Record<string, unknown> }) => {
      const id = action.meta.arg;
      const notif = state.notifications.find(n => n.id === id);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        if (state.unreadCount > 0) state.unreadCount -= 1;
      }
    });

    builder.addCase(markAllNotificationsReadAsync.fulfilled, (state) => {
      state.notifications.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
    });

    builder.addCase(deleteNotificationAsync.fulfilled, (state, action) => {
      const id = action.payload;
      const notif = state.notifications.find(n => n.id === id);
      if (notif && !notif.isRead && state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
      state.notifications = state.notifications.filter(n => n.id !== id);
    });
  },
});

export const { setFilter, addNotification, decrementUnread } = notificationsSlice.actions;
export default notificationsSlice.reducer;
