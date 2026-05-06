import { Tabs, ScrollArea } from '@mantine/core';
import { IconSettings, IconList, IconKey } from '@tabler/icons-react';
import { useContext } from 'react';
import { PremiumContext } from '@/ApplicationContext';
import { ProviderConfigTab } from '../switcher/ProviderConfigTab';
import { RulesTab } from '../switcher/RulesTab';
import { TokenTab } from '../switcher/TokenTab';
import { PremiumRequired } from '../switcher/PremiumRequired';

export function SwitcherSettings() {
    const premium = useContext(PremiumContext);

    return (
        <Tabs defaultValue="provider" mt={12}>
            <Tabs.List>
                <Tabs.Tab value="provider" leftSection={<IconSettings size={14} />}>Provider</Tabs.Tab>
                <Tabs.Tab value="rules" leftSection={<IconList size={14} />}>Rules</Tabs.Tab>
                <Tabs.Tab value="token" leftSection={<IconKey size={14} />}>Token</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="provider">
                {premium.isPremium ? <ProviderConfigTab /> : <PremiumRequired />}
            </Tabs.Panel>
            <Tabs.Panel value="rules">
                {premium.isPremium ? <RulesTab /> : <PremiumRequired />}
            </Tabs.Panel>
            <Tabs.Panel value="token">
                {premium.isPremium ? <TokenTab /> : <PremiumRequired />}
            </Tabs.Panel>
        </Tabs>
    );
}
