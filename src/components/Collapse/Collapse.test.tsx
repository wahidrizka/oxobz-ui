import { render, screen, fireEvent } from '@testing-library/react';
import { Collapse, CollapseGroup, CollapseItem } from './Collapse';

describe('Collapse', () => {
    it('renders title text', () => {
        render(<Collapse title="Question A">Content A</Collapse>);
        expect(screen.getByText('Question A')).toBeInTheDocument();
    });

    it('content is hidden by default (height: 0)', () => {
        render(<Collapse title="Q">Hidden content</Collapse>);
        const region = screen.getByRole('region');
        expect(region.style.height).toBe('0px');
    });

    it('click toggles expanded state', () => {
        render(<Collapse title="Toggle">Toggle content</Collapse>);
        const button = screen.getByRole('button', { name: /toggle/i });
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('defaultExpanded shows content on mount', () => {
        render(
            <Collapse title="Open" defaultExpanded>
                Visible
            </Collapse>,
        );
        const button = screen.getByRole('button', { name: /open/i });
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('aria-controls + id pairing', () => {
        render(<Collapse title="Aria">Content</Collapse>);
        const button = screen.getByRole('button');
        const region = screen.getByRole('region');
        expect(button.getAttribute('aria-controls')).toBe(region.id);
    });

    it('role="region" on content', () => {
        render(<Collapse title="Region">Content</Collapse>);
        expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('data-version="v1" attribute', () => {
        render(<Collapse title="Version">Content</Collapse>);
        const wrapper = screen.getByRole('region').closest('[data-version]');
        expect(wrapper).toHaveAttribute('data-version', 'v1');
    });

    it('size="small" applies small class', () => {
        render(
            <Collapse title="Small" size="small">
                Content
            </Collapse>,
        );
        const button = screen.getByRole('button');
        const titleSpan = button.querySelector('span');
        expect(titleSpan?.className).toContain('small');
    });

    it('custom className forwarding', () => {
        render(
            <Collapse title="Custom" className="my-class">
                Content
            </Collapse>,
        );
        const wrapper = screen.getByRole('region').closest('.my-class');
        expect(wrapper).toBeInTheDocument();
    });

    it('disabled prop sets aria-disabled', () => {
        render(
            <Collapse title="Disabled" disabled>
                Content
            </Collapse>,
        );
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('disabled prevents toggle', () => {
        render(
            <Collapse title="No Toggle" disabled>
                Content
            </Collapse>,
        );
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(button).not.toHaveAttribute('aria-expanded');
    });

    it('controlled expanded prop', () => {
        const { rerender } = render(
            <Collapse title="Controlled" expanded={false}>
                Content
            </Collapse>,
        );
        const button = screen.getByRole('button');
        expect(button).not.toHaveAttribute('aria-expanded');

        rerender(
            <Collapse title="Controlled" expanded={true}>
                Content
            </Collapse>,
        );
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('standalone item does not get the context class', () => {
        render(<Collapse title="Standalone">Content</Collapse>);
        const wrapper = screen.getByRole('region').closest('[data-version]');
        expect(wrapper?.className).not.toContain('context');
    });

    it('CollapseItem is a backward-compatible alias of Collapse', () => {
        expect(CollapseItem).toBe(Collapse);
    });
});

describe('CollapseGroup', () => {
    it('renders wrapper with collapseGroup class', () => {
        const { container } = render(
            <CollapseGroup>
                <Collapse title="A">A</Collapse>
            </CollapseGroup>,
        );
        const group = container.firstChild as HTMLElement;
        expect(group.className).toContain('collapseGroup');
    });

    it('has data-version="v1"', () => {
        const { container } = render(
            <CollapseGroup>
                <Collapse title="A">A</Collapse>
            </CollapseGroup>,
        );
        expect(container.firstChild).toHaveAttribute('data-version', 'v1');
    });

    it('injects the context class into every child item', () => {
        render(
            <CollapseGroup>
                <Collapse title="A">A</Collapse>
                <Collapse title="B">B</Collapse>
            </CollapseGroup>,
        );
        // Each grouped item wrapper (region's parent) carries the `context`
        // class (border-top: none) so the group renders single separators.
        const wrappers = screen
            .getAllByRole('region')
            .map((region) => region.parentElement as HTMLElement);
        expect(wrappers).toHaveLength(2);
        wrappers.forEach((wrapper) => {
            expect(wrapper.className).toContain('context');
        });
    });

    it('accordion (default): opening one panel closes the others', () => {
        render(
            <CollapseGroup>
                <Collapse title="First">First body</Collapse>
                <Collapse title="Second">Second body</Collapse>
            </CollapseGroup>,
        );
        const first = screen.getByRole('button', { name: /first/i });
        const second = screen.getByRole('button', { name: /second/i });

        fireEvent.click(first);
        expect(first).toHaveAttribute('aria-expanded', 'true');
        expect(second).not.toHaveAttribute('aria-expanded');

        fireEvent.click(second);
        expect(second).toHaveAttribute('aria-expanded', 'true');
        expect(first).not.toHaveAttribute('aria-expanded');
    });

    it('accordion: clicking the open panel closes it', () => {
        render(
            <CollapseGroup>
                <Collapse title="Only">Body</Collapse>
            </CollapseGroup>,
        );
        const button = screen.getByRole('button', { name: /only/i });
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(button);
        expect(button).not.toHaveAttribute('aria-expanded');
    });

    it('multiple: allows more than one panel open at once', () => {
        render(
            <CollapseGroup multiple>
                <Collapse title="First">First body</Collapse>
                <Collapse title="Second">Second body</Collapse>
            </CollapseGroup>,
        );
        const first = screen.getByRole('button', { name: /first/i });
        const second = screen.getByRole('button', { name: /second/i });

        fireEvent.click(first);
        fireEvent.click(second);
        expect(first).toHaveAttribute('aria-expanded', 'true');
        expect(second).toHaveAttribute('aria-expanded', 'true');
    });

    it('defaultExpanded opens the panel inside a group', () => {
        render(
            <CollapseGroup>
                <Collapse title="Closed">Closed body</Collapse>
                <Collapse title="Open" defaultExpanded>
                    Open body
                </Collapse>
            </CollapseGroup>,
        );
        expect(screen.getByRole('button', { name: /^open/i })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
    });
});
