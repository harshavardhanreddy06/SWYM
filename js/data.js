// js/data.js — Static Product Catalog
// 16 fashion/lifestyle products across 4 categories
// Pure data, zero logic — loaded before store.js and app.js

window.PRODUCTS = [

  // ── TOPS ──────────────────────────────────────────────────────

  {
    id: "top-001",
    name: "Linen Relaxed Shirt",
    brand: "Aritzia",
    category: "Tops",
    price: 68,
    originalPrice: 68,
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    description: "Breathable linen blend with a relaxed drape. Perfect for warm-weather layering.",
    tags: ["linen", "casual", "summer", "button-down"],
    inStock: true,
    rating: 4.6,
    reviewCount: 214
  },
  {
    id: "top-002",
    name: "Ribbed Crop Tank",
    brand: "Reformation",
    category: "Tops",
    price: 38,
    originalPrice: 58,
    imageUrl: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=80",
    description: "Fine-rib knit crop tank in sustainable fabric. Pairs with everything.",
    tags: ["crop", "tank", "basics", "sustainable"],
    inStock: true,
    rating: 4.4,
    reviewCount: 389
  },
  {
    id: "top-003",
    name: "Oversized Graphic Tee",
    brand: "ACNE Studios",
    category: "Tops",
    price: 120,
    originalPrice: 120,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    description: "Heavy 100% cotton with a signature drop-shoulder silhouette.",
    tags: ["graphic", "oversized", "streetwear", "cotton"],
    inStock: true,
    rating: 4.7,
    reviewCount: 156
  },
  {
    id: "top-004",
    name: "Silk Slip Blouse",
    brand: "Vince",
    category: "Tops",
    price: 245,
    originalPrice: 295,
    imageUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80",
    description: "Liquid-silk camisole blouse with adjustable spaghetti straps. Effortlessly elegant.",
    tags: ["silk", "blouse", "evening", "minimal"],
    inStock: false,
    rating: 4.8,
    reviewCount: 92
  },

  // ── BOTTOMS ───────────────────────────────────────────────────

  {
    id: "bot-001",
    name: "Wide-Leg Linen Trousers",
    brand: "& Other Stories",
    category: "Bottoms",
    price: 99,
    originalPrice: 99,
    imageUrl: "https://images.unsplash.com/photo-1594938374182-a47e530f8ab3?w=600&q=80",
    description: "Relaxed wide-leg silhouette in breathable linen. High-rise with a clean front.",
    tags: ["linen", "wide-leg", "trousers", "summer"],
    inStock: true,
    rating: 4.5,
    reviewCount: 178
  },
  {
    id: "bot-002",
    name: "High-Rise Straight Jeans",
    brand: "Agolde",
    category: "Bottoms",
    price: 188,
    originalPrice: 220,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    description: "90s-inspired high-rise jeans with a straight leg and authentic denim feel.",
    tags: ["denim", "jeans", "90s", "high-rise"],
    inStock: true,
    rating: 4.6,
    reviewCount: 443
  },
  {
    id: "bot-003",
    name: "Pleated Mini Skirt",
    brand: "Miu Miu",
    category: "Bottoms",
    price: 580,
    originalPrice: 580,
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5218b5f5e0?w=600&q=80",
    description: "Signature pleated wool-blend mini with a back zip. Statement schoolgirl chic.",
    tags: ["mini", "skirt", "pleated", "designer"],
    inStock: true,
    rating: 4.9,
    reviewCount: 67
  },
  {
    id: "bot-004",
    name: "Cargo Utility Shorts",
    brand: "Carhartt WIP",
    category: "Bottoms",
    price: 95,
    originalPrice: 95,
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80",
    description: "Durable ripstop fabric with multiple utility pockets. Relaxed skater fit.",
    tags: ["cargo", "shorts", "utility", "streetwear"],
    inStock: true,
    rating: 4.3,
    reviewCount: 201
  },

  // ── SHOES ─────────────────────────────────────────────────────

  {
    id: "shoe-001",
    name: "Classic Leather Sneaker",
    brand: "Common Projects",
    category: "Shoes",
    price: 425,
    originalPrice: 425,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    description: "The Achilles Low in full-grain leather. Minimal logo, maximum versatility.",
    tags: ["sneaker", "leather", "minimal", "white"],
    inStock: true,
    rating: 4.8,
    reviewCount: 532
  },
  {
    id: "shoe-002",
    name: "Strappy Kitten Heel",
    brand: "Mango",
    category: "Shoes",
    price: 89,
    originalPrice: 120,
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
    description: "Ankle-strap sandal with a 2\" kitten heel. Goes from brunch to dinner seamlessly.",
    tags: ["heels", "sandal", "strappy", "evening"],
    inStock: true,
    rating: 4.2,
    reviewCount: 118
  },
  {
    id: "shoe-003",
    name: "Chelsea Boot",
    brand: "Dr. Martens",
    category: "Shoes",
    price: 175,
    originalPrice: 175,
    imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80",
    description: "Polished Chelsea boot with elastic side panels and signature air-cushioned sole.",
    tags: ["boots", "chelsea", "leather", "fall"],
    inStock: false,
    rating: 4.7,
    reviewCount: 284
  },
  {
    id: "shoe-004",
    name: "Platform Mary Jane",
    brand: "Salome",
    category: "Shoes",
    price: 198,
    originalPrice: 240,
    imageUrl: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&q=80",
    description: "Chunky platform sole with buckle strap. A perfect balance of cute and edgy.",
    tags: ["platform", "mary-jane", "chunky", "y2k"],
    inStock: true,
    rating: 4.5,
    reviewCount: 73
  },

  // ── ACCESSORIES ───────────────────────────────────────────────

  {
    id: "acc-001",
    name: "Mini Canvas Tote",
    brand: "Baggu",
    category: "Accessories",
    price: 36,
    originalPrice: 36,
    imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
    description: "Compact ripstop nylon tote. Folds into itself, holds more than it looks.",
    tags: ["tote", "bag", "canvas", "everyday"],
    inStock: true,
    rating: 4.7,
    reviewCount: 619
  },
  {
    id: "acc-002",
    name: "Tortoise Acetate Sunglasses",
    brand: "Warby Parker",
    category: "Accessories",
    price: 145,
    originalPrice: 145,
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80",
    description: "Keyhole bridge with handcrafted acetate frames. UV400 lenses included.",
    tags: ["sunglasses", "acetate", "tortoise", "summer"],
    inStock: true,
    rating: 4.4,
    reviewCount: 292
  },
  {
    id: "acc-003",
    name: "Ribbed Merino Beanie",
    brand: "Norse Projects",
    category: "Accessories",
    price: 60,
    originalPrice: 60,
    imageUrl: "https://images.unsplash.com/photo-1510598155599-a4eb14fcfdae?w=600&q=80",
    description: "100% merino wool rib-knit beanie. Slim-fit silhouette for all face shapes.",
    tags: ["beanie", "wool", "winter", "minimal"],
    inStock: true,
    rating: 4.6,
    reviewCount: 148
  },
  {
    id: "acc-004",
    name: "Slim Leather Card Holder",
    brand: "Bellroy",
    category: "Accessories",
    price: 79,
    originalPrice: 95,
    imageUrl: "https://images.unsplash.com/photo-1614179818511-dfb10d6b51b0?w=600&q=80",
    description: "Slim full-grain leather card holder. Holds up to 8 cards with a hidden cash pocket.",
    tags: ["wallet", "leather", "minimal", "everyday"],
    inStock: true,
    rating: 4.8,
    reviewCount: 381
  }

];
