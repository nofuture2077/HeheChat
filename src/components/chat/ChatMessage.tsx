import { buildEmoteImageUrl } from '../../commons/twitch';
import classes from './ChatMessage.module.css';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '../../ApplicationContext';
import { LoginContext } from '../../commons/login';
import { useContext, useState, useRef } from 'react';
import { IconArrowBackUp, IconTrash, IconClock, IconHammer, IconCopy, IconDotsCircleHorizontal } from '@tabler/icons-react';
import { Text, useComputedColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TimeoutView, BanView } from './mod/modview';
import { formatTime, adjustColorForContrast } from '../../commons/helper';
import { ModActions } from './mod/modactions';
import { Config, ConfigKey } from '../../commons/config';
import { ChatEmotes } from '../../commons/emotes';
import { EmoteComponent } from '../emote/emote';
import { HeheChatMessage, ParsedMessagePart } from '../../commons/message';
import { RadialDial } from '../radialdial/RadialDial';

interface ChatMessageProps {
    msg: HeheChatMessage;
    deletedMessages: {[id: string]: boolean };
    moderatedChannel: {[id: string]: boolean };
    setReplyMsg: (msg?: HeheChatMessage) => void;
    hideReply?: boolean;
    openModView: (msg: HeheChatMessage) => void;
    modActions: ModActions;
}

interface ClickPosition {
    x: number;
    y: number;
}

export const joinWithSpace = (elements: React.ReactNode[]): React.ReactNode[] => {
    return elements.reduce<React.ReactNode[]>((acc, elem, index) => {
      if (index === 0) {
        return [elem];
      }
      return [...acc, ' ', elem];
    }, []);
};

const extractClipId = (url: string): string | null => {
    try {
        const clipRegex = /(?:clips\.twitch\.tv\/|twitch\.tv\/\w+\/clip\/)([A-Za-z0-9-_]+)/;
        const match = url.match(clipRegex);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

const wordMapper = (word: string, channel: string, partIndex: number, index: number, config: Config, emotes: ChatEmotes, login: LoginContext) => {
    if (word.startsWith('http://') || word.startsWith('https://')) {
        const clipId = extractClipId(word);
        if (clipId) {
            return <a href="#" key={partIndex + "_" + index} onClick={(e) => { e.preventDefault(); PubSub.publish("CLIP-CLICK", { clipId }); }}>{word}</a>;
        }
        return <a href={word} key={partIndex + "_" + index} target='_blank'>{word}</a>;
    } else if (word.toLocaleLowerCase().indexOf(login.user?.name || ' ') > -1) {
        return <Text fw={700} key={partIndex + "_" + index} className={classes.highlight_name} inline span style={{fontSize: config.fontSize}}>{word}</Text>
    } else if (word.startsWith('@')) {
        return <b key={partIndex + "_" + index}>{word}</b>
    }
    return emotes.getEmote(channel, word, partIndex + "_" + index);
}

export function parsedPartsToHtml(parsedParts: ParsedMessagePart[], channel: string, config: Config, emotes: ChatEmotes, login: LoginContext) {
    return parsedParts.map((part, partIndex) => {
        switch (part.type) {
            case 'emote': return <EmoteComponent key={partIndex} imageUrl={buildEmoteImageUrl(part.emote?.id! || part.id || '')} largeImageUrl={buildEmoteImageUrl(part.emote?.id! || part.id || '', {size: '2.0'})} name={part.text} type='Twitch'/>;
            case 'cheermote': {
                if (part.cheermote?.bits) {
                    const cheerEmote = emotes.getCheerEmote(channel, part.cheermote?.prefix || '', part.cheermote?.bits || 0);
                    return <span key={partIndex}><img style={{width: "auto", height: "1.5em", display: "inline"}} alt={part.cheermote?.prefix + part.cheermote?.bits} key={partIndex} src={cheerEmote.url} /><span key={partIndex+'_amount'} style={{color: cheerEmote.color}}> {part.cheermote?.bits}</span></span>
                }
                return part.cheermote?.prefix + "0";
            };
            case 'text': return joinWithSpace(part.text!.split(' ').map((word, index) => wordMapper(word, channel, partIndex, index, config, emotes, login)));
            case 'mention': return wordMapper(part.text, channel, partIndex, 0, config, emotes, login)
        }
    });
}

const importantBadgeIndex = ['moderator', 'vip', 'staff', 'partner', 'broadcaster'].reduce((obj: any, key: string) => {obj[key] = 'showImportantBadges'; return obj}, {});
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
    const computedColorScheme = useComputedColorScheme('dark');
    const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const channel = props.msg.target.slice(1);
    const cheerEmotes = emotes.getCheerEmotes(channel);
    const msgParts = props.msg.parts || [];
    const deleted = props.deletedMessages[props.msg.id];
    const canMod = canModerate(props.msg, channel, props.moderatedChannel, login);
    const [timeoutModalOpened, timeoutModalHandler] = useDisclosure(false);
    const [banModalOpened, banModalHandler] = useDisclosure(false);

    // Adjust username color for contrast against standard dark background
    const adjustedColor = adjustColorForContrast(props.msg.userInfo.color || '#ffffff', computedColorScheme === 'light' ? '#f1f1f1' : '#1e1e1e');

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!props.hideReply) {
            e.preventDefault(); // Prevent text selection
            setClickPosition({ x: e.clientX, y: e.clientY });
        }
    };

    const handleCloseRadial = () => {
        setClickPosition(null);
    };

    const radialActions = [];
    
    if (canMod && config.modToolsEnabled) {
        radialActions.push(
            {
                icon: <IconTrash size={48} />,
                onClick: () => {
                    props.modActions.deleteMessage(props.msg.channelId || '', props.msg.id);
                },
                tooltip: 'Delete'
            },
            {
                icon: <IconClock size={48} />,
                onClick: () => {
                    timeoutModalHandler.open();
                },
                tooltip: 'Timeout'
            },
            {
                icon: <IconHammer size={48} />,
                onClick: () => {
                    banModalHandler.open();
                },
                tooltip: 'Ban'
            }
        );
    }

    if (!props.hideReply && config.chatEnabled) {
        radialActions.push(
            {
                icon: <IconCopy size={48} />,
                onClick: () => {
                    navigator.clipboard.writeText(props.msg.text);
                },
                tooltip: 'Copy'
            },
            {
                icon: <IconArrowBackUp size={48} />,
                onClick: () => {
                    props.setReplyMsg(props.msg);
                },
                tooltip: 'Reply'
            }
        );
    }

    const msgClasses = [classes.msg];
    props.hideReply && msgClasses.push(classes.hideReply);
    deleted && msgClasses.push(classes.deleted);
    props.msg.isFirst && msgClasses.push(classes.first);
    props.msg.isHighlight && msgClasses.push(classes.highlight);

    const badge = props.msg.isFirst ? <span className={classes.firstBadge} key="first-badge">FIRST MESSAGE</span> : props.msg.isHighlight ? <span className={classes.highlightBadge} key="highlight-badge">HIGHLIGHT</span> : null;

    return (
        <>
            <div 
                ref={messageRef}
                className={msgClasses.join(' ')} 
                onMouseDown={handleMouseDown}
                onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
            >
                {badge}
                {(config.showProfilePicture && !props.hideReply) ? <span key='channel' className={classes.channel}>{emotes.getLogo(channel)}</span>: null}
                {config.showTimestamp ? <span key='timestamp' className={classes.time}>{formatTime(props.msg.date)}</span> : null}
                <span className={classes.badges}>{Object.entries(props.msg.userInfo.badges).map((entry, index) =>  getBadge(config, emotes, channel, entry.join(','), index.toString()))}</span>
                <span className={classes.username} style={{color: adjustedColor}}>{props.msg.userInfo.displayName}</span>
                <span>: </span>
                <span className={classes.text}>{parsedPartsToHtml(msgParts, channel, config, emotes, login)}</span>
            </div>
            
            {clickPosition && (
                <><div 
                    className={classes.radialContainer}
                    style={{
                        left: clickPosition.x,
                        top: clickPosition.y
                    }}
                >
                    <RadialDial
                        actions={radialActions}
                        icon={<IconDotsCircleHorizontal size={64} />}
                        radius={100}
                        onClose={handleCloseRadial}
                        messageRef={messageRef}
                    />
                </div><div></div></>
            )}

            {timeoutModalOpened ? <TimeoutView key='timeoutModal' channelId={props.msg.channelId || ''} channelName={channel} userId={props.msg.userInfo.userId} userName={props.msg.userInfo.displayName} close={timeoutModalHandler.close} timeoutUser={props.modActions.timeoutUser}/> : null}
            {banModalOpened ? <BanView key='banModal' channelId={props.msg.channelId || ''} channelName={channel} userId={props.msg.userInfo.userId} userName={props.msg.userInfo.displayName} close={banModalHandler.close} banUser={props.modActions.banUser}/> : null}
        </>
    );
}

export function canModerate(msg: HeheChatMessage, channel: string, moderatedChannel: {[id: string]: boolean }, login: LoginContext) {
    const isModerator = moderatedChannel[channel];
    const isBroadcaster = channel === login.user?.name;
    const chatterIsMod = msg.userInfo.isMod;
    const chatterIsBroadcaster = channel === msg.userInfo.userName;
    const canMod = (isModerator || isBroadcaster) && !chatterIsMod && !chatterIsBroadcaster;
    return canMod;
}
