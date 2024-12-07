import { Stack, Badge } from "@mantine/core";
import { useDisclosure, useForceUpdate } from "@mantine/hooks";
import { ReactNodeLike } from "prop-types";
import { useEffect, useState } from "react";
import { Hypetrain } from "@/components/pinned/hypetrain";
import { Prediction } from "@/components/pinned/prediction";
import { Poll } from "@/components/pinned/poll";
import { Raid } from "@/components/pinned/raid";
import { Shoutout } from "@/components/pinned/shoutout";
import { AdBreak } from "@/components/pinned/adbreak";
import PubSub from "pubsub-js";
import { useContext } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { generateGUID } from "@/commons/helper";

const FINAL_STATE_DURATION = 15000; // 15 seconds in milliseconds
const RAID_DURATION = 90 * 1000; // 90 seconds in milliseconds
const SHOUTOUT_DURATION = 15 * 1000; // 15 seconds in milliseconds

export interface PinProps extends Pin {
    remove: () => void;
    onClick: () => void;
    hide: () => void;
    toggleExpand: () => void;
    pinsExpanded: boolean;
}

export interface Pin {
    type: 'hypetrain' | 'poll' | 'prediction' | 'raid' | 'shoutout' | 'adbreak';
    id: string;
    channel: string;
    endTime: Date;
    data: any;
    
    state?: 'active' | 'ended';
    finalRemoveTime?: Date;
    expanded: boolean;
    hidden: boolean;
}

const toNode = (pin: Pin, onClick: (id: string) => void, removePin: (id: string) => void, hidePin: (id: string) => void, toggleExpand: (id: string) => void, pinsExpanded: boolean): ReactNodeLike => {
    switch(pin.type) {
        case 'hypetrain': 
            return <Hypetrain 
                pinsExpanded={pinsExpanded}
                expanded={pin.expanded}
                hidden={pin.hidden}
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.state === 'ended' ? pin.finalRemoveTime! : pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={() => removePin(pin.id)} 
                hide={() => hidePin(pin.id)} 
                toggleExpand={() => toggleExpand(pin.id)} 
                state={pin.state}
            />;
        case 'prediction':
            return <Prediction 
                pinsExpanded={pinsExpanded}
                expanded={pin.expanded}
                hidden={pin.hidden}
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.state === 'ended' ? pin.finalRemoveTime! : pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={() => removePin(pin.id)} 
                hide={() => hidePin(pin.id)} 
                toggleExpand={() => toggleExpand(pin.id)} 
                state={pin.state}
            />;
        case 'poll':
            return <Poll 
                pinsExpanded={pinsExpanded}
                expanded={pin.expanded}
                hidden={pin.hidden}
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.state === 'ended' ? pin.finalRemoveTime! : pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={() => removePin(pin.id)} 
                hide={() => hidePin(pin.id)} 
                toggleExpand={() => toggleExpand(pin.id)} 
                state={pin.state}
            />;
        case 'raid':
            return <Raid 
                pinsExpanded={pinsExpanded}
                expanded={pin.expanded}
                hidden={pin.hidden}
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={() => removePin(pin.id)} 
                hide={() => hidePin(pin.id)} 
                toggleExpand={() => toggleExpand(pin.id)} 
            />;
        case 'shoutout':
            return <Shoutout 
                pinsExpanded={pinsExpanded}
                expanded={pin.expanded}
                hidden={pin.hidden}
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={() => removePin(pin.id)} 
                hide={() => hidePin(pin.id)} 
                toggleExpand={() => toggleExpand(pin.id)} 
            />;
        case 'adbreak':
            return <AdBreak 
                pinsExpanded={pinsExpanded}
                expanded={pin.expanded}
                hidden={pin.hidden}
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={() => removePin(pin.id)} 
                hide={() => hidePin(pin.id)} 
                toggleExpand={() => toggleExpand(pin.id)} 
            />;
    }
    return null;
}

export function PinManager() {
    const config = useContext(ConfigContext);
    const [pinsExpanded, expandHandler] = useDisclosure(false);
    const [pins, setPins] = useState<Pin[]>([
    //    {expanded: true, hidden: false, type: 'adbreak', id: '1', endTime: new Date(Date.now() + 5*1000*60), channel: 'ronnyberger', data: {onClick: () => {}}},
    //    {expanded: true, hidden: false, type: 'shoutout', id: '5', endTime: new Date(Date.now() + 5*1000*60), channel: 'ronnyberger', data: {    broadcasterName: 'ronnyberger', targetUserName: 'jonsman', viewerCount: 1224,moderatorName: 'nofuture2077'}},
    //    {expanded: true, hidden: false, type: 'hypetrain', id: '4', endTime: new Date(Date.now() + 5*1000*60), channel: 'ronnyberger', data: {level: 7, progress: 2323, goal: 4356, state: 'active'}},
    //    {expanded: false, hidden: false, type: 'poll', id: '6', endTime: new Date(Date.now() + 5*1000*60), channel: 'ronnyberger', data: {title: 'was esst ihr lieber?', winningChoice: {title: 'Nutella', totalVotes: 43}, options: [{title: 'Nutella', totalVotes: 43}, {title: 'Marmelade', totalVotes: 7}], state: 'ended'}},
    //    {expanded: false, hidden: false, type: 'prediction', id: '7', endTime: new Date(Date.now() + 5*1000*60), channel: 'ronnyberger', data: {title: 'was esst ihr lieber?', winningOutcomes: {title: 'Nutella', channelPoints: 31343, users: 23}, outcomes: [{title: 'Nutella', channelPoints: 31343, users: 23}, {title: 'Marmelande', channelPoints: 23132, users: 12}, {title: 'Obst', channelPoints: 2222, users: 1}], state: 'active'}},
    //    {expanded: true, hidden: false, type: 'raid', id: '8', endTime: new Date(Date.now() + 5*1000*60), channel: 'ronnyberger', data: { broadcasterName: 'z0kka', targetChannelName: 'ronnyberger', viewers: 1242}},
    ]);
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        const streamEventSub = PubSub.subscribe("WS-streamevent", (msg, data) => {
            console.log("streamevent", data);

            // Hype Train Events
            if (data.eventtype === 'hypeTrainBegin' && !config.hideHypetrain) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: true,
                    hidden: false,
                    type: 'hypetrain', 
                    id: d.id, 
                    channel: d.channel, 
                    endTime: new Date(Date.parse(d.expiryDate)), 
                    data: {level: d.level, progress: d.progress, goal: d.goal},
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }
            if (data.eventtype === 'hypeTrainEnd' && !config.hideHypetrain) {
                const d = JSON.parse(data.text);
                const finalRemoveTime = new Date(Date.now() + FINAL_STATE_DURATION);
                const pin: Pin = {
                    expanded: true,
                    hidden: false,
                    type: 'hypetrain',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    finalRemoveTime,
                    data: {
                        level: d.level,
                        progress: 100,  // Show full progress in final state
                        goal: d.total
                    },
                    state: 'ended'
                };
                upsertPin(pin);
                setTimeout(() => removePin(d.id), FINAL_STATE_DURATION);
                return;
            }
            if (data.eventtype === 'hypeTrainProgress' && !config.hideHypetrain) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: true,
                    hidden: false,
                    type: 'hypetrain', 
                    id: d.id, 
                    channel: d.channel, 
                    endTime: new Date(Date.parse(d.expiryDate)), 
                    data: {level: d.level, progress: d.progress, goal: d.goal},
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }

            // Prediction Events
            if (data.eventtype === 'predictionBegin' && !config.hidePrediction) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: false,
                    hidden: false,
                    type: 'prediction',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.lockDate)),
                    data: {
                        title: d.title || 'Prediction',
                        outcomes: d.outcomes,
                    },
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }
            if (data.eventtype === 'predictionEnd' && !config.hidePrediction) {
                const d = JSON.parse(data.text);
                const finalRemoveTime = new Date(Date.now() + FINAL_STATE_DURATION);
                const pin: Pin = {
                    expanded: false,
                    hidden: false,
                    type: 'prediction',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    finalRemoveTime,
                    data: {
                        title: d.title || 'Prediction',
                        outcomes: d.outcomes,
                        winningOutcome: d.winningOutcome
                    },
                    state: 'ended'
                };
                upsertPin(pin);
                setTimeout(() => removePin(d.id), FINAL_STATE_DURATION);
                return;
            }
            if (data.eventtype === 'predictionLock' && !config.hidePrediction) {
                const d = JSON.parse(data.text);
                const finalRemoveTime = new Date(Date.now() + FINAL_STATE_DURATION);
                const pin: Pin = {
                    expanded: false,
                    hidden: false,
                    type: 'prediction',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    finalRemoveTime,
                    data: {
                        title: d.title || 'Prediction',
                        outcomes: d.outcomes
                    },
                    state: 'ended'
                };
                upsertPin(pin);
                setTimeout(() => removePin(d.id), FINAL_STATE_DURATION);
                return;
            }
            if (data.eventtype === 'predictionProgress' && !config.hidePrediction) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: false,
                    hidden: false,
                    type: 'prediction',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.lockDate)),
                    data: {
                        title: d.title || 'Prediction',
                        outcomes: d.outcomes,
                    },
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }

            // Poll Events
            if (data.eventtype === 'pollBegin' && !config.hidePoll) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: false,
                    hidden: false,
                    type: 'poll',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    data: {
                        title: d.title || d.question,
                        options: d.choices,
                    },
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }
            if (data.eventtype === 'pollEnd' && !config.hidePoll) {
                const d = JSON.parse(data.text);
                const finalRemoveTime = new Date(Date.now() + FINAL_STATE_DURATION);
                const pin: Pin = {
                    expanded: false,
                    hidden: false,
                    type: 'poll',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    finalRemoveTime,
                    data: {
                        title: d.title || d.question,
                        options: d.choices,
                        winningChoice: d.winningChoice
                    },
                    state: 'ended'
                };
                upsertPin(pin);
                setTimeout(() => removePin(d.id), FINAL_STATE_DURATION);
                return;
            }
            if (data.eventtype === 'pollProgress' && !config.hidePoll) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: false,
                    hidden: false,
                    type: 'poll',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    data: {
                        title: d.title || d.question,
                        options: d.choices,
                    },
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }

            // Raid Events
            if (data.eventtype === 'raidStart' && !config.hideRaid) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: true,
                    hidden: false,
                    type: 'raid',
                    id: generateGUID(),
                    channel: d.broadcasterName,
                    endTime: new Date(Date.now() + RAID_DURATION),
                    data: {
                        broadcasterName: d.broadcasterName,
                        targetChannelName: d.targetChannelName,
                        viewers: d.viewers
                    }
                };
                upsertPin(pin);
                return;
            }

            if (data.eventtype === 'raidCancel') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: true,
                    hidden: true,
                    type: 'raid',
                    id: generateGUID(),
                    channel: d.broadcasterName,
                    endTime: new Date(Date.now() + 0),
                    data: {
                        broadcasterName: d.broadcasterName,
                        targetChannelName: d.targetChannelName,
                        viewers: 0
                    }
                };
                upsertPin(pin);
                return;
            }

            // Shoutout Events
            if (data.eventtype === 'shoutoutCreate' && !config.hideShoutout) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: true,
                    hidden: false,
                    type: 'shoutout',
                    id: generateGUID(),
                    channel: d.broadcasterName,
                    endTime: new Date(Date.now() + SHOUTOUT_DURATION),
                    data: {
                        broadcasterName: d.broadcasterName,
                        targetUserName: d.targetUserName,
                        viewerCount: d.viewerCount,
                        moderatorName: d.moderatorName
                    }
                };
                upsertPin(pin);
                return;
            }

            if (data.eventtype === 'adBreak' && !config.hideAdBreak) {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    expanded: true,
                    hidden: false,
                    type: 'adbreak',
                    id: generateGUID(),
                    channel: d.broadcasterName,
                    endTime: new Date(Date.now() + d.durationSeconds * 1000),
                    data: {}
                };
                upsertPin(pin);
                return;
            }
        });

        return () => {
            PubSub.unsubscribe(streamEventSub);
        }
    }, []);

    const selectPin = (id: string) => {
        setPins(pins => {
            const index = pins.findIndex(pin => pin.id === id);
  
            if (index > -1) {
              const [pin] = pins.splice(index, 1);
              pins.unshift(pin);
            }
            expandHandler.close();
            return [...pins];
        })
    };

    const hidePin = (id: string) => {
        setPins(pins => {
            const index = pins.findIndex(pin => pin.id === id);
  
            if (index > -1) {
              const pin = pins[index];
              pin.hidden = true;
            }
            return [...pins];
        })
    };

    const toggleExpand = (id: string) => {
        setPins(pins => {
            const index = pins.findIndex(pin => pin.id === id);

            if (index > -1) {
              const pin = pins[index];
              pin.expanded = !pin.expanded;
            }
            return [...pins];
        })
    };

    const removePin = (id: string): void => {
        setPins(pins => {
            const index = pins.findIndex(pin => pin.id === id);
      
            if (index > -1) {
              const newPins = [...pins];
              newPins.splice(index, 1);
              return newPins;
            }
            return pins;
        });
    }

    const upsertPin = (newPin: Pin): void => {
        setPins((pins) => {
            const newPins = [...pins];
            const index = newPins.findIndex(pin => pin.type === newPin.type && pin.channel === newPin.channel);
    
            if (index !== -1) {
                newPin.hidden = newPins[index].hidden;
                newPin.expanded = newPins[index].expanded;
                newPins[index] = newPin;
            } else {
                newPins.unshift(newPin);
            }
            return newPins;
        });
        forceUpdate();
    }

    const visiblePins = pins.filter(x => !x.hidden);

    if (!visiblePins.length) {
        return null;
    }

    return (pinsExpanded ? 
        <PinExpandedView pins={visiblePins} selectPin={selectPin} removePin={removePin} hidePin={hidePin} toggleExpand={toggleExpand}/> : 
        <PinCollapsedView pin={visiblePins[0]} more={visiblePins.length - 1} expand={expandHandler.open} removePin={removePin} hidePin={hidePin} toggleExpand={toggleExpand}/>
    );
}

interface PinExpandedViewProps {
    pins: Pin[];
    selectPin: (id: string) => void;
    removePin: (id: string) => void;
    hidePin: (id: string) => void;
    toggleExpand: (id: string) => void;
}

function PinExpandedView(props: PinExpandedViewProps) {
    return (
        <Stack gap="xs">
            {props.pins.map((p) => toNode(p, props.selectPin, props.removePin, props.hidePin, props.toggleExpand, true))}
        </Stack>
    )
}

interface PinCollapsedViewProps {
    pin: Pin;
    more: number;
    expand: () => void;
    removePin: (id: string) => void;
    hidePin: (id: string) => void;
    toggleExpand: (id: string) => void;
}

function PinCollapsedView(props: PinCollapsedViewProps) {
    return (
        <Stack gap="xs">
            {toNode(props.pin, props.expand, props.removePin, props.hidePin, props.toggleExpand, false)}
            {props.more ? 
                <Badge 
                    key="badge-more" 
                    size="lg" 
                    p="pl"
                    color="grape" 
                    onClick={props.expand} 
                    style={{cursor: 'pointer'}}
                    m="0 auto"
                >
                   {props.more} More
                </Badge> : 
                null
            }
        </Stack>
    )
}