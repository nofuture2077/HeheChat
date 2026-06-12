import classes from './ChatMessage.module.css';
import { ConfigContext, ChatEmotesContext } from '../../ApplicationContext';
import { useContext } from 'react';
import { formatTime } from '../../commons/helper';
import { YTChatMessage, YTMessagePart } from '../../commons/message';
import { IconBrandYoutube, IconShieldCheckFilled, IconCrown, IconShieldFilled } from '@tabler/icons-react';

interface YTChatMessageProps {
    msg: YTChatMessage;
    forceTimestamp?: boolean;
}

function renderParts(parts: YTMessagePart[], fontSize: number) {
    return parts.map((part, i) => {
        if (part.type === 'emoji') {
            return <img key={i} src={part.url} alt={part.alt} style={{ height: fontSize * 1.4, width: 'auto', verticalAlign: 'middle', margin: '0 1px' }} />;
        }
        return <span key={i}>{part.content}</span>;
    });
}

export function YTChatMessageComp(props: YTChatMessageProps) {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);

    const msgClasses = [classes.msg];
    config.compactMode && msgClasses.push(classes.compact);
    const channelName = props.msg.target.substring(1);

    return (
        <div className={msgClasses.join(' ')}>
            {/* YouTube Logo als Channel-Indikator */}
            {config.showProfilePicture ? <span className={classes.channel}>{emotes.getLogo(channelName)}</span> : null}

            {/* Timestamp */}
            {config.showTimestamp || props.forceTimestamp ? (
                <span key='timestamp' className={classes.time}>{formatTime(props.msg.date)}</span>
            ) : null}

            {/* Badges */}
            <span className={classes.badges}>

                {/* YouTube-Icon Badge */}
                <IconBrandYoutube color="#FF0000" />
                
                {/* Owner Badge */}
                {props.msg.isOwner && (
                    <IconCrown size={config.fontSize * 1.2} color="#FFD700" title="Channel Owner" />
                )}
                
                {/* Moderator Badge */}
                {props.msg.isModerator && !props.msg.isOwner && (
                    <IconShieldFilled color="#5E84F1" title="Moderator" />
                )}
                
                {/* Membership Badge */}
                {props.msg.isMembership && (
                    <span style={{ 
                        fontSize: '0.75em', 
                        backgroundColor: '#0F9D58', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '3px',
                        marginRight: '4px',
                        fontWeight: 'bold'
                    }}>
                        MEMBER
                    </span>
                )}
                
                {/* Verified Badge */}
                {props.msg.isVerified && (
                    <IconShieldCheckFilled size={config.fontSize * 1.2} color="#606060" title="Verified" />
                )}
            </span>
            
            {/* Username */}
            <span
                className={classes.username}
                style={{ color: props.msg.authorColor ?? (props.msg.isOwner ? '#FFD600' : props.msg.isModerator ? '#5E84F1' : props.msg.isMembership ? '#2BA640' : undefined) }}
            >
                {props.msg.authorName.startsWith('@') ? props.msg.authorName.slice(1) : props.msg.authorName}
            </span>
            <span>: </span>

            {/* Message Text */}
            <span className={classes.text}>
                {props.msg.parts && props.msg.parts.length > 0
                    ? renderParts(props.msg.parts, config.fontSize)
                    : props.msg.text}
            </span>
        </div>
    );
}
