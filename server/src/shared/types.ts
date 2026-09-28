export type AppRole = 'TOURIST' | 'HOST' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null | undefined;
  role: AppRole;
  createdAt: string;
}

export interface Destination {
  id: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

export type HostApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface HostProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string | null | undefined;
  approvalStatus: HostApprovalStatus;
  verifiedAt?: string | null | undefined;
  rejectionNote?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export type PropertyStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE';

export interface VerificationResult {
  status: 'VERIFIED' | 'REJECTED';
  distanceMeters: number;
  thresholdMeters: number;
  verifiedAt: string;
  photoAssetId: string;
  capturedLatitude: number;
  capturedLongitude: number;
  accuracyMeters?: number | undefined;
  verificationMode: 'LIVE' | 'SIMULATED_AT_PROPERTY' | 'SIMULATED_AWAY';
  disclaimer: string;
}

export interface Property {
  id: string;
  hostId: string;
  destinationId: string;
  title: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
  photos: string[];
  latitude: number;
  longitude: number;
  status: PropertyStatus;
  locationVerified: boolean;
  verification?: VerificationResult | null | undefined;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  hostName?: string | undefined;
  destinationName?: string | undefined;
}

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  assetId: string;
  assetUrl: string;
  caption?: string | null | undefined;
  isVerificationPhoto: boolean;
  createdAt: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentMethod = 'UPI_QR' | 'DEMO_CARD' | 'PAY_AT_STAY';

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  touristId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nightCount: number;
  pricePerNight: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string | null | undefined;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  confirmedAt?: string | null | undefined;
}

export interface RewardCoupon {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED';
  issuedForBookingId: string;
  expiresAt?: string | null | undefined;
  createdAt: string;
}

export interface Review {
  id: string;
  propertyId: string;
  touristId: string;
  touristName: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface BookingVoucher {
  bookingId: string;
  verificationCode: string;
  property: {
    id: string;
    title: string;
    location: string;
    address: string;
  };
  host: {
    displayName: string;
    phone: string;
  };
  checkIn: string;
  checkOut: string;
  nightCount: number;
  guests: number;
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
    couponCode?: string | null | undefined;
  };
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  issuedAt: string;
  qrPayload: string;
  rewardCoupon?: {
    code: string;
    amount: number;
    currency: string;
  } | null | undefined;
}

export interface StandardErrorResponse {
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown> | undefined;
}
