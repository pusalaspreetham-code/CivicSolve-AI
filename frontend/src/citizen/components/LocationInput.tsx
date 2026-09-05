import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, MapPin, Navigation, X } from 'lucide-react';

interface Props {
  address: string;
  latitude: number | null;
  longitude: number | null;
  error?: string;
  onChange: (address: string, latitude: number | null, longitude: number | null) => void;
}

export const LocationInput: React.FC<Props> = ({ address, latitude, longitude, error, onChange }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');
  const [geoError, setGeoError] = useState('');

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Automatic location is not supported by this browser. Enter the location manually.');
      return;
    }
    setIsLocating(true);
    setGeoError('');
    setGeoMessage('Requesting your current location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = Number(coords.latitude.toFixed(6));
        const lng = Number(coords.longitude.toFixed(6));
        const automaticAddress = address.trim() || `Current device location (${lat}, ${lng})`;
        onChange(automaticAddress, lat, lng);
        setGeoMessage('Current location attached. You can replace the address with a landmark if needed.');
        setIsLocating(false);
      },
      (positionError) => {
        const message = positionError.code === positionError.PERMISSION_DENIED
          ? 'Location permission was denied. Enter the address manually or allow location access and retry.'
          : 'Unable to read your current location. Enter the address manually or retry.';
        setGeoError(message);
        setGeoMessage('');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    // Request location automatically when the citizen reaches the location step.
    useCurrentLocation();
    // The request is intentionally made once on mount; the retry button remains available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCoordinates = () => {
    onChange(address.startsWith('Current device location (') ? '' : address, null, null);
    setGeoMessage('');
  };

  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor="problem-location" className="block text-sm font-semibold text-slate-900">
            Problem location <span className="text-orange-600">*</span>
          </label>
          <p className="mt-1 text-xs text-slate-500">We automatically request your current location. You can edit the address or landmark below.</p>
        </div>
        <button type="button" onClick={useCurrentLocation} disabled={isLocating} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-900 disabled:opacity-50">
          {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5 text-orange-600" />}
          {isLocating ? 'Locating…' : 'Retry location'}
        </button>
      </div>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-orange-600" />
        <input id="problem-location" value={address} onChange={(event) => onChange(event.target.value, latitude, longitude)} className={`w-full rounded-lg border px-3 py-3 pl-9 pr-10 text-sm text-slate-900 ${error ? 'border-red-500' : 'border-slate-300'}`} placeholder="Street, ward, landmark, or nearby place" />
        {address && <button type="button" onClick={() => onChange('', latitude, longitude)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700" aria-label="Clear location address"><X className="h-4 w-4" /></button>}
      </div>
      {hasCoordinates && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />GPS coordinates attached: {latitude}, {longitude}</span><button type="button" onClick={clearCoordinates} className="font-medium underline">Clear coordinates</button></div>}
      {geoMessage && <p className="flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{geoMessage}</p>}
      {geoError && <p className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{geoError}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};
