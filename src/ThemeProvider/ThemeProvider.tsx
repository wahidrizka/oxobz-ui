import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'oxobz-ui-theme';

function getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
}

function resolveTheme(theme: Theme): ResolvedTheme {
    if (theme === 'system') return getSystemTheme();
    return theme;
}

export interface ThemeProviderProps {
    children: ReactNode;
    /** Initial theme. Defaults to stored preference or 'system'. */
    defaultTheme?: Theme;
    /** Storage key for persisting theme. Defaults to 'oxobz-ui-theme'. */
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme,
    storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        return defaultTheme ?? getStoredTheme();
    });

    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
        return resolveTheme(theme);
    });

    const setTheme = useCallback(
        (newTheme: Theme) => {
            setThemeState(newTheme);
            localStorage.setItem(storageKey, newTheme);
        },
        [storageKey],
    );

    // Update resolved theme when theme changes
    useEffect(() => {
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);
        document.documentElement.setAttribute('data-theme', resolved);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? 'dark' : 'light';
            setResolvedTheme(resolved);
            document.documentElement.setAttribute('data-theme', resolved);
        };

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
