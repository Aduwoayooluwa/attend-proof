'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { MapPin as MapPinIcon, Loader2, LocateFixed } from 'lucide-react';
import { toast } from 'sonner';
import styles from './location-picker.module.css';

interface LocationPickerProps {
  lat: number;
  lng: number;
  radius: number;
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
    } catch {
      toast.error('Could not get coordinates for this location.');
    }
  };

  return (
    <div className={styles.searchWrap}>
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
        <div className={styles.dropdown}>
          {data.map(({ place_id, description }) => (
            <div 
              key={place_id} 
              onClick={() => handleSelect(description)}
              className={styles.option}
            >
              <MapPinIcon size={16} className={styles.optionIcon} />
              <span>{description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationPicker({ lat, lng, radius, onChange }: LocationPickerProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [locating, setLocating] = useState(false);

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

  const handlePlaceSelect = (newLat: number, newLng: number) => {
    onChange(newLat, newLng);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: newLat, lng: newLng });
      mapRef.current.setZoom(16);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('This device does not support location access.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLat = coords.latitude;
        const nextLng = coords.longitude;
        onChange(nextLat, nextLng);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: nextLat, lng: nextLng });
          mapRef.current.setZoom(16);
        }
        toast.success('Current location applied to this session.');
        setLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location access was denied. Allow it and try again.'
          : 'Could not get your current location.';
        toast.error(message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  };

  if (loadError) {
    return (
      <div className={styles.mapError}>
        Error loading Google Maps. Did you add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your `.env.local` file?
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.mapLoading}>
        <Loader2 className="spinner" size={24} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <PlacesAutocomplete onSelect={handlePlaceSelect} />
        <button
          type="button"
          className={styles.currentBtn}
          onClick={handleUseCurrentLocation}
          disabled={locating}
        >
          {locating ? <Loader2 className="spinner" size={16} /> : <LocateFixed size={16} />}
          {locating ? 'Locating...' : 'Use My Location'}
        </button>
      </div>

      <div className={styles.mapShell}>
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
          <Circle
            center={{ lat, lng }}
            radius={Number.isFinite(radius) && radius > 0 ? radius : 0}
            options={{
              fillColor: '#9E6D37',
              fillOpacity: 0.16,
              strokeColor: '#7A4C1E',
              strokeOpacity: 0.85,
              strokeWeight: 2,
              clickable: false,
              editable: false,
              draggable: false,
            }}
          />
        </GoogleMap>
      </div>

      <div className={styles.mapFooter}>
        <p style={{ margin: 0 }}>
          Click anywhere on the map to place the session pin.
        </p>
        <span className={styles.coverage}>
          Coverage: {Number.isFinite(radius) && radius > 0 ? `${radius}m` : 'Set radius'}
        </span>
      </div>
    </div>
  );
}
