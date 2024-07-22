import { ChatMessage, toChannelName } from "@twurple/chat";
import { OverlayDrawer } from '../../../pages/Chat.page'
import { Fieldset, TextInput, Button, Group, Modal } from '@mantine/core';
import { useState } from "react";
import { GradientSegmentedControl } from "@/components/commons/GradientSegmentedControl/GradientSegmentedControl";
import { formatDuration } from "@/components/commons";


export const ModDrawer: OverlayDrawer = {
    name: 'mod',
    component: ModView,
    size: 'md',
    position: 'bottom'
}

export function ModView(props: { msg: ChatMessage }) {
    return <><h1>MODS</h1><span>{props.msg.text}</span></>
}

const durations = [60, 600, 3600, 86400, 604800];

export function TimeoutView(props: {
    userId: string,
    userName: string,
    channelId: string,
    channelName: string,
    timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void,
    close: () => void;
}) {
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState<number>(600);

    return (
        <Modal opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={["Timeout", props.userName, "in", props.channelName].join(" ")}>
                <Group justify="center">
                    <GradientSegmentedControl data={durations.map(x => ({label: formatDuration(x * 1000), value: (x * 1000).toString()}))} value={(duration * 1000).toString()} setValue={(v: string) => { setDuration(parseInt(v) / 1000) }}></GradientSegmentedControl>
                </Group>
                <TextInput label="Reason" placeholder="Optional: Why?" value={reason} onChange={(ev) => setReason(ev.target.value)} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' onClick={() => {
                        props.timeoutUser(props.channelId, props.userId, duration, reason);
                        props.close();
                    }}>Timeout</Button>
                </Group>
            </Fieldset>
        </Modal>);
}

export function BanView(props: {
    userId: string,
    userName: string,
    channelId: string,
    channelName: string,
    banUser: (channelId: string, userId: string, reason: string) => void,
    close: () => void;
}) {
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState<number>(600);

    return (
        <Modal opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={["Ban", props.userName, "in", props.channelName].join(" ")}>
                <TextInput label="Reason" placeholder="Optional: Why?" value={reason} onChange={(ev) => setReason(ev.target.value)} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' onClick={() => {
                        props.banUser(props.channelId, props.userId, reason);
                        props.close();
                    }}>Ban</Button>
                </Group>
            </Fieldset>
        </Modal>);
}