import { Stack, Badge } from "@mantine/core";
import { useDisclosure, useForceUpdate } from "@mantine/hooks";
import { ReactNodeLike } from "prop-types";
import { useEffect, useState } from "react";
import { Hypetrain } from "@/components/pinned/hypetrain";
import { Prediction } from "@/components/pinned/prediction";
import { Poll } from "@/components/pinned/poll";
import { Raid } from "@/components/pinned/raid";
import { Shoutout } from "@/components/pinned/shoutout";
import PubSub from "pubsub-js";

const FINAL_STATE_DURATION = 15000; // 15 seconds in milliseconds
const RAID_DURATION = 90 * 1000; // 90 seconds in milliseconds
const SHOUTOUT_DURATION = 15 * 1000; // 15 seconds in milliseconds

export interface Pin {
    type: 'hypetrain' | 'poll' | 'prediction' | 'raid' | 'shoutout';
    id: string;
    channel: string;
    endTime: Date;
    data: any;
    remove: () => void;
    state?: 'active' | 'ended';
    finalRemoveTime?: Date;
}

function toNode(pin: Pin, onClick: (id: string) => void): ReactNodeLike {
    switch(pin.type) {
        case 'hypetrain': 
            return <Hypetrain 
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.state === 'ended' ? pin.finalRemoveTime! : pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={pin.remove}
                state={pin.state}
            />;
        case 'prediction':
            return <Prediction 
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.state === 'ended' ? pin.finalRemoveTime! : pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={pin.remove}
                state={pin.state}
            />;
        case 'poll':
            return <Poll 
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.state === 'ended' ? pin.finalRemoveTime! : pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={pin.remove}
                state={pin.state}
            />;
        case 'raid':
            return <Raid 
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={pin.remove}
            />;
        case 'shoutout':
            return <Shoutout 
                key={pin.id} 
                id={pin.id} 
                channel={pin.channel} 
                endTime={pin.endTime} 
                {...pin.data} 
                onClick={() => onClick(pin.id)} 
                remove={pin.remove}
            />;
    }
    return null;
}

export function PinManager() {
    const [pins, setPins] = useState<Pin[]>([]);
    const forceUpdate = useForceUpdate();

    const [expanded, expandHandler] = useDisclosure(false);

    useEffect(() => {
        const streamEventSub = PubSub.subscribe("WS-streamevent", (msg, data) => {
            console.log("streamevent", data);

            // Hype Train Events
            if (data.eventtype === 'hypeTrainBegin') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'hypetrain', 
                    id: d.id, 
                    channel: d.channel, 
                    endTime: new Date(Date.parse(d.expiryDate)), 
                    remove: () => removePin(d.id), 
                    data: {level: d.level, progress: d.progress, goal: d.goal},
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }
            if (data.eventtype === 'hypeTrainEnd') {
                const d = JSON.parse(data.text);
                const finalRemoveTime = new Date(Date.now() + FINAL_STATE_DURATION);
                const pin: Pin = {
                    type: 'hypetrain',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    finalRemoveTime,
                    remove: () => removePin(d.id),
                    data: {
                        level: d.level,
                        progress: 100,  // Show full progress in final state
                        goal: d.total,
                        final: true
                    },
                    state: 'ended'
                };
                upsertPin(pin);
                setTimeout(() => removePin(d.id), FINAL_STATE_DURATION);
                return;
            }
            if (data.eventtype === 'hypeTrainProgress') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'hypetrain', 
                    id: d.id, 
                    channel: d.channel, 
                    endTime: new Date(Date.parse(d.expiryDate)), 
                    remove: () => removePin(d.id), 
                    data: {level: d.level, progress: d.progress, goal: d.goal},
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }

            // Prediction Events
            if (data.eventtype === 'predictionBegin') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'prediction',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    remove: () => removePin(d.id),
                    data: {
                        title: d.title || 'Prediction',
                        outcomes: d.outcomes,
                    },
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }
            if (data.eventtype === 'predictionEnd') {
                const d = JSON.parse(data.text);
                const finalRemoveTime = new Date(Date.now() + FINAL_STATE_DURATION);
                const pin: Pin = {
                    type: 'prediction',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    finalRemoveTime,
                    remove: () => removePin(d.id),
                    data: {
                        title: d.title || 'Prediction',
                        outcomes: d.outcomes,
                        winningOutcome: d.winningOutcome,
                        final: true
                    },
                    state: 'ended'
                };
                upsertPin(pin);
                setTimeout(() => removePin(d.id), FINAL_STATE_DURATION);
                return;
            }
            if (data.eventtype === 'predictionProgress') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'prediction',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    remove: () => removePin(d.id),
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
            if (data.eventtype === 'pollBegin') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'poll',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    remove: () => removePin(d.id),
                    data: {
                        title: d.title || d.question,
                        options: d.choices,
                    },
                    state: 'active'
                };
                upsertPin(pin);
                return;
            }
            if (data.eventtype === 'pollEnd') {
                const d = JSON.parse(data.text);
                const finalRemoveTime = new Date(Date.now() + FINAL_STATE_DURATION);
                const pin: Pin = {
                    type: 'poll',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    finalRemoveTime,
                    remove: () => removePin(d.id),
                    data: {
                        title: d.title || d.question,
                        options: d.choices,
                        winningChoice: d.winningChoice,
                        final: true
                    },
                    state: 'ended'
                };
                upsertPin(pin);
                setTimeout(() => removePin(d.id), FINAL_STATE_DURATION);
                return;
            }
            if (data.eventtype === 'pollProgress') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'poll',
                    id: d.id,
                    channel: d.channel,
                    endTime: new Date(Date.parse(d.endDate)),
                    remove: () => removePin(d.id),
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
            if (data.eventtype === 'raidTo') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'raid',
                    id: `raid-${Date.now()}`,
                    channel: d.broadcasterName,
                    endTime: new Date(Date.now() + RAID_DURATION),
                    remove: () => removePin(`raid-${Date.now()}`),
                    data: {
                        broadcasterName: d.broadcasterName,
                        targetChannelName: d.targetChannelName,
                        viewers: d.viewers
                    }
                };
                upsertPin(pin);
                return;
            }

            // Shoutout Events
            if (data.eventtype === 'shoutoutCreate') {
                const d = JSON.parse(data.text);
                const pin: Pin = {
                    type: 'shoutout',
                    id: `shoutout-${Date.now()}`,
                    channel: d.broadcasterName,
                    endTime: new Date(Date.now() + SHOUTOUT_DURATION),
                    remove: () => removePin(`shoutout-${Date.now()}`),
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
                newPins[index] = newPin;
            } else {
                newPins.unshift(newPin);
            }
            return newPins;
        });
        forceUpdate();
    }

    if (!pins.length) {
        return null;
    }

    return (expanded ? 
        <PinExpandedView pins={pins} selectPin={selectPin}/> : 
        <PinCollapsedView pin={pins[0]} more={pins.length > 1} expand={expandHandler.open}/>
    );
}

interface PinExpandedViewProps {
    pins: Pin[];
    selectPin: (id: string) => void;
}

function PinExpandedView(props: PinExpandedViewProps) {
    return (
        <Stack gap="xs">
            {props.pins.map((p) => toNode(p, props.selectPin))}
        </Stack>
    )
}

interface PinCollapsedViewProps {
    pin: Pin;
    more: boolean;
    expand: () => void;
}

function PinCollapsedView(props: PinCollapsedViewProps) {
    return (
        <Stack gap="xs">
            {toNode(props.pin, props.expand)}
            {props.more ? 
                <Badge 
                    key="badge-more" 
                    size="lg" 
                    color="primary" 
                    onClick={props.expand} 
                    m="0 auto"
                >
                    More
                </Badge> : 
                null
            }
        </Stack>
    )
}