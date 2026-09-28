import { getDb } from '../db/index.ts';
import { generateShortId, generateRewardCode, generateVerificationCode } from '../shared/id.ts';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../http/errors.ts';
import type { Booking, BookingStatus, BookingVoucher, PaymentMethod, User } from '../shared/types.ts';

export interface CreateBookingInput {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
}

export class BookingsService {
  async createBooking(input: CreateBookingInput, currentUser: User): Promise<Booking> {
    if (!input.propertyId) {
      throw new ValidationError('Property ID is required.');
    }
    if (!input.checkIn || !input.checkOut) {
      throw new ValidationError('Both check-in and check-out dates are required.');
    }
    if (input.checkIn >= input.checkOut) {
      throw new ValidationError('Check-out date must be strictly after check-in date.');
    }
    const guests = Number(input.guests || 1);
    if (guests < 1) {
      throw new ValidationError('Guest count must be at least 1.');
    }

    const checkInMs = new Date(input.checkIn).getTime();
    const checkOutMs = new Date(input.checkOut).getTime();
    const nightCount = Math.round((checkOutMs - checkInMs) / 86400000);
    if (nightCount < 1) {
      throw new ValidationError('Stay duration must be at least 1 night.');
    }

    const db = await getDb();

    // 1. Validate property
    const prop = await db.get<any>(
      `SELECT p.*, d.name as destination_name FROM properties p
       JOIN destinations d ON d.id = p.destination_id
       WHERE p.id = ?`,
      [input.propertyId]
    );

    if (!prop) {
      throw new NotFoundError(`Property '${input.propertyId}' not found.`);
    }

    if (prop.status !== 'APPROVED') {
      throw new ValidationError('Only approved properties can be booked.');
    }

    if (guests > Number(prop.max_guests)) {
      throw new ValidationError(`Guest count (${guests}) exceeds maximum capacity of ${prop.max_guests} guests.`);
    }

    const pricePerNight = Number(prop.price_per_night);
    const subtotal = nightCount * pricePerNight;
    let discount = 0;
    let validatedCouponId: string | null = null;

    // 2. Validate coupon if provided
    if (input.couponCode) {
      const coupon = await db.get<any>(
        `SELECT * FROM rewards WHERE code = ? AND user_id = ?`,
        [input.couponCode.trim(), currentUser.id]
      );
      if (!coupon) {
        throw new ValidationError(`Invalid coupon code: '${input.couponCode}'.`);
      }
      if (coupon.status !== 'AVAILABLE') {
        throw new ConflictError('COUPON_ALREADY_USED', `Coupon '${input.couponCode}' has already been redeemed.`);
      }
      discount = Number(coupon.amount || 100);
      validatedCouponId = coupon.id;
    }

    const total = Math.max(0, subtotal - discount);
    const bookingId = generateShortId('book');
    const now = new Date().toISOString();

    // 3. Atomic transaction: Overlap check + insert + coupon redemption + reward issuance
    return await db.transaction(async (tx) => {
      // Overlap formula: existing.check_in < requested.check_out AND existing.check_out > requested.check_in
      const overlap = await tx.get<any>(
        `SELECT id FROM bookings
         WHERE property_id = ?
           AND check_in < ?
           AND check_out > ?
           AND status IN ('PENDING', 'CONFIRMED')`,
        [input.propertyId, input.checkOut, input.checkIn]
      );

      if (overlap) {
        throw new ConflictError('BOOKING_CONFLICT', 'The selected dates are already booked for this property.');
      }

      // Automatically confirm simulated payments (UPI_QR, DEMO_CARD, PAY_AT_STAY)
      const isSimulatedPayment = ['UPI_QR', 'DEMO_CARD', 'PAY_AT_STAY'].includes(input.paymentMethod);
      const initialStatus: BookingStatus = isSimulatedPayment ? 'CONFIRMED' : 'PENDING';
      const confirmedAt = initialStatus === 'CONFIRMED' ? now : null;

      await tx.run(
        `INSERT INTO bookings (id, property_id, tourist_id, check_in, check_out, guests, night_count, subtotal, discount, total, coupon_code, status, payment_method, created_at, confirmed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          input.propertyId,
          currentUser.id,
          input.checkIn,
          input.checkOut,
          guests,
          nightCount,
          subtotal,
          discount,
          total,
          input.couponCode ? input.couponCode.trim() : null,
          initialStatus,
          input.paymentMethod,
          now,
          confirmedAt,
        ]
      );

      // Redeem coupon atomically
      if (validatedCouponId) {
        await tx.run(
          `UPDATE rewards SET status = 'REDEEMED', redeemed_on_booking_id = ? WHERE id = ?`,
          [bookingId, validatedCouponId]
        );
      }

      // If confirmed, issue reward coupon idempotently
      if (initialStatus === 'CONFIRMED') {
        const rewardId = generateShortId('reward');
        const rewardCode = generateRewardCode();
        const expiresAt = new Date(Date.now() + 180 * 86400000).toISOString();

        await tx.run(
          `INSERT INTO rewards (id, user_id, code, amount, currency, status, issued_for_booking_id, redeemed_on_booking_id, expires_at, created_at)
           VALUES (?, ?, ?, 100, 'INR', 'AVAILABLE', ?, null, ?, ?)`,
          [rewardId, currentUser.id, rewardCode, bookingId, expiresAt, now]
        );
      }

      return {
        id: bookingId,
        propertyId: input.propertyId,
        propertyTitle: prop.title,
        propertyLocation: prop.destination_name || 'Maharashtra',
        touristId: currentUser.id,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests,
        nightCount,
        pricePerNight,
        subtotal,
        discount,
        total,
        couponCode: input.couponCode || null,
        status: initialStatus,
        paymentMethod: input.paymentMethod,
        createdAt: now,
        confirmedAt,
      };
    });
  }

  async confirmBooking(bookingId: string, currentUser: User): Promise<Booking> {
    const db = await getDb();
    const booking = await this.getBookingById(bookingId, currentUser);

    if (booking.status === 'CONFIRMED') {
      return booking; // Idempotent
    }

    const now = new Date().toISOString();

    return await db.transaction(async (tx) => {
      await tx.run(`UPDATE bookings SET status = 'CONFIRMED', confirmed_at = ? WHERE id = ?`, [now, bookingId]);

      // Issue reward if not already issued
      const existingReward = await tx.get<any>(`SELECT id FROM rewards WHERE issued_for_booking_id = ?`, [bookingId]);
      if (!existingReward) {
        const rewardId = generateShortId('reward');
        const rewardCode = generateRewardCode();
        const expiresAt = new Date(Date.now() + 180 * 86400000).toISOString();

        await tx.run(
          `INSERT INTO rewards (id, user_id, code, amount, currency, status, issued_for_booking_id, redeemed_on_booking_id, expires_at, created_at)
           VALUES (?, ?, ?, 100, 'INR', 'AVAILABLE', ?, null, ?, ?)`,
          [rewardId, booking.touristId, rewardCode, bookingId, expiresAt, now]
        );
      }

      booking.status = 'CONFIRMED';
      booking.confirmedAt = now;
      return booking;
    });
  }

  async getBookingById(bookingId: string, currentUser: User): Promise<Booking> {
    const db = await getDb();
    const r = await db.get<any>(
      `SELECT b.*, p.title as property_title, d.name as property_location, h.user_id as host_user_id
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN destinations d ON d.id = p.destination_id
       JOIN host_profiles h ON h.id = p.host_id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!r) {
      throw new NotFoundError(`Booking '${bookingId}' not found.`);
    }

    // Role check: tourist who booked, host of the property, or admin
    if (currentUser.role !== 'ADMIN' && currentUser.id !== r.tourist_id && currentUser.id !== r.host_user_id) {
      throw new ForbiddenError('You do not have permission to view this booking.');
    }

    return {
      id: r.id,
      propertyId: r.property_id,
      propertyTitle: r.property_title,
      propertyLocation: r.property_location,
      touristId: r.tourist_id,
      checkIn: r.check_in,
      checkOut: r.check_out,
      guests: Number(r.guests),
      nightCount: Number(r.night_count),
      pricePerNight: Number(r.subtotal) / Number(r.night_count),
      subtotal: Number(r.subtotal),
      discount: Number(r.discount),
      total: Number(r.total),
      couponCode: r.coupon_code || null,
      status: r.status as BookingStatus,
      paymentMethod: r.payment_method as PaymentMethod,
      createdAt: r.created_at,
      confirmedAt: r.confirmed_at || null,
    };
  }

  async listBookings(currentUser: User): Promise<Booking[]> {
    const db = await getDb();
    let rows: any[] = [];

    if (currentUser.role === 'ADMIN') {
      rows = await db.query<any>(
        `SELECT b.*, p.title as property_title, d.name as property_location
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         JOIN destinations d ON d.id = p.destination_id
         ORDER BY b.created_at DESC`
      );
    } else if (currentUser.role === 'HOST') {
      rows = await db.query<any>(
        `SELECT b.*, p.title as property_title, d.name as property_location
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         JOIN destinations d ON d.id = p.destination_id
         JOIN host_profiles h ON h.id = p.host_id
         WHERE h.user_id = ?
         ORDER BY b.created_at DESC`,
        [currentUser.id]
      );
    } else {
      // TOURIST
      rows = await db.query<any>(
        `SELECT b.*, p.title as property_title, d.name as property_location
         FROM bookings b
         JOIN properties p ON p.id = b.property_id
         JOIN destinations d ON d.id = p.destination_id
         WHERE b.tourist_id = ?
         ORDER BY b.created_at DESC`,
        [currentUser.id]
      );
    }

    return rows.map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      propertyTitle: r.property_title,
      propertyLocation: r.property_location,
      touristId: r.tourist_id,
      checkIn: r.check_in,
      checkOut: r.check_out,
      guests: Number(r.guests),
      nightCount: Number(r.night_count),
      pricePerNight: Number(r.subtotal) / Math.max(1, Number(r.night_count)),
      subtotal: Number(r.subtotal),
      discount: Number(r.discount),
      total: Number(r.total),
      couponCode: r.coupon_code || null,
      status: r.status as BookingStatus,
      paymentMethod: r.payment_method as PaymentMethod,
      createdAt: r.created_at,
      confirmedAt: r.confirmed_at || null,
    }));
  }

  async getVoucher(bookingId: string, currentUser: User): Promise<BookingVoucher> {
    const db = await getDb();
    const r = await db.get<any>(
      `SELECT b.*, p.title as property_title, d.name as destination_name,
              h.display_name as host_name, u.phone as host_phone, h.user_id as host_user_id
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN destinations d ON d.id = p.destination_id
       JOIN host_profiles h ON h.id = p.host_id
       JOIN users u ON u.id = h.user_id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!r) {
      throw new NotFoundError(`Booking '${bookingId}' not found.`);
    }

    if (currentUser.role !== 'ADMIN' && currentUser.id !== r.tourist_id && currentUser.id !== r.host_user_id) {
      throw new ForbiddenError('You do not have permission to access this voucher.');
    }

    // Find reward coupon issued for this booking
    const reward = await db.get<any>(`SELECT * FROM rewards WHERE issued_for_booking_id = ?`, [bookingId]);
    const verificationCode = generateVerificationCode();

    return {
      bookingId: r.id,
      verificationCode,
      property: {
        id: r.property_id,
        title: r.property_title,
        location: r.destination_name,
        address: `${r.destination_name} Village Area, Maharashtra`,
      },
      host: {
        displayName: r.host_name || 'Local Host',
        phone: r.host_phone || '+919876543210',
      },
      checkIn: r.check_in,
      checkOut: r.check_out,
      nightCount: Number(r.night_count),
      guests: Number(r.guests),
      pricing: {
        subtotal: Number(r.subtotal),
        discount: Number(r.discount),
        total: Number(r.total),
        couponCode: r.coupon_code || null,
      },
      paymentMethod: r.payment_method as PaymentMethod,
      status: r.status as BookingStatus,
      issuedAt: new Date().toISOString(),
      qrPayload: `STAYLOCAL:${r.id}:${verificationCode}`,
      rewardCoupon: reward
        ? {
            code: reward.code,
            amount: Number(reward.amount),
            currency: reward.currency || 'INR',
          }
        : null,
    };
  }
}
