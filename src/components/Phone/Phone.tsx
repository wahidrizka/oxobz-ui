import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Phone.module.css';
import { ChevronLeft, MoreHorizontal } from '@oxobz/icons';

// ---- Types ----

export interface PhoneProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Address/URL text displayed in the status-bar pill */
    address?: string;
    /** Screen content rendered inside the phone frame (e.g. a screenshot or video) */
    children?: ReactNode;
}

// ---- Component ----

/**
 * Phone — a realistic mobile-device frame for showcasing screenshots or content.
 * Production equivalent of Geist's Phone component.
 */
export const Phone = forwardRef<HTMLDivElement, PhoneProps>(
    ({ address, children, className, ...props }, ref) => {
        return (
            <div ref={ref} className={cn(styles.containerQuery, className)} {...props}>
                <div className={styles.bezel} data-oxobz-phone="">
                    {/* Screen */}
                    <div className={styles.screen} data-oxobz-phone-screen="true">
                        <div className={styles.screenBackdrop}>{children}</div>
                        <div className={styles.scrim} aria-hidden="true" />
                    </div>

                    {/* Dynamic island / notch */}
                    <div className={styles.notch} aria-hidden="true" />

                    {/* Home indicator */}
                    <div className={styles.homeIndicator} aria-hidden="true" />

                    {/* Status bar */}
                    <div className={styles.statusBar}>
                        <div className={styles.pillIcon}>
                            <ChevronLeft className={styles.backIcon} />
                        </div>
                        {address && (
                            <div className={styles.pillAddress}>
                                <span className={styles.addressText}>{address}</span>
                            </div>
                        )}
                        <div className={styles.pillIcon}>
                            <MoreHorizontal className={styles.moreIcon} />
                        </div>
                    </div>

                    {/* Side buttons */}
                    <div className={cn(styles.sideButton, styles.buttonMute)} aria-hidden="true" />
                    <div className={cn(styles.sideButton, styles.buttonVolumeUp)} aria-hidden="true" />
                    <div className={cn(styles.sideButton, styles.buttonVolumeDown)} aria-hidden="true" />
                    <div className={cn(styles.sideButton, styles.buttonPower)} aria-hidden="true" />
                </div>
            </div>
        );
    },
);

Phone.displayName = 'Phone';
