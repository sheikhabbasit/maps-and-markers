import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";

export default function MapComponent({ geojson }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyA-QsaYVgb1esLz5frlHZRQz_AUEJrfW7o",
  });

  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (geojson) {
      const extracted = geojson.features
        .filter((f) => f.geometry.type === "Point")
        .map((f, idx) => ({
          id: idx,
          position: {
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          },
        }));
      setMarkers(extracted);
    }
  }, [geojson]);

  const onMarkerDragEnd = (index, e) => {
    const newMarkers = [...markers];
    newMarkers[index].position = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
    setMarkers(newMarkers);
  };

  const deleteMarker = (index) => {
    setMarkers((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "500px" }}
      center={markers[0]?.position || { lat: 20, lng: 78 }}
      zoom={5}
    >
      {markers.map((marker, index) => (
        <Marker
          key={marker.id}
          position={marker.position}
          draggable
          onDragEnd={(e) => onMarkerDragEnd(index, e)}
          onRightClick={() => deleteMarker(index)}
        />
      ))}
    </GoogleMap>
  );
}
