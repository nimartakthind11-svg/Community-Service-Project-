import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import hi from './locales/hi.json';

const locales = Localization.getLocales();
const deviceLanguage = locales?.[0]?.languageCode || 'en';
const initialLang = deviceLanguage === 'hi' ? 'hi' : 'en';

if (!i18next.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member
  i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export default i18next;
