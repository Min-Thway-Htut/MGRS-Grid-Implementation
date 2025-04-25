import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { forward as toMGRS, toPoint } from 'mgrs'; // Correct named imports

const MapWithMGRSOverlay = () => {
  const mapContainer = useRef(null);
  const API_KEY = process.env.REACT_APP_MAPTILER_API_KEY;

  useEffect(() => {
    // Initialize the MapLibre map
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${API_KEY}`,
      center: [0, 0],
      zoom: 2,
    });

    // Add MapTier raster tile layer
    map.on('load', () => {
      map.addSource('maptier', {
        type: 'raster',
        tiles: ['https://tiles.maptier.com/{z}/{x}/{y}.png'], // Replace with your actual MapTier tile URL
        tileSize: 256,
      });

      map.addLayer({
        id: 'maptier-layer',
        type: 'raster',
        source: 'maptier',
        paint: {
          'raster-opacity': 1,
        },
      });

      // Add MGRS overlay
      const gridGeoJSON = generateMGRSGrid(map);
      map.addSource('mgrs-grid', {
        type: 'geojson',
        data: gridGeoJSON,
      });

      map.addLayer({
        id: 'mgrs-points',
        type: 'circle',
        source: 'mgrs-grid',
        paint: {
          'circle-radius': 3,
          'circle-color': '#FF0000',
        },
      });

      map.addLayer({
        id: 'mgrs-labels',
        type: 'symbol',
        source: 'mgrs-grid',
        layout: {
          'text-field': ['get', 'mgrs'],
          'text-size': 10,
        },
        paint: {
          'text-color': '#fff',
        },
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  // Generate basic MGRS point grid (sampled, not full grid lines)
  const generateMGRSGrid = (map) => {
    const bounds = map.getBounds();
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();

    const features = [];

    const step = 5; // Step in degrees — increase for performance, decrease for density

    for (let lat = Math.floor(minLat); lat <= Math.ceil(maxLat); lat += step) {
      for (let lng = Math.floor(minLng); lng <= Math.ceil(maxLng); lng += step) {
        try {
          const mgrs = toMGRS([lng, lat]);
          const [lon, latBack] = toPoint(mgrs);
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lon, latBack],
            },
            properties: {
              mgrs,
            },
          });
        } catch (err) {
          console.warn('MGRS conversion error:', err);
        }
      }
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  };

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
};

export default MapWithMGRSOverlay;
