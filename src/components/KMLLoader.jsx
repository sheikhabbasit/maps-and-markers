import { useEffect } from "react";
import { openDB } from "idb";
import { DOMParser } from "@xmldom/xmldom";
import { kml } from "@tmcw/togeojson";

const DB_NAME = "GeoDataDB";
const DB_VERSION = 1;

const STORE_GEOJSON = "geojson";
const STORE_MARKERS = "markers";
const STORE_POLYLINES = "polylines";
const STORE_POLYGONS = "polygons";

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_GEOJSON)) {
        db.createObjectStore(STORE_GEOJSON);
      }
      if (!db.objectStoreNames.contains(STORE_MARKERS)) {
        db.createObjectStore(STORE_MARKERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_POLYLINES)) {
        db.createObjectStore(STORE_POLYLINES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_POLYGONS)) {
        db.createObjectStore(STORE_POLYGONS, { keyPath: "id" });
      }
    },
  });
};

// GeoJSON helpers
export const saveGeoJSON = async (geojson) => {
  const db = await openDB(DB_NAME, DB_VERSION);
  await db.put(STORE_GEOJSON, geojson, "data");
};

export const loadGeoJSON = async () => {
  const db = await openDB(DB_NAME, DB_VERSION);
  return await db.get(STORE_GEOJSON, "data");
};

// Optional: You can add similar helpers for markers, polylines, polygons if needed

export default function StaticKMLLoader({ onGeoJSONLoaded }) {
  useEffect(() => {
    const loadAndStoreKML = async () => {
      const db = await initDB();

      const alreadyStored = await db.get(STORE_GEOJSON, "data");
      if (alreadyStored) {
        console.log("Loaded GeoJSON from IndexedDB");
        onGeoJSONLoaded(alreadyStored);
        return;
      }

      try {
        const res = await fetch("/data/sample.kml");
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const geojson = kml(xml);

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
