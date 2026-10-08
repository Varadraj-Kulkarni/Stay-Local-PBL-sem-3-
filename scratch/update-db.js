import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/staylocal.sqlite');

console.log('Updating SQLite database with realistic names and internet photos...');

// 1. Update Destinations
const destinations = [
  {
    id: 'dest-bhimashankar',
    name: 'Bhimashankar Sanctuary',
    tagline: 'Sacred rainforest groves & wildlife trails',
    description: 'Dense Western Ghats rainforest, home of the Giant Squirrel, ancient shrines, and pristine village homestays.',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dest-visapur',
    name: 'Visapur & Lohagad Forts',
    tagline: 'Sunrise mountain treks & farm cottages',
    description: 'Ancient Sahyadri mountain fortresses, waterfall stairways, and rustic stone village homestays nestled at the foothills.',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dest-lonavala',
    name: 'Lonavala & Khandala Valleys',
    tagline: 'Misty Sahyadri ridges & orchard retreats',
    description: 'Peaceful valley hamlets tucked behind the misty hills, offering panoramic canyon balconies and chulha cooking.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dest-pune',
    name: 'Old Pune Heritage Wadas',
    tagline: 'Historic Maratha courtyards & food trails',
    description: 'Immerse in Peshwa heritage, centuries-old wooden wada architecture, artisanal peths, and native food walks.',
    imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80',
  },
];

for (const d of destinations) {
  db.prepare(`
    UPDATE destinations 
    SET name = ?, tagline = ?, description = ?, image_url = ?
    WHERE id = ?
  `).run(d.name, d.tagline, d.description, d.imageUrl, d.id);
}

// 2. Update Properties
const properties = [
  {
    id: 'prop-1001',
    title: 'Bhimashankar Sanctuary Eco-Homestay',
    description: 'Peaceful village eco-homestay at the edge of the sacred rainforest sanctuary. Fresh chulha-cooked bhakri and thecha, birdwatching trails with native elders, and pristine Sahyadri spring water.',
    pricePerNight: 1650,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
    ]),
    rating: 4.9,
    reviewCount: 28,
  },
  {
    id: 'prop-1002',
    title: 'Visapur Fort Basecamp & Farmstay',
    description: 'Rustic basalt stone farmhouse situated right at the base of Visapur Fort. The perfect home base for sunrise cliff treks, with hot kanda poha & ginger tea served at 5:30 AM before you ascend.',
    pricePerNight: 1150,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1000&q=80'
    ]),
    rating: 4.8,
    reviewCount: 34,
  },
  {
    id: 'prop-1003',
    title: 'Sahyadri Cloudcrest Balcony Retreat',
    description: 'Charming wooden homestay featuring an expansive private balcony overlooking misty monsoon valleys. Enjoy homemade filter coffee, waterfall trail walks, and warm local hospitalities.',
    pricePerNight: 1850,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'
    ]),
    rating: 4.95,
    reviewCount: 42,
  },
  {
    id: 'prop-1004',
    title: 'Historic Peshwa Wada Courtyard Homestay',
    description: 'A beautifully conserved 120-year-old Maratha wada in old Pune. Features traditional teak pillars, quiet central courtyard, brass antique fittings, and host-led street food walks in Tulshibaug.',
    pricePerNight: 1400,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
    ]),
    rating: 4.85,
    reviewCount: 19,
  },
  {
    id: 'prop-ZWADSD',
    title: 'Pawna Lakeside Verandah Cottage',
    description: 'Peaceful lakeside stone cottage with direct water views. Slow rural living, fresh pitla-bhakri thali, sunset boat trips, and starlit open-air campfires.',
    pricePerNight: 2100,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80'
    ]),
    rating: 4.9,
    reviewCount: 22,
  }
];

for (const p of properties) {
  db.prepare(`
    UPDATE properties 
    SET title = ?, description = ?, price_per_night = ?, photos = ?, rating = ?, review_count = ?
    WHERE id = ?
  `).run(p.title, p.description, p.pricePerNight, p.photos, p.rating, p.reviewCount, p.id);
}

// 3. Insert Pawna property if prop-ZWADSD doesn't exist
const existingZW = db.prepare('SELECT id FROM properties WHERE id = ?').get('prop-1005');
if (!existingZW) {
  const host = db.prepare('SELECT id FROM host_profiles LIMIT 1').get();
  if (host) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO properties (id, host_id, destination_id, title, description, price_per_night, max_guests, amenities, photos, latitude, longitude, status, location_verified, rating, review_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'prop-1005',
      host.id,
      'dest-lonavala',
      'Pawna Lakeside Verandah Cottage',
      'Peaceful lakeside stone cottage with direct water views. Slow rural living, fresh pitla-bhakri thali, sunset boat trips, and starlit open-air campfires.',
      2100,
      4,
      JSON.stringify(['Lake view', 'Private verandah', 'Campfire pit', 'Local fish/veg thali', 'Parking']),
      JSON.stringify(['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80']),
      18.7300,
      73.4500,
      'APPROVED',
      1,
      4.9,
      22,
      now,
      now
    );
  }
}

console.log('Database updated successfully!');
