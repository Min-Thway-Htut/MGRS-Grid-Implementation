import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { forward as toMGRS, inverse as fromMGRS } from 'mgrs'; // Also need inverse conversion

const MapWithMGRSOverlay = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const API_KEY = process.env.REACT_APP_MAPTILER_API_KEY;

  useEffect(() => {
    if (!API_KEY) {
      console.error('Missing MapTiler API Key!');
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${API_KEY}`,
      center: [96.137044, 20.4315],
      zoom: 8,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('mgrs-grid', {
        type: 'geojson',
        data: generateMGRSGrid(map),
      });

      map.addLayer({
        id: 'mgrs-squares',
        type: 'fill',
        source: 'mgrs-grid',
        paint: {
          'fill-color': '#121212',
          'fill-opacity': 0.2,
          'fill-outline-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'mgrs-labels',
        type: 'symbol',
        source: 'mgrs-grid',
        layout: {
          'text-field': ['get', 'mgrs'],
          'text-size': 10,
          'text-offset': [0, 0],
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      map.on('moveend', () => {
        const source = map.getSource('mgrs-grid');
        if (source) {
          source.setData(generateMGRSGrid(map));
        }
      });
    });

    return () => {
      map.remove();
    };
  }, [API_KEY]);

  const generateMGRSGrid = (map) => {
    const bounds = map.getBounds();
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();

    const features = [];
    const step = calculateStep(map.getZoom());

    for (let lat = Math.floor(minLat); lat <= Math.ceil(maxLat); lat += step) {
      for (let lng = Math.floor(minLng); lng <= Math.ceil(maxLng); lng += step) {
        try {
          const mgrsCode = toMGRS([lng, lat]);
          const [lngCenter, latCenter] = fromMGRS(mgrsCode);

          const halfStep = step / 2;
          const square = [
            [
              [lngCenter - halfStep, latCenter - halfStep],
              [lngCenter + halfStep, latCenter - halfStep],
              [lngCenter + halfStep, latCenter + halfStep],
              [lngCenter - halfStep, latCenter + halfStep],
              [lngCenter - halfStep, latCenter - halfStep], // Close the polygon
            ],
          ];

          features.push({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: square,
            },
            properties: {
              mgrs: mgrsCode,
            },
          });
        } catch (err) {
          console.warn('MGRS conversion error at', lng, lat, err);
        }
      }
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  };

  const calculateStep = (zoom) => {
    if (zoom > 10) return 0.1;
    if (zoom > 7) return 0.5;
    if (zoom > 5) return 1;
    return 2;
  };

  return <div ref={mapContainer} style={{ width: '100%', height: '600px' }} />;
};

export default MapWithMGRSOverlay;
