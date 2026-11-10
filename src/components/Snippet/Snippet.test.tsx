import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { Snippet } from './Snippet';

/* Structure and behaviour follow production's own source (10 Nov 2026). */

const toasts = vi.hoisted(() => ({ error: vi.fn(), message: vi.fn() }));
vi.mock('../Toast', () => ({ useToasts: () => toasts }));

const writeText = vi.fn<(text: string) => Promise<void>>();

async function click(button: HTMLElement) {
    await act(async () => {
        fireEvent.click(button);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    });
}

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('Snippet', () => {
    beforeEach(() => {
        writeText.mockReset().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    });

    // ── Rendering ──

    it('renders the root with the production markers, the prompt and one line', () => {
        const { container } = render(<Snippet text="npm init next-app" />);
        const el = root(container);
        expect(el.tagName).toBe('DIV');
        expect(el).toHaveAttribute('data-oxobz-snippet', '');
        expect(el).toHaveAttribute('data-version', 'v1');
        expect(el.className).toBe('snippet prompt');
        expect(el.style.height).toBe('auto');
        expect(el.style.width).toBe('');
        const lines = el.querySelectorAll('pre');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toHaveTextContent('npm init next-app');
        expect(lines[0].className).toBe('line');
        expect(lines[0]).not.toHaveAttribute('style');
    });

    it('renders one <pre> per line for an array', () => {
        const { container } = render(<Snippet text={['cd project', 'npm install']} />);
        const lines = container.querySelectorAll('pre');
        expect(lines).toHaveLength(2);
        expect(lines[1]).toHaveTextContent('npm install');
    });

    it('applies width, compact, dark, type and prompt={false}', () => {
        const { container } = render(
            <Snippet compact dark prompt={false} text="ls" type="error" width="300px" />,
        );
        const el = root(container);
        expect(el.className).toBe('snippet dark error');
        expect(el.style.width).toBe('300px');
        expect(el.style.height).toBe('36px');
        const line = el.querySelector('pre');
        expect(line?.style.height).toBe('36px');
        expect(line?.style.lineHeight).toBe('1');
    });

    it.each(['success', 'error', 'warning'] as const)('adds the %s type class', (type) => {
        const { container } = render(<Snippet text="ls" type={type} />);
        expect(root(container).className).toBe(`snippet prompt ${type}`);
    });

    it('shows the placeholder, dimmed, only while there is no text', () => {
        const { container, rerender } = render(<Snippet placeholder="your command" />);
        expect(root(container).className).toContain('isUsingPlaceholder');
        expect(container.querySelector('pre')).toHaveTextContent('your command');
        rerender(<Snippet placeholder="your command" text="ls" />);
        expect(root(container).className).not.toContain('isUsingPlaceholder');
        expect(container.querySelector('pre')).toHaveTextContent('ls');
    });

    it('appends className, forwards attributes and merges style', () => {
        const { container } = render(
            <Snippet aria-label="Install" className="mine" style={{ height: '50px' }} text="ls" />,
        );
        const el = root(container);
        expect(el.className).toBe('snippet prompt mine');
        expect(el).toHaveAttribute('aria-label', 'Install');
        expect(el.style.height).toBe('50px');
    });

    it('forwards ref to the root', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<Snippet ref={ref} text="ls" />);
        expect(ref.current).toBe(root(container));
    });

    // ── Copy button ──

    it('holds a small square CopyButton in its own wrapper, after the lines', () => {
        const { container } = render(<Snippet text="ls" />);
        const wrapper = root(container).lastElementChild as HTMLElement;
        expect(wrapper.tagName).toBe('DIV');
        expect(wrapper.className).toBe('copy');
        const button = screen.getByRole('button', { name: 'Copy to clipboard' });
        expect(button.parentElement).toBe(wrapper);
        expect(button).toHaveAttribute('data-testid', 'copy/button');
        expect(button.className).toContain('copyButton');
        expect(button.className).toContain('small');
        expect(button.className).toContain('secondary');
        expect(button).not.toBeDisabled();
    });

    it('hides the copy button with icon={false} and disables it with notFocusable', () => {
        const { rerender } = render(<Snippet icon={false} text="ls" />);
        expect(screen.queryByRole('button')).toBeNull();
        rerender(<Snippet notFocusable text="ls" />);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('copies the text, joining lines with a newline', async () => {
        const onCopy = vi.fn();
        const { rerender } = render(<Snippet onCopy={onCopy} text="npm init next-app" />);
        await click(screen.getByRole('button'));
        expect(writeText).toHaveBeenLastCalledWith('npm init next-app');
        expect(onCopy).toHaveBeenCalledTimes(1);
        expect(onCopy).toHaveBeenCalledWith();
        rerender(<Snippet onCopy={onCopy} text={['cd project', 'npm install']} />);
        await click(screen.getByRole('button'));
        expect(writeText).toHaveBeenLastCalledWith('cd project\nnpm install');
    });

    it('copies `copyText` instead when given, and nothing useful for JSX text', async () => {
        const { rerender } = render(<Snippet copyText="secret" text="shown" />);
        await click(screen.getByRole('button'));
        expect(writeText).toHaveBeenLastCalledWith('secret');
        rerender(<Snippet text={<b>bold</b>} />);
        await click(screen.getByRole('button'));
        expect(writeText).toHaveBeenLastCalledWith('');
    });

    it('passes `copied` on to the copy button', () => {
        render(<Snippet copied text="ls" />);
        expect(screen.getByRole('status')).toHaveTextContent('Copied!');
    });

    it('has the correct displayName', () => {
        expect(Snippet.displayName).toBe('Snippet');
    });
});
