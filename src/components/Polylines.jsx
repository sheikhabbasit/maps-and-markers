import { DrawingManager, InfoWindow, Polyline } from "@react-google-maps/api";
import React from "react";
import { usePolylinesController } from "../controllers/PolylinesController";

/**
 * This component renders all polylines and provides event listeners for editing them.
 */
function Polylines() {
  const {
    // All polylines in the state.
    polylines,
    // Setter for the polylines state.
    setPolylines,
    // Handles changes to a polyline.
    handlePolylineEdit,
    // The currently active polyline.
    activePolyline,
    // Setter for the active polyline.
    setActivePolyline,
    // A ref containing all the Polyline objects.
    polylineRefs,
    // A ref for the DrawingManager.
    drawingManagerRef,
    // The position where the info window should appear.
    infoPosition,
    // Setter for the info window position.
    setInfoPosition,
    // Function to save the polylines to IndexedDB.
    syncToDB,
  } = usePolylinesController();

  return (
    <>
      {/* DrawingManager renders a drawing control that allows the user to draw a polyline. */}
      <DrawingManager
        ref={drawingManagerRef}
        onPolylineComplete={(polyline) => {
          // Get the path of the newly created polyline.
          const path = polyline
            .getPath()
            .getArray()
            .map((latLng) => ({
              lat: latLng.lat(),
              lng: latLng.lng(),
            }));

          // Calculate the length of the polyline.
          const length = window.google.maps.geometry.spherical.computeLength(
            polyline.getPath()
          );

          // Check if the polyline exceeds 2km.
          if (length > 2000) {
            alert("Polyline exceeds 2km!");
          }

          // Create a new polyline object with the path and length.
          const newPolyline = {
            id: Date.now(),
            path,
            length,
          };

          // Add the new polyline to the state.
          setPolylines((prev) => {
            const updated = [...prev, newPolyline];
            syncToDB(updated);
            return updated;
          });

          // Remove the temporary drawing.
          polyline.setMap(null);
        }}
        options={{
          // Show a drawing control.
          drawingControl: true,
          // Only allow polyline drawing.
          drawingControlOptions: {
            drawingModes: ["polyline"],
          },
        }}
      />

      {/* Render all polylines. */}
      {polylines.map((line) => (
        <Polyline
          key={line.id}
          path={line.path}
          editable // Allow the polyline to be edited.
          onLoad={(polylineObj) => {
            // Add the polyline object to the ref.
            polylineRefs.current[line.id] = polylineObj;

            // Listen for changes to the path.
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
          }}
          onClick={(e) => {
            // Set the active polyline when a polyline is clicked.
            setActivePolyline(line);
            // Set the position for the info window.
            setInfoPosition(e.latLng);
          }}
          options={{
            // Set the polyline options.
            strokeColor: "#FF0000", // Set the color to red.
            strokeWeight: 2, // Set the weight to 2.
          }}
        />
      ))}

      {/* Render the info window when an active polyline is selected. */}
      {activePolyline && infoPosition && (
        <InfoWindow
          position={infoPosition}
          onCloseClick={() => {
            // Close the info window when it is closed.
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
