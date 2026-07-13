import { AddressInput } from "./AddressInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function PickupDetailsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pickup Information</CardTitle>
        <CardDescription>
          Enter the origin address and contact person details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AddressInput type="pickup" />
      </CardContent>
    </Card>
  );
}

export function DropDetailsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drop Information</CardTitle>
        <CardDescription>
          Enter the destination address and contact person details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AddressInput type="drop" />
      </CardContent>
    </Card>
  );
}
