import { describe, expect, it } from 'vitest';
import { getExpectedTaskAudience } from '../../functions/src/cloudTaskAuth';

describe('cloudTaskAuth', () => {
  it('builds the expected audience from host and path', () => {
    const audience = getExpectedTaskAudience({
      get(name: string) {
        if (name === 'host') return 'asia-south1-tracksy-8e30c.cloudfunctions.net';
        return undefined;
      },
      originalUrl: '/trafficAlertWorker?foo=bar',
    });

    expect(audience).toBe('https://asia-south1-tracksy-8e30c.cloudfunctions.net/trafficAlertWorker');
  });
});
