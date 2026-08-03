import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { reverseGeocode } from '../../services/locationApi';

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

// 🌸 Custom store icon
const storeIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Props {
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  address?: string;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressUpdate?: (addressData: {
    city?: string;
    district?: string;
    neighborhood?: string;
    street?: string;
    address?: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
}

// 🌸 Map click handler component
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// 🌸 Map controller for centering
function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || 13);
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, zoom, map]);
  return null;
}

export default function StoreLocationMap({ city, district, neighborhood, street, address, onLocationSelect, onAddressUpdate, initialLocation }: Props) {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.9334, 32.8597]); // Varsayılan: Ankara
  const [loading, setLoading] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  // 🌸 initialLocation prop'u değiştiğinde konumu güncelle
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation([initialLocation.lat, initialLocation.lng]);
      setMapCenter([initialLocation.lat, initialLocation.lng]);
    }
  }, [initialLocation]);

  // 🌸 Adres bilgileri değiştiğinde haritayı o bölgeye odakla
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!city) return;

      setLoading(true);
      try {
        // 🌸 Tüm adres bilgilerini birleştir
        const addressParts = [
          address,
          street,
          neighborhood,
          district,
          city,
          'Türkiye'
        ].filter(part => part && typeof part === 'string' && part.trim() !== '');

        const query = addressParts.join(', ');
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setMapCenter([lat, lng]);
          // Her zaman seçili konumu güncelle
          setSelectedLocation([lat, lng]);
          onLocationSelect(lat, lng);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [city, district, neighborhood, street, address]);

  // 🌸 Konum seçildiğinde reverse geocoding yap
  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    onLocationSelect(lat, lng);
    
    // 🌸 Reverse geocoding ile adres bilgilerini al
    setReverseGeocoding(true);
    try {
      const addressData = await reverseGeocode(lat, lng);
      if (addressData && onAddressUpdate) {
        onAddressUpdate(addressData);
      }
    } catch (error) {
      console.error('Reverse geocoding hatası:', error);
    } finally {
      setReverseGeocoding(false);
    }
  };



  if (loading || reverseGeocoding) {
    return (
      <div className="h-80 bg-sand-100 rounded-xl flex items-center justify-center">
        <div className="text-sand-500 text-sm">
          {reverseGeocoding ? 'Adres bilgileri alınıyor...' : 'Harita yükleniyor...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-80 rounded-xl overflow-hidden border border-sand-200">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController center={mapCenter} zoom={13} />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* 🌸 Seçilen konum marker */}
          {selectedLocation && (
            <Marker position={selectedLocation} icon={storeIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Mağaza Konumu</strong>
                  <br />
                  {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      {/* 🌸 Seçilen koordinatları göster */}
      {selectedLocation && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
          <p className="text-sm text-brand-700">
            <strong>Seçilen Konum:</strong> {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
          </p>
          <p className="text-xs text-brand-600 mt-1">
            Haritadan tıklayarak konumu değiştirebilirsiniz
          </p>
        </div>
      )}
    </div>
  );
}