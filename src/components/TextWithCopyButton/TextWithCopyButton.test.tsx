import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef, type ReactElement } from 'react';
import { Check, Copy } from '@oxobz/icons';
import { TextWithCopyButton } from './TextWithCopyButton';

/*
 * The toast system is a separate component with its own tests; here it is a
 * spy so the assertions stay about THIS control: what it sends, and when.
 */
const toasts = vi.hoisted(() => ({
    message: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
}));
vi.mock('../Toast', () => ({ useToasts: () => toasts }));

/** Selects the root button. Production's root carries no marker attribute. */
function getRoot(container: HTMLElement) {
    return container.querySelector('button');
}

function getLabel(container: HTMLElement) {
    return container.querySelector('button > div > :first-child');
}

/** The single icon layer the Swap keeps mounted, if any. */
function getState(container: HTMLElement) {
    return container.querySelector('[data-phase]');
}

/** Path data of an icon as this test environment renders it. */
function pathOf(icon: ReactElement) {
    const { container, unmount } = render(icon);
    const d = container.querySelector('path')?.getAttribute('d') ?? '';
    unmount();
    return d;
}

/** Which icon a layer holds, matched against real renders of Copy and Check. */
function iconOf(layer: Element | null) {
    const d = layer?.querySelector('path')?.getAttribute('d') ?? '';
    if (d === pathOf(<Copy size={16} />)) return 'copy';
    if (d === pathOf(<Check size={16} />)) return 'check';
    return 'unknown';
}

const baseProps = {
    textToCopy: 'lipsum',
    textLabel: 'Copy',
    successMessage: 'Copied to clipboard',
};

/** Resolves the clipboard promise chain queued by a click. */
async function flush() {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
}

describe('TextWithCopyButton', () => {
    let writeText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });
        toasts.message.mockClear();
        toasts.error.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Rendering ──

    it('renders a plain root button with no marker or version attribute', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('type', 'button');
        expect(root?.className).toContain('button');
        expect(root).not.toHaveAttribute('data-oxobz-text-with-copy-button');
        expect(root).not.toHaveAttribute('data-version');
    });

    it('renders the label as a <p> by default and honours `as`', () => {
        const { container, rerender } = render(<TextWithCopyButton {...baseProps} />);
        expect(getLabel(container)?.tagName).toBe('P');
        expect(getLabel(container)?.textContent).toBe('Copy');
        rerender(<TextWithCopyButton {...baseProps} as="span" />);
        expect(getLabel(container)?.tagName).toBe('SPAN');
    });

    it('puts `style` on the label, not on the button', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} style={{ fontWeight: 600 }} />);
        expect(getLabel(container)).toHaveStyle({ fontWeight: 600 });
        expect(getRoot(container)).not.toHaveAttribute('style');
    });

    it('mounts only the copy icon at rest, entered and without data-enter', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        expect(container.querySelectorAll('[data-phase]')).toHaveLength(1);
        const state = getState(container);
        expect(state).toHaveAttribute('data-phase', 'entered');
        expect(state).not.toHaveAttribute('data-enter');
        expect(iconOf(state)).toBe('copy');
        expect(container.querySelectorAll('svg')).toHaveLength(1);
    });

    it('renders nothing without textToCopy, as production does', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} textToCopy="" />);
        expect(container.firstChild).toBeNull();
    });

    // ── ellipsis ──

    it('applies the ellipsis class only when ellipsis is set', () => {
        const { container, rerender } = render(<TextWithCopyButton {...baseProps} />);
        expect(getLabel(container)?.className).not.toContain('ellipsis');
        rerender(<TextWithCopyButton {...baseProps} ellipsis />);
        expect(getLabel(container)?.className).toContain('ellipsis');
    });

    // ── Copy behaviour ──

    it('writes to the clipboard and toasts successMessage; the label never changes', async () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        fireEvent.click(getRoot(container) as HTMLElement);
        expect(writeText).toHaveBeenCalledWith('lipsum');
        await flush();
        expect(toasts.message).toHaveBeenCalledWith('Copied to clipboard');
        expect(toasts.error).not.toHaveBeenCalled();
        expect(getLabel(container)?.textContent).toBe('Copy');
    });

    it('toasts the failure message when the clipboard write rejects', async () => {
        writeText.mockRejectedValue(new Error('denied'));
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        fireEvent.click(getRoot(container) as HTMLElement);
        await flush();
        expect(toasts.error).toHaveBeenCalledWith('Failed to copy to clipboard');
        expect(toasts.message).not.toHaveBeenCalled();
    });

    it('swaps copy -> check (exit first, then mount) and back after 1s', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        fireEvent.click(getRoot(container) as HTMLElement);

        // The copy layer is exiting; the check layer has not mounted yet.
        let state = getState(container);
        expect(iconOf(state)).toBe('copy');
        expect(state).toHaveAttribute('data-phase', 'exiting');
        expect(state).toHaveAttribute('data-enter', 'animate');
        expect(container.querySelectorAll('[data-phase]')).toHaveLength(1);

        // Exit settles (400ms fallback in jsdom); the check layer enters.
        act(() => {
            vi.advanceTimersByTime(400);
        });
        state = getState(container);
        expect(iconOf(state)).toBe('check');
        expect(state).toHaveAttribute('data-phase', 'entered');
        expect(state).toHaveAttribute('data-enter', 'animate');

        // 1s after the click the check layer starts leaving.
        act(() => {
            vi.advanceTimersByTime(600);
        });
        state = getState(container);
        expect(iconOf(state)).toBe('check');
        expect(state).toHaveAttribute('data-phase', 'exiting');

        act(() => {
            vi.advanceTimersByTime(400);
        });
        state = getState(container);
        expect(iconOf(state)).toBe('copy');
        expect(state).toHaveAttribute('data-phase', 'entered');
        expect(state).toHaveAttribute('data-enter', 'animate');
    });

    it('restarts the 1s window when clicked again while copied', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} />);
        const root = getRoot(container) as HTMLElement;
        fireEvent.click(root);
        act(() => {
            vi.advanceTimersByTime(800);
        });
        fireEvent.click(root);
        act(() => {
            vi.advanceTimersByTime(800);
        });
        // 1.6s after the first click but only 0.8s after the second: still the check icon.
        expect(iconOf(getState(container))).toBe('check');
    });

    it('forwards the click handler passed by the consumer', () => {
        const onClick = vi.fn();
        const { container } = render(<TextWithCopyButton {...baseProps} onClick={onClick} />);
        fireEvent.click(getRoot(container) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    // ── Tooltip ──

    it('renders the row directly unless showTooltip is set', () => {
        const { container, rerender } = render(<TextWithCopyButton {...baseProps} />);
        expect(getRoot(container)?.firstElementChild?.className).toContain('row');
        rerender(<TextWithCopyButton {...baseProps} showTooltip />);
        expect(getRoot(container)?.firstElementChild?.className).not.toContain('row');
        expect(container.querySelector('button [class*="row"]')).toBeInTheDocument();
    });

    // ── Disabled state ──

    it('renders disabled and does not copy', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} disabled />);
        const root = getRoot(container) as HTMLButtonElement;
        expect(root).toBeDisabled();
        fireEvent.click(root);
        expect(writeText).not.toHaveBeenCalled();
    });

    // ── Custom className, ref, prop forwarding, displayName ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} className="custom-text-copy" />);
        const root = getRoot(container);
        expect(root?.className).toContain('button');
        expect(root?.className.endsWith('custom-text-copy')).toBe(true);
    });

    it('forwards ref to the root button', () => {
        const ref = createRef<HTMLButtonElement>();
        const { container } = render(<TextWithCopyButton {...baseProps} ref={ref} />);
        expect(ref.current).toBe(getRoot(container));
    });

    it('forwards extra HTML attributes (id, title)', () => {
        const { container } = render(<TextWithCopyButton {...baseProps} id="text-copy-1" title="Copy" />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'text-copy-1');
        expect(root).toHaveAttribute('title', 'Copy');
    });

    it('has the correct displayName', () => {
        expect(TextWithCopyButton.displayName).toBe('TextWithCopyButton');
    });
});
