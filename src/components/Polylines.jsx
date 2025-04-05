import { DrawingManager, InfoWindow, Polyline } from "@react-google-maps/api";
import React, { useRef, useState, useEffect } from "react";
import { openDB } from "idb";

const DB_NAME = "GeoDataDB";
const STORE_GEOJSON = "geojson";

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_GEOJSON)) {
        db.createObjectStore(STORE_GEOJSON);
      }
    },
  });
};

const saveGeoJSON = async (features) => {
  const db = await initDB();
  const geojson = {
    type: "FeatureCollection",
    features,
  };
  await db.put(STORE_GEOJSON, geojson, "data");
};

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

function Polylines() {
  const [polylines, setPolylines] = useState([]);
  const [activePolyline, setActivePolyline] = useState(null);
  const polylineRefs = useRef({});
  const drawingManagerRef = useRef(null);
  const [infoPosition, setInfoPosition] = useState(null);

  useEffect(() => {
    const load = async () => {
      const loadedPolylines = await loadPolylinesFromDB();
      setPolylines(loadedPolylines);
    };
    load();
  }, []);

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

  return (
    <>
      <DrawingManager
        ref={drawingManagerRef}
        onPolylineComplete={(polyline) => {
          const path = polyline
            .getPath()
            .getArray()
            .map((latLng) => ({
              lat: latLng.lat(),
              lng: latLng.lng(),
            }));

          const length = window.google.maps.geometry.spherical.computeLength(
            polyline.getPath()
          );

          if (length > 2000) {
            alert("Polyline exceeds 2km!");
          }

          const newPolyline = {
            id: Date.now(),
            path,
            length,
          };

          setPolylines((prev) => {
            const updated = [...prev, newPolyline];
            syncToDB(updated);
            return updated;
          });
          polyline.setMap(null); // remove temporary drawing
        }}
        options={{
          drawingControl: true,
          drawingControlOptions: {
            drawingModes: ["polyline"],
          },
        }}
      />

      {polylines.map((line) => (
        <Polyline
          key={line.id}
          path={line.path}
          editable
          onLoad={(polylineObj) => {
            if (polylineObj?.getPath) {
              polylineRefs.current[line.id] = polylineObj;

              window.google.maps.event.addListener(
                polylineObj.getPath(),
                "set_at",
                () => handlePolylineEdit(line.id)
              );
              window.google.maps.event.addListener(
                polylineObj.getPath(),
                "insert_at",
                () => handlePolylineEdit(line.id)
              );
            } else {
              console.warn("Polyline not loaded properly");
            }
          }}
          onClick={(e) => {
            setActivePolyline(line);
            setInfoPosition(e.latLng);
          }}
          options={{ strokeColor: "#FF0000", strokeWeight: 2 }}
        />
      ))}

      {activePolyline && infoPosition && (
        <InfoWindow
          position={infoPosition}
          onCloseClick={() => {
            setActivePolyline(null);
            setInfoPosition(null);
          }}
        >
          <div>
            <strong>Polyline Info</strong>
            <br />
            Length: {(activePolyline.length / 1000).toFixed(2)} km
            <br />
            Points: {activePolyline.path.length}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default Polylines;
