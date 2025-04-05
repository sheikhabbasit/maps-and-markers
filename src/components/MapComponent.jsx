import React from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import Polylines from "./Polylines";
import Polygons from "./Polygons";
import { useMapController } from "../controllers/MapController";

// Styles for the map container
const containerStyle = {
  width: "100%",
  height: "500px",
};

// The main MapComponent
export default function MapComponent({ geojson }) {
  // Get the map controller with the geojson
  const {
    isLoaded, // Whether the map is loaded
    markers, // The markers on the map
    selectedMarker, // The selected marker
    setSelectedMarker, // The function to set the selected marker
    mapRef, // The map reference
    onMapClick, // The function to call when the map is clicked
    onMarkerDragEnd, // The function to call when a marker is dragged
  } = useMapController({ geojson });

  // If the map is not loaded, show a loading message
  if (!isLoaded) return <div>Loading map...</div>;

  // Render the map
  return (
    <GoogleMap
      // The style of the map container
      mapContainerStyle={containerStyle}
      // The center of the map
      center={markers[0]?.position || { lat: 20, lng: 78 }}
      // The zoom level of the map
      zoom={5}
      // The function to call when the map is clicked
      onClick={onMapClick}
      // The function to call when the map is loaded
      onLoad={(map) => (mapRef.current = map)}
    >
      {/* Loop through the markers and render them */}
      {markers.map((marker, index) => (
        <Marker
          // The key of the marker
          key={marker.id}
          // The position of the marker
          position={marker.position}
          // Whether the marker is draggable
          draggable
          // The function to call when the marker is clicked
          onClick={() => setSelectedMarker(marker)}
          // The function to call when the marker is dragged
          onDragEnd={(e) => onMarkerDragEnd(index, e)}
        />
      ))}

      {/* If there is a selected marker, render an info window */}
      {selectedMarker && (
        <InfoWindow
          // The position of the info window
          position={selectedMarker.position}
          // The function to call when the info window is closed
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div>
            {/* The title of the marker */}
            <h4>{selectedMarker.title}</h4>
            {/* The description of the marker */}
            <p>{selectedMarker.description}</p>
          </div>
        </InfoWindow>
      )}

      {/* Render the polylines */}
      <Polylines />
      {/* Render the polygons */}
      <Polygons />
    </GoogleMap>
  );
}
