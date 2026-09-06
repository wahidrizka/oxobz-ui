import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Code } from './Code';

/** Selects the root pre element (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('pre');
}

/** Selects the inner code element. */
function getCode(container: HTMLElement) {
    return container.querySelector('pre > code');
}

describe('Code', () => {
    // ── Rendering ──

    it('renders a root pre with the module class and no marker attributes', () => {
        const { container } = render(<Code>const a = 1;</Code>);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('PRE');
        expect(root?.className).toContain('pre');
        // Production's pre carries no data marker (measured live 6 Sep 2026).
        expect(root).not.toHaveAttribute('data-oxobz-code');
        expect(root).not.toHaveAttribute('data-version');
    });

    it('renders the children inside a code element', () => {
        const { container } = render(<Code>const a = 1;</Code>);
        const code = getCode(container);
        expect(code).toBeInTheDocument();
        expect(code?.tagName).toBe('CODE');
        expect(code?.textContent).toBe('const a = 1;');
        expect(code?.className).toContain('code');
    });

    // ── syntax prop ──

    it('does not add an extra class when syntax is omitted', () => {
        const { container } = render(<Code>const a = 1;</Code>);
        const root = getRoot(container);
        // Only the module class + nothing else (className string has a
        // single token — no trailing raw "syntax" fragment).
        expect(root?.className.trim().split(/\s+/)).toHaveLength(1);
    });

    it('appends the syntax value as a raw class on the root (matches Geist production)', () => {
        const { container } = render(
            <Code syntax="javascript">const a = 1;</Code>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('pre');
        expect(root?.className).toContain('javascript');
    });

    // ── Custom className ──

    it('appends a custom className after the module class and syntax class', () => {
        const { container } = render(
            <Code className="custom-code" syntax="tsx">
                const a = 1;
            </Code>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('pre');
        expect(root?.className).toContain('tsx');
        expect(root?.className).toContain('custom-code');
        expect(root?.className.endsWith('custom-code')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root pre', () => {
        const ref = createRef<HTMLPreElement>();
        render(<Code ref={ref}>const a = 1;</Code>);
        expect(ref.current).toBeInstanceOf(HTMLPreElement);
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-label, style)', () => {
        const { container } = render(
            <Code aria-label="example snippet" id="snippet-1" style={{ marginTop: '4px' }}>
                const a = 1;
            </Code>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'snippet-1');
        expect(root).toHaveAttribute('aria-label', 'example snippet');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Code.displayName).toBe('Code');
    });
});
