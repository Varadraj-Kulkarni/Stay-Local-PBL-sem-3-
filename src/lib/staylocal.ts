export type Property = {
  id: string;
  host_id: string | null;
  host_name: string;
  host_verified: boolean;
  name: string;
  location: string;
  description: string;
  price_per_night: number;
  amenities: string[];
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  available_from: string | null;
  available_to: string | null;
  status: string;
  location_verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
};

export type Booking = {
  id: string;
  property_id: string;
  tourist_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
};

export type Review = {
  id: string;
  property_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type Reward = {
  id: string;
  user_id: string;
  booking_id: string | null;
  code: string;
  amount: number;
  used: boolean;
  created_at: string;
};

export const DESTINATIONS = [
  { id: "dest-bhimashankar", name: "Bhimashankar", tag: "Forests & temples", image: "/images/bhimashankar.jpg" },
  { id: "dest-visapur", name: "Visapur Fort", tag: "Sunrise treks", image: "/images/visapur.jpg" },
  { id: "dest-lonavala", name: "Lonavala", tag: "Monsoon valleys", image: "/images/lonavala.jpg" },
  { id: "dest-pune", name: "Pune", tag: "Heritage & food", image: "/images/pune.jpg" },
];

export const AMENITY_OPTIONS = [
  "Wi-Fi",
  "Breakfast",
  "Home-cooked meals",
  "Hot water",
  "AC",
  "Parking",
  "Balcony",
  "Valley view",
  "Forest view",
  "Trek guide",
  "City walk",
  "Bonfire",
  "Workspace",
];

export const EXPERIENCES = [
  { title: "Sunrise fort trek", place: "Visapur Fort", detail: "Walk up with a host who grew up on these slopes.", emoji: "🥾" },
  { title: "Village kitchen evening", place: "Bhimashankar", detail: "Cook bhakri and pithla with the family.", emoji: "🍲" },
  { title: "Monsoon waterfall trail", place: "Lonavala", detail: "Hidden falls only locals still visit.", emoji: "💧" },
  { title: "Old-city food walk", place: "Pune", detail: "Tulshibaug chaat, misal and sabudana vada.", emoji: "🥘" },
];

export function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function rupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function normalizeProperty(p: any): Property {
  return {
    id: p.id,
    host_id: p.hostId || p.host_id || null,
    host_name: p.hostName || p.host_name || "Local Host",
    host_verified: Boolean(p.hostVerified ?? p.host_verified ?? true),
    name: p.title || p.name || "Local Stay",
    location: p.destinationName || p.location || "Maharashtra",
    description: p.description || "",
    price_per_night: Number(p.pricePerNight ?? p.price_per_night ?? 1000),
    amenities: p.amenities || [],
    photos: Array.isArray(p.photos) && p.photos.length > 0 ? p.photos : ["/images/hero.jpg"],
    latitude: Number(p.latitude ?? 0),
    longitude: Number(p.longitude ?? 0),
    available_from: p.availableFrom || p.available_from || null,
    available_to: p.availableTo || p.available_to || null,
    status: p.status || "APPROVED",
    location_verified: Boolean(p.locationVerified ?? p.location_verified),
    rating: Number(p.rating || 0),
    review_count: Number(p.reviewCount ?? p.review_count ?? 0),
    created_at: p.createdAt || p.created_at || new Date().toISOString(),
  };
}

/** Distance in metres between two lat/lng pairs. */
export function distanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export function makeRewardCode() {
  return "STAY100-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const REWARD_AMOUNT = 100;
