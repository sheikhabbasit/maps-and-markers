import { useEffect } from "react";
import { openDB } from "idb";
import { DOMParser } from "@xmldom/xmldom";
import { kml } from "@tmcw/togeojson";

const DB_NAME = "GeoDataDB";
const STORE_NAME = "geojson";

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export default function StaticKMLLoader({ onGeoJSONLoaded }) {
  useEffect(() => {
    const loadAndStoreKML = async () => {
      const db = await initDB();

      const alreadyStored = await db.get(STORE_NAME, "data");
      if (alreadyStored) {
        console.log("Loaded GeoJSON from IndexedDB");
        console.log(alreadyStored);
        onGeoJSONLoaded(alreadyStored);
        return;
      }

      try {
        const res = await fetch("/data/sample.kml");
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const geojson = kml(xml);

        await db.put(STORE_NAME, geojson, "data");
        console.log("KML converted and saved to IndexedDB");
        console.log(geojson);
        onGeoJSONLoaded(geojson);
      } catch (error) {
        console.error("Error loading or parsing KML:", error);
      }
    };

    loadAndStoreKML();
  }, [onGeoJSONLoaded]);

  return null; // No UI
}
