import classes from './ChatMessageBrowserSource.module.css';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '../../ApplicationContext';
import { memo, useContext } from 'react';
import { Image } from '@mantine/core';
import { use7TVUsernameCosmetics } from './use7TVCosmetics';
import { SevenTVBadgeComponent } from './SevenTVBadge';
import { adjustColorForContrast } from '../../commons/helper';
import { Config } from '../../commons/config';
import { ChatEmotes } from '../../commons/emotes';
import { HeheChatMessage } from '../../commons/message';
import { parsedPartsToHtml } from './ChatMessage';
import { SevenTVUserCosmetics } from './7tvcosmetics';

const importantBadgeIndex = ['moderator', 'lead_moderator', 'vip', 'staff', 'partner', 'broadcaster', 'ambassador', 'mod-founder'].reduce((obj: any, key: string) => { obj[key] = true; return obj; }, {});
const subscriberBadgeIndex = ['subscriber', 'founder'].reduce((obj: any, key: string) => { obj[key] = true; return obj; }, {});
const predictionBadgeIndex = ['predictions'].reduce((obj: any, key: string) => { obj[key] = true; return obj; }, {});
const badgeIndex = { ...importantBadgeIndex, ...subscriberBadgeIndex, ...predictionBadgeIndex };

function getBsPrioritizedBadges(
    config: Config,
    emotes: ChatEmotes,
    channel: string,
    badges: Record<string, string>,
    sevenTVCosmetics: SevenTVUserCosmetics | null,
    isHeheAdmin: boolean,
    isHehePro: boolean,
    hideHeheBadges: boolean
): React.ReactNode[] {
    const max = config.chatBsMaxBadges ?? 3;
    const result: React.ReactNode[] = [];
    const entries = Object.entries(badges);

    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (importantBadgeIndex[k] && config.chatBsShowImportantBadges !== false) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (subscriberBadgeIndex[k] && config.chatBsShowSubBadges !== false) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    if (!hideHeheBadges && result.length < max && config.chatBsShow7TVBadges !== false && config.show7TVCosmetics && sevenTVCosmetics?.badge) {
        result.push(<SevenTVBadgeComponent key="seventv-badge" badge={sevenTVCosmetics.badge} size={config.chatBsFontSize ?? 14} />);
    }
    if (!hideHeheBadges && result.length < max && config.chatBsShowHeheBadges !== false) {
        if (isHeheAdmin) {
            result.push(<Image key="hehe-admin" alt="HeheChat Admin" src="/hehebadge_admin.webp" h='1.25em' w='auto' display='inline' style={{verticalAlign: 'text-bottom'}} />);
        } else if (isHehePro) {
            result.push(<Image key="hehe-pro" alt="HeheChat Pro" src="/hehebadge.webp" h='1.25em' w='auto' display='inline' style={{verticalAlign: 'text-bottom'}} />);
        }
    }
    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (predictionBadgeIndex[k] && config.chatBsShowOtherBadges !== false) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    for (const [k, v] of entries) {
        if (result.length >= max) break;
        if (!badgeIndex[k] && config.chatBsShowOtherBadges !== false) {
            const node = emotes.getBadge(channel, `${k},${v}`, k);
            if (node) result.push(node);
        }
    }
    return result;
}

interface Props {
    msg: HeheChatMessage;
    hideHeheBadges?: boolean;
}

export const ChatMessageBrowserSource = memo(function ChatMessageBrowserSource({ msg, hideHeheBadges }: Props) {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);
    const login = useContext(LoginContextContext);
    const channel = msg.target.slice(1);

    const { usernameRef, cosmetics, hasCosmetics } = use7TVUsernameCosmetics(
        config.show7TVCosmetics ? msg.userInfo.userId : undefined,
        msg.userInfo.displayName,
        'dark'
    );

    const adjustedColor = (config.show7TVCosmetics && hasCosmetics && cosmetics?.paint)
        ? undefined
        : adjustColorForContrast(msg.userInfo.color || '#ffffff', '#1e1e1e');

    const badge = msg.isFirst
        ? <span className={classes.firstBadge}>FIRST</span>
        : msg.isHighlight
        ? <span className={classes.highlightBadge}>HIGHLIGHT</span>
        : null;

    return (
        <div className={classes.msg}>
            {badge}
            <span className={classes.badges}>
                {getBsPrioritizedBadges(config, emotes, channel, msg.userInfo.badges, cosmetics, msg.userInfo.isHeheAdmin, msg.userInfo.isHehePro, hideHeheBadges ?? false)}
            </span>
            {config.chatBsShowUsername !== false && (
                <>
                    <span
                        ref={config.show7TVCosmetics ? usernameRef : undefined}
                        className={classes.username}
                        style={adjustedColor !== undefined ? { color: adjustedColor } : {}}
                    >
                        {msg.userInfo.displayName}
                    </span>
                    <span>: </span>
                </>
            )}
            <span className={classes.text}>{parsedPartsToHtml(msg.parts || [], channel, msg.msgType === 'power_ups_gigantified_emote', config, emotes, login)}</span>
        </div>
    );
});
