import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../core/supabase/supabase.client';
import type { DeviceLatestReading, TelemetryMetric } from '../../shared/models/db';

export type TelemetryRange = '24h' | '7d' | '14d';

/** Range -> lookback window and bucket size. The seed holds 14 days of hourly readings. */
export const RANGES: Record<TelemetryRange, { label: string; hours: number; bucket: string }> = {
  '24h': { label: '24 hours', hours: 24, bucket: '1 hour' },
  '7d': { label: '7 days', hours: 24 * 7, bucket: '3 hours' },
  '14d': { label: '14 days', hours: 24 * 14, bucket: '6 hours' },
};

export interface SeriesPoint {
  bucket: string;
  metric: TelemetryMetric;
  value: number;
}

/**
 * Telemetry reads. Shared by the devices and equipment features, so it lives in its own
 * route-less feature folder instead of being duplicated or imported across features.
 */
@Service()
export class TelemetryService {
  private readonly db = inject(SUPABASE_CLIENT);

  /** Bucketed averages from the `telemetry_series` Postgres function (RPC). */
  async series(
    deviceId: string,
    range: TelemetryRange,
    signal?: AbortSignal,
  ): Promise<SeriesPoint[]> {
    const { hours, bucket } = RANGES[range];
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();
    let request = this.db.rpc('telemetry_series', {
      p_device_id: deviceId,
      p_since: since,
      p_bucket: bucket,
    });
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  async latest(deviceId: string, signal?: AbortSignal): Promise<DeviceLatestReading[]> {
    let request = this.db.from('v_device_latest').select('*').eq('device_id', deviceId);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }
}
