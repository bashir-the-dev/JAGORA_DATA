import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SystemStatusProvider } from './context/SystemStatusContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SystemStatusProvider>
        <App />
      </SystemStatusProvider>
    </ErrorBoundary>
  </StrictMode>,
);
