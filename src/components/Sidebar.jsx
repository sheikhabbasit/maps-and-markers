import React, { useEffect, useState } from "react";
import { openDB } from "idb";

const DB_NAME = "GeoDataDB";
const DB_VERSION = 1;
const STORE_MARKERS = "markers";
const STORE_POLYLINES = "polylines";
const STORE_POLYGONS = "polygons";

function Sidebar() {
  const [markers, setMarkers] = useState([]);
  const [polylines, setPolylines] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(async () => {
      const db = await openDB(DB_NAME, DB_VERSION);

      const [m, pl, pg] = await Promise.all([
        db.getAll(STORE_MARKERS),
        db.getAll(STORE_POLYLINES),
        db.getAll(STORE_POLYGONS),
      ]);

      setMarkers(m);
      setPolylines(pl);
      setPolygons(pg);
      setLoading(false);
    }, 3000);
  }, []);

  const [markersExpanded, setMarkersExpanded] = useState(false);
  const [polylinesExpanded, setPolylinesExpanded] = useState(false);
  const [polygonsExpanded, setPolygonsExpanded] = useState(false);

  const toggleMarkers = () => setMarkersExpanded(!markersExpanded);
  const togglePolylines = () => setPolylinesExpanded(!polylinesExpanded);
  const togglePolygons = () => setPolygonsExpanded(!polygonsExpanded);

  return (
    <div className="w-20 p-4 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 ml-2">Stored Shapes</h2>
      {!loading ? (
        <>
          <div className="mb-4 ml-4 list">
            <h3
              className="font-medium mb-2 cursor-pointer"
              onClick={toggleMarkers}
            >
              Markers {markersExpanded ? "▼" : "►"}
            </h3>
            {markersExpanded &&
              (markers.length === 0 ? (
                <p className="text-sm text-gray-500">No markers</p>
              ) : (
                <ul className="text-sm">
                  {markers.map((m) => (
                    <li key={m.id} className="mb-1">
                      📍 <strong>{m.title}</strong> -{" "}
                      {m.position.lat.toFixed(3)}, {m.position.lng.toFixed(3)}
                    </li>
                  ))}
                </ul>
              ))}
          </div>

          <div className="mb-4 ml-4 list">
            <h3
              className="font-medium mb-2 cursor-pointer"
              onClick={togglePolylines}
            >
              Polylines {polylinesExpanded ? "▼" : "►"}
            </h3>
            {polylinesExpanded &&
              (polylines.length === 0 ? (
                <p className="text-sm text-gray-500">No polylines</p>
              ) : (
                <ul className="text-sm">
                  {polylines.map((p) => (
                    <li key={p.id} className="mb-1">
                      ➖ Length: {(p.length / 1000).toFixed(2)} km, Points:{" "}
                      {p.path.length}
                    </li>
                  ))}
                </ul>
              ))}
          </div>

          <div className="mb-4 ml-4 list">
            <h3
              className="font-medium mb-2 cursor-pointer"
              onClick={togglePolygons}
            >
              Polygons {polygonsExpanded ? "▼" : "►"}
            </h3>
            {polygonsExpanded &&
              (polygons.length === 0 ? (
                <p className="text-sm text-gray-500">No polygons</p>
              ) : (
                <ul className="text-sm">
                  {polygons.map((pg) => (
                    <li key={pg.id} className="mb-1">
                      🟦 Area: {(pg.area / 1000000).toFixed(2)} km², Points:{" "}
                      {pg.paths[0]?.length}
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Sidebar;
