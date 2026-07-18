import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { TextWithCopyButton } from './TextWithCopyButton';

/** Selects the root button (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-text-with-copy-button]');
}

/** Selects the label <p>. */
function getLabel(container: HTMLElement) {
    return container.querySelector('[data-oxobz-text-with-copy-button] p');
}

/** Selects the two icon layer spans: [0] = Copy, [1] = Check. */
function getLayers(container: HTMLElement) {
    return container.querySelectorAll('[data-oxobz-text-with-copy-button] span > span > span');
}

const baseProps = {
    textToCopy: 'lipsum',
    textLabel: 'Copy',
    successMessage: 'Copied to clipboard',
};

describe('TextWithCopyButton', () => {
    // ── Rendering ──

    it('renders a root button with data-oxobz-text-with-copy-button and data-version="v1"', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('button');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <TextWithCopyButton {...baseProps} data-version="v2" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the textLabel by default', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        expect(getLabel(container)?.textContent).toBe('Copy');
    });

    it('renders the Copy and Check icon layers inside a stack', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        const layers = getLayers(container);
        expect(layers).toHaveLength(2);
        layers.forEach((layer) => expect(layer.className).toContain('icon'));
        expect(container.querySelectorAll('svg[data-testid="oxobz-icon"]')).toHaveLength(2);
    });

    // ── ellipsis variant ──

    it('does not apply the ellipsis class by default', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        expect(getLabel(container)?.className).not.toContain('labelEllipsis');
    });

    it('applies the ellipsis class when ellipsis is set', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} ellipsis />);
        expect(getLabel(container)?.className).toContain('labelEllipsis');
    });

    // ── Copy behavior (uncontrolled) ──

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the Copy layer opaque and the Check layer as .initial before any interaction', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        const [copyLayer, checkLayer] = getLayers(container);
        expect(copyLayer.className).not.toContain('hidden');
        expect(copyLayer.className).not.toContain('visible');
        expect(checkLayer.className).toContain('initial');
    });

    it('writes to the clipboard and swaps to successMessage + Check layer after a click, then reverts after 2s', () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });
        const onCopy = vi.fn();
        const { container } = render(<TextWithCopyButton {...baseProps} onCopy={onCopy} />);
        const root = getRoot(container) as HTMLElement;

        fireEvent.click(root);
        expect(writeText).toHaveBeenCalledWith('lipsum');
        expect(onCopy).toHaveBeenCalledWith('lipsum');
        expect(getLabel(container)?.textContent).toBe('Copied to clipboard');
        const [copyLayer, checkLayer] = getLayers(container);
        expect(copyLayer.className).toContain('hidden');
        expect(checkLayer.className).toContain('visible');

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(getLabel(container)?.textContent).toBe('Copy');
        const [copyLayerAfter, checkLayerAfter] = getLayers(container);
        expect(copyLayerAfter.className).toContain('visible');
        expect(checkLayerAfter.className).toContain('hidden');
    });

    it('forwards the click handler passed by the consumer', () => {
        const onClick = vi.fn();
        const { container } = render(<TextWithCopyButton {...baseProps} onClick={onClick} />);
        fireEvent.click(getRoot(container) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    // ── Controlled copied ──

    it('uses the controlled copied prop instead of the internal timer', () => {
        const { container, rerender } = render(<TextWithCopyButton {...baseProps} copied />);
        expect(getLabel(container)?.textContent).toBe('Copied to clipboard');

        fireEvent.click(getRoot(container) as HTMLElement);
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(getLabel(container)?.textContent).toBe('Copied to clipboard');

        rerender(<TextWithCopyButton {...baseProps} copied={false} />);
        expect(getLabel(container)?.textContent).toBe('Copy');
    });

    // ── Disabled state ──

    it('renders disabled and does not fire the click handler', () => {
        const onCopy = vi.fn();
        const { container } = render(<TextWithCopyButton {...baseProps} disabled onCopy={onCopy} />);
        const root = getRoot(container) as HTMLButtonElement;
        expect(root).toBeDisabled();
        fireEvent.click(root);
        expect(onCopy).not.toHaveBeenCalled();
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} className="custom-text-copy" />);
        const root = getRoot(container);
        expect(root?.className).toContain('button');
        expect(root?.className).toContain('custom-text-copy');
        expect(root?.className.endsWith('custom-text-copy')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root button', () => {
        const ref = createRef<HTMLButtonElement>();
        render(<TextWithCopyButton {...baseProps} ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current).toHaveAttribute('data-oxobz-text-with-copy-button');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, title)', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} id="text-copy-1" title="Copy" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'text-copy-1');
        expect(root).toHaveAttribute('title', 'Copy');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(TextWithCopyButton.displayName).toBe('TextWithCopyButton');
    });
});
