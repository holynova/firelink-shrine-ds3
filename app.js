import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============ 基础场景（黑魂式阴郁氛围） ============ */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth - 296, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14161c);
scene.fog = new THREE.Fog(0x14161c, 38, 85);

const camera = new THREE.PerspectiveCamera(48, (innerWidth - 296) / innerHeight, 0.1, 300);
camera.position.set(14, 9, 17);

const controls = new OrbitControls(camera, canvas);
controls.target.set(2, 2.5, -1);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 1.5;
controls.maxDistance = 45;
controls.autoRotateSpeed = 1.0;

const hemi = new THREE.HemisphereLight(0x5a6a8a, 0x2a241c, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xbfc8e0, 1.05);
sun.position.set(-12, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0006;
scene.add(sun);

/* ============ 程序化纹理 ============ */
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

const stoneTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#4b4e57'; g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 42) {
    for (let x = 0; x < s; x += 64) {
      const ox = (y / 42 % 2) * 32;
      const v = 62 + rnd() * 22;
      g.fillStyle = `rgb(${v | 0},${v + 3 | 0},${v + 9 | 0})`;
      g.fillRect(x + ox - 32, y + 2, 60, 38);
      g.fillStyle = 'rgba(0,0,0,.28)';
      for (let i = 0; i < 14; i++) g.fillRect(x + ox - 32 + rnd() * 58, y + 2 + rnd() * 36, 3, 3);
    }
  }
  g.strokeStyle = 'rgba(15,15,18,.85)'; g.lineWidth = 3;
  for (let y = 0; y <= s; y += 42) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
}, 3, 2);
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
}, 2, 2);
const groundTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#2c2d31'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 2200; i++) {
    const v = 30 + rnd() * 40;
    g.fillStyle = `rgba(${v | 0},${v | 0},${v + 4 | 0},.6)`;
    g.fillRect(rnd() * s, rnd() * s, 2 + rnd() * 4, 2 + rnd() * 3);
  }
}, 16, 16);

/* ============ 材质与建模助手 ============ */
function M(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.95, metalness: o.metal ?? 0,
    map: o.map || null, transparent: !!o.transparent, opacity: o.opacity ?? 1,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1,
    side: o.side || THREE.FrontSide
  });
}
const extMats = [];   // 外墙材质（透视模式下变透明）
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
function wallSeg(x1, z1, x2, z2, y0, h, t, material, parent) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  return (Math.abs(x2 - x1) > Math.abs(z2 - z1))
    ? box(len, h, t, material, cx, y0 + h / 2, cz, parent)
    : box(t, h, len, material, cx, y0 + h / 2, cz, parent);
}

/* ============ 部件注册表 ============ */
const PARTS = {};
const CATS = { out: '外部', hall: '主厅', tower: '钟塔', yard: '室外' };
function defPart(id, meta) { PARTS[id] = Object.assign({ id, group: null }, meta); }
function P(id, parent) {
  const g = new THREE.Group();
  g.userData.isPart = true; g.userData.partId = id;
  PARTS[id].group = g;
  (parent || scene).add(g);
  return g;
}

defPart('church',   { name: '教堂外观', cat: 'out', layer: 'hall', label: [-5.4, 3.2, 1], viewDir: [-1, .5, .6], desc: '风化的石砌小教堂，墙体残破、布满岁月痕迹。这里是余烬们的避风港，也是所有旅途的起点与终点。' });
defPart('roof',     { name: '破损屋顶', cat: 'out', layer: 'roof', label: [0, 7.2, 0], viewDir: [1, .7, 1], desc: '人字形屋顶早已部分坍塌，露出焦黑的木梁。微光从破洞洒进主厅——这座祭祀场连屋顶都在诉说火焰将熄。' });
defPart('steps',    { name: '石阶入口', cat: 'out', layer: 'hall', label: [0, 1.6, 6.4], viewDir: [.3, .45, 1], desc: '通往教堂正门的石阶。无数不死人曾拾级而上，推开那扇沉重的木门，坐到篝火旁。' });
defPart('bonfire',  { name: '中央篝火', cat: 'hall', layer: 'hall', xray: 1, label: [0, 2.6, 0.8], viewDir: [.7, .55, 1], desc: '螺旋剑插于灰烬之中，余火不熄。坐下吧，灰烬——在这里休整，补充元素瓶，然后继续前行。' });
defPart('thrones',  { name: '王座之间', cat: 'hall', layer: 'hall', xray: 1, label: [0, 3.4, -3.4], viewDir: [0, .5, 1], desc: '半圆形高台上的四张大王座，属于薪王们：深渊的监视者、巨人尤姆、圣女艾尔德利奇……如今王座空悬，薪王们不知去向。' });
defPart('ludleth',  { name: '鲁道斯的小王座', cat: 'hall', layer: 'hall', xray: 1, label: [2.6, 2.2, -2.6], viewDir: [1, .5, .8], desc: '那张格外小巧的王座属于鲁道斯——自愿成为薪王的流放者。他总说：坐下吧，聊聊天也好。' });
defPart('andre',    { name: '铁匠安德烈', cat: 'hall', layer: 'hall', xray: 1, label: [3.7, 2.4, -1.5], viewDir: [1, .5, .5], desc: '角落里的铁砧从未冷却。安德烈一边打铁一边唠叨：又死了吗？没关系，武器可不能钝了。' });
defPart('handmaid', { name: '祭祀场侍女', cat: 'hall', layer: 'hall', xray: 1, label: [-3.9, 2.2, 0.5], viewDir: [-1, .5, .6], desc: '坐在角落里的老婆婆，用灵魂与你交易。她低语道：灰烬大人，需要什么就尽管说吧……' });
defPart('brazier',  { name: '火盆', cat: 'hall', layer: 'hall', xray: 1, label: [-3, 2.0, -3], viewDir: [-1, .6, -.6], desc: '墙边的火盆终年不熄，是这座祭祀场里少数还活着的光。' });
defPart('tower',    { name: '钟塔', cat: 'tower', layer: 'tower', label: [8.5, 8.5, -4], viewDir: [1, .45, .8], desc: '祭祀场后方的独立高塔，木梯盘旋而上。塔顶的大钟早已无人敲响，只有乌鸦还记得它的声音。' });
defPart('bell',     { name: '大钟', cat: 'tower', layer: 'tower', xray: 1, label: [8.5, 10.6, -4], viewDir: [1, .4, .7], desc: '塔顶的青铜大钟，锈迹斑斑。传说钟声曾为薪王的归来而鸣——现在，它只为风而鸣。' });
defPart('nest',     { name: '乌鸦巢', cat: 'tower', layer: 'tower', label: [8.5, 9.6, -2.1], viewDir: [.6, .35, 1], desc: '塔身外侧平台上的巨型鸟巢。把东西放进去，乌鸦会和你以物易物——它可是个精明的商人。' });
defPart('graves',   { name: '墓碑群', cat: 'yard', layer: 'ground', label: [-8, 1.6, -3], viewDir: [-1, .5, -.5], desc: '悬崖边的墓碑群，东倒西歪。埋在这里的，大多是没能传火的余烬。' });
defPart('deadtree', { name: '枯树', cat: 'yard', layer: 'ground', label: [-6, 3.4, 5], viewDir: [-1, .5, 1], desc: '扭曲的枯树指向灰暗的天空。在这个世界，连树木都放弃了生长。' });
defPart('cliffpath',{ name: '悬崖石径', cat: 'yard', layer: 'ground', label: [4.5, 0.6, -6.5], viewDir: [.5, .5, -1], desc: '沿着悬崖延伸的石径，通往钟塔，也通往更深的黑暗。小心脚下——别像某些不死人一样掉下去。' });

/* ============ 尺寸常量 ============ */
const HF = 0.9;          // 主厅地面高度（教堂建在高台上）
const WH = 4.2, T = 0.4; // 墙高 / 墙厚
const HX = 5, HZ = 4;    // 主厅半宽 / 半深
const EAVE = HF + WH;    // 屋檐 5.1
const RIDGE = EAVE + 2.2;// 屋脊 7.3
const TX = 8.5, TZ = -4; // 钟塔中心
const TH = 11;           // 钟塔高度

/* 层组（用于分层展开与视角切换） */
const gGround = new THREE.Group(), gHall = new THREE.Group(),
      gRoof = new THREE.Group(), gTower = new THREE.Group();
scene.add(gGround, gHall, gRoof, gTower);
const cutWalls = {};  // 剖面视角时隐藏的墙分组

/* 特效引用（火焰闪烁、余烬粒子） */
const FX = { embers: [], fireLight: null, forgeLight: null, flameO: null, flameI: null };

/* ============ 室外 ============ */
(function buildOutdoor() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), M(0xffffff, { map: groundTex, rough: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
  scene.add(ground);

  const cp = P('cliffpath', gGround);
  const plazaM = M(0xffffff, { map: stoneTex, rough: 1 });
  box(20, 0.12, 16, plazaM, 1.5, 0.0, -1, cp);   // 石砌平台
  // 悬崖边缘的乱石
  const rockM = M(0x3a3b40, { rough: 1 });
  for (let i = 0; i < 14; i++) {
    const a = -0.5 + rnd() * 1.1;
    const rr = 0.5 + rnd() * 1.1;
    sph(rr, rockM, 12 + Math.cos(a) * 4 * rnd(), rr * 0.4, -9 + a * 8, cp, 1, 0.6 + rnd() * 0.4, 1);
  }
  for (let i = 0; i < 8; i++) sph(0.4 + rnd() * 0.8, rockM, -9 + rnd() * 3, 0.2, -8.5 + rnd() * 2, cp, 1, 0.7, 1);
  // 石径：入口 -> 钟塔
  const slabM = M(0x55565e, { rough: 1 });
  const pathPts = [[0, 7.8], [1.2, 5.2], [2.8, 2.8], [4.6, 0.2], [6.2, -1.4], [6.9, -2.6]];
  pathPts.forEach(([x, z], i) => box(1.1, 0.1, 0.8, slabM, x, 0.1, z, cp, (rnd() - 0.5) * 0.5));

  // 墓碑群
  const gv = P('graves', gGround);
  const graveM = M(0x4e4f55, { rough: 1 });
  const spots = [[-8, -3], [-7.2, -3.8], [-8.8, -4.2], [-7.6, -2.2], [-9.3, -2.8], [-6.8, -4.6], [-9.6, -3.9], [-7.9, -5.1]];
  spots.forEach(([x, z], i) => {
    const h = 0.7 + rnd() * 0.5;
    const st = box(0.5, h, 0.16, graveM, x, h / 2, z, gv, (rnd() - 0.5) * 0.9);
    st.rotation.z = (rnd() - 0.5) * 0.22;
    box(0.56, 0.12, 0.2, graveM, x, h + 0.02, z, gv, st.rotation.y).rotation.z = st.rotation.z;
    if (i % 3 === 0) box(0.9, 0.14, 0.5, graveM, x + 0.3, 0.07, z + 0.4, gv, rnd()); // 倒塌的碑
  });

  // 枯树
  const dt = P('deadtree', gGround);
  const barkM = M(0x2e2620, { rough: 1 });
  function deadTree(x, z, s) {
    const g = new THREE.Group(); g.position.set(x, 0, z); dt.add(g);
    cyl(0.13 * s, 0.24 * s, 2.4 * s, barkM, 0, 1.2 * s, 0, g);
    for (let i = 0; i < 5; i++) {
      const br = cyl(0.03 * s, 0.06 * s, (1.0 + rnd() * 0.7) * s, barkM, 0, 0, 0, g, 7);
      const a = rnd() * Math.PI * 2, tilt = 0.5 + rnd() * 0.6;
      br.position.set(Math.cos(a) * 0.35 * s, (1.9 + rnd() * 0.5) * s, Math.sin(a) * 0.35 * s);
      br.rotation.set(Math.sin(a) * tilt, 0, Math.cos(a) * tilt);
      const tw = cyl(0.015 * s, 0.03 * s, 0.7 * s, barkM, 0, 0, 0, g, 6);
      tw.position.set(Math.cos(a) * 0.75 * s, (2.3 + rnd() * 0.4) * s, Math.sin(a) * 0.75 * s);
      tw.rotation.set(Math.sin(a) * (tilt + 0.5), 0, Math.cos(a) * (tilt + 0.5));
    }
  }
  deadTree(-6, 5, 1.1); deadTree(11.5, 2.5, 1.35); deadTree(-10.5, 1.5, 0.9);
})();

/* ============ 主厅建筑 ============ */
(function buildHall() {
  const stoneM = extM(0xffffff, { map: stoneTex, rough: 1 });
  const stoneDark = M(0x8f9096, { map: stoneTex, rough: 1 });
  const woodM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });

  // 高台地基 + 地面
  box(2 * HX + 0.8, HF, 2 * HZ + 0.8, stoneDark, 0, HF / 2, 0, gHall);
  box(2 * HX - 0.4, 0.06, 2 * HZ - 0.4, stoneM, 0, HF + 0.0, 0, gHall);

  // 外墙（南/东分组用于主厅剖面）
  const ch = P('church', gHall);
  const hs = new THREE.Group(), hn = new THREE.Group(), hw = new THREE.Group(), he = new THREE.Group();
  ch.add(hs, hn, hw, he);
  const y0 = HF;
  wallSeg(-HX, HZ, -1.1, HZ, y0, WH, T, stoneM, hs);   // 南墙左
  wallSeg(1.1, HZ, HX, HZ, y0, WH, T, stoneM, hs);     // 南墙右
  box(2.2, WH - 2.6, T, stoneM, 0, y0 + 2.6 + (WH - 2.6) / 2, HZ, hs); // 门楣上
  wallSeg(-HX, -HZ, HX, -HZ, y0, WH, T, stoneM, hn);   // 北墙
  wallSeg(-HX, -HZ, -HX, HZ, y0, WH, T, stoneM, hw);   // 西墙
  wallSeg(HX, -HZ, HX, HZ, y0, WH, T, stoneM, he);     // 东墙
  cutWalls.hs = hs; cutWalls.he = he;
  // 木门（随南墙隐藏）
  box(0.55, 2.6, 0.12, woodM, -0.29, y0 + 1.3, HZ, hs);
  box(0.55, 2.6, 0.12, woodM, 0.29, y0 + 1.3, HZ, hs);
  const arch = mesh(new THREE.TorusGeometry(1.15, 0.15, 8, 14, Math.PI), stoneDark, 0, y0 + 2.6, HZ + 0.1, hs);
  arch.castShadow = false;
  // 拱窗
  function archedWin(x, z, ry, parent) {
    const g = new THREE.Group(); g.position.set(x, y0 + 2.3, z); g.rotation.y = ry; parent.add(g);
    box(1.0, 1.7, 0.14, stoneDark, 0, 0, 0, g);
    const rec = box(0.72, 1.42, 0.06, M(0x0c0e13, { rough: 1 }), 0, 0, 0.05, g);
    rec.castShadow = false;
    const arc = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 12, 1, false, 0, Math.PI), M(0x0c0e13, { rough: 1 }), 0, 0.71, 0.05, g);
    arc.rotation.x = Math.PI / 2; arc.castShadow = false;
    box(1.14, 0.14, 0.3, stoneDark, 0, -0.92, 0.06, g); // 窗台
  }
  archedWin(-2.6, HZ + 0.16, 0, hs); archedWin(2.6, HZ + 0.16, 0, hs);
  archedWin(HX + 0.16, -1.5, Math.PI / 2, he); archedWin(HX + 0.16, 1.5, Math.PI / 2, he);
  archedWin(-HX - 0.16, -1.5, -Math.PI / 2, hw); archedWin(-HX - 0.16, 1.5, -Math.PI / 2, hw);
  archedWin(-2.5, -HZ - 0.16, Math.PI, hn); archedWin(2.5, -HZ - 0.16, Math.PI, hn);
  // 残破的墙顶
  for (let i = 0; i < 9; i++) {
    const bx = -HX + 0.6 + i * 1.1;
    box(0.55, 0.25 + rnd() * 0.55, T + 0.06, stoneDark, bx, y0 + WH + 0.1, HZ, hs);
    box(0.55, 0.2 + rnd() * 0.5, T + 0.06, stoneDark, bx, y0 + WH + 0.08, -HZ, hn);
  }
  for (let i = 0; i < 7; i++) {
    const bz = -HZ + 0.7 + i * 1.05;
    box(T + 0.06, 0.2 + rnd() * 0.5, 0.55, stoneDark, -HX, y0 + WH + 0.08, bz, hw);
    box(T + 0.06, 0.25 + rnd() * 0.55, 0.55, stoneDark, HX, y0 + WH + 0.1, bz, he);
  }

  // 石柱：两根完整，两根折断
  const colM = M(0x9a9ba1, { map: stoneTex, rough: 1 });
  cyl(0.32, 0.4, WH, colM, -2.6, y0 + WH / 2, -1.2, ch);
  cyl(0.32, 0.4, WH, colM, 2.6, y0 + WH / 2, -1.2, ch);
  box(1.0, 0.25, 1.0, colM, -2.6, y0 + WH - 0.1, -1.2, ch);
  box(1.0, 0.25, 1.0, colM, 2.6, y0 + WH - 0.1, -1.2, ch);
  cyl(0.32, 0.4, 1.3, colM, -2.6, y0 + 0.65, 1.8, ch);
  cyl(0.32, 0.4, 1.0, colM, 2.6, y0 + 0.5, 1.8, ch);
  const fallen = cyl(0.3, 0.3, 2.6, colM, 1.4, y0 + 0.32, 2.6, ch, 12);
  fallen.rotation.z = Math.PI / 2; fallen.rotation.y = 0.4;
  // 碎石
  for (let i = 0; i < 7; i++)
    box(0.3 + rnd() * 0.5, 0.2 + rnd() * 0.3, 0.3 + rnd() * 0.4, stoneDark,
      -4 + rnd() * 8, y0 + 0.12, -3 + rnd() * 6, ch, rnd() * 3);

  // 石阶入口
  const st = P('steps', gHall);
  for (let i = 0; i < 6; i++)
    box(3.4, 0.17, 0.62, stoneDark, 0, 0.82 - i * 0.138, 4.7 + i * 0.55, st);
  box(0.5, 1.1, 0.5, stoneDark, -2.0, 0.5, 5.4, st);   // 阶旁石墩
  box(0.5, 1.1, 0.5, stoneDark, 2.0, 0.5, 5.4, st);
  sph(0.32, stoneDark, -2.0, 1.2, 5.4, st);
  sph(0.32, stoneDark, 2.0, 1.2, 5.4, st);
})();

/* ============ 主厅内部 ============ */
(function buildHallInterior() {
  const y0 = HF;
  const stoneDark = M(0x6a6b72, { map: stoneTex, rough: 1 });
  const throneM = M(0x5a5b62, { map: stoneTex, rough: 1 });
  const woodM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  const ironM = M(0x3a3f46, { metal: 0.8, rough: 0.45 });

  // ---- 王座高台 ----
  const th = P('thrones', gHall);
  const dais = cyl(2.0, 2.1, 0.55, stoneDark, 0, y0 + 0.275, -2.2, th, 24);
  // 半圆高台：用 theta 裁掉前半（重建为半圆柱）
  th.remove(dais);
  const halfDais = mesh(new THREE.CylinderGeometry(2.0, 2.1, 0.55, 24, 1, false, Math.PI / 2, Math.PI), stoneDark, 0, y0 + 0.275, -2.2, th);
  function bigThrone(x, z) {
    const g = new THREE.Group(); g.position.set(x, y0 + 0.55, z); th.add(g);
    box(1.15, 0.5, 0.95, throneM, 0, 0.25, 0, g);
    box(0.95, 0.22, 0.75, throneM, 0, 0.6, 0.05, g);
    box(1.1, 1.9, 0.28, throneM, 0, 1.45, -0.36, g);
    const pyr = mesh(new THREE.ConeGeometry(0.5, 0.5, 4), throneM, 0, 2.65, -0.36, g);
    pyr.rotation.y = Math.PI / 4;
    box(0.18, 0.55, 0.72, throneM, -0.62, 0.75, 0.02, g);
    box(0.18, 0.55, 0.72, throneM, 0.62, 0.75, 0.02, g);
  }
  bigThrone(-1.5, -3.35); bigThrone(-0.5, -3.45); bigThrone(0.5, -3.45); bigThrone(1.5, -3.35);

  // ---- 鲁道斯的小王座 ----
  const lu = P('ludleth', gHall);
  (function smallThrone() {
    const g = new THREE.Group(); g.position.set(2.55, y0, -2.55); g.rotation.y = -0.35; lu.add(g);
    box(0.7, 0.35, 0.6, throneM, 0, 0.18, 0, g);
    box(0.6, 0.16, 0.5, throneM, 0, 0.42, 0.03, g);
    box(0.68, 1.15, 0.2, throneM, 0, 0.95, -0.22, g);
    const pyr = mesh(new THREE.ConeGeometry(0.32, 0.32, 4), throneM, 0, 1.68, -0.22, g);
    pyr.rotation.y = Math.PI / 4;
  })();

  // ---- 中央篝火 ----
  const bf = P('bonfire', gHall);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2;
    box(0.28, 0.2, 0.24, stoneDark, Math.cos(a) * 0.78, y0 + 0.1, 0.8 + Math.sin(a) * 0.78, bf, a);
  }
  sph(0.58, M(0x77716a, { rough: 1 }), 0, y0 + 0.06, 0.8, bf, 1, 0.32, 1);
  // 螺旋剑
  const sword = new THREE.Group(); sword.position.set(0, y0 + 0.1, 0.8); sword.rotation.z = -0.24; bf.add(sword);
  box(0.1, 1.15, 0.025, ironM, 0, 0.62, 0, sword);
  box(0.52, 0.07, 0.09, M(0x6a5a3a, { metal: 0.6, rough: 0.5 }), 0, 1.2, 0, sword);
  cyl(0.035, 0.035, 0.3, woodM, 0, 1.38, 0, sword);
  sph(0.055, ironM, 0, 1.55, 0, sword);
  // 火焰
  const flameO = mesh(new THREE.ConeGeometry(0.38, 1.05, 12), M(0xff7a1e, { emissive: 0xff5a00, ei: 2.2, transparent: true, opacity: 0.88 }), 0, y0 + 0.85, 0.8, bf);
  const flameI = mesh(new THREE.ConeGeometry(0.2, 0.68, 10), M(0xffd97a, { emissive: 0xffc93c, ei: 2.6, transparent: true, opacity: 0.95 }), 0, y0 + 0.8, 0.8, bf);
  flameO.castShadow = flameI.castShadow = false;
  FX.flameO = flameO; FX.flameI = flameI;
  FX.fireLight = new THREE.PointLight(0xff8c2e, 2.6, 26, 2);
  FX.fireLight.position.set(0, y0 + 1.8, 0.8);
  scene.add(FX.fireLight);
  // 余烬粒子
  const emberM = M(0xff9a3c, { emissive: 0xff7a1e, ei: 2.5 });
  for (let i = 0; i < 22; i++) {
    const e = sph(0.02 + rnd() * 0.03, emberM, (rnd() - 0.5) * 1.2, y0 + 0.6 + rnd() * 2, 0.8 + (rnd() - 0.5) * 1.2, bf);
    e.castShadow = false;
    FX.embers.push({ m: e, ph: rnd() * 6.28, sp: 0.5 + rnd() * 0.8, x0: e.position.x, z0: e.position.z });
  }

  // ---- 铁匠安德烈 ----
  const an = P('andre', gHall);
  cyl(0.32, 0.4, 0.55, woodM, 3.6, y0 + 0.28, -1.2, an);
  box(0.78, 0.26, 0.32, ironM, 3.6, y0 + 0.68, -1.2, an);
  const horn = cyl(0.02, 0.11, 0.42, ironM, 4.05, y0 + 0.68, -1.2, an, 10);
  horn.rotation.z = Math.PI / 2;
  // 锻炉
  box(0.3, 1.3, 1.15, stoneDark, 4.45, y0 + 0.65, -2.7, an);
  box(1.5, 0.32, 1.15, stoneDark, 3.85, y0 + 1.42, -2.7, an);
  box(1.5, 1.3, 0.28, stoneDark, 3.85, y0 + 0.65, -3.28, an);
  const forgeGlow = box(0.08, 0.7, 0.72, M(0xff8c2e, { emissive: 0xff6a00, ei: 2.4 }), 3.72, y0 + 0.55, -2.7, an);
  forgeGlow.castShadow = false;
  FX.forgeLight = new THREE.PointLight(0xff7a1e, 1.5, 8, 2);
  FX.forgeLight.position.set(3.5, y0 + 0.9, -2.7);
  scene.add(FX.forgeLight);
  // 磨刀石
  box(0.12, 0.6, 0.5, woodM, 2.75, y0 + 0.3, -0.5, an);
  box(0.12, 0.6, 0.5, woodM, 3.25, y0 + 0.3, -0.5, an);
  const wheel = cyl(0.5, 0.5, 0.14, M(0x8a8b90, { rough: 0.9 }), 3.0, y0 + 0.62, -0.5, an, 18);
  wheel.rotation.z = Math.PI / 2;

  // ---- 祭祀场侍女 ----
  const hm = P('handmaid', gHall);
  box(0.6, 0.09, 0.55, woodM, -3.8, y0 + 0.55, 0.5, hm);
  box(0.6, 0.75, 0.09, woodM, -3.8, y0 + 0.95, 0.22, hm);
  for (const sx of [-0.24, 0.24]) for (const sz of [-0.2, 0.2])
    box(0.08, 0.55, 0.08, woodM, -3.8 + sx, y0 + 0.28, 0.5 + sz, hm);
  cyl(0.38, 0.38, 0.07, woodM, -2.9, y0 + 0.62, 0.9, hm, 16);
  cyl(0.06, 0.08, 0.6, woodM, -2.9, y0 + 0.3, 0.9, hm);
  cyl(0.03, 0.05, 1.3, ironM, -3.1, y0 + 0.65, 1.5, hm);
  box(0.4, 0.05, 0.05, ironM, -3.1, y0 + 1.28, 1.5, hm);
  for (const cx of [-3.24, -3.1, -2.96]) {
    cyl(0.035, 0.035, 0.2, M(0xe8e0cc, { rough: 0.8 }), cx, y0 + 1.38, 1.5, hm, 8);
    const fl = sph(0.028, M(0xffc93c, { emissive: 0xff9a00, ei: 2.5 }), cx, y0 + 1.52, 1.5, hm, 1, 1.4, 1);
    fl.castShadow = false;
  }

  // ---- 火盆 ----
  const bz = P('brazier', gHall);
  [[-3, -3], [3, 2.6]].forEach(([x, z]) => {
    cyl(0.06, 0.1, 0.95, ironM, x, y0 + 0.48, z, bz);
    cyl(0.38, 0.22, 0.3, ironM, x, y0 + 1.05, z, bz, 12);
    sph(0.2, M(0x903a10, { emissive: 0xcc4400, ei: 1.6 }), x, y0 + 1.14, z, bz, 1, 0.4, 1).castShadow = false;
    const f = mesh(new THREE.ConeGeometry(0.15, 0.5, 8), M(0xff8c2e, { emissive: 0xff6a00, ei: 2.2, transparent: true, opacity: 0.9 }), x, y0 + 1.4, z, bz);
    f.castShadow = false;
  });

  // ---- 残破的旗帜 ----
  const banM = M(0x5e1420, { rough: 1, side: THREE.DoubleSide });
  const b1 = mesh(new THREE.PlaneGeometry(1.3, 2.4), banM, -3, y0 + 2.7, -3.78, th);
  const b2 = mesh(new THREE.PlaneGeometry(1.3, 2.4), banM, 3, y0 + 2.7, -3.78, th);
  b1.castShadow = b2.castShadow = false;
})();

/* ============ 破损屋顶 ============ */
(function buildRoof() {
  const r = P('roof', gRoof);
  const slateM = M(0x3f4249, { rough: 1 });
  const beamM = M(0xffffff, { map: darkWoodTex, rough: 0.95 });
  const slopeLen = Math.hypot(HZ + 0.9, RIDGE - EAVE);
  const ang = Math.atan2(RIDGE - EAVE, HZ + 0.9);
  // 北坡完整
  const n = box(2 * HX + 1.8, 0.16, slopeLen, slateM, 0, (EAVE + RIDGE) / 2, -(HZ / 2 + 0.45), r);
  n.rotation.x = -ang;
  // 南坡坍塌：只剩左右两块
  const s1 = box(5.1, 0.16, slopeLen, slateM, -3.35, (EAVE + RIDGE) / 2, (HZ / 2 + 0.45), r);
  s1.rotation.x = ang;
  const s2 = box(3.7, 0.16, slopeLen, slateM, 4.05, (EAVE + RIDGE) / 2 - 0.15, (HZ / 2 + 0.45), r);
  s2.rotation.x = ang + 0.12;
  // 屋脊梁
  box(2 * HX + 1.9, 0.2, 0.32, beamM, 0, RIDGE + 0.02, 0, r);
  // 裸露的椽木（坍塌处）
  for (let i = 0; i < 5; i++) {
    const rf = box(0.15, 0.15, 5.8, beamM, -0.4 + i * 0.62, (EAVE + RIDGE) / 2 - 0.1, 1.1, r);
    rf.rotation.x = ang * 0.92;
  }
  // 掉落在主厅的屋顶碎块
  const ch1 = box(1.4, 0.14, 1.1, slateM, 0.6, HF + 0.2, 1.6, r); ch1.rotation.set(0.2, 0.5, 0.12);
  const ch2 = box(1.0, 0.14, 0.9, slateM, -0.9, HF + 0.14, 2.2, r); ch2.rotation.set(-0.15, 1.1, 0.2);
})();

/* ============ 钟塔 ============ */
(function buildTower() {
  const stoneM = extM(0xffffff, { map: stoneTex, rough: 1 });
  const stoneDark = M(0x8f9096, { map: stoneTex, rough: 1 });
  const woodM = M(0xffffff, { map: darkWoodTex, rough: 0.9 });
  const X0 = TX - 1.7, X1 = TX + 1.7, Z0 = TZ - 1.7, Z1 = TZ + 1.7;
  const t = P('tower', gTower);
  const ts = new THREE.Group(), tn = new THREE.Group(), tw = new THREE.Group(), te = new THREE.Group();
  t.add(ts, tn, tw, te);
  const BELF = 8.5; // 钟楼层起始高度
  // 四面墙（到钟楼层）
  wallSeg(X0, Z1, X1, Z1, 0, BELF, 0.35, stoneM, ts);   // 南
  wallSeg(X0, Z0, X1, Z0, 0, BELF, 0.35, stoneM, tn);   // 北
  wallSeg(X0, Z0, X0, -4.7, 0, BELF, 0.35, stoneM, tw); // 西（门洞两侧）
  wallSeg(X0, -3.3, X0, Z1, 0, BELF, 0.35, stoneM, tw);
  box(0.35, BELF - 2.6, 1.4, stoneM, X0, 2.6 + (BELF - 2.6) / 2, -4, tw); // 门楣上
  wallSeg(X1, Z0, X1, Z1, 0, BELF, 0.35, stoneM, te);   // 东
  cutWalls.ts = ts;
  // 四角墩柱（钟楼层以上）
  for (const [px, pz] of [[X0, Z0], [X0, Z1], [X1, Z0], [X1, Z1]])
    box(0.5, TH - BELF, 0.5, stoneDark, px, BELF + (TH - BELF) / 2, pz, t);
  // 钟楼层横梁
  box(3.4, 0.3, 0.3, stoneDark, TX, BELF + 0.1, Z1, t);
  box(3.4, 0.3, 0.3, stoneDark, TX, BELF + 0.1, Z0, t);
  // 塔顶（可隐藏）
  const tr = new THREE.Group(); t.add(tr);
  const pyr = mesh(new THREE.ConeGeometry(2.75, 2.1, 4), M(0x35373d, { rough: 1 }), TX, TH + 1.05, TZ, tr);
  pyr.rotation.y = Math.PI / 4;
  box(0.5, 0.5, 0.5, stoneDark, TX, TH + 2.2, TZ, tr);
  cutWalls.tr = tr;

  // 盘旋木梯
  cyl(0.18, 0.24, BELF, woodM, TX, BELF / 2, TZ, t, 10);
  for (let i = 0; i < 15; i++) {
    const a = i * 0.55, y = 0.7 + i * 0.5;
    box(0.95, 0.1, 0.42, woodM, TX + Math.cos(a) * 0.8, y, TZ + Math.sin(a) * 0.8, t, -a + Math.PI / 2);
  }

  // 大钟
  const b = P('bell', gTower);
  const bronzeM = M(0x8a6a3a, { metal: 0.85, rough: 0.45 });
  box(1.3, 0.2, 0.28, woodM, TX, 10.35, TZ, b);
  cyl(0.3, 0.58, 0.95, bronzeM, TX, 9.75, TZ, b, 16);
  const rim = mesh(new THREE.TorusGeometry(0.55, 0.09, 8, 16), bronzeM, TX, 9.3, TZ, b);
  rim.rotation.x = Math.PI / 2;
  sph(0.13, ironDark(), TX, 9.15, TZ, b);
  function ironDark() { return M(0x2c2f34, { metal: 0.7, rough: 0.5 }); }

  // 乌鸦巢（南侧平台）
  const ns = P('nest', gTower);
  box(1.9, 0.24, 1.5, stoneDark, TX, BELF + 0.05, Z1 + 0.65, ns);
  const nestM = M(0x4a3520, { rough: 1 });
  const ring = mesh(new THREE.TorusGeometry(0.55, 0.2, 8, 14), nestM, TX, BELF + 0.42, Z1 + 0.65, ns);
  ring.rotation.x = Math.PI / 2;
  for (let i = 0; i < 7; i++) {
    const stk = cyl(0.03, 0.03, 0.9, nestM, TX, BELF + 0.45, Z1 + 0.65, ns, 6);
    stk.rotation.set(rnd() * 1.2 - 0.6, rnd() * 3, Math.PI / 2 + (rnd() - 0.5) * 0.8);
  }
  const shiny = sph(0.1, M(0x9fc4ff, { emissive: 0x4a7acc, ei: 1.2 }), TX + 0.15, BELF + 0.5, Z1 + 0.6, ns, 1, 0.7, 1);
  shiny.castShadow = false;
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
for (const ck of ['out', 'hall', 'tower', 'yard']) {
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
  gRoof.visible = (m === 'exterior' || m === 'tower') && !xray;
  // 主厅视角：隐藏南+东墙，做娃娃屋剖面
  const cutH = (m === 'hall');
  cutWalls.hs.visible = !cutH; cutWalls.he.visible = !cutH;
  // 钟塔视角：隐藏塔身南侧+塔顶，看内部楼梯与大钟
  const cutT = (m === 'tower');
  cutWalls.ts.visible = !cutT; cutWalls.tr.visible = !cutT;
  extMats.forEach(mt => { mt.transparent = xray; mt.opacity = xray ? 0.14 : 1; mt.depthWrite = !xray; mt.needsUpdate = true; });
  if (m === 'exterior') flyTo(V(14, 9, 17), V(2, 2.5, -1));
  if (m === 'hall') flyTo(V(8.5, 7.5, 12.5), V(0, 1.8, -1));
  if (m === 'tower') flyTo(V(15, 8.5, 3.5), V(8.5, 5, -4));
  if (m === 'xray') flyTo(V(14, 10, 16), V(2, 3, -1));
}
document.querySelectorAll('.vbtn').forEach(b => b.onclick = () => setMode(b.dataset.view));

// 开关
const tLabels = document.getElementById('tLabels');
tLabels.onclick = () => { labelsOn = !labelsOn; tLabels.classList.toggle('on', labelsOn); };
const tRotate = document.getElementById('tRotate');
tRotate.onclick = () => { controls.autoRotate = !controls.autoRotate; tRotate.classList.toggle('on', controls.autoRotate); };
document.getElementById('explode').addEventListener('input', e => {
  const t = e.target.value / 100;
  gRoof.position.y = 5 * t;
  gTower.position.x = 4.5 * t;
});
document.getElementById('menuBtn').onclick = () => { panel.classList.toggle('hide'); setTimeout(onResize, 260); };
document.getElementById('infoX').onclick = () => infoEl.classList.remove('show');

// 选择部件
function ensureVisible(p) {
  const L = p.layer;
  if (L === 'roof') { if (cur !== 'exterior') setMode('exterior'); return; }
  if (L === 'ground') return;
  if (p.xray) {
    if (cur === 'exterior') setMode('xray');
    else if (cur === 'hall' && L === 'tower') setMode('xray');
    else if (cur === 'tower' && L === 'hall') setMode('xray');
  }
}
function clearHl() {
  if (hlBox) { scene.remove(hlBox); hlBox.geometry.dispose(); hlBox.material.dispose(); hlBox = null; }
}
const LAYER_SUB = { roof: ' · 屋顶', hall: ' · 主厅', tower: ' · 钟塔', ground: ' · 室外' };
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
    const showXray = cur === 'xray' || (cur === 'hall' && p.layer === 'hall') || (cur === 'tower' && p.layer === 'tower');
    if (!labelsOn || !isShown(p.group) || (p.xray && !showXray)) { el.style.display = 'none'; continue; }
    pv.copy(v).applyMatrix4(p.group.matrixWorld).project(camera);
    if (pv.z > 1 || pv.z < -1) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    el.style.left = ((pv.x * 0.5 + 0.5) * viewW) + 'px';
    el.style.top = ((-pv.y * 0.5 + 0.5) * viewH) + 'px';
  }
}

// 自适应
function onResize() {
  viewW = view.clientWidth; viewH = view.clientHeight;
  renderer.setSize(viewW, viewH, false);
  camera.aspect = viewW / viewH;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

// 主循环：相机动画 + 篝火闪烁 + 余烬上升
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
  if (FX.fireLight) FX.fireLight.intensity = 2.6 + Math.sin(t * 11) * 0.4 + Math.sin(t * 23 + 1.7) * 0.25;
  if (FX.forgeLight) FX.forgeLight.intensity = 1.5 + Math.sin(t * 9 + 0.5) * 0.3;
  if (FX.flameO) { const s = 1 + Math.sin(t * 13) * 0.07; FX.flameO.scale.set(s, 1 + Math.sin(t * 17) * 0.1, s); }
  for (const e of FX.embers) {
    const prog = (t * e.sp + e.ph) % 2.2;
    e.m.position.y = HF + 0.7 + prog * 1.1;
    e.m.position.x = e.x0 + Math.sin(t * 2 + e.ph) * 0.15;
    e.m.position.z = e.z0 + Math.cos(t * 1.7 + e.ph) * 0.15;
    const sc = 1 - prog / 2.2 * 0.7;
    e.m.scale.set(sc, sc, sc);
  }
  if (selected && hlBox && PARTS[selected].group) tmpBox.setFromObject(PARTS[selected].group);
  refreshLabels();
  renderer.render(scene, camera);
}

onResize();
setMode('exterior');
animate();
document.getElementById('loading').style.display = 'none';
