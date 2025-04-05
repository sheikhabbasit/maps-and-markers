import { openDB } from "idb";
import { useEffect, useRef, useState } from "react";

const DB_NAME = "GeoDataDB";
const STORE_GEOJSON = "geojson";

/**
 * Initialize the IndexedDB and create the object store for the GeoJSON data
 */
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_GEOJSON)) {
        db.createObjectStore(STORE_GEOJSON);
      }
    },
  });
};

/**
 * Save the GeoJSON data to IndexedDB
 * @param {Array} features The GeoJSON features to be saved
 */
const saveGeoJSON = async (features) => {
  const db = await initDB();
  const geojson = {
    type: "FeatureCollection",
    features,
  };
  await db.put(STORE_GEOJSON, geojson, "data");
};

/**
 * Load the polylines from IndexedDB
 * @returns {Array} An array of polylines with their paths and lengths
 */
const loadPolylinesFromDB = async () => {
  const db = await initDB();
  const data = await db.get(STORE_GEOJSON, "data");
  if (data?.features?.length) {
    return data.features
      .filter((f) => f.geometry.type === "LineString")
      .map((f) => ({
        id: Date.now() + Math.random(),
        path: f.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
        length: 0,
      }));
  }
  return [];
};

/**
 * Hook to manage the state of the polylines and their edits
 */
export const usePolylinesController = () => {
  const [polylines, setPolylines] = useState([]);
  const [activePolyline, setActivePolyline] = useState(null);
  const polylineRefs = useRef({});
  const drawingManagerRef = useRef(null);
  const [infoPosition, setInfoPosition] = useState(null);

  /**
   * Load the polylines from IndexedDB when the component mounts
   */
  useEffect(() => {
    const load = async () => {
      const loadedPolylines = await loadPolylinesFromDB();
      setPolylines(loadedPolylines);
    };
    load();
  }, []);

  /**
   * Save the updated polylines to IndexedDB
   * @param {Array} updatedPolylines The updated polylines with their paths and lengths
   */
  const syncToDB = (updatedPolylines) => {
    const features = updatedPolylines.map((line) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: line.path.map(({ lat, lng }) => [lng, lat]),
      },
      properties: { length: line.length },
    }));
    saveGeoJSON(features);
  };

  /**
   * Handle edits to a polyline
   * @param {string} id The ID of the polyline to be edited
   */
  const handlePolylineEdit = (id) => {
    const polylineObj = polylineRefs.current[id];
    if (!polylineObj || typeof polylineObj.getPath !== "function") {
      console.warn("Polyline is not loaded or getPath is missing");
      return;
    }

    const newPath = polylineObj
      .getPath()
      .getArray()
      .map((latlng) => ({
        lat: latlng.lat(),
        lng: latlng.lng(),
      }));

    const length = window.google.maps.geometry.spherical.computeLength(
      polylineObj.getPath()
    );

    if (length > 2000) {
      alert("Polyline exceeds 2km!");
    }

    setPolylines((prev) => {
      const updated = prev.map((line) =>
        line.id === id ? { ...line, path: newPath, length } : line
      );
      syncToDB(updated);
      return updated;
    });
  };
  return {
    polylines,
    setPolylines,
    handlePolylineEdit,
    activePolyline,
    setActivePolyline,
    polylineRefs,
    drawingManagerRef,
    infoPosition,
    setInfoPosition,
    syncToDB,
  };
};
