import { ChatMessage, ParsedMessagePart, parseChatMessage, buildEmoteImageUrl } from '@twurple/chat';
import classes from './ChatMessage.module.css';
import { ChatConfigContext, ChatEmotes, ChatConfig, chatColor } from '../../ApplicationContext';
import { useContext } from 'react';

interface ChatMessageProps {
    msg: ChatMessage
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

function getBadge(config: ChatConfig, emotes: ChatEmotes, channel: string, key: string, index: string) {
    const [badge, version] = key.split(',');
    if (config.showImportantBadges && ['moderator', 'vip', 'staff', 'partner'].indexOf(badge) > -1) {
        return emotes.getBadge(channel, key, index);
    }
    if (config.showSubBadges && ['subscriber', 'founder'].indexOf(badge) > -1) {
        return emotes.getBadge(channel, key, index);
    }
    if (config.showPredictions && ['predictions'].indexOf(badge) > -1) {
        return emotes.getBadge(channel, key, index);
    }
    if (config.showOtherBadges) {
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

    return (<div key={props.msg.id} className={classes.msg}>
        <span className={classes.channel}>{config.showProfilePicture ? emotes.getLogo(channel): ''}</span>
        <span className={classes.time}>{config.showTimestamp ? formatTime(props.msg.date) : ''} </span>
        <span className={classes.badges}>{Array.from(props.msg.userInfo.badges).map((key, index) =>  getBadge(config, emotes, channel, key.toString(), index.toString()))}</span>
        <span className={classes.username} style={{color: props.msg.userInfo.color}}>{props.msg.userInfo.displayName}</span>
        <span>: </span>
        <span className={classes.text}>{parsedPartsToHtml(msgParts, channel, emotes)}</span>
        <span className={classes.actions}></span>
    </div>);
}