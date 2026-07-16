import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { Snippet, type SnippetType } from './Snippet';

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
    });
});

function getCopyButton() {
    return screen.getByRole('button', { name: 'Copy to clipboard' });
}

describe('Snippet', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-snippet and data-version="v1"', () => {
        const { container } = render(<Snippet text="npm init next-app" />);
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('snippet');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Snippet data-version="v2" text="x" />,
        );
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    it('renders a single string as one pre', () => {
        const { container } = render(<Snippet text="npm init next-app" />);
        const pres = container.querySelectorAll('pre');
        expect(pres).toHaveLength(1);
        expect(pres[0].textContent).toBe('npm init next-app');
    });

    it('renders an array as one pre per line (multi line)', () => {
        const { container } = render(<Snippet text={['cd project', 'now']} />);
        const pres = container.querySelectorAll('pre');
        expect(pres).toHaveLength(2);
        expect(pres[0].textContent).toBe('cd project');
        expect(pres[1].textContent).toBe('now');
    });

    // ── Prompt ──

    it('adds the prompt class by default', () => {
        const { container } = render(<Snippet text="x" />);
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).toContain('prompt');
    });

    it('omits the prompt class when prompt={false}', () => {
        const { container } = render(<Snippet prompt={false} text="x" />);
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).not.toContain('prompt');
    });

    // ── Dark (inverted) ──

    it('adds the dark class when dark', () => {
        const { container } = render(<Snippet dark text="x" />);
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).toContain('dark');
    });

    it('is not dark by default', () => {
        const { container } = render(<Snippet text="x" />);
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).not.toContain('dark');
    });

    // ── Type variants ──

    const allTypes: SnippetType[] = ['success', 'error', 'warning'];

    it.each(allTypes)('applies the %s type class', (type) => {
        const { container } = render(<Snippet text="x" type={type} />);
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).toContain(type);
    });

    it('applies no type class when type is omitted', () => {
        const { container } = render(<Snippet text="x" />);
        const root = container.querySelector('[data-oxobz-snippet]');
        allTypes.forEach((type) => {
            expect(root?.className).not.toContain(type);
        });
    });

    // ── Width (inline style) ──

    it('applies the width prop inline with height auto', () => {
        const { container } = render(<Snippet text="x" width="300px" />);
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root).toHaveStyle({ width: '300px', height: 'auto' });
    });

    // ── Placeholder ──

    it('shows the placeholder dimmed when text is empty', () => {
        const { container } = render(
            <Snippet placeholder="Run vercel link to fetch env vars" text="" />,
        );
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).toContain('isUsingPlaceholder');
        const pre = container.querySelector('pre');
        expect(pre?.textContent).toBe('Run vercel link to fetch env vars');
    });

    it('does not use the placeholder when text is present', () => {
        const { container } = render(
            <Snippet placeholder="Run vercel link" text="npm i" />,
        );
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).not.toContain('isUsingPlaceholder');
        expect(container.querySelector('pre')?.textContent).toBe('npm i');
    });

    // ── Copy behaviour ──

    it('copies the string text and fires onCopy with it', () => {
        const onCopy = vi.fn();
        render(<Snippet onCopy={onCopy} text="npm init next-app" />);
        fireEvent.click(getCopyButton());
        expect(writeText).toHaveBeenCalledWith('npm init next-app');
        expect(onCopy).toHaveBeenCalledWith('npm init next-app');
    });

    it('copies copyText instead of the displayed text when provided', () => {
        render(<Snippet copyText="real-payload" text="Display only" />);
        fireEvent.click(getCopyButton());
        expect(writeText).toHaveBeenCalledWith('real-payload');
    });

    it('joins array text with newlines for the clipboard', () => {
        render(<Snippet text={['cd project', 'now']} />);
        fireEvent.click(getCopyButton());
        expect(writeText).toHaveBeenCalledWith('cd project\nnow');
    });

    // ── Copied state (icon cross-fade) ──

    it('renders the copy icon visible and the check icon hidden initially', () => {
        const { container } = render(<Snippet text="x" />);
        const layers = container.querySelectorAll('span[class*="iconLayer"]');
        expect(layers).toHaveLength(2);
        // layer[0] = Check, layer[1] = Copy
        expect(layers[0].className).toContain('iconHidden');
        expect(layers[1].className).toContain('iconVisible');
    });

    it('shows the check icon after clicking (uncontrolled)', () => {
        const { container } = render(<Snippet text="x" />);
        fireEvent.click(getCopyButton());
        const layers = container.querySelectorAll('span[class*="iconLayer"]');
        expect(layers[0].className).toContain('iconVisible');
        expect(layers[1].className).toContain('iconHidden');
    });

    it('reverts the check icon after the reset delay (uncontrolled)', () => {
        vi.useFakeTimers();
        try {
            const { container } = render(<Snippet text="x" />);
            fireEvent.click(getCopyButton());
            let layers = container.querySelectorAll('span[class*="iconLayer"]');
            expect(layers[0].className).toContain('iconVisible');
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            layers = container.querySelectorAll('span[class*="iconLayer"]');
            expect(layers[0].className).toContain('iconHidden');
        } finally {
            vi.useRealTimers();
        }
    });

    it('drives the check icon from the copied prop (controlled)', () => {
        const { container } = render(<Snippet copied text="x" />);
        const layers = container.querySelectorAll('span[class*="iconLayer"]');
        expect(layers[0].className).toContain('iconVisible');
        expect(layers[1].className).toContain('iconHidden');
    });

    it('does not change the controlled copied state on click', () => {
        const { container } = render(<Snippet copied={false} text="x" />);
        fireEvent.click(getCopyButton());
        const layers = container.querySelectorAll('span[class*="iconLayer"]');
        // still driven by the prop → check stays hidden
        expect(layers[0].className).toContain('iconHidden');
        // but the copy still happened
        expect(writeText).toHaveBeenCalledWith('x');
    });

    // ── Icons ──

    it('renders both the check and copy icons', () => {
        const { container } = render(<Snippet text="x" />);
        expect(container.querySelectorAll('svg')).toHaveLength(2);
    });

    // ── Custom className ──

    it('appends custom className after the module classes', () => {
        const { container } = render(
            <Snippet className="custom-snip" text="x" />,
        );
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root?.className).toContain('snippet');
        expect(root?.className).toContain('custom-snip');
        expect(root?.className.endsWith('custom-snip')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Snippet ref={ref} text="x" />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-snippet');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes and merges inline style', () => {
        const { container } = render(
            <Snippet id="snip-1" style={{ marginTop: '4px' }} text="x" width="100px" />,
        );
        const root = container.querySelector('[data-oxobz-snippet]');
        expect(root).toHaveAttribute('id', 'snip-1');
        expect(root).toHaveStyle({
            width: '100px',
            height: 'auto',
            marginTop: '4px',
        });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Snippet.displayName).toBe('Snippet');
    });
});
