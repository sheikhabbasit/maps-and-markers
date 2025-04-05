import React, { useEffect, useRef, useState } from "react";
import { DrawingManager, InfoWindow, Polygon } from "@react-google-maps/api";
import { openDB } from "idb";

const DB_NAME = "GeoDataDB";
const STORE_POLYGONS = "polygons";

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_POLYGONS)) {
        db.createObjectStore(STORE_POLYGONS, { keyPath: "id" });
      }
    },
  });
};

export default function Polygons() {
  const [polygons, setPolygons] = useState([]);
  const [activePolygon, setActivePolygon] = useState(null);
  const [infoPosition, setInfoPosition] = useState(null);
  const polygonRefs = useRef({});

  useEffect(() => {
    const loadPolygons = async () => {
      const db = await initDB();
      const allPolygons = await db.getAll(STORE_POLYGONS);
      setPolygons(allPolygons);
    };

    loadPolygons();
  }, []);

  const savePolygonToDB = async (polygon) => {
    const db = await initDB();
    await db.put(STORE_POLYGONS, polygon);
  };

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

  return (
    <>
      <DrawingManager
        onPolygonComplete={handlePolygonComplete}
        options={{
          drawingControl: true,
          drawingControlOptions: {
            drawingModes: ["polygon"],
          },
        }}
      />

      {polygons.map((polygon) => (
        <Polygon
          key={polygon.id}
          path={polygon.path}
          editable
          onLoad={(poly) => {
            polygonRefs.current[polygon.id] = poly;
            window.google.maps.event.addListener(poly.getPath(), "set_at", () =>
              handlePolygonEdit(polygon.id)
            );
            window.google.maps.event.addListener(
              poly.getPath(),
              "insert_at",
              () => handlePolygonEdit(polygon.id)
            );
          }}
          onClick={(e) => {
            setActivePolygon(polygon);
            setInfoPosition(e.latLng);
          }}
          options={{
            strokeColor: "#0000FF",
            fillColor: "#00AAFF",
            fillOpacity: 0.4,
          }}
        />
      ))}

      {activePolygon && infoPosition && (
        <InfoWindow
          position={infoPosition}
          onCloseClick={() => {
            setActivePolygon(null);
            setInfoPosition(null);
          }}
        >
          <div>
            <strong>Polygon Info</strong>
            <br />
            Area: {(activePolygon.area / 1000000).toFixed(2)} sq km
            <br />
            Points: {activePolygon.path.length}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
