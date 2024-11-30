export type ShortCutType = 'clip' | 'marker' | 'chat' | 'adbreak';

export interface ShortCut {
    id: string;
    name: string;
    color: string;
    type: ShortCutType;
    confirm: boolean;
    input: boolean;
    params: string[];
}

class ShortCutHandler {
    handle(shortCut: ShortCut, channelId: string, inputValue: string) {
        console.log(shortCut, channelId, inputValue);
        switch (shortCut.type) {
            case 'chat':
                // Send chat message
                PubSub.publish('WSSEND', {
                    type: 'sendMessage',
                    channel: channelId,
                    text: inputValue || shortCut.params[0] || ''
                });
                break;

            case 'clip':
                // Create clip
                PubSub.publish('WSSEND', {
                    type: 'createClip',
                    channelId
                });
                break;

            case 'marker':
                // Create stream marker
                PubSub.publish('WSSEND', {
                    type: 'createStreamMarker',
                    channelId,
                    description: inputValue || shortCut.params[0] || ''
                });
                break;


            case 'adbreak':
                // Trigger ad break
                PubSub.publish('WSSEND', {
                    type: 'startCommercial',
                    channelId,
                    duration: parseInt(shortCut.params[0] || '60', 10)
                });
                break;
        }
    }
}

export const shortcutHandler = new ShortCutHandler();
