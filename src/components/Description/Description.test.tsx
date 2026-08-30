import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Description } from './Description';

/** Selects the root <dl> (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-description]');
}

describe('Description', () => {
    // ── Rendering ──

    it('renders a root dl with data-oxobz-description and data-version="v1"', () => {
        const { container } = render(
            <Description content="Data about this section." title="Section Title" />,
        );
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DL');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('description');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Description content="Data about this section." data-version="v2" title="Section Title" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the title in a dt with data-oxobz-description-title', () => {
        const { container } = render(
            <Description content="Data about this section." title="Section Title" />,
        );
        const dt = container.querySelector('dt');
        expect(dt).toBeInTheDocument();
        expect(dt).toHaveAttribute('data-oxobz-description-title', '');
        expect(dt).toHaveTextContent('Section Title');
    });

    it('renders the content in a dd with data-oxobz-description-content', () => {
        const { container } = render(
            <Description content="Data about this section." title="Section Title" />,
        );
        const dd = container.querySelector('dd');
        expect(dd).toBeInTheDocument();
        expect(dd).toHaveAttribute('data-oxobz-description-content', '');
        expect(dd).toHaveTextContent('Data about this section.');
    });

    // ── right ──

    it('applies no alignment class by default (left)', () => {
        const { container } = render(
            <Description content="Value" title="Section Title" />,
        );
        expect(getRoot(container)?.className).not.toContain('right');
    });

    it('applies the right class when right', () => {
        const { container } = render(
            <Description content="Value" right title="Section Title" />,
        );
        expect(getRoot(container)?.className).toContain('right');
    });

    // ── ellipsis ──

    it('applies no ellipsis class by default', () => {
        const { container } = render(
            <Description content="Value" title="Section Title" />,
        );
        expect(getRoot(container)?.className).not.toContain('ellipsis');
    });

    it('applies the ellipsis class when ellipsis', () => {
        const { container } = render(
            <Description content="Value" ellipsis title="Section Title" />,
        );
        expect(getRoot(container)?.className).toContain('ellipsis');
    });

    // ── tooltip ──

    it('renders no icon wrapper when tooltip is omitted', () => {
        const { container } = render(
            <Description content="Value" title="Section Title" />,
        );
        expect(
            container.querySelector('dt > span[class*="icon"]'),
        ).not.toBeInTheDocument();
    });

    it('renders a tooltip trigger next to the title when tooltip is set', () => {
        const { container } = render(
            <Description content="Value" title="Section Title" tooltip="Data about this section." />,
        );
        const iconWrapper = container.querySelector('dt > span[class*="icon"]');
        expect(iconWrapper).toBeInTheDocument();
        const trigger = iconWrapper?.querySelector('[data-testid="legacy/tooltip-trigger"]');
        expect(trigger).toBeInTheDocument();
    });

    it('shows the tooltip text on hover of the info icon', () => {
        const { container } = render(
            <Description content="Value" title="Section Title" tooltip="A one-sentence definition." />,
        );
        const trigger = container.querySelector(
            '[data-testid="legacy/tooltip-trigger"]',
        ) as HTMLElement;
        fireEvent.mouseEnter(trigger);
        expect(screen.getByRole('tooltip')).toHaveTextContent(
            'A one-sentence definition.',
        );
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <Description className="custom-desc" content="Value" title="Section Title" />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('description');
        expect(root?.className).toContain('custom-desc');
        expect(root?.className.endsWith('custom-desc')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root dl', () => {
        const ref = createRef<HTMLDListElement>();
        render(
            <Description content="Value" ref={ref} title="Section Title" />,
        );
        expect(ref.current).toBeInstanceOf(HTMLDListElement);
        expect(ref.current).toHaveAttribute('data-oxobz-description');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-hidden, style)', () => {
        const { container } = render(
            <Description
                aria-hidden="true"
                content="Value"
                id="desc-1"
                style={{ marginTop: '4px' }}
                title="Section Title"
            />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'desc-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Description.displayName).toBe('Description');
    });
});
