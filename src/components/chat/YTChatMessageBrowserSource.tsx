import classes from './ChatMessageBrowserSource.module.css';
import { ConfigContext } from '../../ApplicationContext';
import { memo, useContext } from 'react';
import { YTChatMessage, YTMessagePart } from '../../commons/message';
import { IconBrandYoutube, IconShieldCheckFilled, IconCrown, IconShieldFilled } from '@tabler/icons-react';

function renderParts(parts: YTMessagePart[], fontSize: number) {
    return parts.map((part, i) => {
        if (part.type === 'emoji') {
            return <img key={i} src={part.url} alt={part.alt} style={{ height: fontSize * 1.4, width: 'auto', verticalAlign: 'middle', margin: '0 1px' }} />;
        }
        return <span key={i}>{part.content}</span>;
    });
}

interface Props {
    msg: YTChatMessage;
}

export const YTChatMessageBrowserSource = memo(function YTChatMessageBrowserSource({ msg }: Props) {
    const config = useContext(ConfigContext);

    return (
        <div className={classes.msg}>
            <span className={classes.badges}>
                <IconBrandYoutube size={config.fontSize * 1.2} color="#FF0000" style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                {msg.isOwner && (
                    <IconCrown size={config.fontSize * 1.2} color="#FFD700" style={{ verticalAlign: 'middle', marginRight: '2px' }} title="Channel Owner" />
                )}
                {msg.isModerator && !msg.isOwner && (
                    <IconShieldFilled size={config.fontSize * 1.2} color="#5E84F1" style={{ verticalAlign: 'middle', marginRight: '2px' }} title="Moderator" />
                )}
                {msg.isMembership && (
                    <span style={{ fontSize: '0.75em', backgroundColor: '#0F9D58', color: 'white', padding: '2px 6px', borderRadius: '3px', marginRight: '4px', verticalAlign: 'middle', fontWeight: 'bold' }}>
                        MEMBER
                    </span>
                )}
                {msg.isVerified && (
                    <IconShieldCheckFilled size={config.fontSize * 1.2} color="#606060" style={{ verticalAlign: 'middle', marginRight: '2px' }} title="Verified" />
                )}
            </span>
            {config.chatBsShowUsername !== false && (
                <>
                    <span
                        className={classes.username}
                        style={{ color: msg.authorColor ?? (msg.isOwner ? '#FFD600' : msg.isModerator ? '#5E84F1' : msg.isMembership ? '#2BA640' : undefined) }}
                    >
                        {msg.authorName.startsWith('@') ? msg.authorName.slice(1) : msg.authorName}
                    </span>
                    <span>: </span>
                </>
            )}
            <span className={classes.text}>
                {msg.parts && msg.parts.length > 0 ? renderParts(msg.parts, config.fontSize) : msg.text}
            </span>
        </div>
    );
});
