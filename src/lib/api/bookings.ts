import { apiRequest } from './client.ts';
import type { Booking, BookingVoucher, PaymentMethod } from '../../../server/src/shared/types.ts';

export async function createBooking(data: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  couponCode?: string | null | undefined;
  paymentMethod: PaymentMethod;
}): Promise<Booking> {
  return await apiRequest<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listBookings(): Promise<Booking[]> {
  return await apiRequest<Booking[]>('/bookings');
}

export async function getBookingById(bookingId: string): Promise<Booking> {
  return await apiRequest<Booking>(`/bookings/${bookingId}`);
}

export async function confirmBooking(
  bookingId: string,
  data: { paymentMethod?: PaymentMethod; transactionReference?: string } = {}
): Promise<Booking> {
  return await apiRequest<Booking>(`/bookings/${bookingId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBookingVoucher(bookingId: string): Promise<BookingVoucher> {
  return await apiRequest<BookingVoucher>(`/bookings/${bookingId}/voucher`);
}
