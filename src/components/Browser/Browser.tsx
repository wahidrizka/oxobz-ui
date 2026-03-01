import { forwardRef, useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Browser.module.css';
import { ArrowLeft, ArrowRight, RefreshClockwise, Copy, Check } from '@oxobz/icons';

// ---- Types ----

export interface BrowserProps extends React.HTMLAttributes<HTMLDivElement> {
    /** URL displayed in the address bar */
    address?: string;
    /** Content rendered inside the browser frame */
    children?: ReactNode;
}

// ---- Component ----

/**
 * Browser — a realistic browser-style frame for showcasing content.
 * Production equivalent of Geist's Browser component.
 */
export const Browser = forwardRef<HTMLDivElement, BrowserProps>(
    ({ address, children, className, ...props }, ref) => {
        const [copied, setCopied] = useState(false);
        const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        const handleCopy = useCallback(() => {
            if (!address) return;
            navigator.clipboard.writeText(address).then(() => {
                setCopied(true);
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => setCopied(false), 2000);
            });
        }, [address]);
        return (
            <div ref={ref} className={cn(styles.containerQuery, className)} {...props}>
                <div className={styles.browser} data-oxobz-browser="">
                    {/* Header bar */}
                    <div className={styles.header} data-oxobz-browser-header-root="true">
                        {/* Left: traffic lights + nav */}
                        <div className={styles.headerLeft}>
                            <div className={styles.trafficLights}>
                                <div className={styles.dotRed} />
                                <div className={styles.dotYellow} />
                                <div className={styles.dotGreen} />
                            </div>
                            <div className={styles.navIcons}>
                                <ArrowLeft size={14} color="var(--ds-gray-900)" />
                                <ArrowRight size={14} color="var(--ds-gray-900)" />
                                <RefreshClockwise size={14} color="var(--ds-gray-900)" />
                            </div>
                        </div>

                        {/* Center: address bar */}
                        <div className={styles.headerCenter}>
                            {address && (
                                <div className={styles.addressBar}>
                                    <div className={styles.addressText}>{address}</div>
                                    <button
                                        type="button"
                                        aria-label="Copy"
                                        onClick={handleCopy}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '9999px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--ds-gray-1000)',
                                        }}
                                    >
                                        <div className={styles.copyButtonIcon}>
                                            <div className={copied ? styles.copyIconStateVisible : styles.copyIconStateHidden}>
                                                <Check size={12} />
                                            </div>
                                            <div className={copied ? styles.copyIconStateHidden : styles.copyIconStateVisible}>
                                                <Copy size={12} />
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: empty placeholder */}
                        <div className={styles.headerRight} />
                    </div>

                    {/* Content slot */}
                    {children}
                </div>
            </div>
        );
    },
);

Browser.displayName = 'Browser';
