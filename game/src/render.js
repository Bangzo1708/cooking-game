// All canvas drawing for Dapur Kilat: the kitchen, the order board, the
// customers, the stove, the cutting board, the plate, the ingredient counter,
// and the title / pause / game-over screens. Every picture is drawn in code;
// the game loads no image files.

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INGREDIENTS,
  LAYOUT,
  MAX_HEARTS,
  ingredientById,
} from './config.js';
import {
  OVER_ARM_SECONDS,
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  binRect,
  formatClock,
  matchingOrder,
  orderTicketRect,
  shiftSummary,
} from './state.js';

const FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";

function roundRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align, weight) {
  ctx.font = `${weight || 'bold'} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function shadowedText(ctx, value, x, y, size, color, align, weight) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 2;
  text(ctx, value, x, y, size, color, align, weight);
  ctx.restore();
}

/** Draw one ingredient's picture. `chopped` draws the cut-up version. */
export function drawIngredientIcon(ctx, id, x, y, radius, chopped) {
  ctx.save();
  ctx.translate(x, y);
  const r = radius;
  if (id === 'nasi') {
    ctx.fillStyle = '#f7f3e3';
    ctx.beginPath();
    ctx.ellipse(0, 2, r, r * 0.62, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#cbbf9a';
    ctx.lineWidth = r * 0.07;
    ctx.stroke();
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.2, r * 0.55, r * 0.45, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9cba6';
    for (const [dx, dy] of [[-0.3, 0.1], [0.1, -0.1], [0.4, 0.2]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let row = -1; row <= 1; row += 1) {
      ctx.beginPath();
      for (let step = 0; step <= 8; step += 1) {
        const px = -r * 0.85 + (step / 8) * r * 1.7;
        const py = row * r * 0.42 + Math.sin(step * 1.4 + row) * r * 0.16;
        if (step === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = '#b98a1d';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'ayam') {
    if (chopped) {
      ctx.fillStyle = '#c97b4a';
      for (const [dx, dy, s] of [[-0.4, 0.1, 0.5], [0.15, -0.25, 0.55], [0.35, 0.3, 0.45]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, s * r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8a4a22';
      for (const [dx, dy] of [[-0.4, 0.1], [0.15, -0.25], [0.35, 0.3]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#f7ead6';
      ctx.fillRect(r * 0.35, -r * 0.12, r * 0.75, r * 0.24);
      ctx.fillStyle = '#f7ead6';
      ctx.beginPath();
      ctx.arc(r * 1.05, -r * 0.28, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 1.05, r * 0.28, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c97b4a';
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, 0, r * 0.75, r * 0.62, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a85a2e';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.3, r * 0.22, -0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'telur') {
    ctx.fillStyle = '#fdf6d8';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.72, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a93b';
    ctx.beginPath();
    ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.arc(r * 0.02, -r * 0.12, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#5da24a';
    for (let leaf = 0; leaf < 3; leaf += 1) {
      const angle = -Math.PI / 2 + (leaf - 1) * 0.6;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 0.34, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#2f6b2a';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    if (chopped) {
      ctx.strokeStyle = '#eaf7e2';
      ctx.lineWidth = r * 0.08;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.1);
      ctx.lineTo(r * 0.5, r * 0.2);
      ctx.moveTo(-r * 0.4, r * 0.35);
      ctx.lineTo(r * 0.4, -r * 0.35);
      ctx.stroke();
    }
  } else if (id === 'sambal') {
    ctx.fillStyle = '#8f1d12';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.35, r * 0.9, r * 0.45, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#d93a2b';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.85, r * 0.42, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ff6b4a';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.05, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.25, r * 0.05, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2d12';
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'tahu') {
    ctx.fillStyle = '#f3e6c8';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.2);
    ctx.lineTo(0, -r * 0.75);
    ctx.lineTo(r * 0.7, -r * 0.2);
    ctx.lineTo(r * 0.7, r * 0.45);
    ctx.lineTo(-r * 0.7, r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e2cda0';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.75);
    ctx.lineTo(r * 0.7, -r * 0.2);
    ctx.lineTo(r * 0.7, r * 0.45);
    ctx.lineTo(0, r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b99b62';
    ctx.beginPath();
    ctx.arc(-r * 0.2, r * 0.1, r * 0.08, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.2, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    if (chopped) {
      ctx.strokeStyle = '#fff8e6';
      ctx.lineWidth = r * 0.08;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.1);
      ctx.lineTo(r * 0.7, r * 0.1);
      ctx.stroke();
    }
  } else if (id === 'kerupuk') {
    ctx.fillStyle = '#f2a0b5';
    ctx.beginPath();
    for (let step = 0; step <= 24; step += 1) {
      const angle = (step / 24) * Math.PI * 2;
      const radius = r * (0.85 + 0.15 * Math.sin(angle * 6));
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (step === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d97b92';
    for (const [dx, dy] of [[-0.35, -0.2], [0.3, 0.15], [0.05, -0.4], [-0.1, 0.35]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawWall(ctx, state) {
  ctx.fillStyle = '#f6e3c2';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 560);
  ctx.strokeStyle = 'rgba(190, 150, 100, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 58);
    ctx.lineTo(x, 560);
    ctx.stroke();
  }
  for (let y = 58; y <= 560; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  // Framed menu poster on the wall.
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 560, 84, 160, 96, 10);
  ctx.fill();
  ctx.strokeStyle = '#b98a5a';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'MENU WARUNG', 640, 104, 15, '#8a5a2e');
  text(ctx, 'Nasi • Mie • Ayam', 640, 128, 14, '#5a4632', 'center', 'normal');
  text(ctx, 'Sambal • Kerupuk', 640, 150, 14, '#5a4632', 'center', 'normal');
  text(ctx, 'Harga: 1 piring = senyum', 640, 172, 12, '#a06a35', 'center', 'italic');
  // Hanging lamps.
  for (const lampX of [180, 640, 1100]) {
    ctx.strokeStyle = '#6b4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lampX, 0);
    ctx.lineTo(lampX, 34);
    ctx.stroke();
    const flicker = 0.9 + 0.1 * Math.sin(state.time * 3 + lampX);
    ctx.fillStyle = `rgba(255, 214, 120, ${0.25 * flicker})`;
    ctx.beginPath();
    ctx.arc(lampX, 62, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.moveTo(lampX - 22, 40);
    ctx.lineTo(lampX + 22, 40);
    ctx.lineTo(lampX + 12, 58);
    ctx.lineTo(lampX - 12, 58);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(lampX, 58, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Worktop band.
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(0, 540, CANVAS_WIDTH, 20);
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(0, 540, CANVAS_WIDTH, 6);
  ctx.fillStyle = '#3d2c1e';
  ctx.fillRect(0, 560, CANVAS_WIDTH, 240);
}

function drawHeader(ctx, state) {
  const header = LAYOUT.header;
  ctx.fillStyle = '#3d2c1e';
  ctx.fillRect(header.x, header.y, header.w, header.h);
  ctx.fillStyle = '#e4572e';
  ctx.fillRect(0, header.h - 4, CANVAS_WIDTH, 4);
  shadowedText(ctx, 'DAPUR KILAT', 28, 30, 30, '#ffd166', 'left');
  text(ctx, 'warung cepat saji', 232, 32, 15, '#f6e3c2', 'left', 'normal');
  // Shift clock.
  const clockUrgent = state.shiftLeft <= 30;
  ctx.fillStyle = clockUrgent ? '#d93a2b' : '#5a4632';
  roundRect(ctx, 420, 10, 160, 38, 10);
  ctx.fill();
  text(ctx, `SHIFT ${formatClock(state.shiftLeft)}`, 500, 30, 20, clockUrgent ? '#ffd166' : '#fff8e6');
  // Coins and score.
  ctx.fillStyle = '#5a4632';
  roundRect(ctx, 592, 10, 150, 38, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(614, 29, 11, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'K', 614, 30, 14, '#8a5a2e');
  text(ctx, `${state.coins} koin`, 632, 30, 17, '#fff8e6', 'left');
  ctx.fillStyle = '#5a4632';
  roundRect(ctx, 754, 10, 150, 38, 10);
  ctx.fill();
  text(ctx, `SKOR ${state.score}`, 829, 30, 17, '#fff8e6');
  // Combo badge.
  if (state.combo >= 2) {
    ctx.fillStyle = '#ff8fa3';
    roundRect(ctx, 916, 10, 84, 38, 10);
    ctx.fill();
    text(ctx, `x${state.combo}`, 958, 30, 16, '#fff');
  }
  // Hearts, then mute and pause buttons.
  drawHearts(ctx, 1012, 29, state.hearts);
  ctx.fillStyle = '#5a4632';
  roundRect(ctx, 1096, 10, 74, 38, 10);
  ctx.fill();
  text(ctx, state.muted ? 'SUARA ✕' : 'SUARA ✓', 1133, 30, 12, '#fff8e6');
  ctx.fillStyle = '#5a4632';
  roundRect(ctx, 1178, 10, 74, 38, 10);
  ctx.fill();
  text(ctx, 'JEDA', 1215, 30, 12, '#fff8e6');
}

function drawHearts(ctx, x, y, hearts) {
  // Three small hearts in a row, filled red while the heart lasts.
  ctx.save();
  ctx.translate(x, y - 12);
  for (let index = 0; index < MAX_HEARTS; index += 1) {
    const hx = index * 26;
    ctx.fillStyle = index < hearts ? '#e63946' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx + 10, 26);
    ctx.bezierCurveTo(hx - 2, 14, hx + 2, 4, hx + 10, 10);
    ctx.bezierCurveTo(hx + 18, 4, hx + 22, 14, hx + 10, 26);
    ctx.fill();
  }
  ctx.restore();
}

function drawCustomer(ctx, customer, x, y, scale) {
  const bounce = Math.sin(customer.bounce + (customer.mood === 'happy' ? 8 : 0)) * 2;
  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.scale(scale, scale);
  // Body.
  ctx.fillStyle = customer.shirt;
  roundRect(ctx, -26, -6, 52, 46, 12);
  ctx.fill();
  // Head.
  ctx.fillStyle = customer.skin;
  ctx.beginPath();
  ctx.arc(0, -26, 22, 0, Math.PI * 2);
  ctx.fill();
  // Hat.
  if (customer.hat === 'cap') {
    ctx.fillStyle = '#2e86ab';
    ctx.beginPath();
    ctx.arc(0, -30, 22, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-22, -32, 44, 6);
    ctx.fillRect(6, -32, 26, 7);
  } else if (customer.hat === 'headband') {
    ctx.strokeStyle = '#e4572e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -26, 21, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (customer.hat === 'bandana') {
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.arc(0, -30, 22, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-18, -34);
    ctx.lineTo(-30, -14);
    ctx.lineTo(-12, -22);
    ctx.closePath();
    ctx.fill();
  }
  // Face.
  ctx.fillStyle = '#2b2118';
  if (customer.mood === 'happy') {
    ctx.beginPath();
    ctx.arc(-8, -28, 2.6, 0, Math.PI * 2);
    ctx.arc(8, -28, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -18, 8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (customer.mood === 'angry') {
    ctx.beginPath();
    ctx.arc(-8, -26, 2.6, 0, Math.PI * 2);
    ctx.arc(8, -26, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-12, -36);
    ctx.lineTo(-4, -32);
    ctx.moveTo(12, -36);
    ctx.lineTo(4, -32);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -12, 6, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-8, -28, 2.6, 0, Math.PI * 2);
    ctx.arc(8, -28, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -18, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOrderBoard(ctx, state) {
  const board = LAYOUT.board;
  text(ctx, 'PAPAN PESANAN', board.x + 4, board.y - 14, 16, '#8a5a2e', 'left');
  text(ctx, 'klik tiket untuk menyajikan piring ke pelanggan itu', board.x + board.w, board.y - 14, 13, '#a06a35', 'right', 'normal');
  for (let slot = 0; slot < 3; slot += 1) {
    const rect = orderTicketRect(slot);
    const order = state.orders[slot];
    ctx.fillStyle = order ? '#fff8e6' : 'rgba(255,248,230,0.45)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.strokeStyle = order ? '#c9a86a' : 'rgba(180,150,100,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!order) {
      text(ctx, '— kosong —', rect.x + rect.w / 2, rect.y + rect.h / 2, 16, '#b99b62', 'center', 'normal');
      continue;
    }
    const urgent = order.patience <= 10;
    const ready = plateMatches(state, order);
    // Customer face + dish name.
    drawCustomer(ctx, order.customer, rect.x + 34, rect.y + 62, 0.62);
    text(ctx, order.recipe.name, rect.x + 66, rect.y + 24, 18, '#3d2c1e', 'left');
    text(ctx, `#${order.id}`, rect.x + rect.w - 12, rect.y + 24, 13, '#a06a35', 'right', 'normal');
    // Ingredient icons needed.
    const icons = order.recipe.needs;
    const iconY = rect.y + 62;
    icons.forEach((id, index) => {
      const ix = rect.x + 78 + index * 46;
      ctx.fillStyle = '#f6e3c2';
      ctx.beginPath();
      ctx.arc(ix, iconY, 19, 0, Math.PI * 2);
      ctx.fill();
      const have = state.plate.some((piece) => piece.id === id && piece.chopped);
      ctx.strokeStyle = have ? '#3e8853' : '#c9a86a';
      ctx.lineWidth = have ? 3 : 1.5;
      ctx.stroke();
      drawIngredientIcon(ctx, id, ix, iconY, 14, false);
      if (have) {
        ctx.fillStyle = '#3e8853';
        ctx.beginPath();
        ctx.arc(ix + 13, iconY - 13, 8, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, '✓', ix + 13, iconY - 12, 11, '#fff');
      }
    });
    // Patience bar + seconds.
    const fraction = Math.max(0, order.patience / order.patienceMax);
    const barX = rect.x + 14;
    const barY = rect.y + rect.h - 34;
    const barW = rect.w - 28;
    ctx.fillStyle = '#e8d9bd';
    roundRect(ctx, barX, barY, barW, 16, 8);
    ctx.fill();
    ctx.fillStyle = urgent ? '#d93a2b' : fraction > 0.5 ? '#5da24a' : '#f2a541';
    if (fraction > 0) {
      roundRect(ctx, barX, barY, Math.max(16, barW * fraction), 16, 8);
      ctx.fill();
    }
    text(ctx, `${Math.ceil(order.patience)} dtk`, rect.x + rect.w / 2, barY + 8, 12, urgent ? '#fff' : '#3d2c1e');
    if (ready) {
      ctx.fillStyle = '#3e8853';
      roundRect(ctx, rect.x + rect.w - 92, rect.y + rect.h - 34, 78, 16, 8);
      ctx.fill();
      text(ctx, 'SIAP!', rect.x + rect.w - 53, barY + 8, 11, '#fff');
    }
  }
}

function plateMatches(state, order) {
  if (state.plate.length !== order.recipe.needs.length) return false;
  if (state.plate.some((piece) => !piece.chopped)) return false;
  const have = state.plate.map((piece) => piece.id).sort().join(',');
  return order.recipe.needs.slice().sort().join(',') === have;
}

function drawStove(ctx, state) {
  const stove = LAYOUT.stove;
  text(ctx, 'KOMPOR', stove.x + stove.w / 2, stove.y - 12, 14, '#8a5a2e');
  ctx.fillStyle = '#5b6470';
  roundRect(ctx, stove.x, stove.y, stove.w, stove.h, 12);
  ctx.fill();
  ctx.fillStyle = '#3d434c';
  roundRect(ctx, stove.x + 10, stove.y + 10, stove.w - 20, stove.h - 20, 8);
  ctx.fill();
  // Two burners with animated flames.
  for (const burner of [0, 1]) {
    const bx = stove.x + 62 + burner * 126;
    const by = stove.y + 78;
    ctx.fillStyle = '#22262c';
    ctx.beginPath();
    ctx.ellipse(bx, by, 44, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    const flicker = 1 + 0.18 * Math.sin(state.time * 9 + burner * 2.4);
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.ellipse(bx, by - 10 * flicker, 26 * flicker, 14 * flicker, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.ellipse(bx, by - 6 * flicker, 15 * flicker, 9 * flicker, 0, Math.PI, 0);
    ctx.fill();
    // Pot on the left burner, wok on the right.
    if (burner === 0) {
      ctx.fillStyle = '#c0c6cc';
      roundRect(ctx, bx - 40, by - 52, 80, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#8a9096';
      ctx.fillRect(bx - 46, by - 52, 8, 12);
      ctx.fillRect(bx + 38, by - 52, 8, 12);
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.ellipse(bx, by - 52, 32, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#3a3f45';
      ctx.beginPath();
      ctx.ellipse(bx, by - 34, 44, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a86a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx + 40, by - 62, 26, -0.4, 1.2);
      ctx.stroke();
    }
    // Steam wisps.
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let wisp = 0; wisp < 2; wisp += 1) {
      const phase = (state.time * 0.7 + burner + wisp * 0.5) % 1;
      const sx = bx - 14 + wisp * 28 + Math.sin(phase * 6) * 4;
      const sy = by - 60 - phase * 34;
      ctx.globalAlpha = 0.55 * (1 - phase);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 6, sy - 10, sx - 2, sy - 18);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // Stove knobs.
  for (let knob = 0; knob < 3; knob += 1) {
    const kx = stove.x + 52 + knob * 40;
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.arc(kx, stove.y + stove.h - 30, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff8e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(kx, stove.y + stove.h - 30);
    ctx.lineTo(kx + 6, stove.y + stove.h - 36);
    ctx.stroke();
  }
  text(ctx, 'api menyala — masakan jalan terus', stove.x + stove.w / 2, stove.y + stove.h - 8, 11, '#c9c2b4', 'center', 'normal');
}

function drawBoardZone(ctx, state) {
  const zone = LAYOUT.boardZone;
  const shake = state.time < state.shakeBoardUntil ? (Math.random() - 0.5) * 6 : 0;
  text(ctx, 'TALENAN', zone.x + zone.w / 2 + shake, zone.y - 12, 14, '#8a5a2e');
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = '#d9a441';
  roundRect(ctx, zone.x + 10, zone.y + 24, zone.w - 20, zone.h - 60, 14);
  ctx.fill();
  ctx.fillStyle = '#c98d2e';
  roundRect(ctx, zone.x + 10, zone.y + 24, zone.w - 20, 10, 5);
  ctx.fill();
  // Knife.
  ctx.save();
  ctx.translate(zone.x + zone.w - 52, zone.y + 52);
  ctx.rotate(0.5);
  ctx.fillStyle = '#c0c6cc';
  roundRect(ctx, 0, 0, 64, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#3d2c1e';
  roundRect(ctx, -24, 1, 24, 10, 4);
  ctx.fill();
  ctx.restore();
  if (state.board) {
    const def = ingredientById(state.board.id);
    const cx = zone.x + zone.w / 2 - 30;
    const cy = zone.y + 108;
    const wobble = state.time - state.board.wobble < 0.15 ? (Math.random() - 0.5) * 4 : 0;
    drawIngredientIcon(ctx, state.board.id, cx + wobble, cy, 44, state.board.chopsDone > 0);
    // Chop progress pips.
    for (let pip = 0; pip < state.board.chopsNeeded; pip += 1) {
      const px = zone.x + zone.w / 2 - (state.board.chopsNeeded * 22) / 2 + pip * 22 + 11;
      ctx.fillStyle = pip < state.board.chopsDone ? '#3e8853' : '#fff8e6';
      ctx.beginPath();
      ctx.arc(px, zone.y + zone.h - 52, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a5a2e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, `${def.name} — klik / spasi untuk cincang`, zone.x + zone.w / 2, zone.y + zone.h - 22, 13, '#5a4632');
  } else {
    text(ctx, 'kosong', zone.x + zone.w / 2, zone.y + 100, 18, '#8a6a3e', 'center', 'normal');
    text(ctx, 'bahan mentah (ayam, sayur, tahu)', zone.x + zone.w / 2, zone.y + 128, 13, '#8a6a3e', 'center', 'normal');
    text(ctx, 'mampir ke sini dulu sebelum ke piring', zone.x + zone.w / 2, zone.y + 150, 13, '#8a6a3e', 'center', 'normal');
  }
  ctx.restore();
}

function drawPlateZone(ctx, state) {
  const zone = LAYOUT.plateZone;
  const shake = state.time < state.shakePlateUntil ? (Math.random() - 0.5) * 6 : 0;
  text(ctx, 'PIRING RACIKAN', zone.x + zone.w / 2, zone.y - 12, 14, '#8a5a2e');
  ctx.save();
  ctx.translate(shake, 0);
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + 108;
  // Plate.
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 132, 84, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffdf4';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 112, 68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 112, 68, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'piring kosong', cx, cy - 6, 16, '#b99b62', 'center', 'normal');
    text(ctx, 'klik bahan di bawah', cx, cy + 18, 13, '#b99b62', 'center', 'normal');
  } else {
    const slots = state.plate.length;
    state.plate.forEach((piece, index) => {
      const angle = (index / slots) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * 62;
      const py = cy + Math.sin(angle) * 36;
      const pop = state.time - piece.popAt < 0.18 ? 1 + (0.18 - (state.time - piece.popAt)) * 2 : 1;
      // A soft disc behind each piece so pale food (nasi) still reads on the plate.
      ctx.fillStyle = '#f6e3c2';
      ctx.beginPath();
      ctx.arc(px, py, 30, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientIcon(ctx, piece.id, px, py, 24 * pop, piece.chopped);
    });
    const match = matchingOrder(state);
    if (match) {
      text(ctx, `cocok: ${match.recipe.name} ✓`, cx, zone.y + zone.h - 18, 14, '#3e8853');
    } else {
      text(ctx, `${state.plate.length} bahan di piring — klik kanan untuk ambil`, cx, zone.y + zone.h - 18, 12, '#8a6a3e', 'center', 'normal');
    }
  }
  ctx.restore();
}

function drawServeButton(ctx, state) {
  const button = LAYOUT.serve;
  const ready = matchingOrder(state) !== null;
  const flash = state.time < state.serveFlashUntil;
  ctx.fillStyle = ready ? (flash ? '#ffd166' : '#3e8853') : '#9a938a';
  roundRect(ctx, button.x, button.y, button.w, button.h, 18);
  ctx.fill();
  ctx.strokeStyle = ready ? '#2f6b2a' : '#6b655e';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SAJIKAN', button.x + button.w / 2, button.y + 52, 30, '#fff');
  text(ctx, ready ? 'piring cocok dengan pesanan!' : 'lengkapi resep dulu', button.x + button.w / 2, button.y + 92, 14, '#fff', 'center', 'normal');
  text(ctx, 'klik di sini / Enter', button.x + button.w / 2, button.y + 118, 12, 'rgba(255,255,255,0.8)', 'center', 'normal');
}

function drawCounter(ctx, state) {
  const counter = LAYOUT.counter;
  ctx.fillStyle = '#6b4a2a';
  roundRect(ctx, counter.x, counter.y, counter.w, counter.h, 14);
  ctx.fill();
  ctx.fillStyle = '#8a5a2e';
  roundRect(ctx, counter.x, counter.y, counter.w, 34, 14);
  ctx.fill();
  text(ctx, 'MEJA BAHAN — klik bahan (atau tekan 1–8) • bahan mentah mampir ke talenan • klik kanan piring untuk ambil bahan • C = buang piring', counter.x + 16, counter.y + 17, 13, '#fff8e6', 'left', 'normal');
  INGREDIENTS.forEach((def, index) => {
    const rect = binRect(index);
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredientIcon(ctx, def.id, rect.x + rect.w / 2, rect.y + 62, 34, false);
    text(ctx, def.name, rect.x + rect.w / 2, rect.y + 128, 17, '#3d2c1e');
    if (def.raw) {
      ctx.fillStyle = '#e4572e';
      roundRect(ctx, rect.x + rect.w - 52, rect.y + 10, 42, 22, 8);
      ctx.fill();
      text(ctx, 'CINCANG', rect.x + rect.w - 31, rect.y + 21, 10, '#fff');
    }
    ctx.fillStyle = '#5a4632';
    ctx.beginPath();
    ctx.arc(rect.x + 18, rect.y + 20, 13, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, def.key, rect.x + 18, rect.y + 21, 13, '#fff');
  });
  // Bin (trash) button for clearing the plate.
  text(ctx, 'C = buang isi piring', counter.x + counter.w - 8, counter.y + counter.h + 14, 12, '#c9c2b4', 'right', 'normal');
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, 1 - particle.age / particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const item of state.floats) {
    ctx.globalAlpha = Math.max(0, 1 - item.age / item.life);
    shadowedText(ctx, item.text, item.x, item.y, 22, item.color);
  }
  ctx.globalAlpha = 1;
}

function drawMessage(ctx, state) {
  if (state.time >= state.messageUntil || !state.message) return;
  const color = state.messageKind === 'bad' ? '#d93a2b' : state.messageKind === 'warn' ? '#b98a1d' : '#3e8853';
  ctx.fillStyle = color;
  ctx.font = `bold 17px ${FONT}`;
  const textWidth = ctx.measureText(state.message).width;
  roundRect(ctx, CANVAS_WIDTH / 2 - textWidth / 2 - 20, 510, textWidth + 40, 30, 12);
  ctx.fill();
  text(ctx, state.message, CANVAS_WIDTH / 2, 526, 17, '#fff');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(40, 26, 14, 0.72)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 190, 110, 900, 560, 20);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 3;
  ctx.stroke();
  shadowedText(ctx, 'DAPUR KILAT', 640, 190, 64, '#e4572e');
  text(ctx, 'Warung cepat saji — masak, cincang, sajikan!', 640, 240, 22, '#5a4632', 'center', 'normal');
  // Mini food parade.
  const parade = ['nasi', 'mie', 'ayam', 'telur', 'sayur', 'sambal', 'tahu', 'kerupuk'];
  parade.forEach((id, index) => {
    const px = 300 + index * 92;
    const py = 300 + Math.sin(state.time * 2 + index) * 5;
    ctx.fillStyle = '#f6e3c2';
    ctx.beginPath();
    ctx.arc(px, py, 34, 0, Math.PI * 2);
    ctx.fill();
    drawIngredientIcon(ctx, id, px, py, 26, false);
  });
  const lines = [
    '1. Pelanggan memesan — lihat resep di PAPAN PESANAN.',
    '2. Klik bahan di MEJA BAHAN. Ayam, sayur dan tahu mentah — cincang dulu di TALENAN (klik / spasi).',
    '3. Rakit di PIRING RACIKAN, lalu klik SAJIKAN (atau Enter) sebelum timer pesanan habis.',
    '4. Sajian tepat waktu = koin + kombo. Sajian salah atau telat = hati berkurang.',
    '5. Shift 2,5 menit. Habis hati atau habis waktu — shift selesai!',
  ];
  lines.forEach((line, index) => {
    text(ctx, line, 640, 372 + index * 32, 17, '#3d2c1e', 'center', 'normal');
  });
  const pulse = 0.75 + 0.25 * Math.sin(state.time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#3e8853';
  roundRect(ctx, 490, 556, 300, 56, 14);
  ctx.fill();
  text(ctx, 'MULAI MASAK — klik / Enter', 640, 585, 20, '#fff');
  ctx.globalAlpha = 1;
  text(ctx, 'Keyboard: 1–8 bahan • Spasi cincang • Enter sajikan • C buang piring • P jeda • M suara', 640, 646, 13, '#8a6a3e', 'center', 'normal');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(40, 26, 14, 0.72)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 340, 130, 600, 500, 20);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 3;
  ctx.stroke();
  shadowedText(ctx, 'SHIFT SELESAI!', 640, 196, 44, '#e4572e');
  text(ctx, state.hearts <= 0 ? 'Warung kehabisan hati — pelanggan kabur semua.' : 'Waktu shift habis — kompor dimatikan.', 640, 238, 17, '#5a4632', 'center', 'normal');
  const rows = shiftSummary(state);
  rows.forEach((row, index) => {
    const y = 292 + index * 46;
    text(ctx, row.label, 400, y, 19, '#5a4632', 'left', 'normal');
    text(ctx, row.value, 880, y, 19, '#3d2c1e', 'right');
    if (index < rows.length - 1) {
      ctx.strokeStyle = '#e8d9bd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(400, y + 22);
      ctx.lineTo(880, y + 22);
      ctx.stroke();
    }
  });
  const rank = state.score >= 3000 ? 'KOKI BINTANG LIMA ★★★★★' : state.score >= 2000 ? 'KOKI ANDALAN ★★★★' : state.score >= 1200 ? 'KOKI WARUNG ★★★' : state.score >= 600 ? 'KOKI MAGANG ★★' : 'KOKI PEMULA ★';
  text(ctx, rank, 640, 540, 22, '#b98a1d');
  if (state.time - state.overAt > OVER_ARM_SECONDS) {
    const pulse = 0.75 + 0.25 * Math.sin(state.time * 4);
    ctx.globalAlpha = pulse;
    text(ctx, 'Klik di mana saja untuk kembali ke menu', 640, 596, 16, '#8a6a3e', 'center', 'normal');
    ctx.globalAlpha = 1;
  }
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(40, 26, 14, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  shadowedText(ctx, 'JEDA', 640, 380, 56, '#fff8e6');
  text(ctx, 'tekan P atau klik untuk lanjut', 640, 430, 18, '#fff8e6', 'center', 'normal');
}

/** Draw one frame of the game. */
export function drawScene(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawWall(ctx, state);
  drawHeader(ctx, state);
  drawOrderBoard(ctx, state);
  // Customers standing at the counter, one per order slot, between the order
  // board and the worktop so they never cover the stove or the plate.
  for (let slot = 0; slot < 3; slot += 1) {
    const order = state.orders[slot];
    if (!order) continue;
    const rect = orderTicketRect(slot);
    drawCustomer(ctx, order.customer, rect.x + rect.w / 2, 272, 0.72);
  }
  drawStove(ctx, state);
  drawBoardZone(ctx, state);
  drawPlateZone(ctx, state);
  drawServeButton(ctx, state);
  drawCounter(ctx, state);
  drawParticles(ctx, state);
  drawMessage(ctx, state);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (state.screen === SCREEN_OVER) drawGameOver(ctx, state);
  else if (state.paused) drawPaused(ctx);
}
