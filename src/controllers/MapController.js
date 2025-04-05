import { useLoadScript } from "@react-google-maps/api";
import { openDB } from "idb";
import { useEffect, useRef, useState } from "react";

const DB_NAME = "GeoDataDB";
const STORE_MARKERS = "markers";

// Initialize the IndexedDB with the required object stores
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    // When the database is created or updated, create the object store
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_MARKERS)) {
        db.createObjectStore(STORE_MARKERS, { keyPath: "id" });
      }
    },
  });
};

// Main hook to manage the map and its markers
export const useMapController = ({ geojson }) => {
  // Load the Google Maps JavaScript API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY,
    libraries: ["geometry", "drawing"],
  });

  // State variables:
  // - markers: the list of markers on the map
  // - selectedMarker: the currently selected marker
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Reference to the map component
  const mapRef = useRef();

  // When the component mounts, load the markers from the database or the geojson
  useEffect(() => {
    const loadFromDB = async () => {
      const db = await initDB();
      const allMarkers = await db.getAll(STORE_MARKERS);
      if (allMarkers.length > 0) {
        setMarkers(allMarkers);
      } else if (geojson) {
        // Extract the markers from the geojson
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

  // Add a new marker to the database when the user clicks on the map
  const addMarkerToIndexedDB = async (marker) => {
    const db = await initDB();
    await db.put(STORE_MARKERS, marker);
  };

  // Handle the click event on the map
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

  // Handle the drag end event on a marker
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

  return {
    isLoaded,
    markers,
    selectedMarker,
    setSelectedMarker,
    mapRef,
    onMapClick,
    onMarkerDragEnd,
  };
};
