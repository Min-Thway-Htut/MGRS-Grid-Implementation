import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./secondMap.css";

export default function SecondMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const API_KEY = process.env.REACT_APP_MAPTILER_API_KEY;


  const zoomSteps = [ 4, 15.5];
  const [zoomIndex, setZoomIndex] = useState(3);

  useEffect(() => {
    if (!API_KEY || !mapContainer.current) {
      console.error("Missing MapTiler API Key!");
      return;
    }

    

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${API_KEY}`,
      center: [131.4907, 33.2845],
      zoom: zoomSteps[zoomIndex],
    });

    mapRef.current = map;

   map.addControl(new maplibregl.ScaleControl({unit: 'metric'}));

   return () => {
    map.remove();
   };
  }, [API_KEY]);

  const handleZoom = (direction) => {
    if (!mapRef.current) return;

    let newIndex = zoomIndex;

    if (direction === "in" && zoomIndex < zoomSteps.length - 1) {
        newIndex++;
    }else if (direction === "out" && zoomIndex > 0) {
        newIndex--;
    }

    if (newIndex !== zoomIndex) {
        setZoomIndex(newIndex);
        mapRef.current.zoomTo(zoomSteps[newIndex], {duration: 500});
    }
  };

  return (
    <div className="map-wrapper">
        <div ref={mapContainer} className="map-container"/>

        <div className="custom-zoom-controls">
            <button onClick={() => handleZoom("in")}>+</button>
            <button onClick={() => handleZoom("out")}>-</button>
        </div>
    </div>
  )
}
