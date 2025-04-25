import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

export default function Map(){
    const mapContainer = useRef(null);
    const map = useRef(null);
    const lng = 96.137044;
    const lat = 20.4315;
    const zoom = 14;
    const API_KEY = process.env.REACT_APP_MAPTILER_API_KEY;

    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`,
            center: [lng, lat],
            zoom: zoom
        });

    }, [API_KEY, lng, lat, zoom]);

    return (
        <div className="map-wrap">
            <div ref={mapContainer} className="map"/>
        </div>
    )
}