import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ThemeProvider } from '../../ThemeProvider';

type ChangeListener = (e: MediaQueryListEvent) => void;

/** jsdom has no window.matchMedia — ThemeProvider needs it to resolve 'system'. */
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

    vi.stubGlobal(
        'matchMedia',
        vi.fn().mockReturnValue(mediaQueryList),
    );

    return {
        setMatches(next: boolean) {
            matches = next;
        },
    };
}

/** Renders ThemeSwitcher wrapped in a real ThemeProvider (defaultTheme fixed for determinism). */
function renderSwitcher(
    props: Parameters<typeof ThemeSwitcher>[0] = {},
    defaultTheme: 'light' | 'dark' | 'system' = 'light',
) {
    return render(
        <ThemeProvider defaultTheme={defaultTheme}>
            <ThemeSwitcher {...props} />
        </ThemeProvider>,
    );
}

function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-theme-switcher]');
}

describe('ThemeSwitcher', () => {
    beforeEach(() => {
        mockMatchMedia(false);
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // ── Rendering ──

    it('renders a fieldset root with data-oxobz-theme-switcher and data-version="v1"', () => {
        const { container } = renderSwitcher();
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('FIELDSET');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('fieldset');
    });

    it('allows a custom data-version', () => {
        const { container } = renderSwitcher({ 'data-version': 'v2' });
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders a hidden legend describing the control', () => {
        renderSwitcher();
        expect(
            screen.getByText('Select a display theme:'),
        ).toBeInTheDocument();
    });

    it('renders exactly three radio options: system, light, dark', () => {
        renderSwitcher();
        expect(screen.getByRole('radio', { name: 'system' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'light' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'dark' })).toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    // ── Theme sync (reads from ThemeProvider) ──

    it('checks the radio matching the current theme (light default)', () => {
        renderSwitcher();
        expect(screen.getByRole('radio', { name: 'light' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'system' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'dark' })).not.toBeChecked();
    });

    it('checks "dark" when the provider defaultTheme is dark', () => {
        renderSwitcher({}, 'dark');
        expect(screen.getByRole('radio', { name: 'dark' })).toBeChecked();
    });

    it('checks "system" when the provider defaultTheme is system', () => {
        renderSwitcher({}, 'system');
        expect(screen.getByRole('radio', { name: 'system' })).toBeChecked();
    });

    // ── Interaction (writes to ThemeProvider) ──

    it('switches the checked option when a different one is clicked', () => {
        renderSwitcher();
        const darkRadio = screen.getByRole('radio', { name: 'dark' });
        fireEvent.click(darkRadio);
        expect(darkRadio).toBeChecked();
        expect(screen.getByRole('radio', { name: 'light' })).not.toBeChecked();
    });

    it('persists the new theme to localStorage', () => {
        renderSwitcher();
        fireEvent.click(screen.getByRole('radio', { name: 'system' }));
        expect(localStorage.getItem('oxobz-ui-theme')).toBe('system');
    });

    // ── small ──

    it('does not mark small on the fieldset by default', () => {
        const { container } = renderSwitcher();
        expect(getRoot(container)).not.toHaveAttribute('data-small');
    });

    it('marks data-small on the fieldset and each label when small is set', () => {
        const { container } = renderSwitcher({ small: true });
        expect(getRoot(container)).toHaveAttribute('data-small', '');
        const label = container.querySelector('label[for]');
        expect(label).toHaveAttribute('data-small', '');
    });

    // ── disabled ──

    it('disables every radio when disabled is set', () => {
        renderSwitcher({ disabled: true });
        expect(screen.getByRole('radio', { name: 'system' })).toBeDisabled();
        expect(screen.getByRole('radio', { name: 'light' })).toBeDisabled();
        expect(screen.getByRole('radio', { name: 'dark' })).toBeDisabled();
    });

    it('applies the disabled label class to every option', () => {
        const { container } = renderSwitcher({ disabled: true });
        const labels = container.querySelectorAll('label[for]');
        expect(labels).toHaveLength(3);
        labels.forEach((label) => expect(label.className).toContain('disabled'));
    });

    it('does not fire a theme change when a disabled option is clicked', () => {
        renderSwitcher({ disabled: true });
        const darkRadio = screen.getByRole('radio', { name: 'dark' });
        // React never invokes a disabled input's onChange handler (it guards
        // dispatch internally), so setTheme must not run — verified via the
        // persisted side effect rather than jsdom's native checked-state
        // mutation, which (unlike real browsers) does not itself honor
        // `disabled` on a bare fireEvent.click.
        fireEvent.click(darkRadio);
        expect(localStorage.getItem('oxobz-ui-theme')).toBeNull();
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = renderSwitcher({ className: 'custom-switcher' });
        const root = getRoot(container);
        expect(root?.className).toContain('fieldset');
        expect(root?.className).toContain('custom-switcher');
        expect(root?.className.endsWith('custom-switcher')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root fieldset', () => {
        const ref = createRef<HTMLFieldSetElement>();
        render(
            <ThemeProvider defaultTheme="light">
                <ThemeSwitcher ref={ref} />
            </ThemeProvider>,
        );
        expect(ref.current).toBeInstanceOf(HTMLFieldSetElement);
        expect(ref.current).toHaveAttribute('data-oxobz-theme-switcher');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-hidden)', () => {
        const { container } = renderSwitcher({ id: 'switcher-1', 'aria-hidden': 'true' });
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'switcher-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(ThemeSwitcher.displayName).toBe('ThemeSwitcher');
    });

    // ── Provider requirement ──

    it('throws when rendered outside a ThemeProvider', () => {
        // Swallow the expected React error-boundary console output for this case.
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<ThemeSwitcher />)).toThrow(
            'useTheme must be used within a ThemeProvider',
        );
        spy.mockRestore();
    });
});
