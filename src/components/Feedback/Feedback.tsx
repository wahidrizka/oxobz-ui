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
/*
 * The inline card is a framer-motion `motion.div` in production, animated
 * through a `variants` map. Rebuilding it by hand would need a per-frame
 * tween that the bundle already spells out, so this uses the same library.
 * Reported as an added dependency on 30 Aug 2026.
 */
import { AnimatePresence, motion } from 'framer-motion';
import {
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

/**
 * Inline card motion, copied field-for-field from the production bundle
 * (chunk `2lqodt92x3oso.js`, read 30 Aug 2026):
 *
 *   <motion.div initial="closed" animate={open ? variant : "closed"}
 *               transition={{ duration: .15, ease: "easeOut" }} variants={...} />
 *
 * Cross-checked against three live recordings of the open animation: with
 * `easeOut` (cubic-bezier(0,0,.58,1)) over 150ms the modelled height lands
 * within 0.006 of the measured progress at every sampled frame.
 */
const INLINE_TRANSITION = { duration: 0.15, ease: 'easeOut' } as const;

/** Inline success panel box — production writes these two values inline. */
const SUCCESS_FIXED_BOX = { height: '75%', paddingTop: 48 } as const;

/**
 * Open height of the inline card, exactly as the bundle computes it:
 * `showEmail && showTopics ? 341 : showEmail || showTopics ? 293 : 243`.
 *
 * `showEmail` is not implemented here yet (see tasks/todo.md), so the
 * two-field branch is unreachable for now and the formula collapses to the
 * two cases we can actually produce.
 */
function inlineOpenHeight(showTopics: boolean): number {
    return showTopics ? 293 : 243;
}

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
     * Inline variant only. Pins the wrapper to 48px and lets the opened card
     * grow UPWARDS out of it (`y: -200`) instead of pushing the page down.
     * Production's own prop name and behaviour: it selects the
     * `openFixedUpwards` variant and adds `h-12` to the wrapper.
     */
    upwards?: boolean;

    /**
     * Inline variant only. Stretches the card to its container's width; the
     * closed variant then drops its fixed 274px width. Production's `fullWidth`.
     */
    fullWidth?: boolean;

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

/**
 * "▤ supported." markdown hint — identical markup in both variants.
 *
 * The mark is a RAW inline `<svg>`, not the `AcronymMarkdown` icon component.
 * Read straight off the production bundle (chunk `2lqodt92x3oso.js`,
 * 30 Aug 2026): production hand-writes this one glyph with `fill="none"` on
 * the `<svg>`, an explicit `xmlns`, no `data-slot`, no inline `color`, and
 * the path filled with the `--ds-gray-700` token instead of `currentColor`.
 * Going through the icon package emits four attributes production does not
 * have, so this single glyph is the documented exception to the
 * "icons always come from @oxobz/icons" rule.
 *
 * The hint carries NO `id`: production's textarea has no `aria-describedby`
 * pointing at it (verified attribute-by-attribute on the live page).
 */
function MarkdownTip(): ReactNode {
    return (
        <div className={cn('text-label-12', styles.markdownTip)}>
            <svg fill="none" height="14" viewBox="0 0 22 14" width="22" xmlns="http://www.w3.org/2000/svg">
                <path
                    clipRule="evenodd"
                    d="M19.5 1.25H2.5C1.80964 1.25 1.25 1.80964 1.25 2.5V11.5C1.25 12.1904 1.80964 12.75 2.5 12.75H19.5C20.1904 12.75 20.75 12.1904 20.75 11.5V2.5C20.75 1.80964 20.1904 1.25 19.5 1.25ZM2.5 0C1.11929 0 0 1.11929 0 2.5V11.5C0 12.8807 1.11929 14 2.5 14H19.5C20.8807 14 22 12.8807 22 11.5V2.5C22 1.11929 20.8807 0 19.5 0H2.5ZM3 3.5H4H4.25H4.6899L4.98715 3.82428L7 6.02011L9.01285 3.82428L9.3101 3.5H9.75H10H11V4.5V10.5H9V6.79807L7.73715 8.17572L7 8.97989L6.26285 8.17572L5 6.79807V10.5H3V4.5V3.5ZM15 7V3.5H17V7H19.5L17 9.5L16 10.5L15 9.5L12.5 7H15Z"
                    fill="var(--ds-gray-700)"
                    fillRule="evenodd"
                />
            </svg>
            supported.
        </div>
    );
}

interface SuccessViewProps {
    /**
     * Inline variant only: production pins the success panel to 75% of the
     * card and pads the top by 48px so it clears the prompt row. The popover
     * renders the identical markup WITHOUT this inline style.
     */
    fixedHeight?: boolean;
}

/**
 * Post-submit view, read verbatim from the production bundle (chunk
 * `2lqodt92x3oso.js`, 30 Aug 2026). Both the inline card and the popover
 * render the exact same three children and the exact same two sentences:
 *
 *   <div class="flex flex-col justify-center items-center gap-2 h-full">
 *     <IconCheckCircleFill color="green-900" size={32}
 *       class="checkmark opacity-0 translate-y-1 animate-feedbackAppear"/>
 *     <p class="... animate-feedbackAppear animation-delay-200">Your feedback has been received!</p>
 *     <p class="... animate-feedbackAppear animation-delay-400">Thank you for your help.</p>
 *   </div>
 *
 * The previous copy here ("Thanks for the feedback!" / "We'll use it to
 * improve the experience.") was invented when no success state had been
 * captured. It is now replaced by the real strings.
 */
function SuccessView({ fixedHeight = false }: SuccessViewProps): ReactNode {
    return (
        <div className={styles.successWrapper} style={fixedHeight ? SUCCESS_FIXED_BOX : undefined}>
            <CheckCircleFill className={styles.successAppear} color="green-900" size={32} />
            <p className={cn('text-copy-14', styles.successAppear, styles.successDelay200)}>
                Your feedback has been received!
            </p>
            <p className={cn('text-copy-14', styles.successAppear, styles.successDelay400)}>
                Thank you for your help.
            </p>
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
            upwards = false,
            fullWidth = false,
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
            /*
             * No `aria-describedby`, and the 100px height rides on a class,
             * not an inline style: both verified attribute-by-attribute
             * against the live textarea, which carries only autocapitalize,
             * autocomplete, autocorrect, spellcheck, placeholder and id.
             * Production writes it as `className="h-[100px]"`.
             */
            <Textarea
                className={styles.messageField}
                id={textareaId}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Your feedback..."
                value={message}
            />
        );

        /* ---------------------------------------------------------------- */
        /*  Inline variant                                                    */
        /* ---------------------------------------------------------------- */

        if (isInline) {
            const isOpen = rating !== null;
            const tinggiTerbuka = inlineOpenHeight(showTopics);

            /*
             * Variants copied field-for-field from the production bundle
             * (chunk `2lqodt92x3oso.js`, read 30 Aug 2026). The two "Error"
             * variants and the auto-height `open` variant are omitted here
             * because this build has no inline validation state yet; see
             * tasks/todo.md.
             */
            const variants = {
                closed: fullWidth
                    ? { height: 48, borderRadius: 30 }
                    : { height: 48, width: 274, borderRadius: 30 },
                openFixed: { height: tinggiTerbuka, width: 336, borderRadius: 12 },
                openFixedUpwards: {
                    height: tinggiTerbuka + 2,
                    width: 336,
                    borderRadius: 12,
                    y: -200,
                },
            };

            return (
                /*
                 * The wrapper carries `data-feedback-inline` and NOTHING else:
                 * no component marker, no data-version. Verified on the live
                 * page, where both instances read
                 * `class="flex justify-center[ h-12]" data-feedback-inline=""`.
                 */
                <div
                    {...rest}
                    ref={ref}
                    className={cn(styles.inlineWrapper, upwards && styles.inlineUpwards, className)}
                    data-feedback-inline=""
                >
                    <motion.div
                        animate={isOpen ? (upwards ? 'openFixedUpwards' : 'openFixed') : 'closed'}
                        className={cn(styles.card, fullWidth && styles.cardFullWidth)}
                        initial="closed"
                        ref={inlineRef}
                        transition={INLINE_TRANSITION}
                        variants={variants}
                    >
                        <div className={styles.prompt}>
                            <p className={cn('text-copy-14', styles.promptText)}>{prompt}</p>
                            <EmojiPicker onSelect={handleSelectRating} rating={rating} />
                        </div>

                        {/*
                         * No wrapper div and no collapse mechanism. The bare
                         * `<div>` that shows up between the card and the form
                         * on the live page IS this `motion.div` (it carries no
                         * class, so it looks anonymous); the form keeps its
                         * natural 197px height and the card clips it with
                         * `overflow: hidden`. The old grid `0fr -> 1fr` trick
                         * collapsed the form to zero and needed an extra
                         * element production does not have.
                         */}
                        <AnimatePresence>
                            {submitted ? (
                                <SuccessView fixedHeight key="success" />
                            ) : (
                                <motion.div
                                    exit={{ opacity: 0, y: -4 }}
                                    key="form"
                                    transition={{ duration: 0.2 }}
                                >
                                    <form className={styles.form} onSubmit={handleSubmit}>
                                        <div className={styles.formWrapper}>
                                            {topicSelect}
                                            {messageField}
                                            <MarkdownTip />
                                        </div>
                                        {/* Production writes this override inline, not as a class. */}
                                        <div
                                            className={styles.actions}
                                            style={{ justifyContent: 'flex-end' }}
                                        >
                                            <Button size="small" typeName="submit">
                                                Send
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
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
                                /* Same panel as the inline card, minus the inline 75% box. */
                                <SuccessView />
                            ) : (
                                <form className={styles.popoverForm} onSubmit={handleSubmit}>
                                    <div className={styles.formWrapper}>
                                        {topicSelect}
                                        {messageField}
                                        <MarkdownTip />
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
