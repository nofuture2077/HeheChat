import { GradientSegmentedControl } from '../../GradientSegmentedControl/GradientSegmentedControl';
import { useContext, useEffect, useState } from "react";
import { Avatar, Button, TextInput, Group, Modal, Text, Stack, Fieldset, Badge } from '@mantine/core';
import { IconArrowsRight } from '@tabler/icons-react';
import { OverlayDrawer } from '../../../pages/Chat.page';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from '../../../ApplicationContext';
import { HeheChatMessage, parseMessage } from '../../../commons/message';
import { getUserInfo, ModActions } from './modactions';
import styles from './modview.module.css';
import { formatTime, formatDate, formatDuration } from '../../../commons/helper';
import { ChannelPicker } from '../ChannelPicker';
import { ChatMessageComp } from '../ChatMessage';

export const ModDrawer: OverlayDrawer = {
    name: 'mod',
    component: ModView,
    size: 'xl',
    position: 'bottom'
}

export interface ModViewProps {
    msg: HeheChatMessage;
    modActions: ModActions;
}

export function ModView(props: ModViewProps) {
    const channel = props.msg.target.slice(1);
    const channelId = props.msg.channelId;
    const username = props.msg.userInfo.userName;
    const userDisplayName = props.msg.userInfo.displayName;
    const [userInfo, setUserInfo] = useState<any>(undefined);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const login = useContext(LoginContextContext);

    useEffect(() => {
        getUserInfo(channel, username).then((info) => {
            setUserInfo(info);
        })
    }, [channel, username]);

    const isBroadcaster = login.user?.name === channel;
    const isTargetMod = userInfo?.user?.mod;
    const isTargetVIP = userInfo?.user?.vip;
    const isTargetBroadcaster = username === channel;
    const canTimeout = (isBroadcaster && !isTargetBroadcaster) || (!isBroadcaster && !isTargetMod && !isTargetBroadcaster);
    const canModifyRoles = isBroadcaster && !isTargetBroadcaster;

    const modActions: ModActions = {
        deleteMessage: () => {},
        timeoutUser: () => {},
        banUser: () => {},
        unbanUser: () => {},
        shoutoutUser: () => {},
        raidUser: () => {},
        modUser: () => {},
        unmodUser: () => {},
        vipUser: () => {},
        unvipUser: () => {}
    };

    return (
        <div className={styles.container}>
            <div className={styles.userInfo}>
                <div className={styles.userHeader}>
                    <Avatar
                        src={userInfo?.user?.profile_image_url}
                        size={80}
                        radius={80}
                        className={styles.avatar}
                    />
                    <div className={styles.userDetails}>
                        <Group>
                            <h2>{userDisplayName}</h2>
                            {isTargetBroadcaster && <Badge color="violet">Broadcaster</Badge>}
                            {isTargetMod && <Badge color="green">Mod</Badge>}
                            {isTargetVIP && <Badge color="blue">VIP</Badge>}
                        </Group>
                        <p className={styles.username}>@{username}</p>
                        <p className={styles.createdAt}>
                            Account created on {userInfo?.user?.created_at ? formatDate(new Date(userInfo.user.created_at)) : ''}
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.messages}>
                {(userInfo?.messages || []).map((msg:any) => msg.message).map((rawLine:string) => {
                    const msg = parseMessage(rawLine) as HeheChatMessage;
                    return (<ChatMessageComp 
                        msg={msg}
                        deletedMessages={{}}
                        moderatedChannel={{}}
                        setReplyMsg={() => {}}
                        hideReply={true}
                        openModView={() => {}}
                        modActions={modActions}
                    />);
                })}
            </div>

            {canTimeout && (
                <Stack className={styles.actions}>
                    <Button variant="default" size="sm" onClick={() => setShowTimeoutModal(true)}>Timeout</Button>
                    <Button color="red" size="sm" onClick={() => setShowBanModal(true)}>Ban</Button>
                    {userInfo?.user?.banned && (
                        <Button color="green" size="sm" onClick={() => props.modActions.unbanUser(channelId, userInfo.user.id)}>
                            Unban
                        </Button>
                    )}
                    {canModifyRoles && (
                        <>
                            {!isTargetMod && !isTargetVIP && (
                                <Group grow>
                                    <Button color="green" size="sm" onClick={() => props.modActions.modUser(channelId, userInfo.user.id)}>
                                        Make Mod
                                    </Button>
                                    <Button color="blue" size="sm" onClick={() => props.modActions.vipUser(channelId, userInfo.user.id)}>
                                        Make VIP
                                    </Button>
                                </Group>
                            )}
                            {isTargetMod && (
                                <Button color="orange" size="sm" onClick={() => props.modActions.unmodUser(channelId, userInfo.user.id)}>
                                    Remove Mod
                                </Button>
                            )}
                            {isTargetVIP && (
                                <Button color="orange" size="sm" onClick={() => props.modActions.unvipUser(channelId, userInfo.user.id)}>
                                    Remove VIP
                                </Button>
                            )}
                        </>
                    )}
                </Stack>
            )}

            {showTimeoutModal && (
                <TimeoutView
                    userId={userInfo?.user?.id}
                    userName={username}
                    channelId={channelId}
                    channelName={channel}
                    timeoutUser={props.modActions.timeoutUser}
                    close={() => setShowTimeoutModal(false)}
                />
            )}

            {showBanModal && (
                <BanView
                    userId={userInfo?.user?.id}
                    userName={username}
                    channelId={channelId}
                    channelName={channel}
                    banUser={props.modActions.banUser}
                    close={() => setShowBanModal(false)}
                />
            )}
        </div>
    );
}

const durations = [60, 600, 3600, 86400, 604800];
export function TimeoutView(props: {
    userId: string,
    userName: string,
    channelId: string,
    channelName: string,
    timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void,
    close: () => void;
}): JSX.Element {
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState<number>(600);

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
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
        </Modal>
    );
}

export function BanView(props: {
    userId: string,
    userName: string,
    channelId: string,
    channelName: string,
    banUser: (channelId: string, userId: string, reason: string) => void,
    close: () => void;
}): JSX.Element {
    const [reason, setReason] = useState("");

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
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
        </Modal>
    );
}

export function RaidView(props: {
    initialFrom?: string;
    initialTo?: string;
    raidChannel: (from: string, to: string) => void,
    close: () => void;
}): JSX.Element {
    const [raidFrom, setRaidFrom] = useState(props.initialFrom);
    const [raidTo, setRaidTo] = useState(props.initialTo);
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
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
        </Modal>
    );
}
