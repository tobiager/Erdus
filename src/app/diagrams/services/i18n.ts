import { useTranslation } from 'react-i18next';

/**
 * Hook to access i18next translation function in diagrams context
 */
export function useT() {
  const { t, i18n } = useTranslation();
  
  return {
    t,
    lang: i18n.language.startsWith('es') ? 'es' : 'en',
    changeLanguage: i18n.changeLanguage
  };
}