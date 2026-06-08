import classes from './ChatMessageBrowserSource.module.css';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '../../ApplicationContext';
import { useContext } from 'react';
import { use7TVUsernameCosmetics } from './use7TVCosmetics';
import { SevenTVBadgeComponent } from './SevenTVBadge';
import { adjustColorForContrast } from '../../commons/helper';
import { Config, ConfigKey } from '../../commons/config';
import { ChatEmotes } from '../../commons/emotes';
import { HeheChatMessage } from '../../commons/message';
import { parsedPartsToHtml } from './ChatMessage';

const importantBadgeIndex = ['moderator', 'lead_moderator', 'vip', 'staff', 'partner', 'broadcaster', 'ambassador', 'mod-founder'].reduce((obj: any, key: string) => { obj[key] = 'showImportantBadges'; return obj; }, {});
const subscriberBadgeIndex = ['subscriber', 'founder'].reduce((obj: any, key: string) => { obj[key] = 'showSubBadges'; return obj; }, {});
const predictionBadgeIndex = ['predictions'].reduce((obj: any, key: string) => { obj[key] = 'showPredictions'; return obj; }, {});
const badgeIndex = { ...importantBadgeIndex, ...subscriberBadgeIndex, ...predictionBadgeIndex };

function getBadge(config: Config, emotes: ChatEmotes, channel: string, key: string, index: string) {
    const [badge] = key.split(',');
    const requireSetting = badgeIndex[badge];
    if (requireSetting && config[requireSetting as ConfigKey] || !requireSetting && config.showOtherBadges) {
        return emotes.getBadge(channel, key, index);
    }
    return '';
}

interface Props {
    msg: HeheChatMessage;
    hideHeheBadges?: boolean;
}

export function ChatMessageBrowserSource({ msg, hideHeheBadges }: Props) {
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
                {Object.entries(msg.userInfo.badges).map((entry, index) => getBadge(config, emotes, channel, entry.join(','), index.toString()))}
                {config.show7TVCosmetics && cosmetics?.badge && (
                    <SevenTVBadgeComponent key="seventv-badge" badge={cosmetics.badge} size={config.fontSize} />
                )}
                {!hideHeheBadges && (
                    msg.userInfo.isHeheAdmin
                        ? <img alt="HeheChat Admin" src="/hehebadge_admin.webp" />
                        : msg.userInfo.isHehePro
                        ? <img alt="HeheChat Pro" src="/hehebadge.webp" />
                        : null
                )}
            </span>
            {config.chatBsShowUsername !== false && (
                <>
                    <span
                        ref={config.show7TVCosmetics ? usernameRef : undefined}
                        className={classes.username}
                        style={config.show7TVCosmetics && hasCosmetics ? {} : { color: adjustedColor }}
                    >
                        {msg.userInfo.displayName}
                    </span>
                    <span>: </span>
                </>
            )}
            <span className={classes.text}>{parsedPartsToHtml(msg.parts || [], channel, msg.msgType === 'power_ups_gigantified_emote', config, emotes, login)}</span>
        </div>
    );
}
