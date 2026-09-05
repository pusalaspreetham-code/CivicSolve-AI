import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Location } from "../types/problem";

// Fix default marker icons (Vite + Leaflet asset path issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MarkerData {
  location: Location;
  title: string;
  severity?: string;
  reportCount?: number;
  locationCount?: number;
  problemId?: number;
  onView?: (id: number) => void;
}

interface Props {
  markers: MarkerData[];
  height?: string;
}

const FitBounds = ({ markers }: { markers: MarkerData[] }) => {
  const map = useMap();

  useEffect(() => {
    const valid = markers.filter((m) => m.location && !isNaN(m.location.latitude) && !isNaN(m.location.longitude));
    if (valid.length === 0) return;

    if (valid.length === 1) {
      map.setView([valid[0].location.latitude, valid[0].location.longitude], 15);
    } else {
      const bounds = L.latLngBounds(valid.map((m) => [m.location.latitude, m.location.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, map]);

  return null;
};

const ProblemMap = ({ markers, height = "400px" }: Props) => {
  const valid = markers.filter((m) => m.location && !isNaN(m.location.latitude) && !isNaN(m.location.longitude));

  const defaultCenter: [number, number] =
    valid.length > 0 ? [valid[0].location.latitude, valid[0].location.longitude] : [20.5937, 78.9629]; // India fallback

  if (valid.length === 0) {
    return (
      <div
        style={{ height }}
        className="rounded-xl border border-slate-200 flex items-center justify-center text-sm text-slate-400 bg-slate-50"
      >
        No location data available for this problem yet.
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={valid} />
        {valid.map((m, idx) => (
          <Marker key={idx} position={[m.location.latitude, m.location.longitude]}>
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{m.title}</p>
                {m.severity && <p>Severity: {m.severity}</p>}
                {typeof m.reportCount === "number" && typeof m.locationCount === "number" && (
                  <p>
                    {m.reportCount} citizen report{m.reportCount === 1 ? "" : "s"} from {m.locationCount} location
                    {m.locationCount === 1 ? "" : "s"}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Problem reported here
                  <br />
                  Lat: {m.location.latitude.toFixed(5)}, Lng: {m.location.longitude.toFixed(5)}
                </p>
                {m.problemId && m.onView && (
                  <button
                    onClick={() => m.onView && m.onView(m.problemId as number)}
                    className="text-brand-600 font-medium underline text-xs"
                  >
                    View Problem
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ProblemMap;
