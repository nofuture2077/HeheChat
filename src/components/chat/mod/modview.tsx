import { GradientSegmentedControl } from '../../GradientSegmentedControl/GradientSegmentedControl';
import { useContext, useEffect, useState, useRef, useMemo, type ReactElement } from "react";
import { Avatar, Button, TextInput, Group, Modal, Text, Stack, Fieldset, Badge, ScrollArea, Image } from '@mantine/core';
import { IconArrowsRight, IconX } from '@tabler/icons-react';
import { OverlayDrawer } from '../../../pages/Chat.page';
import { ChatEmotesContext, ConfigContext, LoginContextContext } from '../../../ApplicationContext';
import { HeheMessage, isSystemMessageType, isYTChatMessageType, parseMessage, YTChatMessage } from '../../../commons/message';
import { getUserInfo, ModActions } from './modactions';
import styles from './modview.module.css';
import { formatDate, formatDuration, formatDateWithTime } from '../../../commons/helper';
import { ChannelPicker } from '../ChannelPicker';
import { ChatMessageComp } from '../ChatMessage';
import { HelixStream } from '@twurple/api';
import _ from "underscore";

export const ModDrawer: OverlayDrawer = {
    name: 'mod',
    component: ModView,
    size: 700,
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

    const moderator = userInfo.ban.moderator_login;
    const banDate = new Date(userInfo.ban.created_at);
    const endDate = userInfo.ban.expires_at ? new Date(userInfo.ban.expires_at) : null;

    if (endDate) {
        const duration = (endDate.getTime() - banDate.getTime());
        return `${username} was timeouted by ${moderator} for ${formatDuration(duration)} (until ${formatDate(endDate)} ${formatDateWithTime(endDate)})`;
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
    const canTimeout = (isBroadcaster ? !isTargetBroadcaster : (!isTargetMod && !isTargetBroadcaster)) && userInfo?.mod !== undefined;
    const canModifyRoles = isBroadcaster && !isTargetBroadcaster;
    const messageDiv = useRef<HTMLDivElement>(null);

    const followDate = userInfo?.follow?.followed_at ? formatDate(new Date(userInfo?.follow?.followed_at)) : '';
    const banMessage = formatBanMessage(userInfo, username);
    
    // Memoize messages to prevent unnecessary re-sorting on every render
    const messages = useMemo(() => {
        return (userInfo?.messages || []).slice().reverse();
    }, [userInfo?.messages]);
    
    const messageGroups = useMemo(() => {
        return _.groupBy(messages, (msg) => formatDate(new Date(Number(msg.date))));
    }, [messages]);

    const reloadUserInfo = () => {
        // Add a small delay to allow backend to process the moderation action
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
        unvipUser: () => {},
        unraid: () => {}
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
        if (isSystemMessageType(msg) || isYTChatMessageType(msg)) {
            return null;
        }

        return (
            <div key={msg.id}>
                <ChatMessageComp 
                    msg={msg}
                    forceTimestamp
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
        <Stack className={styles.container} justify='space-between' h="100%" gap="xs">
            <Stack className={styles.userInfo} justify='space-between' align='stretch'>
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
                <ScrollArea h="100%" type="never" w="100vw" viewportRef={messageDiv}>
                    {Object.entries(messageGroups).map(([date, groupMessages]) => (
                        <div key={date}>
                            <Text className={styles.dateHeader}>{date}</Text>
                            {groupMessages.map((msg: any) => renderMessage(msg.message))}
                        </div>
                    ))}
                    {banMessage && <div className={styles.banMessage}>{banMessage}</div>}
                </ScrollArea>
            </div>

            {canTimeout && (
                <Stack className={styles.actions} align="center" gap="sm">
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
        </Stack>
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
}): ReactElement {
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
}): ReactElement {
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

export function DeleteMessageView(props: {
    messageId: string,
    messageText: string,
    userName: string,
    channelId: string,
    channelName: string,
    deleteMessage: (channelId: string, messageId: string) => void,
    close: () => void;
}): ReactElement {
    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={["Delete message from", props.userName, "in", props.channelName].join(" ")}>
                <Text size="sm" c="dimmed" mb="md">
                    "{props.messageText}"
                </Text>
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='red' onClick={() => {
                        props.deleteMessage(props.channelId, props.messageId);
                        props.close();
                    }}>Delete</Button>
                </Group>
            </Fieldset>
        </Modal>
    );
}

export function RaidView(props: {
    initialFrom?: string;
    initialTo?: HelixStream;
    raidChannel: (from: string, to: string) => void,
    close: () => void;
}): ReactElement {
    const [raidFrom, setRaidFrom] = useState(props.initialFrom);
    const [raidTo, setRaidTo] = useState<HelixStream | undefined>(props.initialTo);
    const [profilePicture, setProfilePicture] = useState<string>("");
    const login = useContext(LoginContextContext);
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);

    useEffect(() => {
        if (raidTo?.userId) {
            fetch(`${import.meta.env.VITE_BACKEND_URL}/twitch/users/${raidTo.userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.profile_image_url) {
                        setProfilePicture(data.profile_image_url);
                    }
                })
                .catch(console.error);
        }
    }, [raidTo]);

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
                        <Image src={profilePicture} width="32" height="32"/>
                        <Text>{raidTo?.userName}</Text>
                    </Stack>
                </Group>
                <Group justify="space-between" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button variant='gradient' disabled={!raidFrom || !raidTo} onClick={() => {
                        if (raidFrom && raidTo) {
                            const raidFromId = emotes.getChannelId(raidFrom);
                            const raidToId = raidTo.userId;
                            props.raidChannel(raidFromId, raidToId);
                            props.close();
                        }
                    }}>Raid</Button>
                </Group>
            </Fieldset>
        </Modal>
    );
}
