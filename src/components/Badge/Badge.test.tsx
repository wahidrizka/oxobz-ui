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

    it('always applies the capitalize base class', () => {
        render(<Badge>capitalized</Badge>);
        const el = screen.getByText('capitalized').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('capitalize');
    });

    it('derives the subtle class from variant + contrast="low"', () => {
        render(<Badge variant="blue" contrast="low">blue subtle</Badge>);
        const el = screen.getByText('blue subtle').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('blue-subtle');
    });

    it('derives subtle for every color variant with contrast="low"', () => {
        const colors = ['gray', 'blue', 'purple', 'amber', 'red', 'pink', 'green', 'teal'] as const;
        colors.forEach((color) => {
            const { unmount } = render(
                <Badge variant={color} contrast="low">{`${color} subtle`}</Badge>,
            );
            const el = screen.getByText(`${color} subtle`).closest('[data-oxobz-badge]');
            expect(el?.className).toContain(`${color}-subtle`);
            unmount();
        });
    });

    it('does NOT apply the subtle class without contrast', () => {
        render(<Badge variant="blue">solid blue</Badge>);
        const el = screen.getByText('solid blue').closest('[data-oxobz-badge]');
        expect(el?.className).toContain('blue');
        expect(el?.className).not.toContain('blue-subtle');
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

    /* Akar badge produksi adalah <div> (terukur pada 73 badge, 30 Agu 2026). */
    it('renders as div by default', () => {
        render(<Badge>span badge</Badge>);
        const el = screen.getByText('span badge').closest('[data-oxobz-badge]');
        expect(el?.tagName).toBe('DIV');
    });

    it('renders as anchor when href is provided', () => {
        render(<Badge href="https://example.com">link badge</Badge>);
        const el = screen.getByText('link badge').closest('[data-oxobz-badge]');
        expect(el?.tagName).toBe('A');
    });

    /*
     * Produksi menaruh svg ikon sebagai anak LANGSUNG badge, tanpa span
     * pembungkus. Test lama menuntut pembungkus itu, dan itu keliru.
     */
    it('renders the icon as a direct child of the badge, with no wrapper', () => {
        const { container } = render(<Badge icon={<svg data-testid="ikon" />}>Label</Badge>);
        const badge = container.querySelector('[data-oxobz-badge]');
        expect(badge).not.toBeNull();
        const svg = badge!.querySelector(':scope > svg');
        expect(svg).not.toBeNull();
        expect(container.querySelector('[class*="iconContainer"]')).toBeNull();
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
        const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
        render(<Badge ref={ref}>ref test</Badge>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});
