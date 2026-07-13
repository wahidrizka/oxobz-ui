import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';

const DEFAULT_STORAGE_KEY = 'oxobz-ui-theme';

type ChangeListener = (e: MediaQueryListEvent) => void;

/**
 * jsdom does not implement window.matchMedia, so we install a controllable
 * mock. `setMatches` flips the current value and fires all registered
 * 'change' listeners, simulating a system theme change.
 */
function mockMatchMedia(initialMatches: boolean) {
    let matches = initialMatches;
    const listeners = new Set<ChangeListener>();

    const mediaQueryList = {
        get matches() {
            return matches;
        },
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn((event: string, listener: ChangeListener) => {
            if (event === 'change') listeners.add(listener);
        }),
        removeEventListener: vi.fn((event: string, listener: ChangeListener) => {
            if (event === 'change') listeners.delete(listener);
        }),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    };

    const matchMediaFn = vi.fn().mockReturnValue(mediaQueryList);
    vi.stubGlobal('matchMedia', matchMediaFn);

    return {
        mediaQueryList,
        setMatches(next: boolean) {
            matches = next;
            act(() => {
                listeners.forEach((listener) =>
                    listener({ matches: next } as MediaQueryListEvent),
                );
            });
        },
    };
}

/** Test consumer exposing the context value and setTheme triggers. */
function ThemeConsumer() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="resolved">{resolvedTheme}</span>
            <button onClick={() => setTheme('light')}>set-light</button>
            <button onClick={() => setTheme('dark')}>set-dark</button>
            <button onClick={() => setTheme('system')}>set-system</button>
        </div>
    );
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    // ── Rendering ──

    it('renders children', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider>
                <span>child content</span>
            </ThemeProvider>,
        );
        expect(screen.getByText('child content')).toBeInTheDocument();
    });

    // ── Default theme ──

    it('defaults to "system" when no defaultTheme and no stored value', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('respects defaultTheme="dark"', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="dark">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('respects defaultTheme="light"', () => {
        mockMatchMedia(true);
        render(
            <ThemeProvider defaultTheme="light">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('reads stored theme from default storage key on init', () => {
        mockMatchMedia(false);
        localStorage.setItem(DEFAULT_STORAGE_KEY, 'dark');
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('falls back to "system" when stored value is invalid', () => {
        mockMatchMedia(false);
        localStorage.setItem(DEFAULT_STORAGE_KEY, 'neon');
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('defaultTheme prop takes precedence over stored theme', () => {
        mockMatchMedia(false);
        localStorage.setItem(DEFAULT_STORAGE_KEY, 'dark');
        render(
            <ThemeProvider defaultTheme="light">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    // ── setTheme ──

    it('setTheme("dark") updates theme, resolvedTheme, and data-theme on documentElement', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="light">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-dark'));
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('setTheme("light") updates theme, resolvedTheme, and data-theme on documentElement', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="dark">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-light'));
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    // ── Persistence ──

    it('setTheme persists to localStorage under the default storage key', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="light">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-dark'));
        expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).toBe('dark');
    });

    it('setTheme persists to localStorage under a custom storageKey', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="light" storageKey="my-app-theme">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-dark'));
        expect(localStorage.getItem('my-app-theme')).toBe('dark');
        expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
    });

    it('round-trips theme through a custom storageKey (write via setTheme, read on init)', () => {
        mockMatchMedia(false);
        const { unmount } = render(
            <ThemeProvider defaultTheme="light" storageKey="my-app-theme">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-dark'));
        expect(localStorage.getItem('my-app-theme')).toBe('dark');
        unmount();

        // A fresh mount with the same custom storageKey restores the value.
        render(
            <ThemeProvider storageKey="my-app-theme">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    // ── System theme ──

    it('resolves "system" to dark when matchMedia matches', () => {
        mockMatchMedia(true);
        render(
            <ThemeProvider defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('system');
        expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('resolves "system" to light when matchMedia does not match', () => {
        mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('registers a change listener on the media query when theme is "system"', () => {
        const { mediaQueryList } = mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
            'change',
            expect.any(Function),
        );
    });

    it('does not register a change listener when theme is not "system"', () => {
        const { mediaQueryList } = mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="dark">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(mediaQueryList.addEventListener).not.toHaveBeenCalled();
    });

    it('follows system theme changes while theme is "system"', () => {
        const media = mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');

        media.setMatches(true);
        expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

        media.setMatches(false);
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('removes the change listener when switching away from "system"', () => {
        const { mediaQueryList } = mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-dark'));
        expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
            'change',
            expect.any(Function),
        );
    });

    it('stops following system changes after an explicit theme is set', () => {
        const media = mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-light'));
        media.setMatches(true);
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('resumes following system changes after setTheme("system")', () => {
        const media = mockMatchMedia(false);
        render(
            <ThemeProvider defaultTheme="dark">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        fireEvent.click(screen.getByText('set-system'));
        expect(screen.getByTestId('resolved')).toHaveTextContent('light');

        media.setMatches(true);
        expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    });

    it('removes the change listener on unmount', () => {
        const { mediaQueryList } = mockMatchMedia(false);
        const { unmount } = render(
            <ThemeProvider defaultTheme="system">
                <ThemeConsumer />
            </ThemeProvider>,
        );
        unmount();
        expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
            'change',
            expect.any(Function),
        );
    });
});

describe('useTheme', () => {
    it('throws when used outside a ThemeProvider', () => {
        // Silence React's error boundary logging for the expected throw
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        expect(() => render(<ThemeConsumer />)).toThrow(
            'useTheme must be used within a ThemeProvider',
        );
        consoleError.mockRestore();
    });
});
