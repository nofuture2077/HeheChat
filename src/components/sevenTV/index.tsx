import {toMap} from '../commons'

interface sevenTVEmote {
    name: string;
    data: {
        id: string;
        animated: boolean;
        host: {
            files: {
                name: string;
                static_name: string;
                format: string;
                width: number;
                height: number;
            }[];
            url: string;
        }
    };
}

interface sevenTVEmoteSet {
    emotes: sevenTVEmote[];
    id: string;
}

interface sevenTVUser {
    displayname: string;
    id: string;
    emote_set: sevenTVEmoteSet;
}

export async function get7TVEmotes(userId: string) {
    const user: sevenTVUser = await fetch('https://7tv.io/v3/users/twitch/' + userId)
                                        .then(res => {
                                            if (!res.ok) {
                                                throw new Error(`HTTP error! Status: ${res.status}`);
                                            }
                                            return res.json();
                                        }).catch(err => ({
                                            emote_set: {
                                                emotes: []
                                            }
                                        }));

    const emotes = toMap(user.emote_set.emotes, e => e.name);
    return emotes;
}