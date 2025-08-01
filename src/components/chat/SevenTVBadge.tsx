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

        // Filter supported formats and sort by size
        const files = badge.host.files
            .filter(file => file.format === 'WEBP' || file.format === 'PNG')
            .sort((a, b) => a.width - b.width);

        if (files.length === 0) {
            return null;
        }

        // Find the smallest file that is >= targetSize
        const bestFile = files.find(file => file.width >= (targetSize * 1.5)) || files[files.length - 1];
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

    // Filter supported formats and sort by size
    const files = badge.host.files
        .filter(file => file.format === 'WEBP' || file.format === 'PNG')
        .sort((a, b) => a.width - b.width);

    if (files.length === 0) {
        return null;
    }

    // Find the smallest file that is >= targetSize
    const bestFile = files.find(file => file.width >= (size * 1.5)) || files[files.length - 1];
    return `${badge.host.url}/${bestFile.name}`;
}
