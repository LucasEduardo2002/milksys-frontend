import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ThemeProvider, Box } from '@mui/material';

import { DarkTheme, LightTheme } from './../themes';

interface IThemeContextData {
  themeName: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext({} as IThemeContextData);

export const useAppThemeContext = () => {
  return useContext(ThemeContext);
}

interface IAppThemeProviderProps {
  children: React.ReactNode;   
}

export const AppThemeProvider: React.FC<IAppThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setThemeName(oldThemeName => oldThemeName === 'light' ? 'dark' : 'light');
  }, []);

  const theme = useMemo(() => {
    if (themeName === 'light') return LightTheme;

    return DarkTheme;
  }, [themeName]);


  return (
    <ThemeContext.Provider value={{ themeName, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <Box sx={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
          {children}
        </Box>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
