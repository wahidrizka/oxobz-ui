import { render } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { createRef } from 'react';
import { Kbd } from './Kbd';

/* ------------------------------------------------------------------ */
/*  Platform stubbing helpers                                          */
/* ------------------------------------------------------------------ */

function setPlatform(value: string): void {
    Object.defineProperty(window.navigator, 'platform', {
        configurable: true,
        value,
    });
}

afterEach(() => {
    // Restore the jsdom default (empty string → non-Apple via userAgent).
    setPlatform('');
});

describe('Kbd', () => {
    // ── Rendering ──

    it('renders a <kbd> element with data-oxobz-kbd and data-version="v1"', () => {
        const { container } = render(<Kbd>K</Kbd>);
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('KBD');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('kbd');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Kbd data-version="v2">K</Kbd>);
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    it('renders a single child key inside a span', () => {
        const { container } = render(<Kbd>/</Kbd>);
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root?.children).toHaveLength(1);
        const span = root?.firstElementChild;
        expect(span?.tagName).toBe('SPAN');
        expect(span?.textContent).toBe('/');
    });

    // ── Modifiers (glyphs, snapshot parity) ──

    it('renders the shift modifier as ⇧', () => {
        const { container } = render(<Kbd shift />);
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root?.textContent).toBe('⇧');
        expect(root?.children).toHaveLength(1);
    });

    it('renders the alt modifier as ⌥', () => {
        const { container } = render(<Kbd alt />);
        expect(container.querySelector('[data-oxobz-kbd]')?.textContent).toBe(
            '⌥',
        );
    });

    it('renders the ctrl modifier as ⌃', () => {
        const { container } = render(<Kbd ctrl />);
        expect(container.querySelector('[data-oxobz-kbd]')?.textContent).toBe(
            '⌃',
        );
    });

    // ── Meta modifier (platform-aware swap) ──

    it('renders meta as "Ctrl" on non-Apple platforms', () => {
        setPlatform('Win32');
        const { container } = render(<Kbd meta />);
        const span = container.querySelector('[data-oxobz-kbd] > span');
        expect(span?.textContent).toBe('Ctrl');
    });

    it('renders meta as ⌘ on Apple platforms', () => {
        setPlatform('MacIntel');
        const { container } = render(<Kbd meta />);
        const span = container.querySelector('[data-oxobz-kbd] > span');
        expect(span?.textContent).toBe('⌘');
    });

    it('gives the meta span an inline min-width so its glyph keeps a stable width', () => {
        const { container } = render(<Kbd meta />);
        const span = container.querySelector('[data-oxobz-kbd] > span');
        expect(span).toHaveStyle({
            minWidth: '1em',
            display: 'inline-block',
        });
    });

    // ── Combination ──

    it('renders modifiers in the fixed meta→shift→alt→ctrl order', () => {
        setPlatform('Win32');
        // Prop order is intentionally scrambled to prove the render order is fixed.
        const { container } = render(<Kbd ctrl shift alt meta />);
        const root = container.querySelector('[data-oxobz-kbd]');
        const parts = Array.from(root?.children ?? []).map(
            (el) => el.textContent,
        );
        expect(parts).toEqual(['Ctrl', '⇧', '⌥', '⌃']);
    });

    it('renders a modifier followed by the child key (⌘ then K)', () => {
        setPlatform('MacIntel');
        const { container } = render(<Kbd meta>K</Kbd>);
        const root = container.querySelector('[data-oxobz-kbd]');
        const parts = Array.from(root?.children ?? []).map(
            (el) => el.textContent,
        );
        expect(parts).toEqual(['⌘', 'K']);
    });

    // ── Size ──

    it('applies no size class by default', () => {
        const { container } = render(<Kbd>K</Kbd>);
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root?.className).not.toContain('small');
    });

    it('applies the small class', () => {
        const { container } = render(<Kbd small>/</Kbd>);
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root?.className).toContain('small');
    });

    // ── Custom className ──

    it('appends a custom className after the module classes', () => {
        const { container } = render(<Kbd className="custom-kbd">K</Kbd>);
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root?.className).toContain('kbd');
        expect(root?.className).toContain('custom-kbd');
        expect(root?.className.endsWith('custom-kbd')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the <kbd> element', () => {
        const ref = createRef<HTMLElement>();
        render(<Kbd ref={ref}>K</Kbd>);
        expect(ref.current).toBeInstanceOf(HTMLElement);
        expect(ref.current?.tagName).toBe('KBD');
        expect(ref.current).toHaveAttribute('data-oxobz-kbd');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes and inline style', () => {
        const { container } = render(
            <Kbd id="kbd-1" title="shortcut" style={{ marginTop: '8px' }}>
                K
            </Kbd>,
        );
        const root = container.querySelector('[data-oxobz-kbd]');
        expect(root).toHaveAttribute('id', 'kbd-1');
        expect(root).toHaveAttribute('title', 'shortcut');
        expect(root).toHaveStyle({ marginTop: '8px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Kbd.displayName).toBe('Kbd');
    });
});
