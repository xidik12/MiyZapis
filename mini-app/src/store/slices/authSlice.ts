import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'specialist' | 'admin';
  isEmailVerified: boolean;
  preferences?: any;
  telegramId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await apiService.login(credentials) as any;
    localStorage.setItem('authToken', response.token);
    return response;
  }
);

export const registerAsync = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    const response = await apiService.register(userData);
    localStorage.setItem('authToken', response.token);
    return response;
  }
);

export const telegramAuthAsync = createAsyncThunk(
  'auth/telegramAuth',
  async (telegramData: any) => {
    const response = await apiService.telegramAuth(telegramData);
    localStorage.setItem('authToken', response.token);
    return response;
  }
);

export const getMeAsync = createAsyncThunk('auth/getMe', async () => {
  return await apiService.getMe();
});

export const refreshTokenAsync = createAsyncThunk('auth/refreshToken', async () => {
  const response = await apiService.refreshToken();
  localStorage.setItem('authToken', response.token);
  return response;
});

export const updateProfileAsync = createAsyncThunk(
  'auth/updateProfile',
  async (updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    preferences?: any;
  }) => {
    return await apiService.updateProfile(updates);
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    });
    builder.addCase(loginAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Login failed';
    });

    // Register
    builder.addCase(registerAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    });
    builder.addCase(registerAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Registration failed';
    });

    // Telegram Auth
    builder.addCase(telegramAuthAsync.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(telegramAuthAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    });
    builder.addCase(telegramAuthAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Telegram authentication failed';
    });

    // Get Me
    builder.addCase(getMeAsync.fulfilled, (state, action) => {
      state.user = action.payload;
    });

    // Update Profile
    builder.addCase(updateProfileAsync.fulfilled, (state, action) => {
      state.user = { ...state.user, ...action.payload };
    });

    // Refresh Token
    builder.addCase(refreshTokenAsync.fulfilled, (state, action) => {
      state.token = action.payload.token;
    });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;