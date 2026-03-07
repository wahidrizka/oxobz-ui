import { render, screen, fireEvent } from '@testing-library/react';
import { CollapseGroup, CollapseItem } from './Collapse';

describe('CollapseItem', () => {
    it('renders title text', () => {
        render(<CollapseItem title="Question A">Content A</CollapseItem>);
        expect(screen.getByText('Question A')).toBeInTheDocument();
    });

    it('content is hidden by default (height: 0)', () => {
        render(<CollapseItem title="Q">Hidden content</CollapseItem>);
        const region = screen.getByRole('region');
        expect(region.style.height).toBe('0px');
    });

    it('click toggles expanded state', () => {
        render(<CollapseItem title="Toggle">Toggle content</CollapseItem>);
        const button = screen.getByRole('button', { name: /toggle/i });
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('defaultExpanded shows content on mount', () => {
        render(
            <CollapseItem title="Open" defaultExpanded>
                Visible
            </CollapseItem>,
        );
        const button = screen.getByRole('button', { name: /open/i });
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('aria-controls + id pairing', () => {
        render(<CollapseItem title="Aria">Content</CollapseItem>);
        const button = screen.getByRole('button');
        const region = screen.getByRole('region');
        expect(button.getAttribute('aria-controls')).toBe(region.id);
    });

    it('role="region" on content', () => {
        render(<CollapseItem title="Region">Content</CollapseItem>);
        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('data-version="v1" attribute', () => {
        render(<CollapseItem title="Version">Content</CollapseItem>);
        const wrapper = screen.getByRole('region').closest('[data-version]');
        expect(wrapper).toHaveAttribute('data-version', 'v1');
    });

    it('size="small" applies small class', () => {
        render(
            <CollapseItem title="Small" size="small">
                Content
            </CollapseItem>,
        );
        const button = screen.getByRole('button');
        const titleSpan = button.querySelector('span');
        expect(titleSpan?.className).toContain('small');
    });

    it('custom className forwarding', () => {
        render(
            <CollapseItem title="Custom" className="my-class">
                Content
            </CollapseItem>,
        );
        const wrapper = screen.getByRole('region').closest('.my-class');
        expect(wrapper).toBeInTheDocument();
    });

    it('disabled prop sets aria-disabled', () => {
        render(
            <CollapseItem title="Disabled" disabled>
                Content
            </CollapseItem>,
        );
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('disabled prevents toggle', () => {
        render(
            <CollapseItem title="No Toggle" disabled>
                Content
            </CollapseItem>,
        );
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(button).not.toHaveAttribute('aria-expanded');
    });

    it('controlled expanded prop', () => {
        const { rerender } = render(
            <CollapseItem title="Controlled" expanded={false}>
                Content
            </CollapseItem>,
        );
        const button = screen.getByRole('button');
        expect(button).not.toHaveAttribute('aria-expanded');

        rerender(
            <CollapseItem title="Controlled" expanded={true}>
                Content
            </CollapseItem>,
        );
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });
});

describe('CollapseGroup', () => {
    it('renders wrapper with collapseGroup class', () => {
        const { container } = render(
            <CollapseGroup>
                <CollapseItem title="A">A</CollapseItem>
            </CollapseGroup>,
        );
        const group = container.firstChild as HTMLElement;
        expect(group.className).toContain('collapseGroup');
    });

    it('has data-version="v1"', () => {
        const { container } = render(
            <CollapseGroup>
                <CollapseItem title="A">A</CollapseItem>
            </CollapseGroup>,
        );
        expect(container.firstChild).toHaveAttribute('data-version', 'v1');
    });
});
