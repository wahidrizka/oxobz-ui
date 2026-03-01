import { type ClassValue } from './types';

/**
 * Utility untuk menggabungkan CSS Module class names.
 * Mirip clsx tapi tanpa dependency tambahan.
 */
export function cn(...inputs: ClassValue[]): string {
    return inputs
        .filter((input): input is string => typeof input === 'string' && input.length > 0)
        .join(' ');
}
