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

        <Card withBorder>
          <Card.Section p="md" withBorder>
            <Group justify="space-between" align="center">
              <Text fw={500}>Channel Selection</Text>
              <Select
                placeholder={channelsLoading ? "Loading channels..." : channelsError ? "Error loading channels" : "Select a channel"}
                data={availableChannels.length > 0 ? availableChannels.map(channel => ({ value: channel, label: channel })) : []}
                value={selectedChannel}
                onChange={(value) => setSelectedChannel(value || '')}
                w={200}
                disabled={channelsLoading || !!channelsError || availableChannels.length === 0}
              />
            </Group>
          </Card.Section>

          {channelsError && (
            <Card.Section>
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                title="Error Loading Channels" 
                color="red"
                variant="light"
                m="md"
              >
                <Text>{channelsError}</Text>
              </Alert>
            </Card.Section>
          )}

          {selectedChannel && (
            <Card.Section>
              <div style={{ position: 'relative' }}>
                <LoadingOverlay visible={loading} />
                
                {error && (
                  <Alert 
                    icon={<IconAlertCircle size="1rem" />} 
                    title="Error Loading Analytics" 
                    color="red"
                    variant="light"
                    m="md"
                  >
                    <Text>{error}</Text>
                    <Button 
                      size="xs" 
                      variant="light" 
                      mt="xs"
                      onClick={() => fetchAnalytics(selectedChannel)}
                    >
                      Try Again
                    </Button>
                  </Alert>
                )}

                {!error && !loading && !analyticsData && (
                  <Alert 
                    icon={<IconCalendar size="1rem" />} 
                    title="No Data Available" 
                    color="blue"
                    variant="light"
                    m="md"
                  >
                    <Text>No analytics data available for the selected channel and time period.</Text>
                  </Alert>
                )}

                {!error && analyticsData && (
                  <Stack gap="md" p="md">
                    {analyticsData.summary && (
                      <div>
                        <Text fw={500} mb="md">Summary Statistics (Last 7 Days)</Text>
                        <Grid>
                          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <StatCard
                              title="Peak Viewers"
                              value={formatNumber(analyticsData.summary.peak_viewers)}
                              icon={<IconTrendingUp size="1.5rem" color="var(--mantine-color-blue-6)" />}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <StatCard
                              title="Avg Viewers"
                              value={formatNumber(Math.round(analyticsData.summary.avg_viewers))}
                              icon={<IconTrendingUp size="1.5rem" color="var(--mantine-color-green-6)" />}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <StatCard
                              title="Total Messages"
                              value={formatNumber(analyticsData.summary.total_messages)}
                              icon={<IconChartBar size="1.5rem" color="var(--mantine-color-orange-6)" />}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <StatCard
                              title="Total Subs"
                              value={formatNumber(analyticsData.summary.total_subs)}
                              icon={<IconTrendingUp size="1.5rem" color="var(--mantine-color-purple-6)" />}
                            />
                          </Grid.Col>
                        </Grid>
                      </div>
                    )}

                    {analyticsData.data && analyticsData.data.length > 0 && (
                      <div>
                        <Text fw={500} mb="md">Analytics Chart</Text>
                        <StreamAnalyticsChart 
                          channel={selectedChannel} admin
                        />
                      </div>
                    )}

                    {analyticsData.metadata_changes && analyticsData.metadata_changes.length > 0 && (
                      <div>
                        <Text fw={500} mb="md">Recent Changes</Text>
                        <Card withBorder>
                          <Stack gap="xs" p="md">
                            {analyticsData.metadata_changes.slice(0, 5).map((change, index) => (
                              <Group key={index} justify="space-between">
                                <div>
                                  <Text size="sm" fw={500}>
                                    {change.change_type === 'title' ? 'Title' : 'Category'} Changed
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    From: {change.old_value} → To: {change.new_value}
                                  </Text>
                                </div>
                                <Text size="xs" c="dimmed">
                                  {new Date(change.timestamp * 1000).toLocaleString()}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        </Card>
                      </div>
                    )}
                  </Stack>
                )}
              </div>
            </Card.Section>
          )}

          {!selectedChannel && (
            <Card.Section>
              <Alert 
                icon={<IconChartBar size="1rem" />} 
                title="Select a Channel" 
                color="blue"
                variant="light"
                m="md"
              >
                <Text>Please select a channel from the dropdown above to view analytics data.</Text>
              </Alert>
            </Card.Section>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
