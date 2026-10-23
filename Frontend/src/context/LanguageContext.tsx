import React, { createContext, useState, useContext, useCallback } from 'react';
import { translations, Language } from '../constants/i18n';

interface LanguageContextType {
    lang: Language;
    t: typeof translations['en'];
    setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    t: translations['en'],
    setLang: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLangState] = useState<Language>('en');

    const setLang = useCallback((newLang: Language) => {
        setLangState(newLang);
    }, []);

    return (
        <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
