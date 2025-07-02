import React, { useState, useEffect, useContext } from 'react';
import {
  Stack,
  Text,
  Fieldset,
  Select,
  Group,
  Button,
  Alert,
  LoadingOverlay,
  Card,
  Grid,
  Badge,
  Paper,
  alpha
} from '@mantine/core';
import { CompositeChart } from '@mantine/charts';
import { IconInfoCircle, IconTrendingUp, IconUsers, IconMessage, IconGift, IconBolt, IconClock, IconCalendar } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import { AnalyticsApiClient, StreamAnalyticsData, StreamAnalyticsSummary, StreamInfo, fillMissingTimestamps, normalizeAnalyticsData } from '@/api/analytics';
import { useChannels } from '@/hooks/useChannels';

interface ChartDataPoint {
  timestamp: string;
  time: string;
  viewer_count: number | null;
  message_count: number;
  sub_count: number;
  cheer_count: number;
  cheer_bits_total: number;
  raid_count: number;
  raid_viewers_total: number;
  follow_count: number;
}


export function StreamAnalyticsChart(props: {channel?: string, admin: boolean}) {
  const premium = useContext(PremiumContext);
  const { channels, loading: channelsLoading } = useChannels();
  
  const [selectedChannel, setSelectedChannel] = useState<string>(props.channel || '');
  const [loading, setLoading] = useState(false);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<StreamAnalyticsSummary | null>(null);
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>('');

  const getLast30DaysRange = () => {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    return { start: thirtyDaysAgo, end: now };
  };

  const formatTimestamp = (timestamp: number, streamDuration: number): string => {
    const date = new Date(timestamp * 1000);
    
    // For streams shorter than 6 hours, show time with minutes
    if (streamDuration < 6 * 60) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      // For longer streams, show date and hour
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit',
        hour12: false 
      });
    }
  };

  const transformData = (rawData: StreamAnalyticsData[], streamDuration: number): ChartDataPoint[] => {
    return rawData.map(item => {
      // Convert timestamp to number if it's a string
      const timestamp = typeof item.timestamp_minute === 'string' 
        ? parseInt(item.timestamp_minute, 10) 
        : item.timestamp_minute;
      
      return {
        timestamp: timestamp.toString(),
        time: formatTimestamp(timestamp, streamDuration),
        viewer_count: item.viewer_count,
        message_count: item.message_count,
        sub_count: item.sub_count,
        cheer_count: item.cheer_count,
        cheer_bits_total: item.cheer_bits_total,
        raid_count: item.raid_count,
        raid_viewers_total: item.raid_viewers_total,
        follow_count: item.follow_count
      };
    });
  };

  const fetchStreams = async (channelName: string) => {
    if (!channelName) return;

    setStreamsLoading(true);
    setError(null);

    try {
      const { start, end } = getLast30DaysRange();
      const response = await AnalyticsApiClient.getStreams(channelName, start, end);

      if (response.success && response.streams) {
        setStreams(response.streams);
        // Auto-select the most recent stream if available
        if (response.streams.length > 0) {
          const mostRecentStream = response.streams[0];
          // Use ID if available, otherwise use start timestamp as identifier
          const streamId = mostRecentStream.id
            ? mostRecentStream.id.toString() 
            : `active_${mostRecentStream.start_timestamp}`;
          setSelectedStream(streamId);
        }
      } else {
        console.error('Failed to fetch streams data:', response);
        setStreams([]);
      }
    } catch (err) {
      console.error('Error fetching streams:', err);
      setStreams([]);
    } finally {
      setStreamsLoading(false);
    }
  };

  const fetchAnalytics = async (streamId: string) => {
    if (!selectedChannel || !streamId) return;

    if (!premium.isPremium && !props.admin) {
      console.error('Premium subscription required for analytics');
      return;
    }

    const token = localStorage.getItem('hehe-token_state') || '';
    setLoading(true);
    setError(null);

    try {
      // Find stream by matching the identifier format
      const selectedStreamData = streams.find(s => {
        const currentStreamId = s.id
          ? s.id.toString() 
          : `active_${s.start_timestamp}`;
        return currentStreamId === streamId;
      });

      if (!selectedStreamData) {
        console.error('Selected stream not found:', streamId);
        return;
      }

      // Determine appropriate interval based on stream duration
      let interval: '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '12h' | '1d' = '1h';
      const durationMinutes = selectedStreamData.duration_seconds / 60;
      
      if (durationMinutes <= 60) {
        interval = '1m';
      } else if (durationMinutes <= 180) {
        interval = '5m';
      } else if (durationMinutes <= 360) {
        interval = '15m';
      } else if (durationMinutes <= 720) {
        interval = '30m';
      } else {
        interval = '1h';
      }

      const response = await AnalyticsApiClient.getStreamAnalytics(
        selectedChannel,
        token,
        selectedStreamData.start_timestamp,
        selectedStreamData.end_timestamp,
        interval,
        true,
        false
      );

      if (response.success) {
        console.log('Raw API response data:', response.data);
        
        // Normalize the data to ensure consistent types
        const normalizedData = normalizeAnalyticsData(response.data);
        console.log('Normalized data:', normalizedData);
        
        // Fill missing timestamps with zero values for better chart visualization
        const filledData = fillMissingTimestamps(
          normalizedData,
          selectedStreamData.start_timestamp,
          selectedStreamData.end_timestamp,
          interval
        );
        console.log('Filled data:', filledData);
        
        const transformedData = transformData(filledData, durationMinutes);
        console.log('Transformed data for chart:', transformedData);
        
        setData(transformedData);
        setSummary(response.summary || null);
      } else {
        console.error('Failed to fetch analytics data:', response);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch streams when channel changes
  useEffect(() => {
    if (selectedChannel) {
      fetchStreams(selectedChannel);
    }
  }, [selectedChannel]);

  // Fetch analytics when stream changes
  useEffect(() => {
    if (selectedStream) {
      fetchAnalytics(selectedStream);
    }
  }, [selectedStream, selectedChannel]);

  // Set initial channel if provided via props
  useEffect(() => {
    if (props.channel && !selectedChannel) {
      setSelectedChannel(props.channel);
    }
  }, [props.channel]);

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <Alert icon={<IconInfoCircle size={16} />} title="No Data" color="blue">
          No analytics data available for the selected stream.
        </Alert>
      );
    }

    return (
      <CompositeChart
        h={400}
        data={data}
        dataKey="time"
        withLegend={true}
        legendProps={{ verticalAlign: 'bottom', height: 50 }}
        withRightYAxis
        yAxisLabel="Viewers / Messages"
        rightYAxisLabel="Subs / Bits / Follows"
        series={[
          { name: 'viewer_count', label: 'Viewers', color: 'blue.6', type: 'line' },
          { name: 'message_count', label: 'Messages', color: 'green.6', type: 'area' },
          { name: 'sub_count', label: 'Subs', color: 'violet.6', type: 'bar', yAxisId: 'right' },
          { name: 'cheer_count', label: 'Bits', color: 'orange.6', type: 'bar', yAxisId: 'right' },
          { name: 'follow_count', label: 'Follows', color: 'pink.6', type: 'bar', yAxisId: 'right' }
        ]}
      />
    );
  };

  const renderSummaryCards = () => {
    if (!summary) return null;

    // Calculate messages per minute
    const messagesPerMinute = summary.total_minutes > 0 
      ? (summary.total_messages / summary.total_minutes).toFixed(1)
      : '0.0';

    return (
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card withBorder>
            <Group>
              <IconUsers size={24} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="xs" c="dimmed">Average Viewers</Text>
                <Text size="lg" fw={700}>{summary.avg_viewers.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card withBorder>
            <Group>
              <IconTrendingUp size={24} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="xs" c="dimmed">Peak Viewers</Text>
                <Text size="lg" fw={700}>{summary.peak_viewers.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card withBorder>
            <Group>
              <IconMessage size={24} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="xs" c="dimmed">Total Messages</Text>
                <Text size="lg" fw={700}>{summary.total_messages.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card withBorder>
            <Group>
              <IconMessage size={24} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="xs" c="dimmed">Messages/Min</Text>
                <Text size="lg" fw={700}>{messagesPerMinute}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card withBorder>
            <Group>
              <IconBolt size={24} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="xs" c="dimmed">Total Bits</Text>
                <Text size="lg" fw={700}>{summary.total_bits.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card withBorder>
            <Group>
              <IconGift size={24} color="var(--mantine-color-violet-6)" />
              <div>
                <Text size="xs" c="dimmed">Total Subs</Text>
                <Text size="lg" fw={700}>{summary.total_subs.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card withBorder>
            <Group>
              <IconUsers size={24} color="var(--mantine-color-pink-6)" />
              <div>
                <Text size="xs" c="dimmed">Total Follows</Text>
                <Text size="lg" fw={700}>{summary.total_follows?.toLocaleString() || '0'}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    );
  };

  const renderStreamInfo = () => {
    // Find stream by matching the identifier format
    const selectedStreamData = streams.find(s => {
      const currentStreamId = s.id
        ? s.id.toString() 
        : `active_${s.start_timestamp}`;
      return currentStreamId === selectedStream;
    });

    if (!selectedStreamData) return null;

    const formatDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDate = (timestamp: number) => {
      return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <Card withBorder mb="md">
        <Group justify="space-between">
          <div>
            <Group gap="xs" mb="xs">
              <Text fw={600} size="lg">{selectedStreamData.title}</Text>
              {selectedStreamData.id === null && (
                <Badge color="red" variant="filled" size="sm">LIVE</Badge>
              )}
            </Group>
            <Group gap="xs" mt="xs">
              <Badge leftSection={<IconCalendar size={12} />} variant="light">
                {formatDate(selectedStreamData.start_timestamp)}
              </Badge>
              <Badge leftSection={<IconClock size={12} />} variant="light">
                {formatDuration(selectedStreamData.duration_seconds)}
              </Badge>
              <Badge leftSection={<IconUsers size={12} />} variant="light">
                Peak: {selectedStreamData.peak_viewers.toLocaleString()}
              </Badge>
              <Badge leftSection={<IconMessage size={12} />} variant="light">
                {selectedStreamData.total_messages.toLocaleString()} messages
              </Badge>
            </Group>
          </div>
        </Group>
      </Card>
    );
  };

  if (!premium.isPremium && !props.admin) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} title="Premium Required" color="yellow">
        Stream analytics are only available for HeheChat Pro subscribers.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Fieldset legend="Stream Analytics" variant="filled">
        <Stack gap="md">
          {/* Channel and Stream Selection */}
          <Group>
            <Select
              label="Channel"
              placeholder="Select a channel"
              value={selectedChannel}
              onChange={(value) => {
                setSelectedChannel(value || '');
                setSelectedStream('');
                setStreams([]);
                setData([]);
                setSummary(null);
              }}
              data={channels.length > 0 ? channels.map(channel => ({ value: channel, label: channel })) : []}
              searchable
              w={200}
              disabled={channelsLoading}
            />
            
            <Select
              label="Stream"
              placeholder="Select a stream"
              value={selectedStream}
              onChange={(value) => setSelectedStream(value || '')}
              data={[...streams].reverse().map(stream => {
                // Use ID if available, otherwise use start timestamp as identifier
                const streamId = stream.id 
                  ? stream.id.toString() 
                  : `active_${stream.start_timestamp}`;
                
                // Add indicator for active streams (null ID)
                const streamLabel = stream.id === null 
                  ? `${stream.title} (${new Date(stream.start_timestamp * 1000).toLocaleDateString()}) - LIVE`
                  : `${stream.title} (${new Date(stream.start_timestamp * 1000).toLocaleDateString()})`;
                
                return {
                  value: streamId,
                  label: streamLabel
                };
              })}
              searchable
              w={400}
              disabled={!selectedChannel || streamsLoading || streams.length === 0}
            />
            
            <Button 
              onClick={() => selectedChannel && fetchStreams(selectedChannel)} 
              loading={streamsLoading}
              disabled={!selectedChannel}
              mt="auto"
            >
              Refresh Streams
            </Button>
          </Group>

          {/* Loading States */}
          {streamsLoading && (
            <Alert icon={<IconInfoCircle size={16} />} title="Loading" color="blue">
              Loading streams for the last 30 days...
            </Alert>
          )}

          {/* Stream Info */}
          {renderStreamInfo()}

          {/* Summary Cards */}
          {renderSummaryCards()}

          {/* Chart */}
          {selectedStream && (
            <Card withBorder pos="relative">
              <LoadingOverlay visible={loading} />
              {renderChart()}
            </Card>
          )}

          {/* No Stream Selected */}
          {!selectedStream && selectedChannel && streams.length === 0 && !streamsLoading && (
            <Alert icon={<IconInfoCircle size={16} />} title="No Streams" color="blue">
              No streams found for the selected channel in the last 30 days.
            </Alert>
          )}
        </Stack>
      </Fieldset>
    </Stack>
  );
}
