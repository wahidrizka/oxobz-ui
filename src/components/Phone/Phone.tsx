import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Phone.module.css';
import { ChevronLeft, MoreHorizontal } from '@oxobz/icons';

// ---- Types ----

export interface PhoneProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Address shown in the pill at the bottom of the screen. Without it the
     * whole bottom bar (back button, pill, more button) and the gradient
     * behind it are left out, exactly as production does.
     */
    address?: string;
    /** Screen content rendered inside the frame (a screenshot or a video). */
    children?: ReactNode;
    /** Whether the dynamic island is drawn. Defaults to true. */
    notch?: boolean;
    /** Frame colour. Defaults to 'dark'. */
    variant?: 'light' | 'dark';
}

// ---- Helpers ----

/**
 * Production strips the scheme, a leading `www.` and one trailing slash
 * before showing the address ("https://vercel.com" becomes "vercel.com").
 */
function formatAddress(address: string) {
    return address
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
}

// ---- Component ----

/**
 * Phone: a phone-style frame for showcasing screenshots or other content.
 *
 * Rebuilt from the production source (bundle chunk read 10 Nov 2026). The
 * outer element only sets up the container query, so `className` and every
 * other prop land on the frame inside it, as in production. Production puts
 * no marker attribute and no `aria-hidden` anywhere on this component.
 */
export const Phone = forwardRef<HTMLDivElement, PhoneProps>(
    ({ address, children, className, notch = true, variant = 'dark', ...rest }, ref) => {
        return (
            <div style={{ containerType: 'inline-size' }}>
                <div {...rest} ref={ref} className={cn(styles.frame, styles[variant], className)}>
                    <div className={styles.screen}>
                        <div className={styles.screenBackdrop}>{children}</div>
                        {address ? <div className={styles.scrim} /> : null}
                    </div>

                    {notch ? <div className={styles.notch} /> : null}

                    <div className={styles.homeIndicator} />

                    {address ? (
                        <div className={styles.bar}>
                            <div className={styles.pill}>
                                <ChevronLeft className={styles.backIcon} />
                            </div>
                            <div className={cn(styles.pill, styles.pillAddress)}>
                                <span className={styles.addressText}>{formatAddress(address)}</span>
                            </div>
                            <div className={styles.pill}>
                                <MoreHorizontal className={styles.moreIcon} />
                            </div>
                        </div>
                    ) : null}

                    <div className={cn(styles.sideButton, styles.buttonMute)} />
                    <div className={cn(styles.sideButton, styles.buttonVolumeUp)} />
                    <div className={cn(styles.sideButton, styles.buttonVolumeDown)} />
                    <div className={cn(styles.sideButton, styles.buttonPower)} />
                </div>
            </div>
        );
    },
);

Phone.displayName = 'Phone';
