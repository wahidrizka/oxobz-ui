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
     * raw class name on the root `<pre>` (the live code page ends the pre
     * class with `... color-[var(--geist-foreground)] javascript`).
     */
    syntax?: string;
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
 * Rendered DOM (measured live at vercel.com/geist/code, 6 Sep 2026): the
 * `<pre>` carries ONLY its class plus the `syntax` value as a raw class, and
 * NO marker attributes. An earlier build added `data-oxobz-code` and
 * `data-version` from a stale snapshot; the live pre has neither, so they were
 * removed.
 *
 * ```html
 * <pre class="... javascript"><code class="...">{children}</code></pre>
 * ```
 */
const Code = forwardRef<HTMLPreElement, CodeProps>(
    ({ syntax, className, children, ...rest }, ref) => {
        return (
            <pre {...rest} ref={ref} className={cn(styles.pre, syntax, className)}>
                {/*
                 * font-feature-settings dipasang INLINE seperti live (code page:
                 * elemen code punya style="font-feature-settings:\"liga\" off").
                 * Modul .code juga menyetel nilai yang sama; inline yang menang
                 * dan sekaligus memberi atribut style yang dibawa code live.
                 */}
                <code className={styles.code} style={{ fontFeatureSettings: '"liga" off' }}>
                    {children}
                </code>
            </pre>
        );
    },
);

Code.displayName = 'Code';

export { Code };
