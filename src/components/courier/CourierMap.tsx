import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// 🌸 Leaflet marker icon fix
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  destinationAddress: string;
  destinationCity: string;
  destinationDistrict: string;
  storeLocation?: { lat: number; lng: number };
}

// 🌸 Custom store icon
const storeIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 🌸 Custom destination icon
const destinationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 🌸 Map controller for centering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, map]);
  return null;
}

export default function CourierMap({ 
  destinationAddress, 
  destinationCity, 
  destinationDistrict,
  storeLocation = { lat: 39.9334, lng: 32.8597 } // Default Ankara
}: Props) {
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌸 Geocode destination address using Nominatim (OpenStreetMap)
    const geocodeAddress = async () => {
      try {
        const query = `${destinationAddress}, ${destinationDistrict}, ${destinationCity}, Türkiye`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setDestinationCoords([lat, lng]);
        } else {
          // Fallback to city center if exact address not found
          const cityResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationCity + ', Türkiye')}&limit=1`
          );
          const cityData = await cityResponse.json();
          if (cityData && cityData.length > 0) {
            const lat = parseFloat(cityData[0].lat);
            const lng = parseFloat(cityData[0].lon);
            setDestinationCoords([lat, lng]);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [destinationAddress, destinationCity, destinationDistrict]);

  if (loading || !destinationCoords) {
    return (
      <div className="h-64 bg-sand-100 rounded-xl flex items-center justify-center">
        <div className="text-sand-500 text-sm">Harita yükleniyor...</div>
      </div>
    );
  }

  // 🌸 Calculate center point between store and destination
  const centerLat = (storeLocation.lat + destinationCoords[0]) / 2;
  const centerLng = (storeLocation.lng + destinationCoords[1]) / 2;

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-sand-200">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController center={[centerLat, centerLng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* 🌸 Store location marker */}
        <Marker position={[storeLocation.lat, storeLocation.lng]} icon={storeIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Mağaza</strong>
              <br />
              Çiçekçi Merkezi
            </div>
          </Popup>
        </Marker>

        {/* 🌸 Destination marker */}
        <Marker position={destinationCoords} icon={destinationIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Teslimat Adresi</strong>
              <br />
              {destinationAddress}
              <br />
              {destinationDistrict}, {destinationCity}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
