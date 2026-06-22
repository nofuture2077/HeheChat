import { SystemMessage } from '../../commons/message';
import { formatTime, formatString } from '../../commons/helper';
import { Text, ActionIcon } from "@mantine/core"
import classes from './systemmessage.module.css';
import { IconSpeakerphone } from '@tabler/icons-react';
import { memo, useContext } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from '../../ApplicationContext';
import { ModActions } from './mod/modactions';
import { getEventStyle } from '../events/eventhelper';
import { EventType } from '../../commons/events';
import { ParsedMessagePart } from "../../commons/message";
import { joinWithSpace } from "../../commons/helper";
import { parsedPartsToHtml } from './ChatMessage';
import blerpLogo from '@/res/blerp_logo.svg';
import soundalertsLogo from '@/res/soundalerts_logo.svg';
import kofiLogo from '@/res/kofi_logo.svg';
import twitchLogo from '@/res/twitch_logo.svg';
import streamelementsLogo from '@/res/streamelement_logo.svg';
import pallyLogo from '@/res/pally_logo.svg';
import seventvLogo from '@/res/7tv_logo.svg';

export type SystemMessageProps = {
    msg: SystemMessage;
    modActions: ModActions;
    moderatedChannel: {[id: string]: boolean };
}

const platformIcons: Record<string, string> = {
    'blerp': blerpLogo,
    'kofi': kofiLogo,
    'streamelements': streamelementsLogo,
    'pally': pallyLogo,
    'soundalerts': soundalertsLogo,
    '7tv': seventvLogo,
    'twitch': twitchLogo,
};

const messages = {
    'delete': 'A messages from ${username} was deleted',
    'timeout': '${username} was timeouted for ${duration:duration}',
    'ban': '${username} was banned',
    'streamOnline': '${channel} just went Live',
    'streamOffline': '${channel} is now Offline',
    'channelPointRedemption': '${username} redeemed "${rewardTitle}"///${text}',
    'raid': 'Raid from ${username} with ${viewers:whole} viewers',
    'raidTo': 'Raid from ${username} with ${viewers:whole} viewers',
    'sub_1000': '${username} subscribed for ${amount:whole} months${" - ${durationMonths} months in advance", "durationMonths > 1"}///${text}',
    'sub_2000': '${username} subscribed with Tier 2 for ${amount:whole} months${" - ${durationMonths} months in advance", "durationMonths > 1"}///${text}',
    'sub_3000': '${username} subscribed with Tier 3 for ${amount:whole} months${" - ${durationMonths} months in advance", "durationMonths > 1"}///${text}',
    'subgift_1000': '${username} gifted ${amount:whole} subs',
    'subgift_2000': '${username} gifted ${amount:whole} Tier 2 subs',
    'subgift_3000': '${username} gifted ${amount:whole} Tier 3 subs',
    'subgiftb_1000': '${username} gifted ${recipient} a sub${" - ${durationMonths} months in advance", "durationMonths > 1"}',
    'subgiftb_2000': '${username} gifted ${recipient} a Tier 2 sub${" - ${durationMonths} months in advance", "durationMonths > 1"}',
    'subgiftb_3000': '${username} gifted ${recipient} a Tier 3 sub${" - ${durationMonths} months in advance", "durationMonths > 1"}',
    'sub_Prime': '${username} subscribed with prime for ${amount:whole} months///${text}',
    'follow': '${username} just followed',
    'cheer': '${username} cheered ${amount:whole} bits///${text}',
    'donation': '${username} donated ${amount}${currency:currency}///${text}',
    'announcement': 'Chat Announcement///${text}',
    'blerp': '${username} played Blerp ${audioTitle}',
    'soundalerts': '${username} triggered SoundAlert///${overlayMessage}',
    'seventv_emote_add': '${username} added new Emote ${emote} ${emote}',
    'seventv_emote_remove': '${username} removed Emote ${emote}',
    'kofishop': '${username} bought something on ko-fi',
    'kofidono': '${username} donated ${amount}${currency:currency} on ko-fi///${text}',
    'kofisub': '${username} subed on ko-fi with tier ${tier}',
    'tts': '${username} triggered tts',
    'hypetrain': 'Hypetrain level ${level:whole}',
    'streak': '${username} stream streak ${amount:whole}///${text}',
};

export const SystemMessageComp = memo(function SystemMessageComp(props: SystemMessageProps) {
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);

    const isModerator = props.moderatedChannel[props.msg.target.substring(1)];
    const isBroadcaster = props.msg.target.substring(1) === login.user?.name;

    const canShoutout = isModerator || isBroadcaster;
    const modToolsEnabled = config.modToolsEnabled;
    const eventType = props.msg.data.type as EventType;
    const platform = props.msg.data.platform;

    const wordMapper = (type: string, word: string, index: number, arr: string[]) => {
        if ((type === 'seventv_emote_add') && index === arr.length - 2) {
            return emotes.getEmote(props.msg.data.channel, word, props.msg.id);
        }
        return word;
    }

    const text = formatString(messages[eventType], props.msg.data);
    const textParts = text.split('///');

    const style = {variant: 'color', width: '100%'};
    
    getEventStyle({eventtype: eventType, amount: Number(props.msg.data.amount)}, style);

    const channel = props.msg.data.channel;
    var msgParts: ParsedMessagePart[] = [];
    if (textParts.length > 1) {
        msgParts = props.msg.data.text ? (props.msg.data.text.parts ?? []) : [];
    }

    const actions = (props.msg.subType === 'raid' && canShoutout && modToolsEnabled) ? <ActionIcon key='shoutoutAction' variant='subtle' color='primary' size={26} m="0 6px" onClick={() => props.modActions.shoutoutUser(props.msg.channelId, props.msg.userId)} style={{ verticalAlign: 'text-bottom' }}><IconSpeakerphone size={22} /></ActionIcon> : null;
    
    const platformIcon = platform && platformIcons[platform] ? <img src={platformIcons[platform]} className={classes.platformLogo} alt={platform} /> : null;

    return <div className={[classes.msg, classes[props.msg.subType], classes[props.msg.data.color], config.compactMode ? classes.compact : ''].join(' ')}>
                {config.showPlatformLogo ? platformIcon : null}
                {config.showProfilePicture ? <span className={classes.logo}>{emotes.getLogo(props.msg.data.channel)}</span> : null}
                {config.showTimestamp ? <span key='timestamp' className={classes.time}>{formatTime(props.msg.date)} </span> : null}
                <Text {...style} key="msg-main" fw={700} style={{fontSize: config.fontSize, color: "light-dark(black, white)", lineHeight: "inherit"}} span>
                    {joinWithSpace(textParts[0].split(" ").map((value, index, array) => wordMapper(eventType, value, index, array)))}{actions}
                </Text>
                {textParts.length === 2 ? <Text key="msg-second" fw={500} style={{fontSize: config.fontSize}}>{parsedPartsToHtml(msgParts, channel, false, config, emotes, login)}</Text>: null}
        </div>;
});
