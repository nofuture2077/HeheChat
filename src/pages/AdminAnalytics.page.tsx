import { Container, Title, Text, Button, Alert, Stack, Select, Card, Group, LoadingOverlay, Grid } from '@mantine/core';
import { IconChartBar, IconAlertCircle, IconCalendar, IconTrendingUp } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { AnalyticsApiClient, StreamAnalyticsResponse } from '../api/analytics';
import { StreamAnalyticsChart } from '../components/analytics/StreamAnalyticsChart';
import { useChannels } from '../hooks/useChannels';

export function AdminAnalyticsPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<StreamAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { channels, loading: channelsLoading, error: channelsError } = useChannels();
  
  // Channels are already strings from the API
  const availableChannels = channels || [];

  const fetchAnalytics = async (channel: string) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!channel) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get analytics for the last 7 days
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (7 * 24 * 60 * 60); // 7 days ago
      
      const data = await AnalyticsApiClient.getStreamAnalytics(
        channel,
        adminToken,
        startTime,
        endTime,
        '1h',
        true,
        true
      );
      
      setAnalyticsData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      fetchAnalytics(selectedChannel);
    }
  }, [selectedChannel]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <Card withBorder p="md">
      <Group justify="space-between">
        <div>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed">
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </div>
        {icon}
      </Group>
    </Card>
  );

  return (
    <Container size="xl">
      <Stack gap="md">
        <div>
          <Title order={2}>
            <Group gap="xs">
              <IconChartBar size="1.5rem" />
              Analytics Dashboard
            </Group>
          </Title>
          <Text c="dimmed" size="sm">
            View detailed analytics for HeheChat channels
          </Text>
        </div>

        <StreamAnalyticsChart admin={true} />
      </Stack>
    </Container>
  );
}
