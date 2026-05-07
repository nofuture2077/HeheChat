import { Stack, Text, Switch, Fieldset, Paper, Group, Button, Select, NumberInput, TextInput, ActionIcon } from '@mantine/core';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getRerollConfig, updateRerollConfig, RerollConfig } from '@/api/sprites';

export function AlertsRerollSettings() {
    const loginContext = useContext(LoginContextContext);
    const [rerollConfig, setRerollConfig] = useState<RerollConfig | null>(null);
    const [isLoadingRerollConfig, setIsLoadingRerollConfig] = useState(false);
    const [isSavingRerollConfig, setIsSavingRerollConfig] = useState(false);

    useEffect(() => {
        loadRerollConfig();
    }, []);

    const loadRerollConfig = async () => {
        if (!loginContext.user) return;
        const username = loginContext.user.name;
        setIsLoadingRerollConfig(true);
        try {
            const cfg = await getRerollConfig(username);
            if (!cfg) {
                setRerollConfig({ channel: username, enabled: true, config: { userPickEnabled: false, userPickChannelPointReward: null, rerollTriggers: [] } });
            } else {
                setRerollConfig(cfg);
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
            const result = await updateRerollConfig(rerollConfig.channel, { enabled: rerollConfig.enabled, config: rerollConfig.config });
            if (result.success && result.config) {
                setRerollConfig(result.config);
                notifications.show({ title: 'Success', message: 'Reroll configuration saved successfully', color: 'green' });
            }
        } catch (error) {
            console.error('Failed to save reroll config:', error);
            notifications.show({ title: 'Error', message: 'Failed to save reroll configuration', color: 'red' });
        } finally {
            setIsSavingRerollConfig(false);
        }
    };

    if (isLoadingRerollConfig || !rerollConfig) return null;

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Sprite Reroll Configuration" variant="filled">
                <Stack>
                    <Switch
                        checked={rerollConfig.enabled}
                        onChange={(event) => {
                            const newConfig = { ...rerollConfig, enabled: event.currentTarget.checked };
                            setRerollConfig(newConfig);
                            (async () => {
                                setIsSavingRerollConfig(true);
                                try { await updateRerollConfig(newConfig.channel, { enabled: newConfig.enabled, config: newConfig.config }); }
                                catch (error) { console.error('Failed to update reroll config:', error); }
                                finally { setIsSavingRerollConfig(false); }
                            })();
                        }}
                        label="Enable sprite rerolls"
                        size="lg"
                        disabled={isSavingRerollConfig}
                    />
                    <Text fs="italic" size='14px'>Allow viewers to reroll their assigned sprites</Text>

                    <Stack>
                        {(rerollConfig.config.rerollTriggers || []).map((trigger, index) => (
                            <Paper p="sm" key={index}>
                                <Group align="flex-start">
                                    <Select
                                        label="Type"
                                        value={trigger.type}
                                        onChange={(value) => {
                                            if (!value) return;
                                            const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                            newTriggers[index] = { ...trigger, type: value as any };
                                            setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
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

                                    {(trigger.type === 'Sub' || trigger.type === 'Giftsub') && (
                                        <>
                                            <Select
                                                label="Tier"
                                                value={trigger.tier || 'tier1'}
                                                onChange={(value) => {
                                                    if (!value) return;
                                                    const newTriggers = [...rerollConfig.config.rerollTriggers];
                                                    newTriggers[index] = { ...trigger, tier: value as any };
                                                    setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
                                                }}
                                                data={[{ value: 'tier1', label: 'Tier 1' }, { value: 'tier2', label: 'Tier 2' }, { value: 'tier3', label: 'Tier 3' }, { value: 'prime', label: 'Prime' }]}
                                                disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                            />
                                            <Select
                                                label="Operation"
                                                value={trigger.operation}
                                                onChange={(value) => {
                                                    if (!value) return;
                                                    const newTriggers = [...rerollConfig.config.rerollTriggers];
                                                    newTriggers[index] = { ...trigger, operation: value as any };
                                                    setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
                                                }}
                                                data={[{ value: 'exact', label: 'Exact' }, { value: 'min', label: 'Minimum' }]}
                                                disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                            />
                                            <NumberInput
                                                label="Amount"
                                                value={typeof trigger.amount === 'number' ? trigger.amount : 0}
                                                onChange={(value) => {
                                                    const newTriggers = [...rerollConfig.config.rerollTriggers];
                                                    newTriggers[index] = { ...trigger, amount: Number(value) || 0, value: (value || 0).toString() };
                                                    setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
                                                }}
                                                min={0}
                                                disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                            />
                                        </>
                                    )}

                                    {(trigger.type === 'Bits' || trigger.type === 'Donation') && (
                                        <>
                                            <Select
                                                label="Operation"
                                                value={trigger.operation}
                                                onChange={(value) => {
                                                    if (!value) return;
                                                    const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                    newTriggers[index] = { ...trigger, operation: value as any };
                                                    setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
                                                }}
                                                data={[{ value: 'exact', label: 'Exact' }, { value: 'min', label: 'Minimum' }]}
                                                disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                            />
                                            <NumberInput
                                                label="Amount"
                                                value={typeof trigger.amount === 'number' ? trigger.amount : 0}
                                                onChange={(value) => {
                                                    const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                    newTriggers[index] = { ...trigger, amount: Number(value) || 0, value: (value || 0).toString() };
                                                    setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
                                                }}
                                                min={0}
                                                disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                            />
                                        </>
                                    )}

                                    {trigger.type === 'ChannelPointReward' && (
                                        <TextInput
                                            label="Reward Name"
                                            value={trigger.value}
                                            onChange={(event) => {
                                                const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                                newTriggers[index] = { ...trigger, value: event.currentTarget.value };
                                                setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
                                            }}
                                            disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                        />
                                    )}

                                    <NumberInput
                                        label="Mod"
                                        value={typeof trigger.mod === 'number' ? trigger.mod : 0}
                                        onChange={(value) => {
                                            const newTriggers = [...rerollConfig.config.rerollTriggers];
                                            newTriggers[index] = { ...trigger, mod: Number(value) || 0 };
                                            setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
                                        }}
                                        min={0}
                                        disabled={!rerollConfig.enabled || isSavingRerollConfig}
                                    />

                                    <ActionIcon
                                        color="red"
                                        onClick={() => {
                                            const newTriggers = [...rerollConfig.config.rerollTriggers || []];
                                            newTriggers.splice(index, 1);
                                            setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
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
                                newTriggers.push({ type: 'Bits', operation: 'exact', value: '100', amount: 100, mod: 0 });
                                setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, rerollTriggers: newTriggers } });
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
                                    const newConfig = { ...rerollConfig, config: { ...rerollConfig.config, userPickEnabled: event.currentTarget.checked } };
                                    setRerollConfig(newConfig);
                                    (async () => {
                                        setIsSavingRerollConfig(true);
                                        try { await updateRerollConfig(newConfig.channel, { enabled: newConfig.enabled, config: newConfig.config }); }
                                        catch (error) { console.error('Failed to update reroll config:', error); }
                                        finally { setIsSavingRerollConfig(false); }
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
                                    setRerollConfig({ ...rerollConfig, config: { ...rerollConfig.config, userPickChannelPointReward: value === '' ? null : value } });
                                }}
                                onBlur={() => {
                                    (async () => {
                                        setIsSavingRerollConfig(true);
                                        try { await updateRerollConfig(rerollConfig.channel, { enabled: rerollConfig.enabled, config: rerollConfig.config }); }
                                        catch (error) { console.error('Failed to update reroll config:', error); }
                                        finally { setIsSavingRerollConfig(false); }
                                    })();
                                }}
                                disabled={!rerollConfig.enabled || !rerollConfig.config.userPickEnabled || isSavingRerollConfig}
                            />
                            <Text fs="italic" size='14px'>Name of the Channel Point Reward for users to pick their sprite</Text>
                        </Stack>
                    </Fieldset>

                    <Group justify="flex-end">
                        <Button onClick={saveRerollConfig} loading={isSavingRerollConfig} disabled={!rerollConfig.enabled}>
                            Save Configuration
                        </Button>
                    </Group>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
