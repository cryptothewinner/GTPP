'use client';

/**
 * A simple toast fallback to prevent build errors.
 * In a real scenario, this would be part of a larger toast system.
 */
export function useToast() {
    const toast = ({ title, description, variant }: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
        console.log(`Toast [${variant || 'default'}]: ${title} - ${description}`);
        // You can also use window.alert if needed for immediate feedback
    };

    return { toast };
}
