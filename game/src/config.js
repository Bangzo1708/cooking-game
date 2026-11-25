// Dapur Kilat — tuning, ingredients and recipes.
// A warung rush game: customers queue at the counter, each order is a recipe of
// ingredients. Raw ingredients (ayam, sayur, tahu) must be chopped on the cutting
// board first; the rest go straight onto the plate. Serve the finished plate to
// the matching order before its patience timer runs out.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const MAX_HEARTS = 3;
export const PLATE_SLOTS = 5;

// Patience (seconds) of a fresh order, shrinking as the shift heats up.
export const PATIENCE_START = 42;
export const PATIENCE_MIN = 24;
// Gap (seconds) between new orders, shrinking as the shift heats up.
export const SPAWN_START = 11;
export const SPAWN_MIN = 6.5;

// Coins: base per dish, plus one coin per whole patience second left, plus combo.
export const COIN_BASE = 10;
export const COIN_PER_PATIENCE_SECOND = 1;
export const COIN_PER_COMBO = 2;

// How long the "shift over" summary waits before it accepts a restart key.
export const OVER_ARM_SECONDS = 0.8;

export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#f7f3e3', dark: '#cbbf9a', raw: false, chops: 0 },
  { id: 'mie', name: 'Mie', key: '2', color: '#f2c14e', dark: '#b98a1d', raw: false, chops: 0 },
  { id: 'ayam', name: 'Ayam', key: '3', color: '#c97b4a', dark: '#8a4a22', raw: true, chops: 2 },
  { id: 'telur', name: 'Telur', key: '4', color: '#fdf6d8', dark: '#d9a441', raw: false, chops: 0 },
  { id: 'sayur', name: 'Sayur', key: '5', color: '#5da24a', dark: '#2f6b2a', raw: true, chops: 1 },
  { id: 'sambal', name: 'Sambal', key: '6', color: '#d93a2b', dark: '#8f1d12', raw: false, chops: 0 },
  { id: 'tahu', name: 'Tahu', key: '7', color: '#f3e6c8', dark: '#b99b62', raw: true, chops: 1 },
  { id: 'kerupuk', name: 'Kerupuk', key: '8', color: '#f2a0b5', dark: '#b85c74', raw: false, chops: 0 },
];

export function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

// Each dish is a set of ingredient ids; the plate must hold exactly that set,
// every piece chopped, in any order.
export const RECIPES = [
  { name: 'Nasi Goreng Kilat', needs: ['nasi', 'telur', 'sayur', 'sambal'], coins: 12 },
  { name: 'Mie Ayam Geprek', needs: ['mie', 'ayam', 'sambal'], coins: 12 },
  { name: 'Nasi Ayam Telur', needs: ['nasi', 'ayam', 'telur'], coins: 11 },
  { name: 'Mie Sayur Tahu', needs: ['mie', 'sayur', 'tahu'], coins: 10 },
  { name: 'Nasi Sambal Kerupuk', needs: ['nasi', 'sambal', 'kerupuk'], coins: 9 },
  { name: 'Mie Telur Kerupuk', needs: ['mie', 'telur', 'kerupuk'], coins: 9 },
  { name: 'Nasi Tahu Sayur', needs: ['nasi', 'tahu', 'sayur'], coins: 10 },
  { name: 'Mie Ayam Sayur', needs: ['mie', 'ayam', 'sayur'], coins: 11 },
  { name: 'Nasi Ayam Sambal', needs: ['nasi', 'ayam', 'sambal'], coins: 11 },
  { name: 'Mie Goreng Spesial', needs: ['mie', 'telur', 'sayur', 'sambal'], coins: 13 },
];

export const CUSTOMER_SHIRTS = ['#e4572e', '#2e86ab', '#f2a541', '#7d5ba6', '#3e8853', '#c44569'];
export const CUSTOMER_HATS = ['none', 'cap', 'headband', 'bandana'];
export const CUSTOMER_SKINS = ['#f2c89b', '#e0a878', '#c98d5f', '#8d5a3b'];

// Layout of the kitchen, in canvas pixels. The order board sits at the top, the
// worktop (stove, cutting board, plate, serve button) in the middle, and the
// ingredient counter along the bottom.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 58 },
  board: { x: 24, y: 84, w: 1232, h: 132 },
  customers: { y: 216 },
  stove: { x: 48, y: 300, w: 250, h: 210 },
  boardZone: { x: 340, y: 300, w: 280, h: 210 },
  plateZone: { x: 664, y: 292, w: 300, h: 218 },
  serve: { x: 1004, y: 330, w: 228, h: 150 },
  counter: { x: 24, y: 560, w: 1232, h: 216 },
  binWidth: 140,
  binGap: 14,
};
