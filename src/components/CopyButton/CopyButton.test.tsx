import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { CopyButton } from './CopyButton';

/*
 * Behaviour under test is production's own, read from the live bundle
 * (10 Nov 2026): check mark for 1000ms after a successful copy, an error
 * toast (or onCopyError) after a failed one, onClick last in both cases.
 */

const toasts = vi.hoisted(() => ({ error: vi.fn(), message: vi.fn() }));
vi.mock('../Toast', () => ({ useToasts: () => toasts }));

const writeText = vi.fn<(text: string) => Promise<void>>();

/** Click and let the clipboard promise (then / catch / finally) settle. */
async function click(button: HTMLElement) {
    await act(async () => {
        fireEvent.click(button);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    });
}

const layers = (button: HTMLElement) =>
    Array.from(button.querySelectorAll<HTMLElement>('.icon')).map((layer) =>
        layer.classList.contains('iconShown') ? 'shown' : 'hidden',
    );

describe('CopyButton', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        writeText.mockReset().mockResolvedValue(undefined);
        toasts.error.mockClear();
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Rendering ──

    it('renders a square secondary button with the production markers', () => {
        render(<CopyButton label="copy text" textToCopy="lipsum" />);
        const button = screen.getByRole('button', { name: 'copy text' });
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('data-testid', 'copy/button');
        expect(button.className).toContain('secondary');
        expect(button.className).toContain('shape');
        expect(button.querySelector('.iconStack')).not.toBeNull();
    });

    it('has no accessible name unless `label` is given', () => {
        render(<CopyButton textToCopy="lipsum" />);
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
    });

    it('starts with the copy icon shown and the check hidden', () => {
        render(<CopyButton label="copy" textToCopy="lipsum" />);
        expect(layers(screen.getByRole('button'))).toEqual(['hidden', 'shown']);
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('passes variant, shape, size, title, disabled and className on to the button', () => {
        render(
            <CopyButton
                className="mine"
                disabled
                label="copy"
                shape="rounded"
                size="small"
                textToCopy="lipsum"
                title="Copy it"
                variant="tertiary"
            />,
        );
        const button = screen.getByRole('button');
        expect(button.className).toContain('tertiary');
        expect(button.className).toContain('rounded');
        expect(button.className).toContain('small');
        expect(button.className).toContain('mine');
        expect(button).toHaveAttribute('title', 'Copy it');
        expect(button).toBeDisabled();
    });

    it('renders a custom icon in place of the copy icon', () => {
        render(<CopyButton icon={<i data-testid="mine" />} label="copy" textToCopy="lipsum" />);
        expect(screen.getByTestId('mine').parentElement?.className).toContain('iconShown');
    });

    it('uses a CustomButton when custom colors are given', () => {
        render(<CopyButton label="copy" normal={{ foreground: 'red' }} textToCopy="lipsum" />);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-custom-button');
        expect(button.style.getPropertyValue('--button-custom-fg')).toBe('red');
    });

    it('forwards ref to the button', () => {
        const ref = createRef<HTMLButtonElement>();
        render(<CopyButton label="copy" ref={ref} textToCopy="lipsum" />);
        expect(ref.current).toBe(screen.getByRole('button'));
    });

    // ── Copying ──

    it('writes the text and shows the check mark for 1000ms', async () => {
        const onCopySuccess = vi.fn();
        render(<CopyButton label="copy" onCopySuccess={onCopySuccess} textToCopy="lipsum" />);
        const button = screen.getByRole('button', { name: 'copy' });
        await click(button);
        expect(writeText).toHaveBeenCalledWith('lipsum');
        expect(onCopySuccess).toHaveBeenCalledTimes(1);
        expect(layers(button)).toEqual(['shown', 'hidden']);
        expect(screen.getByRole('status')).toHaveTextContent('Copied!');
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(layers(button)).toEqual(['shown', 'hidden']);
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(layers(button)).toEqual(['hidden', 'shown']);
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('announces a custom `copiedLabel`', async () => {
        render(<CopyButton copiedLabel="Token copied" label="copy" textToCopy="lipsum" />);
        await click(screen.getByRole('button', { name: 'copy' }));
        expect(screen.getByRole('status')).toHaveTextContent('Token copied');
    });

    it('shows the error toast when the copy fails', async () => {
        writeText.mockRejectedValue(new Error('denied'));
        render(<CopyButton label="copy" textToCopy="lipsum" />);
        const button = screen.getByRole('button');
        await click(button);
        expect(toasts.error).toHaveBeenCalledWith('Failed to copy to clipboard');
        expect(layers(button)).toEqual(['hidden', 'shown']);
    });

    it('calls onCopyError instead of the toast when given', async () => {
        const error = new Error('denied');
        writeText.mockRejectedValue(error);
        const onCopyError = vi.fn();
        render(<CopyButton label="copy" onCopyError={onCopyError} textToCopy="lipsum" />);
        await click(screen.getByRole('button'));
        expect(onCopyError).toHaveBeenCalledWith(error);
        expect(toasts.error).not.toHaveBeenCalled();
    });

    it('fails the same way when there is no Clipboard API', async () => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
        render(<CopyButton label="copy" textToCopy="lipsum" />);
        await click(screen.getByRole('button'));
        expect(toasts.error).toHaveBeenCalledWith('Failed to copy to clipboard');
    });

    it('calls onClick after the copy, whether it worked or not', async () => {
        const onClick = vi.fn();
        render(<CopyButton label="copy" onClick={onClick} textToCopy="lipsum" />);
        await click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
        writeText.mockRejectedValue(new Error('denied'));
        await click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    // ── Forced state ──

    it('shows the check mark while `copied` is true', () => {
        const { rerender } = render(<CopyButton copied label="copy" textToCopy="lipsum" />);
        const button = screen.getByRole('button', { name: 'copy' });
        expect(layers(button)).toEqual(['shown', 'hidden']);
        expect(screen.getByRole('status')).toHaveTextContent('Copied!');
        rerender(<CopyButton copied={false} label="copy" textToCopy="lipsum" />);
        expect(layers(button)).toEqual(['hidden', 'shown']);
    });

    it('has the correct displayName', () => {
        expect(CopyButton.displayName).toBe('CopyButton');
    });
});
