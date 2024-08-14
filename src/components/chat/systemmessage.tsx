import { SystemMessage, SystemMessageType } from "@/commons/message";
import { Text, ActionIcon } from "@mantine/core"
import classes from './systemmessage.module.css';
import { IconSpeakerphone } from '@tabler/icons-react';
import { useContext } from 'react';
import { ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { ModActions } from "@/components/chat/mod/modactions";

export type SystemMessageProps = {
    msg: SystemMessage;
    modActions: ModActions;
    moderatedChannel: {[id: string]: boolean };
}

function formatString(template: string, args: any[]): string {
    return template.replace(/\$(\d+)/g, (_, index) => args[index]);
}

const messages = {
    'delete': 'A messages from $1 was deleted in $0',
    'timeout': '$1 was timeouted in $0 for $2s',
    'ban': '$1 was banned in $0',
    'raid': '$0 got raided from $1 with $2 viewers',
    'sub_1000': '$1 subscribed to $0 for $2 months',
    'sub_2000': '$1 subscribed with Tier 2 to $0 for $2 months',
    'sub_3000': '$1 subscribed with Tier 3 to $0 for $2 months',
    'subgift_1000': '$1 gifted $2 subs to $0',
    'subgift_2000': '$1 gifted $2 Tier 2 subs to $0',
    'subgift_3000': '$1 gifted $2 Tier 3 subs to $0',
    'subgiftb_1000': '$1 gifted $2 a sub in $0',
    'subgiftb_2000': '$1 gifted $2 a Tier 2 sub in $0',
    'subgiftb_3000': '$1 gifted $2 a Tier 3 sub in $0',
    'sub_Prime': '$1 subscribed with prime to $0 for $2 months',
    'follow': '$1 just followed $0',
    'cheer': '$1 cheered $2 bits to $0'
}

export function SystemMessageComp(props: SystemMessageProps) {
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);

    const isModerator = props.moderatedChannel[props.msg.target.substring(1)];
    const isBroadcaster = props.msg.target.substring(1) === login.user?.name;

    const canShoutout = isModerator || isBroadcaster;
    const modToolsEnabled = config.modToolsEnabled;

    const parts = props.msg.text.split('***');
    const text = formatString(messages[parts[0] as SystemMessageType], parts.slice(1, parts.length))

    const p = props.msg.subType === 'raid' ? {variant: 'gradient', gradient: { from: 'cyan', to: 'orange', deg: 0 }} : {};
    const actions = (props.msg.subType === 'raid' && canShoutout && modToolsEnabled) ? <ActionIcon key='shoutoutAction' variant='subtle' color='primary' size={22} onClick={() => props.modActions.shoutoutUser(props.msg.channelId, props.msg.userId)}><IconSpeakerphone size={14} /></ActionIcon> : null;
    return <div className={[classes.msg, classes[props.msg.subType]].join(' ')}><Text inline span fw={500} {...p}>{text}</Text>{actions}</div>;
}