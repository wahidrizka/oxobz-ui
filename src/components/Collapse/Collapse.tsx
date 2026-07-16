import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { ChevronRight } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Text } from '../Text';
import styles from './Collapse.module.css';

/* ------------------------------------------------------------------ */
/*  CollapseGroup context                                              */
/* ------------------------------------------------------------------ */

interface CollapseGroupContextValue {
    /** Allow more than one panel open simultaneously. */
    multiple: boolean;
    /** Returns whether the panel with the given id is currently open. */
    isOpen: (id: string) => boolean;
    /** Toggles the panel with the given id, coordinating siblings. */
    toggle: (id: string) => void;
    /** Marks a panel as open by default (called on mount). */
    register: (id: string) => void;
}

const CollapseGroupContext = createContext<CollapseGroupContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  CollapseGroup                                                      */
/* ------------------------------------------------------------------ */

export interface CollapseGroupProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    /**
     * Allow multiple panels to be open at once. When omitted, the group
     * behaves as an accordion — opening one panel closes the others.
     */
    multiple?: boolean;
}

/**
 * CollapseGroup — groups multiple Collapse panels.
 *
 * Production: div.collapse-module__collapseGroup. Every Collapse rendered
 * inside a group automatically receives the `context` class (top border
 * removed), so the group draws a single 1px separator between items instead
 * of doubling borders. When `multiple` is not set the group acts as an
 * accordion and keeps at most one panel open.
 */
export const CollapseGroup = forwardRef<HTMLDivElement, CollapseGroupProps>(
    ({ children, className, multiple = false, ...props }, ref) => {
        const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

        const register = useCallback(
            (id: string) => {
                setOpenIds((prev) => {
                    if (multiple) {
                        if (prev.has(id)) return prev;
                        const next = new Set(prev);
                        next.add(id);
                        return next;
                    }
                    return new Set<string>([id]);
                });
            },
            [multiple],
        );

        const toggle = useCallback(
            (id: string) => {
                setOpenIds((prev) => {
                    const isCurrentlyOpen = prev.has(id);
                    if (multiple) {
                        const next = new Set(prev);
                        if (isCurrentlyOpen) {
                            next.delete(id);
                        } else {
                            next.add(id);
                        }
                        return next;
                    }
                    // Single-open (accordion): opening one closes the rest.
                    return isCurrentlyOpen ? new Set<string>() : new Set<string>([id]);
                });
            },
            [multiple],
        );

        const contextValue = useMemo<CollapseGroupContextValue>(
            () => ({
                multiple,
                isOpen: (id: string) => openIds.has(id),
                toggle,
                register,
            }),
            [multiple, openIds, toggle, register],
        );

        return (
            <div
                ref={ref}
                className={cn(styles.collapseGroup, className)}
                data-version="v1"
                {...props}
            >
                <CollapseGroupContext.Provider value={contextValue}>
                    {children}
                </CollapseGroupContext.Provider>
            </div>
        );
    },
);
CollapseGroup.displayName = 'CollapseGroup';

/* ------------------------------------------------------------------ */
/*  Collapse                                                           */
/* ------------------------------------------------------------------ */

export interface CollapseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Title shown in the trigger button */
    title: string;
    /** Optional subtitle below title */
    subtitle?: string;
    /** Content revealed when expanded */
    children: ReactNode;
    /** Controlled expanded state */
    expanded?: boolean;
    /** Uncontrolled initial expanded state */
    defaultExpanded?: boolean;
    /** Called when expanded state changes */
    onExpandedChange?: (expanded: boolean) => void;
    /** Disables interaction */
    disabled?: boolean;
    /** Size variant */
    size?: 'default' | 'small';
}

/**
 * Collapse — a single collapsible section (accordion item).
 *
 * Production: div.collapse-module__collapse. When rendered inside a
 * CollapseGroup it automatically loses its top border and, unless the group
 * is `multiple`, participates in single-open accordion coordination.
 */
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(
    (
        {
            title,
            subtitle,
            children,
            expanded: controlledExpanded,
            defaultExpanded = false,
            onExpandedChange,
            disabled = false,
            size = 'default',
            className,
            ...props
        },
        ref,
    ) => {
        const uid = useId();
        const buttonId = `collapse-button-${uid}`;
        const sectionId = `collapse-section-${uid}`;

        const group = useContext(CollapseGroupContext);
        const inGroup = group !== null;

        // Controlled > group-coordinated > local uncontrolled state.
        const isControlled = controlledExpanded !== undefined;
        const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

        const isExpanded =
            controlledExpanded !== undefined
                ? controlledExpanded
                : inGroup
                  ? group.isOpen(uid)
                  : internalExpanded;

        // Register a default-open panel with the group once, on mount.
        useEffect(() => {
            if (inGroup && !isControlled && defaultExpanded) {
                group.register(uid);
            }
            // Mount-only registration; group identity is stable per render tree.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Content ref for height measurement
        const contentRef = useRef<HTMLDivElement>(null);
        const [contentHeight, setContentHeight] = useState<number>(0);

        // Measure content height
        useEffect(() => {
            if (isExpanded && contentRef.current) {
                const inner = contentRef.current.firstElementChild as HTMLElement | null;
                if (inner) {
                    setContentHeight(inner.scrollHeight);
                }
            }
        }, [isExpanded, children]);

        const handleToggle = useCallback(() => {
            if (disabled) return;
            const next = !isExpanded;
            if (isControlled) {
                onExpandedChange?.(next);
                return;
            }
            if (inGroup) {
                group.toggle(uid);
            } else {
                setInternalExpanded(next);
            }
            onExpandedChange?.(next);
        }, [disabled, isExpanded, isControlled, inGroup, group, uid, onExpandedChange]);

        const isSmall = size === 'small';

        // Text props matching production inline styles
        const textProps = isSmall
            ? {
                color: 'var(--ds-gray-1000)',
                size: '1rem',
                lineHeight: '1.5rem',
                letterSpacing: 'initial',
                weight: 500,
            }
            : {
                color: 'var(--ds-gray-1000)',
                size: '1.5rem',
                lineHeight: '2rem',
                letterSpacing: '-0.029375rem',
                weight: 600,
            };

        return (
            <div
                ref={ref}
                className={cn(
                    styles.collapse,
                    // Grouped items drop their top border to avoid doubling.
                    inGroup && styles.context,
                    className,
                )}
                data-version="v1"
                {...props}
            >
                <Text as="h3" {...textProps}>
                    <button
                        aria-controls={sectionId}
                        aria-expanded={isExpanded || undefined}
                        aria-disabled={disabled || undefined}
                        className={cn('oxobz-reset', styles.button)}
                        id={buttonId}
                        type="button"
                        onClick={handleToggle}
                    >
                        <span
                            className={cn(
                                styles.title,
                                isSmall && styles.small,
                            )}
                        >
                            {title}
                            <span
                                className={cn(
                                    styles.icon,
                                    isExpanded && styles.open,
                                )}
                            >
                                <ChevronRight size={16} />
                            </span>
                        </span>
                    </button>
                </Text>

                {subtitle && (
                    <span className={styles.subtitle}>{subtitle}</span>
                )}

                <div
                    aria-labelledby={buttonId}
                    className={styles.collapseContent}
                    id={sectionId}
                    role="region"
                    style={{ height: isExpanded ? contentHeight : 0 }}
                    inert={!isExpanded || undefined}
                    ref={contentRef}
                >
                    <div>{children}</div>
                </div>
            </div>
        );
    },
);
Collapse.displayName = 'Collapse';

/* ------------------------------------------------------------------ */
/*  Backward-compatible aliases                                        */
/* ------------------------------------------------------------------ */

/**
 * @deprecated Use `Collapse`. Kept as an alias while callers migrate from the
 * previous `CollapseItem` name to the official Geist `Collapse` name.
 */
export const CollapseItem = Collapse;
/**
 * @deprecated Use `CollapseProps`.
 */
export type CollapseItemProps = CollapseProps;
