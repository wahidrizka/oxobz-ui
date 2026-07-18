import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { ShowMore } from './ShowMore';

/** Selects the root row (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-show-more]');
}

/** Selects the trigger button. */
function getTrigger(container: HTMLElement) {
    return container.querySelector('[data-oxobz-show-more-trigger]');
}

describe('ShowMore', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-show-more and data-version="v1"', () => {
        const { container } = render(<ShowMore />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('expandToggle');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<ShowMore data-version="v2" />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders two divider lines flanking the button container', () => {
        const { container } = render(<ShowMore />);
        const lines = container.querySelectorAll('[data-line="true"]');
        expect(lines).toHaveLength(2);
        lines.forEach((line) => expect(line.className).toContain('line'));
    });

    it('renders a trigger button of type="button"', () => {
        const { container } = render(<ShowMore />);
        const trigger = getTrigger(container);
        expect(trigger).toBeInTheDocument();
        expect(trigger?.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
    });

    // ── expanded (default false → "Show More") ──

    it('shows "Show More" and aria-expanded="false" by default', () => {
        const { container } = render(<ShowMore />);
        const trigger = getTrigger(container);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByText('Show More')).toBeInTheDocument();
    });

    it('shows "Show Less" and aria-expanded="true" when expanded', () => {
        const { container } = render(<ShowMore expanded />);
        const trigger = getTrigger(container);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Show Less')).toBeInTheDocument();
    });

    it('rotates the chevron only when expanded', () => {
        const { container: collapsed } = render(<ShowMore />);
        const collapsedChevron = collapsed.querySelector('span[class*="chevron"]');
        expect(collapsedChevron?.className).not.toContain('expanded');

        const { container: expanded } = render(<ShowMore expanded />);
        const expandedChevron = expanded.querySelector('span[class*="chevron"]');
        expect(expandedChevron?.className).toContain('expanded');
    });

    // ── noBorder ──

    it('applies the noBorder modifier class to the root when set', () => {
        const { container } = render(<ShowMore noBorder />);
        const root = getRoot(container);
        expect(root?.className).toContain('noBorder');
    });

    it('does not apply noBorder by default', () => {
        const { container } = render(<ShowMore />);
        const root = getRoot(container);
        expect(root?.className).not.toContain('noBorder');
    });

    // ── onClick ──

    it('calls onClick when the trigger button is clicked', () => {
        const handleClick = vi.fn();
        const { container } = render(<ShowMore onClick={handleClick} />);
        const trigger = getTrigger(container);
        fireEvent.click(trigger as Element);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<ShowMore className="custom-toggle" />);
        const root = getRoot(container);
        expect(root?.className).toContain('expandToggle');
        expect(root?.className).toContain('custom-toggle');
        expect(root?.className.endsWith('custom-toggle')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<ShowMore ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-show-more');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-hidden, style) to the root', () => {
        const { container } = render(
            <ShowMore aria-hidden="true" id="show-more-1" style={{ marginTop: '4px' }} />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'show-more-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(ShowMore.displayName).toBe('ShowMore');
    });
});
