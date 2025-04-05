import { DrawingManager, InfoWindow, Polyline } from "@react-google-maps/api";
import React from "react";
import { usePolylinesController } from "../controllers/PolylinesController";

function Polylines() {
  const {
    polylines,
    setPolylines,
    handlePolylineEdit,
    activePolyline,
    setActivePolyline,
    polylineRefs,
    drawingManagerRef,
    infoPosition,
    syncToDB,
    setInfoPosition,
  } = usePolylinesController();
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
