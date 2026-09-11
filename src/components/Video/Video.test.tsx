import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef, type ReactElement } from 'react';
import { Pause, Play } from '@oxobz/icons';
import { Video } from './Video';

const SRC = 'https://example.com/geist.mp4';
const base = { src: SRC, width: 600, height: 582, lazy: false };

function getFigure(container: HTMLElement) {
    return container.querySelector('figure');
}

function getVideo(container: HTMLElement) {
    return container.querySelector('video');
}

function getBar(container: HTMLElement) {
    return container.querySelector('video + div');
}

/** Puts jsdom's inert <video> into a "can play" state and fires the event production listens to. */
function loadVideo(video: HTMLVideoElement, duration = 20) {
    Object.defineProperty(video, 'readyState', { value: 4, configurable: true });
    Object.defineProperty(video, 'duration', { value: duration, configurable: true });
    fireEvent.loadedData(video);
}

/** Path data of an icon as this test environment renders it. */
function pathOf(icon: ReactElement) {
    const { container, unmount } = render(icon);
    const d = container.querySelector('path')?.getAttribute('d') ?? '';
    unmount();
    return d;
}

/** Which icon the control button shows, matched against real renders of Play and Pause. */
function iconOf(container: HTMLElement) {
    const d = container.querySelector('video + div > button path')?.getAttribute('d') ?? '';
    if (d === pathOf(<Play />)) return 'play';
    if (d === pathOf(<Pause />)) return 'pause';
    return 'unknown';
}

describe('Video', () => {
    let play: ReturnType<typeof vi.fn>;
    let pause: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        play = vi.fn().mockResolvedValue(undefined);
        pause = vi.fn();
        Object.defineProperty(HTMLMediaElement.prototype, 'play', { value: play, configurable: true });
        Object.defineProperty(HTMLMediaElement.prototype, 'pause', { value: pause, configurable: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Figure ──

    it('renders a figure with data-version="v1" and no component marker', () => {
        const { container } = render(<Video {...base} />);
        const figure = getFigure(container);
        expect(figure).toHaveAttribute('data-version', 'v1');
        expect(figure).toHaveAttribute('role', 'region');
        expect(figure).toHaveAttribute('aria-label', 'Video player');
        expect(figure).not.toHaveAttribute('data-oxobz-video');
    });

    it('sets --video-width from width, --video-margin from margin, and maxWidth', () => {
        const { container } = render(<Video {...base} margin={24} maxWidth={800} />);
        const style = getFigure(container)?.getAttribute('style') ?? '';
        expect(style).toContain('--video-width: min(600px, 950px)');
        expect(style).toContain('--video-margin: 24px');
        expect(style).toContain('max-width: 800px');
    });

    it('defaults width to 600 and margin to 40', () => {
        const { container } = render(<Video src={SRC} height={300} lazy={false} />);
        const style = getFigure(container)?.getAttribute('style') ?? '';
        expect(style).toContain('--video-width: min(600px, 950px)');
        expect(style).toContain('--video-margin: 40px');
    });

    it('computes the aspect-ratio padding-bottom from height/width', () => {
        const { container } = render(<Video {...base} />);
        const box = container.querySelector('figure > div > div');
        expect(box).toHaveStyle({ paddingBottom: '97%' });
    });

    // ── <video> ──

    it('renders the <video> with src, width and height when lazy is false', () => {
        const { container } = render(<Video {...base} />);
        const video = getVideo(container);
        expect(video).toHaveAttribute('src', SRC);
        expect(video).toHaveAttribute('width', '600');
        expect(video).toHaveAttribute('height', '582');
        expect(video).toHaveAttribute('preload', 'auto');
        expect(video).toHaveAttribute('playsinline');
    });

    it('does not autoplay where motion preference is unknown, and never sets loop or controls', () => {
        const { container } = render(<Video {...base} />);
        const video = getVideo(container);
        expect(video).not.toHaveAttribute('autoplay');
        expect(video).not.toHaveAttribute('loop');
        expect(video).not.toHaveAttribute('controls');
    });

    it('mounts no <video> at all while lazy and not yet in view', () => {
        const { container } = render(<Video src={SRC} width={600} height={582} />);
        expect(getVideo(container)).toBeNull();
        expect(container.querySelector('figure > div > div')?.childElementCount).toBe(0);
    });

    // ── Control bar ──

    it('mounts the control bar only once the video can play, starting paused at 00:00', () => {
        const { container } = render(<Video {...base} />);
        expect(getBar(container)).toBeNull();
        loadVideo(getVideo(container) as HTMLVideoElement);
        const bar = getBar(container);
        expect(bar).toBeInTheDocument();
        expect(iconOf(container)).toBe('play');
        expect(bar?.querySelector('button')).not.toHaveAttribute('aria-label');
        const times = bar?.querySelectorAll(':scope > div');
        expect(times?.[0].textContent).toBe('00:00');
        expect(times?.[2].textContent).toBe('00:20');
        expect(bar?.querySelector('progress')).toHaveAttribute('value', '0');
        expect(bar?.querySelector('progress + div')).toHaveStyle({ left: '0%' });
    });

    it('never mounts the control bar when controls is false', () => {
        const { container } = render(<Video {...base} controls={false} />);
        loadVideo(getVideo(container) as HTMLVideoElement);
        expect(getBar(container)).toBeNull();
    });

    it('swaps to the pause icon once play() resolves, and back on pause', async () => {
        const { container } = render(<Video {...base} />);
        const video = getVideo(container) as HTMLVideoElement;
        loadVideo(video);
        fireEvent.click(getBar(container)?.querySelector('button') as HTMLElement);
        expect(play).toHaveBeenCalledTimes(1);
        await act(async () => {
            await Promise.resolve();
        });
        expect(iconOf(container)).toBe('pause');
        fireEvent.click(getBar(container)?.querySelector('button') as HTMLElement);
        await act(async () => {
            await Promise.resolve();
        });
        expect(pause).toHaveBeenCalled();
        expect(iconOf(container)).toBe('play');
    });

    it('reports onPlay with the src once playback starts', async () => {
        const onPlay = vi.fn();
        const { container } = render(<Video {...base} onPlay={onPlay} />);
        fireEvent.click(getVideo(container) as HTMLElement);
        await act(async () => {
            await Promise.resolve();
        });
        expect(onPlay).toHaveBeenCalledWith(SRC);
    });

    it('reflects currentTime in the elapsed label, progress value and dot position', () => {
        const { container } = render(<Video {...base} />);
        const video = getVideo(container) as HTMLVideoElement;
        loadVideo(video, 20);
        Object.defineProperty(video, 'currentTime', { value: 5, configurable: true, writable: true });
        fireEvent.timeUpdate(video);
        const bar = getBar(container);
        expect(bar?.querySelector(':scope > div')?.textContent).toBe('00:05');
        expect(bar?.querySelector('progress')).toHaveAttribute('value', '25');
        expect(bar?.querySelector('progress + div')).toHaveStyle({ left: '25%' });
    });

    it('formats an unknown duration as 00:00', () => {
        const { container } = render(<Video {...base} />);
        loadVideo(getVideo(container) as HTMLVideoElement, Number.NaN);
        const times = getBar(container)?.querySelectorAll(':scope > div');
        expect(times?.[2].textContent).toBe('00:00');
    });

    it('replays at most twice when loop is on, then stops', async () => {
        const { container } = render(<Video {...base} />);
        const video = getVideo(container) as HTMLVideoElement;
        fireEvent.ended(video);
        fireEvent.ended(video);
        expect(play).toHaveBeenCalledTimes(2);
        expect(pause).not.toHaveBeenCalled();
        fireEvent.ended(video);
        // pause() waits for the pending play() promise first, as production does.
        await act(async () => {
            await Promise.resolve();
        });
        expect(play).toHaveBeenCalledTimes(2);
        expect(pause).toHaveBeenCalledTimes(1);
    });

    it('stops on "ended" when loop is off', () => {
        const { container } = render(<Video {...base} loop={false} />);
        fireEvent.ended(getVideo(container) as HTMLVideoElement);
        expect(play).not.toHaveBeenCalled();
        expect(pause).toHaveBeenCalledTimes(1);
    });

    // ── Controls visibility ──

    it('shows the bar on mouse move, hides it 3s later, and on mouse leave', () => {
        const { container } = render(<Video {...base} />);
        loadVideo(getVideo(container) as HTMLVideoElement);
        const figure = getFigure(container) as HTMLElement;
        expect(getBar(container)?.className).not.toContain('barVisible');
        fireEvent.mouseMove(figure);
        expect(getBar(container)?.className).toContain('barVisible');
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(getBar(container)?.className).not.toContain('barVisible');
        fireEvent.mouseEnter(figure);
        expect(getBar(container)?.className).toContain('barVisible');
        fireEvent.mouseLeave(figure);
        expect(getBar(container)?.className).not.toContain('barVisible');
    });

    // ── Scrubbing ──

    it('seeks on drag end using the horizontal ratio of the pointer', () => {
        const { container } = render(<Video {...base} />);
        const video = getVideo(container) as HTMLVideoElement;
        loadVideo(video, 20);
        Object.defineProperty(video, 'currentTime', { value: 0, configurable: true, writable: true });
        const strip = getBar(container)?.querySelector('progress')?.previousElementSibling as HTMLElement;
        strip.getBoundingClientRect = () => ({ left: 100, width: 200, top: 0, height: 18, right: 300, bottom: 18, x: 100, y: 0, toJSON: () => undefined });
        // jsdom derives pageX from clientX plus the (zero) scroll offset.
        fireEvent.mouseDown(strip, { clientX: 150 });
        fireEvent.mouseUp(window, { clientX: 150 });
        expect(video.currentTime).toBe(5);
        expect(getBar(container)?.querySelector('progress')).toHaveAttribute('value', '25');
    });

    // ── Misc ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<Video {...base} className="custom-video" />);
        expect(getFigure(container)?.className.endsWith('custom-video')).toBe(true);
    });

    it('forwards ref and extra attributes to the <video>', () => {
        const ref = createRef<HTMLVideoElement>();
        const { container } = render(<Video {...base} id="v1" poster="/poster.png" ref={ref} />);
        expect(ref.current).toBe(getVideo(container));
        expect(ref.current).toHaveAttribute('id', 'v1');
        expect(ref.current).toHaveAttribute('poster', '/poster.png');
    });

    it('has the correct displayName', () => {
        expect(Video.displayName).toBe('Video');
    });
});
