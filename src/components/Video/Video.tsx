import {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
    type ReactEventHandler,
    type VideoHTMLAttributes,
} from 'react';
import { Play, Pause } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Video.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VideoProps
    extends Omit<
        VideoHTMLAttributes<HTMLVideoElement>,
        'width' | 'height' | 'loop' | 'controls' | 'src'
    > {
    /** Video source URL (required — video.html Show-code). */
    src: string;
    /** Intrinsic pixel width; also drives the aspect-ratio box. */
    width: number;
    /** Intrinsic pixel height; also drives the aspect-ratio box. */
    height: number;
    /**
     * Defer loading the `src` until the player scrolls into view
     * (IntersectionObserver). Default `true` — every Show-code example in
     * video.html opts out with `lazy={false}` to render eagerly for the docs
     * preview, which implies the component's own default is `true`.
     */
    lazy?: boolean;
    /**
     * Loop playback when it ends. Implemented by replaying on the `ended`
     * event rather than the native `loop` attribute — the snapshot never
     * shows a `loop=""` attribute on the `<video>` in ANY variant (including
     * "No Loop"'s counterpart, Default), which only reconciles if looping is
     * JS-managed. Default `true`; the "No Loop" example sets `false`.
     */
    loop?: boolean;
    /**
     * Render the custom playback control bar (play/pause, elapsed / total
     * time, scrubbable progress). Default `true`; the "No Controls" example
     * sets `false` and the bar is absent from that variant's DOM entirely.
     */
    controls?: boolean;
    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Calls `video.play()` and silences a rejection without assuming the return
 * value is a real Promise — jsdom's HTMLMediaElement stub returns `undefined`
 * (logging "Not implemented" instead), while every real browser returns a
 * Promise<void> that rejects on an autoplay-policy block.
 */
function safePlay(node: HTMLVideoElement): void {
    const result = node.play();
    if (result && typeof result.catch === 'function') {
        result.catch(() => undefined);
    }
}

/** Formats seconds as `mm:ss` (tabular-nums in the control bar). */
function formatTime(seconds: number): string {
    const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Embed a video with built-in playback controls and lazy loading support.
 *
 * Rendered structure (video.html, geistcn/Tailwind snapshot — no
 * `*-module__` classes exist for this component, everything is inline
 * Tailwind utility values folded into Video.module.css):
 * ```html
 * <figure data-oxobz-video="" data-version="v1" role="region" aria-label="Video player"
 *         style="--video-margin: 40px; --video-width: min(600px, 950px);">
 *   <div class="aspectWrapper">
 *     <div class="aspectBox" style="padding-bottom: 97%">
 *       <video class="video" autoplay muted playsinline preload="auto" .../>
 *       <div class="controlsBar">                <!-- only when controls -->
 *         <button class="playButton">{Play|Pause icon}</button>
 *         <div class="timeCurrent">00:15</div>
 *         <div class="progressTrack">
 *           <div class="hitArea" />
 *           <progress class="progress" max="100" value={percent} />
 *           <div class="scrubDot" style="left: {percent}%" />
 *         </div>
 *         <div class="timeDuration">00:20</div>
 *       </div>
 *     </div>
 *   </div>
 * </figure>
 * ```
 *
 * Every video in the snapshot carries a hardcoded `autoplay` attribute
 * regardless of variant — there is no Show-code prop for it, so it is not
 * exposed here (only `src`, `width`, `height`, `lazy`, `loop`, `controls` are
 * documented Geist props; anything else is a plain native `<video>` attribute
 * passed straight through via `...rest`).
 */
export const Video = forwardRef<HTMLVideoElement, VideoProps>(
    (
        {
            src,
            width,
            height,
            lazy = true,
            loop = true,
            controls = true,
            className,
            style,
            muted = true,
            playsInline = true,
            preload = 'auto',
            onClick,
            onEnded,
            onTimeUpdate,
            onLoadedMetadata,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const figureRef = useRef<HTMLElement | null>(null);
        const videoRef = useRef<HTMLVideoElement | null>(null);
        const [isVisible, setIsVisible] = useState(!lazy);
        const [isPlaying, setIsPlaying] = useState(true);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);

        // Merge the internal video ref with the forwarded ref.
        const setVideoRef = useCallback(
            (node: HTMLVideoElement | null) => {
                videoRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) (ref as { current: HTMLVideoElement | null }).current = node;
            },
            [ref],
        );

        // Lazy loading: defer the `src` until the player scrolls into view.
        useEffect(() => {
            if (!lazy || isVisible) return;
            const node = figureRef.current;
            if (!node || typeof IntersectionObserver === 'undefined') {
                setIsVisible(true);
                return;
            }
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting)) {
                        setIsVisible(true);
                        observer.disconnect();
                    }
                },
                { rootMargin: '200px' },
            );
            observer.observe(node);
            return () => observer.disconnect();
        }, [lazy, isVisible]);

        const handlePlayPause = useCallback(
            (event: ReactMouseEvent<HTMLVideoElement | HTMLButtonElement>) => {
                const node = videoRef.current;
                if (node) {
                    // Toggle from React's own `isPlaying` state rather than the
                    // DOM `paused` property: jsdom's <video> stub never actually
                    // enters a playing state (play() is a no-op), which would
                    // make the button un-toggleable under test even though the
                    // real browser element and our tracked state agree.
                    if (isPlaying) {
                        node.pause();
                        setIsPlaying(false);
                    } else {
                        safePlay(node);
                        setIsPlaying(true);
                    }
                }
                if (event.currentTarget instanceof HTMLVideoElement) {
                    onClick?.(event as ReactMouseEvent<HTMLVideoElement>);
                }
            },
            [isPlaying, onClick],
        );

        const handleTimeUpdate = useCallback<ReactEventHandler<HTMLVideoElement>>(
            (event) => {
                setCurrentTime(event.currentTarget.currentTime);
                onTimeUpdate?.(event);
            },
            [onTimeUpdate],
        );

        const handleLoadedMetadata = useCallback<ReactEventHandler<HTMLVideoElement>>(
            (event) => {
                setDuration(event.currentTarget.duration);
                onLoadedMetadata?.(event);
            },
            [onLoadedMetadata],
        );

        const handleEnded = useCallback<ReactEventHandler<HTMLVideoElement>>(
            (event) => {
                const node = videoRef.current;
                if (loop && node) {
                    node.currentTime = 0;
                    safePlay(node);
                    setIsPlaying(true);
                } else {
                    setIsPlaying(false);
                }
                onEnded?.(event);
            },
            [loop, onEnded],
        );

        const seekToClientX = useCallback((clientX: number, track: HTMLElement) => {
            const node = videoRef.current;
            if (!node || !duration) return;
            const rect = track.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
            node.currentTime = ratio * duration;
            setCurrentTime(node.currentTime);
        }, [duration]);

        const handleSeek = useCallback(
            (event: ReactMouseEvent<HTMLDivElement>) => {
                seekToClientX(event.clientX, event.currentTarget);
            },
            [seekToClientX],
        );

        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

        const figureStyle = useMemo<CSSProperties>(
            () => ({
                '--video-margin': '40px',
                '--video-width': `min(${width}px, 950px)`,
                ...style,
            } as CSSProperties),
            [width, style],
        );

        const aspectBoxStyle = useMemo<CSSProperties>(
            () => ({ paddingBottom: `${(height / width) * 100}%` }),
            [height, width],
        );

        return (
            <figure
                ref={figureRef}
                aria-label="Video player"
                className={cn(styles.figure, className)}
                data-oxobz-video=""
                data-version={dataVersion}
                role="region"
                style={figureStyle}
            >
                <div className={styles.aspectWrapper}>
                    <div className={styles.aspectBox} style={aspectBoxStyle}>
                        <video
                            {...rest}
                            ref={setVideoRef}
                            autoPlay
                            className={styles.video}
                            height={height}
                            muted={muted}
                            onClick={handlePlayPause}
                            onEnded={handleEnded}
                            onLoadedMetadata={handleLoadedMetadata}
                            onTimeUpdate={handleTimeUpdate}
                            playsInline={playsInline}
                            preload={preload}
                            src={isVisible ? src : undefined}
                            width={width}
                        />
                        {controls && (
                            <div className={styles.controlsBar}>
                                <button
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                    className={styles.playButton}
                                    onClick={handlePlayPause}
                                    type="button"
                                >
                                    {isPlaying ? <Pause /> : <Play />}
                                </button>
                                <div className={styles.timeCurrent}>{formatTime(currentTime)}</div>
                                <div className={styles.progressTrack} onClick={handleSeek}>
                                    <div className={styles.hitArea} />
                                    <progress className={styles.progress} max={100} value={percent} />
                                    <div className={styles.scrubDot} style={{ left: `${percent}%` }} />
                                </div>
                                <div className={styles.timeDuration}>{formatTime(duration)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </figure>
        );
    },
);

Video.displayName = 'Video';
