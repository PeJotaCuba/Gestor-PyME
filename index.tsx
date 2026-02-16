
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  // Use window 'load' event to ensure all resources are loaded before registering SW
  window.addEventListener('load', () => {
    // Register from root to ensure scope covers the whole app
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
