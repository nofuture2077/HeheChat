import { Paper, Stack, Text, Switch, Fieldset, Anchor, Slider, TagsInput, Table, TextInput, ActionIcon, Space, Modal, Group, Button, NumberInput, Select } from '@mantine/core';
import { GradientSegmentedControl } from '../GradientSegmentedControl/GradientSegmentedControl';
import { useForceUpdate, useDisclosure } from '@mantine/hooks';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { AlertSystem } from '../../components/alerts/alertplayer'
import { IconLink, IconRepeat, IconPlus, IconTrash, IconCopy } from '@tabler/icons-react'
import { SystemMessageMainType } from '../../commons/message';
import { notifications } from '@mantine/notifications';
import { getRerollConfig, updateRerollConfig, RerollConfig } from '@/api/sprites';

interface EditorData {
    id: string;
    userid: string;
    channelname: string;
    token: string;
    name: string;
}

const hideEventsValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'channelPointRedemption', 'blerp', 'tts'];

const Messages: Record<string, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Subs",
    "raid": "Raids",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "channelPointRedemption": "Channel Points",
    "blerp": "Blerps",
    "tts": "!tts Events"
};


function CreateEditorModal({ opened, close, createEditor }: { opened: boolean, close: () => void, createEditor: (name: string) => void }) {
    const [editorName, setEditorName] = useState("");

    return (
        <Modal zIndex={400} opened={opened} onClose={close} withCloseButton={false}>
            <Fieldset legend={'Create new Editor Token'}>
                <TextInput 
                    label="Editor Name" 
                    placeholder="Enter a name for this editor" 
                    value={editorName} 
                    onChange={(ev) => setEditorName(ev.target.value)} 
                />
                <Group justify="flex-end" mt="md">
                    <Button onClick={close}>Cancel</Button>
                    <Button 
                        color='primary' 
                        disabled={!editorName.trim()} 
                        onClick={() => {
                            createEditor(editorName.trim());
                            setEditorName("");
                            close();
                        }}
                    >
                        Create
                    </Button>
                </Group>
            </Fieldset>
        </Modal>
    );
}

export function AlertSettings() {
    const config = useContext(ConfigContext);
    const loginContext = useContext(LoginContextContext);
    const forceUpdate = useForceUpdate();
    const [sink, setSink] = useState<string | undefined>(undefined);
    const [shares, setShares] = useState<string[]>(config.shares);
    const [editors, setEditors] = useState<EditorData[]>([]);
    const [editorModalOpened, editorModalHandler] = useDisclosure(false);
    const [rerollConfig, setRerollConfig] = useState<RerollConfig | null>(null);
    const [isLoadingRerollConfig, setIsLoadingRerollConfig] = useState(false);
    const [isSavingRerollConfig, setIsSavingRerollConfig] = useState(false);

    useEffect(() => {
        const state = localStorage.getItem('hehe-token_state') || '';

        fetch(import.meta.env.VITE_BACKEND_URL + "/sink/get?state=" + state).then(res => res.json()).then((data) => {
            setSink(data.sink);
        });
        
        loadEditors();
        loadRerollConfig();

        config.loadReceivedShares();
        config.loadShares();
    }, []);
    
    const loadRerollConfig = async () => {
        if (!loginContext.user) {
            console.error('User not logged in or user data not available');
            return;
        }
        
        const username = loginContext.user.name;
        console.log('Loading reroll config for username:', username);
        
        setIsLoadingRerollConfig(true);
        try {
            const config = await getRerollConfig(username);
            console.log('Received reroll config:', config);
            
            // If config is null, create a default config
            if (!config) {
                const defaultConfig = {
                    channel: username,
                    enabled: true,
                    config: {
                        userPickEnabled: false,
                        userPickChannelPointReward: null,
                        rerollTriggers: []
                    }
                };
                console.log('Creating default config:', defaultConfig);
                setRerollConfig(defaultConfig);
            } else {
                setRerollConfig(config);
            }
        } catch (error) {
            console.error('Failed to load reroll config:', error);
        } finally {
            setIsLoadingRerollConfig(false);
        }
    };
    
    const saveRerollConfig = async () => {
        if (!rerollConfig || !loginContext.user) return;
        
        setIsSavingRerollConfig(true);
        try {
            const result = await updateRerollConfig(rerollConfig.channel, {
                enabled: rerollConfig.enabled,
                config: rerollConfig.config
            });
            
            if (result.success && result.config) {
                setRerollConfig(result.config);
                notifications.show({
                    title: 'Success',
                    message: 'Reroll configuration saved successfully',
                    color: 'green',
                });
            }
        } catch (error) {
            console.error('Failed to save reroll config:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to save reroll configuration',
                color: 'red',
            });
        } finally {
            setIsSavingRerollConfig(false);
        }
    };
    
    const loadEditors = () => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state).then(res => res.json()).then((data) => {
            setEditors(data);
            if (!data.length) {
                createEditor('Default');
            }
        });
    }

    const createEditor = (name: string) => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state + '&name=' + encodeURIComponent(name), { method: 'PUT' }).then(res => res.json()).then((data) => {
            setEditors(data);
        });
    }

    const deleteEditor = (token: string) => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state + '&token=' + encodeURIComponent(token), { method: 'DELETE' }).then(res => res.json()).then((data) => {
            setEditors(data);
        });
    }
    
    useEffect(() => {
        if (shares != config.shares) {
            config.setShares(shares);
        }
    }, [shares]);

    const changeActive = (channel: string, active: boolean) => {
        const activatedShares = config.activatedShares;

        if (active) {
            if (!activatedShares.includes(channel)) {
                activatedShares.push(channel);
            }
        } else {
            const index = activatedShares.indexOf(channel);
            if (index > -1) {
                activatedShares.splice(index, 1);
            }
        }
        config.setActivatedShares(activatedShares);
    };

    const marks = [-250, -0, 250, 500].map(x => ({ value: x, label: x + "ms" }));

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            notifications.show({
                title: 'Copied!',
                message: `${label} URL copied to clipboard`,
                color: 'green',
            });
        } catch (err) {
            notifications.show({
                title: 'Error',
                message: 'Failed to copy to clipboard',
                color: 'red',
            });
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Alert Sound Output" variant="filled" key="alert-output">
                <Stack>
                    <GradientSegmentedControl
                        data={[
                            { label: 'None', value: 'none' },
                            { label: 'Obs', value: 'obs' },
                            { label: 'Hehe', value: 'app' }
                        ]}
                        value={
                            config.playAlerts
                                ? 'app'
                                : config.browserSourceAudio
                                    ? 'obs'
                                    : 'none'
                        }
                        setValue={(value: string) => {
                            config.setPlayAlerts(value === 'app');
                            config.setBrowserSourceAudio(value === 'obs');
                            forceUpdate();
                        }}
                    />
                    <Text fs="italic" size='14px'>Select where alert sounds should be played</Text>
                    {sink ? (<>
                        <Group gap="xs">
                            <Text size="sm">OBS Browser Source</Text>
                            <ActionIcon 
                                variant="light" 
                                color="blue"
                                onClick={() => copyToClipboard(import.meta.env.VITE_SINK_URL + "#token=" + sink, "OBS Browser Source")}
                            >
                                <IconCopy size={16} />
                            </ActionIcon>
                        </Group>
                        <Group gap="xs">
                            <Text size="sm">Replay Widget</Text>
                            <ActionIcon 
                                variant="light" 
                                color="green"
                                onClick={() => copyToClipboard(import.meta.env.VITE_REPLAY_URL + "#token=" + sink, "Replay Widget")}
                            >
                                <IconCopy size={16} />
                            </ActionIcon>
                        </Group>
                    </>) : null}
                    <Switch 
                        checked={config.checkBrowsersourceConnection} 
                        onChange={(event) => { 
                            config.setCheckBrowsersourceConnection(event.currentTarget.checked); 
                            forceUpdate(); 
                        }} 
                        label="Check OBS Connection" 
                        size="lg" 
                    />
                    <Text fs="italic" size='14px'>Show warnings when Browsersource is not connected but audio is set to OBS</Text>
                </Stack>
            </Fieldset>

            <Fieldset legend="Visual Alerts" variant="filled" key="visual-alerts">
                <Stack>
                    <Switch 
                        checked={config.browserSourceVisual} 
                        onChange={(event) => { 
                            config.setBrowserSourceVisual(event.currentTarget.checked); 
                            forceUpdate(); 
                        }} 
                        label="Show visual alerts in OBS Browser Source" 
                        size="lg" 
                    />
                    <Text fs="italic" size='14px'>Enable visual alert overlays in OBS (independent of audio)</Text>
                </Stack>
            </Fieldset>
            
            <Fieldset legend="Alert Editor" variant="filled">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Link</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Copy</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{editors.map(element => <Table.Tr key={element.id}>
                        <Table.Td>
                            <Anchor href={import.meta.env.VITE_EDITOR_URL + "?token=" + element.token} target="_blank">
                                <IconLink />
                            </Anchor>
                        </Table.Td>
                        <Table.Td>{element.name}</Table.Td>
                        <Table.Td>
                            <ActionIcon 
                                variant="light" 
                                color="blue"
                                onClick={() => copyToClipboard(import.meta.env.VITE_EDITOR_URL + "?token=" + element.token, "Alert Editor")}
                            >
                                <IconCopy size={16} />
                            </ActionIcon>
                        </Table.Td>
                        <Table.Td>
                            <ActionIcon variant="subtle" onClick={() => deleteEditor(element.token)}>
                                <IconTrash />
                            </ActionIcon>
                        </Table.Td>
                    </Table.Tr>)}</Table.Tbody>
                </Table>

                <Space h="xs" />
                <Group gap="xs">
                    <ActionIcon color='primary' onClick={() => editorModalHandler.open()}><IconPlus /></ActionIcon>
                    <Text size="sm">Create Alert Editor</Text>
                </Group>
                <CreateEditorModal opened={editorModalOpened} close={editorModalHandler.close} createEditor={createEditor} />
            </Fieldset>
            
            <Fieldset legend="Share Alerts with" variant="filled">
                <TagsInput placeholder="" value={config.shares} onChange={(shares) => setShares(shares.map(c => c.toLowerCase().substring(0, 25).trim()))}></TagsInput>
                <Space h="xs" />
                <Text fs="italic" size='14px'>* Share your alerts with other Streams so they can use your sounds. Be aware: If you use AI-TTS shared alerts will count against your Quota from elevenlabs</Text>
            </Fieldset>

            <Fieldset legend="Alert Channels" variant="filled" key="alert-channel">
                <Stack>
                    {config.channels.map(channel => <Switch key={channel} checked={config.activatedShares.includes(channel)} disabled={!config.receivedShares.includes(channel)} label={channel + (config.receivedShares.includes(channel) ? '' : ' *')} onChange={(event) => { changeActive(channel, event.currentTarget.checked); forceUpdate() }} size="lg" />)}
                    <Text fs="italic" size='14px'>(*) No Permission - Ask other Streams to share their alerts with you.</Text>
                </Stack>
            </Fieldset>


            {Object.keys(AlertSystem.alertConfig).filter(channel => config.activatedShares.includes(channel)).map(channel => {
                if (!AlertSystem.alertConfig[channel] || !config.channels.includes(channel)) {
                    return null;
                }
                return <Fieldset key={"Alerts-" + channel} legend={"Alerts " + channel} variant="filled">
                    <Stack key={"alert-config-" + channel}>
                        {/* Add blerp alert option */}
                        <Switch 
                            disabled={!config.activatedShares.includes(channel)} 
                            checked={!config.deactivatedAlerts["blerp"]} 
                            onChange={(event) => { 
                                config.setDeactivatedAlerts("blerp", !event.currentTarget.checked); 
                                forceUpdate(); 
                            }} 
                            key="blerp" 
                            label="Blerps" 
                            size="lg" 
                        />
                        {Object.values(AlertSystem.alertConfig[channel].data?.alerts || []).reduce((accumulator, value) => accumulator.concat(value), []).map((alert) => {
                            return <Switch disabled={!config.activatedShares.includes(channel)} checked={!config.deactivatedAlerts[alert.id]} onChange={(event) => { config.setDeactivatedAlerts(alert.id, !event.currentTarget.checked); forceUpdate() }} key={alert.id} label={alert.name} size="lg" />
                        })}
                    </Stack>
                </Fieldset>
            })}

            <Fieldset legend="Hide Events" variant='filled'>
                <Stack>
                    {hideEventsValues.map(eventType => <Switch key={eventType} checked={config.hideEvents[eventType]} onChange={(event) => { 
                        config.setHideEvents(eventType, event.currentTarget.checked); 
                        forceUpdate(); 
                    }} label={Messages[eventType]} size="lg" />)}
                    <Switch 
                        checked={config.skipEmotesInTTS} 
                        onChange={(event) => { 
                            config.setSkipEmotesInTTS(event.currentTarget.checked); 
                            forceUpdate(); 
                        }} 
                        label="Skip emotes in TTS" 
                        size="lg" 
                    />
                    <Switch 
                        checked={config.skip7TVEmotesInTTS} 
                        onChange={(event) => { 
                            config.setSkip7TVEmotesInTTS(event.currentTarget.checked); 
                            forceUpdate(); 
                        }} 
                        label="Skip 7TV emotes in TTS" 
                        size="lg" 
                    />
                    <Switch 
                        checked={config.skipGlobalEmotesInTTS} 
                        onChange={(event) => { 
                            config.setSkipGlobalEmotesInTTS(event.currentTarget.checked); 
                            forceUpdate(); 
                        }} 
                        label="Skip global emotes in TTS" 
                        size="lg" 
                    />
                </Stack>
            </Fieldset>

            <Fieldset legend="Alert Delay" variant="filled" key="tts-delay">
                <Stack>π
                    <Text size="sm">Visual Alert (seconds)</Text>
                    <Slider 
                        w="calc(100% - 20px)" 
                        m="10" 
                        value={config.visualAlertDelay} 
                        onChange={(value) => { config.setVisualAlertDelay(value); forceUpdate(); }} 
                        min={0} 
                        max={15} 
                        step={1}
                        label={(value) => `${value}s`} 
                        marks={[
                            { value: 0, label: '0s' },
                            { value: 5, label: '5s' },
                            { value: 10, label: '10s' },
                            { value: 15, label: '15s' }
                        ]} 
                    />
                    <Text fs="italic" size='14px'>Adjust the timing of visual alerts relative to audio alerts</Text>
                </Stack>
            </Fieldset>

            <Fieldset legend="Alert Volume Boost" variant="filled" key="alert-boost">
                <Stack>
                    <Text size="sm">Volume Boost</Text>
                    <Slider 
                        w="calc(100% - 20px)" 
                        m="10" 
                        value={config.alertBoost} 
                        onChange={(value) => { config.setAlertBoost(value); forceUpdate(); }} 
                        min={0.1} 
                        max={5.0} 
                        step={0.1}
                        label={(value) => `${value.toFixed(1)}x`} 
                        marks={[
                            { value: 0.5, label: '0.5x' },
                            { value: 1.0, label: '1.0x' },
                            { value: 2.0, label: '2.0x' },
                            { value: 3.0, label: '3.0x' },
                            { value: 4.0, label: '4.0x' },
                            { value: 5.0, label: '5.0x' }
                        ]} 
                    />
                    <Text fs="italic" size='14px'>Adjust the volume boost for all alert sounds</Text>
                </Stack>
            </Fieldset>
            
            {rerollConfig && (
                <Fieldset legend="Sprite Reroll Configuration" variant="filled" key="reroll-config">
                    <Stack>
                        <Switch 
                            checked={rerollConfig.enabled} 
                            onChange={(event) => { 
                                const newConfig = {
                                    ...rerollConfig,
                                    enabled: event.currentTarget.checked
                                };
                                setRerollConfig(newConfig);
                                
                                // Save the updated config
                                (async () => {
                                    setIsSavingRerollConfig(true);
                                    try {
                                        await updateRerollConfig(newConfig.channel, {
                                            enabled: newConfig.enabled,
                                            config: newConfig.config
                                        });
                                    } catch (error) {
                                        console.error('Failed to update reroll config:', error);
                                    } finally {
                                        setIsSavingRerollConfig(false);
                                    }
                                })();
                            }} 
                            label="Enable sprite rerolls" 
                            size="lg" 
                            disabled={isSavingRerollConfig}
                        />
                        <Text fs="italic" size='14px'>Allow viewers to reroll their assigned sprites</Text>
                        
                            <Stack>
                                {(rerollConfig.config.rerollTriggers || []).map((trigger, index) => (
                                <Paper p="sm">
                                    <Group key={index} align="flex-start">
                                        <Select
                                            label="Type"
                                            value={trigger.type}
                                            onChange={(value) => {
                                                if (!value) return;
                                                const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                newTriggers[index] = { ...trigger, type: value as any };
                                                const newConfig = {
                                                    ...rerollConfig,
                                                    config: {
                                                        ...rerollConfig.config,
                                                        rerollTriggers: newTriggers
                                                    }
                                                };
                                                setRerollConfig(newConfig);
                                            }}
                                            data={[
                                                { value: 'ChannelPointReward', label: 'Channel Points' },
                                                { value: 'Bits', label: 'Bits' },
                                                { value: 'Donation', label: 'Donation' },
                                                { value: 'Sub', label: 'Subscription' },
                                                { value: 'Giftsub', label: 'Gift Sub' }
                                            ]}
                                            disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                        />
                                        
                                        {trigger.type === 'Sub' || trigger.type === 'Giftsub' ? (
                                            <>
                                                <Select
                                                    label="Tier"
                                                    value={trigger.tier || 'tier1'}
                                                    onChange={(value) => {
                                                        if (!value) return;
                                                        const newTriggers = [...rerollConfig.config.rerollTriggers];
                                                        newTriggers[index] = { ...trigger, tier: value as any };
                                                        const newConfig = {
                                                            ...rerollConfig,
                                                            config: {
                                                                ...rerollConfig.config,
                                                                rerollTriggers: newTriggers
                                                            }
                                                        };
                                                        setRerollConfig(newConfig);
                                                    }}
                                                    data={[
                                                        { value: 'tier1', label: 'Tier 1' },
                                                        { value: 'tier2', label: 'Tier 2' },
                                                        { value: 'tier3', label: 'Tier 3' },
                                                        { value: 'prime', label: 'Prime' }
                                                    ]}
                                                    disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                                />
                                                
                                                <Select
                                                    label="Operation"
                                                    value={trigger.operation}
                                                    onChange={(value) => {
                                                        if (!value) return;
                                                        const newTriggers = [...rerollConfig.config.rerollTriggers];
                                                        newTriggers[index] = { ...trigger, operation: value as any };
                                                        const newConfig = {
                                                            ...rerollConfig,
                                                            config: {
                                                                ...rerollConfig.config,
                                                                rerollTriggers: newTriggers
                                                            }
                                                        };
                                                        setRerollConfig(newConfig);
                                                    }}
                                                    data={[
                                                        { value: 'exact', label: 'Exact' },
                                                        { value: 'min', label: 'Minimum' }
                                                    ]}
                                                    disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                                />
                                                
                                                <NumberInput
                                                    label="Amount"
                                                    value={typeof trigger.amount === 'number' ? trigger.amount : 0}
                                                    onChange={(value) => {
                                                        const newTriggers = [...rerollConfig.config.rerollTriggers];
                                                        newTriggers[index] = { 
                                                            ...trigger, 
                                                            amount: Number(value) || 0,
                                                            value: (value || 0).toString()
                                                        };
                                                        const newConfig = {
                                                            ...rerollConfig,
                                                            config: {
                                                                ...rerollConfig.config,
                                                                rerollTriggers: newTriggers
                                                            }
                                                        };
                                                        setRerollConfig(newConfig);
                                                    }}
                                                    min={0}
                                                    disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                                />
                                            </>
                                        ) : null}
                                        
                                        {trigger.type === 'Bits' || trigger.type === 'Donation' ? (
                                            <>
                                                <Select
                                                    label="Operation"
                                                    value={trigger.operation}
                                                    onChange={(value) => {
                                                        if (!value) return;
                                                        const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                        newTriggers[index] = { ...trigger, operation: value as any };
                                                        const newConfig = {
                                                            ...rerollConfig,
                                                            config: {
                                                                ...rerollConfig.config,
                                                                rerollTriggers: newTriggers
                                                            }
                                                        };
                                                        setRerollConfig(newConfig);
                                                    }}
                                                    data={[
                                                        { value: 'exact', label: 'Exact' },
                                                        { value: 'min', label: 'Minimum' }
                                                    ]}
                                                    disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                                />
                                                
                                                <NumberInput
                                                    label="Amount"
                                                    value={typeof trigger.amount === 'number' ? trigger.amount : 0}
                                                    onChange={(value) => {
                                                        const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                        newTriggers[index] = { 
                                                            ...trigger, 
                                                            amount: Number(value) || 0,
                                                            value: (value || 0).toString()
                                                        };
                                                        const newConfig = {
                                                            ...rerollConfig,
                                                            config: {
                                                                ...rerollConfig.config,
                                                                rerollTriggers: newTriggers
                                                            }
                                                        };
                                                        setRerollConfig(newConfig);
                                                    }}
                                                    min={0}
                                                    disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                                />
                                            </>
                                        ) : null}
                                        
                                        {trigger.type === 'ChannelPointReward' ? (
                                            <TextInput
                                                label="Reward Name"
                                                value={trigger.value}
                                                onChange={(event) => {
                                                    const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                    newTriggers[index] = { ...trigger, value: event.currentTarget.value };
                                                    const newConfig = {
                                                        ...rerollConfig,
                                                        config: {
                                                            ...rerollConfig.config,
                                                            rerollTriggers: newTriggers
                                                        }
                                                    };
                                                    setRerollConfig(newConfig);
                                                }}
                                                disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                            />
                                        ) : null}
                                        
                                        <NumberInput
                                            label="Mod"
                                            value={typeof trigger.mod === 'number' ? trigger.mod : 0}
                                            onChange={(value) => {
                                                const newTriggers = [...rerollConfig.config.rerollTriggers];
                                                newTriggers[index] = { 
                                                    ...trigger, 
                                                    mod: Number(value) || 0
                                                };
                                                const newConfig = {
                                                    ...rerollConfig,
                                                    config: {
                                                        ...rerollConfig.config,
                                                        rerollTriggers: newTriggers
                                                    }
                                                };
                                                setRerollConfig(newConfig);
                                            }}
                                            min={0}
                                            disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                        />
                                        
                                        <ActionIcon 
                                            color="red" 
                                            onClick={() => {
                                                const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                newTriggers.splice(index, 1);
                                                const newConfig = {
                                                    ...rerollConfig,
                                                    config: {
                                                        ...rerollConfig.config,
                                                        rerollTriggers: newTriggers
                                                    }
                                                };
                                                setRerollConfig(newConfig);
                                            }}
                                            disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                    </Paper>
                                ))}
                                
                                <Button 
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => {
                                        const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                        newTriggers.push({
                                            type: 'Bits',
                                            operation: 'exact',
                                            value: '100',
                                            amount: 100,
                                            mod: 0
                                        });
                                        const newConfig = {
                                            ...rerollConfig,
                                            config: {
                                                ...rerollConfig.config,
                                                rerollTriggers: newTriggers
                                            }
                                        };
                                        setRerollConfig(newConfig);
                                    }}
                                    disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                >
                                    Add Trigger
                                </Button>
                            </Stack>
                        
                        <Fieldset legend="User Pick Configuration" variant="filled">
                            <Stack>
                                <Switch 
                                    checked={rerollConfig.config.userPickEnabled} 
                                    onChange={(event) => { 
                                        const newConfig = {
                                            ...rerollConfig,
                                            config: {
                                                ...rerollConfig.config,
                                                userPickEnabled: event.currentTarget.checked
                                            }
                                        };
                                        setRerollConfig(newConfig);
                                        
                                        // Save the updated config
                                        (async () => {
                                            setIsSavingRerollConfig(true);
                                            try {
                                                await updateRerollConfig(newConfig.channel, {
                                                    enabled: newConfig.enabled,
                                                    config: newConfig.config
                                                });
                                            } catch (error) {
                                                console.error('Failed to update reroll config:', error);
                                            } finally {
                                                setIsSavingRerollConfig(false);
                                            }
                                        })();
                                    }} 
                                    label="Allow users to pick their sprite" 
                                    size="lg" 
                                    disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                />
                                <Text fs="italic" size='14px'>Enable this to allow users to pick one of their collected sprites</Text>
                                
                                <Text size="sm">Channel Points Reward Name for user pick</Text>
                                <TextInput
                                    placeholder="Enter Channel Points Reward name for user pick"
                                    value={rerollConfig.config.userPickChannelPointReward || ''}
                                    onChange={(ev) => {
                                        const value = ev.target.value;
                                        const newConfig = {
                                            ...rerollConfig,
                                            config: {
                                                ...rerollConfig.config,
                                                userPickChannelPointReward: value === '' ? null : value
                                            }
                                        };
                                        setRerollConfig(newConfig);
                                    }}
                                    onBlur={() => {
                                        // Save the updated config
                                        (async () => {
                                            setIsSavingRerollConfig(true);
                                            try {
                                                await updateRerollConfig(rerollConfig.channel, {
                                                    enabled: rerollConfig.enabled,
                                                    config: rerollConfig.config
                                                });
                                            } catch (error) {
                                                console.error('Failed to update reroll config:', error);
                                            } finally {
                                                setIsSavingRerollConfig(false);
                                            }
                                        })();
                                    }}
                                    disabled={!rerollConfig.enabled || !rerollConfig.config.userPickEnabled || isSavingRerollConfig}
                                />
                                <Text fs="italic" size='14px'>Name of the Channel Point Reward for users to pick their sprite (only used if "Allow users to pick their sprite" is enabled)</Text>
                            </Stack>
                        </Fieldset>
                        
                        <Group justify="flex-end">
                            <Button 
                                onClick={saveRerollConfig} 
                                loading={isSavingRerollConfig}
                                disabled={!rerollConfig.enabled}
                            >
                                Save Configuration
                            </Button>
                        </Group>
                    </Stack>
                </Fieldset>
            )}
        </Stack>)
}
