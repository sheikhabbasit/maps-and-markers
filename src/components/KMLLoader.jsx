import { useEffect } from "react";
import { openDB } from "idb";
import { DOMParser } from "@xmldom/xmldom";
import { kml } from "@tmcw/togeojson";

// Constants for the database name and version
const DB_NAME = "GeoDataDB";
const DB_VERSION = 1;

// Constants for object store names
const STORE_GEOJSON = "geojson";
const STORE_MARKERS = "markers";
const STORE_POLYLINES = "polylines";
const STORE_POLYGONS = "polygons";

// Initialize the IndexedDB with the required object stores
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object store for GeoJSON if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_GEOJSON)) {
        db.createObjectStore(STORE_GEOJSON);
      }
      // Create object store for markers with "id" as the key path
      if (!db.objectStoreNames.contains(STORE_MARKERS)) {
        db.createObjectStore(STORE_MARKERS, { keyPath: "id" });
      }
      // Create object store for polylines with "id" as the key path
      if (!db.objectStoreNames.contains(STORE_POLYLINES)) {
        db.createObjectStore(STORE_POLYLINES, { keyPath: "id" });
      }
      // Create object store for polygons with "id" as the key path
      if (!db.objectStoreNames.contains(STORE_POLYGONS)) {
        db.createObjectStore(STORE_POLYGONS, { keyPath: "id" });
      }
    },
  });
};

// Helper function to save GeoJSON data to IndexedDB
export const saveGeoJSON = async (geojson) => {
  const db = await openDB(DB_NAME, DB_VERSION);
  await db.put(STORE_GEOJSON, geojson, "data");
};

// Helper function to load GeoJSON data from IndexedDB
export const loadGeoJSON = async () => {
  const db = await openDB(DB_NAME, DB_VERSION);
  return await db.get(STORE_GEOJSON, "data");
};

// React component to load and convert KML to GeoJSON, then store it in IndexedDB
export default function StaticKMLLoader({ onGeoJSONLoaded }) {
  useEffect(() => {
    const loadAndStoreKML = async () => {
      const db = await initDB();

      // Check if GeoJSON is already stored in IndexedDB
      const alreadyStored = await db.get(STORE_GEOJSON, "data");
      if (alreadyStored) {
        console.log("Loaded GeoJSON from IndexedDB");
        onGeoJSONLoaded(alreadyStored);
        return;
      }

      try {
        // Fetch KML file
        const res = await fetch("/data/sample.kml");
        const text = await res.text();
        // Parse KML to XML
        const xml = new DOMParser().parseFromString(text, "text/xml");
        // Convert XML to GeoJSON
        const geojson = kml(xml);

        // Store converted GeoJSON in IndexedDB
        await db.put(STORE_GEOJSON, geojson, "data");
        console.log("KML converted and saved to IndexedDB");
        onGeoJSONLoaded(geojson);
      } catch (error) {
        console.error("Error loading or parsing KML:", error);
      }
    };

    loadAndStoreKML();
  }, [onGeoJSONLoaded]);

  return null;
}
