import React from 'react';
import './App.css';
import Routes from 'pages/routes';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { PRODUCTION } from 'config.keys';
import { RecoilRoot } from 'recoil';
import { DebugObserver } from 'store';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import getTheme from 'utils/hooks/theme';
// import { useTawkIO } from 'hooks/useTawk-io';

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
  // useTawkIO();

  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <ThemeProvider theme={getTheme('dark')}>
          <Router>
            {!PRODUCTION && (
              <>
                <DebugObserver />
                <ReactQueryDevtools initialIsOpen />
              </>
            )}
            <Routes />
          </Router>
        </ThemeProvider>
      </RecoilRoot>
    </QueryClientProvider>
  );
};

export default App;
