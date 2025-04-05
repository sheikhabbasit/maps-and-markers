import React, { useState } from "react";
import StaticKMLLoader from "./components/KMLLoader";
import MapComponent from "./components/MapComponent";
import { saveAs } from "file-saver";
import tokml from "tokml";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const [geojson, setGeojson] = useState(null);

  const downloadKML = (geojson) => {
    const kmlData = tokml(geojson);
    const blob = new Blob([kmlData], {
      type: "application/vnd.google-earth.kml+xml",
    });
    saveAs(blob, "converted.kml");
  };

  return (
    <div>
      <h2 className="ml-2">Static KML → GeoJSON → Google Map</h2>
      <div className="app-container">
        <Sidebar />
        <div className="w-80">
          {geojson && <MapComponent geojson={geojson} />}
          <button
            className="download-button"
            onClick={() => downloadKML(geojson)}
          >
            Download KML
          </button>
          <StaticKMLLoader onGeoJSONLoaded={setGeojson} />
        </div>
      </div>
    </div>
  );
}

export default App;
