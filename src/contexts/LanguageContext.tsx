import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import i18n, { getDirection } from "../utils/i18n";

interface LanguageContextInterface {
  selectedLanguage: string;
  changeLanguage: (language: string) => void;
}

const LanguageContext = createContext<LanguageContextInterface | undefined>(
  undefined,
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const changeLanguage = useCallback(
    (language: string) => {
      setSelectedLanguage(language);
      i18n.changeLanguage(language);
    },
    [],
  );

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
  }, [selectedLanguage]);

  const value = useMemo(() => {
    return {
      selectedLanguage,
      changeLanguage,
    };
  }, [selectedLanguage, changeLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      <div dir={getDirection(selectedLanguage)} data-testid="dir">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

// custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useContext must be used with a LanguageProvider");
  }
  return context;
};
