import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (color: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeColor: "#007BFF",
  setThemeColor: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeColor, setThemeColorState] = useState("#007BFF");

  useEffect(() => {
    loadThemeColor();
  }, []);

  const loadThemeColor = async () => {
    try {
      const savedColor = await AsyncStorage.getItem("userThemeColor");
      if (savedColor) {
        setThemeColorState(savedColor);
      }
    } catch (error) {
      console.error("Error loading theme color:", error);
    }
  };

  const setThemeColor = async (color: string) => {
    try {
      await AsyncStorage.setItem("userThemeColor", color);
      setThemeColorState(color);
    } catch (error) {
      console.error("Error saving theme color:", error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};
