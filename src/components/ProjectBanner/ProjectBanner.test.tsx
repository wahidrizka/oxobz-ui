import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { ProjectBanner, type ProjectBannerVariant } from './ProjectBanner';

/** Selects the root aside (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-project-banner]');
}

describe('ProjectBanner', () => {
    // ── Rendering ──

    it('renders a root aside with data-oxobz-project-banner and data-version="v1"', () => {
        const { container } = render(<ProjectBanner label="Message" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('ASIDE');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('banner');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <ProjectBanner data-version="v2" label="Message" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the label text', () => {
        render(<ProjectBanner label="Attack Challenge Mode is enabled for this project" />);
        expect(
            screen.getByText('Attack Challenge Mode is enabled for this project'),
        ).toBeInTheDocument();
    });

    it('renders no icon wrapper when icon is omitted', () => {
        const { container } = render(<ProjectBanner label="Message" />);
        expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('renders the icon inside an aria-hidden wrapper', () => {
        const { container } = render(
            <ProjectBanner icon={<svg data-testid="icon" />} label="Message" />,
        );
        const wrapper = container.querySelector('[aria-hidden="true"]');
        expect(wrapper).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    // ── Variants ──

    const variants: ProjectBannerVariant[] = [
        'default',
        'success',
        'warning',
        'error',
    ];

    it.each(variants)('applies the %s variant class to the root', (variant) => {
        const { container } = render(
            <ProjectBanner label="Message" variant={variant} />,
        );
        expect(getRoot(container)?.className).toContain(variant);
    });

    it('defaults to the "default" variant when omitted', () => {
        const { container } = render(<ProjectBanner label="Message" />);
        expect(getRoot(container)?.className).toContain('default');
    });

    // ── Call to action ──

    it('renders no call-to-action when omitted', () => {
        render(<ProjectBanner label="Message" />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders an anchor when callToAction.href is set', () => {
        render(
            <ProjectBanner
                callToAction={{ label: 'Disable', href: '/' }}
                label="Message"
            />,
        );
        const link = screen.getByRole('link', { name: 'Disable' });
        expect(link).toHaveAttribute('href', '/');
    });

    it('renders a button when callToAction has no href', () => {
        const handleClick = vi.fn();
        render(
            <ProjectBanner
                callToAction={{ label: 'Undo Rollback', onClick: handleClick }}
                label="Message"
            />,
        );
        const button = screen.getByRole('button', { name: 'Undo Rollback' });
        expect(button).toHaveAttribute('type', 'button');
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('fires onClick on the anchor when both href and onClick are given', () => {
        const handleClick = vi.fn();
        render(
            <ProjectBanner
                callToAction={{ label: 'Add Credit Card', href: '/billing', onClick: handleClick }}
                label="Message"
            />,
        );
        fireEvent.click(screen.getByRole('link', { name: 'Add Credit Card' }));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it.each(variants)(
        'sets --banner-focus-color on the call-to-action for the %s variant',
        (variant) => {
            render(
                <ProjectBanner
                    callToAction={{ label: 'Disable', href: '/' }}
                    label="Message"
                    variant={variant}
                />,
            );
            const link = screen.getByRole('link', { name: 'Disable' });
            expect(link.style.getPropertyValue('--banner-focus-color')).not.toBe('');
        },
    );

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <ProjectBanner className="custom-banner" label="Message" />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('banner');
        expect(root?.className).toContain('custom-banner');
        expect(root?.className.endsWith('custom-banner')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root aside', () => {
        const ref = createRef<HTMLElement>();
        render(<ProjectBanner label="Message" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLElement);
        expect(ref.current?.tagName).toBe('ASIDE');
        expect(ref.current).toHaveAttribute('data-oxobz-project-banner');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-label)', () => {
        const { container } = render(
            <ProjectBanner aria-label="Project status" id="banner-1" label="Message" />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'banner-1');
        expect(root).toHaveAttribute('aria-label', 'Project status');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(ProjectBanner.displayName).toBe('ProjectBanner');
    });
});
