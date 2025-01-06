import { GradientSegmentedControl } from '../../GradientSegmentedControl/GradientSegmentedControl';
import { useContext, useEffect, useState, useRef } from "react";
import { Avatar, Button, TextInput, Group, Modal, Text, Stack, Fieldset, Badge, ScrollArea } from '@mantine/core';
import { IconArrowsRight, IconX } from '@tabler/icons-react';
import { OverlayDrawer } from '../../../pages/Chat.page';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from '../../../ApplicationContext';
import { HeheMessage, SystemMessage, isSystemMessageType, HeheChatMessage, parseMessage } from '../../../commons/message';
import { getUserInfo, ModActions } from './modactions';
import styles from './modview.module.css';
import { formatDate, formatDuration, formatDateWithTime } from '../../../commons/helper';
import { ChannelPicker } from '../ChannelPicker';
import { ChatMessageComp } from '../ChatMessage';
import { SystemMessageComp } from '../systemmessage';

export const ModDrawer: OverlayDrawer = {
    name: 'mod',
    component: ModView,
    size: 'xl',
    position: 'bottom'
}

export interface ModViewProps {
    close: () => void;
    channel: string;
    channelId: string;
    username: string;
    modActions: ModActions;
}

function formatBanMessage(userInfo: any, username: string): string | null {
    if (!userInfo?.ban?.user_id) return null;

    const moderator = userInfo.ban.moderator_login || 'Nofuture2077';
    const banDate = new Date(userInfo.ban.created_at);
    const endDate = userInfo.ban.end_time ? new Date(userInfo.ban.end_time) : null;

    if (endDate) {
        const duration = Math.ceil((endDate.getTime() - banDate.getTime()) / (1000 * 60 * 60 * 24)) + 'd';
        return `${username} was timeouted by ${moderator} for ${duration} (until ${formatDate(endDate)} ${formatDateWithTime(endDate)})`;
    } else {
        return `${username} was banned by ${moderator} on ${formatDate(banDate)} ${formatDateWithTime(banDate)}`;
    }
}

export function ModView(props: ModViewProps) {
    const channel = props.channel;
    const channelId = props.channelId;
    const username = props.username;

    const [userInfo, setUserInfo] = useState<any>(undefined);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const login = useContext(LoginContextContext);

    const isBroadcaster = login.user?.name === channel;
    const isTargetMod = userInfo?.mod;
    const isTargetVIP = userInfo?.vip;
    const isTargetBanned = !!userInfo?.ban?.user_id;
    const isTargetBroadcaster = username === channel;
    const canTimeout = (isBroadcaster && !isTargetBroadcaster) || (!isBroadcaster && !isTargetMod && !isTargetBroadcaster);
    const canModifyRoles = isBroadcaster && !isTargetBroadcaster;
    const messageDiv = useRef<HTMLDivElement>(null);

    const followDate = userInfo?.follow?.followed_at ? formatDate(new Date(userInfo?.follow?.followed_at)) : '';
    const banMessage = formatBanMessage(userInfo, username);

    const reloadUserInfo = () => {
        setTimeout(() => {
            getUserInfo(channel, username).then((info) => {
                setUserInfo(info);
            });
        }, 1000);
    };

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

    useEffect(() => {
        getUserInfo(channel, username).then((info) => {
            setUserInfo(info);
            setTimeout(() => {
                messageDiv.current!.scrollTo({ top: messageDiv.current!.scrollHeight });
            }, 0);
        })
    }, [channel, username]);

    const renderMessage = (rawLine: string) => {
        const msg = parseMessage(rawLine) as HeheMessage;
        if (isSystemMessageType(msg)) {
            return (
                <div key={"system-" + msg.id}>
                    <SystemMessageComp msg={msg as SystemMessage} modActions={modActions} moderatedChannel={{}}/>
                </div>
            );
        }
        return (
            <div key={msg.id}>
                <ChatMessageComp 
                    msg={msg}
                    deletedMessages={{}}
                    moderatedChannel={{}}
                    setReplyMsg={() => {}}
                    hideReply={true}
                    openModView={() => {}}
                    modActions={modActions}
                />
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <Stack className={styles.userInfo} justify='space-between' p='md' align='stretch'>
                <Group justify='space-between' align='flex-start'>
                    <div style={{width: 62}}></div>
                    <Stack align='center' className={styles.userDetails}>
                        <Avatar
                            src={userInfo?.user?.profile_image_url}
                            size={80}
                            radius={80}
                            className={styles.avatar}
                        />
                            <h2>{userInfo?.user?.display_name}</h2>
                            {isTargetBroadcaster && <Badge color="violet">Broadcaster</Badge>}
                            {isTargetMod && <Badge color="green">Mod</Badge>}
                            {isTargetVIP && <Badge color="pink">VIP</Badge>}
                        <p className={styles.username}>@{username}</p>
                    </Stack>
                    <Button onClick={props.close} variant='subtle' color='primary'>
                        <IconX />
                    </Button>
                </Group>
                <Stack align='center' gap="0">
                    {followDate ?
                        (<p className={styles.follow}>
                            Followed since {followDate}
                        </p>) : <p></p>
                    }
                    <p className={styles.createdAt}>
                        {userInfo?.user?.created_at ? 'Account created on ' + formatDate(new Date(userInfo.user.created_at)) : ''}
                    </p>
                </Stack>
            </Stack>

            <div className={styles.messages}>
                <ScrollArea h="45vh" type="never" w="100vw" viewportRef={messageDiv}>
                {(userInfo?.messages || []).reverse().map((msg:any) => msg.message).map(renderMessage)}
                {banMessage && <div className={styles.banMessage}>{banMessage}</div>}
                </ScrollArea>
            </div>

            {canTimeout && (
                <Stack className={styles.actions} align="center">
                    {isTargetBanned ? (
                        <Button  key="unban-btn" color="green" size="sm" onClick={() => {
                            props.modActions.unbanUser(channelId, userInfo.user.id);
                            reloadUserInfo();
                        }}>
                            Unban
                        </Button>
                    ) : userInfo && (
                        <>
                            <Button key="timeout-btn" variant="default" size="sm" onClick={() => setShowTimeoutModal(true)}>Timeout</Button>
                            <Button  key="ban-btn" color="red" size="sm" onClick={() => setShowBanModal(true)}>Ban</Button>
                        </>
                    )}
                    {canModifyRoles && (
                        <>
                            {!isTargetMod && !isTargetVIP && !isTargetBanned && (
                                <>
                                    <Button key="make-mod" color="green" size="sm" onClick={() => {
                                        props.modActions.modUser(channelId, userInfo.user.id);
                                        reloadUserInfo();
                                    }}>
                                        Make Mod
                                    </Button>
                                    <Button key="make-vip" color="blue" size="sm" onClick={() => {
                                        props.modActions.vipUser(channelId, userInfo.user.id);
                                        reloadUserInfo();
                                    }}>
                                        Make VIP
                                    </Button>
                                </>
                            )}
                            {isTargetMod && (
                                <Button color="orange" key="remove-mod" size="sm" onClick={() => {
                                    props.modActions.unmodUser(channelId, userInfo.user.id);
                                    reloadUserInfo();
                                }}>
                                    Remove Mod
                                </Button>
                            )}
                            {isTargetVIP && (
                                <Button color="orange" key="remove-vip" size="sm" onClick={() => {
                                    props.modActions.unvipUser(channelId, userInfo.user.id);
                                    reloadUserInfo();
                                }}>
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
                    timeoutUser={(channelId, userId, duration, reason) => {
                        props.modActions.timeoutUser(channelId, userId, duration, reason);
                        reloadUserInfo();
                    }}
                    close={() => setShowTimeoutModal(false)}
                />
            )}

            {showBanModal && (
                <BanView
                    userId={userInfo?.user?.id}
                    userName={username}
                    channelId={channelId}
                    channelName={channel}
                    banUser={(channelId, userId, reason) => {
                        props.modActions.banUser(channelId, userId, reason);
                        reloadUserInfo();
                    }}
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
