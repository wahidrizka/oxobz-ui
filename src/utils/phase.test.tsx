import { act, fireEvent, render, screen } from '@testing-library/react';
import { Phase } from './phase';

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
