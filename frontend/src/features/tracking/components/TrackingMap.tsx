import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface TrackingMapProps {
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  agentLat?: number;
  agentLng?: number;
  status: string;
}

export function TrackingMap({
  pickupLat = 18.9500, // Default to Mumbai
  pickupLng = 72.8300,
  dropLat = 19.1000,
  dropLng = 72.9000,
  agentLat,
  agentLng,
  status
}: TrackingMapProps) {
  // Mock Agent Movement if backend GPS is not available but status is active
  const [mockAgent, setMockAgent] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (agentLat && agentLng) {
      setMockAgent([agentLat, agentLng]);
      return;
    }

    // Mock movement if agent is moving and we have no real GPS
    if (["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05;
        if (progress > 1) progress = 1;
        
        const lat = pickupLat + (dropLat - pickupLat) * progress;
        const lng = pickupLng + (dropLng - pickupLng) * progress;
        setMockAgent([lat, lng]);

        if (progress === 1) clearInterval(interval);
      }, 3000); // Update every 3s
      return () => clearInterval(interval);
    }
  }, [agentLat, agentLng, status, pickupLat, pickupLng, dropLat, dropLng]);

  const agentPosition = mockAgent || (agentLat && agentLng ? [agentLat, agentLng] as [number, number] : null);

  const center: [number, number] = [(pickupLat + dropLat) / 2, (pickupLng + dropLng) / 2];

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={11} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[pickupLat, pickupLng]}>
          <Popup>Pickup Location</Popup>
        </Marker>

        <Marker position={[dropLat, dropLng]}>
          <Popup>Destination Location</Popup>
        </Marker>

        {agentPosition && (
          <Marker position={agentPosition}>
            <Popup>Agent Location</Popup>
          </Marker>
        )}

        <Polyline 
          positions={[[pickupLat, pickupLng], [dropLat, dropLng]]} 
          pathOptions={{ color: 'blue', weight: 3, opacity: 0.5, dashArray: '10, 10' }} 
        />
      </MapContainer>
    </div>
  );
}
