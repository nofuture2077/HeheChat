import React from 'react';
import { SevenTVBadge } from './7tvcosmetics';

interface SevenTVBadgeProps {
    badge: SevenTVBadge;
    size?: number;
    className?: string;
}

/**
 * Component for displaying 7TV badges
 */
export function SevenTVBadgeComponent({ badge, size = 18, className = '' }: SevenTVBadgeProps) {
    // Get the best image file for the requested size
    const getBadgeImageUrl = (badge: SevenTVBadge, targetSize: number): string | null => {
        if (!badge.host?.url || !badge.host?.files) {
            return null;
        }

        // Find the best matching file size
        const files = badge.host.files
            .filter(file => file.format === 'WEBP' || file.format === 'PNG')
            .sort((a, b) => Math.abs(a.width - targetSize) - Math.abs(b.width - targetSize));

        if (files.length === 0) {
            return null;
        }

        const bestFile = files[0];
        return `${badge.host.url}/${bestFile.name}`;
    };

    const imageUrl = getBadgeImageUrl(badge, size);

    if (!imageUrl) {
        return null;
    }

    return (
        <img
            src={imageUrl}
            alt={badge.name}
            title={badge.tooltip || badge.name}
            className={`seventv-badge ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '2px'
            }}
            onError={(e) => {
                // Hide the image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
    );
}

/**
 * Utility function to get badge image URL
 */
export function getSevenTVBadgeImageUrl(badge: SevenTVBadge, size: number = 18): string | null {
    if (!badge.host?.url || !badge.host?.files) {
        return null;
    }

    // Find the best matching file size
    const files = badge.host.files
        .filter(file => file.format === 'WEBP' || file.format === 'PNG')
        .sort((a, b) => Math.abs(a.width - size) - Math.abs(b.width - size));

    if (files.length === 0) {
        return null;
    }

    const bestFile = files[0];
    return `${badge.host.url}/${bestFile.name}`;
}
