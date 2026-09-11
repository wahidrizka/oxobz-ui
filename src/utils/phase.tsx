'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';

/**
 * Exit-transition primitive, ported field-for-field from the production
 * bundle (module 414213, chunk read 11 Sep 2026).
 *
 * Geist used to animate these surfaces with framer-motion. It no longer does:
 * production now keeps the element mounted through a CSS transition and drives
 * it with a `data-phase` attribute, dropping the library entirely. The live DOM
 * shows the result on every docs page footer:
 *
 *   <div class="transition-[opacity,translate] duration-200
 *               data-[phase=exiting]:-translate-y-1
 *               data-[phase=exiting]:opacity-0"
 *        data-phase="entered">
 *
 * `data-phase` is shared across Geist surfaces (the Menu popper carries it too),
 * so this lives in utils rather than inside Feedback.
 *
 * Phases: `idle` (never shown) -> `entered` -> `exiting` -> `exited`. The
 * element stays mounted while `exiting` so CSS can animate it out; the phase
 * settles once `transitionend`/`animationend` fires, or after `exitDuration`
 * as a fallback when neither does.
 */

export type PhaseName = 'idle' | 'entered' | 'exiting' | 'exited';

export type PhaseReason = 'initial' | 'show' | 'hide' | 'interrupted' | 'animation-end';

/** 'mount' unmounts after exiting; 'reveal' keeps the element and rests at 'idle'. */
export type PhaseMode = 'mount' | 'reveal';

export type PhaseEnter = 'animate' | 'instant';

export type PhaseReducedMotion = 'respect' | 'ignore';

function prefersReducedMotion(): boolean {
    return (
        typeof matchMedia !== 'undefined' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

export interface UsePhaseOptions {
    /** Whether the content should be present. Flipping to false starts the exit. */
    show: boolean;
    mode?: PhaseMode;
    /** 'instant' skips the enter animation on first paint. */
    enter?: PhaseEnter;
    /** Fallback in ms, used when no transition or animation event arrives. */
    exitDuration?: number;
    reducedMotion?: PhaseReducedMotion;
}

export interface UsePhaseResult {
    phase: PhaseName;
    phaseReason: PhaseReason;
    /** False once the exit has settled — the caller should render nothing. */
    mounted: boolean;
    ref: React.RefObject<HTMLDivElement | null>;
    enter: PhaseEnter;
}

export function usePhase({
    show,
    mode = 'mount',
    enter = 'animate',
    exitDuration = 5000,
    reducedMotion = 'respect',
}: UsePhaseOptions): UsePhaseResult {
    const ref = useRef<HTMLDivElement | null>(null);
    const [phase, setPhase] = useState<PhaseName>(show ? 'entered' : 'idle');
    const [phaseReason, setPhaseReason] = useState<PhaseReason>('initial');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const detach = useRef<(() => void) | null>(null);

    const clear = useCallback(() => {
        if (timer.current !== null) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        if (detach.current) {
            detach.current();
            detach.current = null;
        }
    }, []);

    useEffect(() => () => clear(), [clear]);

    const settled = useRef(false);
    useEffect(() => {
        /*
         * The first run is skipped: the initial phase already reflects `show`,
         * and running the exit path on mount would animate a surface that was
         * never visible. Production guards it the same way, and depends on
         * `show` alone so a re-render with the same value does not restart the
         * transition.
         */
        if (!settled.current) {
            settled.current = true;
            return;
        }
        clear();

        if (show) {
            setPhase((current) => {
                setPhaseReason(current === 'exiting' ? 'interrupted' : 'show');
                return 'entered';
            });
            return;
        }

        const resting: PhaseName = mode === 'reveal' ? 'idle' : 'exited';

        if (reducedMotion === 'respect' && prefersReducedMotion()) {
            setPhase(resting);
            setPhaseReason('animation-end');
            return;
        }

        setPhase('exiting');
        setPhaseReason('hide');

        const node = ref.current;
        const finish = () => {
            clear();
            setPhase((current) => {
                if (current !== 'exiting') return current;
                setPhaseReason('animation-end');
                return resting;
            });
        };

        detach.current = () => {
            if (node) {
                node.removeEventListener('transitionend', finish);
                node.removeEventListener('animationend', finish);
            }
        };
        if (node) {
            node.addEventListener('transitionend', finish, { once: true });
            node.addEventListener('animationend', finish, { once: true });
        }
        timer.current = setTimeout(finish, exitDuration);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- production depends on `show` alone
    }, [show]);

    const canAnimate = reducedMotion === 'ignore' || !prefersReducedMotion();

    return {
        phase,
        phaseReason,
        mounted: phase !== 'idle' && phase !== 'exited',
        ref,
        enter:
            (phaseReason !== 'initial' || enter !== 'instant') && canAnimate
                ? 'animate'
                : 'instant',
    };
}

export interface PhaseProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
        UsePhaseOptions {
    children?: ReactNode;
}

/**
 * Wraps its children in a plain `<div>` carrying `data-phase`, keeping them
 * mounted until the exit transition has finished. `data-enter` is only written
 * while an enter animation is actually wanted, matching production, which
 * leaves the attribute off entirely for `enter="instant"` surfaces.
 */
export function Phase({
    show,
    mode,
    enter,
    exitDuration,
    reducedMotion,
    children,
    ...rest
}: PhaseProps) {
    const {
        phase,
        ref,
        mounted,
        enter: enterState,
    } = usePhase({ show, mode, enter, exitDuration, reducedMotion });

    if (!mounted && mode !== 'reveal') return null;

    return (
        <div
            {...rest}
            ref={ref}
            data-phase={phase}
            data-enter={enterState === 'animate' ? 'animate' : undefined}
        >
            {children}
        </div>
    );
}
