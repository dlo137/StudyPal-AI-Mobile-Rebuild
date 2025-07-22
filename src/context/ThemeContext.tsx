import React, { createContext, useContext, useState, ReactNode } from 'react';

const lightTheme = {
  mode: 'light',
  background: '#fff',
  card: '#f3f4f6',
  text: '#222',
  textSecondary: '#555',
  accent: '#8C52FF',
  accentSecondary: '#5CE1E6',
  border: '#e5e7eb',
  icon: '#8C52FF',
  header: '#fff',
  menu: '#f9fafb',
};

const darkTheme = {
  mode: 'dark',
  background: '#141417',
  card: '#23232a',
  text: '#fff',
  textSecondary: '#bbb',
  accent: '#8C52FF',
  accentSecondary: '#5CE1E6',
  border: '#1e293b',
  icon: '#8C52FF',
  header: '#141417',
  menu: '#202027',
};

const ThemeContext = createContext({
  theme: darkTheme,
  setTheme: (mode: 'light' | 'dark') => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState(darkTheme);
  const setTheme = (mode: 'light' | 'dark') => {
    setThemeState(mode === 'light' ? lightTheme : darkTheme);
  };
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
