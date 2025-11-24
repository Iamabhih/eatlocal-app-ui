/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if delivery address is within restaurant's delivery radius
 * @param restaurantLat Restaurant latitude
 * @param restaurantLon Restaurant longitude
 * @param addressLat Delivery address latitude
 * @param addressLon Delivery address longitude
 * @param maxRadius Maximum delivery radius in km
 * @returns Object with isWithinRadius boolean and actual distance
 */
export function isWithinDeliveryRadius(
  restaurantLat: number,
  restaurantLon: number,
  addressLat: number,
  addressLon: number,
  maxRadius: number
): { isWithinRadius: boolean; distance: number } {
  const distance = calculateDistance(
    restaurantLat,
    restaurantLon,
    addressLat,
    addressLon
  );

  return {
    isWithinRadius: distance <= maxRadius,
    distance,
  };
}

/**
 * Check if current time is within restaurant operating hours
 * @param openingTime Opening time in HH:MM format (24-hour)
 * @param closingTime Closing time in HH:MM format (24-hour)
 * @returns Boolean indicating if restaurant is currently open
 */
export function isRestaurantOpen(
  openingTime: string,
  closingTime: string
): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

  const [openHour, openMin] = openingTime.split(':').map(Number);
  const [closeHour, closeMin] = closingTime.split(':').map(Number);

  const openingMinutes = openHour * 60 + openMin;
  const closingMinutes = closeHour * 60 + closeMin;

  // Handle case where closing time is after midnight
  if (closingMinutes < openingMinutes) {
    return currentTime >= openingMinutes || currentTime <= closingMinutes;
  }

  return currentTime >= openingMinutes && currentTime <= closingMinutes;
}

/**
 * Format time for display
 * @param time Time string in HH:MM format
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}
