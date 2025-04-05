import { openDB } from "idb";
import { useEffect, useRef, useState } from "react";

// Constants for the database name and object store name
const DB_NAME = "GeoDataDB";
const STORE_POLYGONS = "polygons";

// Initialize the IndexedDB with the required object store
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Create object store for polygons with "id" as the key path
      if (!db.objectStoreNames.contains(STORE_POLYGONS)) {
        db.createObjectStore(STORE_POLYGONS, { keyPath: "id" });
      }
    },
  });
};

// Hook to manage the state of the polygons and their edits
export const usePolygonController = () => {
  // State variables:
  // - polygons: the list of polygons on the map
  // - activePolygon: the currently active polygon
  // - infoPosition: the position of the info window
  const [polygons, setPolygons] = useState([]);
  const [activePolygon, setActivePolygon] = useState(null);
  const [infoPosition, setInfoPosition] = useState(null);

  // Reference to the polygon objects
  const polygonRefs = useRef({});

  // When the component mounts, load the polygons from the database
  useEffect(() => {
    const loadPolygons = async () => {
      const db = await initDB();
      const allPolygons = await db.getAll(STORE_POLYGONS);
      setPolygons(allPolygons);
    };

    loadPolygons();
  }, []);

  // Save a polygon to the database
  const savePolygonToDB = async (polygon) => {
    const db = await initDB();
    await db.put(STORE_POLYGONS, polygon);
  };

  // Handle edits to a polygon
  const handlePolygonEdit = (id) => {
    const poly = polygonRefs.current[id];
    if (!poly || typeof poly.getPath !== "function") return;

    const path = poly
      .getPath()
      .getArray()
      .map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));

    const area = window.google.maps.geometry.spherical.computeArea(
      poly.getPath()
    );

    if (area > 1_000_000) {
      alert("Polygon exceeds 1 sq km!");
    }

    const updated = { id, path, area };

    setPolygons((prev) => prev.map((p) => (p.id === id ? updated : p)));
    savePolygonToDB(updated);
  };

  // Handle the completion of a new polygon
  const handlePolygonComplete = (poly) => {
    const path = poly
      .getPath()
      .getArray()
      .map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));

    const area = window.google.maps.geometry.spherical.computeArea(
      poly.getPath()
    );

    if (area > 1_000_000) {
      alert("Polygon exceeds 1 sq km!");
    }

    const newPolygon = {
      id: Date.now(),
      path,
      area,
    };

    setPolygons((prev) => [...prev, newPolygon]);
    savePolygonToDB(newPolygon);
    poly.setMap(null);
  };
  return {
    polygons,
    activePolygon,
    setActivePolygon,
    infoPosition,
    setInfoPosition,
    polygonRefs,
    handlePolygonEdit,
    handlePolygonComplete,
  };
};
