import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  collapsed?: boolean;
}

export function LanguageSwitcher({ collapsed = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors w-full",
        "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
      )}
    >
      <Languages className="w-4 h-4 flex-shrink-0" />
      {!collapsed && (
        <span>{i18n.language === 'en' ? 'Русский' : 'English'}</span>
      )}
    </button>
  );
}
