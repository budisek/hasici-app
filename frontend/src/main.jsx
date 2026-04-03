import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Zaregistrujeme Service Worker pro push notifikace
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('Service Worker zaregistrován:', reg.scope))
      .catch((err) => console.warn('Service Worker se nepodařilo zaregistrovat:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
