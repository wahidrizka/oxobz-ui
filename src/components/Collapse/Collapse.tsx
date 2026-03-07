import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
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
/*  CollapseGroup                                                      */
/* ------------------------------------------------------------------ */

export interface CollapseGroupProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

/**
 * CollapseGroup — groups multiple CollapseItem components.
 * Production: div.collapse-module__collapseGroup
 */
export const CollapseGroup = forwardRef<HTMLDivElement, CollapseGroupProps>(
    ({ children, className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(styles.collapseGroup, className)}
            data-version="v1"
            {...props}
        >
            {children}
        </div>
    ),
);
CollapseGroup.displayName = 'CollapseGroup';

/* ------------------------------------------------------------------ */
/*  CollapseItem                                                       */
/* ------------------------------------------------------------------ */

export interface CollapseItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
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
    /** When inside CollapseGroup, removes top border (consecutive items) */
    context?: boolean;
}

/**
 * CollapseItem — a single collapsible section (accordion item).
 * Production: div.collapse-module__collapse
 */
export const CollapseItem = forwardRef<HTMLDivElement, CollapseItemProps>(
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
            context = false,
            className,
            ...props
        },
        ref,
    ) => {
        const uid = useId();
        const buttonId = `collapse-button-${uid}`;
        const sectionId = `collapse-section-${uid}`;

        // Controlled vs uncontrolled
        const isControlled = controlledExpanded !== undefined;
        const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
        const isExpanded = isControlled ? controlledExpanded : internalExpanded;

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
            if (!isControlled) {
                setInternalExpanded(next);
            }
            onExpandedChange?.(next);
        }, [disabled, isExpanded, isControlled, onExpandedChange]);

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
                    context && styles.context,
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
CollapseItem.displayName = 'CollapseItem';
