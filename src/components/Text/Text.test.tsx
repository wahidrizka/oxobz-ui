import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
    // ── Rendering ──

    it('renders with children', () => {
        render(<Text>hello world</Text>);
        expect(screen.getByText('hello world')).toBeInTheDocument();
    });

    it('renders as span by default', () => {
        render(<Text>default tag</Text>);
        const el = screen.getByText('default tag');
        expect(el.tagName).toBe('SPAN');
    });

    it('always applies the wrapper class', () => {
        render(<Text>wrapper</Text>);
        const el = screen.getByText('wrapper');
        expect(el.className).toContain('wrapper');
    });

    it('has data-version="v1" attribute', () => {
        render(<Text>version</Text>);
        const el = screen.getByText('version');
        expect(el).toHaveAttribute('data-version', 'v1');
    });

    // ── `as` prop ──

    it('renders as p when as="p"', () => {
        render(<Text as="p">paragraph</Text>);
        expect(screen.getByText('paragraph').tagName).toBe('P');
    });

    it('renders as div when as="div"', () => {
        render(<Text as="div">division</Text>);
        expect(screen.getByText('division').tagName).toBe('DIV');
    });

    it('renders as h1 when as="h1"', () => {
        render(<Text as="h1">heading 1</Text>);
        expect(screen.getByText('heading 1').tagName).toBe('H1');
    });

    it('renders as h6 when as="h6"', () => {
        render(<Text as="h6">heading 6</Text>);
        expect(screen.getByText('heading 6').tagName).toBe('H6');
    });

    it('renders as label when as="label"', () => {
        render(<Text as="label">label text</Text>);
        expect(screen.getByText('label text').tagName).toBe('LABEL');
    });

    // ── CSS variable mapping ──

    it('maps size prop to --text-size', () => {
        render(<Text size="0.875rem">sized</Text>);
        const el = screen.getByText('sized');
        expect(el.style.getPropertyValue('--text-size')).toBe('0.875rem');
    });

    it('maps lineHeight prop to --text-line-height', () => {
        render(<Text lineHeight="1.25rem">line height</Text>);
        const el = screen.getByText('line height');
        expect(el.style.getPropertyValue('--text-line-height')).toBe('1.25rem');
    });

    it('maps letterSpacing prop to --text-letter-spacing', () => {
        render(<Text letterSpacing="-0.02em">letter spacing</Text>);
        const el = screen.getByText('letter spacing');
        expect(el.style.getPropertyValue('--text-letter-spacing')).toBe('-0.02em');
    });

    it('maps numeric weight prop to --text-weight', () => {
        render(<Text weight={600}>weight num</Text>);
        const el = screen.getByText('weight num');
        expect(el.style.getPropertyValue('--text-weight')).toBe('600');
    });

    it('maps string weight prop to --text-weight', () => {
        render(<Text weight="bold">weight str</Text>);
        const el = screen.getByText('weight str');
        expect(el.style.getPropertyValue('--text-weight')).toBe('bold');
    });

    it('maps color prop to --text-color', () => {
        render(<Text color="var(--gray-900)">colored</Text>);
        const el = screen.getByText('colored');
        expect(el.style.getPropertyValue('--text-color')).toBe('var(--gray-900)');
    });

    it('maps transform prop to --text-transform', () => {
        render(<Text transform="uppercase">transformed</Text>);
        const el = screen.getByText('transformed');
        expect(el.style.getPropertyValue('--text-transform')).toBe('uppercase');
    });

    it('maps align prop to --text-align', () => {
        render(<Text align="center">aligned</Text>);
        const el = screen.getByText('aligned');
        expect(el.style.getPropertyValue('--text-align')).toBe('center');
    });

    it('does not set --text-* variables when props are omitted', () => {
        render(<Text>bare</Text>);
        const el = screen.getByText('bare');
        expect(el.style.getPropertyValue('--text-size')).toBe('');
        expect(el.style.getPropertyValue('--text-weight')).toBe('');
        expect(el.style.getPropertyValue('--text-color')).toBe('');
        expect(el.style.getPropertyValue('--text-line-height')).toBe('');
        expect(el.style.getPropertyValue('--text-letter-spacing')).toBe('');
        expect(el.style.getPropertyValue('--text-transform')).toBe('');
        expect(el.style.getPropertyValue('--text-align')).toBe('');
        expect(el.style.getPropertyValue('--text-clamp')).toBe('');
    });

    it('merges user-provided style with generated CSS variables', () => {
        render(
            <Text size="1rem" style={{ marginTop: '4px' }}>
                merged style
            </Text>,
        );
        const el = screen.getByText('merged style');
        expect(el.style.getPropertyValue('--text-size')).toBe('1rem');
        expect(el.style.marginTop).toBe('4px');
    });

    // ── Boolean modifier classes ──

    it('applies truncate class when truncate is true', () => {
        render(<Text truncate>truncated</Text>);
        const el = screen.getByText('truncated');
        expect(el.className).toContain('truncate');
    });

    it('does not apply truncate class by default', () => {
        render(<Text>not truncated</Text>);
        const el = screen.getByText('not truncated');
        expect(el.className).not.toContain('truncate');
    });

    it('applies nowrap class when nowrap is true', () => {
        render(<Text nowrap>no wrap</Text>);
        const el = screen.getByText('no wrap');
        expect(el.className).toContain('nowrap');
    });

    it('does not apply nowrap class by default', () => {
        render(<Text>wraps</Text>);
        const el = screen.getByText('wraps');
        expect(el.className).not.toContain('nowrap');
    });

    it('applies monospace class when monospace is true', () => {
        render(<Text monospace>mono</Text>);
        const el = screen.getByText('mono');
        expect(el.className).toContain('monospace');
    });

    it('does not apply monospace class by default', () => {
        render(<Text>sans</Text>);
        const el = screen.getByText('sans');
        expect(el.className).not.toContain('monospace');
    });

    // ── Clamp ──

    it('applies clamp class and --text-clamp variable when clamp is set', () => {
        render(<Text clamp={3}>clamped</Text>);
        const el = screen.getByText('clamped');
        expect(el.className).toContain('clamp');
        expect(el.style.getPropertyValue('--text-clamp')).toBe('3');
    });

    it('does not apply clamp class when clamp is omitted', () => {
        render(<Text>unclamped</Text>);
        const el = screen.getByText('unclamped');
        expect(el.className).not.toContain('clamp');
    });

    // ── className ──

    it('applies custom className alongside wrapper class', () => {
        render(<Text className="my-custom-class">custom</Text>);
        const el = screen.getByText('custom');
        expect(el.className).toContain('wrapper');
        expect(el.className).toContain('my-custom-class');
    });

    // ── Ref forwarding ──

    it('forwards ref to the default span element', () => {
        const ref = { current: null } as React.RefObject<HTMLElement | null>;
        render(<Text ref={ref}>ref span</Text>);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('forwards ref to the element chosen via as', () => {
        const ref = { current: null } as React.RefObject<HTMLElement | null>;
        render(
            <Text as="p" ref={ref}>
                ref p
            </Text>,
        );
        expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });

    // ── Prop forwarding ──

    it('forwards additional HTML attributes', () => {
        render(
            <Text id="text-id" title="tooltip">
                attrs
            </Text>,
        );
        const el = screen.getByText('attrs');
        expect(el).toHaveAttribute('id', 'text-id');
        expect(el).toHaveAttribute('title', 'tooltip');
    });

    // ── Display name ──

    it('has displayName "Text"', () => {
        expect(Text.displayName).toBe('Text');
    });
});
