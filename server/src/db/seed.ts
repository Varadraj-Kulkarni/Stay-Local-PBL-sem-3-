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
      tagline: 'Sacred rainforest groves & wildlife trails',
      description: 'Dense Western Ghats rainforest, home of the Giant Squirrel, ancient shrines, and pristine village homestays.',
      imageUrl: '/images/bhimashankar.jpg',
      latitude: 19.0729,
      longitude: 73.5358,
    },
    {
      id: 'dest-visapur',
      name: 'Visapur Fort',
      tagline: 'Sunrise mountain treks & farm cottages',
      description: 'Ancient Sahyadri mountain fortresses, waterfall stairways, and rustic stone village homestays nestled at the foothills.',
      imageUrl: '/images/visapur.jpg',
      latitude: 18.7237,
      longitude: 73.4881,
    },
    {
      id: 'dest-lonavala',
      name: 'Lonavala',
      tagline: 'Misty Sahyadri ridges & orchard retreats',
      description: 'Peaceful valley hamlets tucked behind the misty hills, offering panoramic canyon balconies and chulha cooking.',
      imageUrl: '/images/lonavala.jpg',
      latitude: 18.7557,
      longitude: 73.4091,
    },
    {
      id: 'dest-pune',
      name: 'Pune',
      tagline: 'Historic Maratha courtyards & food trails',
      description: 'Immerse in Peshwa heritage, centuries-old wooden wada architecture, artisanal peths, and native food walks.',
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
      title: 'Bhimashankar Sanctuary Eco-Homestay',
      description:
        'Modest, clean village homestay situated right at the fringe of the sacred rainforest sanctuary. Fresh chulha-cooked bhakri and thecha, birdwatching trails with native elders, and pristine Sahyadri spring water.',
      pricePerNight: 1650,
      maxGuests: 4,
      amenities: JSON.stringify(['Home-cooked meals', 'Hot spring water', 'Forest view', 'Trek guidance', 'Herbal garden']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1647771167457-c82f4850bb7e?auto=format&fit=crop&w=1000&q=80'
      ]),
      latitude: 19.0729,
      longitude: 73.5358,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.9,
      reviewCount: 28,
    },
    {
      id: 'prop-1002',
      hostId: hostProfileId,
      destinationId: 'dest-visapur',
      title: 'Visapur Fort Basecamp & Farmstay',
      description:
        'Rustic basalt stone farmhouse situated right at the base of Visapur Fort. A cozy, down-to-earth home base for sunrise cliff treks, with hot kanda poha & ginger tea served at 5:30 AM before you ascend.',
      pricePerNight: 1150,
      maxGuests: 4,
      amenities: JSON.stringify(['Trek guide', 'Farm breakfast', 'Parking', 'Campfire', 'Pet friendly']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1654075309556-14a41021eedb?auto=format&fit=crop&w=1000&q=80'
      ]),
      latitude: 18.7237,
      longitude: 73.4881,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.8,
      reviewCount: 34,
    },
    {
      id: 'prop-1003',
      hostId: hostProfileId,
      destinationId: 'dest-lonavala',
      title: 'Sahyadri Cloudcrest Balcony Retreat',
      description:
        'Comfortable wooden rural homestay featuring an open verandah overlooking misty monsoon valleys. Enjoy homemade filter coffee, waterfall trail walks, and warm local family hospitality.',
      pricePerNight: 1850,
      maxGuests: 3,
      amenities: JSON.stringify(['Valley view balcony', 'Wi-Fi', 'Breakfast included', 'Waterfall trail', 'Hot water']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1788928837020-decdf59ecf7c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80'
      ]),
      latitude: 18.7557,
      longitude: 73.4091,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.95,
      reviewCount: 42,
    },
    {
      id: 'prop-1004',
      hostId: hostProfileId,
      destinationId: 'dest-pune',
      title: 'Historic Peshwa Wada Courtyard Homestay',
      description:
        'A beautifully conserved 120-year-old Maratha wada in old Pune. Features traditional teak pillars, quiet central courtyard, brass antique fittings, and host-led street food walks in Tulshibaug.',
      pricePerNight: 1400,
      maxGuests: 2,
      amenities: JSON.stringify(['Heritage architecture', 'AC', 'City culinary walk', 'High-speed Wi-Fi', 'Workspace']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1789503801803-b3a9d909e73c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1784460843760-c9588c82eac5?auto=format&fit=crop&w=1000&q=80'
      ]),
      latitude: 18.5204,
      longitude: 73.8567,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.85,
      reviewCount: 19,
    },
    {
      id: 'prop-1005',
      hostId: hostProfileId,
      destinationId: 'dest-lonavala',
      title: 'Pawna Lakeside Verandah Cottage',
      description:
        'Peaceful lakeside stone cottage with direct water views. Slow rural living, fresh pitla-bhakri thali, sunset boat trips, and starlit open-air campfires.',
      pricePerNight: 2100,
      maxGuests: 4,
      amenities: JSON.stringify(['Lake view', 'Private verandah', 'Campfire pit', 'Local fish/veg thali', 'Parking']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1786772390791-2f44ca4b1aa7?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=80'
      ]),
      latitude: 18.7300,
      longitude: 73.4500,
      status: 'APPROVED',
      locationVerified: 1,
      verificationJson: canonicalVerification,
      rating: 4.9,
      reviewCount: 22,
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
