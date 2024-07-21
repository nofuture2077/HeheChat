import { ChatMessage, ParsedMessagePart, parseChatMessage, buildEmoteImageUrl } from '@twurple/chat';
import classes from './ChatMessage.module.css';
import { ChatConfigContext, ChatEmotes, ChatConfig, ChatConfigKey } from '../../ApplicationContext';
import { useContext } from 'react';
import { IconArrowBackUp } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';


interface ChatMessageProps {
    msg: ChatMessage;
    setReplyMsg: (msg?: ChatMessage) => void;
    hideReply?: boolean;
}

function formatTime(date: Date): string {
    let hours: number | string = date.getHours();
    let minutes: number | string = date.getMinutes();
    
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    
    return `${hours}:${minutes}`;
}

const joinWithSpace = (elements: React.ReactNode[]): React.ReactNode[] => {
    return elements.reduce<React.ReactNode[]>((acc, elem, index) => {
      if (index === 0) {
        return [elem];
      }
      return [...acc, ' ', elem];
    }, []);
  };

function parsedPartsToHtml(parsedParts: ParsedMessagePart[], channel: string, emotes: ChatEmotes) {
    return parsedParts.map((part, partIndex) => {
        switch (part.type) {
            case 'text': return joinWithSpace(part.text.split(' ').map((word, index) => emotes.getEmote(channel, word, partIndex + "_" + index)))
            case 'emote': return <img key={partIndex} src={buildEmoteImageUrl(part.id)} />;
            case 'cheer': return part.amount;
        }
    });
}

const importantBadgeIndex = ['moderator', 'vip', 'staff', 'partner'].reduce((obj: any, key: string) => {obj[key] = 'showImportantBadges'; return obj}, {});
const subscriberBadgeIndex = ['subscriber', 'founder'].reduce((obj: any, key: string) => {obj[key] = 'showSubBadges'; return obj}, {});
const predictionBadgeIndex = ['predictions'].reduce((obj: any, key: string) => {obj[key] = 'showPredictions'; return obj}, {});

const badgeIndex = {...importantBadgeIndex, ...subscriberBadgeIndex, ...predictionBadgeIndex};

function getBadge(config: ChatConfig, emotes: ChatEmotes, channel: string, key: string, index: string) {
    const [badge, version] = key.split(',');
    const requireSetting = badgeIndex[badge];
    if (requireSetting && config[requireSetting as ChatConfigKey] || !requireSetting && config.showOtherBadges) {
        return emotes.getBadge(channel, key, index);
    }
    return '';
}

export function ChatMessageComp(props: ChatMessageProps) {
    const config = useContext(ChatConfigContext);
    const emotes = useContext(ChatEmotes);
    const channel = props.msg.target.slice(1);
    const cheerEmotes = emotes.getCheerEmotes(channel);
    const msgParts = parseChatMessage(props.msg.text, props.msg.emoteOffsets, cheerEmotes);

    return (<div key={props.msg.id} className={classes.msg + (props.hideReply ? (' ' + classes.hideReply) : '')}>
        <span className={classes.channel}>{(config.showProfilePicture && !props.hideReply) ? emotes.getLogo(channel): ''}</span>
        <span className={classes.time}>{config.showTimestamp ? formatTime(props.msg.date) : ''} </span>
        <span className={classes.badges}>{Array.from(props.msg.userInfo.badges).map((key, index) =>  getBadge(config, emotes, channel, key.toString(), index.toString()))}</span>
        <span className={classes.username} style={{color: props.msg.userInfo.color}}>{props.msg.userInfo.displayName}</span>
        <span>: </span>
        <span className={classes.text}>{parsedPartsToHtml(msgParts, channel, emotes)}</span>
        <span className={classes.actions}></span>
        {props.hideReply ? null : <ActionIcon variant='subtle' onClick={() => props.setReplyMsg(props.msg)}><IconArrowBackUp/></ActionIcon>}
    </div>);
}