import { Stack, Badge } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ReactNodeLike } from "prop-types";
import { useEffect, useState } from "react";
import { Hypetrain } from "./hypetrain";
import PubSub from "pubsub-js";

interface Pin {
    type: 'hypetrain';
    id: string;
    channel: string;
    endTime: Date;
    data: any;
    remove: () => void;
}

function toNode(pin: Pin, onClick: (id: string) => void): ReactNodeLike {
    switch(pin.type) {
        case 'hypetrain': return <Hypetrain key={pin.id} id={pin.id} channel={pin.channel} endTime={pin.endTime} {...pin.data} onClick={() => onClick(pin.id)} remove={pin.remove}/>;
    }
    return null;
}

export function PinManager() {
    const [pins, setPins] = useState<Pin[]>([]);

    const [expanded, expandHandler] = useDisclosure(false);
    useEffect(() => {
        // upsertPin({type: 'hypetrain', id: '124', channel: 'ronnyberger', endTime: new Date(new Date().getTime() +4* 60 * 1000), remove: () => removePin('124'), data: {level: 12, progress: 432, goal: 3443}});

        const streamEventSub = PubSub.subscribe("WS-streamevent", (msg, data) => {
            console.log("streamevent", data);

            if (data.type === 'hypeTrainBegin') {
                const d = JSON.parse(data.data.text);
                const pin: Pin = {type: 'hypetrain', id: d.id, channel: d.channel, endTime: new Date(Date.parse(d.expiryDate)), remove: () => removePin(d.id), data: {level: d.level, progress: d.progress, goal: d.goal}};
                upsertPin(pin);
                return;
            }
            if (data.type === 'hypeTrainEnd') {
                const d = JSON.parse(data.data.text);
                removePin(d.id);
                return;
            }
            if (data.type === 'hypeTrainProgress') {
                const d = JSON.parse(data.data.text);
                const pin: Pin = {type: 'hypetrain', id: d.id, channel: d.channel, endTime: new Date(Date.parse(d.expiryDate)), remove: () => removePin(d.id), data: {level: d.level, progress: d.progress, goal: d.goal}};
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
            return pins;
        })
    };

    const removePin = (id: string): void => {
        setPins(pins => {
            const index = pins.findIndex(pin => pin.id === id);
      
            if (index > -1) {
              pins.splice(index, 1);
            }
            return pins;
        });
    }

    const upsertPin = (newPin: Pin): void => {
        setPins((pins) => {
            const index = pins.findIndex(pin => pin.type === newPin.type && pin.channel === newPin.channel);
    
            if (index !== -1) {
                pins[index] = newPin;
            } else {
                pins.unshift(newPin);
            }
            return pins;
        });
    }

    if (!pins.length) {
        return null;
    }

    return (expanded ? <PinExpandedView pins={pins} selectPin={selectPin}/> : <PinCollapsedView pin={pins[0]} more={pins.length > 1} expand={expandHandler.open}/>);
}

interface PinExpandedViewProps {
    pins: Pin[];
    selectPin: (id: string) => void;
}

function PinExpandedView(props: PinExpandedViewProps) {
    return (<Stack gap="xs">
            {props.pins.map((p) => toNode(p, props.selectPin))}
        </Stack>)
}

interface PinCollapsedViewProps {
    pin: Pin;
    more: boolean;
    expand: () => void;
}


function PinCollapsedView(props: PinCollapsedViewProps) {
    return (<Stack gap="xs">
            {toNode(props.pin, props.expand)}
            {props.more ? <Badge key="badge-more" size="lg" color="primary" onClick={props.expand} m="0 auto">More</Badge> : null }
        </Stack>)
}