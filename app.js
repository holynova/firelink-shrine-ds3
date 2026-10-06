import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============ 基础场景（黑魂式阴郁氛围） ============ */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14161c);
scene.fog = new THREE.Fog(0x14161c, 38, 90);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 400);
camera.position.set(17, 11, 21);

const controls = new OrbitControls(camera, canvas);
controls.target.set(2, 3, -2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 1.5;
controls.maxDistance = 55;
controls.autoRotateSpeed = 1.0;

const hemi = new THREE.HemisphereLight(0x8f9fbb, 0x4a4238, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xdde6f7, 1.9);
sun.position.set(-14, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -38; sun.shadow.camera.right = 38;
sun.shadow.camera.top = 38; sun.shadow.camera.bottom = -38;
sun.shadow.camera.far = 80;
sun.shadow.bias = -0.0006;
scene.add(sun);

/* ============ 程序化纹理（旧化） ============ */
function canvasTex(size, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
let _s = 23;
function rnd() { _s = (_s * 16807) % 2147483647; return (_s - 1) / 2147483646; }

// 旧化石材：石块 + 裂缝 + 苔斑（行高/底色可调）
function stoneDraw(rowH, base) {
  return (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += rowH) {
      for (let x = 0; x < s; x += 64) {
        const ox = (y / rowH % 2) * 32;
        const v = 62 + rnd() * 22;
        g.fillStyle = `rgb(${v | 0},${v + 3 | 0},${v + 9 | 0})`;
        g.fillRect(x + ox - 32, y + 2, 60, rowH - 4);
        g.fillStyle = 'rgba(0,0,0,.28)';
        for (let i = 0; i < 14; i++) g.fillRect(x + ox - 32 + rnd() * 58, y + 2 + rnd() * (rowH - 6), 3, 3);
      }
    }
    g.strokeStyle = 'rgba(15,15,18,.85)'; g.lineWidth = 3;
    for (let y = 0; y <= s; y += rowH) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
    g.strokeStyle = 'rgba(10,10,12,.7)'; g.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) {
      let x = rnd() * s, y = rnd() * s;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (rnd() - .5) * 36; y += rnd() * 26; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(${52 + rnd() * 20 | 0},${84 + rnd() * 22 | 0},44,${.18 + rnd() * .22})`;
      g.beginPath(); g.ellipse(rnd() * s, rnd() * s, 4 + rnd() * 12, 3 + rnd() * 8, rnd() * 3, 0, 7); g.fill();
    }
  };
}
const stoneTex = canvasTex(256, stoneDraw(42, '#4b4e57'), 3, 2);
// 穹顶：只有水平石层、无竖向分缝，像石板瓦
const domeTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#5a5750'; g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 64) {
    const v = 80 + rnd() * 18;
    g.fillStyle = `rgb(${v | 0},${v + 2 | 0},${v + 7 | 0})`;
    g.fillRect(0, y + 2, s, 60);
  }
  g.strokeStyle = 'rgba(15,15,18,.8)'; g.lineWidth = 3;
  for (let y = 0; y <= s; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.18)';
  for (let i = 0; i < 350; i++) g.fillRect(rnd() * s, rnd() * s, 3, 3);
  g.strokeStyle = 'rgba(10,10,12,.6)'; g.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    let x = rnd() * s, y = rnd() * s;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (rnd() - .5) * 36; y += rnd() * 26; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 22; i++) {
    g.fillStyle = `rgba(${52 + rnd() * 20 | 0},${84 + rnd() * 22 | 0},44,${.15 + rnd() * .2})`;
    g.beginPath(); g.ellipse(rnd() * s, rnd() * s, 4 + rnd() * 12, 3 + rnd() * 8, rnd() * 3, 0, 7); g.fill();
  }
}, 6, 2);
// 旧化木材
const darkWoodTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#3d2c1c'; g.fillRect(0, 0, s, s);
  for (let x = 0; x < s; x += 32) {
    g.fillStyle = `rgba(${40 + rnd() * 22 | 0},${26 + rnd() * 14 | 0},14,.6)`;
    g.fillRect(x, 0, 30, s);
    g.strokeStyle = 'rgba(12,7,3,.6)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, s); g.stroke();
    g.strokeStyle = 'rgba(20,12,5,.5)'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const gx = x + 6 + rnd() * 20; g.beginPath(); g.moveTo(gx, 0); g.bezierCurveTo(gx + 4, s * .3, gx - 4, s * .6, gx + 2, s); g.stroke(); }
  }
  for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(rnd() * s, rnd() * s, 8 + rnd() * 20, 3); }
}, 2, 2);
// 地面：碎石土
const groundTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#2c2d31'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 2200; i++) {
    const v = 30 + rnd() * 40;
    g.fillStyle = `rgba(${v | 0},${v | 0},${v + 4 | 0},.6)`;
    g.fillRect(rnd() * s, rnd() * s, 2 + rnd() * 4, 2 + rnd() * 3);
  }
  for (let i = 0; i < 20; i++) {
    g.fillStyle = `rgba(58,92,50,${.12 + rnd() * .2})`;
    g.beginPath(); g.ellipse(rnd() * s, rnd() * s, 5 + rnd() * 14, 4 + rnd() * 9, rnd() * 3, 0, 7); g.fill();
  }
}, 18, 18);
// 王座铭文（伪卢恩刻字）
const runeTex = canvasTex(128, (g, s) => {
  g.fillStyle = '#3a3d45'; g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(20,20,24,.9)'; g.lineWidth = 3;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const x = 12 + c * 22, y = 16 + r * 28;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke();
    for (let k = 0; k < 3; k++) {
      g.beginPath(); g.moveTo(x, y + 4 + k * 5);
      g.lineTo(x + (rnd() > .5 ? 8 : -8), y + 7 + k * 5); g.stroke();
    }
  }
});

/* ============ 材质与建模助手 ============ */
function M(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.95, metalness: o.metal ?? 0,
    map: o.map || null, transparent: !!o.transparent, opacity: o.opacity ?? 1,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1,
    side: o.side || THREE.FrontSide
  });
}
const extMats = [];
function extM(color, o = {}) { const m = M(color, o); extMats.push(m); return m; }

function mesh(geo, material, x, y, z, parent) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  (parent || scene).add(m);
  tagPart(m, parent);
  return m;
}
function box(w, h, d, material, x, y, z, parent, ry = 0) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  m.rotation.y = ry;
  return m;
}
function cyl(rt, rb, h, material, x, y, z, parent, seg = 14) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y, z, parent);
}
function sph(r, material, x, y, z, parent, sx = 1, sy = 1, sz = 1) {
  const m = mesh(new THREE.SphereGeometry(r, 14, 12), material, x, y, z, parent);
  m.scale.set(sx, sy, sz);
  return m;
}
function tagPart(m, parent) {
  let n = parent;
  while (n) {
    if (n.userData && n.userData.isPart) { m.userData.partId = n.userData.partId; break; }
    n = n.parent;
  }
}
// 两点之间的墙体（轴对齐）
function wallSeg(x1, z1, x2, z2, y0, h, t, material, parent) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  return (Math.abs(x2 - x1) > Math.abs(z2 - z1))
    ? box(len, h, t, material, cx, y0 + h / 2, cz, parent)
    : box(t, h, len, material, cx, y0 + h / 2, cz, parent);
}
// 拱门：门柱 + 半圆拱环 + 深色背衬
function arch(w, h, mat, x, y, z, parent, ry = 0, dark = true) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  box(0.55, h, 0.7, mat, -w / 2 + 0.27, h / 2, 0, g);
  box(0.55, h, 0.7, mat, w / 2 - 0.27, h / 2, 0, g);
  const ring = mesh(new THREE.TorusGeometry(w / 2 - 0.28, 0.3, 8, 14, Math.PI), mat, 0, h, 0, g);
  ring.castShadow = true;
  if (dark) { const b = box(w - 0.4, h + w / 2 - 0.3, 0.15, M(0x0b0c10, { rough: 1 }), 0, (h + w / 2 - 0.3) / 2, -0.28, g); b.castShadow = false; }
  return g;
}
// 蜡烛
const candleWaxM = M(0xd8cfae, { rough: 0.6 });
const flameM = M(0xffb13e, { emissive: 0xff9a1e, ei: 2.2, rough: 1 });
function candle(x, y, z, parent, s = 1) {
  cyl(0.035 * s, 0.05 * s, 0.3 * s, candleWaxM, x, y + 0.15 * s, z, parent, 8);
  const f = sph(0.04 * s, flameM, x, y + 0.36 * s, z, parent);
  f.castShadow = false;
  return f;
}
function candleRow(x1, z1, x2, z2, y, parent, n, s = 1) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    candle(x1 + (x2 - x1) * t, y, z1 + (z2 - z1) * t, parent, s * (0.85 + rnd() * 0.4));
  }
}
// 简笔人形（NPC剪影）
function figure(x, y, z, parent, robeColor, h = 1.7, seated = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const rm = M(robeColor, { rough: 1 });
  if (seated) {
    box(0.55, 0.5, 0.5, rm, 0, 0.25, 0, g);
    sph(0.16, M(0xb09a80, { rough: 1 }), 0, 0.68, 0.05, g);
    box(0.5, 0.35, 0.45, rm, 0, 0.62, -0.1, g);
  } else {
    cyl(0.26, 0.44, h * 0.72, rm, 0, h * 0.36, 0, g, 10);
    sph(0.16, M(0xb09a80, { rough: 1 }), 0, h * 0.82, 0, g);
  }
  return g;
}
// 剑
const steelM = M(0x9aa2ad, { metal: 0.75, rough: 0.35 });
const guardM = M(0x5a4a28, { metal: 0.5, rough: 0.5 });
function sword(x, y, z, parent, len = 1.1, tiltZ = 0, tiltX = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.z = tiltZ; g.rotation.x = tiltX; parent.add(g);
  box(0.07, len, 0.022, steelM, 0, len / 2, 0, g);
  box(0.24, 0.05, 0.05, guardM, 0, 0.03, 0, g);
  cyl(0.035, 0.035, 0.16, guardM, 0, -0.06, 0, g, 8);
  return g;
}

/* ============ 部件注册表 ============ */
const PARTS = {};
const CATS = { out: '外部', hall: '主厅', under: '下层', tower: '塔楼' };
function defPart(id, meta) { PARTS[id] = Object.assign({ id, group: null }, meta); }
function P(id, parent) {
  const g = new THREE.Group();
  g.userData.isPart = true; g.userData.partId = id;
  PARTS[id].group = g;
  (parent || scene).add(g);
  return g;
}

/* ---- 外部 ---- */
defPart('dome',      { name: '穹顶', cat: 'out', layer: 'dome', label: [0, 18.6, 0], viewDir: [1, .65, 1], desc: '祭祀场标志性的石砌穹顶，顶部有破洞——乌鸦就住在上面。' });
defPart('drum',      { name: '教堂外墙', cat: 'out', layer: 'hall', label: [10.2, 4.5, 2], viewDir: [1, .35, .4], desc: '环形大厅的石砌外墙，布满岁月的裂痕与苔斑。' });
defPart('maindoor',  { name: '正门双扉', cat: 'out', layer: 'hall', label: [0, 3.4, 10.8], viewDir: [.3, .4, 1], desc: '南侧的拱形双扉木门，不死人由此踏入传火祭祀场。' });
defPart('steps',     { name: '石阶入口', cat: 'out', layer: 'ground', label: [0, 1.2, 15], viewDir: [.4, .5, 1], desc: '从悬崖石径拾级而上，推开双扉便是薪王们的王座之间。' });
defPart('archwin',   { name: '拱窗', cat: 'out', layer: 'hall', label: [-8.8, 5.6, 4.5], viewDir: [-1, .4, .5], desc: '高侧拱窗，灰暗的天光从这里漏进大厅。' });
defPart('arches',    { name: '断裂石拱', cat: 'out', layer: 'ground', label: [-11, 4.5, 15], viewDir: [-1, .4, .8], desc: '祭祀场外散落的断裂石拱遗迹，不知是哪一朝的建筑。' });
defPart('graves',    { name: '墓碑群', cat: 'out', layer: 'ground', label: [-4.5, 1.6, 21], viewDir: [-.4, .5, 1], desc: '悬崖小径两旁的无名墓碑，长眠着传火失败的人们。' });
defPart('gianttree', { name: '巨人树', cat: 'out', layer: 'tower', label: [14, 7.5, 2], viewDir: [1, .45, .6], desc: '石化的巨人树。调查一下——"巨人树的种子尚未掉落"。' });
defPart('deadtree',  { name: '枯树', cat: 'out', layer: 'ground', label: [-13, 5.5, 8], viewDir: [-1, .4, .6], desc: '枯死的树木，在风中一动不动。' });
defPart('cliffpath', { name: '悬崖石径', cat: 'out', layer: 'ground', label: [4, 0.9, 25], viewDir: [.3, .6, 1], desc: '从墓园方向延伸而来的悬崖小径，击败薪王化身古达后你就是从这里走来的。' });
defPart('swordmaster',{ name: '剑圣之地', cat: 'out', layer: 'ground', label: [-8.5, 1.6, 11], viewDir: [-.8, .5, .8], desc: '太刀剑圣在此游荡，小心被他砍下悬崖——杀了他能拿到打刀。' });
/* ---- 主厅 ---- */
defPart('bonfire',   { name: '中央篝火', cat: 'hall', layer: 'hall', xray: 1, label: [0, 2.2, 2], viewDir: [.7, .55, 1], desc: '插着螺旋剑的篝火，防火女在此为你升级。余烬在火光中升腾。' });
defPart('firekeeper',{ name: '防火女', cat: 'hall', layer: 'hall', xray: 1, label: [2.8, 2.2, 3.6], viewDir: [1, .5, .8], desc: '看守火焰的防火女。"欢迎回来，灰烬大人。"' });
defPart('hawkwood',  { name: '霍克伍德', cat: 'hall', layer: 'hall', xray: 1, label: [6.8, 1.6, -0.5], viewDir: [1, .5, .3], desc: '坐在东侧楼梯底的霍克伍德，会教你"崩溃"手势。' });
defPart('dais',      { name: '王座高台', cat: 'hall', layer: 'hall', xray: 1, label: [0, 2.8, -5], viewDir: [.5, .6, 1], desc: '五王座所在的半圆形高台，边缘摆满长明蜡烛。' });
defPart('throne-red',    { name: '红布王座', cat: 'hall', layer: 'hall', xray: 1, label: [-4.6, 3.4, -6.6], viewDir: [-.7, .5, .9], desc: '披着华丽红布、摆满圣烛的王座，属于某位出逃的薪王。' });
defPart('throne-ludleth', { name: '鲁道斯的小王座', cat: 'hall', layer: 'hall', xray: 1, label: [-2.3, 2.8, -7.9], viewDir: [-.3, .5, 1], desc: '素面无饰的小王座——鲁道斯，唯一留守的薪王，此刻就坐在这里。' });
defPart('throne-charred', { name: '焦黑中央王座', cat: 'hall', layer: 'hall', xray: 1, label: [0, 4.4, -8.2], viewDir: [0, .55, 1], desc: '中央最高、被烧得焦黑、布满熔流痕迹的王座。' });
defPart('throne-swords',  { name: '剑冢王座', cat: 'hall', layer: 'hall', xray: 1, label: [2.3, 2.8, -7.9], viewDir: [.3, .5, 1], desc: '旁边插满长剑的王座，无言地诉说着主人的结局。' });
defPart('throne-giant',   { name: '巨人王座', cat: 'hall', layer: 'hall', xray: 1, label: [4.6, 3.8, -6.6], viewDir: [.7, .5, .9], desc: '大到凡人无法安坐的巨型王座。' });
defPart('candles',   { name: '王座烛台群', cat: 'hall', layer: 'hall', xray: 1, label: [3.2, 2, -3.6], viewDir: [.8, .6, .8], desc: '高台边缘的烛火，为缺席的王们长明。' });
defPart('columns',   { name: '拱廊石柱', cat: 'hall', layer: 'hall', label: [-7.5, 4.5, -4], viewDir: [-1, .4, -.3], desc: '支撑穹顶的石柱与哥特拱廊。' });
defPart('rafters',   { name: '穹顶木梁', cat: 'hall', layer: 'hall', xray: 1, label: [0, 11.5, 0], viewDir: [.6, .8, .6], desc: '穹顶下的木椽，其中一根藏着元素碎片。' });
defPart('illusory',  { name: '幻影墙', cat: 'hall', layer: 'hall', xray: 1, label: [8.2, 5.5, -3.5], viewDir: [1, .5, -.3], desc: '敲一敲这面墙——后面藏着贪婪银蛇戒指的宝箱。' });
defPart('crowsnest', { name: '乌鸦巢', cat: 'hall', layer: 'dome', label: [0, 17.7, 0], viewDir: [1, .7, .8], desc: '穹顶中央的鸟巢。"Pickle Pee, Pump-a-Rum"——可以和乌鸦以物易物。' });
defPart('backstairs',{ name: '王座后阶梯', cat: 'hall', layer: 'hall', xray: 1, label: [0, 2.4, -10], viewDir: [0, .6, 1], desc: '王座后方的阶梯，通往上层平台。' });
defPart('leonhard',  { name: '伦纳德角落', cat: 'hall', layer: 'hall', xray: 1, label: [3, 3, -9.6], viewDir: [.6, .5, .8], desc: '手指伦纳德在此等候，会赠你裂红眼宝珠。' });
/* ---- 下层 ---- */
defPart('tunnel',    { name: '地道', cat: 'under', layer: 'under', xray: 1, label: [0, -1.8, 3], viewDir: [.5, .6, 1], desc: '主入口下方的地道，通往后室。' });
defPart('handmaid',  { name: '祭祀场侍女', cat: 'under', layer: 'under', xray: 1, label: [-4.5, -1.4, -6], viewDir: [-.8, .55, .8], desc: '收购遗灰、出售塔钥匙（20000魂）的老婆婆，就坐在铁匠隔壁。' });
defPart('andre',     { name: '铁匠安德烈', cat: 'under', layer: 'under', xray: 1, label: [4.5, -1.2, -7], viewDir: [.8, .5, .8], desc: '传奇铁匠安德烈，在此为你强化武器。' });
defPart('anvil',     { name: '铁砧', cat: 'under', layer: 'under', xray: 1, label: [3.3, -2, -5.8], viewDir: [.7, .6, .7], desc: '立在树桩上的铁砧，千锤百炼。' });
defPart('forge',     { name: '锻炉', cat: 'under', layer: 'under', xray: 1, label: [5.6, -1.4, -8.2], viewDir: [1, .5, .6], desc: '终年不熄的锻炉，火光映着安德烈的背影。' });
defPart('bellows',   { name: '风箱', cat: 'under', layer: 'under', xray: 1, label: [6.3, -2, -6.4], viewDir: [1, .6, .5], desc: '给锻炉鼓风的皮风箱。' });
defPart('grindstone',{ name: '磨刀石', cat: 'under', layer: 'under', xray: 1, label: [2.8, -2.2, -8.2], viewDir: [.6, .6, .8], desc: '旋转的磨刀石，嚓嚓作响。' });
defPart('weaponrack',{ name: '武器架', cat: 'under', layer: 'under', xray: 1, label: [6.4, -1.6, -8.2], viewDir: [1, .5, .4], desc: '靠墙的武器架，摆满待修的刀剑。' });
/* ---- 塔楼 ---- */
defPart('towergate', { name: '塔门', cat: 'tower', layer: 'tower', label: [17, 3.6, 0], viewDir: [1, .4, .5], desc: '上锁的塔门——需要20000魂的塔钥匙。' });
defPart('tower',     { name: '钟塔', cat: 'tower', layer: 'tower', label: [20.5, 11, 0], viewDir: [1, .35, .6], desc: '祭祀场东侧的高塔，内有盘旋石梯直达塔顶。' });
defPart('spairstairs',{ name: '盘旋石梯', cat: 'tower', layer: 'tower', xray: 1, label: [20, 7.5, 0], viewDir: [1, .5, .4], desc: '塔内的盘旋石梯，一圈圈通向高处。' });
defPart('bell',      { name: '大钟', cat: 'tower', layer: 'tower', xray: 1, label: [20, 13.4, 0], viewDir: [1, .4, .5], desc: '塔顶机房的青铜大钟，钟舌早已锈住。' });
defPart('bridge',    { name: '断裂石桥', cat: 'tower', layer: 'tower', label: [26.5, 13.6, 0], viewDir: [.8, .5, .8], desc: '连接两座塔的断裂石桥——从中段跳下，可以落到祭祀场屋顶。' });
defPart('lifttower', { name: '升降机塔', cat: 'tower', layer: 'tower', label: [32.5, 11, 0], viewDir: [1, .35, .5], desc: '第二座塔，踩下机关，升降机带你上塔顶。' });
defPart('lift',      { name: '升降机', cat: 'tower', layer: 'tower', xray: 1, label: [32, 8.5, 0], viewDir: [1, .5, .4], desc: '脚踏机关驱动的升降机，铁链绞盘还很结实。' });
defPart('fksoul',    { name: '塔顶·防火女之魂', cat: 'tower', layer: 'tower', xray: 1, label: [32, 16.4, 0], viewDir: [1, .5, .6], desc: '塔顶尸体旁的防火女之魂——强化元素瓶就靠它。' });

/* ============ 层组 ============ */
const gDome = new THREE.Group(), gShrine = new THREE.Group(), gUnder = new THREE.Group(),
      gTower = new THREE.Group(), gOutside = new THREE.Group();
scene.add(gDome, gShrine, gUnder, gTower, gOutside);
const cutWalls = {};
const FX = { embers: [] };

/* ============ 室外：悬崖、石径、墓碑、遗迹 ============ */
(function buildOutside() {
  const stoneM = M(0xffffff, { map: stoneTex, rough: 0.97 });
  const stoneDark = M(0x3f4148, { rough: 1 });
  const groundM = M(0xffffff, { map: groundTex, rough: 1 });

  // 悬崖山体（祭祀场建在山顶）
  const cliff = cyl(30, 22, 9, groundM, 2, -5.2, 2, gOutside, 24);
  cliff.receiveShadow = true;
  // 散落乱石
  for (let i = 0; i < 26; i++) {
    const r = 0.3 + rnd() * 0.9;
    const rock = mesh(new THREE.DodecahedronGeometry(r, 0), stoneDark,
      -24 + rnd() * 52, -0.6 + rnd() * 0.5, -20 + rnd() * 48, gOutside);
    rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
  }
  // 远山剪影
  const mntM = M(0x2a2d36, { rough: 1 });
  [[-55, -30, 26], [50, -45, 32], [-20, -70, 30], [60, 20, 24], [-60, 30, 28]].forEach(([x, z, h]) => {
    const m = mesh(new THREE.ConeGeometry(16 + rnd() * 8, h, 7), mntM, x, h / 2 - 8, z, gOutside);
    m.castShadow = false;
  });

  // 悬崖石径（南侧蜿蜒小径）
  const path = P('cliffpath', gOutside);
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const x = Math.sin(t * 5) * 2.2 + t * 1.5;
    const z = 13 + t * 17;
    const slab = box(1.7 - t * 0.3, 0.14, 1.1, stoneM, x, 0.05 - t * 0.4, z, path, (rnd() - .5) * 0.4);
    slab.receiveShadow = true;
  }
  // 入口石阶
  const st = P('steps', gOutside);
  for (let i = 0; i < 7; i++)
    box(4.6 - i * 0.12, 0.28, 0.62, stoneM, 0, 0.14 + i * 0.26, 12.6 - i * 0.6, st);

  // 墓碑群
  const gv = P('graves', gOutside);
  const graveSpots = [[-4.5, 19], [-2.8, 21.5], [-6, 23], [-3.4, 25], [4.2, 20], [5.6, 23.5], [3.2, 26], [-7.5, 17], [7.8, 18.5], [-5.5, 28], [1.5, 29], [6.5, 27], [-9, 24], [9, 25]];
  graveSpots.forEach(([x, z], i) => {
    const w = 0.55 + rnd() * 0.25, h = 0.9 + rnd() * 0.7;
    const g2 = new THREE.Group(); g2.position.set(x, 0, z); g2.rotation.y = rnd() * 3; g2.rotation.z = (rnd() - .5) * 0.22; gv.add(g2);
    box(w, h, 0.22, stoneM, 0, h / 2, 0, g2);
    const cap = mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.22, 10, 1, false, 0, Math.PI), stoneM, 0, h, 0, g2);
    cap.rotation.x = Math.PI / 2; cap.rotation.z = Math.PI / 2;
    if (i % 3 === 0) { const rb = box(w * 1.5, 0.18, 0.5, stoneDark, 0, 0.09, 0.3, g2); rb.rotation.y = 0.3; }
  });

  // 断裂石拱（两处室外遗迹）
  const ar = P('arches', gOutside);
  function ruinArch(x, z, ry, s) {
    const g2 = new THREE.Group(); g2.position.set(x, 0, z); g2.rotation.y = ry; g2.scale.setScalar(s); ar.add(g2);
    box(0.9, 4.2, 0.9, stoneM, -2.2, 2.1, 0, g2);
    box(0.9, 3.1, 0.9, stoneM, 2.2, 1.55, 0, g2);       // 右柱断裂
    const arc = mesh(new THREE.TorusGeometry(2.2, 0.45, 8, 12, Math.PI * 0.62), stoneM, 0, 4.2, 0, g2);
    arc.rotation.z = Math.PI * 0.19;
    const fallen = box(1.1, 0.8, 0.9, stoneDark, 3.4, 0.4, 0.8, g2); fallen.rotation.y = 0.7;
  }
  ruinArch(-11, 15, 0.5, 1.1);
  ruinArch(12.5, 19, -0.9, 0.85);

  // 枯树
  const dt = P('deadtree', gOutside);
  const barkM = M(0x4a4038, { rough: 1 });
  function deadTree(x, z, s) {
    const g2 = new THREE.Group(); g2.position.set(x, 0, z); g2.scale.setScalar(s); dt.add(g2);
    cyl(0.22, 0.4, 3.6, barkM, 0, 1.8, 0, g2, 8);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2, h0 = 1.6 + rnd() * 2.4, len = 1.2 + rnd() * 1.8;
      const br = cyl(0.03, 0.07, len, barkM, Math.cos(a) * 0.5, h0, Math.sin(a) * 0.5, g2, 6);
      br.rotation.z = Math.cos(a) * 1.1; br.rotation.x = -Math.sin(a) * 1.1;
      br.position.y = h0 + len * 0.28;
    }
  }
  deadTree(-13, 8, 1.3); deadTree(14.5, 21, 1.0); deadTree(-8.5, 25, 0.85);

  // 剑圣之地（入口西侧）：插在地上的太刀
  const sm = P('swordmaster', gOutside);
  const kat = sword(-8.5, 0.55, 11, sm, 1.05, 0.12, 0.1);
  kat.rotation.x = 0.35;
  box(0.5, 0.35, 0.4, stoneDark, -8.5, 0.18, 11, sm);   // 跪垫石
  candle(-7.9, 0, 10.4, sm, 1.2);

  // 东-西 shield 之树（东侧）：枯树 + 尸体 + 圆盾
  const sht = P('swordmaster', gOutside);
  deadTree(10.5, 13, 0.9);
  const corpse = box(0.5, 0.3, 1.1, M(0x3a3230, { rough: 1 }), 10.5, 0.15, 14.2, sht, 0.4);
  const shield = cyl(0.32, 0.32, 0.06, M(0x6a5a34, { metal: 0.4, rough: 0.6 }), 10.9, 0.32, 14.2, sht, 14);
  shield.rotation.x = Math.PI / 2 - 0.3;
  // 两只游魂剪影
  figure(12.2, 0, 15.5, sht, 0x2e2a26, 1.6, true);
  figure(9.2, 0, 16.2, sht, 0x2e2a26, 1.55, true);
  candle(11.4, 0, 13.4, sht, 1);
})();

/* ============ 祭祀场主体：鼓墙、穹顶、入口 ============ */
(function buildShrine() {
  const stoneM = extM(0xffffff, { map: stoneTex, rough: 0.97 });
  const stoneDark = M(0x3f4148, { rough: 1 });
  const R = 9, WH = 7, T = 0.7;

  // 环形鼓墙（双面）
  const drumM = extM(0xffffff, { map: stoneTex, rough: 0.97, side: THREE.DoubleSide });
  const drum = mesh(new THREE.CylinderGeometry(R, R + 0.4, WH, 36, 1, true), drumM, 0, WH / 2, 0, P('drum', gShrine), 36);
  drum.castShadow = true;
  // 墙顶雉堞（残缺）
  for (let i = 0; i < 24; i++) {
    if (rnd() < 0.3) continue;   // 残缺
    const a = i / 24 * Math.PI * 2;
    box(0.9, 0.55, 0.6, stoneM, Math.sin(a) * R, WH + 0.27, Math.cos(a) * R, P('drum', gShrine), a);
  }
  // 基座
  cyl(R + 1.1, R + 1.6, 1.0, stoneM, 0, 0.1, 0, P('drum', gShrine), 36);

  // 正门：南侧拱门 + 双扉木门（半开）+ 门楣雕饰
  const md = P('maindoor', gShrine);
  arch(3.4, 4.4, stoneM, 0, 0, R - 0.1, md, 0, false);
  const doorM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  const d1 = box(0.78, 4.0, 0.14, doorM, -0.82, 2.0, R + 0.15, md); d1.rotation.y = 0.5;
  const d2 = box(0.78, 4.0, 0.14, doorM, 0.82, 2.0, R + 0.15, md); d2.rotation.y = -0.12;
  box(4.4, 0.5, 0.9, stoneM, 0, 5.6, R - 0.1, md);   // 门楣
  sph(0.09, guardM, -0.35, 2.0, R + 0.28, md); sph(0.09, guardM, 0.35, 2.0, R + 0.28, md);

  // 拱窗：6 扇高侧窗（石框 + 深色 recess）
  const aw = P('archwin', gShrine);
  for (let i = 0; i < 6; i++) {
    const a = (i + 0.5) / 6 * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.4) continue;  // 跳过正门方向
    arch(1.5, 2.6, stoneM, Math.sin(a) * (R - 0.15), 3.4, Math.cos(a) * (R - 0.15), aw, a, true);
  }

  // 室内地面：石板 + 裂缝
  const fl = cyl(R - 0.2, R - 0.2, 0.24, M(0xffffff, { map: stoneTex, rough: 1 }), 0, -0.02, 0, P('drum', gShrine), 36);
  fl.receiveShadow = true;
  // 地面碎石瓦砾
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, r = 2 + rnd() * 6.5;
    const rb = box(0.15 + rnd() * 0.35, 0.1 + rnd() * 0.15, 0.15 + rnd() * 0.3, stoneDark,
      Math.sin(a) * r, 0.12, Math.cos(a) * r, P('drum', gShrine), rnd() * 3);
    rb.receiveShadow = true;
  }

  // 穹顶：8 瓣中缺 2 瓣（破损），顶部留采光口
  const dg = P('dome', gDome);
  const domeM = extM(0xe2dccd, { map: domeTex, rough: 0.97, side: THREE.DoubleSide });
  const DR = 9.7;
  for (let i = 0; i < 8; i++) {
    if (i === 2 || i === 5) continue;  // 破洞
    const g2 = mesh(new THREE.SphereGeometry(DR, 7, 5, i / 8 * Math.PI * 2, Math.PI * 2 / 8, Math.PI * 0.14, Math.PI * 0.38), domeM, 0, 7, 0, dg);
    g2.castShadow = true;
  }
  const oculus = mesh(new THREE.TorusGeometry(DR * Math.sin(Math.PI * 0.14), 0.35, 8, 20), stoneM, 0, 7 + DR * Math.cos(Math.PI * 0.14), 0, dg);
  oculus.rotation.x = Math.PI / 2;
  // 穹顶肋拱
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    const rib = box(0.4, 0.4, 6.4, stoneDark, Math.sin(a) * 7.6, 11.6, Math.cos(a) * 7.6, dg, a);
    rib.rotation.x = -0.62;
  }
  // 掉落的穹顶碎块（室内）
  for (let i = 0; i < 6; i++) {
    const fb = box(0.8 + rnd() * 1.2, 0.4, 0.7 + rnd() * 0.8, stoneDark, -4 + rnd() * 8, 0.25, -3 + rnd() * 6, P('drum', gShrine), rnd() * 3);
    fb.receiveShadow = true;
  }

  // 穹顶木梁（3 根横跨 + 吊杆）
  const rf = P('rafters', gShrine);
  const beamM = M(0xffffff, { map: darkWoodTex, rough: 0.95 });
  [[0, 9.6, 0], [2.8, 10.4, 0.35], [-2.8, 10.4, -0.35]].forEach(([x, y, rz]) => {
    const b = box(15.5, 0.42, 0.42, beamM, x, y, 0, rf);
    b.rotation.z = rz * 0.3;
  });
  const b2 = box(0.42, 0.42, 15.5, beamM, 0, 10.1, 0, rf);
  cyl(0.09, 0.09, 2.2, beamM, 1.2, 8.4, 0, rf, 8);   // 吊杆
  // 元素碎片（发光小瓶）
  const shard = mesh(new THREE.OctahedronGeometry(0.16), M(0x7fe0ff, { emissive: 0x3fa8e0, ei: 1.6 }), 1.2, 7.1, 0, rf);
  shard.castShadow = false;

  // 环形回廊（二层）：环形走道 + 牛腿托 + 栏杆
  const gal = P('columns', gShrine);
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, 8.2, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, 6.9, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);
  const ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: 0.3, bevelEnabled: false, curveSegments: 40 });
  ringGeo.rotateX(-Math.PI / 2);
  mesh(ringGeo, stoneM, 0, 4.55, 0, gal);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const cor = box(0.35, 0.7, 0.5, stoneDark, Math.sin(a) * 7.55, 4.2, Math.cos(a) * 7.55, gal, a);
    cor.rotation.x = 0.25;
  }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    box(0.09, 0.9, 0.09, stoneDark, Math.sin(a) * 8.0, 5.3, Math.cos(a) * 8.0, gal);
  }
  const rail = mesh(new THREE.TorusGeometry(8.0, 0.06, 6, 40), stoneDark, 0, 5.75, 0, gal);
  rail.rotation.x = Math.PI / 2;
  // 拱廊石柱（一层，8 根）
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    const x = Math.sin(a) * 7.4, z = Math.cos(a) * 7.4;
    cyl(0.42, 0.5, 6.4, stoneM, x, 3.2, z, gal, 10);
    box(1.2, 0.35, 1.2, stoneM, x, 6.55, z, gal);
    box(1.3, 0.35, 1.3, stoneM, x, 0.18, z, gal);
  }
  // 幻影墙（东侧一段颜色微异的墙）
  const il = P('illusory', gShrine);
  const iw = mesh(new THREE.CylinderGeometry(8.85, 8.85, 6.4, 8, 1, true, Math.PI * 0.08, Math.PI * 0.1),
    M(0x55585f, { rough: 0.9, side: THREE.DoubleSide }), 0, 3.4, 0, il);
  iw.castShadow = false;
  gDome.scale.y = 0.9;   // 穹顶略压扁，更接近实景轮廓
})();

/* ============ 主厅：篝火、王座、NPC ============ */
(function buildHall() {
  const stoneM = M(0xffffff, { map: stoneTex, rough: 0.97 });
  const stoneDark = M(0x3f4148, { rough: 1 });

  // ---- 中央篝火 ----
  const bf = P('bonfire', gShrine);
  for (let i = 0; i < 11; i++) {   // 石环
    const a = i / 11 * Math.PI * 2;
    const st = box(0.34, 0.3, 0.26, stoneDark, Math.sin(a) * 0.95, 0.15, 2 + Math.cos(a) * 0.95, bf, a + 0.3);
    st.rotation.z = (rnd() - .5) * 0.2;
  }
  sph(0.75, M(0x4a4a4e, { rough: 1 }), 0, 0.12, 2, bf, 1, 0.35, 1);   // 灰堆
  for (let i = 0; i < 8; i++) sph(0.09 + rnd() * 0.08, M(0x2c2c30, { rough: 1 }), (rnd() - .5) * 1.1, 0.2, 2 + (rnd() - .5) * 1.1, bf); // 余烬块
  // 螺旋剑（倾斜插入）
  const csw = new THREE.Group(); csw.position.set(0, 0.15, 2); csw.rotation.z = 0.22; csw.rotation.x = -0.1; bf.add(csw);
  box(0.09, 1.5, 0.03, steelM, 0, 0.75, 0, csw);
  const coil = mesh(new THREE.TorusGeometry(0.09, 0.028, 6, 12), steelM, 0, 1.52, 0, csw);
  box(0.3, 0.06, 0.06, guardM, 0, 0.12, 0, csw);
  cyl(0.035, 0.035, 0.22, M(0x2c2118, { rough: 0.9 }), 0, -0.02, 0, csw, 8);
  // 火焰：三层锥 + 光 + 余烬粒子
  const flameO = mesh(new THREE.ConeGeometry(0.42, 1.15, 10), M(0xff7a1e, { emissive: 0xff6a0e, ei: 2.4, transparent: true, opacity: 0.92 }), 0, 0.85, 2, bf);
  flameO.castShadow = false;
  const flameI = mesh(new THREE.ConeGeometry(0.22, 0.7, 8), M(0xffd97a, { emissive: 0xffc23e, ei: 3 }), 0, 0.7, 2, bf);
  flameI.castShadow = false;
  FX.flameO = flameO;
  FX.fireLight = new THREE.PointLight(0xff8c2e, 60, 26, 2);
  FX.fireLight.position.set(0, 1.6, 2); bf.add(FX.fireLight);
  // 主厅内部暖光（烛火氛围）
  FX.daisLight = new THREE.PointLight(0xffb36b, 45, 28, 2);
  FX.daisLight.position.set(0, 6.5, -5); gShrine.add(FX.daisLight);
  const hallFill = new THREE.PointLight(0xffd9a0, 16, 32, 2);
  hallFill.position.set(0, 8, 7); gShrine.add(hallFill);
  for (let i = 0; i < 24; i++) {
    const e = sph(0.03 + rnd() * 0.035, flameM, (rnd() - .5) * 0.8, 0.8, 2 + (rnd() - .5) * 0.8, bf);
    e.castShadow = false;
    FX.embers.push({ m: e, x0: e.position.x, z0: e.position.z, sp: 0.5 + rnd() * 0.8, ph: rnd() * 2.2 });
  }

  // ---- 防火女 ----
  const fk = P('firekeeper', gShrine);
  figure(2.8, 0, 3.6, fk, 0x3d3a44, 1.75, false);
  const veil = sph(0.19, M(0x2c2a33, { rough: 1, transparent: true, opacity: 0.85 }), 2.8, 1.44, 3.6, fk);
  veil.castShadow = false;
  candle(2.1, 0, 4.3, fk, 1.3); candle(3.5, 0, 4.3, fk, 1.1);

  // ---- 霍克伍德（东侧楼梯底） ----
  const hw = P('hawkwood', gShrine);
  figure(6.6, 0, -0.6, hw, 0x4a4438, 1.7, true);
  sword(6.1, 0.05, -0.2, hw, 1.0, 1.35, 0);   // 搁在一旁的剑

  // ---- 王座高台（两层半圆） ----
  const da = P('dais', gShrine);
  const tier1 = mesh(new THREE.CylinderGeometry(5.6, 5.8, 0.65, 24, 1, false, Math.PI / 2, Math.PI), stoneM, 0, 0.32, -5, da);
  tier1.receiveShadow = true;
  const tier2 = mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.65, 24, 1, false, Math.PI / 2, Math.PI), stoneM, 0, 0.95, -5, da);
  tier2.receiveShadow = true;
  // 高台正面拱形壁龛（南侧立面）
  for (let i = -1; i <= 1; i++) arch(1.3, 1.5, stoneDark, i * 2.6, 0.65, -4.82, da, 0, false);
  // 高台边缘烛火
  const cd = P('candles', gShrine);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI;
    candle(Math.sin(a) * 5.45, 0.65, -5 + Math.cos(a) * 5.45, cd, 1.15);
  }
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI / 2 + (i / 8) * Math.PI;
    candle(Math.sin(a) * 4.05, 1.28, -5 + Math.cos(a) * 4.05, cd, 0.95);
  }

  // ---- 五王座 ----
  const throneStone = M(0xffffff, { map: stoneTex, rough: 0.95 });
  const charM = M(0x1c1a18, { rough: 0.9, emissive: 0xff4400, ei: 0.12 });
  const throneDefs = [
    { id: 'throne-red',     a: -54, style: 'red' },
    { id: 'throne-ludleth', a: -27, style: 'ludleth' },
    { id: 'throne-charred', a: 0,   style: 'charred' },
    { id: 'throne-swords',  a: 27,  style: 'swords' },
    { id: 'throne-giant',   a: 54,  style: 'giant' },
  ];
  throneDefs.forEach(({ id, a, style }) => {
    const g = P(id, gShrine);
    const ar = a * Math.PI / 180;
    const R2 = 3.1, cx = 0, cz = -5;
    g.position.set(cx + Math.sin(ar) * R2, 1.28, cz - Math.cos(ar) * R2);
    g.rotation.y = -ar;
    const s = style === 'giant' ? 1.55 : style === 'ludleth' ? 0.72 : 1;
    const bm = style === 'charred' ? charM : throneStone;
    // 基座/座面/扶手/靠背（按风格缩放与材质）
    box(1.15 * s, 0.5 * s, 1.0 * s, bm, 0, 0.25 * s, 0, g);
    box(0.95 * s, 0.55 * s, 0.85 * s, bm, 0, 0.72 * s, 0.05 * s, g);
    box(0.18 * s, 0.8 * s, 0.9 * s, bm, -0.56 * s, 0.85 * s, 0, g);
    box(0.18 * s, 0.8 * s, 0.9 * s, bm, 0.56 * s, 0.85 * s, 0, g);
    const backH = style === 'charred' ? 3.0 : 2.3;
    box(1.0 * s, backH * s, 0.28 * s, bm, 0, (0.9 + backH / 2) * s, -0.42 * s, g);
    const crest = mesh(new THREE.ConeGeometry(0.5 * s, 0.6 * s, 4), bm, 0, (0.9 + backH + 0.3) * s, -0.42 * s, g);
    crest.rotation.y = Math.PI / 4;
    const insc = box(0.7 * s, 0.9 * s, 0.06, M(0xffffff, { map: runeTex, rough: 0.9 }), 0, 1.8 * s, -0.56 * s, g);
    insc.castShadow = false;
    if (style === 'red') {   // 华丽红布 + 圣烛
      const cloth = box(1.25 * s, 1.9 * s, 0.1, M(0x8e1f1f, { rough: 0.85 }), 0, 1.6 * s, -0.2 * s, g);
      cloth.rotation.x = 0.12;
      box(1.3 * s, 0.12, 1.0 * s, M(0x8e1f1f, { rough: 0.85 }), 0, 1.02 * s, 0.05 * s, g);
      for (let i = 0; i < 5; i++) candle(-0.8 + i * 0.4, 1.28, 1.1, g, 1.2);
    }
    if (style === 'ludleth') {  // 鲁道斯端坐
      figure(0, 1.0 * s, 0.1, g, 0x5a4a3a, 0.9, true);
      sph(0.11, M(0xc9a882, { rough: 1 }), 0, 1.62 * s, 0.14, g);  // 头（小）
    }
    if (style === 'charred') {  // 熔流裂纹
      for (let i = 0; i < 5; i++) {
        const cr = box(0.05, 1.6 * s * (0.5 + rnd() * 0.5), 0.02, M(0xff5a1e, { emissive: 0xff4400, ei: 1.4 }), (rnd() - .5) * 0.7 * s, 1.9 * s, -0.27 * s, g);
        cr.castShadow = false; cr.rotation.z = (rnd() - .5) * 0.5;
      }
    }
    if (style === 'swords') {   // 插剑
      for (let i = 0; i < 6; i++)
        sword(-1.1 + i * 0.42, 1.28, 0.75 + (rnd() - .5) * 0.3, g, 0.9 + rnd() * 0.4, (rnd() - .5) * 0.5, (rnd() - .5) * 0.3);
    }
  });

  // ---- 王座后阶梯 + 上层平台 + 伦纳德 ----
  const bs = P('backstairs', gShrine);
  for (let i = 0; i < 6; i++) box(3.6, 0.3, 0.55, stoneM, 0, 0.15 + i * 0.28, -9.6 - i * 0.52, bs);
  box(5.5, 0.3, 2.6, stoneM, 0, 1.75, -12.2, bs);
  for (let i = -1; i <= 1; i++) arch(1.4, 2.2, stoneM, i * 1.9, 1.9, -13.2, bs, 0, true);
  const ln = P('leonhard', gShrine);
  figure(2.6, 1.9, -12.2, ln, 0x2c2c34, 1.75, true);
  const mask = sph(0.13, M(0xd8d4c8, { rough: 0.7 }), 2.6, 2.62, -12.05, ln);  // 银面具
  mask.castShadow = false;
  candle(1.8, 1.9, -12.6, ln, 1.1);

  // ---- 东侧下行楼梯（通下层） ----
  const es = P('hawkwood', gShrine);
  for (let i = 0; i < 12; i++)
    box(1.4, 0.26, 0.5, stoneM, 7.6, -0.13 - i * 0.24, 1.8 - i * 0.48, es);
})();

/* ============ 下层：地道、侍女、铁匠铺 ============ */
(function buildUnder() {
  const stoneM = M(0xffffff, { map: stoneTex, rough: 0.97 });
  const stoneDark = M(0x3f4148, { rough: 1 });
  const FY = -3;   // 下层地面

  // 下层大厅：x[-7,7], z[-9,-2]
  const tun = P('tunnel', gUnder);
  box(14, 0.3, 7, stoneM, 0, FY - 0.05, -5.5, tun);                    // 地面
  box(14, 0.35, 7.4, stoneDark, 0, -0.32, -5.5, tun);                 // 顶（主厅地板下）
  wallSeg(-7, -9, 7, -9, FY, 3, 0.6, stoneM, tun);                    // 北墙
  wallSeg(-7, -2, -7, -9, FY, 3, 0.6, stoneM, tun);                   // 西墙
  wallSeg(7, -2, 7, -9, FY, 3, 0.6, stoneM, tun);                     // 东墙
  wallSeg(-7, -2, -1.6, -2, FY, 3, 0.6, stoneM, tun);                 // 南墙（留地道口）
  wallSeg(1.6, -2, 7, -2, FY, 3, 0.6, stoneM, tun);
  // 地道：向南至主入口下方，尽头碎石封堵
  box(3.2, 0.3, 7, stoneM, 0, FY - 0.05, 1.5, tun);
  wallSeg(-1.6, -2, -1.6, 5, FY, 2.6, 0.5, stoneM, tun);
  wallSeg(1.6, -2, 1.6, 5, FY, 2.6, 0.5, stoneM, tun);
  box(3.2, 2.6, 0.5, stoneM, 0, FY + 1.3, 5, tun);
  for (let i = 0; i < 7; i++)
    box(0.4 + rnd() * 0.5, 0.35 + rnd() * 0.4, 0.4, stoneDark, -1 + rnd() * 2, FY + 0.2, 4.2 + rnd() * 0.6, tun, rnd() * 3);
  candle(-1.1, FY, 0.5, tun, 1.1); candle(1.1, FY, 2.5, tun, 0.9);
  // 石柱
  for (const [x, z] of [[-4, -4], [4, -4], [-4, -7.5], [4, -7.5]]) {
    cyl(0.32, 0.38, 2.9, stoneM, x, FY + 1.45, z, tun, 10);
    box(0.9, 0.25, 0.9, stoneM, x, FY + 2.95, z, tun);
  }

  // ---- 祭祀场侍女（西侧） ----
  const hm = P('handmaid', gUnder);
  const rug = cyl(1.1, 1.1, 0.06, M(0x6e2a2a, { rough: 1 }), -4.5, FY + 0.03, -6, hm, 16);
  rug.receiveShadow = true;
  figure(-4.5, FY, -6, hm, 0x4a3d33, 1.6, true);
  sph(0.15, M(0xb09a80, { rough: 1 }), -4.5, FY + 0.66, -5.95, hm);
  // 货物：陶罐与箱子
  sph(0.28, M(0x7a5230, { rough: 0.9 }), -5.6, FY + 0.28, -5.4, hm);
  cyl(0.12, 0.2, 0.5, M(0x7a5230, { rough: 0.9 }), -5.6, FY + 0.6, -5.4, hm, 10);
  sph(0.24, M(0x6a4a28, { rough: 0.9 }), -3.6, FY + 0.24, -6.8, hm);
  box(0.55, 0.4, 0.45, M(0x5a4028, { map: darkWoodTex }), -5.3, FY + 0.2, -6.9, hm, 0.3);
  box(0.45, 0.35, 0.4, M(0x5a4028, { map: darkWoodTex }), -3.5, FY + 0.17, -5.2, hm, -0.2);
  // 烛台
  cyl(0.04, 0.06, 1.1, M(0x3a3a3a, { metal: 0.5, rough: 0.5 }), -3.7, FY + 0.55, -6.6, hm, 8);
  for (let i = 0; i < 3; i++) candle(-3.7 + (i - 1) * 0.12, FY + 1.08, -6.6, hm, 0.9);

  // ---- 铁匠安德烈（东侧锻炉壁龛） ----
  const an = P('andre', gUnder);
  figure(4.5, FY, -6.6, an, 0x4f4438, 1.85, false);   // 安德烈（光头大汉剪影）
  sph(0.17, M(0xc9a882, { rough: 1 }), 4.5, FY + 1.52, -6.6, an);
  box(0.5, 0.28, 0.3, M(0x3a3230, { rough: 1 }), 4.5, FY + 1.1, -6.45, an);  // 皮围裙
  // 锻炉壁龛
  arch(3.2, 2.8, stoneM, 5.2, FY, -8.6, an, 0, false);
  const fg = P('forge', gUnder);
  box(1.7, 1.25, 1.1, stoneDark, 5.2, FY + 0.62, -8.5, fg);
  const firebox = box(1.1, 0.7, 0.2, M(0xff7a1e, { emissive: 0xff5a0e, ei: 2.6 }), 5.2, FY + 0.55, -7.92, fg);
  firebox.castShadow = false;
  box(1.9, 0.18, 1.3, stoneM, 5.2, FY + 1.32, -8.5, fg);   // 炉顶
  cyl(0.22, 0.28, 1.6, stoneM, 5.2, FY + 2.2, -8.5, fg, 10); // 烟囱
  FX.forgeLight = new THREE.PointLight(0xff7a1e, 30, 10, 2);
  FX.forgeLight.position.set(5.2, FY + 1.0, -7.6); fg.add(FX.forgeLight);
  // 铁砧（树桩上）
  const av = P('anvil', gUnder);
  cyl(0.42, 0.5, 0.62, M(0xffffff, { map: darkWoodTex, rough: 1 }), 3.3, FY + 0.31, -5.8, av, 12);
  box(0.85, 0.28, 0.32, M(0x3c3f45, { metal: 0.7, rough: 0.45 }), 3.3, FY + 0.76, -5.8, av);
  const horn = mesh(new THREE.ConeGeometry(0.14, 0.5, 10), M(0x3c3f45, { metal: 0.7, rough: 0.45 }), 3.85, FY + 0.76, -5.8, av);
  horn.rotation.z = -Math.PI / 2;
  box(0.3, 0.14, 0.34, M(0x3c3f45, { metal: 0.7, rough: 0.45 }), 3.3, FY + 0.62, -5.8, av);
  // 风箱
  const bl = P('bellows', gUnder);
  const b1 = box(1.0, 0.14, 0.55, M(0xffffff, { map: darkWoodTex }), 6.4, FY + 0.5, -6.4, bl); b1.rotation.z = 0.12;
  const b2 = box(1.0, 0.14, 0.55, M(0xffffff, { map: darkWoodTex }), 6.4, FY + 0.72, -6.4, bl); b2.rotation.z = -0.1;
  box(0.5, 0.3, 0.4, M(0x8a2a1a, { rough: 0.9 }), 6.4, FY + 0.61, -6.4, bl);  // 皮囊
  cyl(0.05, 0.09, 0.7, M(0x2c2c2c, { metal: 0.6, rough: 0.5 }), 5.75, FY + 0.6, -6.9, bl, 8).rotation.x = 1.1;
  // 磨刀石
  const gs = P('grindstone', gUnder);
  box(0.9, 0.7, 0.5, M(0xffffff, { map: darkWoodTex }), 2.6, FY + 0.35, -8.1, gs);
  const wheel = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 18), stoneDark, 2.6, FY + 0.95, -8.1, gs);
  wheel.rotation.z = Math.PI / 2;
  cyl(0.04, 0.04, 0.5, M(0x3a3a3a, { metal: 0.5, rough: 0.5 }), 2.6, FY + 0.95, -8.1, gs, 8).rotation.x = Math.PI / 2;
  // 武器架
  const wr = P('weaponrack', gUnder);
  box(0.09, 1.5, 0.09, M(0xffffff, { map: darkWoodTex }), 6.5, FY + 0.75, -8.3, wr);
  box(0.09, 1.5, 0.09, M(0xffffff, { map: darkWoodTex }), 7.3, FY + 0.75, -8.3, wr);
  box(0.95, 0.09, 0.09, M(0xffffff, { map: darkWoodTex }), 6.9, FY + 1.35, -8.3, wr);
  box(0.95, 0.09, 0.09, M(0xffffff, { map: darkWoodTex }), 6.9, FY + 0.5, -8.3, wr);
  sword(6.6, FY + 0.55, -8.28, wr, 1.15, 0.06, 0);
  sword(6.9, FY + 0.55, -8.28, wr, 1.05, -0.05, 0);
  sword(7.15, FY + 0.55, -8.28, wr, 1.2, 0.1, 0);
  // 水桶与杂物
  cyl(0.22, 0.18, 0.4, M(0xffffff, { map: darkWoodTex }), 2.2, FY + 0.2, -6.2, an, 10);
})();

/* ============ 塔楼群：巨人树、钟塔、断桥、升降机 ============ */
(function buildTower() {
  const stoneM = extM(0xffffff, { map: stoneTex, rough: 0.97 });
  const stoneDark = M(0x3f4148, { rough: 1 });
  const TY = 0.8;   // 塔楼平台高度

  // 塔楼平台 + 石阶
  box(22, 0.9, 13, stoneM, 21, TY - 0.45, 0, P('tower', gTower));
  for (let i = 0; i < 4; i++) box(3.2, 0.24, 1.0, stoneM, 11 + i * 0.75, 0.12 + i * 0.22, 3, P('tower', gTower));

  // ---- 石化巨人树 ----
  const gt = P('gianttree', gTower);
  const petM = M(0x9a938a, { rough: 1 });
  let px = 14, pz = 2;
  for (let i = 0; i < 3; i++) {
    cyl(0.55 - i * 0.12, 0.7 - i * 0.12, 2.0, petM, px, TY + 1.0 + i * 1.9, pz, gt, 9);
    px += (rnd() - .5) * 0.5; pz += (rnd() - .5) * 0.5;
  }
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2, len = 1.6 + rnd() * 2.2;
    const br = cyl(0.04, 0.1, len, petM, px + Math.cos(a) * 0.6, TY + 5.6 + rnd() * 1.2, pz + Math.sin(a) * 0.6, gt, 6);
    br.rotation.z = Math.cos(a) * 1.2; br.rotation.x = -Math.sin(a) * 1.2;
  }
  // 树根
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const rt = cyl(0.09, 0.16, 1.4, petM, 14 + Math.cos(a) * 0.8, TY + 0.4, 2 + Math.sin(a) * 0.8, gt, 6);
    rt.rotation.z = Math.cos(a) * 0.7; rt.rotation.x = -Math.sin(a) * 0.7;
  }

  // ---- 塔门（上锁） ----
  const tg = P('towergate', gTower);
  arch(2.6, 3.6, stoneM, 17, TY, 0, tg, Math.PI / 2, false);
  for (let i = 0; i < 7; i++)   // 闸门铁栅（半放下）
    cyl(0.045, 0.045, 2.2, M(0x2c2c30, { metal: 0.6, rough: 0.5 }), 17, TY + 1.6, -0.75 + i * 0.25, tg, 6);
  box(1.7, 0.3, 0.12, M(0x2c2c30, { metal: 0.6, rough: 0.5 }), 17, TY + 0.6, 0, tg);
  box(0.3, 0.4, 0.08, M(0xd9b23a, { metal: 0.7, rough: 0.4 }), 17.06, TY + 1.9, 0.62, tg);  // 锁

  // ---- 一号钟塔（方形，盘旋石梯） ----
  const tw = P('tower', gTower);
  const TX = 20, TW = 4.6, TH = 13;
  box(TW, TH, 0.6, stoneM, TX, TY + TH / 2, TW / 2 - 0.3, tw);            // 北墙
  cutWalls.ts = box(TW, TH, 0.6, stoneM, TX, TY + TH / 2, -TW / 2 + 0.3, tw);   // 南墙（塔楼视角隐藏）
  box(0.6, TH, TW, stoneM, TX - TW / 2 + 0.3, TY + TH / 2, 0, tw);        // 西墙
  box(0.6, TH, TW, stoneM, TX + TW / 2 - 0.3, TY + TH / 2, 0, tw);        // 东墙
  // 箭孔窗
  for (const yy of [4, 7.5, 11]) for (const [wx, wz, ry] of [[TX, TW / 2 + 0.02, 0], [TX - TW / 2 - 0.02, 0, Math.PI / 2]]) {
    const slit = box(0.28, 1.1, 0.1, M(0x0b0c10, { rough: 1 }), wx, TY + yy, wz, tw, ry);
    slit.castShadow = false;
  }
  // 顶部残缺雉堞
  for (let i = 0; i < 10; i++) {
    if (rnd() < 0.35) continue;
    const a = i / 10 * Math.PI * 2;
    box(0.55, 0.5, 0.4, stoneM, TX + Math.sin(a) * (TW / 2), TY + TH + 0.25, Math.cos(a) * (TW / 2), tw, a);
  }
  // 盘旋石梯（中央石柱 + 20 级）
  const sp = P('spairstairs', gTower);
  cyl(0.35, 0.42, TH - 1, stoneM, TX, TY + (TH - 1) / 2, 0, sp, 10);
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 3;
    const sx = TX + Math.sin(a) * 1.35, sz = Math.cos(a) * 1.35;
    box(1.15, 0.2, 0.62, stoneM, sx, TY + 1.2 + i * 0.56, sz, sp, a);
  }
  // 大钟（塔顶机房）
  const bl = P('bell', gTower);
  box(2.6, 0.3, 0.3, M(0xffffff, { map: darkWoodTex }), TX, TY + TH - 0.6, 0, bl);
  const bellM = M(0x8a6a2a, { metal: 0.75, rough: 0.45 });
  mesh(new THREE.CylinderGeometry(0.42, 0.78, 1.25, 14), bellM, TX, TY + TH - 1.5, 0, bl);
  sph(0.14, M(0x3a3a3a, { metal: 0.6, rough: 0.5 }), TX, TY + TH - 2.25, 0, bl);  // 钟舌
  cyl(0.05, 0.05, 0.5, M(0x3a3a3a, { metal: 0.6, rough: 0.5 }), TX, TY + TH - 0.95, 0, bl, 8);

  // ---- 断裂石桥 ----
  const br = P('bridge', gTower);
  const BY = TY + 11.2;
  box(3.2, 0.5, 1.7, stoneM, 23.9, BY, 0, br);
  box(2.4, 0.5, 1.7, stoneM, 28.6, BY, 0, br);
  for (const bx of [22.6, 25.2, 27.8, 29.6]) {  // 桥栏（残缺）
    if (rnd() < 0.3) continue;
    box(0.25, 0.8, 0.25, stoneM, bx, BY + 0.6, 0.75, br);
    box(0.25, 0.8, 0.25, stoneM, bx, BY + 0.6, -0.75, br);
  }
  const fallen = box(1.8, 0.5, 1.6, stoneDark, 26.6, BY - 3.4, 0.4, br, 0.4);  // 坠落的桥段
  fallen.rotation.z = 0.25;
  box(1.4, 0.3, 1.2, stoneM, 26.6, BY - 3.05, 0.4, br, 0.4);  // 下方小平台

  // ---- 二号升降机塔（圆形） ----
  const lt = P('lifttower', gTower);
  const LX = 32, LR = 2.7, LH = 15;
  const ltDrum = mesh(new THREE.CylinderGeometry(LR, LR + 0.3, LH, 18, 1, true), stoneM, LX, TY + LH / 2, 0, lt);
  // 内壁可见：加内层
  const ltIn = mesh(new THREE.CylinderGeometry(LR - 0.5, LR - 0.5, LH, 18, 1, true),
    M(0xffffff, { map: stoneTex, rough: 0.97, side: THREE.BackSide }), LX, TY + LH / 2, 0, lt);
  // 升降机
  const lf = P('lift', gTower);
  box(2.0, 0.28, 2.0, M(0xffffff, { map: darkWoodTex }), LX, TY + 5.5, 0, lf);
  for (const [cx, cz] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]])
    cyl(0.035, 0.035, 9.5, M(0x2c2c2c, { metal: 0.65, rough: 0.45 }), LX + cx, TY + 10.4, cz, lf, 6);
  cyl(0.5, 0.6, 0.5, stoneDark, LX, TY + 15.4, 0, lf, 10);   // 绞盘
  const plate = cyl(0.55, 0.55, 0.1, stoneDark, LX - 1.2, TY + 0.65, 1.2, lf, 12);  // 脚踏机关
  // 塔顶平台 + 雉堞
  cyl(LR + 0.4, LR + 0.4, 0.4, stoneM, LX, TY + LH + 0.1, 0, lt, 18);
  for (let i = 0; i < 12; i++) {
    if (rnd() < 0.3) continue;
    const a = i / 12 * Math.PI * 2;
    box(0.5, 0.55, 0.35, stoneM, LX + Math.sin(a) * (LR + 0.3), TY + LH + 0.55, Math.cos(a) * (LR + 0.3), lt, a);
  }
  // 塔顶：防火女之魂（尸体 + 发光物）
  const fk2 = P('fksoul', gTower);
  box(0.55, 0.32, 1.2, M(0x3a3230, { rough: 1 }), LX + 0.6, TY + LH + 0.45, 0.5, fk2, 0.5);
  sph(0.16, M(0xb09a80, { rough: 1 }), LX + 0.6, TY + LH + 0.66, 0.95, fk2);
  const soul = mesh(new THREE.OctahedronGeometry(0.17), M(0xbfe8ff, { emissive: 0x6fb8e8, ei: 2 }), LX - 0.5, TY + LH + 0.55, -0.6, fk2);
  soul.castShadow = false;
  candle(LX + 1.3, TY + LH + 0.3, -0.9, fk2, 1);

  // ---- 乌鸦巢（穹顶顶部中央） ----
  const cn = P('crowsnest', gDome);
  const nestM = M(0x4a3626, { rough: 1 });
  const nest = mesh(new THREE.TorusGeometry(0.95, 0.3, 8, 16), nestM, 0, 16.0, 0, cn);
  nest.rotation.x = Math.PI / 2;
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2;
    const stick = cyl(0.03, 0.045, 0.9 + rnd() * 0.7, nestM, Math.cos(a) * 0.95, 16.0 + (rnd() - .5) * 0.3, Math.sin(a) * 0.95, cn, 5);
    stick.rotation.z = Math.cos(a) * 1.25; stick.rotation.x = -Math.sin(a) * 1.25;
  }
  for (let i = 0; i < 3; i++) {   // 亮闪闪的交易物
    const tr = mesh(new THREE.OctahedronGeometry(0.11), M(0xffe9a8, { emissive: 0xffd76a, ei: 1.8 }), (rnd() - .5) * 1.1, 16.2, (rnd() - .5) * 1.1, cn);
    tr.castShadow = false;
  }
})();

/* ============ 交互 ============ */
const view = document.getElementById('view');
const panel = document.getElementById('panel');
const labelWrap = document.getElementById('labels');
const infoEl = document.getElementById('info');
const infoName = document.getElementById('infoName');
const infoCat = document.getElementById('infoCat');
const infoDesc = document.getElementById('infoDesc');
let viewW = 800, viewH = 600;
let cur = 'exterior', selected = null, labelsOn = true;
let fly = null, hlBox = null;
const tmpBox = new THREE.Box3();
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function flyTo(pos, tgt) { fly = { pos: pos.clone(), tgt: tgt.clone() }; }
controls.addEventListener('start', () => { fly = null; });

// 部件列表
const partsWrap = document.getElementById('parts');
for (const ck of ['out', 'hall', 'under', 'tower']) {
  const h = document.createElement('div'); h.className = 'cat'; h.textContent = CATS[ck];
  partsWrap.appendChild(h);
  for (const id in PARTS) {
    const p = PARTS[id];
    if (p.cat !== ck) continue;
    const b = document.createElement('button');
    b.className = 'pbtn'; b.dataset.part = id; b.textContent = p.name;
    b.onclick = () => selectPart(id);
    partsWrap.appendChild(b);
  }
}

// 视角模式
function setMode(m) {
  cur = m;
  document.querySelectorAll('.vbtn').forEach(b => b.classList.toggle('on', b.dataset.view === m));
  const xray = (m === 'xray');
  gDome.visible = (m === 'exterior' || m === 'tower') && !xray;
  const cutT = (m === 'tower');                       // 钟塔视角：隐藏塔身南墙看内部
  if (cutWalls.ts) cutWalls.ts.visible = !cutT;
  extMats.forEach(mt => { mt.transparent = xray; mt.opacity = xray ? 0.14 : 1; mt.depthWrite = !xray; mt.needsUpdate = true; });
  if (m === 'exterior') flyTo(V(17, 11, 21), V(2, 3, -2));
  if (m === 'hall') flyTo(V(0, 15, 22), V(0, 2.5, -3));
  if (m === 'tower') flyTo(V(40, 14, 15), V(25, 7, 0));
  if (m === 'xray') flyTo(V(17, 12, 20), V(4, 3, -2));
}
document.querySelectorAll('.vbtn').forEach(b => b.onclick = () => setMode(b.dataset.view));

// 开关
const tLabels = document.getElementById('tLabels');
tLabels.onclick = () => { labelsOn = !labelsOn; tLabels.classList.toggle('on', labelsOn); };
const tRotate = document.getElementById('tRotate');
tRotate.onclick = () => { controls.autoRotate = !controls.autoRotate; tRotate.classList.toggle('on', controls.autoRotate); };
document.getElementById('explode').addEventListener('input', e => {
  const t = e.target.value / 100;
  gDome.position.y = 8 * t;
  gTower.position.y = 4 * t;
  gUnder.position.y = -2.5 * t;
});
document.getElementById('menuBtn').onclick = () => { panel.classList.toggle('hide'); setTimeout(onResize, 260); };
document.getElementById('infoX').onclick = () => infoEl.classList.remove('show');

// 选择部件
function ensureVisible(p) {
  const L = p.layer;
  if (L === 'dome') { if (cur !== 'exterior' && cur !== 'tower') setMode('exterior'); return; }
  if (L === 'ground') return;
  if (p.xray) {
    if (cur === 'exterior') setMode('xray');
    else if (cur === 'hall' && (L === 'tower' || L === 'under')) setMode('xray');
    else if (cur === 'tower' && (L === 'hall' || L === 'under')) setMode('xray');
  }
}
function clearHl() {
  if (hlBox) { scene.remove(hlBox); hlBox.geometry.dispose(); hlBox.material.dispose(); hlBox = null; }
}
const LAYER_SUB = { dome: ' · 穹顶', hall: ' · 主厅', under: ' · 下层', tower: ' · 塔楼', ground: ' · 室外' };
function selectPart(id) {
  const p = PARTS[id];
  if (!p || !p.group) return;
  ensureVisible(p);
  selected = id;
  document.querySelectorAll('.pbtn').forEach(b => b.classList.toggle('on', b.dataset.part === id));
  document.querySelectorAll('.lbl').forEach(el => el.classList.toggle('hot', el.dataset.part === id));
  infoName.textContent = p.name;
  infoCat.textContent = CATS[p.cat] + (LAYER_SUB[p.layer] || '');
  infoDesc.textContent = p.desc;
  infoEl.classList.add('show');
  p.group.updateWorldMatrix(true, true);
  tmpBox.setFromObject(p.group);
  if (!tmpBox.isEmpty()) {
    const c = tmpBox.getCenter(new THREE.Vector3());
    const size = tmpBox.getSize(new THREE.Vector3()).length();
    const dir = V(...(p.viewDir || [1, 0.6, 1])).normalize();
    flyTo(c.clone().addScaledVector(dir, Math.max(2.6, size * 1.5)), c);
  }
  clearHl();
  hlBox = new THREE.Box3Helper(tmpBox, 0xff8c2e);
  hlBox.material.depthTest = false;
  hlBox.renderOrder = 999;
  scene.add(hlBox);
}
function clearSelection() {
  selected = null; clearHl();
  infoEl.classList.remove('show');
  document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.lbl').forEach(el => el.classList.remove('hot'));
}

// 点击射线拾取
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downX = 0, downY = 0;
canvas.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
canvas.addEventListener('pointerup', e => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  const r = canvas.getBoundingClientRect();
  ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects(scene.children, true);
  for (const h of hits) {
    let n = h.object;
    while (n) {
      if (n.userData && n.userData.partId) { selectPart(n.userData.partId); return; }
      n = n.parent;
    }
  }
  clearSelection();
});

// 标注
const labelEls = [];
for (const id in PARTS) {
  const p = PARTS[id];
  if (p.noLabel || !p.label) continue;
  const el = document.createElement('div');
  el.className = 'lbl'; el.textContent = p.name; el.dataset.part = id;
  el.style.display = 'none';
  labelWrap.appendChild(el);
  labelEls.push({ id, el, v: V(...p.label) });
}
function isShown(obj) { let n = obj; while (n) { if (!n.visible) return false; n = n.parent; } return true; }
const pv = new THREE.Vector3();
function refreshLabels() {
  for (const { id, el, v } of labelEls) {
    const p = PARTS[id];
    const showXray = cur === 'xray'
      || (cur === 'hall' && (p.layer === 'hall' || p.layer === 'dome'))
      || (cur === 'tower' && p.layer === 'tower');
    if (!labelsOn || !isShown(p.group) || (p.xray && !showXray)) { el.style.display = 'none'; continue; }
    pv.copy(v).applyMatrix4(p.group.matrixWorld).project(camera);
    if (pv.z > 1 || pv.z < -1) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    el.style.left = ((pv.x * 0.5 + 0.5) * viewW) + 'px';
    el.style.top = ((-pv.y * 0.5 + 0.5) * viewH) + 'px';
  }
}

// 自适应（手机端修复：统一用带样式更新的 setSize + 零值保护）
function onResize() {
  viewW = view.clientWidth; viewH = view.clientHeight;
  if (viewW < 2 || viewH < 2) return;
  renderer.setSize(viewW, viewH);
  camera.aspect = viewW / viewH;
  camera.fov = viewW < viewH ? 62 : 48;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

// 主循环：相机动画 + 篝火/锻炉闪烁 + 余烬上升
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (fly) {
    camera.position.lerp(fly.pos, 0.07);
    controls.target.lerp(fly.tgt, 0.07);
    if (camera.position.distanceTo(fly.pos) < 0.06) fly = null;
  }
  controls.update();
  if (FX.fireLight) FX.fireLight.intensity = 60 + Math.sin(t * 11) * 9 + Math.sin(t * 23 + 1.7) * 6;
  if (FX.daisLight) FX.daisLight.intensity = 45 + Math.sin(t * 7 + 1) * 5;
  if (FX.forgeLight) FX.forgeLight.intensity = 30 + Math.sin(t * 9 + 0.5) * 6;
  if (FX.flameO) { const s = 1 + Math.sin(t * 13) * 0.07; FX.flameO.scale.set(s, 1 + Math.sin(t * 17) * 0.1, s); }
  for (const e of FX.embers) {
    const prog = (t * e.sp + e.ph) % 2.2;
    e.m.position.y = 0.85 + prog * 1.5;
    e.m.position.x = e.x0 + Math.sin(t * 2 + e.ph) * 0.16;
    e.m.position.z = e.z0 + Math.cos(t * 1.7 + e.ph) * 0.16;
    const sc = 1 - prog / 2.2 * 0.7;
    e.m.scale.set(sc, sc, sc);
  }
  if (selected && hlBox && PARTS[selected].group) tmpBox.setFromObject(PARTS[selected].group);
  refreshLabels();
  renderer.render(scene, camera);
}

if (window.matchMedia('(max-width: 760px)').matches) panel.classList.add('hide'); // 手机默认收起侧栏
onResize();
setMode('exterior');
animate();
document.getElementById('loading').style.display = 'none';
