import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/staylocal.sqlite');

const destinations = [
  {
    id: 'dest-bhimashankar',
    name: 'Bhimashankar',
    tagline: 'Sacred rainforest groves & wildlife sanctuary',
    description: 'Dense Western Ghats rainforest, home of the Giant Squirrel, ancient shrines, and pristine village homestays.',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dest-visapur',
    name: 'Visapur Fort',
    tagline: 'Sunrise mountain treks & farm cottages',
    description: 'Ancient Sahyadri mountain fortresses, waterfall stairways, and rustic stone village homestays nestled at the foothills.',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dest-lonavala',
    name: 'Lonavala',
    tagline: 'Misty Sahyadri ridges & orchard retreats',
    description: 'Peaceful valley hamlets tucked behind the misty hills, offering panoramic canyon balconies and chulha cooking.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dest-pune',
    name: 'Pune',
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

console.log('Destination names aligned with tests successfully.');
