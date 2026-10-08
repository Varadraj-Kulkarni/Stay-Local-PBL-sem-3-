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
  {
    id: "dest-lonavala",
    name: "Lonavala",
    tag: "Misty Sahyadri valleys, seasonal waterfalls & hill retreats",
    image: "/images/lonavala.jpg",
    landmark: "Tiger's Leap & Western Ghats Valleys",
  },
  {
    id: "dest-visapur",
    name: "Visapur Fort",
    tag: "Sunrise stone stair treks & village farm cottages",
    image: "/images/visapur.jpg",
    landmark: "Visapur Waterfall Trek Ridge",
  },
  {
    id: "dest-bhimashankar",
    name: "Bhimashankar",
    tag: "Sacred groves, Giant Squirrel rainforest trails & temple serenity",
    image: "/images/bhimashankar.jpg",
    landmark: "Bhimashankar Wildlife Sanctuary & Jyotirlinga",
  },
  {
    id: "dest-pune",
    name: "Pune",
    tag: "Historic Maratha courtyards, artisanal peths & street food walks",
    image: "/images/pune.jpg",
    landmark: "Shaniwar Wada & Heritage Wadas",
  },
  {
    id: "dest-jaipur",
    name: "Jaipur",
    tag: "Hawa Mahal, heritage havelis & authentic Rajasthani hospitality",
    image: "https://images.unsplash.com/photo-1602498456745-e9503b30470b?auto=format&fit=crop&w=800&q=80",
    landmark: "Hawa Mahal & Amber Fort",
  },
  {
    id: "dest-udaipur",
    name: "Udaipur",
    tag: "Lake Pichola, royal courtyards & serene Mewar lakeside stays",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
    landmark: "City Palace & Lake Pichola",
  },
  {
    id: "dest-varanasi",
    name: "Varanasi",
    tag: "Historic Ganga ghats, morning boat sunrise & spiritual alleyways",
    image: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80",
    landmark: "Dashashwamedh & Assi Ghats",
  },
  {
    id: "dest-munnar",
    name: "Munnar",
    tag: "Rolling emerald tea plantations, cool mist & spice farmstays",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
    landmark: "Anamudi Tea Plantations",
  },
  {
    id: "dest-manali",
    name: "Manali",
    tag: "Solang valley, cedar pine forests & Himalayan apple orchard homes",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    landmark: "Solang Valley & Rohtang Pass Peaks",
  },
  {
    id: "dest-goa",
    name: "Goa",
    tag: "Coastal village living, Portuguese heritage cottages & beach sunsets",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    landmark: "Palolem Coast & Fontainhas Latin Quarter",
  },
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
  { title: "Sunrise fort trek", place: "Visapur Fort", detail: "Trek up with a host who grew up navigating these historic mountain trails.", icon: "Compass" },
  { title: "Authentic village dining", place: "Bhimashankar", detail: "Learn to cook woodfire bhakri, pithla, and fresh organic herbs with the host family.", icon: "Utensils" },
  { title: "Monsoon waterfall trail", place: "Lonavala", detail: "Hidden scenic stream cascades and forest trails known exclusively to local residents.", icon: "Waves" },
  { title: "Old-city heritage walk", place: "Pune", detail: "Historic wada architecture tour followed by authentic local culinary delicacies.", icon: "MapPin" },
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
