import * as THREE from 'three';

let cachedMaxAniso = 4;

export function setTextureMaxAnisotropy(renderer: THREE.WebGLRenderer) {
  cachedMaxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
}

function finalizeColorTex(tex: THREE.CanvasTexture, repeatX = 1, repeatY = 1) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createMarsRegolithTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Balanced warm Martian terracotta / sandy beige / dusty rose base (never harsh neon red)
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#c8835e');
  grad.addColorStop(0.5, '#be7754');
  grad.addColorStop(1, '#cda07d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle wind-swept sand ripples
  for (let y = 0; y < 512; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? 'rgba(226, 182, 148, 0.14)' : 'rgba(130, 74, 52, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      ctx.lineTo(x, y + Math.sin(x * 0.03 + y * 0.02) * 3);
    }
    ctx.lineTo(512, y + 4);
    ctx.lineTo(0, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  // Pebbles & mineral grains
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.6 + Math.random() * 2.4;
    const tones = ['#a76447', '#d8b293', '#8c5b48', '#b88c77', '#7b6862'];
    ctx.fillStyle = tones[i % tones.length];
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return finalizeColorTex(new THREE.CanvasTexture(canvas), 24, 24);
}

export function createMarsPlanetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#e8dfd8'); // North polar ice cap
  grad.addColorStop(0.14, '#c78c6d');
  grad.addColorStop(0.45, '#bd7552');
  grad.addColorStop(0.7, '#d19d7b');
  grad.addColorStop(0.88, '#b56e4e');
  grad.addColorStop(1, '#e6dcd5'); // South polar ice cap
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Dark basaltic plains (Syrtis Major style) & valleys
  const patches = [
    { x: 140, y: 120, rx: 55, ry: 25, c: 'rgba(105, 68, 58, 0.38)' },
    { x: 310, y: 140, rx: 80, ry: 30, c: 'rgba(120, 75, 58, 0.32)' },
    { x: 420, y: 95, rx: 45, ry: 20, c: 'rgba(218, 175, 145, 0.35)' },
    { x: 220, y: 80, rx: 35, ry: 18, c: 'rgba(155, 95, 72, 0.35)' },
  ];
  for (const p of patches) {
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Craters
  for (let i = 0; i < 45; i++) {
    const cx = Math.random() * 512;
    const cy = 28 + Math.random() * 200;
    const cr = 2 + Math.random() * 9;
    ctx.strokeStyle = 'rgba(235, 200, 175, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(95, 55, 45, 0.25)';
    ctx.beginPath();
    ctx.arc(cx + 1, cy + 1, cr * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeColorTex(new THREE.CanvasTexture(canvas), 1, 1);
}

export function createEarthFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e5ebf2';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle cleanroom architectural grid tiles
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
  for (let x = 0; x < 512; x += 128) {
    for (let y = 0; y < 512; y += 128) {
      ctx.fillRect(x + 4, y + 4, 56, 56);
    }
  }

  return finalizeColorTex(new THREE.CanvasTexture(canvas), 16, 16);
}

export function createSolarPanelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f2757';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 16; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  return finalizeColorTex(new THREE.CanvasTexture(canvas), 2, 2);
}

export function createNasaPatchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);
  // Classic circular NASA-style meatball insignia
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Red chevron
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(22, 84);
  ctx.lineTo(66, 26);
  ctx.lineTo(106, 76);
  ctx.stroke();

  // Orbit ring
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(64, 64, 48, 16, -0.35, 0, Math.PI * 2);
  ctx.stroke();

  // NASA lettering
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NASA', 64, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createLandingPadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 512, 512);

  // Concentric hazard rings
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.setLineDash([28, 18]);
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(256, 256, 150, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 256, 260);

  return finalizeColorTex(new THREE.CanvasTexture(canvas), 1, 1);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.22)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createTelemetryScreenTexture(title: string, status: string, accent = '#38bdf8'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#09111e';
  ctx.fillRect(0, 0, 256, 160);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 148);

  ctx.fillStyle = accent;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(title, 18, 34);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(status, 18, 62);

  // Waveform / bars
  ctx.fillStyle = accent;
  for (let i = 0; i < 12; i++) {
    const h = 16 + Math.abs(Math.sin(i * 0.9)) * 42;
    ctx.fillRect(18 + i * 18, 136 - h, 11, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createRoomSignTexture(
  title: string,
  accentColor = '#38bdf8',
  pastelColor = '#dbeafe'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Dark aerospace backing
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  // Pastel top identity bar & subtle border
  ctx.fillStyle = pastelColor;
  ctx.fillRect(8, 8, 496, 16);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  // Left indicator chevron block
  ctx.fillStyle = accentColor;
  ctx.fillRect(14, 34, 14, 74);

  // Clean futuristic NASA-inspired sans-serif lettering
  ctx.fillStyle = '#f8fafc';
  const fontSize = title.length > 22 ? 26 : title.length > 16 ? 30 : 34;
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase(), 268, 72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createMissionPosterTexture(
  title: string,
  subtitle: string,
  year: string,
  themeColor = '#38bdf8'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep space archival backdrop
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#0b1324');
  grad.addColorStop(0.65, '#172542');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 384, 512);

  // Outer museum frame trim
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 364, 492);

  // Stars in background
  ctx.fillStyle = '#e2e8f0';
  for (let i = 0; i < 36; i++) {
    const sx = ((i * 73) % 340) + 22;
    const sy = ((i * 137) % 240) + 30;
    ctx.globalAlpha = 0.35 + (i % 4) * 0.15;
    ctx.fillRect(sx, sy, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;

  // Stylized planet/orbit emblem illustration
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.arc(192, 185, 68, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.beginPath();
  ctx.arc(212, 175, 58, 0, Math.PI * 2);
  ctx.fill();

  // Orbital trajectory arc
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(192, 185, 118, 36, -0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Spacecraft silhouette dot on arc
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(285, 152, 8, 0, Math.PI * 2);
  ctx.fill();

  // Year badge
  ctx.fillStyle = themeColor;
  ctx.fillRect(132, 295, 120, 32);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(year, 192, 311);

  // Title & subtitle
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 26px system-ui, sans-serif';
  ctx.fillText(title, 192, 372);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText(subtitle, 192, 412);

  // Archival timeline bar
  ctx.fillStyle = themeColor;
  ctx.fillRect(48, 452, 288, 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let y = startY;
  let count = 0;

  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      count += 1;
      if (count >= maxLines) {
        ctx.fillText(`${line.slice(0, Math.max(0, line.length - 3))}...`, x, y);
        return;
      }
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line && count < maxLines) {
    ctx.fillText(line, x, y);
  }
}

export function createMuseumFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#172238');
  grad.addColorStop(1, '#101a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle terrazzo speckles
  for (let i = 0; i < 650; i++) {
    const sx = (i * 173) % 512;
    const sy = (i * 293) % 512;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(148,163,184,0.12)' : 'rgba(56,189,248,0.08)';
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Architectural brass & slate tile grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, 488, 488);

  return finalizeColorTex(new THREE.CanvasTexture(canvas), 8, 7);
}

export function createExhibitPlaqueTexture(
  title: string,
  year: string,
  shortNote: string,
  accent = '#38bdf8'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b1324';
  ctx.fillRect(0, 0, 512, 320);

  // Subtle top bar & border
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 512, 10);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 312);

  // Year badge
  ctx.fillStyle = accent;
  ctx.fillRect(22, 24, 176, 36);
  ctx.fillStyle = '#09111e';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(year.slice(0, 14), 110, 43);

  // Circular (i) info badge in top-right
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(468, 42, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 24px Georgia, serif';
  ctx.fillText('i', 468, 43);

  // Title
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#f8fafc';
  const titleSize = title.length > 26 ? 26 : 30;
  ctx.font = `800 ${titleSize}px system-ui, -apple-system, sans-serif`;
  wrapCanvasText(ctx, title, 22, 76, 468, 34, 2);

  // Short note
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  wrapCanvasText(ctx, shortNote, 22, 160, 468, 28, 4);

  // Footer prompt
  ctx.fillStyle = accent;
  ctx.font = 'bold 16px monospace';
  ctx.fillText('PRESS [E] OR CLICK ⓘ FOR FULL ARCHIVE', 22, 286);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createAstronautPortraitTexture(
  name: string,
  countryMission: string,
  year: string,
  shortNote: string,
  accent = '#38bdf8'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 448;
  canvas.height = 576;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 576);
  grad.addColorStop(0, '#0a1222');
  grad.addColorStop(0.55, '#16243d');
  grad.addColorStop(1, '#09101d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 448, 576);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 432, 560);

  // Stylized archival portrait frame & helmet silhouette
  ctx.fillStyle = '#0f1b33';
  ctx.fillRect(28, 28, 392, 220);
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.32)';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 392, 220);

  // Halo + visor emblem
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(224, 138, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Shoulders
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(148, 178, 152, 68, 26);
  ctx.fill();
  // Helmet
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(224, 126, 48, 0, Math.PI * 2);
  ctx.fill();
  // Gold Visor
  const vGrad = ctx.createLinearGradient(184, 98, 264, 154);
  vGrad.addColorStop(0, '#fde68a');
  vGrad.addColorStop(0.5, '#f59e0b');
  vGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = vGrad;
  ctx.beginPath();
  ctx.roundRect(188, 102, 72, 46, 18);
  ctx.fill();

  // (i) badge on frame top-right
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(392, 56, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('i', 392, 57);

  // Country & mission pill
  ctx.fillStyle = accent;
  ctx.fillRect(28, 266, 392, 34);
  ctx.fillStyle = '#09111e';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(countryMission.toUpperCase().slice(0, 40), 224, 284);

  // Astronaut Name
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px system-ui, sans-serif';
  ctx.fillText(name, 28, 316);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(year, 28, 358);

  // Short Bio Note
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 20px system-ui, sans-serif';
  wrapCanvasText(ctx, shortNote, 28, 396, 392, 28, 4);

  ctx.fillStyle = accent;
  ctx.font = 'bold 16px monospace';
  ctx.fillText('PRESS [E] OR CLICK ⓘ BIOGRAPHY', 28, 530);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createTimelineTotemTexture(
  year: string,
  title: string,
  shortNote: string,
  accent = '#38bdf8'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 448;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b1324';
  ctx.fillRect(0, 0, 320, 448);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 310, 438);

  // Glowing Year Header
  ctx.fillStyle = accent;
  ctx.fillRect(16, 18, 210, 52);
  ctx.fillStyle = '#09111e';
  ctx.font = '900 32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(year, 121, 45);

  // (i) badge
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(276, 44, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 22px Georgia, serif';
  ctx.fillText('i', 276, 45);

  // Milestone Title
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px system-ui, sans-serif';
  wrapCanvasText(ctx, title, 18, 92, 284, 30, 3);

  ctx.fillStyle = accent;
  ctx.fillRect(18, 196, 284, 3);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 18px system-ui, sans-serif';
  wrapCanvasText(ctx, shortNote, 18, 216, 284, 26, 6);

  ctx.fillStyle = accent;
  ctx.font = 'bold 14px monospace';
  ctx.fillText('[E] OR CLICK ⓘ TIMELINE', 18, 408);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = cachedMaxAniso;
  tex.needsUpdate = true;
  return tex;
}


