import React from "react";
import { DrawingManager, InfoWindow, Polygon } from "@react-google-maps/api";
import { usePolygonController } from "../controllers/PolygonController";

// This component renders all polygons and provides event listeners for editing them.
export default function Polygons() {
  const {
    // All polygons in the state.
    polygons,
    // The currently active polygon.
    activePolygon,
    // Setter for the active polygon.
    setActivePolygon,
    // The position where the info window should appear.
    infoPosition,
    // Setter for the info window position.
    setInfoPosition,
    // A ref containing all the Polygon objects.
    polygonRefs,
    // Handles changes to a polygon.
    handlePolygonEdit,
    // Handles the completion of a new polygon.
    handlePolygonComplete,
  } = usePolygonController();

  return (
    <>
      <DrawingManager
        // Called when the user completes a polygon.
        onPolygonComplete={handlePolygonComplete}
        options={{
          // Show a drawing control.
          drawingControl: true,
          // Only allow polygon drawing.
          drawingControlOptions: {
            drawingModes: ["polygon"],
          },
        }}
      />

      {polygons.map((polygon) => (
        <Polygon
          key={polygon.id}
          // The path of the polygon.
          path={polygon.path}
          // Allow the polygon to be edited.
          editable
          // Called when the polygon is loaded.
          onLoad={(poly) => {
            // Add the polygon object to the ref.
            polygonRefs.current[polygon.id] = poly;
            // Listen for changes to the path.
            window.google.maps.event.addListener(poly.getPath(), "set_at", () =>
              handlePolygonEdit(polygon.id)
            );
            // Listen for insertions into the path.
            window.google.maps.event.addListener(
              poly.getPath(),
              "insert_at",
              () => handlePolygonEdit(polygon.id)
            );
          }}
          // Called when the polygon is clicked.
          onClick={(e) => {
            // Set the active polygon.
            setActivePolygon(polygon);
            // Set the position of the info window.
            setInfoPosition(e.latLng);
          }}
          options={{
            // The color of the polygon border.
            strokeColor: "#0000FF",
            // The fill color of the polygon.
            fillColor: "#00AAFF",
            // The opacity of the fill color.
            fillOpacity: 0.4,
          }}
        />
      ))}

      {activePolygon && infoPosition && (
        <InfoWindow
          // The position of the info window.
          position={infoPosition}
          // Called when the info window is closed.
          onCloseClick={() => {
            // Reset the active polygon.
            setActivePolygon(null);
            // Reset the info window position.
            setInfoPosition(null);
          }}
        >
          <div>
            <strong>Polygon Info</strong>
            <br />
            {/* The area of the polygon in square kilometers. */}
            Area: {(activePolygon.area / 1000000).toFixed(2)} sq km
            <br />
            {/* The number of points in the polygon. */}
            Points: {activePolygon.path.length}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
