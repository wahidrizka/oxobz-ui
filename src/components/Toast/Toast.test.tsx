import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toasts, toasts, useToasts, type ToastOptions } from './Toast';

/*
 * Behaviour under test is production's own, read from the live bundle
 * (10 Nov 2026): visible after 10ms, gone by itself after 3500ms, 160ms to
 * leave, paused while hovered.
 */

/** Calls reach the area through a promise, so let it settle. */
async function send(run: () => void) {
    await act(async () => {
        run();
        await Promise.resolve();
    });
}

function tick(ms: number) {
    act(() => {
        vi.advanceTimersByTime(ms);
    });
}

const area = () => document.querySelector<HTMLElement>('[data-testid="toasts/list"]');
const cards = () => Array.from(document.querySelectorAll<HTMLElement>('[data-oxobz-toast]'));

describe('Toasts', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-10T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    // ── The area ──

    it('renders nothing until there is a toast', () => {
        const { container } = render(<Toasts />);
        expect(container.innerHTML).toBe('');
        expect(area()).toBeNull();
    });

    it('renders the area in a portal <div> directly under <body>', async () => {
        const { container } = render(<Toasts />);
        await send(() => toasts.message('Saved'));
        const list = area();
        expect(list).not.toBeNull();
        expect(container.contains(list)).toBe(false);
        expect(list?.parentElement?.tagName).toBe('DIV');
        expect(list?.parentElement?.parentElement).toBe(document.body);
        expect(list?.className).toBe('toastArea');
        expect(list?.style.getPropertyValue('--offset-bottom')).toBe('0px');
    });

    it('marks the area when centered and when it holds more than one toast', async () => {
        render(<Toasts center />);
        await send(() => toasts.message({ key: 'a', text: 'One' }));
        expect(area()?.className).toBe('toastArea center');
        await send(() => toasts.message({ key: 'b', text: 'Two' }));
        expect(area()?.className).toBe('toastArea center multiple');
    });

    it('renders into `containerRef` when given', async () => {
        const target = document.createElement('section');
        document.body.appendChild(target);
        render(<Toasts containerRef={{ current: target }} />);
        await send(() => toasts.message('Saved'));
        expect(area()?.parentElement?.parentElement).toBe(target);
        target.remove();
    });

    it('removes the area again once the last toast is gone', async () => {
        render(<Toasts />);
        await send(() => toasts.message('Saved'));
        tick(3500);
        tick(160);
        expect(area()).toBeNull();
    });

    // ── One toast ──

    it('renders a status card with the message and a dismiss button', async () => {
        render(<Toasts />);
        await send(() => toasts.message('Saved'));
        const [card] = cards();
        expect(card).toHaveAttribute('role', 'status');
        expect(card).toHaveAttribute('aria-atomic', 'true');
        expect(card).toHaveAttribute('aria-labelledby', '');
        expect(card).toHaveAttribute('data-version', 'v1');
        expect(card).toHaveAttribute('data-testid', `oxobz-toast/${Date.now()}`);
        expect(card.className).toBe('toastContainer');
        const message = card.querySelector('[id="toast-message"]');
        expect(message?.className).toBe('message');
        expect(message?.querySelector('span')).toHaveTextContent('Saved');
        expect(screen.getByRole('button', { name: 'Dismiss toast' })).toHaveAttribute('type', 'button');
        expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    });

    it('becomes visible 10ms after it mounts', async () => {
        render(<Toasts />);
        await send(() => toasts.message('Saved'));
        tick(9);
        expect(cards()[0].className).toBe('toastContainer');
        expect(cards()[0]).not.toHaveAttribute('style');
        tick(1);
        expect(cards()[0].className).toBe('toastContainer visible');
        expect(cards()[0].style.getPropertyValue('--y')).toBe('0px');
        expect(cards()[0].style.getPropertyValue('--z')).toBe('-0px');
    });

    it('accepts options as well as a plain string', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ key: 'My Key', text: <b>Bold</b> }));
        expect(cards()[0]).toHaveAttribute('data-testid', 'oxobz-toast/my-key');
        expect(cards()[0].querySelector('b')).toHaveTextContent('Bold');
    });

    it.each([
        ['success', 'Success!', true],
        ['error', 'An error occurred.', true],
        ['warning', 'Warning!', false],
    ] as const)('%s() colors the card and has a default text', async (type, fallback, announced) => {
        render(<Toasts />);
        await send(() => toasts[type]());
        const [card] = cards();
        expect(card.className).toBe(`toastContainer ${type}`);
        expect(card).toHaveAttribute('data-testid', `oxobz-toast-${type}/${Date.now()}`);
        expect(card).toHaveTextContent(fallback);
        const prefix = card.querySelector('.oxobz-sr-only');
        if (announced) expect(prefix).toHaveTextContent(`${type}:`);
        else expect(prefix).toBeNull();
        expect(card.querySelector('.controls')?.className).toBe(`controls controls-${type}`);
    });

    it('success(), error() and warning() take a text or options', async () => {
        render(<Toasts />);
        await send(() => toasts.error('Failed to copy'));
        expect(cards()[0]).toHaveTextContent('error: Failed to copy');
        await send(() => toasts.success({ key: 'k', text: 'Copied' }));
        expect(cards()[1]).toHaveAttribute('data-testid', 'oxobz-toast-success/k');
    });

    // ── Leaving ──

    it('leaves by itself after 3500ms, taking 160ms to go', async () => {
        const onRemove = vi.fn();
        render(<Toasts />);
        await send(() => toasts.message({ text: 'Saved', onRemove }));
        tick(3499);
        expect(cards()[0].className).toBe('toastContainer visible');
        tick(1);
        expect(cards()[0].className).toBe('toastContainer visible hiding');
        tick(159);
        expect(cards()).toHaveLength(1);
        tick(1);
        expect(cards()).toHaveLength(0);
        expect(onRemove).toHaveBeenCalledWith(false);
    });

    it('honours a custom timeout', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ text: 'Saved', timeout: 1000 }));
        tick(1000);
        tick(160);
        expect(cards()).toHaveLength(0);
    });

    it('stays with `preserve` or with an action, unless preserve is false', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ key: 'p', text: 'Kept', preserve: true }));
        await send(() => toasts.message({ key: 'a', text: 'Kept too', action: 'Open' }));
        await send(() => toasts.message({ key: 'f', text: 'Goes', action: 'Open', preserve: false }));
        tick(3500);
        tick(160);
        expect(cards().map((card) => card.getAttribute('data-testid'))).toEqual([
            'oxobz-toast/p',
            'oxobz-toast/a',
        ]);
    });

    it('pauses while the area is hovered and starts over after', async () => {
        render(<Toasts />);
        await send(() => toasts.message('Saved'));
        tick(3000);
        fireEvent.mouseEnter(area() as HTMLElement);
        tick(10000);
        expect(cards()).toHaveLength(1);
        fireEvent.mouseLeave(area() as HTMLElement);
        tick(3499);
        expect(cards()[0].className).not.toContain('hiding');
        tick(1);
        tick(160);
        expect(cards()).toHaveLength(0);
    });

    it('the dismiss button removes it and reports a user dismissal', async () => {
        const onRemove = vi.fn();
        render(<Toasts />);
        await send(() => toasts.message({ text: 'Saved', onRemove }));
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss toast' }));
        expect(cards()[0].className).toContain('hiding');
        tick(160);
        expect(cards()).toHaveLength(0);
        expect(onRemove).toHaveBeenCalledWith(true);
    });

    // ── Actions ──

    it('renders the action row as an alertdialog, without the dismiss button', async () => {
        const onAction = vi.fn();
        const onCancelAction = vi.fn();
        render(<Toasts />);
        await send(() =>
            toasts.message({ text: 'Deleted', action: 'Restore', onAction, onCancelAction }),
        );
        const [card] = cards();
        expect(card).toHaveAttribute('role', 'alertdialog');
        expect(card).toHaveAttribute('aria-labelledby', 'toast-message');
        expect(screen.queryByRole('button', { name: 'Dismiss toast' })).toBeNull();
        expect(card.querySelector('.actions')).not.toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
        expect(onAction).toHaveBeenCalledTimes(1);
        tick(160);
        expect(cards()).toHaveLength(0);
        expect(onCancelAction).not.toHaveBeenCalled();
    });

    it('the secondary action defaults to "Dismiss" and calls onCancelAction', async () => {
        const onCancelAction = vi.fn();
        render(<Toasts />);
        await send(() => toasts.message({ key: 'a', text: 'Deleted', action: 'Restore', onCancelAction }));
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
        expect(onCancelAction).toHaveBeenCalledTimes(1);
        tick(160);
        await send(() =>
            toasts.message({ key: 'b', text: 'Deleted', action: 'Restore', cancelAction: 'Keep' }),
        );
        expect(screen.getByRole('button', { name: 'Keep' }).className).toContain('cancel');
    });

    it('turns the action into a link with `actionHref`', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ text: 'Deployed', action: 'Visit', actionHref: '/site' }));
        expect(screen.getByRole('link', { name: 'Visit' })).toHaveAttribute('href', '/site');
    });

    it('focuses the action with `autoFocus`', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ text: 'Deleted', action: 'Restore', autoFocus: true }));
        tick(10);
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Restore' }));
    });

    it('adds an Undo button that calls back and removes the toast', async () => {
        const onUndoAction = vi.fn();
        render(<Toasts />);
        await send(() => toasts.message({ text: 'Archived', onUndoAction }));
        const undo = screen.getByRole('button', { name: 'Undo' });
        expect(undo.className).toContain('undo');
        expect(undo.nextElementSibling).toBe(screen.getByRole('button', { name: 'Dismiss toast' }));
        fireEvent.click(undo);
        expect(onUndoAction).toHaveBeenCalledTimes(1);
        tick(160);
        expect(cards()).toHaveLength(0);
    });

    // ── Card options ──

    it('applies hideX, fullWidth, fullBleed, overflowHidden and containerClassName', async () => {
        render(<Toasts />);
        await send(() =>
            toasts.message({
                key: 'a',
                text: 'Wide',
                hideX: true,
                fullBleed: true,
                overflowHidden: true,
                containerClassName: 'mine',
            }),
        );
        const [card] = cards();
        expect(card.className).toBe('toastContainer mine fullBleed overflowHidden');
        expect(card.querySelector('[id="toast-message"]')?.className).toBe('message fullWidth');
        expect(screen.queryByRole('button', { name: 'Dismiss toast' })).toBeNull();
        await send(() => toasts.message({ key: 'b', text: 'Wide', fullWidth: true }));
        expect(cards()[1].querySelector('[id="toast-message"]')?.className).toBe('message fullWidth');
    });

    it('renders a visual header, with its own height when given', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ key: 'a', text: 'Hi', visual: <i>art</i> }));
        const first = cards()[0].querySelector<HTMLElement>('.visual');
        expect(first?.querySelector('i')).toHaveTextContent('art');
        expect(first?.style.height).toBe('');
        expect(cards()[0].className).toContain('overflowHidden');
        await send(() =>
            toasts.message({ key: 'b', text: 'Hi', visual: { height: 80, component: <i>art</i> } }),
        );
        expect(cards()[1].querySelector<HTMLElement>('.visual')?.style.height).toBe('80px');
    });

    // ── The stack ──

    it('tucks older toasts behind the newest, from their measured heights', async () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            right: 420,
            bottom: 53,
            width: 420,
            height: 53,
            toJSON: () => ({}),
        });
        render(<Toasts />);
        await send(() => toasts.message({ key: 'old', text: 'Older', preserve: true }));
        // Heights arrive two animation frames after a toast mounts.
        tick(100);
        await send(() => toasts.message({ key: 'new', text: 'Newer', preserve: true }));
        tick(100);
        const [older, newer] = cards();
        expect(newer.style.maxHeight).toBe('53px');
        expect(newer.style.transform).toBe('');
        expect(newer.style.getPropertyValue('--y')).toBe('0px');
        expect(newer.style.getPropertyValue('--max-height')).toBe('53px');
        expect(older.style.maxHeight).toBe('50px');
        expect(older.style.transform).toBe(
            'translate3d(0, calc(-53px + 100% + -20px), -1px) scale(0.95)',
        );
        expect(older.style.getPropertyValue('--y')).toBe('-73px');
        expect(older.style.getPropertyValue('--z')).toBe('-1px');
    });

    // ── The list ──

    it('ignores a second message with the same key', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ key: 'a', text: 'One' }));
        await send(() => toasts.message({ key: 'a', text: 'Again' }));
        expect(cards()).toHaveLength(1);
        expect(cards()[0]).toHaveTextContent('One');
    });

    it('removeToastByKey, removeToast and clear drop toasts at once', async () => {
        render(<Toasts />);
        const add = async (keys: string[]) => {
            for (const key of keys) {
                await send(() => toasts.message({ key, text: key, preserve: true }));
            }
        };
        const keys = () => cards().map((card) => card.textContent);
        await add(['a', 'b', 'c', 'd']);
        await send(() => toasts.removeToastByKey('b'));
        expect(keys()).toEqual(['a', 'c', 'd']);
        await send(() => toasts.removeToastByKey(['a', 'd']));
        expect(keys()).toEqual(['c']);
        await add(['e']);
        await send(() => toasts.removeToast(0));
        expect(keys()).toEqual(['e']);
        await send(() => toasts.clear());
        expect(area()).toBeNull();
    });

    it('setMessage replaces the list, setHiding sends every toast away', async () => {
        render(<Toasts />);
        await send(() => toasts.message({ key: 'a', text: 'One', preserve: true }));
        await send(() => toasts.setMessage('Only'));
        expect(cards()).toHaveLength(1);
        expect(cards()[0]).toHaveTextContent('Only');
        expect(cards()[0]).toHaveAttribute('data-testid', 'oxobz-toast/toast-0');
        await send(() => toasts.setHiding());
        tick(300);
        tick(160);
        expect(cards()).toHaveLength(0);
    });

    // ── The global object ──

    it('useToasts returns the global object, and `current` mirrors it', () => {
        expect(useToasts()).toBe(toasts);
        const methods: Array<keyof ToastOptions | string> = Object.keys(toasts.current);
        expect(methods).toEqual([
            'clear',
            'error',
            'message',
            'removeToast',
            'removeToastByKey',
            'setMessage',
            'setHiding',
            'success',
            'warning',
        ]);
    });

    it('delivers calls made before the area is mounted', async () => {
        expect(toasts.loaded).toBe(false);
        toasts.message('Early');
        render(<Toasts />);
        expect(toasts.loaded).toBe(true);
        await send(() => undefined);
        expect(cards()[0]).toHaveTextContent('Early');
    });

    it('only the first area renders; the next takes over when it unmounts', async () => {
        const first = render(<Toasts />);
        render(<Toasts center />);
        await send(() => toasts.message({ key: 'a', text: 'One', preserve: true }));
        expect(document.querySelectorAll('[data-testid="toasts/list"]')).toHaveLength(1);
        expect(area()?.className).toBe('toastArea');
        first.unmount();
        expect(toasts.loaded).toBe(true);
        await send(() => toasts.message({ key: 'b', text: 'Two', preserve: true }));
        expect(area()?.className).toBe('toastArea center');
        expect(cards()).toHaveLength(1);
        expect(cards()[0]).toHaveTextContent('Two');
    });
});
