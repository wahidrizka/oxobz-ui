'use client';

import {
    Component as ReactComponent,
    createRef,
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
    type MouseEventHandler,
    type TouchEvent as ReactTouchEvent,
    type VideoHTMLAttributes,
} from 'react';
import { Pause, Play } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { useSight } from '../../utils/phase';
import styles from './Video.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VideoProps
    extends Omit<
        VideoHTMLAttributes<HTMLVideoElement>,
        'width' | 'height' | 'loop' | 'controls' | 'src' | 'autoPlay' | 'muted' | 'playsInline' | 'preload' | 'onPlay'
    > {
    /** Video source URL. */
    src: string;
    /** Intrinsic pixel width; also caps the player at `min(width, 950px)`. Default 600. */
    width?: number;
    /** Intrinsic pixel height; with `width` it sets the aspect-ratio box. */
    height: number;
    /** Vertical margin of the figure in px. Default 40. */
    margin?: number;
    /** Round the video corners with `--geist-radius`. Default false. */
    borderRadius?: boolean;
    /** Render the custom control bar once the video can play. Default true. */
    controls?: boolean;
    playsInline?: boolean;
    /** Mount the `<video>` only once the player scrolls near the viewport. Default true. */
    lazy?: boolean;
    muted?: boolean;
    /**
     * Default: whether the visitor allows motion. Production evaluates this
     * on the client only, so a server render never carries `autoplay` and
     * React keeps that server DOM on hydration: on a server-rendered page the
     * video starts paused. Measured on the live docs.
     */
    autoPlay?: boolean;
    preload?: 'none' | 'metadata' | 'auto' | '';
    maxWidth?: CSSProperties['maxWidth'];
    /** Replay when it ends, at most twice (production caps the loops). Default true. */
    loop?: boolean;
    /** Called with `src` each time playback starts. */
    onPlay?: (src: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Controls stay up this long after the last mouse move (production: 3e3). */
const CONTROLS_HIDE_MS = 3000;

/** Production replays a looping video at most this many times. */
const MAX_REPLAYS = 2;

const px = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

/** mm:ss, tolerant of NaN (duration is NaN until metadata arrives). */
function formatTime(seconds: number): string {
    let minutes = Math.floor(seconds / 60);
    if (Number.isNaN(minutes)) minutes = 0;
    let rest = Math.floor(seconds % 60);
    if (Number.isNaN(rest)) rest = 0;
    return `${minutes >= 10 ? minutes : `0${minutes}`}:${rest >= 10 ? rest : `0${rest}`}`;
}

function prefersMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    );
}

type PointerLike =
    | MouseEvent
    | TouchEvent
    | ReactMouseEvent<HTMLDivElement>
    | ReactTouchEvent<HTMLDivElement>;

interface RangeDragProps {
    onDrag?: (ratio: number) => void;
    onDragStart?: (ratio: number | null) => void;
    onDragEnd?: (ratio: number | null) => void;
    onIntent?: (ratio: number) => void;
    onMouseLeave?: MouseEventHandler<HTMLDivElement>;
}

/**
 * The scrub strip over the progress bar. Ported from production's drag helper,
 * which is a class component there as well: mouse/touch down starts a drag
 * tracked on `window`, the body's text selection is switched off while it
 * lasts, and every move reports the horizontal ratio (0..1) of the pointer.
 */
class RangeDrag extends ReactComponent<RangeDragProps, { isDragging: boolean }> {
    state = { isDragging: false };

    ref = createRef<HTMLDivElement>();

    componentWillUnmount() {
        this.endDrag();
    }

    startDrag = (event?: PointerLike) => {
        this.setState({ isDragging: true });
        window.addEventListener('mousemove', this.triggerRangeChange);
        window.addEventListener('touchmove', this.triggerRangeChange);
        window.addEventListener('mouseup', this.endDrag);
        window.addEventListener('touchend', this.endDrag);
        this.toggleSelection('none');
        this.props.onDragStart?.(event ? this.getValueFromEvent(event) : null);
    };

    endDrag = (event?: PointerLike) => {
        if (event) this.triggerRangeChange(event);
        this.setState({ isDragging: false });
        window.removeEventListener('mousemove', this.triggerRangeChange);
        window.removeEventListener('touchmove', this.triggerRangeChange);
        window.removeEventListener('mouseup', this.endDrag);
        window.removeEventListener('touchend', this.endDrag);
        this.toggleSelection('');
        this.props.onDragEnd?.(event ? this.getValueFromEvent(event) : null);
    };

    handleIntentMove = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (!this.state.isDragging) this.triggerIntent(event);
    };

    triggerIntent = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (!this.props.onIntent) return;
        const { pageX } = event;
        requestAnimationFrame(() => {
            this.props.onIntent?.(this.getHorizontalValue(pageX));
        });
    };

    /* Production also writes the -moz-/-ms- prefixed properties; no current browser reads them. */
    toggleSelection = (value: string) => {
        const { body } = document;
        if (!body) return;
        body.style.userSelect = value;
        body.style.webkitUserSelect = value;
    };

    getValueFromEvent = (event: PointerLike) => {
        const pageX = 'touches' in event ? event.touches[0]?.pageX : event.pageX;
        return this.getHorizontalValue(pageX ?? 0);
    };

    triggerRangeChange = (event: PointerLike) => {
        this.props.onDrag?.(this.getValueFromEvent(event));
    };

    getHorizontalValue = (pageX: number) => {
        const node = this.ref.current;
        if (!node) return 0;
        const rect = node.getBoundingClientRect();
        const scrollX =
            window.pageXOffset !== undefined
                ? window.pageXOffset
                : (document.documentElement || document.body).scrollLeft;
        let x = pageX - (rect.left + scrollX);
        x = Math.min(Math.max(x, 0), rect.width);
        return x / rect.width;
    };

    render() {
        return (
            <div
                className={styles.hit}
                onMouseDown={this.startDrag}
                onMouseLeave={this.props.onMouseLeave}
                onMouseMove={this.handleIntentMove}
                onTouchStart={this.startDrag}
                ref={this.ref}
            />
        );
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface VideoState {
    src: string | undefined;
    videoPlaying: boolean;
    videoLoaded: boolean;
    handlePosition: number;
    isDragging: boolean;
    controlsVisible: boolean;
    videoDuration: number;
    videoCurrentTime: number;
    loops: number;
}

/**
 * Embed a video with built-in playback controls and lazy loading support.
 *
 * Rebuilt 12 Sep 2026 from the production source (chunk 0jv75r7jllo1w) and
 * the live page. Against the old build: the `<video>` mounts only once there
 * is a src (nothing at all while lazy and off-screen), the control bar mounts
 * only once the video can play, playback starts PAUSED with the play icon
 * (see `autoPlay`), a looping video replays at most twice, the scrub strip is
 * a real drag, and the figure carries `data-version` but no component marker.
 *
 * Rendered DOM once loaded, with controls:
 * ```html
 * <figure data-version="v1" role="region" aria-label="Video player" style="--video-margin:40px;--video-width:min(600px, 950px)">
 *   <div class="wrapper"><div class="box" style="padding-bottom:97%">
 *     <video muted playsinline preload="auto" src width height/>
 *     <div class="bar [barVisible]">
 *       <button type="button">{Play|Pause}</button>
 *       <div class="time timeCurrent">00:00</div>
 *       <div class="track"><div class="hit"/><progress max="100" value="0"/><div class="dot" style="left:0%"/></div>
 *       <div class="time">00:20</div>
 *     </div>
 *   </div></div>
 * </figure>
 * ```
 * Production keeps a few more state fields (isPlayable, videoAutoplay,
 * videoIsReady, intentPosition) that nothing reads; they are left out.
 */
export const Video = forwardRef<HTMLVideoElement, VideoProps>((props, ref) => {
    const {
        src,
        width = 600,
        height,
        margin = 40,
        borderRadius = false,
        controls = true,
        playsInline = true,
        lazy = true,
        muted = true,
        autoPlay = prefersMotion(),
        preload = 'auto',
        maxWidth,
        loop = true,
        onPlay,
        className,
        style,
        ...rest
    } = props;

    const [state, setState] = useState<VideoState>({
        src: lazy ? undefined : src,
        videoPlaying: false,
        videoLoaded: false,
        handlePosition: 0,
        isDragging: false,
        controlsVisible: false,
        videoDuration: 0,
        videoCurrentTime: 0,
        loops: 0,
    });
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const boxRef = useRef<HTMLDivElement | null>(null);
    const playPromise = useRef<Promise<void> | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { phase } = useSight({ ref: boxRef, observe: 'once', rootMargin: '20% 0px' });
    const visible = phase === 'visible';

    useEffect(
        () => () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
        },
        [],
    );

    useEffect(() => {
        if (visible && lazy && !state.src) setState((s) => ({ ...s, src }));
    }, [visible, lazy, src, state.src]);

    const setVideoRef = useCallback(
        (node: HTMLVideoElement | null) => {
            videoRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        },
        [ref],
    );

    const onReady = useCallback(() => {
        const video = videoRef.current;
        if (video && video.readyState >= 3) {
            setState((s) => ({ ...s, videoLoaded: true, videoDuration: video.duration ?? 0 }));
        }
    }, []);

    const play = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        try {
            playPromise.current = video.play();
        } catch {
            /* a synchronous throw is swallowed, as in production */
        }
        if (playPromise.current) {
            playPromise.current
                .then(() => {
                    setState((s) => ({ ...s, videoPlaying: true }));
                    onPlay?.(src);
                })
                .catch(() => setState((s) => ({ ...s, videoPlaying: false })));
        }
    }, [onPlay, src]);

    const pause = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        const done = () => setState((s) => ({ ...s, videoPlaying: false }));
        if (playPromise.current) {
            playPromise.current
                .then(() => {
                    videoRef.current?.pause();
                    done();
                })
                .catch(done);
        } else {
            video.pause();
            done();
        }
    }, []);

    const showControls = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setState((s) => ({ ...s, controlsVisible: true }));
        hideTimer.current = setTimeout(() => {
            setState((s) => ({ ...s, controlsVisible: false }));
        }, CONTROLS_HIDE_MS);
    }, []);

    const hideControls = useCallback(() => setState((s) => ({ ...s, controlsVisible: false })), []);

    const handleEnded = () => {
        if (!loop) {
            pause();
            return;
        }
        if (state.loops < MAX_REPLAYS) {
            play();
            setState((s) => ({ ...s, loops: s.loops + 1 }));
        } else {
            pause();
            setState((s) => ({ ...s, videoPlaying: false }));
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (state.isDragging || !video) return;
        const time = video.currentTime;
        setState((s) => ({ ...s, videoCurrentTime: time, handlePosition: (time / s.videoDuration) * 100 }));
    };

    const figureStyle = {
        '--video-margin': px(margin),
        '--video-width': `min(${px(width)}, 950px)`,
        maxWidth,
        ...style,
    } as CSSProperties;

    return (
        <figure
            aria-label="Video player"
            className={cn(styles.figure, className)}
            data-version="v1"
            onMouseEnter={showControls}
            onMouseLeave={hideControls}
            onMouseMove={showControls}
            role="region"
            style={figureStyle}
        >
            <div className={styles.wrapper}>
                <div className={styles.box} ref={boxRef} style={{ paddingBottom: `${(height / width) * 100}%` }}>
                    {state.src ? (
                        <>
                            {/* suppressHydrationWarning: see `autoPlay`. The server renders no
                                autoplay attribute, the client default may say otherwise, and
                                React keeps the server DOM either way. */}
                            <video
                                {...rest}
                                autoPlay={autoPlay}
                                className={cn(styles.video, borderRadius && styles.rounded)}
                                height={height}
                                muted={muted}
                                onCanPlay={onReady}
                                onClick={() => {
                                    const video = videoRef.current;
                                    if (!video) return;
                                    if (video.paused) play();
                                    else pause();
                                }}
                                onEnded={handleEnded}
                                onLoadedData={onReady}
                                onPause={pause}
                                onPlay={play}
                                onTimeUpdate={handleTimeUpdate}
                                playsInline={playsInline}
                                preload={preload}
                                ref={setVideoRef}
                                src={state.src}
                                suppressHydrationWarning
                                width={width}
                            />
                            {controls && state.videoLoaded ? (
                                <div className={cn(styles.bar, state.controlsVisible && styles.barVisible)}>
                                    {state.videoPlaying ? (
                                        <button className={styles.playButton} onClick={pause} type="button">
                                            <Pause color="gray-1000" />
                                        </button>
                                    ) : (
                                        <button className={styles.playButton} onClick={play} type="button">
                                            <Play color="gray-1000" />
                                        </button>
                                    )}
                                    <div className={cn(styles.time, styles.timeCurrent)}>
                                        {formatTime(state.videoCurrentTime)}
                                    </div>
                                    <div className={styles.track}>
                                        <RangeDrag
                                            onDrag={(ratio) => {
                                                if (videoRef.current && !Number.isNaN(ratio)) {
                                                    setState((s) => ({ ...s, handlePosition: 100 * ratio }));
                                                }
                                            }}
                                            onDragEnd={(ratio) => {
                                                const video = videoRef.current;
                                                if (video && ratio !== null && !Number.isNaN(ratio)) {
                                                    video.currentTime = state.videoDuration * ratio;
                                                    setState((s) => ({ ...s, isDragging: false }));
                                                }
                                            }}
                                            onDragStart={() => {
                                                if (videoRef.current) setState((s) => ({ ...s, isDragging: true }));
                                            }}
                                        />
                                        <progress className={styles.progress} max={100} value={state.handlePosition} />
                                        <div className={styles.dot} style={{ left: `${state.handlePosition}%` }} />
                                    </div>
                                    <div className={styles.time}>{formatTime(state.videoDuration)}</div>
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
            </div>
        </figure>
    );
});

Video.displayName = 'Video';
