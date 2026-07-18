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
     * (show-more.html Show-code: `expanded={expanded}
     * onClick={() => setExpanded(!expanded)}`). Drives the label
     * ("Show More" / "Show Less"), `aria-expanded`, and the chevron
     * rotation. Default false.
     */
    expanded?: boolean;

    /**
     * Hide the flanking divider lines while keeping the row's layout
     * (show-more.html Show-code: `<ShowMore noBorder />`). Default false.
     */
    noBorder?: boolean;

    /** Called when the trigger button is clicked. */
    onClick?: MouseEventHandler<HTMLButtonElement>;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
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
 * Rendered DOM (Geist production / geistcn structure, show-more.html):
 * ```html
 * <div class="expandToggle" data-oxobz-show-more="" data-version="v1">
 *   <div class="line" data-line="true"></div>
 *   <div class="buttonContainer">
 *     <button type="button" aria-expanded="{expanded}" data-oxobz-button="">
 *       <span class="label">
 *         Show More | Show Less
 *         <span class="chevron"><ChevronDownSmall /></span>
 *       </span>
 *     </button>
 *   </div>
 *   <div class="line" data-line="true"></div>
 * </div>
 * ```
 *
 * The trigger reuses the existing `Button` (variant="default" size="small"
 * shape="rounded") instead of reimplementing its styling — it already
 * matches the snapshot's pill button exactly (see ShowMore.module.css header).
 */
const ShowMore = forwardRef<HTMLDivElement, ShowMoreProps>(
    (
        {
            expanded = false,
            noBorder = false,
            onClick,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <div
                {...rest}
                ref={ref}
                className={cn(styles.expandToggle, noBorder && styles.noBorder, className)}
                data-oxobz-show-more=""
                data-version={dataVersion}
            >
                <div className={styles.line} data-line="true" />
                <div className={styles.buttonContainer}>
                    <Button
                        typeName="button"
                        variant="default"
                        size="small"
                        shape="rounded"
                        aria-expanded={expanded}
                        onClick={onClick}
                        data-oxobz-show-more-trigger=""
                    >
                        <span className={styles.label}>
                            {expanded ? 'Show Less' : 'Show More'}
                            <span className={cn(styles.chevron, expanded && styles.expanded)}>
                                <ChevronDownSmall size={16} />
                            </span>
                        </span>
                    </Button>
                </div>
                <div className={styles.line} data-line="true" />
            </div>
        );
    },
);

ShowMore.displayName = 'ShowMore';

export { ShowMore };
