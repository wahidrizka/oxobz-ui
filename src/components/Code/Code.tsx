import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Code.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CodeProps extends HTMLAttributes<HTMLPreElement> {
    /**
     * Language of the snippet (e.g. "javascript", "tsx", "bash"). Purely
     * presentational metadata: the component does not tokenize its
     * children — for full syntax highlighting with line numbers and a
     * copy button use `CodeBlock` instead.
     *
     * Mirrors Geist production exactly: the value is also appended as a
     * raw class name on the root `<pre>` (code.html snapshot ends with
     * `... color-[var(--geist-foreground)] javascript`).
     */
    syntax?: string;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display an inline snippet of code with themed styling.
 *
 * Distinct from `CodeBlock`: `Code` is the simple, single-block wrapper —
 * no tokenized syntax highlighting, no line numbers, no copy button. It
 * just renders its children inside a themed `<pre><code>` pair.
 *
 * Rendered DOM (Geist production, code.html "Default" example):
 * ```html
 * <pre class="... javascript" data-oxobz-code="" data-version="v1">
 *   <code class="...">{children}</code>
 * </pre>
 * ```
 */
const Code = forwardRef<HTMLPreElement, CodeProps>(
    (
        {
            syntax,
            className,
            children,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <pre
                {...rest}
                ref={ref}
                className={cn(styles.pre, syntax, className)}
                data-oxobz-code=""
                data-version={dataVersion}
            >
                <code className={styles.code}>{children}</code>
            </pre>
        );
    },
);

Code.displayName = 'Code';

export { Code };
