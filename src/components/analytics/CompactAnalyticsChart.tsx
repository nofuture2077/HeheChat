import React, { useState, useEffect, useContext } from 'react';
import { CompositeChart } from '@mantine/charts';
import { Text, Stack, Alert, LoadingOverlay, Box } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import { AnalyticsApiClient, StreamAnalyticsData, fillMissingTimestamps, normalizeAnalyticsData } from '@/api/analytics';

interface CompactChartDataPoint {
  time: string;
  viewer_count: number | null;
  message_count: number;
  sub_count: number;
  cheer_bits_total: number;
}

interface CompactAnalyticsChartProps {
  channels: string[];
  height?: number;
}

export function CompactAnalyticsChart({ channels, height = 120 }: CompactAnalyticsChartProps) {
  const premium = useContext(PremiumContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompactChartDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    return localStorage.getItem('hehe-token_state') || '';
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const transformData = (rawData: StreamAnalyticsData[]): CompactChartDataPoint[] => {
    return rawData.slice(-12).map(item => {
      // Convert timestamp to number if it's a string
      const timestamp = typeof item.timestamp_minute === 'string' 
        ? parseInt(item.timestamp_minute, 10) 
        : item.timestamp_minute;
      
      return {
        time: formatTimestamp(timestamp),
        viewer_count: item.viewer_count || 0,
        message_count: item.message_count,
        sub_count: item.sub_count,
        cheer_bits_total: item.cheer_bits_total
      };
    });
  };

  const fetchAnalytics = async () => {
    if (!premium.isPremium || channels.length === 0) {
      return;
    }

    const token = getToken();
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now - 12 * 60 * 60; // Last 12 hours
      
      const response = await AnalyticsApiClient.getStreamAnalytics(
        "",
        token,
        start,
        now,
        '1h',
        false,
        false
      );

      if (response.success && response.data.length > 0) {
        // Normalize the data to ensure consistent types
        const normalizedData = normalizeAnalyticsData(response.data);
        
        // Fill missing timestamps with zero values for better chart visualization
        const filledData = fillMissingTimestamps(
          normalizedData,
          start,
          now,
          '1h'
        );
        const transformedData = transformData(filledData);
        setData(transformedData);
      } else {
        setData([]);
      }
    } catch (err) {
      setError('Failed to load analytics');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (premium.isPremium && channels.length > 0) {
      fetchAnalytics();
      // Refresh every 5 minutes
      const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [premium.isPremium, channels]);

  if (!premium.isPremium) {
    return null;
  }

  if (error) {
    return (
      <Alert icon={<IconInfoCircle size={12} />} color="red">
        {error}
      </Alert>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <Text size="xs" c="dimmed" ta="center">
        No recent analytics data
      </Text>
    );
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      <Stack gap="xs">
        <Text size="xs" fw={500} c="dimmed">Recent Activity</Text>
        {data.length > 0 && (
          <CompositeChart
            h={height}
            data={data}
            dataKey="time"
            withLegend={false}
            withTooltip={true}
            series={[
              { name: 'viewer_count', label: 'Viewers', color: 'blue.6', type: 'line' },
              { name: 'message_count', label: 'Messages', color: 'green.6', type: 'bar' },
              { name: 'sub_count', label: 'Subs', color: 'purple.6', type: 'bar' }
            ]}
          />
        )}
      </Stack>
    </Box>
  );
}
