import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Video } from './Video';

/** Selects the root <figure>. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-video]');
}

function getVideo(container: HTMLElement) {
    return container.querySelector('video');
}

describe('Video', () => {
    // ── Rendering ──

    it('renders a root figure with data-oxobz-video and data-version="v1"', () => {
        const { container } = render(
            <Video height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('FIGURE');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root).toHaveAttribute('role', 'region');
        expect(root).toHaveAttribute('aria-label', 'Video player');
        expect(root?.className).toContain('figure');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Video data-version="v2" height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('sets --video-width and --video-margin custom properties from width', () => {
        const { container } = render(
            <Video height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        const root = getRoot(container) as HTMLElement;
        expect(root.style.getPropertyValue('--video-width')).toBe('min(600px, 950px)');
        expect(root.style.getPropertyValue('--video-margin')).toBe('40px');
    });

    it('renders the <video> with src, width and height when lazy is false', () => {
        const { container } = render(
            <Video height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        const video = getVideo(container);
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute('src', 'movie.mp4');
        expect(video).toHaveAttribute('width', '600');
        expect(video).toHaveAttribute('height', '400');
        expect(video).toHaveAttribute('playsinline');
        expect(video).toHaveAttribute('preload', 'auto');
        expect(video?.className).toContain('video');
    });

    it('defers the <video> src when lazy is true and IntersectionObserver is unavailable (fallback)', () => {
        // jsdom has no IntersectionObserver — the component's documented
        // fallback makes the video visible immediately instead of hanging.
        const { container } = render(<Video height={400} src="movie.mp4" width={600} />);
        const video = getVideo(container);
        expect(video).toHaveAttribute('src', 'movie.mp4');
    });

    // ── Aspect ratio ──

    it('computes the aspect-ratio padding-bottom from height/width', () => {
        const { container } = render(
            <Video height={582} lazy={false} src="movie.mp4" width={600} />,
        );
        const box = container.querySelector('[class*="aspectBox"]') as HTMLElement;
        expect(box.style.paddingBottom).toBe('97%');
    });

    // ── Controls variant (Default / No Controls) ──

    it('renders the controls bar by default (play button, times, progress)', () => {
        const { container } = render(
            <Video height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        expect(container.querySelector('[class*="controlsBar"]')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
        expect(container.querySelector('progress')).toBeInTheDocument();
    });

    it('omits the controls bar entirely when controls is false ("No Controls")', () => {
        const { container } = render(
            <Video controls={false} height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        expect(container.querySelector('[class*="controlsBar"]')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /play|pause/i })).not.toBeInTheDocument();
    });

    // ── Play / pause toggle ──

    it('toggles the play/pause button label and icon on click', () => {
        const { container } = render(
            <Video height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        const button = screen.getByRole('button', { name: 'Pause' });
        fireEvent.click(button);
        expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Play' }));
        expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
        void container;
    });

    // ── Progress / time display ──

    it('reflects currentTime/duration in the progress value and time labels', () => {
        const { container } = render(
            <Video height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        const video = getVideo(container) as HTMLVideoElement;
        Object.defineProperty(video, 'duration', { configurable: true, value: 20 });
        fireEvent.loadedMetadata(video);
        Object.defineProperty(video, 'currentTime', { configurable: true, value: 10 });
        fireEvent.timeUpdate(video);

        const progress = container.querySelector('progress');
        expect(progress).toHaveAttribute('value', '50');
        expect(screen.getByText('00:10')).toBeInTheDocument();
        expect(screen.getByText('00:20')).toBeInTheDocument();
    });

    // ── Loop behavior (Default vs "No Loop") ──

    it('replays from the start on "ended" when loop is true (default)', () => {
        const { container } = render(
            <Video height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        const video = getVideo(container) as HTMLVideoElement;
        Object.defineProperty(video, 'duration', { configurable: true, value: 20 });
        Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 15 });
        fireEvent.ended(video);
        expect(video.currentTime).toBe(0);
        expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
        expect(video).not.toHaveAttribute('loop');
    });

    it('stops instead of replaying on "ended" when loop is false ("No Loop")', () => {
        const { container } = render(
            <Video height={400} lazy={false} loop={false} src="movie.mp4" width={600} />,
        );
        const video = getVideo(container) as HTMLVideoElement;
        fireEvent.ended(video);
        expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(
            <Video className="custom-video" height={400} lazy={false} src="movie.mp4" width={600} />,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('figure');
        expect(root?.className).toContain('custom-video');
        expect(root?.className.endsWith('custom-video')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the underlying <video> element', () => {
        const ref = createRef<HTMLVideoElement>();
        render(<Video height={400} lazy={false} ref={ref} src="movie.mp4" width={600} />);
        expect(ref.current).toBeInstanceOf(HTMLVideoElement);
        expect(ref.current).toHaveAttribute('src', 'movie.mp4');
    });

    // ── Prop forwarding (native video attributes) ──

    it('forwards extra native <video> attributes (id, poster)', () => {
        const { container } = render(
            <Video
                height={400}
                id="hero-video"
                lazy={false}
                poster="poster.jpg"
                src="movie.mp4"
                width={600}
            />,
        );
        const video = getVideo(container);
        expect(video).toHaveAttribute('id', 'hero-video');
        expect(video).toHaveAttribute('poster', 'poster.jpg');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Video.displayName).toBe('Video');
    });
});
