import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationEN from "../locals/en/translation.json";
import translationAR from "../locals/ar/translation.json";

export const AR = "ar";
export const EN = "en";

const resources = {
  [EN]: {
    translation: translationEN,
  },
  [AR]: {
    translation: translationAR,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: EN, // default language
  fallbackLng: EN,
  interpolation: {
    escapeValue: false,
  },
  detection: {
    caches: [], // Disable caching
  },
});

export const getDirection = (language: string) =>
  language === AR ? "rtl" : "ltr";

export default i18n;
