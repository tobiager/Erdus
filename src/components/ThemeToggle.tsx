import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import clsx from 'clsx';

export default function ThemeToggle({
  buttonClassName,
}: {
  buttonClassName?: string;
}) {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const icon = theme === 'light' ? <Sun size={18} /> : <Moon size={18} />;

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className={clsx(
        'inline-flex items-center justify-center rounded-full text-[#1280ff]',
        'focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none',
        buttonClassName,
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {icon}
    </button>
  );
}
