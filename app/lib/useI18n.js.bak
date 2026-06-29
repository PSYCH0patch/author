'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import en from '../locales/en.json';
import zh from '../locales/zh.json';
import ru from '../locales/ru.json';

const translations = { en, zh, ru };
const FALLBACK_LANGUAGES = ['en', 'zh'];

export function useI18n() {
    const storedLanguage = useAppStore(state => state.language) || 'zh';
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        setHydrated(true);
    }, []);

    // Keep the server render and the first client render identical; then apply
    // the user's persisted language after hydration.
    const language = hydrated ? storedLanguage : 'zh';

    const readPath = (lang, keys) => {
        let current = translations[lang];
        if (!current) return undefined;
        for (const key of keys) {
            if (current === undefined || current[key] === undefined) return undefined;
            current = current[key];
        }
        return current;
    };

    const t = (path, params = {}) => {
        const keys = path.split('.');
        const fallbackChain = [language, ...FALLBACK_LANGUAGES.filter(lang => lang !== language)];
        for (const lang of fallbackChain) {
            const value = readPath(lang, keys);
            if (value !== undefined) {
                return typeof value === 'string'
                    ? value.replace(/\{(\w+)\}/g, (match, key) => (params[key] ?? match))
                    : value;
            }
        }

        console.warn(`Translation missing for key: ${path} in lang: ${language}`);
        return path;
    };

    const text = (zhText, enText, ruText = enText) => {
        if (language === 'en') return enText;
        if (language === 'ru') return ruText || enText;
        return zhText;
    };

    return { t, text, language };
}
