/**
 * =====================================================================
 * 🌸 Adres Autocomplete Servisi (OpenStreetMap Nominatim)
 * =====================================================================
 * 
 * Bu servis OpenStreetMap Nominatim API kullanarak adres autocomplete sağlar:
 * - Mahalle autocomplete
 * - Cadde/Sokak autocomplete
 * - Detaylı adres arama
 * 
 * Ücretsiz ve rate limit (1 sn'de 1 istek) kısıtlaması var.
 * =====================================================================
 */

interface Suggestion {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

// =====================================================================
// 🌸 Nominatim Autocomplete API
// =====================================================================
async function searchNominatim(query: string, city: string, district?: string): Promise<Suggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    // 🌸 Arama sorgusunu oluştur
    const searchParts = [
      query,
      district,
      city,
      'Türkiye'
    ].filter(part => part && typeof part === 'string' && part.trim() !== '');

    const searchQuery = searchParts.join(', ');
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Nominatim API hatası');
    }

    const data = await response.json();
    
    // 🌸 Sonuçları suggestion formatına dönüştür
    return data.map((item: any) => ({
      id: item.place_id || item.osm_id.toString(),
      name: item.display_name.split(',')[0].trim(),
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || 'unknown'
    }));
  } catch (error) {
    console.error('Nominatim autocomplete hatası:', error);
    return [];
  }
}

// =====================================================================
// 🌸 Mahalle Autocomplete
// =====================================================================
export async function searchNeighborhoods(query: string, city: string, district?: string): Promise<Suggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    // 🌸 Mahalle araması için daha spesifik sorgu
    const searchParts = [
      query,
      'mahalle',
      district,
      city,
      'Türkiye'
    ].filter(part => part && typeof part === 'string' && part.trim() !== '');

    const searchQuery = searchParts.join(', ');
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Nominatim API hatası');
    }

    const data = await response.json();
    
    // 🌸 Sonuçları filtrele ve format
    return data
      .filter((item: any) => {
        const name = item.display_name.toLowerCase();
        return name.includes('mahalle') || name.includes('mah.');
      })
      .map((item: any) => ({
        id: item.place_id || item.osm_id.toString(),
        name: item.display_name.split(',')[0].trim(),
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || 'neighborhood'
      }));
  } catch (error) {
    console.error('Mahalle autocomplete hatası:', error);
    return [];
  }
}

// =====================================================================
// 🌸 Cadde/Sokak Autocomplete
// =====================================================================
export async function searchStreets(query: string, city: string, district?: string): Promise<Suggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    // 🌸 Cadde araması için daha spesifik sorgu
    const searchParts = [
      query,
      district,
      city,
      'Türkiye'
    ].filter(part => part && typeof part === 'string' && part.trim() !== '');

    const searchQuery = searchParts.join(', ');
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Nominatim API hatası');
    }

    const data = await response.json();
    
    // 🌸 Sonuçları filtrele ve format
    return data
      .filter((item: any) => {
        const name = item.display_name.toLowerCase();
        return name.includes('cadde') || name.includes('cad.') || name.includes('sokak') || name.includes('sk.');
      })
      .map((item: any) => ({
        id: item.place_id || item.osm_id.toString(),
        name: item.display_name.split(',')[0].trim(),
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || 'street'
      }));
  } catch (error) {
    console.error('Cadde autocomplete hatası:', error);
    return [];
  }
}

// =====================================================================
// 🌸 Genel Adres Autocomplete
// =====================================================================
export async function searchAddresses(query: string, city: string, district?: string): Promise<Suggestion[]> {
  return searchNominatim(query, city, district);
}

// =====================================================================
// 🌸 Reverse Geocoding (Koordinatlardan Adres)
// =====================================================================
export async function reverseGeocode(lat: number, lng: number): Promise<{
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  address?: string;
  displayName?: string;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Nominatim reverse geocoding hatası');
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }

    // 🌸 Adres bileşenlerini çıkar
    const address = data.address;
    
    return {
      city: address.city || address.town || address.village || address.state_district,
      district: address.suburb || address.district || address.quarter,
      neighborhood: address.neighbourhood || address.suburb,
      street: address.road || address.street,
      address: address.house_number || address.building,
      displayName: data.display_name
    };
  } catch (error) {
    console.error('Reverse geocoding hatası:', error);
    return null;
  }
}