import { SystemMessage, SystemMessageMainType, HeheChatMessage, parseMessage } from '../../commons/message';
import { formatDuration, formatString } from '../../commons/helper';
import { Text, ActionIcon } from "@mantine/core"
import classes from './systemmessage.module.css';
import { IconSpeakerphone } from '@tabler/icons-react';
import { useContext, useEffect } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from '../../ApplicationContext';
import { ModActions } from './mod/modactions';
import { getEventStyle } from '../events/eventhelper';
import { EventType, EventTypeMapping } from '../../commons/events';
import { ParsedMessagePart } from "../../commons/message";
import { parsedPartsToHtml, joinWithSpace } from './ChatMessage';

export type SystemMessageProps = {
    msg: SystemMessage;
    modActions: ModActions;
    moderatedChannel: {[id: string]: boolean };
}

const messages = {
    'delete': 'A messages from ${username}',
    'timeout': '${username} was timeouted for ${duration:duration}',
    'ban': '${username} was banned',
    'streamOnline': '${channel} just went Live',
    'streamOffline': '${channel} is now Offline',
    'channelPointRedemption': '${username} redeemed "${rewardTitle}"///${text}',
    'raid': 'Raid from ${username} with ${viewers:whole} viewers',
    'raidTo': 'Raid from ${username} with ${viewers:whole} viewers',
    'sub_1000': '${username} subscribed for ${amount:whole} months///${text}',
    'sub_2000': '${username} subscribed with Tier 2 for ${amount:whole} months///${text}',
    'sub_3000': '${username} subscribed with Tier 3 for ${amount:whole} months///${text}',
    'subgift_1000': '${username} gifted ${amount:whole} subs',
    'subgift_2000': '${username} gifted ${amount:whole} Tier 2 subs',
    'subgift_3000': '${username} gifted ${amount:whole} Tier 3 subs',
    'subgiftb_1000': '${username} gifted ${recipient} a sub',
    'subgiftb_2000': '${username} gifted ${recipient} a Tier 2 sub',
    'subgiftb_3000': '${username} gifted ${recipient} a Tier 3 sub',
    'sub_Prime': '${username} subscribed with prime for ${amount:whole} months///${text}',
    'follow': '${username} just followed',
    'cheer': '${username} cheered ${amount:whole} bits///${text}',
    'donation': '${username} donated ${amount} EURO: ${text}',
    'sevenTVAdded': '${username} added new Emote ${emote} ${emote}',
    'sevenTVRemoved': '${username} removed Emote ${emote}'
};

export function SystemMessageComp(props: SystemMessageProps) {
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);

    const isModerator = props.moderatedChannel[props.msg.target.substring(1)];
    const isBroadcaster = props.msg.target.substring(1) === login.user?.name;

    const canShoutout = isModerator || isBroadcaster;
    const modToolsEnabled = config.modToolsEnabled;
    const eventType = props.msg.data.type as EventType;

    const wordMapper = (type: string, word: string, index: number, arr: string[]) => {
        if ((type === 'sevenTVAdded') && index === arr.length - 2) {
            return emotes.getEmote(props.msg.data.channel, word, props.msg.id);
        }
        return word;
    }

    const text = formatString(messages[eventType], props.msg.data);
    const textParts = text.split('///');

    const style = {variant: 'color', width: '100%'};
    
    const eventMainType = EventTypeMapping[eventType] as SystemMessageMainType;
    if (!config.systemMessageInChat[eventMainType]) {
        return;
    }
    getEventStyle({eventtype: eventType, amount: Number(props.msg.data.amount)}, style);

    const channel = props.msg.data.channel;
    var msgParts: ParsedMessagePart[] = [];
    if (textParts.length > 1) {
        msgParts = props.msg.data.text ? (props.msg.data.text.parts ?? []) : [];
    }

    const actions = (props.msg.subType === 'raid' && canShoutout && modToolsEnabled) ? <ActionIcon key='shoutoutAction' variant='subtle' color='primary' size={26} m="0 6px" onClick={() => props.modActions.shoutoutUser(props.msg.channelId, props.msg.userId)} style={{ verticalAlign: 'middle' }}><IconSpeakerphone size={22} /></ActionIcon> : null;
    return <div className={[classes.msg, classes[props.msg.subType]].join(' ')}>
                <Text key="msg-main" fw={700} {...style} style={{fontSize: config.fontSize}}><span className={classes.logo}>{emotes.getLogo(props.msg.data.channel)}</span>{joinWithSpace(textParts[0].split(" ").map((value, index, array) => wordMapper(eventType, value, index, array)))}{actions}</Text>
                {textParts.length === 2 ? <Text key="msg-second" fw={500} style={{fontSize: config.fontSize}}>{parsedPartsToHtml(msgParts, channel, config, emotes, login)}</Text>: null}
        </div>;
}
