import { SystemMessage } from "./Chat";
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

export function SystemMessageComp(props: SystemMessageProps) {
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);

    const isModerator = props.moderatedChannel[props.msg.target.substring(1)];
    const isBroadcaster = props.msg.target.substring(1) === login.user?.name;

    const canShoutout = isModerator || isBroadcaster;
    const modToolsEnabled = config.modToolsEnabled;

    const p = props.msg.subType === 'raid' ? {variant: 'gradient', gradient: { from: 'cyan', to: 'orange', deg: 0 }} : {};
    const actions = (props.msg.subType === 'raid' && canShoutout && modToolsEnabled) ? <ActionIcon key='shoutoutAction' variant='subtle' color='primary' size={22} onClick={() => props.modActions.shoutoutUser(props.msg.channelId, props.msg.userId)}><IconSpeakerphone size={14} /></ActionIcon> : null;
    return <div className={[classes.msg, classes[props.msg.subType]].join(' ')}><Text inline span fw={500} {...p}>{props.msg.text}</Text>{actions}</div>;
}