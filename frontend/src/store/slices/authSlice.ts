import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';
import { setAuthTokens, clearAuthTokens } from '../../services';
import {
  User,
  AuthTokens,
  AuthState,
  LoginRequest,
  RegisterRequest,
  TelegramAuthRequest,
} from '../../types';

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      setAuthTokens(response.tokens);
      return response;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      // Only set tokens if they exist (immediate login)
      // If requiresVerification is true, user must verify email first
      if (response.tokens) {
        setAuthTokens(response.tokens);
      }
      return response;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async ({ credential, userType }: { credential: string; userType?: 'customer' | 'specialist' }, { rejectWithValue }) => {
    try {
      const response = await authService.googleAuth(credential, userType);
      if (response.requiresUserTypeSelection) {
        // Return special response indicating user type selection is needed
        return { requiresUserTypeSelection: true, googleData: response.googleData };
      }
      setAuthTokens(response.tokens);
      return response;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Google authentication failed');
    }
  }
);

export const telegramLogin = createAsyncThunk(
  'auth/telegramLogin',
  async (telegramData: TelegramAuthRequest, { rejectWithValue }) => {
    try {
      const response = await authService.telegramAuth(telegramData);
      setAuthTokens(response.tokens);
      return response;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Telegram authentication failed');
    }
  }
);

export const telegramAuth = createAsyncThunk(
  'auth/telegramAuth',
  async (telegramData: TelegramAuthRequest, { rejectWithValue }) => {
    try {
      const response = await authService.telegramAuth(telegramData);
      setAuthTokens(response.tokens);
      return response;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Telegram authentication failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      return user;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Failed to get user profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const user = await authService.updateProfile(userData);
      return user;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Failed to update profile');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file: File, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.uploadAvatar(file);
      // Update user profile with new avatar URL immediately
      dispatch(updateUserProfile({ avatar: response.avatarUrl }));
      // Also refresh the current user data to ensure consistency
      dispatch(getCurrentUser());
      return response.avatarUrl;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Failed to upload avatar');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return 'Password changed successfully';
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Failed to change password');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response.message;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Failed to send reset email');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    { token, newPassword }: { token: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.resetPassword(token, newPassword);
      return response.message;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Failed to reset password');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token);
      return response.message;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Email verification failed');
    }
  }
);

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerificationEmail();
      return response.message;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return rejectWithValue(err.message || 'Failed to resend verification email');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      clearAuthTokens();
      return null;
    } catch (error: unknown) {
      // Still clear tokens even if logout request fails
      clearAuthTokens();
      // Always return success for logout to prevent error toasts
      return null;
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      state.isAuthenticated = true;
    },
    clearTokens: (state) => {
      state.tokens = null;
      state.isAuthenticated = false;
      state.user = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    updateLoyaltyPoints: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.loyaltyPoints = action.payload;
      }
    },
    incrementTotalBookings: (state) => {
      if (state.user) {
        state.user.totalBookings += 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        
        // Only authenticate if tokens are provided (no email verification required)
        if (action.payload.tokens) {
          state.tokens = action.payload.tokens;
          state.isAuthenticated = true;
        } else {
          // Email verification required - don't authenticate yet
          state.tokens = null;
          state.isAuthenticated = false;
        }
        
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Google Login
    builder
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        // Only set user and tokens if they exist (not in requiresUserTypeSelection response)
        if ('user' in action.payload && 'tokens' in action.payload) {
          state.user = action.payload.user;
          state.tokens = action.payload.tokens;
          state.isAuthenticated = true;
        }
        // For requiresUserTypeSelection response, keep loading state false but don't authenticate yet
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Telegram Login
    builder
      .addCase(telegramLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(telegramLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(telegramLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Telegram Auth
    builder
      .addCase(telegramAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(telegramAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(telegramAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Upload Avatar
    builder
      .addCase(uploadAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify Email
    builder
      .addCase(verifyEmail.fulfilled, (state) => {
        if (state.user) {
          state.user.isVerified = true;
        }
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

// Export actions
export const {
  clearError,
  updateUserProfile,
  setTokens,
  clearTokens,
  setUser,
  updateLoyaltyPoints,
  incrementTotalBookings,
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;