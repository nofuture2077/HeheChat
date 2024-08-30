import { ChatMessage, ParsedMessagePart, parseChatMessage, buildEmoteImageUrl } from '@twurple/chat';
import classes from './ChatMessage.module.css';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '@/ApplicationContext';
import { LoginContext } from '@/commons/login';
import { useContext } from 'react';
import { IconArrowBackUp, IconTrash, IconClock, IconHammer, IconCopy, IconCheck } from '@tabler/icons-react';
import { ActionIcon, Text, Group, CopyButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TimeoutView, BanView } from './mod/modview';
import { formatTime } from '@/commons/helper';
import { ModActions } from '@/components/chat/mod/modactions';
import { Config, ConfigKey, } from '@/commons/config'
import { ChatEmotes } from '@/commons/emotes'
import { EmoteComponent } from '@/components/emote/emote';

interface ChatMessageProps {
    msg: ChatMessage;
    deletedMessages: {[id: string]: boolean };
    moderatedChannel: {[id: string]: boolean };
    setReplyMsg: (msg?: ChatMessage) => void;
    hideReply?: boolean;
    openModView: (msg: ChatMessage) => void;
    modActions: ModActions;
}

const joinWithSpace = (elements: React.ReactNode[]): React.ReactNode[] => {
    return elements.reduce<React.ReactNode[]>((acc, elem, index) => {
      if (index === 0) {
        return [elem];
      }
      return [...acc, ' ', elem];
    }, []);
};

const wordMapper = (word: string, channel: string, partIndex: number, index: number, emotes: ChatEmotes, login: LoginContext) => {
    if (word.startsWith('http://') || word.startsWith('https://')) {
        return <a href={word} key={partIndex + "_" + index} target='_blank'>{word}</a>;
    } else if (word.toLocaleLowerCase().indexOf(login.user?.name || ' ') > -1) {
        return <Text fw={700} key={partIndex + "_" + index} bg='primary' inline span>{word}</Text>
    } else if (word.startsWith('@')) {
        return <b key={partIndex + "_" + index}>{word}</b>
    }
    return emotes.getEmote(channel, word, partIndex + "_" + index);
}

function parsedPartsToHtml(parsedParts: ParsedMessagePart[], channel: string, emotes: ChatEmotes, login: LoginContext) {
    return parsedParts.map((part, partIndex) => {
        switch (part.type) {
            case 'text': return joinWithSpace(part.text.split(' ').map((word, index) => wordMapper(word, channel, partIndex, index, emotes, login)))
            case 'emote': return <EmoteComponent key={partIndex} imageUrl={buildEmoteImageUrl(part.id)} largeImageUrl={buildEmoteImageUrl(part.id, {size: '2.0'})} name={part.name} type='Twitch'/>;
            case 'cheer': {
                const cheerEmote = emotes.getCheerEmote(channel, part.name, part.amount);
                return <span key={partIndex}><img alt={part.name + part.amount} key={partIndex} src={cheerEmote.url} /><span key={partIndex+'_amount'} style={{color: cheerEmote.color}}> {part.amount}</span></span>
            };
        }
    });
}

const importantBadgeIndex = ['moderator', 'vip', 'staff', 'partner'].reduce((obj: any, key: string) => {obj[key] = 'showImportantBadges'; return obj}, {});
const subscriberBadgeIndex = ['subscriber', 'founder'].reduce((obj: any, key: string) => {obj[key] = 'showSubBadges'; return obj}, {});
const predictionBadgeIndex = ['predictions'].reduce((obj: any, key: string) => {obj[key] = 'showPredictions'; return obj}, {});

const badgeIndex = {...importantBadgeIndex, ...subscriberBadgeIndex, ...predictionBadgeIndex};

function getBadge(config: Config, emotes: ChatEmotes, channel: string, key: string, index: string) {
    const [badge, version] = key.split(',');
    const requireSetting = badgeIndex[badge];
    if (requireSetting && config[requireSetting as ConfigKey] || !requireSetting && config.showOtherBadges) {
        return emotes.getBadge(channel, key, index);
    }
    return '';
}

export function ChatMessageComp(props: ChatMessageProps) {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);
    const login = useContext(LoginContextContext);
    const channel = props.msg.target.slice(1);
    const cheerEmotes = emotes.getCheerEmotes(channel);
    const msgParts = parseChatMessage(props.msg.text, props.msg.emoteOffsets, cheerEmotes);
    const deleted = props.deletedMessages[props.msg.id];
    const canMod = canModerate(props.msg, channel, props.moderatedChannel, login);
    const [timeoutModalOpened, timeoutModalHandler] = useDisclosure(false);
    const [banModalOpened, banModalHandler] = useDisclosure(false);

    const actions = [];
    if (canMod && config.modToolsEnabled) {
        actions.push(<ActionIcon key='deleteAction' variant='white' color='primary' size={22} onClick={() => {props.modActions.deleteMessage(props.msg.channelId || '', props.msg.id)}}><IconTrash size={14} /></ActionIcon>);
        actions.push(<ActionIcon key='timeoutAction' variant='white' color='primary' size={22} onClick={timeoutModalHandler.open}><IconClock size={14} /></ActionIcon>);
        actions.push(<ActionIcon key='banAction' variant='white' color='primary' size={22} onClick={banModalHandler.open}><IconHammer size={14} /></ActionIcon>);
    }
    if (!props.hideReply) {
        actions.push(<CopyButton key='copyAction' value={props.msg.text}>{({ copied, copy }) => (<ActionIcon key='replyAction' size={22} variant='white' onClick={copy}>{copied ? <IconCheck size={config.fontSize}/> : <IconCopy size={config.fontSize}/>}</ActionIcon>)}</CopyButton>);
        actions.push(<ActionIcon key='replyAction' size={22} variant='white' onClick={() => props.setReplyMsg(props.msg)}><IconArrowBackUp size={config.fontSize}/></ActionIcon>);
    }

    return (<div className={classes.msg + (props.hideReply ? (' ' + classes.hideReply) : '') + (deleted ? (' ' + classes.deleted) : '')}>
        <span className={classes.channel}>{(config.showProfilePicture && !props.hideReply) ? emotes.getLogo(channel): ''}</span>
        <span className={classes.time}>{config.showTimestamp ? formatTime(props.msg.date) : ''}</span>
        <span className={classes.badges}>{Array.from(props.msg.userInfo.badges).map((key, index) =>  getBadge(config, emotes, channel, key.toString(), index.toString()))}</span>
        <span className={classes.username} style={{color: props.msg.userInfo.color}}>{props.msg.userInfo.displayName}</span>
        <span>: </span>
        <span className={classes.text}>{parsedPartsToHtml(msgParts, channel, emotes, login)}</span>
        { actions.length ? <Group key='actionsGroup' className={classes.actions} gap={'sm'}>{actions}</Group>: null}
        {timeoutModalOpened ? <TimeoutView key='timeoutModal' channelId={props.msg.channelId || ''} channelName={channel} userId={props.msg.userInfo.userId} userName={props.msg.userInfo.displayName} close={timeoutModalHandler.close} timeoutUser={props.modActions.timeoutUser}/> : null}
        {banModalOpened ? <BanView key='banModal' channelId={props.msg.channelId || ''} channelName={channel} userId={props.msg.userInfo.userId} userName={props.msg.userInfo.displayName} close={banModalHandler.close} banUser={props.modActions.banUser}/> : null}
    </div>);
}

export function canModerate(msg: ChatMessage, channel: string, moderatedChannel: {[id: string]: boolean }, login: LoginContext) {
    const isModerator = moderatedChannel[channel];
    const isBroadcaster = channel === login.user?.name;
    const chatterIsMod = msg.userInfo.isMod;
    const chatterIsBroadcaster = channel === msg.userInfo.userName;
    const canMod = (isModerator || isBroadcaster) && !chatterIsMod && !chatterIsBroadcaster;
    return canMod;
}
