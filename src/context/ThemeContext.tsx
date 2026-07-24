import React, { createContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

export interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lock theme permanently to light as per Phase 5.2 guidelines
  const theme: ThemeMode = 'light';

  useEffect(() => {
    localStorage.setItem('medx-theme', 'light');
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    console.log('[Theme] Toggling theme is disabled. Light mode is locked.');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
