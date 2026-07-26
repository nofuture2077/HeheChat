import { TextInput, Fieldset, Stack, Text, Button, Group, ActionIcon, Switch, NumberInput, Select, FileButton, Loader } from '@mantine/core';
import { IconCopy, IconUpload, IconTrash } from '@tabler/icons-react';
import { useState, useEffect, useContext, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { ConfigContext } from '@/ApplicationContext';
import { GpxSettings } from '../settings/cycling/GpxSettings';

const MAX_LOGO_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface LogoMeta {
    filename: string;
    mimeType: string;
    sizeBytes: number;
}

export function MoblinHudSettings() {
    const config = useContext(ConfigContext);
    const [sink, setSink] = useState<string | undefined>(undefined);
    const [logo, setLogo] = useState<LogoMeta | null>(null);
    const [logoLoading, setLogoLoading] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const logoResetRef = useRef<() => void>(null);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/sink/get?state=${state}`)
            .then(res => res.json())
            .then(data => setSink(data.sink));
    }, []);

    useEffect(() => {
        setLogoLoading(true);
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logo?token=${encodeURIComponent(state)}`)
            .then(res => res.json())
            .then(data => setLogo(data))
            .catch(() => notifications.show({ title: 'Error', message: 'Failed to load logo', color: 'red' }))
            .finally(() => setLogoLoading(false));
    }, []);

    const handleLogoUpload = async (file: File | null) => {
        if (!file) return;
        if (file.size > MAX_LOGO_FILE_SIZE) {
            notifications.show({ title: 'File too large', message: 'Logo files must be smaller than 5MB', color: 'red' });
            logoResetRef.current?.();
            return;
        }
        setLogoUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logo/upload?token=${encodeURIComponent(state)}`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            setLogo(data);
            notifications.show({ title: 'Uploaded', message: `${file.name} uploaded successfully`, color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to upload logo', color: 'red' });
        } finally {
            setLogoUploading(false);
            logoResetRef.current?.();
        }
    };

    const handleLogoRemove = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logo?token=${encodeURIComponent(state)}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(res.statusText);
            setLogo(null);
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to remove logo', color: 'red' });
        }
    };

    const telemetryUrl = sink
        ? `${new URL(import.meta.env.VITE_SINK_URL.replaceAll('browsersource', 'hud')).href}#token=${encodeURIComponent(sink)}`
        : '';

    return (
        <Stack gap={30}>
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
            <Fieldset legend="Cycling HUD Logo" variant="filled">
                <Stack gap="sm">
                    <Text fs="italic" size="14px">Upload a custom logo (PNG or SVG) to show on the cycling telemetry HUD</Text>
                    <Group>
                        <FileButton resetRef={logoResetRef} onChange={handleLogoUpload} accept="image/png,image/svg+xml">
                            {(props) => (
                                <Button {...props} leftSection={<IconUpload size={18} />} loading={logoUploading}>
                                    {logo ? 'Replace logo' : 'Upload logo'}
                                </Button>
                            )}
                        </FileButton>
                        {logo && (
                            <ActionIcon color="red" variant="subtle" onClick={handleLogoRemove}>
                                <IconTrash size={16} />
                            </ActionIcon>
                        )}
                        {logoLoading && <Loader size="sm" />}
                    </Group>
                    {logo && <Text size="sm" c="dimmed">{logo.filename}</Text>}
                    <Switch
                      label="Show logo"
                      checked={config.cyclingHudShowLogo}
                      onChange={e => config.setCyclingHudShowLogo(e.currentTarget.checked)}
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
                      label="Location: City"
                      ml="md"
                      checked={config.cyclingHudLocationCity}
                      onChange={e => config.setCyclingHudLocationCity(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Location: Region"
                      ml="md"
                      checked={config.cyclingHudLocationRegion}
                      onChange={e => config.setCyclingHudLocationRegion(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Location: Country"
                      ml="md"
                      checked={config.cyclingHudLocationCountry}
                      onChange={e => config.setCyclingHudLocationCountry(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Location: Country flag"
                      ml="md"
                      checked={config.cyclingHudLocationFlag}
                      onChange={e => config.setCyclingHudLocationFlag(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Location: Temperature"
                      ml="md"
                      checked={config.cyclingHudLocationTemperature}
                      onChange={e => config.setCyclingHudLocationTemperature(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Location: Local time"
                      ml="md"
                      checked={config.cyclingHudLocationLocalTime}
                      onChange={e => config.setCyclingHudLocationLocalTime(e.currentTarget.checked)}
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
            <GpxSettings />
        </Stack>
    );
}
