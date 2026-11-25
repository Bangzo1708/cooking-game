// Game state and rules for Dapur Kilat: orders, the plate, the cutting board,
// serving, timers, combo and the shift clock. Pure logic — no drawing here, so
// the screenshot scenes can drive it directly.

import {
  CANVAS_WIDTH,
  CUSTOMER_HATS,
  CUSTOMER_SHIRTS,
  CUSTOMER_SKINS,
  INGREDIENTS,
  LAYOUT,
  MAX_HEARTS,
  MAX_ORDERS,
  PATIENCE_MIN,
  PATIENCE_START,
  PLATE_SLOTS,
  RECIPES,
  SHIFT_SECONDS,
  SPAWN_MIN,
  SPAWN_START,
  COIN_BASE,
  COIN_PER_COMBO,
  COIN_PER_PATIENCE_SECOND,
  OVER_ARM_SECONDS,
  ingredientById,
} from './config.js';
import { makeRandom, randomPick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_FAILED = 2;
export const EVENT_TIMEOUT = 4;
export const EVENT_OVER = 8;

/** Progress of the shift, 0 at the first order, 1 at the last minute. */
export function shiftProgress(state) {
  return Math.min(1, Math.max(0, 1 - state.shiftLeft / SHIFT_SECONDS));
}

export function patienceFor(state) {
  return PATIENCE_START - (PATIENCE_START - PATIENCE_MIN) * shiftProgress(state);
}

export function spawnGapFor(state) {
  return SPAWN_START - (SPAWN_START - SPAWN_MIN) * shiftProgress(state);
}

export function createState(seed) {
  const rng = makeRandom(seed || 20261125);
  return {
    rng,
    seed: seed || 20261125,
    screen: SCREEN_TITLE,
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    spawnIn: 2.5,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    served: 0,
    failed: 0,
    timedOut: 0,
    orders: [],
    plate: [],
    board: null,
    particles: [],
    floats: [],
    nextOrderId: 1,
    message: '',
    messageUntil: 0,
    messageKind: '',
    shakeBoardUntil: 0,
    shakePlateUntil: 0,
    serveFlashUntil: 0,
    lastTickSecond: -1,
    overAt: 0,
    paused: false,
    muted: false,
    orderServedAt: -1,
  };
}

/** Start a fresh shift from the title screen. */
export function startShift(state) {
  const fresh = createState((state.seed + 7919) % 2147483647);
  fresh.screen = SCREEN_PLAY;
  fresh.muted = state.muted;
  Object.assign(state, fresh);
  spawnOrder(state);
  spawnOrder(state);
}

function makeCustomer(rng) {
  return {
    shirt: randomPick(rng, CUSTOMER_SHIRTS),
    skin: randomPick(rng, CUSTOMER_SKINS),
    hat: randomPick(rng, CUSTOMER_HATS),
    mood: 'waiting',
    moodUntil: 0,
    bounce: rng() * Math.PI * 2,
  };
}

export function makeOrder(state, recipe, patience) {
  const order = {
    id: state.nextOrderId,
    recipe,
    patience: patience === undefined ? patienceFor(state) : patience,
    patienceMax: patience === undefined ? patienceFor(state) : patience,
    customer: makeCustomer(state.rng),
    bornAt: state.time,
    flashUntil: 0,
  };
  state.nextOrderId += 1;
  return order;
}

/** Add a new order to the board if a slot is free. */
export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return false;
  const used = new Set(state.orders.map((order) => order.recipe.name));
  const pool = RECIPES.filter((recipe) => !used.has(recipe.name));
  const recipe = randomPick(state.rng, pool.length ? pool : RECIPES);
  state.orders.push(makeOrder(state, recipe));
  return true;
}

/** Is the plate exactly this recipe, every piece chopped, in any order? */
export function plateMatchesRecipe(state, recipe) {
  if (state.plate.length !== recipe.needs.length) return false;
  if (state.plate.some((piece) => !piece.chopped)) return false;
  const have = state.plate.map((piece) => piece.id).sort().join(',');
  return recipe.needs.slice().sort().join(',') === have;
}

/** The first order whose recipe the plate currently matches, or null. */
export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatchesRecipe(state, order.recipe)) return order;
  }
  return null;
}

/** Put an ingredient from the counter onto the board (raw) or the plate. */
export function addIngredient(state, id) {
  if (state.screen !== SCREEN_PLAY || state.paused) return false;
  const def = ingredientById(id);
  if (!def) return false;
  if (def.raw) {
    if (state.board) {
      state.message = 'Talenan penuh! Cincang dulu bahannya.';
      state.messageKind = 'warn';
      state.messageUntil = state.time + 1.6;
      state.shakeBoardUntil = state.time + 0.35;
      return false;
    }
    state.board = { id, chopsDone: 0, chopsNeeded: def.chops, wobble: 0 };
    return 'board';
  }
  if (state.plate.length >= PLATE_SLOTS) {
    state.message = 'Piring penuh! Sajikan dulu.';
    state.messageKind = 'warn';
    state.messageUntil = state.time + 1.6;
    state.shakePlateUntil = state.time + 0.35;
    return false;
  }
  state.plate.push({ id, chopped: true, chopsDone: 0, chopsNeeded: 0, popAt: state.time });
  return 'plate';
}

/** One chop on the cutting board; a finished piece hops onto the plate. */
export function chopBoard(state) {
  if (state.screen !== SCREEN_PLAY || state.paused || !state.board) return false;
  state.board.chopsDone += 1;
  state.board.wobble = state.time;
  if (state.board.chopsDone < state.board.chopsNeeded) return 'chop';
  if (state.plate.length >= PLATE_SLOTS) {
    state.board.chopsDone = state.board.chopsNeeded;
    state.message = 'Piring penuh! Sajikan dulu.';
    state.messageKind = 'warn';
    state.messageUntil = state.time + 1.6;
    return 'full';
  }
  const piece = { id: state.board.id, chopped: true, chopsDone: state.board.chopsNeeded, chopsNeeded: state.board.chopsNeeded, popAt: state.time };
  state.plate.push(piece);
  state.board = null;
  return 'done';
}

/** Remove the last piece from the plate (right-click / Backspace). */
export function takeOffPlate(state) {
  if (state.screen !== SCREEN_PLAY || state.paused || state.plate.length === 0) return false;
  state.plate.pop();
  return true;
}

/** Clear the plate entirely (the bin button). */
export function clearPlate(state) {
  if (state.screen !== SCREEN_PLAY || state.paused) return false;
  state.plate = [];
  state.board = null;
  return true;
}

function burst(state, x, y, colors, count, speed) {
  for (let index = 0; index < count; index += 1) {
    const angle = state.rng() * Math.PI * 2;
    const velocity = speed * (0.4 + state.rng() * 0.8);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 60,
      life: 0.7 + state.rng() * 0.4,
      age: 0,
      color: colors[Math.floor(state.rng() * colors.length)],
      size: 3 + state.rng() * 5,
    });
  }
}

function floatText(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, age: 0, life: 1.2 });
}

/** Serve the plate to one order. Returns an EVENT_* bitmask. */
export function serveOrder(state, order) {
  if (state.screen !== SCREEN_PLAY || state.paused || !order) return EVENT_NONE;
  if (!plateMatchesRecipe(state, order.recipe)) {
    state.combo = 0;
    state.failed += 1;
    state.hearts -= 1;
    order.customer.mood = 'angry';
    order.customer.moodUntil = state.time + 1.4;
    state.plate = [];
    state.message = 'Salah racikan! Pelanggan kecewa.';
    state.messageKind = 'bad';
    state.messageUntil = state.time + 1.8;
    state.serveFlashUntil = state.time + 0.4;
    if (state.hearts <= 0) return endShift(state) | EVENT_FAILED;
    return EVENT_FAILED;
  }
  const bonus = Math.round(order.patience) * COIN_PER_PATIENCE_SECOND;
  const earned = COIN_BASE + order.recipe.coins + bonus + state.combo * COIN_PER_COMBO;
  state.coins += earned;
  state.score += earned * 10 + state.combo * 25;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  const slot = state.orders.indexOf(order);
  const ticket = orderTicketRect(slot);
  burst(state, ticket.x + ticket.w / 2, ticket.y + 40, ['#ffd166', '#f2c14e', '#ffffff', '#e4572e'], 22, 190);
  floatText(state, ticket.x + ticket.w / 2, ticket.y + 20, `+${earned} koin`, '#ffd166');
  if (state.combo >= 3) floatText(state, ticket.x + ticket.w / 2, ticket.y + 52, `KOMBO x${state.combo}!`, '#ff8fa3');
  order.customer.mood = 'happy';
  order.customer.moodUntil = state.time + 1.6;
  state.orders.splice(slot, 1);
  state.plate = [];
  state.spawnIn = Math.min(state.spawnIn, 1.2);
  state.serveFlashUntil = state.time + 0.3;
  state.orderServedAt = state.time;
  return EVENT_SERVED;
}

/** Serve to the first order the plate matches; false when nothing matches. */
export function serveMatching(state) {
  const order = matchingOrder(state);
  if (!order) {
    state.message = 'Belum ada pesanan yang cocok — cek resepnya!';
    state.messageKind = 'warn';
    state.messageUntil = state.time + 1.6;
    return EVENT_NONE;
  }
  return serveOrder(state, order);
}

function endShift(state) {
  state.screen = SCREEN_OVER;
  state.overAt = state.time;
  return EVENT_OVER;
}

/** Advance the world by dt seconds. Returns an EVENT_* bitmask. */
export function update(state, dt) {
  if (state.screen !== SCREEN_PLAY || state.paused) return EVENT_NONE;
  state.time += dt;
  state.shiftLeft = Math.max(0, state.shiftLeft - dt);
  let events = EVENT_NONE;

  const wholeSecond = Math.floor(state.shiftLeft);
  if (wholeSecond !== state.lastTickSecond) {
    state.lastTickSecond = wholeSecond;
    if (state.shiftLeft <= 10.5 && state.shiftLeft > 0) events |= 0; // tick sound handled by main
  }

  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    if (spawnOrder(state)) state.spawnIn = spawnGapFor(state);
    else state.spawnIn = 1.5;
  }

  for (let index = state.orders.length - 1; index >= 0; index -= 1) {
    const order = state.orders[index];
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders.splice(index, 1);
      state.timedOut += 1;
      state.combo = 0;
      state.hearts -= 1;
      state.message = `${order.recipe.name} keburu dingin — pelanggan pergi!`;
      state.messageKind = 'bad';
      state.messageUntil = state.time + 1.8;
      events |= EVENT_TIMEOUT;
      if (state.hearts <= 0) {
        events |= endShift(state);
        return events;
      }
    }
  }

  for (let index = state.particles.length - 1; index >= 0; index -= 1) {
    const particle = state.particles[index];
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 320 * dt;
    if (particle.age >= particle.life) state.particles.splice(index, 1);
  }
  for (let index = state.floats.length - 1; index >= 0; index -= 1) {
    const item = state.floats[index];
    item.age += dt;
    item.y -= 42 * dt;
    if (item.age >= item.life) state.floats.splice(index, 1);
  }

  if (state.shiftLeft <= 0) events |= endShift(state);
  return events;
}

/** Screen rectangle of an order ticket slot (0..2). */
export function orderTicketRect(slot) {
  const board = LAYOUT.board;
  const gap = 16;
  const width = (board.w - gap * (MAX_ORDERS - 1)) / MAX_ORDERS;
  return { x: board.x + slot * (width + gap), y: board.y, w: width, h: board.h };
}

/** Screen rectangle of an ingredient bin (0..7). */
export function binRect(index) {
  const counter = LAYOUT.counter;
  const gap = LAYOUT.binGap;
  const width = LAYOUT.binWidth;
  const total = INGREDIENTS.length * width + (INGREDIENTS.length - 1) * gap;
  const startX = counter.x + (counter.w - total) / 2;
  return { x: startX + index * (width + gap), y: counter.y + 44, w: width, h: counter.h - 52 };
}

/** Hit test: which ingredient bin (index) holds this point, or -1. */
export function binAt(x, y) {
  for (let index = 0; index < INGREDIENTS.length; index += 1) {
    const rect = binRect(index);
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return index;
  }
  return -1;
}

/** Hit test: which order ticket (slot) holds this point, or -1. */
export function ticketAt(x, y) {
  for (let slot = 0; slot < MAX_ORDERS; slot += 1) {
    const rect = orderTicketRect(slot);
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return slot;
  }
  return -1;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** How much of the shift is left, as mm:ss. */
export function formatClock(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

/** Summary lines for the game-over screen. */
export function shiftSummary(state) {
  return [
    { label: 'Hidangan disajikan', value: String(state.served) },
    { label: 'Koin dikumpulkan', value: `${state.coins} koin` },
    { label: 'Kombo terbaik', value: `x${state.bestCombo}` },
    { label: 'Pesanan gagal', value: String(state.failed + state.timedOut) },
    { label: 'Skor akhir', value: String(state.score) },
  ];
}

export { OVER_ARM_SECONDS };
