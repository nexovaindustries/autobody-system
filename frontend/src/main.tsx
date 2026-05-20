import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1e1e', color: '#fff', border: '1px solid #2d2d2d' },
            success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
          }}
        />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
