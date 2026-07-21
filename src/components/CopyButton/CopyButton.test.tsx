import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { CopyButton } from './CopyButton';

/** Selects the root button (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-copy-button]');
}

/** Selects the two icon layer spans: [0] = Copy, [1] = Check. */
function getLayers(container: HTMLElement) {
    return container.querySelectorAll('[data-oxobz-copy-button] > span > span');
}

describe('CopyButton', () => {
    // ── Rendering ──

    it('renders a root button with data-oxobz-copy-button and data-version="v1"', () => {
        const { container } = render(<CopyButton textToCopy="hello" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('copyButtonIcon');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<CopyButton data-version="v2" textToCopy="hello" />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the Copy and Check icon layers inside a stack', () => {
        const { container } = render(<CopyButton textToCopy="hello" />);
        const layers = getLayers(container);
        expect(layers).toHaveLength(2);
        layers.forEach((layer) => expect(layer.className).toContain('icon'));
        expect(container.querySelectorAll('svg[data-testid="oxobz-icon"]')).toHaveLength(2);
    });

    // ── aria-label ──

    it('defaults aria-label to "copy text"', () => {
        const { container } = render(<CopyButton textToCopy="hello" />);
        expect(getRoot(container)).toHaveAttribute('aria-label', 'copy text');
    });

    it('allows a custom aria-label', () => {
        const { container } = render(<CopyButton label="Copy code" textToCopy="hello" />);
        expect(getRoot(container)).toHaveAttribute('aria-label', 'Copy code');
    });

    // ── Icon state (uncontrolled) ──

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the Copy layer and hides the Check layer before any interaction', () => {
        const { container } = render(<CopyButton textToCopy="hello" />);
        const [copyLayer, checkLayer] = getLayers(container);
        expect(copyLayer.className).toContain('iconShown');
        expect(checkLayer.className).toContain('iconHidden');
    });

    it('swaps to the Check layer after a click, then reverts after 2s', () => {
        const { container } = render(<CopyButton textToCopy="hello" />);
        const root = getRoot(container) as HTMLElement;

        fireEvent.click(root);
        const [copyLayer, checkLayer] = getLayers(container);
        expect(copyLayer.className).toContain('iconHidden');
        expect(checkLayer.className).toContain('iconShown');

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        const [copyLayerAfter, checkLayerAfter] = getLayers(container);
        expect(copyLayerAfter.className).toContain('iconShown');
        expect(checkLayerAfter.className).toContain('iconHidden');
    });

    // ── Copy behavior ──

    it('writes to the clipboard and calls onCopy with the text on click', () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });
        const onCopy = vi.fn();
        const { container } = render(<CopyButton onCopy={onCopy} textToCopy="npm install oxobz" />);
        fireEvent.click(getRoot(container) as HTMLElement);
        expect(writeText).toHaveBeenCalledWith('npm install oxobz');
        expect(onCopy).toHaveBeenCalledWith('npm install oxobz');
    });

    it('forwards the click handler passed by the consumer', () => {
        const onClick = vi.fn();
        const { container } = render(<CopyButton onClick={onClick} textToCopy="hello" />);
        fireEvent.click(getRoot(container) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    // ── Controlled copied ──

    it('uses the controlled copied prop instead of the internal timer', () => {
        const { container, rerender } = render(<CopyButton copied textToCopy="hello" />);
        const [copyLayer, checkLayer] = getLayers(container);
        expect(checkLayer.className).toContain('iconShown');
        expect(copyLayer.className).toContain('iconHidden');

        // Clicking does not flip the controlled state, and no internal
        // timer reverts it.
        fireEvent.click(getRoot(container) as HTMLElement);
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        const [copyLayerAfter, checkLayerAfter] = getLayers(container);
        expect(checkLayerAfter.className).toContain('iconShown');
        expect(copyLayerAfter.className).toContain('iconHidden');

        rerender(<CopyButton copied={false} textToCopy="hello" />);
        const [copyLayer2, checkLayer2] = getLayers(container);
        expect(checkLayer2.className).toContain('iconHidden');
        expect(copyLayer2.className).toContain('iconShown');
    });

    // ── Disabled state ──

    it('renders disabled and does not fire the click handler', () => {
        const onCopy = vi.fn();
        const { container } = render(<CopyButton disabled onCopy={onCopy} textToCopy="hello" />);
        const root = getRoot(container) as HTMLButtonElement;
        expect(root).toBeDisabled();
        fireEvent.click(root);
        expect(onCopy).not.toHaveBeenCalled();
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<CopyButton className="custom-copy" textToCopy="hello" />);
        const root = getRoot(container);
        expect(root?.className).toContain('copyButtonIcon');
        expect(root?.className).toContain('custom-copy');
        expect(root?.className.endsWith('custom-copy')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root button', () => {
        const ref = createRef<HTMLButtonElement>();
        render(<CopyButton ref={ref} textToCopy="hello" />);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current).toHaveAttribute('data-oxobz-copy-button');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, title)', () => {
        const { container } = render(<CopyButton id="copy-1" textToCopy="hello" title="Copy" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'copy-1');
        expect(root).toHaveAttribute('title', 'Copy');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(CopyButton.displayName).toBe('CopyButton');
    });
});
