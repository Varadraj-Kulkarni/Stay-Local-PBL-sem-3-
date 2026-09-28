import bcrypt from 'bcryptjs';
import type { DatabaseAdapter } from './sqlite.ts';
import { VERIFICATION_DISCLAIMER } from '../shared/haversine.ts';

export async function seedDatabase(db: DatabaseAdapter): Promise<void> {
  const existingUser = await db.get('SELECT id FROM users WHERE email = ?', ['tourist@staylocal.demo']);
  if (existingUser) {
    return; // Already seeded
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('DemoPass123!', salt);
  const now = new Date().toISOString();

  // 1. Users
  const touristId = '10000000-0000-4000-8000-000000000001';
  const hostUserId = '20000000-0000-4000-8000-000000000002';
  const adminId = '30000000-0000-4000-8000-000000000003';

  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [touristId, 'tourist@staylocal.demo', passwordHash, 'Aarav Sharma', '+919800001111', 'TOURIST', now, now]
  );
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [hostUserId, 'host@staylocal.demo', passwordHash, 'Sunita Kale', '+919876543210', 'HOST', now, now]
  );
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [adminId, 'admin@staylocal.demo', passwordHash, 'StayLocal Admin', '+919800009999', 'ADMIN', now, now]
  );

  // 2. Host Profile
  const hostProfileId = 'host-2001';
  await db.run(
    `INSERT INTO host_profiles (id, user_id, display_name, bio, approval_status, verified_at, rejection_note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      hostProfileId,
      hostUserId,
      'Sunita Kale',
      'Local naturalist and homestay host with 10 years of experience welcoming travellers.',
      'APPROVED',
      now,
      null,
      now,
      now,
    ]
  );

  // 3. Destinations
  const destinations = [
    {
      id: 'dest-bhimashankar',
      name: 'Bhimashankar',
      tagline: 'Forests & sacred shrines',
      description: 'Dense sanctuary trails, rare giant squirrels, and serene spiritual mornings.',
      imageUrl: '/images/bhimashankar.jpg',
      latitude: 19.0729,
      longitude: 73.5358,
    },
    {
      id: 'dest-visapur',
      name: 'Visapur Fort',
      tagline: 'Sunrise treks & waterfalls',
      description: 'Historical hill fort known for stone staircases and panoramic Sahyadri views.',
      imageUrl: '/images/visapur.jpg',
      latitude: 18.7237,
      longitude: 73.4881,
    },
    {
      id: 'dest-lonavala',
      name: 'Lonavala',
      tagline: 'Monsoon valleys & mist',
      description: 'Quiet valley villages away from the crowded market streets.',
      imageUrl: '/images/lonavala.jpg',
      latitude: 18.7557,
      longitude: 73.4091,
    },
    {
      id: 'dest-pune',
      name: 'Pune',
      tagline: 'Heritage wadas & street food',
      description: 'Experience Peshwa history, old peth culture, and authentic local food walks.',
      imageUrl: '/images/pune.jpg',
      latitude: 18.5204,
      longitude: 73.8567,
    },
  ];

  for (const d of destinations) {
    await db.run(
      `INSERT INTO destinations (id, name, tagline, description, image_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.name, d.tagline, d.description, d.imageUrl, d.latitude, d.longitude]
    );
  }

  // 4. Properties
  const canonicalVerification = JSON.stringify({
    status: 'VERIFIED',
    distanceMeters: 18,
    thresholdMeters: 50,
    verifiedAt: now,
    photoAssetId: 'asset-seed-01',
    capturedLatitude: 19.0729,
    capturedLongitude: 73.5358,
    accuracyMeters: 8,
    verificationMode: 'LIVE',
    disclaimer: VERIFICATION_DISCLAIMER,
  });

  const properties = [
    {
      id: 'prop-1001',
      hostId: hostProfileId,
      destinationId: 'dest-bhimashankar',
      title: 'Forest View Local Homestay',
      description:
        'A warm village room at the edge of the Bhimashankar wildlife sanctuary. Home-cooked Maharashtrian meals and guided early-morning forest walks with the family.',
      pricePerNight: 1800,
      maxGuests: 3,
      amenities: JSON.stringify(['Home-cooked meals', 'Hot water', 'Forest view', 'Guided walk', 'Wi-Fi']),
      photos: JSON.stringify(['/images/bhimashankar.jpg']),
      latitude: 19.0729,
      longitude: 73.5358,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.8,
      reviewCount: 2,
    },
    {
      id: 'prop-1002',
      hostId: hostProfileId,
      destinationId: 'dest-visapur',
      title: 'Fort View Farm Room',
      description:
        'Stone farmhouse room right below Visapur Fort. Perfect base for sunrise treks, with chai and poha before you set off.',
      pricePerNight: 900,
      maxGuests: 4,
      amenities: JSON.stringify(['Trek guide', 'Breakfast', 'Parking', 'Bonfire']),
      photos: JSON.stringify(['/images/visapur.jpg']),
      latitude: 18.7237,
      longitude: 73.4881,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.6,
      reviewCount: 1,
    },
    {
      id: 'prop-1003',
      hostId: hostProfileId,
      destinationId: 'dest-lonavala',
      title: 'Misty Valley Balcony Stay',
      description:
        'A bright room with a private balcony over the valley. Monsoon views, filter coffee and a local food trail with your host.',
      pricePerNight: 1800,
      maxGuests: 2,
      amenities: JSON.stringify(['Balcony', 'Valley view', 'Wi-Fi', 'AC', 'Breakfast']),
      photos: JSON.stringify(['/images/lonavala.jpg']),
      latitude: 18.7557,
      longitude: 73.4091,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.9,
      reviewCount: 2,
    },
    {
      id: 'prop-1004',
      hostId: hostProfileId,
      destinationId: 'dest-pune',
      title: 'Peth Wada Heritage Room',
      description:
        'A heritage wada room in old Pune. Walk to Shaniwar Wada, and join the family for an evening street-food walk in Tulshibaug.',
      pricePerNight: 1100,
      maxGuests: 2,
      amenities: JSON.stringify(['Wi-Fi', 'AC', 'City walk', 'Breakfast', 'Workspace']),
      photos: JSON.stringify(['/images/pune.jpg']),
      latitude: 18.5204,
      longitude: 73.8567,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.7,
      reviewCount: 1,
    },
  ];

  for (const p of properties) {
    await db.run(
      `INSERT INTO properties (id, host_id, destination_id, title, description, price_per_night, max_guests, amenities, photos, latitude, longitude, status, location_verified, verification_json, rating, review_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.hostId,
        p.destinationId,
        p.title,
        p.description,
        p.pricePerNight,
        p.maxGuests,
        p.amenities,
        p.photos,
        p.latitude,
        p.longitude,
        p.status,
        p.locationVerified,
        p.verificationJson,
        p.rating,
        p.reviewCount,
        now,
        now,
      ]
    );

    await db.run(
      `INSERT INTO property_photos (id, property_id, asset_id, asset_url, caption, is_verification_photo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`photo-${p.id}-1`, p.id, `asset-${p.id}-1`, JSON.parse(p.photos)[0], 'Main Room View', 1, now]
    );
  }

  // 5. Existing Booking
  const bookingId = 'book-1001';
  await db.run(
    `INSERT INTO bookings (id, property_id, tourist_id, check_in, check_out, guests, night_count, subtotal, discount, total, coupon_code, status, payment_method, created_at, confirmed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bookingId,
      'prop-1001',
      touristId,
      '2026-10-10',
      '2026-10-12',
      2,
      2,
      3600,
      100,
      3500,
      null,
      'CONFIRMED',
      'UPI_QR',
      now,
      now,
    ]
  );

  // 6. Reward coupon issued for book-1001
  await db.run(
    `INSERT INTO rewards (id, user_id, code, amount, currency, status, issued_for_booking_id, redeemed_on_booking_id, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'reward-1001',
      touristId,
      'STAY100-AB12CD',
      100,
      'INR',
      'AVAILABLE',
      bookingId,
      null,
      new Date(Date.now() + 180 * 86400000).toISOString(),
      now,
    ]
  );

  // 7. Reviews
  await db.run(
    `INSERT INTO reviews (id, property_id, tourist_id, booking_id, rating, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'rev-1001',
      'prop-1001',
      touristId,
      bookingId,
      5,
      'Felt like staying with family. The morning forest walk was unforgettable.',
      now,
    ]
  );
}
