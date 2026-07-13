import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2 } from "lucide-react";

interface GoogleAddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelected: (
    address: string,
    lat: number,
    lng: number,
    placeId: string,
    pincode?: string
  ) => void;
  placeholder?: string;
  error?: string;
}

export function GoogleAddressAutocomplete({
  id,
  label,
  value,
  onChange,
  onAddressSelected,
  placeholder = "Enter street address",
  error,
}: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(value || null);

  // Sync internal state when external value changes (e.g., reset)
  useEffect(() => {
    setInputValue(value);
    if (!value) {
      setSelectedAddress(null);
    }
  }, [value]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    if (!apiKey) {
      setLoadError("Google Maps API key is missing.");
      setLoading(false);
      return;
    }

    setOptions({
      key: apiKey,
      v: "weekly",
    });

    importLibrary("places")
      .then((placesLib) => {
        setLoading(false);
        if (!inputRef.current) return;

        const autocomplete = new placesLib.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "IN" },
          fields: ["address_components", "geometry", "formatted_address", "place_id"],
        });

        // Bias results to current city if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const defaultBounds = {
                north: lat + 0.1,
                south: lat - 0.1,
                east: lng + 0.1,
                west: lng - 0.1,
              };
              autocomplete.setBounds(defaultBounds);
            },
            () => {
              // Ignore geolocation failures, fall back to standard bias
            }
          );
        }

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            return;
          }

          const address = place.formatted_address || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const placeId = place.place_id || "";

          let pincode = "";
          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes("postal_code")) {
                pincode = component.long_name;
                break;
              }
            }
          }

          setSelectedAddress(address);
          setInputValue(address);
          onChange(address);
          onAddressSelected(address, lat, lng, placeId, pincode);
        });
      })
      .catch((err: unknown) => {
        console.error("Google Maps Load Error:", err);
        setLoadError("Failed to load map services.");
        setLoading(false);
      });
  }, []);

  const handleBlur = () => {
    // If input is empty, clear state
    if (!inputValue) {
      setSelectedAddress(null);
      onChange("");
      return;
    }
    // Revert to last selected Google suggestion if typing was arbitrary
    if (inputValue !== selectedAddress) {
      setInputValue(selectedAddress || "");
      onChange(selectedAddress || "");
    }
  };

  if (loadError) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} value={inputValue} disabled placeholder="Maps service unavailable" />
        <p className="text-xs text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          disabled={loading}
          placeholder={loading ? "Initializing..." : placeholder}
          className={loading ? "pr-10 text-muted-foreground" : ""}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
