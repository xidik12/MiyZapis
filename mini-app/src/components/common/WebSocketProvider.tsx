import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { webSocketService, WebSocketEventType } from '@/services/websocket.service';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState } from '@/store';
import { updateBookingStatus } from '@/store/slices/bookingsSlice';
import { addToast } from '@/store/slices/uiSlice';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  send: (event: string, data: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { user: telegramUser, isAuthenticated: telegramAuth } = useTelegram();
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if ((isAuthenticated || telegramAuth) && (user || telegramUser)) {
      const authToken = token || localStorage.getItem('authToken');
      if (authToken) {
        setConnectionStatus('connecting');
        webSocketService.connect(user?.id || telegramUser?.id.toString() || '', authToken);
        webSocketService.startHeartbeat();
      }
    } else {
      webSocketService.disconnect();
      setConnectionStatus('disconnected');
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [isAuthenticated, telegramAuth, user, telegramUser, token]);

  // Setup event listeners
  useEffect(() => {
    const handleConnectionStatus = (data: { connected: boolean; reason?: string }) => {
      setIsConnected(data.connected);
      setConnectionStatus(data.connected ? 'connected' : 'disconnected');
    };

    const handleConnectionError = (data: { error: string }) => {
      setConnectionStatus('error');
      if (import.meta.env.DEV) console.error('WebSocket connection error:', data.error);
    };

    const handleReconnected = (data: { attempts: number }) => {
      setConnectionStatus('connected');
      if (import.meta.env.DEV) console.log('WebSocket reconnected after', data.attempts, 'attempts');
    };

    const handleMessage = (data: any) => {
      setLastMessage({
        ...data,
        timestamp: Date.now()
      });
    };

    const handleBookingUpdate = (data: any) => {
      dispatch(updateBookingStatus({ bookingId: data.bookingId, status: data.status }));
      dispatch(addToast({
        type: 'info',
        title: 'Booking Updated',
        message: `Your booking has been ${data.status}.`
      }));
      handleMessage(data);
    };

    const handleBookingConfirmed = (data: any) => {
      dispatch(updateBookingStatus({ bookingId: data.bookingId, status: 'confirmed' }));
      dispatch(addToast({
        type: 'success',
        title: 'Booking Confirmed!',
        message: 'Your appointment has been confirmed.'
      }));
      handleMessage(data);
    };

    const handleBookingCancelled = (data: any) => {
      dispatch(updateBookingStatus({ bookingId: data.bookingId, status: 'cancelled' }));
      dispatch(addToast({
        type: 'warning',
        title: 'Booking Cancelled',
        message: data.reason || 'Your booking has been cancelled.'
      }));
      handleMessage(data);
    };

    // Subscribe to connection events
    webSocketService.on('connection_status', handleConnectionStatus);
    webSocketService.on('connection_error', handleConnectionError);
    webSocketService.on('reconnected', handleReconnected);

    // Subscribe to specific events with custom handlers
    webSocketService.on('booking_updated', handleBookingUpdate);
    webSocketService.on('booking_confirmed', handleBookingConfirmed);
    webSocketService.on('booking_cancelled', handleBookingCancelled);
    
    // Subscribe to other message types for general handling
    const generalMessageTypes: WebSocketEventType[] = [
      'booking_reminder',
      'payment_completed',
      'payment_failed',
      'specialist_online',
      'specialist_offline',
      'new_message',
      'system_notification'
    ];

    generalMessageTypes.forEach(type => {
      webSocketService.on(type, handleMessage);
    });

    return () => {
      // Cleanup listeners
      webSocketService.off('connection_status', handleConnectionStatus);
      webSocketService.off('connection_error', handleConnectionError);
      webSocketService.off('reconnected', handleReconnected);
      
      // Clean up specific handlers
      webSocketService.off('booking_updated', handleBookingUpdate);
      webSocketService.off('booking_confirmed', handleBookingConfirmed);
      webSocketService.off('booking_cancelled', handleBookingCancelled);
      
      generalMessageTypes.forEach(type => {
        webSocketService.off(type, handleMessage);
      });
    };
  }, []);

  const send = (event: string, data: any) => {
    webSocketService.send(event, data);
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    webSocketService.on(event, callback);
  };

  const unsubscribe = (event: string, callback: (data: any) => void) => {
    webSocketService.off(event, callback);
  };

  const contextValue: WebSocketContextType = {
    isConnected,
    lastMessage,
    connectionStatus,
    send,
    subscribe,
    unsubscribe
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};