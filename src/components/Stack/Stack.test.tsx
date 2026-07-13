import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CSSProperties } from 'react';
import { Stack } from './Stack';

/** Grab the rendered Stack root element */
function getStack(container: HTMLElement): HTMLElement {
    return container.firstElementChild as HTMLElement;
}

describe('Stack', () => {
    // ── Rendering ──

    it('renders children', () => {
        render(<Stack>content</Stack>);
        expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('renders as div by default with stack class', () => {
        const { container } = render(<Stack>base</Stack>);
        const el = getStack(container);
        expect(el.tagName).toBe('DIV');
        expect(el.className).toContain('stack');
    });

    it('has data-version="v1" attribute', () => {
        const { container } = render(<Stack>version</Stack>);
        expect(getStack(container)).toHaveAttribute('data-version', 'v1');
    });

    // ── `as` prop ──

    it('renders as section when as="section"', () => {
        const { container } = render(<Stack as="section">section</Stack>);
        expect(getStack(container).tagName).toBe('SECTION');
    });

    it('renders as span when as="span"', () => {
        const { container } = render(<Stack as="span">span</Stack>);
        expect(getStack(container).tagName).toBe('SPAN');
    });

    it('renders as nav when as="nav"', () => {
        const { container } = render(<Stack as="nav">nav</Stack>);
        expect(getStack(container).tagName).toBe('NAV');
    });

    it('renders as header when as="header"', () => {
        const { container } = render(<Stack as="header">header</Stack>);
        expect(getStack(container).tagName).toBe('HEADER');
    });

    // ── Default CSS custom properties ──

    it('sets default --stack-* custom properties', () => {
        const { container } = render(<Stack>defaults</Stack>);
        const style = getStack(container).style;
        expect(style.getPropertyValue('--stack-direction')).toBe('column');
        expect(style.getPropertyValue('--stack-align')).toBe('stretch');
        expect(style.getPropertyValue('--stack-justify')).toBe('flex-start');
        expect(style.getPropertyValue('--stack-gap')).toBe('0px');
        expect(style.getPropertyValue('--stack-padding')).toBe('0px');
        expect(style.getPropertyValue('--stack-flex')).toBe('initial');
    });

    // ── Prop → CSS variable mapping ──

    it('maps direction prop to --stack-direction', () => {
        const { container } = render(<Stack direction="row">row</Stack>);
        expect(getStack(container).style.getPropertyValue('--stack-direction')).toBe('row');
    });

    it('maps align prop to --stack-align', () => {
        const { container } = render(<Stack align="center">align</Stack>);
        expect(getStack(container).style.getPropertyValue('--stack-align')).toBe('center');
    });

    it('maps justify prop to --stack-justify', () => {
        const { container } = render(<Stack justify="space-between">justify</Stack>);
        expect(getStack(container).style.getPropertyValue('--stack-justify')).toBe('space-between');
    });

    it('maps flex prop to --stack-flex', () => {
        const { container } = render(<Stack flex="1 1 auto">flex</Stack>);
        expect(getStack(container).style.getPropertyValue('--stack-flex')).toBe('1 1 auto');
    });

    it('appends px when gap is a number', () => {
        const { container } = render(<Stack gap={16}>gap</Stack>);
        expect(getStack(container).style.getPropertyValue('--stack-gap')).toBe('16px');
    });

    it('passes gap string through as-is', () => {
        const { container } = render(<Stack gap="1rem">gap</Stack>);
        expect(getStack(container).style.getPropertyValue('--stack-gap')).toBe('1rem');
    });

    it('appends px when padding is a number and applies padding class', () => {
        const { container } = render(<Stack padding={8}>padding</Stack>);
        const el = getStack(container);
        expect(el.style.getPropertyValue('--stack-padding')).toBe('8px');
        // .padding is the class that consumes var(--stack-padding) — without it
        // the custom property has no visual effect
        expect(el.classList.contains('padding')).toBe(true);
    });

    it('passes padding string through as-is and applies padding class', () => {
        const { container } = render(<Stack padding="2rem 1rem">padding</Stack>);
        const el = getStack(container);
        expect(el.style.getPropertyValue('--stack-padding')).toBe('2rem 1rem');
        expect(el.classList.contains('padding')).toBe(true);
    });

    it('does not apply padding class by default (matches production snapshot)', () => {
        const { container } = render(<Stack>no padding</Stack>);
        expect(getStack(container).classList.contains('padding')).toBe(false);
    });

    it('does not apply padding class when padding is 0', () => {
        const { container } = render(<Stack padding={0}>zero padding</Stack>);
        const el = getStack(container);
        expect(el.style.getPropertyValue('--stack-padding')).toBe('0px');
        expect(el.classList.contains('padding')).toBe(false);
    });

    // ── Style merging ──

    it('merges user style prop with stack variables', () => {
        const { container } = render(<Stack style={{ backgroundColor: 'red' }}>styled</Stack>);
        const el = getStack(container);
        expect(el.style.backgroundColor).toBe('red');
        expect(el.style.getPropertyValue('--stack-direction')).toBe('column');
    });

    it('component props win over --stack-* set via style prop', () => {
        const userStyle = { '--stack-gap': '99px' } as CSSProperties;
        const { container } = render(<Stack style={userStyle} gap={4}>override</Stack>);
        expect(getStack(container).style.getPropertyValue('--stack-gap')).toBe('4px');
    });

    // ── Debug prop ──

    it('applies debug class when debug prop is true', () => {
        const { container } = render(<Stack debug>debug</Stack>);
        expect(getStack(container).className).toContain('debug');
    });

    it('does not apply debug class by default', () => {
        const { container } = render(<Stack>no debug</Stack>);
        expect(getStack(container).className).not.toContain('debug');
    });

    // ── className ──

    it('applies custom className alongside stack class', () => {
        const { container } = render(<Stack className="my-custom-class">custom</Stack>);
        const el = getStack(container);
        expect(el.className).toContain('stack');
        expect(el.className).toContain('my-custom-class');
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
        render(<Stack ref={ref}>ref test</Stack>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to the custom tag element', () => {
        const ref = vi.fn();
        render(<Stack as="section" ref={ref}>section ref</Stack>);
        expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
        const el = ref.mock.calls[0][0] as HTMLElement;
        expect(el.tagName).toBe('SECTION');
    });

    // ── Prop forwarding ──

    it('forwards additional HTML attributes', () => {
        const { container } = render(
            <Stack id="stack-id" aria-label="layout stack">
                attrs
            </Stack>,
        );
        const el = getStack(container);
        expect(el).toHaveAttribute('id', 'stack-id');
        expect(el).toHaveAttribute('aria-label', 'layout stack');
    });

    // ── Display name ──

    it('has displayName "Stack"', () => {
        expect(Stack.displayName).toBe('Stack');
    });
});
