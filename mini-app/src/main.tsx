import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import App from './App';
import './styles/globals.css';

// Initialize Telegram WebApp
if (window.Telegram?.WebApp) {
  const tgApp = window.Telegram.WebApp;
  
  // Configure app
  tgApp.ready();
  tgApp.expand();
  
  // Apply initial theme
  document.documentElement.style.setProperty('--tg-viewport-height', `${tgApp.viewportHeight}px`);
  
  // Handle theme changes
  const applyTheme = () => {
    const theme = tgApp.themeParams;
    const root = document.documentElement;
    
    // Apply CSS variables
    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        const cssVar = `--tg-color-${key.replace(/_/g, '-')}`;
        root.style.setProperty(cssVar, value);
      }
    });
    
    // Set color scheme class
    document.body.classList.toggle('dark', tgApp.colorScheme === 'dark');
    document.body.style.backgroundColor = theme.bg_color || '';
  };
  
  // Apply theme on load and changes
  applyTheme();
  tgApp.onEvent('themeChanged', applyTheme);
  tgApp.onEvent('viewportChanged', () => {
    document.documentElement.style.setProperty('--tg-viewport-height', `${tgApp.viewportHeight}px`);
  });
}

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