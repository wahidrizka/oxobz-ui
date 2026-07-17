import {
    forwardRef,
    useId,
    useState,
    type ComponentType,
    type FormEvent,
    type HTMLAttributes,
} from 'react';
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
import { Textarea } from '../Textarea';
import styles from './Feedback.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** The four emotions offered by the emoji picker, left to right. */
export type FeedbackRating = 'hate' | 'not-great' | 'okay' | 'love';

export interface FeedbackSubmitData {
    rating: FeedbackRating;
    message: string;
}

export interface FeedbackProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
    /**
     * Prompt header next to the emoji row, sentence case (Content:
     * "copy overrides the prompt header ... How did the import go?").
     * Default "Was this helpful?" (snapshot default).
     */
    copy?: string;

    /** Primary line shown after a successful submit. */
    successMessage?: string;

    /** Secondary, muted line shown under successMessage. */
    successDescription?: string;

    /** Fired the moment an emotion is picked, before the form opens. */
    onRatingChange?: (rating: FeedbackRating) => void;

    /** Fired on submit with the picked rating and the free-text message. */
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Gather text feedback with an associated emotion (Geist's Feedback,
 * *inline* variant only — see Feedback.module.css header for why the
 * trigger+popover variant is out of scope).
 *
 * Rendered DOM (Geist production / geistcn structure, `data-feedback-inline`
 * subtree):
 * ```html
 * <div class="inlineWrapper" data-oxobz-feedback="" data-version="v1">
 *   <div class="card" data-open?>
 *     <div class="prompt">
 *       <p class="promptText">Was this helpful?</p>
 *       <span class="emojisWrapper">
 *         <button role="radio" aria-checked aria-label="Select Hate it emoji">…</button>
 *         … 3 more …
 *       </span>
 *     </div>
 *     <div class="collapse" data-open?>
 *       <div class="collapseInner">
 *         <form> <!-- or the success view, see module header -->
 *           <div class="formWrapper">
 *             <Textarea placeholder="Your feedback..." />
 *             <div class="markdownTip"><AcronymMarkdown />supported.</div>
 *           </div>
 *           <div class="actions"><Button type="submit">Send</Button></div>
 *         </form>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 * ```
 *
 * Behavior (Content/Behavior bullets in feedback.html):
 * - The textarea placeholder ("Your feedback...") is fixed by Geist and not
 *   exposed as a prop.
 * - Picking an emoji is what reveals the form (role="radio" buttons, no
 *   wrapping radiogroup role — matches the snapshot exactly).
 * - Submit shows an in-place success view rather than a toast.
 */
const Feedback = forwardRef<HTMLDivElement, FeedbackProps>(
    (
        {
            copy = 'Was this helpful?',
            successMessage = 'Thanks for the feedback!',
            successDescription = "We'll use it to improve the experience.",
            onRatingChange,
            onSubmit,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const [rating, setRating] = useState<FeedbackRating | null>(null);
        const [message, setMessage] = useState('');
        const [submitted, setSubmitted] = useState(false);

        const autoId = useId();
        const textareaId = `feedback-textarea-${autoId}`;
        const hintId = `${textareaId}-hint`;

        const isOpen = rating !== null;

        const handleSelectRating = (next: FeedbackRating) => {
            setRating(next);
            onRatingChange?.(next);
        };

        const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!rating) return;
            onSubmit?.({ rating, message });
            setSubmitted(true);
        };

        return (
            <div
                {...rest}
                ref={ref}
                className={cn(styles.inlineWrapper, className)}
                data-oxobz-feedback=""
                data-version={dataVersion}
            >
                <div className={styles.card} data-open={isOpen || undefined}>
                    <div className={styles.prompt}>
                        <p className={cn('text-copy-14', styles.promptText)}>
                            {copy}
                        </p>
                        <span className={styles.emojisWrapper}>
                            {RATINGS.map(({ value, label, Icon }) => (
                                <button
                                    key={value}
                                    aria-checked={rating === value}
                                    aria-label={`Select ${label} emoji`}
                                    className={styles.emoji}
                                    onClick={() => handleSelectRating(value)}
                                    role="radio"
                                    type="button"
                                >
                                    <Icon size={16} />
                                </button>
                            ))}
                        </span>
                    </div>

                    <div className={styles.collapse} data-open={isOpen || undefined}>
                        <div className={styles.collapseInner}>
                            {submitted ? (
                                <div className={styles.successWrapper}>
                                    <CheckCircleFill
                                        color="var(--ds-blue-700)"
                                        size={24}
                                    />
                                    <p className="text-copy-14">{successMessage}</p>
                                    <p
                                        className={cn(
                                            'text-copy-13',
                                            styles.successDescription,
                                        )}
                                    >
                                        {successDescription}
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className={styles.formWrapper}>
                                        <Textarea
                                            aria-describedby={hintId}
                                            id={textareaId}
                                            onChange={(event) =>
                                                setMessage(event.target.value)
                                            }
                                            placeholder="Your feedback..."
                                            style={{ height: '100px' }}
                                            value={message}
                                        />
                                        <div
                                            className={cn(
                                                'text-label-12',
                                                styles.markdownTip,
                                            )}
                                            id={hintId}
                                        >
                                            <AcronymMarkdown
                                                className={styles.markdownMark}
                                                size={14}
                                            />
                                            supported.
                                        </div>
                                    </div>
                                    <div className={styles.actions}>
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
    },
);

Feedback.displayName = 'Feedback';

export { Feedback };
