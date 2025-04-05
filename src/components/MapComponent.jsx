import React from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import Polylines from "./Polylines";
import Polygons from "./Polygons";
import { useMapController } from "../controllers/MapController";

const containerStyle = {
  width: "100%",
  height: "500px",
};

export default function MapComponent({ geojson }) {
  const {
    isLoaded,
    markers,
    selectedMarker,
    setSelectedMarker,
    mapRef,
    onMapClick,
    onMarkerDragEnd,
  } = useMapController({ geojson });

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markers[0]?.position || { lat: 20, lng: 78 }}
      zoom={5}
      onClick={onMapClick}
      onLoad={(map) => (mapRef.current = map)}
    >
      {markers.map((marker, index) => (
        <Marker
          key={marker.id}
          position={marker.position}
          draggable
          onClick={() => setSelectedMarker(marker)}
          onDragEnd={(e) => onMarkerDragEnd(index, e)}
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div>
            <h4>{selectedMarker.title}</h4>
            <p>{selectedMarker.description}</p>
          </div>
        </InfoWindow>
      )}
      <Polylines />
      <Polygons />
    </GoogleMap>
  );
}
