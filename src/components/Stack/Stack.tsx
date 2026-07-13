import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Stack.module.css';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
    /** Flex direction */
    direction?: CSSProperties['flexDirection'];
    /** Align items */
    align?: CSSProperties['alignItems'];
    /** Justify content */
    justify?: CSSProperties['justifyContent'];
    /** Gap between children */
    gap?: string | number;
    /** Padding */
    padding?: string | number;
    /** Flex shorthand */
    flex?: CSSProperties['flex'];
    /** HTML tag to render as */
    as?: 'div' | 'span' | 'section' | 'nav' | 'main' | 'aside' | 'article' | 'header' | 'footer';
    /** Enable debug outline */
    debug?: boolean;
}

/**
 * Stack component — flex layout primitive.
 * 100% consistent with Geist production stack-module.
 *
 * Sets `--stack-*` CSS variables as inline styles,
 * consumed by `.stack` CSS class via `var(--stack-*)`.
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
    (
        {
            direction = 'column',
            align = 'stretch',
            justify = 'flex-start',
            gap = 0,
            padding = '0px',
            flex = 'initial',
            as: Tag = 'div',
            debug = false,
            className,
            style,
            children,
            ...props
        },
        ref,
    ) => {
        const stackPadding = typeof padding === 'number' ? `${padding}px` : padding;

        const stackStyle: CSSProperties = {
            ...style,
            '--stack-flex': flex,
            '--stack-direction': direction,
            '--stack-align': align,
            '--stack-justify': justify,
            '--stack-padding': stackPadding,
            '--stack-gap': typeof gap === 'number' ? `${gap}px` : gap,
        } as CSSProperties;

        // `.padding` consumes var(--stack-padding); production snapshots never
        // render it on default (0px) stacks, so apply it only when padding is set.
        const hasPadding = stackPadding !== '0px';

        return (
            <Tag
                ref={ref}
                className={cn(styles.stack, hasPadding && styles.padding, debug && styles.debug, className)}
                data-version="v1"
                style={stackStyle}
                {...props}
            >
                {children}
            </Tag>
        );
    },
);

Stack.displayName = 'Stack';
