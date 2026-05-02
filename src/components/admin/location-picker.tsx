'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { MapPin as MapPinIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
};

const libraries: "places"[] = ["places"];

// Autocomplete Component
function PlacesAutocomplete({ 
  onSelect 
}: { 
  onSelect: (lat: number, lng: number, address: string) => void 
}) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // Prioritize Nigeria
      componentRestrictions: { country: 'ng' }
    },
    debounce: 300,
  });

  const [showDropdown, setShowDropdown] = useState(false);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    setShowDropdown(false);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(lat, lng, address);
    } catch (error) {
      toast.error('Could not get coordinates for this location.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 10 }}>
      <Input
        id="mapSearch"
        label="Search Address"
        placeholder=" Jamatul Islamiyya Primary School"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setShowDropdown(true);
        }}
        disabled={!ready}
        onFocus={() => { if (data.length > 0) setShowDropdown(true); }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        autoComplete="off"
      />
      
      {showDropdown && status === 'OK' && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: 'var(--bg-card)', border: '1px solid var(--border)', 
          borderRadius: 8, marginTop: 4, padding: '4px 0', 
          boxShadow: '0 12px 24px rgba(0,0,0,0.1)', 
          maxHeight: 250, overflowY: 'auto'
        }}>
          {data.map(({ place_id, description }) => (
            <div 
              key={place_id} 
              onClick={() => handleSelect(description)}
              style={{ 
                padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
                cursor: 'pointer', transition: 'background 0.2s', fontSize: 14, color: 'var(--text-base)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MapPinIcon size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--primary)' }} />
              <span style={{ lineHeight: 1.4 }}>{description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  // We load the script here. 
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onChange(e.latLng.lat(), e.latLng.lng());
    }
  }, [onChange]);

  const handlePlaceSelect = (newLat: number, newLng: number, address: string) => {
    onChange(newLat, newLng);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: newLat, lng: newLng });
      mapRef.current.setZoom(16);
    }
  };

  if (loadError) {
    return (
      <div style={{ padding: 16, background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 8, fontSize: 14 }}>
        Error loading Google Maps. Did you add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your `.env.local` file?
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height: 300, background: 'var(--bg-input)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        <Loader2 className="spinner" size={24} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      <PlacesAutocomplete onSelect={handlePlaceSelect} />
      
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat, lng }}
          zoom={14}
          onClick={onMapClick}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          <Marker position={{ lat, lng }} />
        </GoogleMap>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
        Click anywhere on the map to manually drop the location pin.
      </p>

    </div>
  );
}
