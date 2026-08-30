import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Tooltip } from './Tooltip';

/** Returns the trigger span of the (single) rendered Tooltip */
function getTrigger(container: HTMLElement): HTMLElement {
    const trigger = container.querySelector<HTMLElement>(
        '[data-testid="legacy/tooltip-trigger"]',
    );
    if (!trigger) {
        throw new Error('Tooltip trigger not found');
    }
    return trigger;
}

describe('Tooltip', () => {
    // ── Rendering ──

    /* Penanda pemicu mengikuti produksi: data-testid legacy/tooltip-trigger
       plus data-state, TANPA data-oxobz-tooltip (terukur 30 Agu 2026). */
    it('renders a trigger span with the production markers and tabindex="0"', () => {
        const { container } = render(
            <Tooltip text="The Evil Rabbit Jumped over the Fence">
                <span>Top</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        expect(trigger.tagName).toBe('SPAN');
        expect(trigger).toHaveAttribute('data-version', 'v1');
        expect(trigger).toHaveAttribute('tabindex', '0');
        expect(trigger).toHaveAttribute('data-state', 'closed');
        expect(trigger).not.toHaveAttribute('data-oxobz-tooltip');
        expect(trigger.classList.contains('container')).toBe(true);
        expect(screen.getByText('Top')).toBeInTheDocument();
    });

    it('allows custom data-version', () => {
        const { container } = render(
            <Tooltip data-version="v2" text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(getTrigger(container)).toHaveAttribute('data-version', 'v2');
    });

    it('does not render the tooltip box before being triggered', () => {
        render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    // ── Hover behaviour ──

    it('shows the tooltip text on mouse enter', () => {
        const { container } = render(
            <Tooltip text="The Evil Rabbit">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent('The Evil Rabbit');
    });

    it('hides the tooltip on mouse leave', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        fireEvent.mouseEnter(trigger);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        fireEvent.mouseLeave(trigger);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders the production element chain absolute > relative > tooltip + triangle', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        const relative = tooltip.parentElement;
        const absolute = relative?.parentElement;
        expect(relative?.classList.contains('relative')).toBe(true);
        expect(absolute?.classList.contains('absolute')).toBe(true);
        const triangle = tooltip.querySelector('span[aria-hidden="true"]');
        expect(triangle?.classList.contains('triangle')).toBe(true);
    });

    it('links the trigger to the tooltip via aria-describedby while visible', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        expect(trigger).not.toHaveAttribute('aria-describedby');
        fireEvent.mouseEnter(trigger);
        const tooltip = screen.getByRole('tooltip');
        expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
        fireEvent.mouseLeave(trigger);
        expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    // ── Focus behaviour (accessibility) ──

    it('shows the tooltip on keyboard focus', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.focus(getTrigger(container));
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('hides the tooltip on blur', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        fireEvent.focus(trigger);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        fireEvent.blur(trigger);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('hides the tooltip on Escape', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.focus(getTrigger(container));
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('ignores non-Escape keys', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.focus(getTrigger(container));
        fireEvent.keyDown(document, { key: 'Enter' });
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    // ── Default classes ──

    it('applies tooltip, top, center, delay and tip classes by default', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.classList.contains('tooltip')).toBe(true);
        expect(tooltip.classList.contains('top')).toBe(true);
        expect(tooltip.classList.contains('center')).toBe(true);
        expect(tooltip.classList.contains('delay')).toBe(true);
        expect(tooltip.classList.contains('tip')).toBe(true);
    });

    // ── Positions ──

    it.each(['top', 'bottom', 'left', 'right'] as const)(
        'applies the %s position class',
        (position) => {
            const { container, unmount } = render(
                <Tooltip position={position} text="Tip">
                    <span>Trigger</span>
                </Tooltip>,
            );
            fireEvent.mouseEnter(getTrigger(container));
            expect(
                screen.getByRole('tooltip').classList.contains(position),
            ).toBe(true);
            unmount();
        },
    );

    // ── Types ──

    it.each(['success', 'error', 'warning', 'violet'] as const)(
        'applies the %s type class',
        (type) => {
            const { container, unmount } = render(
                <Tooltip text="Tip" type={type}>
                    <span>Trigger</span>
                </Tooltip>,
            );
            fireEvent.mouseEnter(getTrigger(container));
            expect(screen.getByRole('tooltip').classList.contains(type)).toBe(
                true,
            );
            unmount();
        },
    );

    it('applies no type class for the default type', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        for (const type of ['success', 'error', 'warning', 'violet']) {
            expect(tooltip.classList.contains(type)).toBe(false);
        }
    });

    // ── Box align ──

    it.each(['left', 'right'] as const)(
        'applies the box-align-%s class',
        (boxAlign) => {
            const { container, unmount } = render(
                <Tooltip boxAlign={boxAlign} position="bottom" text="Tip">
                    <span>Trigger</span>
                </Tooltip>,
            );
            fireEvent.mouseEnter(getTrigger(container));
            expect(
                screen
                    .getByRole('tooltip')
                    .classList.contains(`box-align-${boxAlign}`),
            ).toBe(true);
            unmount();
        },
    );

    it('applies no box-align class for the default (center) alignment', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.classList.contains('box-align-left')).toBe(false);
        expect(tooltip.classList.contains('box-align-right')).toBe(false);
    });

    // ── Boolean props ──

    it('omits the delay class when delay={false}', () => {
        const { container } = render(
            <Tooltip delay={false} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        expect(screen.getByRole('tooltip').classList.contains('delay')).toBe(
            false,
        );
    });

    it('omits the tip class when tip={false}', () => {
        const { container } = render(
            <Tooltip text="Tip" tip={false}>
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        expect(screen.getByRole('tooltip').classList.contains('tip')).toBe(
            false,
        );
    });

    it('omits the center class when center={false}', () => {
        const { container } = render(
            <Tooltip center={false} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        expect(screen.getByRole('tooltip').classList.contains('center')).toBe(
            false,
        );
    });

    it('applies the wrap class when wrap', () => {
        const { container } = render(
            <Tooltip text="Tip" wrap>
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        expect(screen.getByRole('tooltip').classList.contains('wrap')).toBe(
            true,
        );
    });

    // ── Faster re-entry ──

    it('applies the faster class when re-shown shortly after hiding', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseLeave(trigger);
        fireEvent.mouseEnter(trigger);
        expect(screen.getByRole('tooltip').classList.contains('faster')).toBe(
            true,
        );
    });

    // ── Custom content ──

    it('renders ReactNode text content', () => {
        const { container } = render(
            <Tooltip
                text={
                    <>
                        The <b>Evil Rabbit</b> Jumped
                    </>
                }
            >
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.mouseEnter(getTrigger(container));
        const bold = screen.getByRole('tooltip').querySelector('b');
        expect(bold).toHaveTextContent('Evil Rabbit');
    });

    // ── Custom className / prop forwarding ──

    it('appends custom className on the trigger', () => {
        const { container } = render(
            <Tooltip className="custom-tooltip" text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        expect(trigger.classList.contains('container')).toBe(true);
        expect(trigger.classList.contains('custom-tooltip')).toBe(true);
    });

    it('forwards extra HTML attributes to the trigger', () => {
        const { container } = render(
            <Tooltip aria-label="More info" text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(getTrigger(container)).toHaveAttribute(
            'aria-label',
            'More info',
        );
    });

    it('allows overriding tabIndex', () => {
        const { container } = render(
            <Tooltip tabIndex={-1} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(getTrigger(container)).toHaveAttribute('tabindex', '-1');
    });

    it('still calls user-provided mouse and focus handlers', () => {
        const onMouseEnter = vi.fn();
        const onMouseLeave = vi.fn();
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        const { container } = render(
            <Tooltip
                onBlur={onBlur}
                onFocus={onFocus}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                text="Tip"
            >
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseLeave(trigger);
        fireEvent.focus(trigger);
        fireEvent.blur(trigger);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    // ── Ref forwarding ──

    it('forwards ref to the trigger span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(
            <Tooltip ref={ref} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).not.toHaveAttribute('data-oxobz-tooltip');
        expect(ref.current).toHaveAttribute('data-testid', 'legacy/tooltip-trigger');
    });

    // ── Meta ──

    it('has the correct displayName', () => {
        expect(Tooltip.displayName).toBe('Tooltip');
    });
});
