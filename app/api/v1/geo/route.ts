import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, reverseGeocode, calculateDistanceKm } from "@/lib/services/geocodingService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const address = searchParams.get("address");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const compareLat = searchParams.get("compareLat");
    const compareLng = searchParams.get("compareLng");

    // 1. Forward Geocoding: Address -> Coordinates
    if (address) {
      const geo = await geocodeAddress(address);
      if (!geo) {
        return NextResponse.json({ success: false, error: { message: "Address could not be located" } }, { status: 404 });
      }

      // Check distance if compare coordinates (e.g. user device GPS) are provided
      let distanceKm: number | undefined;
      if (compareLat && compareLng) {
        const cLat = parseFloat(compareLat);
        const cLng = parseFloat(compareLng);
        if (!isNaN(cLat) && !isNaN(cLng)) {
          distanceKm = calculateDistanceKm(geo.latitude, geo.longitude, cLat, cLng);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          ...geo,
          distanceFromUserKm: distanceKm,
        },
      });
    }

    // 2. Reverse Geocoding: Coordinates -> Address
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        return NextResponse.json({ success: false, error: { message: "Invalid coordinates" } }, { status: 400 });
      }

      const reverse = await reverseGeocode(parsedLat, parsedLng);
      return NextResponse.json({
        success: true,
        data: reverse || { latitude: parsedLat, longitude: parsedLng, displayName: `${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}` },
      });
    }

    return NextResponse.json({ success: false, error: { message: "Specify 'address' or 'lat' and 'lng'" } }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
