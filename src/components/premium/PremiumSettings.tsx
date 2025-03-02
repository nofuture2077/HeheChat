import React, { useContext, useState, useEffect } from 'react';
import { Stack, Title, Tabs, Text, Group, Divider } from '@mantine/core';
import { IconCrown, IconTicket, IconBrandPaypal, IconHistory } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import { PremiumDetails } from './PremiumDetails';
import { RedeemCode } from './RedeemCode';
import { PayPalSubscription } from './PayPalSubscription';
import classes from './Premium.module.css';

export const PremiumSettings: React.FC = () => {
  const premium = useContext(PremiumContext);
  const [activeTab, setActiveTab] = useState<string | null>('redeem');
  const [refreshKey, setRefreshKey] = useState(0);

  // Set initial tab based on premium status
  useEffect(() => {
    setActiveTab(premium.isPremium ? 'details' : 'redeem');
  }, [premium.isPremium]);

  const handleSuccess = () => {
    // Force a refresh of the premium details
    setRefreshKey(prev => prev + 1);
    // Switch to the details tab to show the updated subscription
    setActiveTab('details');
  };

  return (
    <Stack key={refreshKey} gap="md">
      <Group justify="space-between" mt="md">
        <Title order={3} className={classes.premiumDetailsHeader}>
          <IconCrown className={classes.premiumIcon} size={24} />
          HeheChat Pro
        </Title>
      </Group>

      {!premium.isPremium && (
        <>
          <Text>
            Upgrade to HeheChat Pro to unlock premium features and support the development of HeheChat.
          </Text>

          <div className={classes.premiumFeatureList}>
            <Text fw={600} mb="xs">Premium Features:</Text>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>Support HeheChat</li>
              <li>Pro Features</li>
            </ul>
          </div>

          <Divider my="sm" />
        </>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          {premium.isPremium ? (
            <>
              <Tabs.Tab value="details" leftSection={<IconCrown size="0.8rem" />}>
                Status
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size="0.8rem" />}>
                History
              </Tabs.Tab>
            </>
          ) : (
            <>
              <Tabs.Tab value="redeem" leftSection={<IconTicket size="0.8rem" />}>
                Redeem
              </Tabs.Tab>
              <Tabs.Tab value="paypal" leftSection={<IconBrandPaypal size="0.8rem" />}>
                Buy
              </Tabs.Tab>
            </>
          )}
        </Tabs.List>

        {premium.isPremium ? (
          <>
            <Tabs.Panel value="details" pt="xs">
              <PremiumDetails />
            </Tabs.Panel>
            <Tabs.Panel value="history" pt="xs">
              <Text>Subscription history will be displayed here.</Text>
            </Tabs.Panel>
          </>
        ) : (
          <>
            <Tabs.Panel value="redeem" pt="xs">
              <RedeemCode onSuccess={handleSuccess} />
            </Tabs.Panel>
            <Tabs.Panel value="paypal" pt="xs">
              <PayPalSubscription onSuccess={handleSuccess} />
            </Tabs.Panel>
          </>
        )}
      </Tabs>
    </Stack>
  );
};
