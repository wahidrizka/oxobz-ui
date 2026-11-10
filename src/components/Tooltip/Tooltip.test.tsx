import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { Tooltip } from './Tooltip';

/*
 * Behaviour under test is production's own, read from the live bundle and
 * measured on vercel.com/geist/tooltip on 10 Nov 2026. The numbers in the
 * placement tests are the ones measured there.
 */

const TEXT = 'The Evil Rabbit Jumped over the Fence';

function getTrigger(container: HTMLElement): HTMLElement {
    const trigger = container.querySelector<HTMLElement>('[data-testid="legacy/tooltip-trigger"]');
    if (!trigger) throw new Error('Tooltip trigger not found');
    return trigger;
}

function tick(ms = 0) {
    act(() => {
        vi.advanceTimersByTime(ms);
    });
}

/** Hover the trigger and let the (0ms) open timer run. */
function hover(trigger: HTMLElement) {
    fireEvent.pointerEnter(trigger);
    tick();
}

/** Give every element the rect measured for the first trigger on the live page. */
function mockRect(rect: { top: number; left: number; width: number; height: number }) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        ...rect,
        x: rect.left,
        y: rect.top,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        toJSON: () => ({}),
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
        configurable: true,
        value: 1385,
    });
}

describe('Tooltip', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockRect({ top: 384, left: 503.953, width: 26.0938, height: 24 });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    // ── Trigger ──

    it('renders a trigger span with the production markers', () => {
        const { container } = render(
            <Tooltip text={TEXT}>
                <span>Top</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        expect(trigger.tagName).toBe('SPAN');
        expect(trigger).toHaveAttribute('data-version', 'v1');
        expect(trigger).toHaveAttribute('tabindex', '0');
        expect(trigger).not.toHaveAttribute('style');
        expect(trigger).not.toHaveAttribute('data-state');
        expect(trigger.className).toBe('container');
        expect(screen.getByText('Top')).toBeInTheDocument();
    });

    it('renders only the children when there is no text', () => {
        const { container } = render(
            <Tooltip>
                <span>Bare</span>
            </Tooltip>,
        );
        expect(container.innerHTML).toBe('<span>Bare</span>');
    });

    it('appends className last, forwards other attributes, and lets them override', () => {
        const { container } = render(
            <Tooltip aria-label="More" className="mine" data-version="v2" id="t" text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        expect(trigger.className).toBe('container mine');
        expect(trigger).toHaveAttribute('aria-label', 'More');
        expect(trigger).toHaveAttribute('id', 't');
        expect(trigger).toHaveAttribute('data-version', 'v2');
    });

    it('supports tabIndex override and tabIndex={null}', () => {
        const { container, rerender } = render(
            <Tooltip tabIndex={-1} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(getTrigger(container)).toHaveAttribute('tabindex', '-1');
        rerender(
            <Tooltip tabIndex={null} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(getTrigger(container)).not.toHaveAttribute('tabindex');
    });

    it('renders another element with `as`, `htmlType` and `cursor`', () => {
        const { container } = render(
            <Tooltip as="button" cursor="help" htmlType="button" text="Tip">
                Trigger
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger.style.cursor).toBe('help');
    });

    // ── Opening and closing ──

    it('is closed until triggered', () => {
        render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('opens on pointer enter, inside a portal <div> directly under <body>', () => {
        const { container } = render(
            <Tooltip text={TEXT}>
                <span>Top</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        hover(trigger);
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent(TEXT);
        expect(trigger.contains(tooltip)).toBe(false);
        const host = tooltip.parentElement;
        expect(host?.tagName).toBe('DIV');
        expect(host?.parentElement).toBe(document.body);
        expect(host?.children).toHaveLength(1);
        expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
        expect(tooltip.id.startsWith('tooltip-')).toBe(true);
    });

    it('closes 100ms after the pointer leaves', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        const trigger = getTrigger(container);
        hover(trigger);
        fireEvent.pointerLeave(trigger);
        tick(99);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        tick(1);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    it('waits `delayTime` before opening, unless delay is off', () => {
        const { container, rerender } = render(
            <Tooltip delayTime={300} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.pointerEnter(getTrigger(container));
        tick(299);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        tick(1);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();

        fireEvent.pointerLeave(getTrigger(container));
        tick(100);
        rerender(
            <Tooltip delay={false} delayTime={300} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('does not open on focus alone, but does with `sticky`', () => {
        const { container, rerender } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.focus(getTrigger(container));
        tick();
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

        rerender(
            <Tooltip sticky text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.focus(getTrigger(container));
        tick();
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        fireEvent.blur(getTrigger(container));
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('opens on Enter and on Space', () => {
        for (const key of ['Enter', ' ']) {
            const { container, unmount } = render(
                <Tooltip text="Tip">
                    <span>Trigger</span>
                </Tooltip>,
            );
            fireEvent.keyDown(getTrigger(container), { key });
            tick();
            expect(screen.getByRole('tooltip')).toBeInTheDocument();
            unmount();
        }
    });

    it('closes on Escape, wherever the key is pressed', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        fireEvent.keyDown(window, { key: 'a' });
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('closes when anything scrolls', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        fireEvent.scroll(document.body);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('starts open with `shown`, and stays out of the page with `forceHide`', () => {
        const { rerender } = render(
            <Tooltip shown={1} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        rerender(
            <Tooltip forceHide shown={1} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('never opens with `disableTriggers`, and renders only the children', () => {
        const { container } = render(
            <Tooltip disableTriggers text="Tip">
                <span>Bare</span>
            </Tooltip>,
        );
        expect(container.innerHTML).toBe('<span>Bare</span>');
    });

    it('renders into `containerRef` when given', () => {
        const target = document.createElement('section');
        document.body.appendChild(target);
        const ref = { current: target };
        const { container } = render(
            <Tooltip containerRef={ref} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip').parentElement?.parentElement).toBe(target);
        target.remove();
    });

    // ── Touch ──

    it('opens on a tap, with the touch layer and the short delay', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.pointerEnter(getTrigger(container), {
            pointerType: 'touch',
            clientX: 10,
            clientY: 10,
        });
        const end = new Event('touchend', { bubbles: true });
        Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 12, clientY: 11 }] });
        act(() => {
            window.dispatchEvent(end);
        });
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.className).toContain('faster');
        expect(tooltip.previousElementSibling?.className).toBe('overlay');
    });

    it('ignores touch with `desktopOnly`', () => {
        const { container } = render(
            <Tooltip desktopOnly text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        fireEvent.pointerEnter(getTrigger(container), {
            pointerType: 'touch',
            clientX: 10,
            clientY: 10,
        });
        const end = new Event('touchend', { bubbles: true });
        Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 10, clientY: 10 }] });
        act(() => {
            window.dispatchEvent(end);
        });
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    // ── Box ──

    it('applies the default classes: top, wrap, center and the inverted theme', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip').className).toBe('tooltip top wrap center invert-theme');
    });

    it('reflects delay, lowerDelay, wrap, center, invertTheme and tooltipClassName', () => {
        const { container } = render(
            <Tooltip
                center={false}
                delay={false}
                invertTheme={false}
                lowerDelay
                text="Tip"
                tooltipClassName="mine"
                wrap={false}
            >
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip').className).toBe('tooltip top faster noDelay mine');
    });

    it.each(['success', 'error', 'warning', 'violet'] as const)(
        'adds the %s type class, filled by default',
        (type) => {
            const { container, rerender } = render(
                <Tooltip text="Tip" type={type}>
                    <span>Trigger</span>
                </Tooltip>,
            );
            hover(getTrigger(container));
            expect(screen.getByRole('tooltip').className).toBe(
                `tooltip top wrap center ${type} fill invert-theme`,
            );
            rerender(
                <Tooltip fill={false} text="Tip" type={type}>
                    <span>Trigger</span>
                </Tooltip>,
            );
            expect(screen.getByRole('tooltip').className).toBe(
                `tooltip top wrap center ${type} invert-theme`,
            );
        },
    );

    it('drops the trailing period of plain text only', () => {
        const { container, rerender } = render(
            <Tooltip text="Jumped multiple times.">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip')).toHaveTextContent(/^Jumped multiple times$/);
        rerender(
            <Tooltip
                text={
                    <>
                        The <b>Evil Rabbit</b> Jumped.
                    </>
                }
            >
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(screen.getByRole('tooltip')).toHaveTextContent(/^The Evil Rabbit Jumped\.$/);
    });

    // ── Arrow ──

    it('puts the arrow first, as a <div> holding the 14×6 drawing', () => {
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const arrow = screen.getByRole('tooltip').firstElementChild;
        expect(arrow?.tagName).toBe('DIV');
        expect(arrow?.className).toBe('arrow arrow-top arrow-top-center');
        expect(arrow?.hasAttribute('aria-hidden')).toBe(false);
        const svg = arrow?.querySelector('svg');
        expect(svg).toHaveAttribute('width', '14');
        expect(svg).toHaveAttribute('height', '6');
        expect(svg).toHaveAttribute('viewBox', '0 0 14 6');
        expect(svg?.querySelector('path')?.getAttribute('d')?.startsWith('M13.8284 0H0.17157')).toBe(
            true,
        );
    });

    it.each([
        ['bottom', 'arrow arrow-bottom arrow-bottom-center', '14', 'M0.17157 6L13.8284 6'],
        ['left', 'arrow arrow-left', '6', 'M8.33551e-07 13.8284L0 0.17157'],
        ['right', 'arrow arrow-right', '6', 'M6 13.8284L6 0.171575'],
    ] as const)('draws its own arrow for position="%s"', (position, className, width, d) => {
        const { container } = render(
            <Tooltip position={position} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.className).toContain(`tooltip ${position} `);
        const arrow = tooltip.firstElementChild;
        expect(arrow?.className).toBe(className);
        expect(arrow?.querySelector('svg')).toHaveAttribute('width', width);
        expect(arrow?.querySelector('path')?.getAttribute('d')?.startsWith(d)).toBe(true);
    });

    it('renders no arrow with tip={false}', () => {
        const { container } = render(
            <Tooltip text="Tip" tip={false}>
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip').querySelector('svg')).toBeNull();
    });

    // ── Placement (numbers measured on the live page) ──

    it('places the box from the measured trigger: top', () => {
        const { container } = render(
            <Tooltip text={TEXT}>
                <span>Top</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const { style } = screen.getByRole('tooltip');
        expect(style.maxWidth).toBe('250px');
        expect(style.top).toBe('384px');
        expect(style.left).toBe('503.953px');
        expect(style.transform).toBe('translate(calc(-50% + 14px), calc(-100% - 10px))');
    });

    it.each([
        ['bottom', 'translate(calc(-50% + 14px), calc(24px + 10px))'],
        ['left', 'translate(calc(-100% - 10px), calc(-50% + 12px))'],
        ['right', 'translate(calc(27px + 10px), calc(-50% + 12px))'],
    ] as const)('places the box from the measured trigger: %s', (position, transform) => {
        const { container } = render(
            <Tooltip position={position} text={TEXT}>
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const { style } = screen.getByRole('tooltip');
        expect(style.top).toBe('384px');
        expect(style.left).toBe('503.953px');
        expect(style.transform).toBe(transform);
    });

    it('adds the page scroll to the measured position', () => {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 562 });
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip').style.top).toBe('946px');
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    });

    it('anchors to the right edge with boxAlign="right"', () => {
        const { container } = render(
            <Tooltip boxAlign="right" position="bottom" text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.style.left).toBe('');
        // 1385 - (503.953 + 26.0938)
        expect(parseFloat(tooltip.style.right)).toBeCloseTo(854.9532, 3);
        expect(tooltip.style.transform).toBe('translate(0, calc(24px + 10px))');
        expect(tooltip.firstElementChild?.className).toBe('arrow arrow-bottom arrow-bottom-right');
    });

    it('keeps the box on the trigger side with boxAlign="left"', () => {
        const { container } = render(
            <Tooltip boxAlign="left" text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.style.left).toBe('503.953px');
        expect(tooltip.style.transform).toBe('translate(0, calc(-100% - 10px))');
        expect(tooltip.firstElementChild?.className).toBe('arrow arrow-top arrow-top-left');
    });

    it('shifts the box by itself when the trigger is within 100px of the left edge', () => {
        mockRect({ top: 384, left: 40, width: 26.0938, height: 24 });
        const { container } = render(
            <Tooltip text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.style.transform).toBe(
            'translate(calc(14px - var(--tooltip-arrow-offset)), calc(-100% - 10px))',
        );
        expect(tooltip.firstElementChild?.className).toBe('arrow arrow-top arrow-top-left');
    });

    it('picks bottom for position="auto" when the trigger is in the upper half', () => {
        const { container } = render(
            <Tooltip position="auto" text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        // jsdom's window is 768px tall; 384 is not above its middle
        expect(screen.getByRole('tooltip').className).toContain('tooltip top ');
        mockRect({ top: 100, left: 503.953, width: 26.0938, height: 24 });
        fireEvent.pointerLeave(getTrigger(container));
        tick(100);
        hover(getTrigger(container));
        expect(screen.getByRole('tooltip').className).toContain('tooltip bottom ');
    });

    it('applies maxWidth, padding and tooltipStyle to the box', () => {
        const { container } = render(
            <Tooltip maxWidth="400px" padding="2px" text="Tip" tooltipStyle={{ zIndex: 5 }}>
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const { style } = screen.getByRole('tooltip');
        expect(style.maxWidth).toBe('400px');
        expect(style.padding).toBe('2px');
        expect(style.zIndex).toBe('5');
    });

    // ── Ref ──

    it('forwards ref to the trigger', () => {
        const ref = createRef<HTMLElement>();
        const { container } = render(
            <Tooltip ref={ref} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        expect(ref.current).toBe(getTrigger(container));
    });

    /* Production spreads the remaining props after its own ref, so a `ref`
       prop from outside, even `null`, replaces the one it measures with.
       Measured on vercel.com/geist/colors, where a Radix `asChild` trigger
       hands `ref: null` to each Tooltip: the box stays at
       `top: 0px; left: 0px` with a 0px offset. */
    it.each([
        ['a real ref', createRef<HTMLElement>()],
        ['ref={null}', null],
    ])('leaves the box unplaced when given %s, as production does', (_label, ref) => {
        const { container } = render(
            <Tooltip ref={ref} text="Tip">
                <span>Trigger</span>
            </Tooltip>,
        );
        hover(getTrigger(container));
        const { style } = screen.getByRole('tooltip');
        expect(style.top).toBe('0px');
        expect(style.left).toBe('0px');
        expect(style.transform).toBe('translate(calc(-50% + 0px), calc(-100% - 10px))');
    });

    it('has the correct displayName', () => {
        expect(Tooltip.displayName).toBe('Tooltip');
    });
});
