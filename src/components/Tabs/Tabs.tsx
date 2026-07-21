'use client';

import {
    forwardRef,
    useId,
    useRef,
    type HTMLAttributes,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { Tooltip } from '../Tooltip';
import styles from './Tabs.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Visual style of the tab row. */
export type TabsVariant = 'primary' | 'secondary';

/** A single entry in the {@link TabsProps.tabs} array. */
export interface TabItem {
    /** Visible label of the tab (Title Case, 1–2 words). */
    title: ReactNode;

    /** Unique value identifying the tab; compared against `selected`. */
    value: string;

    /** Disables just this tab. */
    disabled?: boolean;

    /**
     * Tooltip shown on the tab trigger — sentence case, explaining the
     * constraint (typically paired with a disabled tab).
     */
    tooltip?: string;

    /** Icon rendered before the title. */
    icon?: ReactNode;
}

export interface TabsProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Value of the currently selected tab (controlled). */
    selected: string;

    /** Called with the value of the tab the user activates. */
    setSelected: (value: string) => void;

    /** Tabs to render, left to right. */
    tabs: TabItem[];

    /** Disables every tab at once. */
    disabled?: boolean;

    /** Underline row (`primary`) or pill row (`secondary`). Default: primary. */
    variant?: TabsVariant;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display tab content — a horizontal row of mutually exclusive views.
 *
 * Selection is controlled: pass `selected` and `setSelected`. Activation is
 * instant (click, or Enter/Space on the focused tab). Left/Right arrows move
 * focus across the enabled tabs (roving tabindex tied to the selected tab).
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <div role="tablist" aria-orientation="horizontal"
 *      data-oxobz-tabs="" data-variant="primary" data-version="v1"
 *      class="tabs">
 *   <button role="tab" type="button" value="apple" id="…"
 *           aria-controls="…" aria-selected="true" tabindex="0"
 *           data-oxobz-tab="" data-show-focus-ring="true" class="tab">
 *     <div class="tabIcon">…icon…</div>Apple
 *   </button>
 *   …
 * </div>
 * ```
 */
const Tabs = forwardRef<HTMLDivElement, TabsProps>(
    (
        {
            className,
            disabled = false,
            selected,
            setSelected,
            tabs,
            variant = 'primary',
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const baseId = useId();
        const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

        /**
         * Left/Right arrows move focus to the previous/next enabled tab,
         * wrapping around the ends. Disabled tabs are skipped. Activation is
         * left to the native button (click / Enter / Space).
         */
        const handleKeyDown = (
            event: KeyboardEvent<HTMLButtonElement>,
            index: number,
        ) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
                return;
            }
            event.preventDefault();

            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const count = tabs.length;

            let next = index;
            for (let step = 0; step < count; step += 1) {
                next = (next + direction + count) % count;
                if (!(disabled || tabs[next]?.disabled)) {
                    break;
                }
            }
            tabRefs.current[next]?.focus();
        };

        return (
            <div
                {...rest}
                aria-orientation="horizontal"
                className={cn(styles.tabs, className)}
                data-oxobz-tabs=""
                data-variant={variant}
                data-version={dataVersion}
                ref={ref}
                role="tablist"
            >
                {tabs.map((tab, index) => {
                    const isSelected = tab.value === selected;
                    const isDisabled = disabled || tab.disabled === true;
                    const panelId = `${baseId}-${index}`;

                    const button = (
                        <button
                            aria-controls={panelId}
                            aria-selected={isSelected}
                            className={styles.tab}
                            data-oxobz-tab=""
                            data-show-focus-ring="true"
                            disabled={isDisabled}
                            id={panelId}
                            key={tab.value}
                            onClick={() => setSelected(tab.value)}
                            onKeyDown={(event) => handleKeyDown(event, index)}
                            ref={(node) => {
                                tabRefs.current[index] = node;
                            }}
                            role="tab"
                            tabIndex={isSelected ? 0 : -1}
                            type="button"
                            value={tab.value}
                        >
                            {tab.icon != null && (
                                <div className={styles.tabIcon}>{tab.icon}</div>
                            )}
                            {tab.title}
                        </button>
                    );

                    if (tab.tooltip != null) {
                        return (
                            <Tooltip key={tab.value} text={tab.tooltip}>
                                {button}
                            </Tooltip>
                        );
                    }

                    return button;
                })}
            </div>
        );
    },
);

Tabs.displayName = 'Tabs';

export { Tabs };
