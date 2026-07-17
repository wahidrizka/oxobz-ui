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
        const { container } = render(<CopyButton text="hello" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('copyButtonIcon');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<CopyButton data-version="v2" text="hello" />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the Copy and Check icon layers inside a stack', () => {
        const { container } = render(<CopyButton text="hello" />);
        const layers = getLayers(container);
        expect(layers).toHaveLength(2);
        layers.forEach((layer) => expect(layer.className).toContain('icon'));
        expect(container.querySelectorAll('svg[data-testid="oxobz-icon"]')).toHaveLength(2);
    });

    // ── aria-label ──

    it('defaults aria-label to "copy text"', () => {
        const { container } = render(<CopyButton text="hello" />);
        expect(getRoot(container)).toHaveAttribute('aria-label', 'copy text');
    });

    it('allows a custom aria-label', () => {
        const { container } = render(<CopyButton aria-label="Copy code" text="hello" />);
        expect(getRoot(container)).toHaveAttribute('aria-label', 'Copy code');
    });

    // ── Icon state (uncontrolled) ──

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the Copy layer opaque and the Check layer as .initial before any interaction', () => {
        const { container } = render(<CopyButton text="hello" />);
        const [copyLayer, checkLayer] = getLayers(container);
        expect(copyLayer.className).not.toContain('hidden');
        expect(copyLayer.className).not.toContain('visible');
        expect(checkLayer.className).toContain('initial');
    });

    it('swaps to the Check layer after a click, then reverts after 2s', () => {
        const { container } = render(<CopyButton text="hello" />);
        const root = getRoot(container) as HTMLElement;

        fireEvent.click(root);
        const [copyLayer, checkLayer] = getLayers(container);
        expect(copyLayer.className).toContain('hidden');
        expect(checkLayer.className).toContain('visible');

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        const [copyLayerAfter, checkLayerAfter] = getLayers(container);
        expect(copyLayerAfter.className).toContain('visible');
        expect(checkLayerAfter.className).toContain('hidden');
    });

    // ── Copy behavior ──

    it('writes to the clipboard and calls onCopy with the text on click', () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });
        const onCopy = vi.fn();
        const { container } = render(<CopyButton onCopy={onCopy} text="npm install oxobz" />);
        fireEvent.click(getRoot(container) as HTMLElement);
        expect(writeText).toHaveBeenCalledWith('npm install oxobz');
        expect(onCopy).toHaveBeenCalledWith('npm install oxobz');
    });

    it('forwards the click handler passed by the consumer', () => {
        const onClick = vi.fn();
        const { container } = render(<CopyButton onClick={onClick} text="hello" />);
        fireEvent.click(getRoot(container) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    // ── Controlled copied ──

    it('uses the controlled copied prop instead of the internal timer', () => {
        const { container, rerender } = render(<CopyButton copied text="hello" />);
        // Before any interaction, the shown layer needs no animation class
        // and the hidden layer uses `.initial` (no entrance animation).
        const [copyLayer, checkLayer] = getLayers(container);
        expect(checkLayer.className).not.toContain('initial');
        expect(checkLayer.className).not.toContain('hidden');
        expect(copyLayer.className).toContain('initial');

        // Clicking marks interaction but does not flip the controlled state,
        // and no internal timer reverts it.
        fireEvent.click(getRoot(container) as HTMLElement);
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        const [copyLayerAfter, checkLayerAfter] = getLayers(container);
        expect(checkLayerAfter.className).toContain('visible');
        expect(copyLayerAfter.className).toContain('hidden');

        rerender(<CopyButton copied={false} text="hello" />);
        const [copyLayer2, checkLayer2] = getLayers(container);
        expect(checkLayer2.className).toContain('hidden');
        expect(copyLayer2.className).toContain('visible');
    });

    // ── Disabled state ──

    it('renders disabled and does not fire the click handler', () => {
        const onCopy = vi.fn();
        const { container } = render(<CopyButton disabled onCopy={onCopy} text="hello" />);
        const root = getRoot(container) as HTMLButtonElement;
        expect(root).toBeDisabled();
        fireEvent.click(root);
        expect(onCopy).not.toHaveBeenCalled();
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<CopyButton className="custom-copy" text="hello" />);
        const root = getRoot(container);
        expect(root?.className).toContain('copyButtonIcon');
        expect(root?.className).toContain('custom-copy');
        expect(root?.className.endsWith('custom-copy')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root button', () => {
        const ref = createRef<HTMLButtonElement>();
        render(<CopyButton ref={ref} text="hello" />);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current).toHaveAttribute('data-oxobz-copy-button');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, title)', () => {
        const { container } = render(<CopyButton id="copy-1" text="hello" title="Copy" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'copy-1');
        expect(root).toHaveAttribute('title', 'Copy');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(CopyButton.displayName).toBe('CopyButton');
    });
});
