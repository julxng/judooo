
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/app/App';
import { AppProviders } from './src/app/providers/AppProviders';
import './src/styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
