import React from "react";
import { DrawingManager, InfoWindow, Polygon } from "@react-google-maps/api";
import { usePolygonController } from "../controllers/PolygonController";

export default function Polygons() {
  const {
    polygons,
    activePolygon,
    setActivePolygon,
    infoPosition,
    setInfoPosition,
    polygonRefs,
    handlePolygonEdit,
    handlePolygonComplete,
  } = usePolygonController();

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
