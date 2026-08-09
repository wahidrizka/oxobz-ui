'use client';

import {
    forwardRef,
    useEffect,
    useId,
    useRef,
    useState,
    type ComponentType,
    type FormEvent,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
    AcronymMarkdown,
    CheckCircleFill,
    FaceHappy,
    FaceSad,
    FaceSmile,
    FaceUnhappy,
    type IconProps,
} from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Select } from '../Select';
import { Textarea } from '../Textarea';
import styles from './Feedback.module.css';

/* ------------------------------------------------------------------ */
/*  Motion / layout constants                                          */
/* ------------------------------------------------------------------ */

/**
 * Gap between the trigger button and the popover, in px. Not a verifiable
 * literal — the snapshot's `data-radix-popper-content-wrapper` translate is
 * a page-specific measured value, not an authored token. Reused from Menu's
 * identical POPOVER_GAP for consistency across this design system's popovers.
 */
const POPOVER_GAP = 8;
/** --animate-feedbackFadeIn duration (chunk 20v_289ahbeyd.css). */
const POPOVER_ENTER_MS = 100;
/** --animate-feedbackFadeOut duration (chunk 20v_289ahbeyd.css). */
const POPOVER_EXIT_MS = 200;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** The four emotions offered by the emoji picker, left to right. */
export type FeedbackRating = 'hate' | 'not-great' | 'okay' | 'love';

/** 'inline' = the embedded card. Omitted/'default' = trigger Button + popover. */
export type FeedbackType = 'default' | 'inline';

export interface FeedbackTopic {
    label: string;
    value: string;
}

export interface FeedbackSubmitData {
    rating: FeedbackRating;
    message: string;
    /** Present only when `showTopics` is set and a topic was picked. */
    topic?: string;
    /** Echoes the `metadata` prop back, if provided. */
    metadata?: Record<string, string>;
}

export interface FeedbackProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit' | 'prefix'> {
    /**
     * Geist's routing/project identifier (e.g. "vercel" in every captured
     * example). Verified against the fresh capture to have NO visible DOM
     * footprint anywhere — the trigger button's text is always the fixed
     * word "Feedback", never this value, and no attribute in the snapshot
     * carries it either. Modelled here as an opaque identifier with no
     * rendering effect (kept for API parity only). See doc comment below.
     */
    label?: string;

    /** Variant. Default renders a trigger Button + popover; 'inline' renders the embedded card. */
    type?: FeedbackType;

    /**
     * Prompt text in the `inline` variant's header. Defaults to "Was this
     * helpful?" — the string every captured inline example uses. Geist's own
     * docs footer renders the same widget with "Give feedback" on desktop and
     * "Was this helpful?" on mobile, so the copy is a consumer choice.
     */
    prompt?: ReactNode;

    /** Adds a topic `<Select>` above the message field. */
    showTopics?: boolean;

    /**
     * Override the built-in topic list (used only with `showTopics`). NOT a
     * verified Geist prop — no captured example passed `topics=`, so the
     * component must ship *some* default list to render `showTopics` at
     * all. Added so consumers are not stuck with Vercel's own dashboard
     * categories (the literal captured list is kept as the default).
     */
    topics?: FeedbackTopic[];

    /** Icon before the trigger button label (Default variant only). */
    prefix?: ReactNode;

    /** Icon after the trigger button label (Default variant only). */
    suffix?: ReactNode;

    /** Arbitrary key/value data echoed back to `onSubmit`. */
    metadata?: Record<string, string>;

    /**
     * Demo / no-submit mode. Accepted for API parity — oxobz's Feedback has
     * no built-in network call to suppress (`onSubmit` is a pure callback,
     * same pattern as every other oxobz form component), so this currently
     * has no runtime effect. Forwarded verbatim so a consumer wiring their
     * own submission logic can read it off the closure.
     */
    dryRun?: boolean;

    /** Fired on submit with the picked rating, message, topic and metadata. */
    onSubmit?: (data: FeedbackSubmitData) => void;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Emoji config                                                       */
/* ------------------------------------------------------------------ */

/**
 * Icon + aria-label per rating, verified path-for-path against the snapshot's
 * inline SVGs (arc vs. cubic-bezier notation only — same shapes/colors):
 *  - "Hate it"    -> FaceSad (blue-700 tear-drop rects + frown)
 *  - "Not great"  -> FaceUnhappy (plain circle, concerned brow-less frown)
 *  - "It's okay"  -> FaceHappy (plain circle, gentle smile)
 *  - "Love it!"   -> FaceSmile (amber-800 sparkle eyes + open smile)
 */
const RATINGS: ReadonlyArray<{
    value: FeedbackRating;
    label: string;
    Icon: ComponentType<IconProps>;
}> = [
    { value: 'hate', label: 'Hate it', Icon: FaceSad },
    { value: 'not-great', label: 'Not great', Icon: FaceUnhappy },
    { value: 'okay', label: "It's okay", Icon: FaceHappy },
    { value: 'love', label: 'Love it!', Icon: FaceSmile },
];

/**
 * Built-in topic list — verified verbatim from the `showTopics` snapshot's
 * opened dialog (`<select id="product-area">`), including the exact label
 * text and the placeholder "Select a topic...". This is Vercel's own
 * dashboard-area taxonomy; override with the `topics` prop for anything
 * that isn't a Vercel feedback widget.
 */
const DEFAULT_TOPICS: FeedbackTopic[] = [
    { label: 'AI', value: 'AI' },
    { label: 'Accounts and Access Controls', value: 'Accounts and Access Controls' },
    { label: 'Billing', value: 'Billing' },
    { label: 'CDN (Firewall, Caching)', value: 'CDN (Firewall, Caching)' },
    {
        label: 'CI/CD (Builds, Deployments, Environment Variables)',
        value: 'CI/CD (Builds, Deployments, Environment Variables)',
    },
    {
        label: 'Dashboard Interface (Navigation, UI Issues)',
        value: 'Dashboard Interface (Navigation, UI Issues)',
    },
    { label: 'Domains', value: 'Domains' },
    { label: 'Frameworks', value: 'Frameworks' },
    { label: 'Marketplace and Integrations', value: 'Marketplace and Integrations' },
    {
        label: 'Observability (Observability, Logs, Monitoring)',
        value: 'Observability (Observability, Logs, Monitoring)',
    },
    { label: 'Storage', value: 'Storage' },
];

/* ------------------------------------------------------------------ */
/*  Positioning helper (Default/popover variant)                       */
/* ------------------------------------------------------------------ */

/**
 * Anchors the popover under the trigger, centered (every captured dialog
 * used `data-align="center"`), flipping above the trigger when it would
 * overflow the viewport bottom (one captured dialog used `data-side="top"`
 * for that reason). Mirrors Menu's `computePosition`, simplified to the
 * single side/align combination Feedback's popover actually uses.
 */
function computePopoverPosition(trigger: DOMRect, popover: DOMRect): { top: number; left: number } {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

    let top = trigger.bottom + POPOVER_GAP;
    if (vh > 0 && top + popover.height > vh) {
        top = trigger.top - popover.height - POPOVER_GAP;
    }

    let left = trigger.left + trigger.width / 2 - popover.width / 2;
    if (vw > 0) {
        left = Math.max(POPOVER_GAP, Math.min(left, vw - popover.width - POPOVER_GAP));
    }

    return { top, left };
}

/* ------------------------------------------------------------------ */
/*  Shared sub-renders                                                 */
/* ------------------------------------------------------------------ */

interface EmojiPickerProps {
    rating: FeedbackRating | null;
    onSelect: (rating: FeedbackRating) => void;
}

/** The 4 role="radio" emoji buttons — identical markup in both variants. */
function EmojiPicker({ rating, onSelect }: EmojiPickerProps): ReactNode {
    return (
        <span className={styles.emojisWrapper}>
            {RATINGS.map(({ value, label, Icon }) => (
                <button
                    key={value}
                    aria-checked={rating === value}
                    aria-label={`Select ${label} emoji`}
                    className={styles.emoji}
                    onClick={() => onSelect(value)}
                    role="radio"
                    type="button"
                >
                    <Icon size={16} />
                </button>
            ))}
        </span>
    );
}

/** "▤ supported." markdown hint — identical markup in both variants. */
function MarkdownTip({ id }: { id: string }): ReactNode {
    return (
        <div className={cn('text-label-12', styles.markdownTip)} id={id}>
            <AcronymMarkdown className={styles.markdownMark} size={14} />
            supported.
        </div>
    );
}

interface SuccessViewProps {
    successMessage: string;
    successDescription: string;
}

/**
 * Post-submit view. No success state was ever captured in either snapshot
 * (both are pre-submit `dryRun` demos) — shape (flex column, gap 8px, two
 * `<p>` + `<svg>` staggered `appear` keyframes) comes from the CSS module;
 * the copy is invented, unchanged from the previous inline-only revision.
 */
function SuccessView({ successMessage, successDescription }: SuccessViewProps): ReactNode {
    return (
        <div className={styles.successWrapper}>
            <CheckCircleFill color="blue-700" size={24} />
            <p className="text-copy-14">{successMessage}</p>
            <p className={cn('text-copy-13', styles.successDescription)}>{successDescription}</p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Gather text feedback with an associated emotion — full Geist API:
 * Default (trigger Button + popover), `type="inline"` (embedded card),
 * `showTopics`, `prefix`/`suffix`, `metadata`, `dryRun`.
 *
 * Ground truth:
 * - Default + all popover sub-variants (showTopics, prefix, suffix,
 *   metadata): `_nextstatic/component-inspect-element/feedback-additional.html`
 *   — 10 OPENED `role="dialog"` popovers + their "Show code" JSX.
 * - Inline: `_nextstatic/component-inspect-element/feedback.html`.
 * - Styling values shared by both (emoji states, formWrapper, markdown tip,
 *   actions bar, successWrapper stagger, popover box/radius/shadow/width):
 *   `_nextstatic/chunks/b4b9d0dd5348b0c3.css`, `feedback-module__j8fpJW__*`.
 * - Popover enter/exit animation: `_nextstatic/chunks/20v_289ahbeyd.css`,
 *   `--animate-feedbackFadeIn` (.1s cubic-bezier(.16,1,.3,1), opacity+scale)
 *   / `--animate-feedbackFadeOut` (.2s same easing, forwards).
 *
 * IMPORTANT finding (contradicts the naive reading of the JSX): `label` is
 * NOT the trigger button's visible text. Every captured example passes
 * `label="vercel"` yet the button always renders the literal word
 * "Feedback" — confirmed across the plain, showTopics, metadata, prefix and
 * suffix examples. `label` has zero DOM footprint (not even a data-/aria-
 * attribute carries it), so it is almost certainly an internal
 * routing/project identifier consumed by Vercel's own submit handler, not a
 * rendering prop. Modelled here as an accepted-but-unrendered identifier.
 *
 * Structural finding: the Default/popover form is NOT simply the inline
 * card opened in a dialog — its internal layout differs. Inline shows a
 * persistent prompt+emoji header with a *collapsible* form revealed below
 * once a rating is picked. The popover instead always shows the full form
 * (topic select + textarea + markdown tip) with the emoji picker moved into
 * the footer actions bar *alongside* the Send button
 * (`justify-content: space-between`, confirmed by the CSS module's
 * `.actions` default — the inline variant's single-button `flex-end` is the
 * override, not the base rule).
 *
 * Rendered DOM — Default (popover open):
 * ```html
 * <div data-oxobz-feedback="" data-version="v1">
 *   <button aria-haspopup="dialog" aria-expanded aria-controls data-oxobz-feedback-trigger>Feedback</button>
 * </div>
 * <!-- portaled to document.body -->
 * <div role="dialog" data-state="open" data-oxobz-feedback-popover="" tabindex="-1">
 *   <form>
 *     <div class="formWrapper"> <!-- showTopics? Select first --> <Textarea/> <MarkdownTip/> </div>
 *     <div class="actions"> <EmojiPicker/> <Button type="submit">Send</Button> </div>
 *   </form>
 * </div>
 * ```
 *
 * Rendered DOM — inline (`type="inline"`, unchanged from the previous
 * revision): prompt+emoji header, collapsible form below with a
 * flex-end (single-button) actions bar.
 *
 * Known gaps / deviations (see also inline comments above):
 * - No success-state DOM was ever captured for either variant; success copy
 *   is invented (kept from the previous revision) and success-view timing
 *   comes from the CSS module only.
 * - `topics` override prop is an oxobz addition, not a verified Geist prop.
 * - The topic `<select>`'s `aria-labelledby="Product topic selection"`
 *   references no element with that id in the snapshot either — reproduced
 *   verbatim per the fidelity mandate even though it looks like an upstream
 *   accessibility bug.
 * - `dryRun` and `label` are accepted for API parity but have no runtime
 *   effect (see prop doc comments) — this design system does not bake in a
 *   network layer for either variant to gate.
 * - Popover trigger→popover gap (8px) and viewport-flip logic are modelled
 *   on Menu's popover positioning; the snapshot's exact pixel offset is
 *   page-specific noise, not a token.
 */
const Feedback = forwardRef<HTMLDivElement, FeedbackProps>(
    (
        {
            label,
            type = 'default',
            prompt = 'Was this helpful?',
            showTopics = false,
            topics = DEFAULT_TOPICS,
            prefix,
            suffix,
            metadata,
            dryRun,
            onSubmit,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const isInline = type === 'inline';

        const [rating, setRating] = useState<FeedbackRating | null>(null);
        const [message, setMessage] = useState('');
        const [topic, setTopic] = useState('');
        const [submitted, setSubmitted] = useState(false);

        // Popover open/close (Default variant only).
        const [open, setOpen] = useState(false);
        const [mounted, setMounted] = useState(false);
        const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

        const triggerRef = useRef<HTMLButtonElement | null>(null);
        const popoverRef = useRef<HTMLDivElement | null>(null);
        const inlineRef = useRef<HTMLDivElement | null>(null);

        const autoId = useId();
        const textareaId = `feedback-textarea-${autoId}`;
        const hintId = `${textareaId}-hint`;
        const topicId = `feedback-topic-${autoId}`;
        const popoverId = `feedback-popover-${autoId}`;

        void label; // Accepted for API parity — see doc comment; no visible DOM footprint in production either.
        void dryRun; // Accepted for API parity — see doc comment; no built-in network call to gate.

        const handleSelectRating = (next: FeedbackRating) => {
            setRating(next);
        };

        const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!rating) return;
            onSubmit?.({
                rating,
                message,
                topic: showTopics && topic ? topic : undefined,
                metadata,
            });
            setSubmitted(true);
        };

        // Mount as soon as we're asked to open; unmount only after the exit
        // animation finishes (same shouldRender/isVisible split as Modal).
        useEffect(() => {
            if (isInline) return;
            if (open) {
                setMounted(true);
                return undefined;
            }
            if (!mounted) return undefined;
            const timer = window.setTimeout(() => setMounted(false), POPOVER_EXIT_MS);
            return () => window.clearTimeout(timer);
        }, [isInline, open, mounted]);

        // Position the popover against the trigger once it mounts.
        useEffect(() => {
            if (isInline || !mounted) return;
            const trigger = triggerRef.current;
            const popover = popoverRef.current;
            if (!trigger || !popover) return;
            setCoords(computePopoverPosition(trigger.getBoundingClientRect(), popover.getBoundingClientRect()));
        }, [isInline, mounted]);

        // Focus the dialog on open (matches the snapshot's tabindex="-1").
        useEffect(() => {
            if (isInline || !open) return;
            const raf = requestAnimationFrame(() => popoverRef.current?.focus());
            return () => cancelAnimationFrame(raf);
        }, [isInline, open]);

        // Dismiss on outside pointerdown / Escape while open. Default closes the
        // popover; inline collapses the expanded form back to the prompt (Geist's
        // embedded widget behaviour) — but not while the post-submit success view
        // is showing.
        useEffect(() => {
            const inlineOpen = isInline && rating !== null && !submitted;
            const popoverOpen = !isInline && open;
            if (!inlineOpen && !popoverOpen) return;

            const dismiss = () => {
                if (isInline) setRating(null);
                else setOpen(false);
            };
            const onPointerDown = (event: PointerEvent) => {
                const target = event.target as Node;
                if (isInline) {
                    if (inlineRef.current?.contains(target)) return;
                } else {
                    if (triggerRef.current?.contains(target)) return;
                    if (popoverRef.current?.contains(target)) return;
                }
                dismiss();
            };
            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    dismiss();
                    if (!isInline) triggerRef.current?.focus();
                }
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            document.addEventListener('keydown', onKeyDown, true);
            return () => {
                document.removeEventListener('pointerdown', onPointerDown, true);
                document.removeEventListener('keydown', onKeyDown, true);
            };
        }, [isInline, open, rating, submitted]);

        const topicSelect = showTopics ? (
            <Select
                aria-labelledby="Product topic selection"
                id={topicId}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Select a topic..."
                value={topic}
            >
                {topics.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </Select>
        ) : null;

        const messageField = (
            <Textarea
                aria-describedby={hintId}
                id={textareaId}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Your feedback..."
                style={{ height: '100px' }}
                value={message}
            />
        );

        /* ---------------------------------------------------------------- */
        /*  Inline variant                                                    */
        /* ---------------------------------------------------------------- */

        if (isInline) {
            const isOpen = rating !== null;

            return (
                <div
                    {...rest}
                    ref={ref}
                    className={cn(styles.inlineWrapper, className)}
                    data-oxobz-feedback=""
                    data-version={dataVersion}
                >
                    <div
                        className={styles.card}
                        data-open={isOpen || undefined}
                        ref={inlineRef}
                    >
                        <div className={styles.prompt}>
                            <p className={cn('text-copy-14', styles.promptText)}>{prompt}</p>
                            <EmojiPicker onSelect={handleSelectRating} rating={rating} />
                        </div>

                        <div className={styles.collapse} data-open={isOpen || undefined}>
                            <div className={styles.collapseInner}>
                                {submitted ? (
                                    <SuccessView
                                        successDescription="We'll use it to improve the experience."
                                        successMessage="Thanks for the feedback!"
                                    />
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className={styles.formWrapper}>
                                            {topicSelect}
                                            {messageField}
                                            <MarkdownTip id={hintId} />
                                        </div>
                                        <div className={cn(styles.actions, styles.actionsEnd)}>
                                            <Button size="small" typeName="submit">
                                                Send
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        /* ---------------------------------------------------------------- */
        /*  Default variant (trigger Button + popover)                       */
        /* ---------------------------------------------------------------- */

        return (
            <div
                {...rest}
                ref={ref}
                className={cn(styles.root, className)}
                data-oxobz-feedback=""
                data-version={dataVersion}
            >
                <Button
                    aria-controls={open ? popoverId : undefined}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    data-oxobz-feedback-trigger=""
                    data-state={open ? 'open' : 'closed'}
                    onClick={() => setOpen((current) => !current)}
                    prefix={prefix}
                    ref={triggerRef}
                    size="small"
                    suffix={suffix}
                    typeName="button"
                >
                    Feedback
                </Button>

                {mounted &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            className={cn(styles.popover, submitted && styles.popoverSuccess)}
                            data-oxobz-feedback-popover=""
                            data-state={open ? 'open' : 'closed'}
                            id={popoverId}
                            ref={popoverRef}
                            role="dialog"
                            style={{
                                top: coords.top,
                                left: coords.left,
                                animationDuration: open ? `${POPOVER_ENTER_MS}ms` : `${POPOVER_EXIT_MS}ms`,
                            }}
                            tabIndex={-1}
                        >
                            {submitted ? (
                                <SuccessView
                                    successDescription="We'll use it to improve the experience."
                                    successMessage="Thanks for the feedback!"
                                />
                            ) : (
                                <form className={styles.popoverForm} onSubmit={handleSubmit}>
                                    <div className={styles.formWrapper}>
                                        {topicSelect}
                                        {messageField}
                                        <MarkdownTip id={hintId} />
                                    </div>
                                    <div className={styles.actions}>
                                        <EmojiPicker onSelect={handleSelectRating} rating={rating} />
                                        <Button size="small" typeName="submit">
                                            Send
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>,
                        document.body,
                    )}
            </div>
        );
    },
);

Feedback.displayName = 'Feedback';

export { Feedback };
