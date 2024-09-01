import { ChatMessage } from "@twurple/chat";
import { OverlayDrawer } from '../../../pages/Chat.page'
import { Fieldset, TextInput, Button, Group, Modal, Text, Stack } from '@mantine/core';
import { useContext, useState } from "react";
import { GradientSegmentedControl } from "@/components/GradientSegmentedControl/GradientSegmentedControl";
import { formatDuration } from "@/commons/helper";
import { ChannelPicker } from "../ChannelPicker";
import { IconArrowsRight } from '@tabler/icons-react';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from "@/ApplicationContext";


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
                    <GradientSegmentedControl data={durations.map(x => ({ label: formatDuration(x * 1000), value: (x * 1000).toString() }))} value={(duration * 1000).toString()} setValue={(v: string) => { setDuration(parseInt(v) / 1000) }}></GradientSegmentedControl>
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

export function RaidView(props: {
    initialFrom?: string;
    initialTo?: string;
    raidChannel: (from: string, to: string) => void,
    close: () => void;
}) {
    const [raidFrom, setRaidFrom] = useState(props.initialFrom);
    const [raidTo, setRaidTo] = useState(props.initialTo);
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);

    return (
        <Modal opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={"Raid channel"}>
                <Group justify="space-between" mt="md">
                    <Stack align="center" w="35%">
                        <ChannelPicker channels={[login.user?.name || '']} disabled value={raidFrom} onChange={setRaidFrom} />
                        <Text>{raidFrom}</Text>
                    </Stack>

                    <IconArrowsRight />

                    <Stack align="center" w="35%">
                        <ChannelPicker channels={config.raidTargets} value={raidTo} onChange={setRaidTo} />
                        <Text>{raidTo}</Text>
                    </Stack>
                </Group>
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' disabled={!raidFrom || !raidTo} onClick={() => {
                        if (raidFrom && raidTo) {
                            const raidFromId = emotes.getChannelId(raidFrom);
                            const raidToId = emotes.getChannelId(raidTo);
                            props.raidChannel(raidFromId, raidToId);
                            props.close();
                        }
                    }}>Raid</Button>
                </Group>
            </Fieldset>
        </Modal>);
}