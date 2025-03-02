import React, { useContext, useEffect, useState } from 'react';
import { Card, Text, Title, Group, Stack, Divider, Loader } from '@mantine/core';
import { IconCrown, IconCalendar, IconClock } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import classes from './Premium.module.css';

interface PremiumDetailsProps {
  compact?: boolean;
}

export const PremiumDetails: React.FC<PremiumDetailsProps> = ({ compact = false }) => {
  const premium = useContext(PremiumContext);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const result = await premium.getPremiumDetails();
        setDetails(result);
      } catch (error) {
        console.error('Error loading premium details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [premium]);

  if (loading) {
    return (
      <div className={classes.premiumDetails}>
        <Group justify="center" p="md">
          <Loader size="sm" />
          <Text size="sm">Loading premium details...</Text>
        </Group>
      </div>
    );
  }

  if (!details || !premium.isPremium) {
    return (
      <div className={classes.premiumDetails}>
        <Text>No active subscription</Text>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={classes.premiumDetails}>
        <Card className={classes.premiumDetailsCard} p="sm">
          <Group>
            <IconCrown className={classes.premiumIcon} size={18} />
            <Text fw={600}>HeheChat Pro</Text>
            <Text size="sm" c="dimmed">
              {premium.expiresAt
                ? `Expires: ${new Date(premium.expiresAt).toLocaleDateString()}`
                : 'Active'}
            </Text>
          </Group>
        </Card>
      </div>
    );
  }

  return (
    <div className={classes.premiumDetails}>
      <Card className={classes.premiumDetailsCard} p="md">
        <div className={classes.premiumDetailsHeader}>
          <IconCrown className={classes.premiumIcon} size={24} />
          <Title order={4}>HeheChat Pro Subscription</Title>
        </div>
        
        <Divider my="sm" />
        
        <Stack gap="xs">
          <Group>
            <Text fw={500}>Status:</Text>
            <Text>{premium.status || 'Active'}</Text>
          </Group>
          
          <Group>
            <Text fw={500}>Type:</Text>
            <Text>{premium.subscriptionType || 'Standard'}</Text>
          </Group>
          
          {premium.expiresAt && (
            <>
              <Group>
                <Text fw={500}>Expires:</Text>
                <Group gap="xs">
                  <IconCalendar size={16} />
                  <Text>{new Date(premium.expiresAt).toLocaleDateString()}</Text>
                </Group>
              </Group>
              
              {premium.daysRemaining !== null && (
                <Group>
                  <Text fw={500}>Days remaining:</Text>
                  <Group gap="xs">
                    <IconClock size={16} />
                    <Text>{premium.daysRemaining}</Text>
                  </Group>
                </Group>
              )}
            </>
          )}
        </Stack>
      </Card>
    </div>
  );
};
