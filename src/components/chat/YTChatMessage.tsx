import classes from './ChatMessage.module.css';
import { ConfigContext, ChatEmotesContext } from '../../ApplicationContext';
import { useContext } from 'react';
import { formatTime } from '../../commons/helper';
import { YTChatMessage } from '../../commons/message';
import { IconBrandYoutube, IconShieldCheckFilled, IconCrown, IconShieldFilled } from '@tabler/icons-react';

interface YTChatMessageProps {
    msg: YTChatMessage;
    forceTimestamp?: boolean;
}

export function YTChatMessageComp(props: YTChatMessageProps) {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);

    const msgClasses = [classes.msg];
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
                <IconBrandYoutube size={config.fontSize * 1.2} color="#FF0000" style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                
                {/* Owner Badge */}
                {props.msg.isOwner && (
                    <IconCrown size={config.fontSize * 1.2} color="#FFD700" style={{ verticalAlign: 'middle', marginRight: '2px' }} title="Channel Owner" />
                )}
                
                {/* Moderator Badge */}
                {props.msg.isModerator && !props.msg.isOwner && (
                    <IconShieldFilled size={config.fontSize * 1.2} color="#5E84F1" style={{ verticalAlign: 'middle', marginRight: '2px' }} title="Moderator" />
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
                        verticalAlign: 'middle',
                        fontWeight: 'bold'
                    }}>
                        MEMBER
                    </span>
                )}
                
                {/* Verified Badge */}
                {props.msg.isVerified && (
                    <IconShieldCheckFilled size={config.fontSize * 1.2} color="#606060" style={{ verticalAlign: 'middle', marginRight: '2px' }} title="Verified" />
                )}
            </span>
            
            {/* Username */}
            <span 
                className={classes.username} 
                style={{ color: '#FF0000' }}
            >
                {props.msg.authorName}
            </span>
            <span>: </span>
            
            {/* Message Text */}
            <span className={classes.text}>{props.msg.text}</span>
        </div>
    );
}
