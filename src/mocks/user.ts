// Function to generate a consistent color from username
const generateColorFromUsername = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`; // Using HSL for vibrant but not too bright colors
};

// Function to get initials from display name
const getInitials = (displayName: string): string => {
    return displayName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Generate profile picture URL with colored background and initials
export const generateProfilePictureUrl = (username: string, displayName: string): string => {
    const color = generateColorFromUsername(username);
    const initials = getInitials(displayName);
    
    const svg = `
        <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
            <rect width="128" height="128" fill="${color}"/>
            <text
                x="64"
                y="64"
                dominant-baseline="middle"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="48"
                fill="white"
            >${initials}</text>
        </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
};

export const mockUser = {
    name: 'dev_user',
    displayName: 'Development User',
    id: '123456789',
    profilePictureUrl: generateProfilePictureUrl('dev_user', 'Development User')
};

export const mockTokenInfo = {
    userId: '123456789',
    userName: 'dev_user',
    scopes: []
};
