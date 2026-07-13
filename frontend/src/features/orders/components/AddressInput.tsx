import { useFormContext } from "react-hook-form";

import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { GoogleAddressAutocomplete } from "../../../components/maps/GoogleAddressAutocomplete";
import type { OrderFormData } from "../schemas/orderSchemas";

interface AddressInputProps {
  type: "pickup" | "drop";
}

export function AddressInput({ type }: AddressInputProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<OrderFormData>();

  const typeErrors = errors[type];

  const handleAddressSelect = (
    address: string,
    lat: number,
    lng: number,
    placeId: string,
    pincode?: string
  ) => {
    setValue(`${type}.addressLine1`, address, { shouldValidate: true });
    setValue(`${type}.latitude`, lat, { shouldValidate: true });
    setValue(`${type}.longitude`, lng, { shouldValidate: true });
    setValue(`${type}.placeId`, placeId, { shouldValidate: true });
    setValue(`${type}.pincode`, pincode || "", { shouldValidate: true });

  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${type}.contactName`}>Contact Name</Label>
        <Input
          id={`${type}.contactName`}
          placeholder="Jane Doe"
          {...register(`${type}.contactName`)}
        />
        {typeErrors?.contactName && (
          <p className="text-sm text-destructive">{typeErrors.contactName.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}.phone`}>Phone Number</Label>
        <Input
          id={`${type}.phone`}
          type="tel"
          placeholder="+919876543210"
          {...register(`${type}.phone`)}
        />
        {typeErrors?.phone && (
          <p className="text-sm text-destructive">{typeErrors.phone.message as string}</p>
        )}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <GoogleAddressAutocomplete
          id={`${type}.addressLine1`}
          label="Address Line 1 *"
          value={watch(`${type}.addressLine1`) || ""}
          onChange={(val) => {
            setValue(`${type}.addressLine1`, val, { shouldValidate: true });
            if (!val) {
              setValue(`${type}.latitude`, undefined as any, { shouldValidate: true });
              setValue(`${type}.longitude`, undefined as any, { shouldValidate: true });
              setValue(`${type}.placeId`, "", { shouldValidate: true });
              setValue(`${type}.pincode`, "", { shouldValidate: true });
            }
          }}
          onAddressSelected={handleAddressSelect}
          placeholder="Start typing your address..."
          error={(typeErrors?.addressLine1?.message || typeErrors?.placeId?.message) as string}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${type}.addressLine2`}>Apartment / Flat / Floor / Landmark (Optional)</Label>
        <Input
          id={`${type}.addressLine2`}
          placeholder="Apartment, suite, unit, building, floor, etc."
          {...register(`${type}.addressLine2`)}
        />
        {typeErrors?.addressLine2 && (
          <p className="text-sm text-destructive">{typeErrors.addressLine2.message as string}</p>
        )}
      </div>
    </div>
  );
}
