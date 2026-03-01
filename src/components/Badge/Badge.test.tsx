import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
    it('renders with children', () => {
        render(<Badge>beta</Badge>);
        expect(screen.getByText('beta')).toBeInTheDocument();
    });

    it('default variant is gray', () => {
        render(<Badge>default</Badge>);
        const el = screen.getByText('default').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('gray');
    });

    it('applies variant class — gray', () => {
        render(<Badge variant="gray">gray</Badge>);
        const el = screen.getByText('gray').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('gray');
    });

    it('applies variant class — blue', () => {
        render(<Badge variant="blue">blue</Badge>);
        const el = screen.getByText('blue').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('blue');
    });

    it('applies variant class — red', () => {
        render(<Badge variant="red">red</Badge>);
        const el = screen.getByText('red').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('red');
    });

    it('applies variant class — amber', () => {
        render(<Badge variant="amber">amber</Badge>);
        const el = screen.getByText('amber').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('amber');
    });

    it('applies variant class — green', () => {
        render(<Badge variant="green">green</Badge>);
        const el = screen.getByText('green').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('green');
    });

    it('applies variant class — teal', () => {
        render(<Badge variant="teal">teal</Badge>);
        const el = screen.getByText('teal').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('teal');
    });

    it('applies variant class — purple', () => {
        render(<Badge variant="purple">purple</Badge>);
        const el = screen.getByText('purple').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('purple');
    });

    it('applies variant class — pink', () => {
        render(<Badge variant="pink">pink</Badge>);
        const el = screen.getByText('pink').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('pink');
    });

    it('applies variant class — inverted', () => {
        render(<Badge variant="inverted">inverted</Badge>);
        const el = screen.getByText('inverted').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('inverted');
    });

    it('applies variant class — trial', () => {
        render(<Badge variant="trial">trial</Badge>);
        const el = screen.getByText('trial').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('trial');
    });

    it('applies variant class — turbo', () => {
        render(<Badge variant="turbo">turbo</Badge>);
        const el = screen.getByText('turbo').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('turbo');
    });

    it('applies variant class — pill', () => {
        render(<Badge variant="pill" href="#">pill</Badge>);
        const el = screen.getByText('pill').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('pill');
    });

    it('applies size class — sm', () => {
        render(<Badge size="sm">small</Badge>);
        const el = screen.getByText('small').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('sm');
    });

    it('applies size class — md', () => {
        render(<Badge size="md">medium</Badge>);
        const el = screen.getByText('medium').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('md');
    });

    it('applies size class — lg', () => {
        render(<Badge size="lg">large</Badge>);
        const el = screen.getByText('large').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('lg');
    });

    it('renders as span by default', () => {
        render(<Badge>span badge</Badge>);
        const el = screen.getByText('span badge').closest('[data-oxobz-badge]');
        expect(el?.tagName).toBe('SPAN');
    });

    it('renders as anchor when href is provided', () => {
        render(<Badge href="https://example.com">link badge</Badge>);
        const el = screen.getByText('link badge').closest('[data-oxobz-badge]');
        expect(el?.tagName).toBe('A');
    });

    it('renders icon inside iconContainer when icon prop is provided', () => {
        const icon = <span data-testid="badge-icon">★</span>;
        render(<Badge icon={icon}>with icon</Badge>);
        expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
        // iconContainer is the wrapper around the icon
        const iconContainer = screen.getByTestId('badge-icon').parentElement;
        expect(iconContainer?.className).toContain('iconContainer');
    });

    it('does NOT render iconContainer when no icon prop', () => {
        const { container } = render(<Badge>no icon</Badge>);
        const iconContainer = container.querySelector('.iconContainer');
        expect(iconContainer).toBeNull();
    });

    it('has data-oxobz-badge attribute', () => {
        render(<Badge>attr test</Badge>);
        const el = screen.getByText('attr test').closest('[data-oxobz-badge]');
        expect(el).toHaveAttribute('data-oxobz-badge', '');
    });

    it('has data-version="v2" attribute', () => {
        render(<Badge>version test</Badge>);
        const el = screen.getByText('version test').closest('[data-oxobz-badge]');
        expect(el).toHaveAttribute('data-version', 'v2');
    });

    it('applies custom className', () => {
        render(<Badge className="my-custom-class">custom</Badge>);
        const el = screen.getByText('custom').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('my-custom-class');
    });

    it('forwards ref', () => {
        const ref = { current: null } as React.RefObject<HTMLSpanElement | null>;
        render(<Badge ref={ref}>ref test</Badge>);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
});
