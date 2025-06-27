const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface StreamAnalyticsData {
  timestamp_minute: number;
  viewer_count: number | null;
  message_count: number;
  sub_count: number;
  cheer_count: number;
  cheer_bits_total: number;
  raid_count: number;
  raid_viewers_total: number;
  follow_count: number;
}

export interface StreamAnalyticsSummary {
  total_minutes: number;
  avg_viewers: number;
  peak_viewers: number;
  total_messages: number;
  total_subs: number;
  total_bits: number;
}

export interface StreamMetadataChange {
  timestamp: number;
  change_type: 'title' | 'category';
  old_value: string;
  new_value: string;
}

export interface StreamAnalyticsResponse {
  success: boolean;
  channel: string;
  start_time: number;
  end_time: number;
  interval: string;
  data: StreamAnalyticsData[];
  summary?: StreamAnalyticsSummary;
  metadata_changes?: StreamMetadataChange[];
}

export interface ActiveStreamSession {
  channel: string;
  stream_start_time: number;
  current_title: string;
  current_category: string;
  last_viewer_count: number;
  last_updated: number;
}

export interface DateRangeResponse {
  success: boolean;
  channel: string;
  earliest_data: number;
  latest_data: number;
}

/**
 * API client for stream analytics operations
 */
export class AnalyticsApiClient {
  /**
   * Get stream analytics data
   * @param token Authentication token
   * @param start Start timestamp (Unix seconds)
   * @param end End timestamp (Unix seconds)
   * @param interval Aggregation interval
   * @param summary Include summary statistics
   * @param metadata Include metadata changes
   * @returns Stream analytics data
   */
  static async getStreamAnalytics(
    channelname: string,
    token: string,
    start: number,
    end: number,
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '12h' | '1d' = '1h',
    summary: boolean = true,
    metadata: boolean = false
  ): Promise<StreamAnalyticsResponse> {
    const params = new URLSearchParams({
      channelname,
      token: encodeURIComponent(token),
      start: start.toString(),
      end: end.toString(),
      interval,
      summary: summary.toString(),
      metadata: metadata.toString()
    });

    const response = await fetch(`${API_BASE_URL}/api/analytics/stream?${params}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stream analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get active stream session information
   * @param token Authentication token
   * @returns Active stream session data
   */
  static async getActiveStreamSession(token: string): Promise<ActiveStreamSession | null> {
    const response = await fetch(`${API_BASE_URL}/analytics/active-streams?token=${encodeURIComponent(token)}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch active stream session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.session || null;
  }

  /**
   * Get available date range of analytics data
   * @param token Authentication token
   * @returns Date range information
   */
  static async getDateRange(token: string): Promise<DateRangeResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/date-range?token=${encodeURIComponent(token)}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch date range: ${response.statusText}`);
    }

    return response.json();
  }
}
