export function buildEmoteImageUrl(emoteId: string, options: { size?: string } = {}): string {
    const size = options.size || '1.0';
    return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/${size}`;
}