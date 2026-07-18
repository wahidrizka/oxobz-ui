import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { computeMiddleTruncatedText, MiddleTruncate } from './MiddleTruncate';

/** Selects the component root span. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-middle-truncate]');
}

describe('MiddleTruncate', () => {
    // ── Rendering ──

    it('renders a root span with data-oxobz-middle-truncate and data-version="v1"', () => {
        const { container } = render(<MiddleTruncate value="hello-world" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('SPAN');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('wrapper');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <MiddleTruncate data-version="v2" value="hello-world" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the sizer, visible, and copySource spans in DOM order', () => {
        const { container } = render(<MiddleTruncate value="hello-world" />);
        const root = getRoot(container);
        const children = root?.children;
        expect(children).toHaveLength(3);
        expect(children?.[0]?.className).toContain('sizer');
        expect(children?.[1]?.className).toContain('visible');
        expect(children?.[2]?.className).toContain('copySource');
    });

    it('exposes the full value in the sizer and copySource spans, hidden from a11y', () => {
        const { container } = render(<MiddleTruncate value="hello-world" />);
        const root = getRoot(container);
        const [sizer, visible, copySource] = Array.from(root?.children ?? []);
        expect(sizer).toHaveAttribute('aria-hidden', 'true');
        expect(sizer?.textContent).toBe('hello-world');
        expect(copySource).toHaveAttribute('aria-hidden', 'true');
        expect(copySource?.textContent).toBe('hello-world');
        expect(visible).not.toHaveAttribute('aria-hidden');
    });

    it('renders the full value by default (no canvas measurement available in jsdom)', () => {
        const { container } = render(
            <MiddleTruncate value="feature/redesign-dashboard-navigation-with-sidebar-improvements" />,
        );
        const root = getRoot(container);
        const visible = root?.children[1];
        expect(visible?.textContent).toBe(
            'feature/redesign-dashboard-navigation-with-sidebar-improvements',
        );
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <MiddleTruncate className="custom-truncate" value="hello-world" />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('wrapper');
        expect(root?.className).toContain('custom-truncate');
        expect(root?.className.endsWith('custom-truncate')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<MiddleTruncate ref={ref} value="hello-world" />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).toHaveAttribute('data-oxobz-middle-truncate');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-label, style)', () => {
        const { container } = render(
            <MiddleTruncate
                aria-label="Branch name"
                id="truncate-1"
                style={{ maxWidth: '200px' }}
                value="hello-world"
            />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'truncate-1');
        expect(root).toHaveAttribute('aria-label', 'Branch name');
        expect(root).toHaveStyle({ maxWidth: '200px' });
    });

    // ── Copy behavior (middle-truncate.md, "Behavior") ──

    it('overrides the clipboard with the full value on copy', () => {
        const { container } = render(
            <MiddleTruncate value="dpl_8gmXTT1yJRP8UbGfXD7A3sp4RKhW" />,
        );
        const root = getRoot(container) as HTMLElement;
        const setData = vi.fn();
        const preventDefault = vi.fn();
        fireEvent.copy(root, {
            clipboardData: { setData },
            preventDefault,
        });
        expect(setData).toHaveBeenCalledWith(
            'text/plain',
            'dpl_8gmXTT1yJRP8UbGfXD7A3sp4RKhW',
        );
    });

    it('still calls a user-supplied onCopy handler', () => {
        const onCopy = vi.fn();
        const { container } = render(
            <MiddleTruncate onCopy={onCopy} value="hello-world" />,
        );
        const root = getRoot(container) as HTMLElement;
        fireEvent.copy(root, { clipboardData: { setData: vi.fn() } });
        expect(onCopy).toHaveBeenCalledTimes(1);
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(MiddleTruncate.displayName).toBe('MiddleTruncate');
    });
});

describe('computeMiddleTruncatedText', () => {
    // A stub measurer: width == string length (1 unit per character) keeps
    // the arithmetic easy to reason about and assert on.
    const measure = (text: string) => text.length;

    it('returns the full value when it already fits', () => {
        expect(computeMiddleTruncatedText('hello', measure, 10)).toBe('hello');
    });

    it('returns the full value when availableWidth is 0 or negative (unmeasured)', () => {
        expect(computeMiddleTruncatedText('hello-world', measure, 0)).toBe(
            'hello-world',
        );
        expect(computeMiddleTruncatedText('hello-world', measure, -5)).toBe(
            'hello-world',
        );
    });

    it('returns the value unchanged for single-character strings', () => {
        expect(computeMiddleTruncatedText('x', measure, 0)).toBe('x');
    });

    it('preserves the start and end of the string when it overflows', () => {
        const value = 'feature/redesign-dashboard-navigation-with-sidebar';
        const result = computeMiddleTruncatedText(value, measure, 20);
        expect(result.length).toBeLessThanOrEqual(20);
        expect(result).toContain('…');
        expect(result.startsWith(value.slice(0, 1))).toBe(true);
        expect(value.startsWith(result.split('…')[0] as string)).toBe(true);
        expect(value.endsWith(result.split('…')[1] as string)).toBe(true);
    });

    it('falls back to a bare ellipsis when even the ellipsis does not fit', () => {
        expect(computeMiddleTruncatedText('hello-world', measure, 0.5)).toBe('…');
    });

    it('never returns a candidate wider than availableWidth', () => {
        const value = 'STRIPE_WEBHOOK_SIGNING_SECRET';
        for (let width = 1; width <= value.length; width += 1) {
            const result = computeMiddleTruncatedText(value, measure, width);
            expect(measure(result)).toBeLessThanOrEqual(width);
        }
    });
});
