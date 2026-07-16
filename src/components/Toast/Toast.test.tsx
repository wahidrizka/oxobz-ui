import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastArea, useToasts, type ToastOptions, type ToastType } from './Toast';

/* ------------------------------------------------------------------ */
/*  Test helpers                                                       */
/* ------------------------------------------------------------------ */

/** Fires `toasts.message(options)` on click. */
function MessageTrigger({ options }: { options: ToastOptions }) {
    const toasts = useToasts();
    return (
        <button onClick={() => toasts.message(options)} type="button">
            show
        </button>
    );
}

/** Fires `toasts[kind](text)` on click. */
function TypedTrigger({ kind, text }: { kind: ToastType; text: string }) {
    const toasts = useToasts();
    return (
        <button onClick={() => toasts[kind](text)} type="button">
            show
        </button>
    );
}

function renderWithArea(ui: ReactNode) {
    return render(<ToastArea>{ui}</ToastArea>);
}

function fireShow() {
    fireEvent.click(screen.getByRole('button', { name: 'show' }));
}

describe('Toast', () => {
    beforeEach(() => {
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /* ── ToastArea (provider + region) ── */

    it('renders the toast region with data-oxobz-toast-area and data-version="v1"', () => {
        const { container } = render(<ToastArea />);
        const area = container.querySelector('[data-oxobz-toast-area]');
        expect(area).toBeInTheDocument();
        expect(area?.tagName).toBe('DIV');
        expect(area).toHaveAttribute('data-version', 'v1');
        expect(area?.className).toContain('toastArea');
    });

    it('announces politely by default and allows override', () => {
        const { container, rerender } = render(<ToastArea />);
        expect(container.querySelector('[data-oxobz-toast-area]')).toHaveAttribute(
            'aria-live',
            'polite',
        );
        rerender(<ToastArea aria-live="assertive" />);
        expect(container.querySelector('[data-oxobz-toast-area]')).toHaveAttribute(
            'aria-live',
            'assertive',
        );
    });

    it('merges a custom className onto the region', () => {
        const { container } = render(<ToastArea className="my-area" />);
        const area = container.querySelector('[data-oxobz-toast-area]');
        expect(area?.className).toContain('toastArea');
        expect(area?.className).toContain('my-area');
    });

    it('applies the center class when center is set', () => {
        const { container } = render(<ToastArea center />);
        expect(container.querySelector('[data-oxobz-toast-area]')?.className).toContain(
            'center',
        );
    });

    it('forwards the ref to the region element', () => {
        const ref = createRef<HTMLDivElement>();
        render(<ToastArea ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-toast-area');
    });

    /* ── useToasts contract ── */

    it('throws when useToasts is used outside a ToastArea', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        function Bad() {
            useToasts();
            return null;
        }
        expect(() => render(<Bad />)).toThrow(/useToasts must be used within/);
        spy.mockRestore();
    });

    /* ── message() ── */

    it('enqueues a toast whose container carries data-oxobz-toast and data-version="v1"', () => {
        const { container } = renderWithArea(
            <MessageTrigger options={{ text: 'Domain added' }} />,
        );
        fireShow();
        const toast = container.querySelector('[data-oxobz-toast]');
        expect(toast).toBeInTheDocument();
        expect(toast).toHaveAttribute('data-version', 'v1');
        expect(toast?.className).toContain('toastContainer');
        expect(screen.getByText('Domain added')).toBeInTheDocument();
    });

    it('renders JSX message content', () => {
        renderWithArea(
            <MessageTrigger
                options={{
                    text: (
                        <>
                            <strong>The Evil Rabbit</strong> jumped
                        </>
                    ),
                    preserve: true,
                }}
            />,
        );
        fireShow();
        expect(screen.getByText('The Evil Rabbit')).toBeInTheDocument();
    });

    it('transitions the toast into the visible phase after mount', async () => {
        const { container } = renderWithArea(
            <MessageTrigger options={{ text: 'Project archived', preserve: true }} />,
        );
        fireShow();
        await waitFor(() => {
            expect(container.querySelector('[data-oxobz-toast]')?.className).toContain(
                'visible',
            );
        });
    });

    it('marks the region as multiple once more than one toast is queued', () => {
        const { container } = renderWithArea(
            <MessageTrigger options={{ text: 'Queued', preserve: true }} />,
        );
        const area = container.querySelector('[data-oxobz-toast-area]');
        fireShow();
        expect(area?.className).not.toContain('multiple');
        fireShow();
        expect(area?.className).toContain('multiple');
    });

    /* ── success / warning / error ── */

    it.each<[ToastType, string]>([
        ['success', 'success'],
        ['warning', 'warning'],
        ['error', 'error'],
    ])('applies the %s type class', (kind, cls) => {
        const { container } = renderWithArea(<TypedTrigger kind={kind} text="Ok" />);
        fireShow();
        expect(container.querySelector('[data-oxobz-toast]')?.className).toContain(cls);
    });

    /* ── auto-dismiss / preserve ── */

    it('auto-dismisses a default toast after its duration', async () => {
        const { container } = renderWithArea(
            <MessageTrigger options={{ text: 'Transient', duration: 40 }} />,
        );
        fireShow();
        expect(container.querySelector('[data-oxobz-toast]')).toBeInTheDocument();
        await waitFor(
            () => {
                expect(container.querySelector('[data-oxobz-toast]')).not.toBeInTheDocument();
            },
            { timeout: 2000 },
        );
    });

    it('keeps a preserved toast on screen', async () => {
        const { container } = renderWithArea(
            <MessageTrigger options={{ text: 'Sticky', preserve: true, duration: 20 }} />,
        );
        fireShow();
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 120));
        });
        expect(container.querySelector('[data-oxobz-toast]')).toBeInTheDocument();
    });

    /* ── inline action ── */

    it('renders an inline action button that dismisses on click', async () => {
        const { container } = renderWithArea(
            <MessageTrigger options={{ text: 'Undo me', action: 'Undo', preserve: true }} />,
        );
        fireShow();
        const button = screen.getByRole('button', { name: 'Undo' });
        expect(button).toBeInTheDocument();
        fireEvent.click(button);
        await waitFor(() => {
            expect(container.querySelector('[data-oxobz-toast]')).not.toBeInTheDocument();
        });
    });

    /* ── onUndoAction (full actions) ── */

    it('renders a full-width Undo row and invokes onUndoAction', async () => {
        const onUndoAction = vi.fn();
        const { container } = renderWithArea(
            <MessageTrigger
                options={{ text: 'Deleted', onUndoAction, preserve: true }}
            />,
        );
        fireShow();

        const actions = container.querySelector('[class*="fullActions"]');
        expect(actions).toBeInTheDocument();

        // The message becomes full-width in the undo layout.
        expect(container.querySelector('[class*="message"]')?.className).toContain(
            'fullWidth',
        );

        fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
        expect(onUndoAction).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(container.querySelector('[data-oxobz-toast]')).not.toBeInTheDocument();
        });
    });

    it('renders a dismiss button in the undo layout', () => {
        const { container } = renderWithArea(
            <MessageTrigger
                options={{ text: 'Deleted', onUndoAction: () => {}, preserve: true }}
            />,
        );
        fireShow();
        expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    /* ── structural extensions ── */

    it('renders a visual header with the requested height', () => {
        const { container } = renderWithArea(
            <MessageTrigger
                options={{
                    text: 'With visual',
                    visual: <div>banner</div>,
                    visualHeight: 96,
                    fullBleed: true,
                    preserve: true,
                }}
            />,
        );
        fireShow();
        const visual = container.querySelector('[class*="visualContainer"]');
        expect(visual).toBeInTheDocument();
        expect((visual as HTMLElement).style.getPropertyValue('--visual-height')).toBe(
            '96px',
        );
        expect(container.querySelector('[data-oxobz-toast]')?.className).toContain(
            'fullBleed',
        );
    });
});
