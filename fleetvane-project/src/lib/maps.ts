'use client';

/**
 * Track B — Single Google Maps initialization point.
 *
 * Uses the js-api-loader v2 FUNCTIONAL API (setOptions + importLibrary);
 * the Loader class is deprecated in v2.
 *
 * Guarantees:
 *  - The API key is read exactly ONCE from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 *  - setOptions() is called exactly once, before the first library import.
 *  - Missing key / failed load REJECT loudly — callers must surface the error
 *    onscreen, never swallow it.
 */

import type { APIOptions } from '@googlemaps/js-api-loader';

export function isGoogleMapsKeyConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return typeof apiKey === 'string' && apiKey.length > 0 && !apiKey.startsWith('your_');
}

let loaderPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (!isGoogleMapsKeyConfigured()) {
    return Promise.reject(
      new Error(
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing or is still a placeholder value. ' +
        'Add the real key to fleetvane-project/.env and restart the dev server.'
      )
    );
  }

  if (!loaderPromise) {
    const options: APIOptions = {
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
      v: 'weekly',
    };
    loaderPromise = import('@googlemaps/js-api-loader')
      .then(async ({ setOptions, importLibrary }) => {
        // Must precede the first importLibrary call — enforced by this singleton.
        setOptions(options);
        // Importing 'maps' bootstraps window.google.maps for Map/Polyline/TrafficLayer.
        return (await importLibrary('maps')) as unknown as typeof google.maps;
      })
      .catch((err) => {
        // Reset so a later retry can attempt a fresh load (e.g. transient network fail).
        loaderPromise = null;
        throw err instanceof Error ? err : new Error(String(err));
      });
  }
  return loaderPromise;
}

/** Native traffic layer factory — caller owns bind/unbind lifecycle. */
export function createTrafficLayer(): google.maps.TrafficLayer {
  if (!window.google?.maps) {
    throw new Error('Google Maps must be initialized before creating a TrafficLayer.');
  }
  return new window.google.maps.TrafficLayer();
}
