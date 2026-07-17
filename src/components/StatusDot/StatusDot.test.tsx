import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { StatusDot, type StatusDotState } from './StatusDot';

/** Selects the wrapper span (the component root). */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-status-dot]');
}

/** Selects the colored dot (first span child of the root). */
function getDot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-status-dot] > span');
}

describe('StatusDot', () => {
    // ── Rendering ──

    it('renders a root span with data-oxobz-status-dot and data-version="v1"', () => {
        const { container } = render(<StatusDot state="READY" />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('SPAN');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('wrapper');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <StatusDot data-version="v2" state="READY" />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders a dot span with the status class', () => {
        const { container } = render(<StatusDot state="READY" />);
        const dot = getDot(container);
        expect(dot).toBeInTheDocument();
        expect(dot?.tagName).toBe('SPAN');
        expect(dot?.className).toContain('status');
    });

    // ── State → color / title / aria-label ──

    const stateInfo: ReadonlyArray<
        readonly [StatusDotState, string, string, 'ready' | 'error' | 'building' | null]
    > = [
        ['QUEUED', 'Queued', 'This deployment is queued.', null],
        ['BUILDING', 'Building', 'This deployment is building.', 'building'],
        ['READY', 'Ready', 'This deployment is ready.', 'ready'],
        ['ERROR', 'Error', 'This deployment had an error.', 'error'],
        ['CANCELED', 'Canceled', 'This deployment was canceled.', null],
        ['DELETED', 'Deleted', 'This deployment was deleted.', null],
    ];

    it.each(stateInfo)(
        '%s sets aria-label "%s"',
        (state, name) => {
            const { container } = render(<StatusDot state={state} />);
            expect(getRoot(container)).toHaveAttribute('aria-label', name);
        },
    );

    it.each(stateInfo)(
        '%s composes the default title "%s"',
        (state, _name, title) => {
            const { container } = render(<StatusDot state={state} />);
            expect(getRoot(container)).toHaveAttribute('title', title);
        },
    );

    it.each(stateInfo)(
        '%s applies the expected dot color class',
        (state, _name, _title, color) => {
            const { container } = render(<StatusDot state={state} />);
            const dot = getDot(container);
            expect(dot?.className).toContain('status');
            const colored = ['ready', 'error', 'building'] as const;
            if (color) {
                expect(dot?.className).toContain(color);
            } else {
                colored.forEach((c) => expect(dot?.className).not.toContain(c));
            }
        },
    );

    // ── titlePrefix ──

    it('composes the title from a custom titlePrefix', () => {
        const { container } = render(
            <StatusDot state="BUILDING" titlePrefix="vercel-site production" />,
        );
        expect(getRoot(container)).toHaveAttribute(
            'title',
            'vercel-site production is building.',
        );
    });

    // ── label ──

    it('renders no visible label by default', () => {
        const { container } = render(<StatusDot state="READY" />);
        const root = getRoot(container);
        expect(root?.children).toHaveLength(1);
        expect(
            container.querySelector('span[class*="statusLabel"]'),
        ).not.toBeInTheDocument();
    });

    it('renders the sentence-cased state name when label is set', () => {
        const { container } = render(<StatusDot label state="BUILDING" />);
        const labelSpan = container.querySelector('span[class*="statusLabel"]');
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan?.textContent).toBe('Building');
        expect(screen.getByText('Building')).toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <StatusDot className="custom-dot" state="READY" />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('wrapper');
        expect(root?.className).toContain('custom-dot');
        expect(root?.className.endsWith('custom-dot')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<StatusDot ref={ref} state="READY" />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).toHaveAttribute('data-oxobz-status-dot');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-hidden, style)', () => {
        const { container } = render(
            <StatusDot
                aria-hidden="true"
                id="dot-1"
                state="READY"
                style={{ marginTop: '4px' }}
            />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'dot-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── Animated states (BUILDING / QUEUED pulse) ──

    it('animates the dot while BUILDING', () => {
        const { container } = render(<StatusDot state="BUILDING" />);
        const dot = container.querySelector('[data-oxobz-status-dot] > span');
        expect(dot?.className).toContain('animated');
    });

    it('animates the dot while QUEUED', () => {
        const { container } = render(<StatusDot state="QUEUED" />);
        const dot = container.querySelector('[data-oxobz-status-dot] > span');
        expect(dot?.className).toContain('animated');
    });

    it('does not animate terminal states (READY / ERROR)', () => {
        const ready = render(<StatusDot state="READY" />);
        expect(
            ready.container
                .querySelector('[data-oxobz-status-dot] > span')
                ?.className,
        ).not.toContain('animated');
        const error = render(<StatusDot state="ERROR" />);
        expect(
            error.container
                .querySelector('[data-oxobz-status-dot] > span')
                ?.className,
        ).not.toContain('animated');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(StatusDot.displayName).toBe('StatusDot');
    });
});
