export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  details: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  isNew?: boolean;
  isSale?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Silk Blend Oversized Blazer",
    price: 189,
    originalPrice: 249,
    category: "Women",
    description: "Elevate your wardrobe with this luxurious silk blend oversized blazer. Perfect for both office wear and evening occasions.",
    details: [
      "70% Silk, 30% Polyester",
      "Relaxed oversized fit",
      "Single-breasted design",
      "Two front flap pockets",
      "Fully lined interior",
      "Dry clean only"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Black", hex: "#1a1a1a" },
      { name: "Ivory", hex: "#f5f5dc" },
      { name: "Camel", hex: "#c19a6b" }
    ],
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800",
      "https://images.unsplash.com/photo-1583744946564-b52d01c21f68?w=800",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"
    ],
    isSale: true
  },
  {
    id: "2",
    name: "Classic Tailored Trousers",
    price: 129,
    category: "Women",
    description: "Timeless tailored trousers crafted from premium wool blend fabric. A wardrobe essential for the modern professional.",
    details: [
      "60% Wool, 40% Polyester",
      "High-rise fit",
      "Straight leg silhouette",
      "Side zip closure",
      "Pressed front crease",
      "Machine washable"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Navy", hex: "#1a2744" },
      { name: "Black", hex: "#1a1a1a" },
      { name: "Grey", hex: "#6b6b6b" }
    ],
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800"
    ],
    isNew: true
  },
  {
    id: "3",
    name: "Cashmere Crewneck Sweater",
    price: 299,
    category: "Men",
    description: "Pure cashmere crewneck sweater offering unparalleled softness and warmth. Investment piece for years to come.",
    details: [
      "100% Pure Cashmere",
      "Regular fit",
      "Ribbed cuffs and hem",
      "Lightweight yet warm",
      "Hand wash recommended",
      "Made in Italy"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Charcoal", hex: "#36454f" },
      { name: "Navy", hex: "#1a2744" },
      { name: "Burgundy", hex: "#722f37" }
    ],
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"
    ],
    isNew: true
  },
  {
    id: "4",
    name: "Linen Summer Shirt",
    price: 89,
    category: "Men",
    description: "Breathable linen shirt perfect for warm weather. Features a relaxed fit for effortless summer style.",
    details: [
      "100% European Linen",
      "Relaxed fit",
      "Button-down collar",
      "Chest pocket",
      "Mother of pearl buttons",
      "Machine washable"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#ffffff" },
      { name: "Sky Blue", hex: "#87ceeb" },
      { name: "Sage", hex: "#9dc183" }
    ],
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
      "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800"
    ]
  },
  {
    id: "5",
    name: "Midi Wrap Dress",
    price: 159,
    originalPrice: 199,
    category: "Women",
    description: "Elegant midi wrap dress in flowing fabric. Flattering silhouette suitable for any occasion.",
    details: [
      "100% Viscose",
      "Wrap front design",
      "Adjustable waist tie",
      "Midi length",
      "Flowing A-line skirt",
      "Hand wash recommended"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Emerald", hex: "#50c878" },
      { name: "Black", hex: "#1a1a1a" },
      { name: "Rust", hex: "#b7410e" }
    ],
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800"
    ],
    isSale: true
  },
  {
    id: "6",
    name: "Leather Crossbody Bag",
    price: 249,
    category: "Accessories",
    description: "Handcrafted leather crossbody bag with adjustable strap. Perfect size for daily essentials.",
    details: [
      "Full grain leather",
      "Adjustable shoulder strap",
      "Gold-tone hardware",
      "Interior zip pocket",
      "Magnetic snap closure",
      "Dust bag included"
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Tan", hex: "#d2b48c" },
      { name: "Black", hex: "#1a1a1a" },
      { name: "Cognac", hex: "#9a463d" }
    ],
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800"
    ],
    isNew: true
  },
  {
    id: "7",
    name: "Wool Blend Coat",
    price: 349,
    category: "Women",
    description: "Timeless wool blend coat with classic double-breasted design. A sophisticated layer for cooler days.",
    details: [
      "80% Wool, 20% Polyamide",
      "Double-breasted design",
      "Peak lapel collar",
      "Two side pockets",
      "Full lining",
      "Dry clean only"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Camel", hex: "#c19a6b" },
      { name: "Black", hex: "#1a1a1a" },
      { name: "Grey", hex: "#808080" }
    ],
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800",
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"
    ]
  },
  {
    id: "8",
    name: "Slim Fit Chinos",
    price: 99,
    category: "Men",
    description: "Essential slim fit chinos in stretch cotton. Versatile style for casual to smart-casual occasions.",
    details: [
      "98% Cotton, 2% Elastane",
      "Slim fit through leg",
      "Mid-rise waist",
      "Button and zip fly",
      "Side and back pockets",
      "Machine washable"
    ],
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: [
      { name: "Khaki", hex: "#c3b091" },
      { name: "Navy", hex: "#1a2744" },
      { name: "Olive", hex: "#556b2f" }
    ],
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800",
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800"
    ]
  }
];

export const categories = [
  { name: "Women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", count: 156 },
  { name: "Men", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800", count: 124 },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800", count: 89 }
];
