import { SystemMessage, SystemMessageType } from "@/commons/message";
import { formatDuration, formatString } from "@/commons/helper";
import { Text, ActionIcon } from "@mantine/core"
import classes from './systemmessage.module.css';
import { IconSpeakerphone } from '@tabler/icons-react';
import { useContext, useEffect } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { ModActions } from "@/components/chat/mod/modactions";
import { parseMessage } from '@/commons/message'
import { getEventStyle } from '@/components/events/eventhelper'
import { EventType, EventTypeMapping } from "@/commons/events";
import { ChatMessage } from "@twurple/chat";
import { parseChatMessage, ParsedMessagePart } from "@twurple/chat"
import { parsedPartsToHtml, joinWithSpace } from "@/components/chat/ChatMessage"
import { useColorScheme, useDidUpdate, useForceUpdate } from '@mantine/hooks';

export type SystemMessageProps = {
    msg: SystemMessage;
    modActions: ModActions;
    moderatedChannel: {[id: string]: boolean };
}

const messages: Record<SystemMessageType, string> = {
    'delete': 'A messages from $1 was deleted',
    'timeout': '$1 was timeouted for $2:duration',
    'ban': '$1 was banned',
    'streamOnline': '$0 just went Live',
    'streamOffline': '$0 is now Offline',
    'channelPointRedemption': '$1 redeemed "$2" $3',
    'raid': 'Raid from $1 with $2:whole viewers',
    'sub_1000': '$1 subscribed for $2:whole months///$4',
    'sub_2000': '$1 subscribed with Tier 2 for $2:whole months///$4',
    'sub_3000': '$1 subscribed with Tier 3 for $2:whole months///$4',
    'subgift_1000': '$1 gifted $2:whole subs',
    'subgift_2000': '$1 gifted $2:whole Tier 2 subs',
    'subgift_3000': '$1 gifted $2:whole Tier 3 subs',
    'subgiftb_1000': '$1 gifted $2 a sub',
    'subgiftb_2000': '$1 gifted $2 a Tier 2 sub',
    'subgiftb_3000': '$1 gifted $2 a Tier 3 sub',
    'sub_Prime': '$1 subscribed with prime for $2:whole months///$4',
    'follow': '$1 just followed',
    'cheer': '$1 cheered $2:whole bits',
    'donation': '$1 donated $2 EURO: $3',
    'sevenTVAdded': '$1 added new Emote $2 $2',
    'sevenTVRemoved': '$1 removed Emote $2'
}

export function SystemMessageComp(props: SystemMessageProps) {
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);


    const isModerator = props.moderatedChannel[props.msg.target.substring(1)];
    const isBroadcaster = props.msg.target.substring(1) === login.user?.name;

    const canShoutout = isModerator || isBroadcaster;
    const modToolsEnabled = config.modToolsEnabled;
    const parts = props.msg.text.split('***');

    const wordMapper = (type: string, word: string, index: number, arr: string[]) => {
        if ((type === 'sevenTVAdded') && index === arr.length - 2) {
            return emotes.getEmote(parts[1], word, props.msg.id);
        }
        return word;
    }

    const text = formatString(messages[parts[0] as SystemMessageType], parts.slice(1, parts.length))
    const textParts = text.split('///');

    const style = {variant: 'color', width: '100%'};
    const eventType = parts[0] as EventType;
    const eventMainType = EventTypeMapping[eventType];
    if (!config.systemMessageInChat[eventMainType]) {
        return;
    }
    getEventStyle({eventtype: eventType, amount: Number(parts[3])}, style);

    const channel = parts[0];
    var msgParts: ParsedMessagePart[] = [];
    if (textParts.length > 1) {
        const parsedMessage = parseMessage(textParts[1]) as ChatMessage;
        msgParts = parseChatMessage(parsedMessage.text, parsedMessage.emoteOffsets, emotes.getCheerEmotes(channel));
    }

    const actions = (props.msg.subType === 'raid' && canShoutout && modToolsEnabled) ? <ActionIcon key='shoutoutAction' variant='subtle' color='primary' size={26} m="0 6px" onClick={() => props.modActions.shoutoutUser(props.msg.channelId, props.msg.userId)} style={{ verticalAlign: 'middle' }}><IconSpeakerphone size={22} /></ActionIcon> : null;
    return <div className={[classes.msg, classes[props.msg.subType]].join(' ')}>
                <Text key="msg-main" fw={700} {...style} style={{fontSize: config.fontSize}}><span className={classes.logo}>{emotes.getLogo(parts[1])}</span>{joinWithSpace(textParts[0].split(" ").map((value, index, array) => wordMapper(parts[0], value, index, array)))}{actions}</Text>
                {textParts.length === 2 ? <Text key="msg-second" fw={500}>{parsedPartsToHtml(msgParts, channel, emotes, login)}</Text>: null}
        </div>;
}