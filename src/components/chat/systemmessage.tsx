import { SystemMessage, SystemMessageType } from "@/commons/message";
import { formatDuration, formatString } from "@/commons/helper";
import { Text, ActionIcon } from "@mantine/core"
import classes from './systemmessage.module.css';
import { IconSpeakerphone } from '@tabler/icons-react';
import { useContext } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { ModActions } from "@/components/chat/mod/modactions";
import { parseMessage } from '@/commons/message'
import { getEventStyle } from '@/components/events/eventhelper'
import { EventType } from "@/commons/events";
import { ModActionType } from '@/components/chat/mod/modactions'

export type SystemMessageProps = {
    msg: SystemMessage;
    modActions: ModActions;
    moderatedChannel: {[id: string]: boolean };
}

const messages: Record<EventType | ModActionType, string> = {
    'delete': 'A messages from $1 was deleted',
    'timeout': '$1 was timeouted for $2',
    'ban': '$1 was banned',
    'raid': 'Raid from $1 with $2 viewers',
    'sub_1000': '$1 subscribed for $2 months///$4',
    'sub_2000': '$1 subscribed with Tier 2 for $2 months///$4',
    'sub_3000': '$1 subscribed with Tier 3 for $2 months///$4',
    'subgift_1000': '$1 gifted $2 subs',
    'subgift_2000': '$1 gifted $2 Tier 2 subs',
    'subgift_3000': '$1 gifted $2 Tier 3 subs',
    'subgiftb_1000': '$1 gifted $2 a sub',
    'subgiftb_2000': '$1 gifted $2 a Tier 2 sub',
    'subgiftb_3000': '$1 gifted $2 a Tier 3 sub',
    'sub_Prime': '$1 subscribed with prime for $2 months///$4',
    'follow': '$1 just followed',
    'cheer': '$1 cheered $2 bits',
    'donation': '$1 donated $2 $3'
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
    if (parts[0] === 'timeout') {
        parts[3] = formatDuration(Number(parts[3]) * 1000);
    }
    const text = formatString(messages[parts[0] as SystemMessageType], parts.slice(1, parts.length))
    const textParts = text.split('///');

    const style = {variant: 'color'};
    getEventStyle({eventtype: parts[1] as EventType, amount: Number(parts[2])}, style);

    const actions = (props.msg.subType === 'raid' && canShoutout && modToolsEnabled) ? <ActionIcon key='shoutoutAction' variant='subtle' color='primary' size={22} onClick={() => props.modActions.shoutoutUser(props.msg.channelId, props.msg.userId)}><IconSpeakerphone size={14} /></ActionIcon> : null;
    return <div className={[classes.msg, classes[props.msg.subType]].join(' ')}>
            <Text fw={700} {...style}>{emotes.getLogo(parts[1])}{textParts[0]}</Text>
            {textParts.length === 2 ? <Text fw={500}>{parseMessage(textParts[1]).text}</Text>: null}
            {actions}
        </div>;
}