import { buildEmoteImageUrl } from '../../commons/twitch';
import classes from './ChatMessage.module.css';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '../../ApplicationContext';
import { LoginContext } from '../../commons/login';
import { useContext, useState, useRef } from 'react';
import { use7TVUsernameCosmetics } from './use7TVCosmetics';
import { SevenTVBadgeComponent } from './SevenTVBadge';
import { IconArrowBackUp, IconTrash, IconClock, IconHammer, IconCopy, IconUser } from '@tabler/icons-react';
import { Text, Image, useComputedColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useLongPress } from "@uidotdev/usehooks";
import { TimeoutView, BanView, DeleteMessageView } from './mod/modview';
import { formatTime, adjustColorForContrast, joinWithSpace } from '../../commons/helper';
import { ModActions } from './mod/modactions';
import { Config } from '../../commons/config';
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
    forceTimestamp?: boolean;
    hideHeheBadges?: boolean;
    openModView: (channel: string, channelId: string, username: string) => void;
    modActions: ModActions;
}

interface Position {
    x: number;
    y: number;
}

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

export function parsedPartsToHtml(parsedParts: ParsedMessagePart[], channel: string, large: boolean, config: Config, emotes: ChatEmotes, login: LoginContext) {
    return parsedParts.map((part, partIndex) => {
        switch (part.type) {
            case 'emote': return <EmoteComponent key={partIndex} imageUrl={buildEmoteImageUrl(part.emote?.id! || part.id || '', {size: large ? '3.0' : '1.0'})} largeImageUrl={buildEmoteImageUrl(part.emote?.id! || part.id || '', {size: large ? '3.0' : '2.0'})} name={part.text} large={large} type='Twitch'/>;
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

const importantBadgeIndex = ['moderator', 'lead_moderator', 'vip', 'staff', 'partner', 'broadcaster', 'ambassador', 'mod-founder'].reduce((obj: any, key: string) => {obj[key] = 'showImportantBadges'; return obj}, {});
const subscriberBadgeIndex = ['subscriber', 'founder'].reduce((obj: any, key: string) => {obj[key] = 'showSubBadges'; return obj}, {});
const predictionBadgeIndex = ['predictions'].reduce((obj: any, key: string) => {obj[key] = 'showPredictions'; return obj}, {});

const badgeIndex = {...importantBadgeIndex, ...subscriberBadgeIndex, ...predictionBadgeIndex};


import { SevenTVUserCosmetics } from './7tvcosmetics';

function getPrioritizedBadges(
    config: Config,
    emotes: ChatEmotes,
    channel: string,
    badges: Record<string, string>,
    sevenTVCosmetics: SevenTVUserCosmetics | null,
    isHeheAdmin: boolean,
    isHehePro: boolean,
    hideHeheBadges: boolean,
    fontSize: number
): React.ReactNode[] {
    const max = config.maxBadges ?? 3;
    const result: React.ReactNode[] = [];
    const entries = Object.entries(badges);

    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (importantBadgeIndex[k] && config.showImportantBadges) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (subscriberBadgeIndex[k] && config.showSubBadges) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    if (!hideHeheBadges && result.length < max && config.show7TVCosmetics && sevenTVCosmetics?.badge) {
        result.push(<SevenTVBadgeComponent key="seventv-badge" badge={sevenTVCosmetics.badge} size={fontSize} />);
    }
    if (!hideHeheBadges && result.length < max) {
        if (isHeheAdmin) {
            result.push(<Image key="hehe-admin" alt="HeheChat Admin" src="/hehebadge_admin.webp" h='1.25em' w='auto' display='inline' style={{verticalAlign: 'text-bottom'}} />);
        } else if (isHehePro) {
            result.push(<Image key="hehe-pro" alt="HeheChat Pro User" src="/hehebadge.webp" h='1.25em' w='auto' display='inline' style={{verticalAlign: 'text-bottom'}} />);
        }
    }
    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (predictionBadgeIndex[k] && config.showPredictions) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (!badgeIndex[k] && config.showOtherBadges) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    return result;
}

export function ChatMessageComp(props: ChatMessageProps) {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);
    const login = useContext(LoginContextContext);
    const computedColorScheme = useComputedColorScheme('dark');
    const [menuPosition, setMenuPosition] = useState<Position | null>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const channel = props.msg.target.slice(1);
    const msgParts = props.msg.parts || [];
    const deleted = props.deletedMessages[props.msg.id];
    const canMod = canModerate(props.msg, channel, props.moderatedChannel, login);
    const isMod = isModerator(props.msg, channel, props.moderatedChannel, login);

    const [timeoutModalOpened, timeoutModalHandler] = useDisclosure(false);
    const [banModalOpened, banModalHandler] = useDisclosure(false);
    const [deleteModalOpened, deleteModalHandler] = useDisclosure(false);

    // 7TV Cosmetics integration (only if enabled in config)
    const theme = computedColorScheme === 'light' ? 'light' : 'dark';
    const { usernameRef, cosmetics, hasCosmetics } = use7TVUsernameCosmetics(
        config.show7TVCosmetics ? props.msg.userInfo.userId : undefined, // Only fetch if enabled
        props.msg.userInfo.displayName,
        theme
    );

    // Fallback to original color adjustment if no 7TV cosmetics or disabled
    const adjustedColor = (config.show7TVCosmetics && hasCosmetics && cosmetics?.paint) 
        ? undefined // Let 7TV cosmetics handle the color
        : adjustColorForContrast(props.msg.userInfo.color || '#ffffff', computedColorScheme === 'light' ? '#f1f1f1' : '#1e1e1e');

    const handleCloseRadial = () => {
        setMenuPosition(null);
    };

    const longPressEvent = useLongPress(
        (e: any) => {
            if (!props.hideReply) {
                const touch = e.touches?.[0] || e;
                setMenuPosition({ x: touch.clientX, y: touch.clientY });
                e.preventDefault();
            }
        },
        {
            threshold: 1000,
            onCancel: () => {
                setMenuPosition(null);
            },
            onStart: (e: any) => {
                if (!props.hideReply) {
                    e.preventDefault();
                }
            }
        }
    );

    const radialActions = [];


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
    
    if (canMod && config.modToolsEnabled) {
        radialActions.push(
            {
                icon: <IconTrash size={48} />,
                onClick: () => {
                    deleteModalHandler.open();
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
    if (!canMod && config.modToolsEnabled) {
        radialActions.push(
            {
                icon: <IconTrash size={48} />,
                disabled: true,
                onClick: () => {
                    props.modActions.deleteMessage(props.msg.channelId || '', props.msg.id);
                },
                tooltip: 'Delete'
            },
            {
                icon: <IconClock size={48} />,
                disabled: true,
                onClick: () => {
                    timeoutModalHandler.open();
                },
                tooltip: 'Timeout'
            },
            {
                icon: <IconHammer size={48} />,
                disabled: true,
                onClick: () => {
                    banModalHandler.open();
                },
                tooltip: 'Ban'
            }
        );
    }

    if (config.modToolsEnabled) {
        radialActions.push({
            icon: <IconUser size={48} />,
            disabled: !isMod,
            onClick: () => {
                props.openModView(props.msg.target.slice(1), props.msg.channelId, props.msg.userInfo?.userName);
            },
            tooltip: 'User'
        });
    }

    const msgClasses = [classes.msg];
    props.msg.msgType && msgClasses.push(classes[props.msg.msgType]);
    props.hideReply && msgClasses.push(classes.hideReply);
    deleted && msgClasses.push(classes.deleted);
    props.msg.isFirst && msgClasses.push(classes.first);
    props.msg.isHighlight && msgClasses.push(classes.highlight);
    config.compactMode && msgClasses.push(classes.compact);
    const largeEmote = props.msg.msgType === 'power_ups_gigantified_emote';
    const badge = props.msg.isFirst ? <span className={classes.firstBadge} key="first-badge">FIRST MESSAGE</span> : props.msg.isHighlight ? <span className={classes.highlightBadge} key="highlight-badge">HIGHLIGHT</span> : null;

    return (
        <>
            <div
                ref={messageRef}
                className={msgClasses.join(' ')}
                onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
                {...longPressEvent}
            >
                {badge}
                {(config.showProfilePicture && !props.hideReply) ? <span key='channel' className={classes.channel}>{emotes.getLogo(channel)}</span>: null}
                {config.showTimestamp || props.forceTimestamp ? <span key='timestamp' className={classes.time}>{formatTime(props.msg.date)}</span> : null}
                <span className={classes.badges}>
                    {getPrioritizedBadges(config, emotes, channel, props.msg.userInfo.badges, cosmetics, props.msg.userInfo.isHeheAdmin, props.msg.userInfo.isHehePro, props.hideHeheBadges ?? false, config.fontSize)}
                </span>
                <span 
                    ref={config.show7TVCosmetics ? usernameRef : undefined}
                    className={classes.username} 
                    style={config.show7TVCosmetics && hasCosmetics ? {} : {color: adjustedColor}}
                    title={config.show7TVCosmetics && hasCosmetics && cosmetics?.paint ? `7TV Paint: ${cosmetics.paint.name}` : undefined}
                >
                    {props.msg.userInfo.displayName}
                </span>
                <span>: </span>
                <span className={classes.text}>{parsedPartsToHtml(msgParts, channel, largeEmote, config, emotes, login)}</span>
            </div>
            
            {menuPosition && (
                <>
                <RadialDial
                    actions={radialActions}
                    radius={100}
                    onClose={handleCloseRadial}
                    messageRef={messageRef}
                    position={menuPosition}
                />
                <span></span>
                </>
            )}

            {deleteModalOpened ? <DeleteMessageView key='deleteModal' channelId={props.msg.channelId || ''} channelName={channel} messageId={props.msg.id} messageText={props.msg.text} userName={props.msg.userInfo.displayName} close={deleteModalHandler.close} deleteMessage={props.modActions.deleteMessage}/> : null}
            {timeoutModalOpened ? <TimeoutView key='timeoutModal' channelId={props.msg.channelId || ''} channelName={channel} userId={props.msg.userInfo.userId} userName={props.msg.userInfo.displayName} close={timeoutModalHandler.close} timeoutUser={props.modActions.timeoutUser}/> : null}
            {banModalOpened ? <BanView key='banModal' channelId={props.msg.channelId || ''} channelName={channel} userId={props.msg.userInfo.userId} userName={props.msg.userInfo.displayName} close={banModalHandler.close} banUser={props.modActions.banUser}/> : null}
        </>
    );
}

export function canModerate(msg: HeheChatMessage, channel: string, moderatedChannel: {[id: string]: boolean }, login: LoginContext) {
    const isModerator = moderatedChannel[channel];
    const isBroadcaster = channel === login.user?.name;
    const chatterIsMod = msg.userInfo?.isMod || false;
    const chatterIsBroadcaster = channel === msg.userInfo?.userName;
    const canMod = (isModerator || isBroadcaster) && !chatterIsMod && !chatterIsBroadcaster;
    return canMod;
}

export function isModerator(msg: HeheChatMessage, channel: string, moderatedChannel: {[id: string]: boolean }, login: LoginContext) {
    const isModerator = moderatedChannel[channel];
    const isBroadcaster = channel === login.user?.name;
    return (isModerator || isBroadcaster);
}
