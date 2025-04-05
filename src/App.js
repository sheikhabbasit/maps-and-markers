import React, { useState } from "react";
import StaticKMLLoader from "./components/KMLLoader";
import MapComponent from "./components/MapComponent";

function App() {
  const [geojson, setGeojson] = useState(null);

  return (
    <div>
      <h2>Static KML → GeoJSON → Google Map</h2>
      <StaticKMLLoader onGeoJSONLoaded={setGeojson} />
      {geojson && <MapComponent geojson={geojson} />}
    </div>
  );
}

export default App;
