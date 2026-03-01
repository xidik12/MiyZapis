import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import App from './App';
import './styles/globals.css';

// Telegram WebApp initialization is handled by useTelegramWebApp hook
// (via TelegramProvider) to avoid duplicate .ready(), theme, and event setup.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        } 
        persistor={persistor}
      >
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);