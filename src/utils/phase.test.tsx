import { act, fireEvent, render, screen } from '@testing-library/react';
import { Phase, Swap } from './phase';

/**
 * The exit path is what makes this primitive worth testing: the element has to
 * stay mounted while `data-phase="exiting"` so CSS can animate it out, and it
 * has to disappear afterwards whether or not a transition event ever arrives.
 */
describe('Phase', () => {
    it('renders its children with data-phase="entered" while shown', () => {
        render(
            <Phase data-testid="phase" show>
                <p>content</p>
            </Phase>,
        );
        expect(screen.getByTestId('phase')).toHaveAttribute('data-phase', 'entered');
        expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('omits data-enter for an instant enter, matching production', () => {
        render(
            <Phase data-testid="phase" enter="instant" show>
                <p>content</p>
            </Phase>,
        );
        expect(screen.getByTestId('phase')).not.toHaveAttribute('data-enter');
    });

    it('renders nothing when it was never shown', () => {
        render(
            <Phase data-testid="phase" show={false}>
                <p>content</p>
            </Phase>,
        );
        expect(screen.queryByTestId('phase')).not.toBeInTheDocument();
    });

    it('stays mounted as "exiting" when hidden, then leaves on transitionend', () => {
        const { rerender } = render(
            <Phase data-testid="phase" show>
                <p>content</p>
            </Phase>,
        );

        rerender(
            <Phase data-testid="phase" show={false}>
                <p>content</p>
            </Phase>,
        );

        const node = screen.getByTestId('phase');
        expect(node).toHaveAttribute('data-phase', 'exiting');

        fireEvent.transitionEnd(node);
        expect(screen.queryByTestId('phase')).not.toBeInTheDocument();
    });

    it('still leaves after exitDuration when no transition event fires', () => {
        vi.useFakeTimers();
        try {
            const { rerender } = render(
                <Phase data-testid="phase" exitDuration={400} show>
                    <p>content</p>
                </Phase>,
            );
            rerender(
                <Phase data-testid="phase" exitDuration={400} show={false}>
                    <p>content</p>
                </Phase>,
            );
            expect(screen.getByTestId('phase')).toHaveAttribute('data-phase', 'exiting');

            act(() => {
                vi.advanceTimersByTime(400);
            });
            expect(screen.queryByTestId('phase')).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it('comes back to "entered" when shown again mid-exit', () => {
        const { rerender } = render(
            <Phase data-testid="phase" show>
                <p>content</p>
            </Phase>,
        );
        rerender(
            <Phase data-testid="phase" show={false}>
                <p>content</p>
            </Phase>,
        );
        expect(screen.getByTestId('phase')).toHaveAttribute('data-phase', 'exiting');

        rerender(
            <Phase data-testid="phase" show>
                <p>content</p>
            </Phase>,
        );
        expect(screen.getByTestId('phase')).toHaveAttribute('data-phase', 'entered');
    });

    it('keeps the element through the exit when mode is "reveal"', () => {
        const { rerender } = render(
            <Phase data-testid="phase" mode="reveal" show>
                <p>content</p>
            </Phase>,
        );
        rerender(
            <Phase data-testid="phase" mode="reveal" show={false}>
                <p>content</p>
            </Phase>,
        );

        const node = screen.getByTestId('phase');
        fireEvent.transitionEnd(node);
        expect(screen.getByTestId('phase')).toHaveAttribute('data-phase', 'idle');
    });
});

describe('Swap', () => {
    it('mounts only the active state, entered and without data-enter', () => {
        const { container } = render(
            <Swap active="copy">
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
        );
        expect(container.querySelectorAll('[data-phase]')).toHaveLength(1);
        expect(screen.getByTestId('copy')).toHaveAttribute('data-phase', 'entered');
        expect(screen.getByTestId('copy')).not.toHaveAttribute('data-enter');
        expect(screen.getByTestId('copy')).not.toHaveAttribute('id');
        expect(screen.queryByTestId('check')).not.toBeInTheDocument();
    });

    it('exits the current state fully before mounting the next, which then animates in', () => {
        const { container, rerender } = render(
            <Swap active="copy">
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
        );
        rerender(
            <Swap active="check">
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
        );

        // Still the copy state, now exiting; the check state has not mounted.
        const copy = screen.getByTestId('copy');
        expect(copy).toHaveAttribute('data-phase', 'exiting');
        expect(copy).toHaveAttribute('data-enter', 'animate');
        expect(screen.queryByTestId('check')).not.toBeInTheDocument();
        expect(container.querySelectorAll('[data-phase]')).toHaveLength(1);

        fireEvent.transitionEnd(copy);
        expect(screen.queryByTestId('copy')).not.toBeInTheDocument();
        const check = screen.getByTestId('check');
        expect(check).toHaveAttribute('data-phase', 'entered');
        expect(check).toHaveAttribute('data-enter', 'animate');
    });

    it('falls back to exitDuration when no transition event fires', () => {
        vi.useFakeTimers();
        try {
            const { rerender } = render(
            <Swap active="copy" exitDuration={400}>
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
            );
            rerender(
            <Swap active="check" exitDuration={400}>
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
            );
            act(() => {
                vi.advanceTimersByTime(399);
            });
            expect(screen.getByTestId('copy')).toHaveAttribute('data-phase', 'exiting');
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(screen.queryByTestId('copy')).not.toBeInTheDocument();
            expect(screen.getByTestId('check')).toHaveAttribute('data-phase', 'entered');
        } finally {
            vi.useRealTimers();
        }
    });

    it('keeps data-enter="animate" on a state that comes back after a swap', () => {
        const { rerender } = render(
            <Swap active="copy">
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
        );
        rerender(
            <Swap active="check">
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
        );
        fireEvent.transitionEnd(screen.getByTestId('copy'));
        rerender(
            <Swap active="copy">
                <Swap.State data-testid="copy" id="copy">copy</Swap.State>
                <Swap.State data-testid="check" id="check">check</Swap.State>
            </Swap>,
        );
        fireEvent.transitionEnd(screen.getByTestId('check'));
        const copy = screen.getByTestId('copy');
        expect(copy).toHaveAttribute('data-phase', 'entered');
        expect(copy).toHaveAttribute('data-enter', 'animate');
    });

    it('throws when a State is rendered outside a Swap', () => {
        const silent = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            expect(() => render(<Swap.State id="copy">copy</Swap.State>)).toThrow(
                '<Swap.State> must be used inside <Swap>.',
            );
        } finally {
            silent.mockRestore();
        }
    });
});
