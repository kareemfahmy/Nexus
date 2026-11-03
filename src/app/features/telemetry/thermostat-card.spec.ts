import { TestBed } from '@angular/core/testing';
import type { DeviceLatestReading } from '../../shared/models/db';
import { TelemetryService } from './telemetry.service';
import { ThermostatCard } from './thermostat-card';

function reading(
  metric: DeviceLatestReading['metric'],
  value: number,
  minutesAgo = 5,
): DeviceLatestReading {
  return {
    device_id: 'd1',
    metric,
    value,
    recorded_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

async function render(rows: DeviceLatestReading[]) {
  TestBed.configureTestingModule({
    providers: [{ provide: TelemetryService, useValue: { latest: () => Promise.resolve(rows) } }],
  });
  const fixture = TestBed.createComponent(ThermostatCard);
  fixture.componentRef.setInput('deviceId', 'd1');
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ThermostatCard', () => {
  it('derives Cooling when the room is above the cooling setpoint', async () => {
    const el = await render([
      reading('room_temp_f', 75.2),
      reading('cooling_setpoint_f', 72),
      reading('heating_setpoint_f', 68),
      reading('humidity_pct', 48),
    ]);
    expect(el.textContent).toContain('75.2');
    expect(el.textContent).toContain('Cooling');
    expect(el.textContent).toContain('Occupied schedule');
    expect(el.textContent).not.toContain('Stale');
  });

  it('flags readings older than 30 minutes as stale and shows the unoccupied schedule', async () => {
    const el = await render([
      reading('room_temp_f', 70, 90),
      reading('cooling_setpoint_f', 78, 90),
      reading('heating_setpoint_f', 62, 90),
    ]);
    expect(el.textContent).toContain('Idle');
    expect(el.textContent).toContain('Unoccupied schedule');
    expect(el.textContent).toContain('Stale');
  });

  it('explains when a thermostat has never reported', async () => {
    const el = await render([]);
    expect(el.textContent).toContain('No readings received');
  });
});
