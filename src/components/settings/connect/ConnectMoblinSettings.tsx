import { TextInput, PasswordInput, Fieldset, Stack, Text, Alert, Button, Checkbox, Group, ActionIcon, Badge, Switch, NumberInput, Select } from '@mantine/core';
import { IconInfoCircle, IconPlug, IconCopy } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function ConnectMoblinSettings() {
    const config = useContext(ConfigContext);
    const [password, setPassword] = useState('');
    const [wsUrl, setWsUrl] = useState('');
    const [configured, setConfigured] = useState(false);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sink, setSink] = useState<string | undefined>(undefined);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_BACKEND_URL}/moblin/get?state=${state}`)
            .then(res => res.json())
            .then((data) => {
                if (data.configured) {
                    setConfigured(true);
                    setWsUrl(data.wsUrl || '');
                }
                setConnected(!!data.connected);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/sink/get?state=${state}`)
            .then(res => res.json())
            .then(data => setSink(data.sink));
    }, []);

    const telemetryUrl = sink
        ? `${new URL(import.meta.env.VITE_SINK_URL.replaceAll('browsersource', 'hud')).href}#token=${encodeURIComponent(sink)}`
        : '';

    const save = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/moblin/set?state=${state}&password=${encodeURIComponent(password)}`);
            const data = await res.json();
            setConfigured(true);
            setWsUrl(data.wsUrl || '');
            setPassword('');
        } catch {
            alert('Failed to save Moblin config');
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Moblin?')) return;
        setLoading(true);
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/moblin/set?state=${state}&password=`);
            setConfigured(false);
            setConnected(false);
            setWsUrl('');
            setPassword('');
        } catch {
            alert('Failed to disconnect Moblin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Moblin is an iOS live streaming app. Connect HeheChat to control scenes and camera zoom directly from the stream status bar. Requires a HeheChat Pro subscription.
            </Alert>
            <Fieldset legend="Moblin Remote Control" variant="filled">
                <Stack gap="md">
                    {configured ? (
                        <Stack gap="sm">
                            <Group>
                                <Checkbox defaultChecked readOnly color="lime.4" size="md" />
                                <div>
                                    <Group gap="xs">
                                        <Text>Configured</Text>
                                        <Badge color={connected ? 'green' : 'gray'} size="sm">
                                            {connected ? 'Connected' : 'Not connected'}
                                        </Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed">
                                        {connected ? 'Moblin is actively connected.' : 'Waiting for Moblin to connect.'}
                                    </Text>
                                </div>
                            </Group>
                            <TextInput
                              label="WebSocket URL"
                              description="Enter this URL in Moblin → Settings → Remote Control"
                              value={wsUrl}
                              readOnly
                              rightSection={
                                    <ActionIcon variant="subtle" onClick={() => navigator.clipboard.writeText(wsUrl)}>
                                        <IconCopy size="1rem" />
                                    </ActionIcon>
                                }
                            />
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>
                                Disconnect Moblin
                            </Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To connect Moblin with HeheChat:
                                <ol>
                                    <li>Enter a password below and click Connect</li>
                                    <li>Copy the generated WebSocket URL</li>
                                    <li>In Moblin: Settings → Remote Control → enable and paste the URL and password</li>
                                </ol>
                            </Text>
                            <PasswordInput
                              label="Password"
                              placeholder="Enter a password for Moblin to use"
                              value={password}
                              onChange={(ev) => setPassword(ev.target.value)}
                            />
                            <Button
                              leftSection={<IconPlug size={20} />}
                              onClick={save}
                              loading={loading}
                              disabled={!password.trim()}
                            >
                                Connect Moblin
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
            <Fieldset legend="Cycling Telemetry Browser Source" variant="filled">
                <Stack gap="md">
                    <Text fs="italic" size="14px">
                        Add this URL as a browser source in OBS to show the cycling HUD.
                        Unlike Moblin&apos;s own browser source, this keeps updating even
                        while the source isn&apos;t visible.
                    </Text>
                    {sink ? (
                        <TextInput
                          label="Browser Source URL"
                          value={telemetryUrl}
                          readOnly
                          styles={{ input: { fontFamily: 'monospace', fontSize: 11 } }}
                          rightSection={
                                <ActionIcon variant="subtle" onClick={() => navigator.clipboard.writeText(telemetryUrl)}>
                                    <IconCopy size="1rem" />
                                </ActionIcon>
                            }
                        />
                    ) : (
                        <Text size="sm" c="dimmed">Loading token…</Text>
                    )}
                </Stack>
            </Fieldset>
            <Fieldset legend="Stream Status Bar" variant="filled">
                <Stack gap="sm">
                    <Switch
                      label="Show Moblin Control"
                      size="lg"
                      checked={config.showMoblinZoom}
                      onChange={e => config.setShowMoblinZoom(e.currentTarget.checked)}
                    />
                    <Text fs="italic" size="14px">Show Moblin scene switcher and zoom control in the stream status bar</Text>
                </Stack>
            </Fieldset>
            <Fieldset legend="Cycling HUD Theme" variant="filled">
                <Stack gap="sm">
                    <Text fs="italic" size="14px">Choose the overall visual style of the cycling telemetry HUD</Text>
                    <Select
                      label="Theme"
                      data={[
                          { value: 'classic', label: 'Classic (dark glass, colored zones)' },
                          { value: 'mono', label: 'Minimal (flat, grayscale, single accent)' },
                          { value: 'cockpit', label: 'Cockpit (telemetry strip, green accent)' },
                      ]}
                      value={config.cyclingHudTheme}
                      onChange={value => config.setCyclingHudTheme((value as 'classic' | 'mono' | 'cockpit') ?? 'classic')}
                      allowDeselect={false}
                    />
                </Stack>
            </Fieldset>
            <Fieldset legend="Cycling HUD Sections" variant="filled">
                <Stack gap="sm">
                    <Text fs="italic" size="14px">Choose which sections the cycling telemetry HUD shows on stream</Text>
                    <Switch
                      label="Enabled"
                      checked={config.cyclingHudEnabled}
                      onChange={e => config.setCyclingHudEnabled(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Location"
                      checked={config.cyclingHudLocation}
                      onChange={e => config.setCyclingHudLocation(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Distance"
                      checked={config.cyclingHudDistance}
                      onChange={e => config.setCyclingHudDistance(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Speed"
                      checked={config.cyclingHudSpeed}
                      onChange={e => config.setCyclingHudSpeed(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Gradient"
                      checked={config.cyclingHudGradient}
                      onChange={e => config.setCyclingHudGradient(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Elevation"
                      checked={config.cyclingHudElevation}
                      onChange={e => config.setCyclingHudElevation(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Heart rate"
                      checked={config.cyclingHudHeartRate}
                      onChange={e => config.setCyclingHudHeartRate(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Power"
                      checked={config.cyclingHudPower}
                      onChange={e => config.setCyclingHudPower(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Split"
                      checked={config.cyclingHudSplit}
                      onChange={e => config.setCyclingHudSplit(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Show max speed/gradient"
                      checked={config.cyclingHudShowMax}
                      onChange={e => config.setCyclingHudShowMax(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Debug overlay"
                      checked={config.cyclingHudDebug}
                      onChange={e => config.setCyclingHudDebug(e.currentTarget.checked)}
                    />
                </Stack>
            </Fieldset>
            <Fieldset legend="Cycling HUD Timing & Thresholds" variant="filled">
                <Stack gap="sm">
                    <NumberInput
                      label="Display delay"
                      description="Delays the HUD to match your stream's video delay, in seconds"
                      min={0}
                      max={20}
                      value={config.cyclingHudDelaySeconds}
                      onChange={value => config.setCyclingHudDelaySeconds(Number(value) || 0)}
                    />
                    <NumberInput
                      label="Minimum speed to show speed/slope"
                      description="Speed gauge (and, if enabled below, the slope gauge) only shows above this speed, in km/h"
                      min={0}
                      step={0.5}
                      value={config.cyclingHudMinSpeedKmh}
                      onChange={value => config.setCyclingHudMinSpeedKmh(Number(value) || 0)}
                    />
                    <NumberInput
                      label="Minimum slope to show"
                      description="Slope gauge only shows when the gradient magnitude (uphill or downhill) is at least this, in %"
                      min={0}
                      step={0.5}
                      value={config.cyclingHudMinGradientPercent}
                      onChange={value => config.setCyclingHudMinGradientPercent(Number(value) || 0)}
                    />
                    <Switch
                      label="Only show slope while moving"
                      checked={config.cyclingHudGradientOnlyWhenMoving}
                      onChange={e => {
                          config.setCyclingHudGradientOnlyWhenMoving(e.currentTarget.checked);
                      }}
                    />
                    <NumberInput
                      label="Hide delay"
                      description="Keep the speed/slope gauges visible for this many seconds after they drop below their threshold, instead of disappearing immediately"
                      min={0}
                      max={30}
                      value={config.cyclingHudHideLingerSeconds}
                      onChange={value => config.setCyclingHudHideLingerSeconds(Number(value) || 0)}
                    />
                </Stack>
            </Fieldset>
            <Fieldset legend="Heart Rate & Power Zones" variant="filled">
                <Stack gap="sm">
                    <Text fs="italic" size="14px">
                        Used to color the heart rate/power gauges by zone. Heart rate and power
                        only show when a sensor is actually reporting data.
                    </Text>
                    <NumberInput
                      label="Max heart rate"
                      description="Your maximum heart rate, in bpm - used to calculate heart rate zones"
                      min={100}
                      max={230}
                      value={config.cyclingHudMaxHeartRateBpm}
                      onChange={value => config.setCyclingHudMaxHeartRateBpm(Number(value) || 0)}
                    />
                    <NumberInput
                      label="Average power"
                      description="Your average/threshold power, in watts - used to calculate power zones"
                      min={50}
                      max={500}
                      value={config.cyclingHudAveragePowerWatts}
                      onChange={value => config.setCyclingHudAveragePowerWatts(Number(value) || 0)}
                    />
                </Stack>
            </Fieldset>
            <Fieldset legend="Pause Counter" variant="filled">
                <Stack gap="sm">
                    <Text fs="italic" size="14px">
                        Tracks how long you&apos;ve stopped moving and shows it where the speed
                        gauge normally is. A break only counts once you&apos;ve been below the
                        speed threshold above for a while, and only ends once you&apos;re clearly
                        moving again - so a quick stop to lock the bike and walk into a shop
                        on foot doesn&apos;t end the break early.
                    </Text>
                    <Switch
                      label="Show pause counter"
                      checked={config.cyclingHudPauseEnabled}
                      onChange={e => {
                          config.setCyclingHudPauseEnabled(e.currentTarget.checked);
                      }}
                    />
                    <NumberInput
                      label="Count as a break after"
                      description="Seconds below the speed threshold before it's counted as a break, in seconds"
                      min={0}
                      max={300}
                      value={config.cyclingHudPauseStartAfterSeconds}
                      onChange={value => {
                          config.setCyclingHudPauseStartAfterSeconds(Number(value) || 0);
                      }}
                    />
                    <NumberInput
                      label="Resume speed"
                      description="Speed you need to exceed to end the break, in km/h"
                      min={0}
                      step={0.5}
                      value={config.cyclingHudPauseResumeSpeedKmh}
                      onChange={value => {
                          config.setCyclingHudPauseResumeSpeedKmh(Number(value) || 0);
                      }}
                    />
                    <NumberInput
                      label="Minimum distance between breaks"
                      description="You must ride at least this far (since the start, or since the last break ended) before a new break can be counted, in meters"
                      min={0}
                      step={10}
                      value={config.cyclingHudPauseMinDistanceM}
                      onChange={value => {
                          config.setCyclingHudPauseMinDistanceM(Number(value) || 0);
                      }}
                    />
                </Stack>
            </Fieldset>
        </Stack>
    );
}
