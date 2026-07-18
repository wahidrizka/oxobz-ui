import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Entity, EntityContent, EntityList } from './Entity';

describe('Entity', () => {
    // ── Rendering (default as="li") ──

    it('renders an li with data-oxobz-entity and data-version="v1"', () => {
        const { container } = render(<Entity>Row</Entity>);
        const root = container.querySelector('[data-oxobz-entity]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('LI');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('entity');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Entity data-version="v2">Row</Entity>);
        expect(container.querySelector('[data-oxobz-entity]')).toHaveAttribute(
            'data-version',
            'v2',
        );
    });

    it('renders children inside the left column', () => {
        render(<Entity>Row content</Entity>);
        expect(screen.getByText('Row content')).toBeInTheDocument();
    });

    // ── as ──

    it('renders a button when as="button"', () => {
        const { container } = render(<Entity as="button">Row</Entity>);
        const root = container.querySelector('[data-oxobz-entity]');
        expect(root?.tagName).toBe('BUTTON');
        expect(root?.className).toContain('button');
        expect(root?.className).toContain('oxobz-reset');
    });

    it('fires onClick when as="button"', () => {
        let clicked = 0;
        render(
            <Entity as="button" onClick={() => (clicked += 1)}>
                Row
            </Entity>,
        );
        screen.getByRole('button').click();
        expect(clicked).toBe(1);
    });

    // ── left / right ──

    it('renders the left prop before children in the left column', () => {
        const { container } = render(
            <Entity left={<span data-testid="avatar">A</span>}>Title</Entity>,
        );
        const left = container.querySelector('.left, [class*="left"]');
        expect(screen.getByTestId('avatar')).toBeInTheDocument();
        expect(left).toBeInTheDocument();
        expect(left?.textContent).toBe('ATitle');
    });

    it('does not render a right column when `right` is omitted', () => {
        const { container } = render(<Entity>Row</Entity>);
        expect(container.querySelector('[class*="right"]')).not.toBeInTheDocument();
    });

    it('renders the right prop in its own column when set', () => {
        render(<Entity right={<span>Action</span>}>Row</Entity>);
        expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('merges leftClassName onto the left column', () => {
        const { container } = render(
            <Entity leftClassName="custom-left">Row</Entity>,
        );
        const left = container.querySelector('[class*="left"]');
        expect(left?.className).toContain('custom-left');
    });

    it('merges rightClassName onto the right column', () => {
        const { container } = render(
            <Entity right="Action" rightClassName="custom-right">
                Row
            </Entity>,
        );
        const right = container.querySelector('[class*="right"]');
        expect(right?.className).toContain('custom-right');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<Entity className="custom-entity">Row</Entity>);
        const root = container.querySelector('[data-oxobz-entity]');
        expect(root?.className).toContain('entity');
        expect(root?.className).toContain('custom-entity');
        expect(root?.className.endsWith('custom-entity')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root li', () => {
        const ref = createRef<HTMLLIElement>();
        render(<Entity ref={ref}>Row</Entity>);
        expect(ref.current).toBeInstanceOf(HTMLLIElement);
        expect(ref.current).toHaveAttribute('data-oxobz-entity');
    });

    it('forwards ref to the root button when as="button"', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <Entity as="button" ref={ref}>
                Row
            </Entity>,
        );
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-hidden, style)', () => {
        const { container } = render(
            <Entity aria-hidden="true" id="entity-1" style={{ marginTop: '4px' }}>
                Row
            </Entity>,
        );
        const root = container.querySelector('[data-oxobz-entity]');
        expect(root).toHaveAttribute('id', 'entity-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Entity.displayName).toBe('Entity');
    });

    // ── Compound convenience ──

    it('exposes EntityContent and EntityList as Entity.Content / Entity.List', () => {
        expect(Entity.Content).toBe(EntityContent);
        expect(Entity.List).toBe(EntityList);
    });
});

describe('EntityContent', () => {
    it('renders a div with data-oxobz-entity-content and data-version="v1"', () => {
        const { container } = render(<EntityContent title="Title" />);
        const root = container.querySelector('[data-oxobz-entity-content]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('content');
    });

    it('renders the title bold and the description muted', () => {
        render(<EntityContent description="Glenn Hitchcock (@gln)" title="Evil Rabbit" />);
        const title = screen.getByText('Evil Rabbit');
        const description = screen.getByText('Glenn Hitchcock (@gln)');
        expect(title.tagName).toBe('P');
        expect(title.className).toContain('title');
        expect(description.tagName).toBe('P');
        expect(description.className).toContain('description');
    });

    it('omits the title paragraph when title is not set', () => {
        const { container } = render(<EntityContent description="Only description" />);
        expect(container.querySelector('[class*="title"]')).not.toBeInTheDocument();
    });

    it('omits the description paragraph when description is not set', () => {
        const { container } = render(<EntityContent title="Only title" />);
        expect(container.querySelector('[class*="description"]')).not.toBeInTheDocument();
    });

    it('applies the fill class when fill is set', () => {
        const { container } = render(<EntityContent description="Fills" fill />);
        expect(
            container.querySelector('[data-oxobz-entity-content]')?.className,
        ).toContain('contentFill');
    });

    it('does not apply the fill class by default', () => {
        const { container } = render(<EntityContent description="Auto" />);
        expect(
            container.querySelector('[data-oxobz-entity-content]')?.className,
        ).not.toContain('contentFill');
    });

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <EntityContent className="custom-content" title="T" />,
        );
        const root = container.querySelector('[data-oxobz-entity-content]');
        expect(root?.className.endsWith('custom-content')).toBe(true);
    });

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<EntityContent ref={ref} title="T" />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-entity-content');
    });

    it('has the correct displayName', () => {
        expect(EntityContent.displayName).toBe('EntityContent');
    });
});

describe('EntityList', () => {
    it('renders a ul with data-oxobz-entity-list and data-version="v1"', () => {
        const { container } = render(
            <EntityList>
                <Entity as="li">Row 1</Entity>
                <Entity as="li">Row 2</Entity>
            </EntityList>,
        );
        const root = container.querySelector('[data-oxobz-entity-list]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('UL');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('list');
    });

    it('renders every Entity child row', () => {
        render(
            <EntityList>
                <Entity as="li">Row 1</Entity>
                <Entity as="li">Row 2</Entity>
                <Entity as="li">Row 3</Entity>
            </EntityList>,
        );
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('renders button rows for multi-select lists', () => {
        render(
            <EntityList>
                <Entity as="button">Row 1</Entity>
                <Entity as="button">Row 2</Entity>
            </EntityList>,
        );
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('appends a custom className after the module class', () => {
        const { container } = render(<EntityList className="custom-list" />);
        const root = container.querySelector('[data-oxobz-entity-list]');
        expect(root?.className.endsWith('custom-list')).toBe(true);
    });

    it('forwards ref to the root ul', () => {
        const ref = createRef<HTMLUListElement>();
        render(<EntityList ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLUListElement);
        expect(ref.current).toHaveAttribute('data-oxobz-entity-list');
    });

    it('has the correct displayName', () => {
        expect(EntityList.displayName).toBe('EntityList');
    });
});
