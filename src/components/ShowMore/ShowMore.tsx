import { forwardRef, type HTMLAttributes, type MouseEventHandler } from 'react';
import { ChevronDownSmall } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import styles from './ShowMore.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ShowMoreProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
    /**
     * Whether the collapsed content is currently expanded. ShowMore keeps no
     * internal state of its own — flip this prop yourself from `onClick`
     * (live Show-code: `expanded={expanded}
     * onClick={() => setExpanded(!expanded)}`). Drives the label
     * ("Show More" / "Show Less") and the chevron rotation. Default false.
     *
     * Note: the live geistcn trigger carries NO `aria-expanded` (measured
     * 10 Sep 2026); state is conveyed by the label text + chevron only, so
     * this component matches that and does not set it.
     */
    expanded?: boolean;

    /**
     * Hide the flanking divider lines while keeping the row's layout
     * (live Show-code: `<ShowMore noBorder />`). Default false.
     */
    noBorder?: boolean;

    /** Called when the trigger button is clicked. */
    onClick?: MouseEventHandler<HTMLButtonElement>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Styling component to show expanded or collapsed content — a divider row
 * with a centered pill trigger ("Show More" / "Show Less" + chevron).
 *
 * ShowMore only renders the toggle control; per show-more.html ("Styling
 * component to show expanded or collapsed content") it does not render or
 * manage the collapsible content itself — the consumer owns `expanded`
 * state and decides what to reveal alongside it.
 *
 * Rendered DOM (live geistcn structure, measured 10 Sep 2026):
 * ```html
 * <div class="expandToggle">                    (root: no marker in live)
 *   <div class="line" data-line="true"></div>
 *   <div class="buttonContainer">
 *     <button type="button" data-geist-button …>  (reused Button; no aria-expanded)
 *       <span class="…truncate…">                  (Button's own content wrapper)
 *         <div style="display:flex;align-items:center">
 *           Show More | Show Less
 *           <span class="chevron"><ChevronDownSmall /></span>
 *         </div>
 *       </span>
 *     </button>
 *   </div>
 *   <div class="line" data-line="true"></div>
 * </div>
 * ```
 *
 * The trigger reuses the existing `Button` (variant="secondary" size="small"
 * shape="rounded") instead of reimplementing its styling — it already
 * matches the live pill button exactly (white bg, gray-400 ring, dark text).
 * The
 * label row is a `<div style="display:flex;align-items:center">`, verbatim
 * from live (an inline style, not a class).
 */
const ShowMore = forwardRef<HTMLDivElement, ShowMoreProps>(
    ({ expanded = false, noBorder = false, onClick, className, ...rest }, ref) => {
        return (
            <div
                {...rest}
                ref={ref}
                className={cn(styles.expandToggle, noBorder && styles.noBorder, className)}
            >
                <div className={styles.line} data-line="true" />
                <div className={styles.buttonContainer}>
                    <Button
                        typeName="button"
                        variant="secondary"
                        size="small"
                        shape="rounded"
                        onClick={onClick}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {expanded ? 'Show Less' : 'Show More'}
                            <span className={cn(styles.chevron, expanded && styles.expanded)}>
                                <ChevronDownSmall size={16} />
                            </span>
                        </div>
                    </Button>
                </div>
                <div className={styles.line} data-line="true" />
            </div>
        );
    },
);

ShowMore.displayName = 'ShowMore';

export { ShowMore };
