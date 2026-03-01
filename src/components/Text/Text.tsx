import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Text.module.css';

export interface TextProps extends HTMLAttributes<HTMLElement> {
    /** Font size (CSS value, e.g. '0.875rem', '14px') */
    size?: string;
    /** Line height (CSS value) */
    lineHeight?: string;
    /** Letter spacing (CSS value) */
    letterSpacing?: string;
    /** Font weight (number or string) */
    weight?: number | string;
    /** Text color (CSS value or variable) */
    color?: string;
    /** Text transform */
    transform?: CSSProperties['textTransform'];
    /** Text align */
    align?: CSSProperties['textAlign'];
    /** Truncate with ellipsis */
    truncate?: boolean;
    /** Clamp to N lines */
    clamp?: number;
    /** White-space: nowrap */
    nowrap?: boolean;
    /** Use monospace font */
    monospace?: boolean;
    /** HTML tag to render as */
    as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
}

/**
 * Text component — typography primitive.
 * 100% consistent with Geist production text-module.
 *
 * Sets `--text-*` CSS variables as inline styles,
 * consumed by `.wrapper` CSS class via `var(--text-*)`.
 */
export const Text = forwardRef<HTMLElement, TextProps>(
    (
        {
            size,
            lineHeight,
            letterSpacing,
            weight,
            color,
            transform,
            align,
            truncate = false,
            clamp,
            nowrap = false,
            monospace = false,
            as: Tag = 'span',
            className,
            style,
            children,
            ...props
        },
        ref,
    ) => {
        const textStyle: CSSProperties = {
            ...style,
            ...(color != null ? { '--text-color': color } as CSSProperties : {}),
            ...(size != null ? { '--text-size': size } as CSSProperties : {}),
            ...(lineHeight != null ? { '--text-line-height': lineHeight } as CSSProperties : {}),
            ...(letterSpacing != null ? { '--text-letter-spacing': letterSpacing } as CSSProperties : {}),
            ...(weight != null ? { '--text-weight': weight } as CSSProperties : {}),
            ...(transform != null ? { '--text-transform': transform } as CSSProperties : {}),
            ...(align != null ? { '--text-align': align } as CSSProperties : {}),
            ...(clamp != null ? { '--text-clamp': clamp } as CSSProperties : {}),
        };

        return (
            <Tag
                ref={ref as never}
                className={cn(
                    styles.wrapper,
                    truncate && styles.truncate,
                    clamp != null && styles.clamp,
                    nowrap && styles.nowrap,
                    monospace && styles.monospace,
                    className,
                )}
                data-version="v1"
                style={textStyle}
                {...props}
            >
                {children}
            </Tag>
        );
    },
);

Text.displayName = 'Text';
