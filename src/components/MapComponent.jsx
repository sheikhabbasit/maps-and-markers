import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { openDB } from "idb";
import Polylines from "./Polylines";
import Polygons from "./Polygons";

const DB_NAME = "GeoDataDB";
const STORE_MARKERS = "markers";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_MARKERS)) {
        db.createObjectStore(STORE_MARKERS, { keyPath: "id" });
      }
    },
  });
};

export default function MapComponent({ geojson }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY,
    libraries: ["geometry", "drawing"],
  });

  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const mapRef = useRef();

  useEffect(() => {
    const loadFromDB = async () => {
      const db = await initDB();
      const allMarkers = await db.getAll(STORE_MARKERS);
      if (allMarkers.length > 0) {
        setMarkers(allMarkers);
      } else if (geojson) {
        const extracted = geojson.features
          .filter((f) => f.geometry.type === "Point")
          .map((f, idx) => ({
            id: idx,
            position: {
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            },
            title: f.properties.name || `Marker ${idx + 1}`,
            description: f.properties.description || "",
          }));
        setMarkers(extracted);
        // Optionally: also store initial markers in IndexedDB
        for (let marker of extracted) {
          await db.put(STORE_MARKERS, marker);
        }
      }
    };

    loadFromDB();
  }, [geojson]);

  const addMarkerToIndexedDB = async (marker) => {
    const db = await initDB();
    await db.put(STORE_MARKERS, marker);
  };

  const onMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const title = prompt("Enter marker title:");
    const description = prompt("Enter description:");

    if (title) {
      const newMarker = {
        id: Date.now(),
        position: { lat, lng },
        title,
        description,
      };

      setMarkers((prev) => [...prev, newMarker]);
      await addMarkerToIndexedDB(newMarker);
    }
  };

  const onMarkerDragEnd = async (index, e) => {
    const updatedMarkers = [...markers];
    updatedMarkers[index].position = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
    setMarkers(updatedMarkers);

    // Also update in DB
    const db = await initDB();
    await db.put(STORE_MARKERS, updatedMarkers[index]);
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markers[0]?.position || { lat: 20, lng: 78 }}
      zoom={5}
      onClick={onMapClick}
      onLoad={(map) => (mapRef.current = map)}
    >
      {markers.map((marker, index) => (
        <Marker
          key={marker.id}
          position={marker.position}
          draggable
          onClick={() => setSelectedMarker(marker)}
          onDragEnd={(e) => onMarkerDragEnd(index, e)}
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div>
            <h4>{selectedMarker.title}</h4>
            <p>{selectedMarker.description}</p>
          </div>
        </InfoWindow>
      )}
      <Polylines />
      <Polygons />
    </GoogleMap>
  );
}
