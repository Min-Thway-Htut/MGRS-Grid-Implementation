import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import { forward as toMGRS, inverse as fromMGRS } from 'mgrs';

export default function Map() {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const API_KEY = process.env.REACT_APP_MAPTILER_API_KEY;

    useEffect(() => {
        if (!API_KEY) {
            console.error('Missing MapTiler API Key!');
            return;
        }

        if (!mapContainer.current) {
            console.error('Map container is not yet available.');
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/hybrid/style.json?key=${API_KEY}`,
            center: [131.4907, 33.2845],
            zoom: 16,
        });

        mapRef.current = map;

        map.on('load', () => {
            const updateGrid = () => {
                const geojson = generateMGRSGrid(map);
                if (map.getSource('mgrs-grid')) {
                    map.getSource('mgrs-grid').setData(geojson);
                } else {
                    map.addSource('mgrs-grid', {
                        type: 'geojson',
                        data: geojson,
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
                }
            };

            updateGrid();
            map.on('moveend', updateGrid);
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

                    const square = [[
                        [lngCenter - halfStep, latCenter - halfStep],
                        [lngCenter + halfStep, latCenter - halfStep],
                        [lngCenter + halfStep, latCenter + halfStep],
                        [lngCenter - halfStep, latCenter + halfStep],
                        [lngCenter - halfStep, latCenter - halfStep],
                    ]];

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
        if (zoom > 15) return 0.002;
        if (zoom > 12) return 0.01;
        if (zoom > 10) return 0.05;
        if (zoom > 8) return 0.1;
        if (zoom > 6) return 0.2;
        return 0.5;
    };

    return (
        <div className='map-wrap'>
            <div ref={mapContainer} className="map" />
        </div>
    );
}
