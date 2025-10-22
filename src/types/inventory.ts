
// Activity types for inventory movement logs
export type ActivityType = 'restock' | 'edit' | 'delete' | 'add' | 'expired';

// Activity interface for inventory movement logs
export interface Activity {
  id: string;
  date: string;
  productId?: string;
  productName?: string;
  type: ActivityType;
  quantity?: number;
  performedBy: string;
  remarks?: string;
  description: string;
}

// Supplier interface
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  paymentTerms?: string;
  productsSupplied?: string[];
  lastDelivery?: string;
  products?: string[];
}

// Sample suppliers with real data from the minimart
export const SAMPLE_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'Kevian Limited',
    contactPerson: 'Faith',
    phone: '0700740190',
    products: ['Afia', 'Pick n Peel', 'Acacia Kids'],
    lastDelivery: '2025-05-15',
  },
  {
    id: '2',
    name: 'Radbone',
    phone: '0721615369',
    products: ['Snickers', 'Bounty Chocolate', 'M&M', 'Orbit', 'Juicy Fruit', 'Skittles'],
    lastDelivery: '2025-05-10',
  },
  {
    id: '3',
    name: 'Festive Bread',
    phone: '0729838529',
    lastDelivery: '2025-05-12',
  },
  {
    id: '4',
    name: 'Chandaria',
    phone: '0714768744',
    products: ['Roll On', 'Lotion', 'Toilet paper', 'Rug', 'Velvex', 'Colgate', 'Mouthwash', 'Sister Soft'],
    lastDelivery: '2025-05-08',
  },
  {
    id: '5',
    name: 'Gromis',
    phone: '0777408660',
    products: ['Peanuts', 'Popcorns', 'Tarqar', 'Granthic Bites'],
    lastDelivery: '2025-05-07',
  },
  {
    id: '6',
    name: 'Single World',
    phone: '',
    products: ['Zoe lotion', 'Santa Lucia', 'Melvin', 'Persil', 'Pride', 'Cussons body soap'],
    lastDelivery: '2025-05-06',
  },
  {
    id: '7',
    name: 'Jumra',
    phone: '0713099495',
    products: ['Voko maize meal', 'Amaize', 'Self raising', 'EX all purpose', 'Cortants', 'Peptang tomato sauce', 'Quencher juice', 'Quencher water', 'Imperial Leather'],
    lastDelivery: '2025-05-05',
  },
  {
    id: '8',
    name: 'Urban',
    phone: '0782359619',
    products: ['Urban Bites', 'Ustix', 'Criban'],
    lastDelivery: '2025-05-04',
  },
  {
    id: '9',
    name: 'Flashmark',
    phone: '',
    products: ['Crackers', 'Highland'],
    lastDelivery: '2025-05-03',
  },
  {
    id: '10',
    name: 'Spice World',
    phone: '0722742821',
    products: ['Spaghetti', 'Semolina', 'Green grams', 'Kamande'],
    lastDelivery: '2025-05-02',
  },
  {
    id: '11',
    name: 'Vibs',
    phone: '',
    products: ['Delmonte', 'Nice & Lovely Products', 'Weetabix', 'Morning Harvest'],
    lastDelivery: '2025-05-01',
  },
  {
    id: '12',
    name: 'Brookside',
    phone: '0706433571',
    products: ['Delamere Yoghurts', 'Ilara', 'Tuzo Milk', 'Brookwide'],
    lastDelivery: '2025-04-30',
  },
  {
    id: '13',
    name: 'Farmers Choice',
    phone: '0749841961',
    lastDelivery: '2025-04-29',
  },
  {
    id: '14',
    name: 'Mahitaji',
    phone: '0715795822',
    products: ['Salt', 'Sunrise', 'Pembe'],
    lastDelivery: '2025-04-28',
  },
  {
    id: '15',
    name: 'Unilever',
    contactPerson: 'Collins',
    phone: '0715877082',
    products: ['Gamaag'],
    lastDelivery: '2025-04-27',
  },
  {
    id: '16',
    name: 'Cadbury Chocolate',
    contactPerson: 'Chuba',
    phone: '0774575485',
    lastDelivery: '2025-04-26',
  },
  {
    id: '17',
    name: 'Milk Bakers',
    phone: '',
    lastDelivery: '2025-04-25',
  },
  {
    id: '18',
    name: 'Dairyland Chocolates',
    phone: '0742572681',
    lastDelivery: '2025-04-24',
  },
  {
    id: '19',
    name: 'Mjengo',
    phone: '',
    products: ['Huvita Biscuits', 'Daawat Rice', 'Spaghetti Daawat', 'Macaroni', 'Tomato'],
    lastDelivery: '2025-04-23',
  },
  {
    id: '20',
    name: 'Zenko',
    phone: '',
    products: ['Hanar Tissue', 'Fiera Tissue', 'Fiara Tissue', 'Bella Tissue'],
    lastDelivery: '2025-04-22',
  },
  {
    id: '21',
    name: 'Debenhams & Few',
    phone: '0106607458',
    products: ['Manji Biscuits', 'Santa Maria'],
    lastDelivery: '2025-04-21',
  },
  {
    id: '22',
    name: 'Meror',
    phone: '0722527491',
    products: ['Fruity', 'Salt', 'Zesta Peanuts', 'Vinegar', 'Baking Bicarbonate', 'Sawa Bathing Soap'],
    lastDelivery: '2025-04-20',
  },
  {
    id: '23',
    name: 'Pinegrost',
    phone: '0704169528',
    products: ['Ribena', 'Lucozade', 'Frescape', 'Milo', 'Maggi Cubes', 'Bolt Insect Killer'],
    lastDelivery: '2025-04-19',
  },
  {
    id: '24',
    name: 'Raa',
    phone: '0710856144',
    products: ['Tropical Heat Crisps', 'Spicer', 'King Kubwa Lollipop', 'Raa Agarbathi Incense Sticks'],
    lastDelivery: '2025-04-18',
  }
];
