import { ScrollArea, Text, ThemeIcon, ActionIcon } from '@mantine/core';
import { IconBoltFilled, IconCheck, IconReload, IconTrain } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { EventStorage, EventData } from './eventstorage';
import { ConfigContext, ProfileContext } from '@/ApplicationContext';

// Import SVG logos directly
import blerpLogo from '@/res/blerp_logo.svg';
import soundalertsLogo from '@/res/soundalerts_logo.svg';
import kofiLogo from '@/res/kofi_logo.svg';
import { InfoCard, InfoCardSkeleton } from '../infocard/infocard';
import { getEventStyle } from '@/components/events/eventhelper';
import { EventType } from '@/commons/events';
import { AlertSystem } from '@/components/alerts/alertplayer';
import { Dictionary } from 'underscore';
import { useForceUpdate } from '@mantine/hooks';
import { IconGiftFilled, IconCoinBitcoinFilled, IconUserHeart, IconSparkles, IconMoneybag, IconPlant, IconBellRinging, IconAffiliate, IconSpeakerphone, IconMusic } from '@tabler/icons-react';
import { formatString } from "@/commons/helper";
import { ReactElementLike } from 'prop-types';
import classes from './EventList.module.css';

function getIcon(event: EventData, key: string) {
    const style: any = {variant: 'transparent'};
    getEventStyle(event, style);
    const icon = icons[event.eventtype as EventType];
    return <ThemeIcon key={key} {...style}>{icon}</ThemeIcon>
}

const messages: Record<EventType, string> = {
    'raid': 'Raid with ${amount:whole} viewers',
    'sub_1000': 'Sub for ${amount:whole} months',
    'sub_2000': 'Sub with T2 for ${amount:whole} months',
    'sub_3000': 'Sub with T3 for ${amount:whole} months',
    'subgift_1000': 'Gifted ${amount:whole} subs',
    'subgift_2000': 'Gifted ${amount:whole} Tier 2 subs',
    'subgift_3000': 'Gifted ${amount:whole} Tier 3 subs',
    'subgiftb_1000': 'Gifted ${recipient} a sub',
    'subgiftb_2000': 'Gifted ${recipient} a Tier 2 sub',
    'subgiftb_3000': 'Gifted ${recipient} a Tier 3 sub',
    'sub_Prime': 'Sub with prime for ${amount:whole} months',
    'follow': 'Just followed',
    'cheer': 'Cheered ${amount:whole} bits',
    'donation': "Donated ${amount:decimal}${currency:currency}",
    'blerp': "Blerp ${audioTitle}",
    'soundalerts': "SoundAlert ${overlayMessage}",
    'channelPointRedemption': 'Channelpoints: ${rewardTitle}',
    'kofishop': '${username} bought something on ko-fi',
    'kofidono': '${username} donated ${amount}${currency:currency} on ko-fi',
    'kofisub': '${username} subed on ko-fi',
    'tts': '${username} triggered tts',
    'hypetrain': 'Hypetrain level ${level:whole}',
    'streak': '${username} stream streak ${amount:whole}',
}

export const icons: Record<EventType, ReactElementLike> = {
    'raid': <IconSparkles/>,
    'sub_1000': <IconGiftFilled/>,
    'sub_2000': <IconGiftFilled/>,
    'sub_3000': <IconGiftFilled/>,
    'subgift_1000': <IconGiftFilled/>,
    'subgift_2000': <IconGiftFilled/>,
    'subgift_3000': <IconGiftFilled/>,
    'subgiftb_1000': <IconGiftFilled/>,
    'subgiftb_2000': <IconGiftFilled/>,
    'subgiftb_3000': <IconGiftFilled/>,
    'sub_Prime': <IconGiftFilled/>,
    'follow': <IconUserHeart/>,
    'cheer': <IconCoinBitcoinFilled/>,
    'donation': <IconMoneybag/>,
    'blerp': <img src={blerpLogo} className="monochrome-logo" alt="Blerp" style={{ width: 18, height: 18, objectFit: 'contain' }} />,
    'soundalerts': <img src={soundalertsLogo} className="monochrome-logo" alt="SoundAlerts" style={{ width: 18, height: 18, objectFit: 'contain' }} />,
    'channelPointRedemption': <IconPlant/>,
    'kofishop': <img src={kofiLogo} className="monochrome-logo" alt="Ko-fi" style={{ width: 18, height: 18, objectFit: 'contain' }} />,
    'kofidono': <img src={kofiLogo} className="monochrome-logo" alt="Ko-fi" style={{ width: 18, height: 18, objectFit: 'contain' }} />,
    'kofisub': <img src={kofiLogo} className="monochrome-logo" alt="Ko-fi" style={{ width: 18, height: 18, objectFit: 'contain' }} />,
    'tts': <IconSpeakerphone/>,
    'hypetrain': <IconTrain/>,
    'streak': <IconBoltFilled/>,
}

export function formatEventText(event: EventData): string {
    if (!event || typeof event !== 'object') {
        return 'Invalid event data';
    }

    let additionalData = {};
    if (event.text) {
        try {
            if (typeof event.text === 'string') {
                additionalData = JSON.parse(event.text);
            } else {
                console.error('Event text is not a string:', event.text);
            }
        } catch (error) {
            console.error('Failed to parse event text:', error);
        }
    }

    const eventType = event.eventtype as EventType;
    const messageTemplate = messages[eventType];
    
    if (!messageTemplate) {
        console.warn(`Unknown event type: ${eventType}`);
        return `${event.username} triggered ${eventType}`;
    }

    return formatString(messageTemplate, {...event, ...additionalData});
}

export function EventList() {
    const config = useContext(ConfigContext);
    const profile = useContext(ProfileContext);
    const [events, setEvents] = useState<EventData[]>([]);
    const [load, setLoad] = useState(true);
    const [checkedEvents, setCheckedEvents] = useState<Dictionary<boolean>>({});
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        const ignored: string[] = Object.keys(config.hideEvents).filter(
            // @ts-ignore
            (key: string) => config.hideEvents[key]
        );
        
        EventStorage?.load(config.channels, ignored).then((events) => {
            setEvents(events);
            setLoad(false);
        });

        const eventSub = PubSub.subscribe("WS-event", (msg, event) => {
            if (!(event.eventtype in config.hideEvents && config.hideEvents[event.eventtype as keyof typeof config.hideEvents])) {
                setEvents((prevState) => {
                    return prevState.concat(event);
                });
            }
        });

        return () => {
            PubSub.unsubscribe(eventSub);
        }
    }, []);

    const replayEvent = (data: EventData) => {
        if (AlertSystem.shouldBePlayedInBrowsersource(data) && !checkedEvents[data.id]) {
            PubSub.publish('WSSEND', {type: 'replayevent', data: data, profile: profile.guid });
        } else if (AlertSystem.shouldBePlayedInApp(data) && !checkedEvents[data.id]) {
            AlertSystem.addEvent(data);
        }
        setCheckedEvents(ev => {
            ev[data.id] = true;
            return ev;
        });
        forceUpdate();
        setTimeout(() => {
            setCheckedEvents(ev => {
                ev[data.id] = false;
                forceUpdate();
                return ev;
            });
        }, 2500);
    };

    return (
        <ScrollArea className={classes.main}>
            <style>{`
                .monochrome-logo {
                    filter: brightness(0) opacity(0.65);
                    transition: all 0.2s ease;
                }
                :root[data-mantine-color-scheme="dark"] .monochrome-logo,
                [data-mantine-color-scheme="dark"] .monochrome-logo {
                    filter: brightness(0) invert(1) opacity(0.85);
                }
            `}</style>
            <div className={classes.reverse}>
                {load ? <>{[1,2,3].map(x => <InfoCardSkeleton key={'event' + x}/>)}</> : null}
                {!load && events.length === 0 ? <Text key='event-noevents' pt='xl' size='xl' ta="center" fw={500}>No Events to show.</Text> : null}
                {events.map((event, i)=> <InfoCard 
                    key={'event' + i} 
                    channel={event.channel} 
                    className={classes.event}
                    name={event.username} 
                    date={event.date} 
                    text={formatEventText(event)} 
                    left={getIcon(event, 'infocard-left')} 
                    onClick={() => replayEvent(event)} 
                    right={<ActionIcon 
                        disabled={!AlertSystem.shouldBePlayedInApp(event) && !AlertSystem.shouldBePlayedInBrowsersource(event)} 
                        variant='transparent' 
                        key={'infocard-right'}>
                            {(checkedEvents[event.id] ? <IconCheck/> : <IconReload/>)}
                    </ActionIcon>}
                />)}
            </div>
        </ScrollArea>
    );
}
