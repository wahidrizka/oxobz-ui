'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
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

/* ------------------------------------------------------------------ */
/*  Swap                                                               */
/* ------------------------------------------------------------------ */

/** Ref that always holds the latest value without causing a re-render. */
function useLatest<T>(value: T) {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}

interface SwapContextValue {
    /** The state currently in the DOM. Lags behind `active` while one exits. */
    current: string;
    active: string;
    exitDuration: number;
    enter: PhaseEnter;
    onExited: (id: string) => void;
}

const SwapContext = createContext<SwapContextValue | null>(null);

export interface SwapProps extends HTMLAttributes<HTMLDivElement> {
    /** Id of the `Swap.State` that should be showing. */
    active: string;
    /** Fallback in ms for a state's exit when no transition event arrives. */
    exitDuration?: number;
}

export interface SwapStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
    /** Matched against the parent's `active`. Never written to the DOM. */
    id: string;
    ref?: Ref<HTMLDivElement | null>;
}

/**
 * Shows exactly one of its `Swap.State` children at a time. Ported from the
 * same production module as `Phase` (export `S`, read 12 Sep 2026).
 *
 * Switching `active` lets the current state finish its exit transition
 * BEFORE the next one mounts, so the two never overlap in the DOM; the
 * newcomer then carries `data-enter="animate"` for its `@starting-style`
 * entrance. The very first state mounts instantly, without `data-enter`,
 * which is what the live DOM shows at rest. Measured on the Text With Copy
 * Button page: click -> copy icon exiting -> (150ms) check icon entered ->
 * (1s) check exiting -> copy entered.
 */
function SwapRoot({ active, exitDuration = 5000, children, ...rest }: SwapProps) {
    const [current, setCurrent] = useState(active);
    const [hasSwapped, setHasSwapped] = useState(false);
    const activeRef = useLatest(active);

    const onExited = useCallback(
        (id: string) => {
            setHasSwapped(true);
            setCurrent((value) => (value === id ? activeRef.current : value));
        },
        [activeRef],
    );

    const enter: PhaseEnter = hasSwapped ? 'animate' : 'instant';
    const value = useMemo<SwapContextValue>(
        () => ({ current, active, exitDuration, enter, onExited }),
        [current, active, exitDuration, enter, onExited],
    );

    return (
        <SwapContext.Provider value={value}>
            <div {...rest}>{children}</div>
        </SwapContext.Provider>
    );
}

function SwapState({ id, ref, children, ...rest }: SwapStateProps) {
    const context = useContext(SwapContext);
    if (!context) {
        throw new Error('<Swap.State> must be used inside <Swap>.');
    }

    const isCurrent = context.current === id;
    const show = isCurrent && context.active === id;
    const { phase, ref: nodeRef, mounted, enter } = usePhase({
        show,
        mode: 'mount',
        enter: context.enter,
        exitDuration: context.exitDuration,
    });

    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
        ref,
        () => nodeRef.current,
        [nodeRef],
    );

    useEffect(() => {
        if (isCurrent && !show && phase === 'exited') context.onExited(id);
    }, [isCurrent, show, phase, id, context]);

    if (!isCurrent || !mounted) return null;

    return (
        <div
            {...rest}
            ref={nodeRef}
            data-phase={phase}
            data-enter={enter === 'animate' ? 'animate' : undefined}
        >
            {children}
        </div>
    );
}

export const Swap = Object.assign(SwapRoot, { State: SwapState });

/* ------------------------------------------------------------------ */
/*  useSight                                                           */
/* ------------------------------------------------------------------ */

export type SightPhase = 'unknown' | 'visible' | 'hidden';

export type SightReason = 'initial' | 'viewport' | 'document' | 'bfcache' | 'all-hidden';

export interface UseSightOptions {
    /** Element to watch. Pass either this or `target: 'page'`. */
    ref?: React.RefObject<Element | null>;
    /** 'page' watches the document itself instead of an element. */
    target?: 'page';
    /** 'once' stops after the first time the target becomes visible. */
    observe?: 'once' | 'continuous';
    root?: Element | Document | null;
    rootMargin?: string;
    threshold?: number | number[];
    /** When given, phase changes go here instead of into React state. */
    onVisibilityChange?: (phase: SightPhase, reason: SightReason) => void;
}

/**
 * Visibility tracker from the same production module as `Phase` (export
 * `P`, read 12 Sep 2026). "Visible" means the target intersects the viewport
 * AND the document itself is not hidden; tab switches (visibilitychange) and
 * back/forward-cache restores (pageshow) flip it too. Production shares one
 * IntersectionObserver per option set across targets; that cache is an
 * optimisation with no observable effect and is left out here.
 */
export function useSight(options: UseSightOptions = {}) {
    const { observe = 'continuous', target, root, rootMargin, threshold } = options;
    const [state, setState] = useState<{ phase: SightPhase; phaseReason: SightReason }>({
        phase: 'unknown',
        phaseReason: 'initial',
    });
    const phaseRef = useRef<SightPhase>('unknown');
    const phaseReasonRef = useRef<SightReason>('initial');
    const onChange = useLatest(options.onVisibilityChange);
    const ownRef = useRef<Element | null>(null);
    const ref = options.ref ?? ownRef;

    useEffect(() => {
        if (target && options.ref) {
            throw new Error('useSight() received both ref and target.');
        }
        const el: Element | Document | null = target === 'page' ? document : ref.current;
        if (!el) return;

        const isDocument = el.nodeType === 9;
        let stopped = false;
        let phase: SightPhase = 'unknown';
        let docVisible = !document.hidden;
        let inView = isDocument;
        let observer: IntersectionObserver | null = null;

        const update = (reason: SightReason) => {
            if (stopped) return;
            const next: SightPhase = docVisible && inView ? 'visible' : 'hidden';
            const why: SightReason = next !== 'hidden' || docVisible || inView ? reason : 'all-hidden';
            if (next === phase) return;
            phase = next;
            phaseRef.current = phase;
            phaseReasonRef.current = why;
            if (onChange.current) onChange.current(phase, why);
            else setState({ phase, phaseReason: why });
            if (observe === 'once' && phase === 'visible') stop();
        };
        const onDocument = () => {
            docVisible = !document.hidden;
            update('document');
        };
        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                docVisible = true;
                update('bfcache');
            }
        };
        const stop = () => {
            if (stopped) return;
            stopped = true;
            document.removeEventListener('visibilitychange', onDocument);
            window.removeEventListener('pageshow', onPageShow);
            observer?.disconnect();
        };

        document.addEventListener('visibilitychange', onDocument);
        window.addEventListener('pageshow', onPageShow);
        if (isDocument) {
            update('initial');
        } else if (typeof IntersectionObserver !== 'undefined') {
            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        inView = entry.isIntersecting;
                        update('viewport');
                    }
                },
                { root: root ?? null, rootMargin, threshold },
            );
            observer.observe(el as Element);
        }
        return stop;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- production depends on observe and target alone
    }, [observe, target]);

    return { ref, ...state, phaseRef, phaseReasonRef };
}
