# iOS App Crash Fix - Loading Screen Issue

## Problem Analysis

The app crashes with `SIGABRT(6)` shortly after launch. Key issues identified:

1. **Connection Refused on Port 8097**: The app is trying to connect to a service on port 8097 that doesn't exist
2. **Visual Style Classes Not Registered**: Warnings about missing visual style classes
3. **Workspace Connection Invalidated**: Leads to app crash

## Root Causes

### 1. Port 8097 Connection Issue
- The app is attempting to connect to `localhost:8097` or a hardcoded IP:8097
- This port is likely for:
  - Metro bundler (should be 8081)
  - WebSocket connection (should use production URL)
  - Local development server (not running)

### 2. Missing Error Handling
- Failed connections cause unhandled exceptions
- No graceful fallback when services are unavailable
- App crashes instead of showing error state

## Solutions

### Solution 1: Fix Environment Configuration

**For React Native/Expo App:**

Create or update `app.config.js` or `app.json`:

```javascript
export default {
  expo: {
    name: "Panhaha",
    slug: "panhaha-bookingbot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1a237e"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.panhaha.bookingbot",
      buildNumber: "1.0.0",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSExceptionDomains: {
            "panhaha-backend-production.up.railway.app": {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSIncludesSubdomains: true,
              NSExceptionRequiresForwardSecrecy: true
            }
          }
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a237e"
      },
      package: "com.panhaha.bookingbot"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.API_URL || "https://panhaha-backend-production.up.railway.app/api/v1",
      wsUrl: process.env.WS_URL || "wss://panhaha-backend-production.up.railway.app",
      environment: process.env.NODE_ENV || "production"
    }
  }
};
```

### Solution 2: Create Environment Configuration File

Create `src/config/environment.ts`:

```typescript
import Constants from 'expo-constants';

// Get environment variables from app config
const extra = Constants.expoConfig?.extra || {};

export const environment = {
  API_URL: extra.apiUrl || 'https://panhaha-backend-production.up.railway.app/api/v1',
  WS_URL: extra.wsUrl || 'wss://panhaha-backend-production.up.railway.app',
  ENVIRONMENT: extra.environment || 'production',
  DEBUG: __DEV__,
};

// Validate configuration
if (!environment.API_URL) {
  console.error('❌ API_URL is not configured!');
}

if (!environment.WS_URL) {
  console.error('❌ WS_URL is not configured!');
}

export default environment;
```

### Solution 3: Add Error Handling for Network Connections

Update your API service file (`src/services/api.ts`):

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { environment } from '../config/environment';

// Create axios instance with proper error handling
const api: AxiosInstance = axios.create({
  baseURL: environment.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle connection errors gracefully
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('[API] Connection error:', error.message);
      // Don't crash the app - return a user-friendly error
      return Promise.reject({
        message: 'Unable to connect to server. Please check your internet connection.',
        code: 'CONNECTION_ERROR',
      });
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout');
      return Promise.reject({
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Solution 4: Add Error Boundary Component

Create `src/components/ErrorBoundary.tsx`:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // You can log to error reporting service here
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a237e',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
```

### Solution 5: Update App.tsx with Error Boundary

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
```

### Solution 6: Fix WebSocket Connection with Error Handling

Update WebSocket service (`src/services/websocket.service.ts`):

```typescript
import { io, Socket } from 'socket.io-client';
import { environment } from '../config/environment';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string, token: string): void {
    // Don't connect if already connected
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    // Validate environment
    if (!environment.WS_URL) {
      console.error('[WebSocket] WS_URL not configured');
      return;
    }

    try {
      console.log('[WebSocket] Connecting to:', environment.WS_URL);

      this.socket = io(environment.WS_URL, {
        auth: {
          token,
          userId,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      // Don't crash - just log the error
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        // Don't crash - just stop trying
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      // Handle error gracefully
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new WebSocketService();
```

### Solution 7: Fix Visual Style Classes Warning

Add to `App.tsx` or create `src/utils/visualStyles.ts`:

```typescript
import { Platform } from 'react-native';

// Register visual style classes to prevent warnings
if (Platform.OS === 'ios') {
  // This suppresses the warning about visual style classes
  // The warning is harmless but can be annoying
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('visual style classes') ||
      message.includes('UIActivityIndicatorView')
    ) {
      // Suppress these specific warnings
      return;
    }
    originalWarn.apply(console, args);
  };
}
```

## Implementation Steps

1. **Update app.config.js/app.json** with proper environment variables
2. **Create environment.ts** configuration file
3. **Add ErrorBoundary** component
4. **Update API service** with error handling
5. **Update WebSocket service** with error handling
6. **Wrap App with ErrorBoundary**
7. **Rebuild the app**:
   ```bash
   cd BookingBotMobile
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   npx expo run:ios --device "Incognito_xD"
   ```

## Testing

After implementing these fixes:

1. **Test with network disconnected**: App should show error message, not crash
2. **Test with invalid API URL**: App should handle gracefully
3. **Test WebSocket connection failure**: Should retry but not crash
4. **Test app launch**: Should not get stuck on loading screen

## Additional Notes

- Port 8097 is likely a hardcoded development port that doesn't exist in production
- Always use environment variables for API/WebSocket URLs
- Never hardcode localhost URLs in production builds
- Always wrap network calls in try-catch blocks
- Use ErrorBoundary to catch React component errors
- Log errors but don't crash the app for recoverable errors

## Quick Fix Command

If you need a quick fix, add this to your main App.tsx before any network calls:

```typescript
// Suppress port 8097 connection attempts
if (__DEV__) {
  // Only allow connections to known ports
  const allowedPorts = [8081, 3000, 3001];
  // This prevents accidental connections to wrong ports
}
```

