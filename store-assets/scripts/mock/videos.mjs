// Original sample videos for the store screenshots. Titles, channels and
// thumbnails are all made up here, so no third-party content appears.
export const videos = [
  { id: "sdgh7Kp2xQa", title: "Sourdough from scratch: a slow weekend guide", channel: "Crumb & Co", views: "182K views", age: "3 days ago", len: "18:42", c1: "#f59e0b", c2: "#b45309", glyph: "bread" },
  { id: "rst90mnLrnB", title: "Learn Rust in 90 minutes, no prior systems experience", channel: "Ferris Lab", views: "1.2M views", age: "2 weeks ago", len: "1:31:07", c1: "#f97316", c2: "#7c2d12", glyph: "code" },
  { id: "wtrSky4BgnC", title: "Watercolor skies for absolute beginners", channel: "Paper Sky", views: "64K views", age: "5 days ago", len: "12:30", c1: "#38bdf8", c2: "#1e3a8a", glyph: "sky" },
  { id: "cabnBld0StD", title: "Building a tiny cabin, start to finish", channel: "Northwoods Build", views: "903K views", age: "1 month ago", len: "41:15", c1: "#4ade80", c2: "#14532d", glyph: "cabin" },
  { id: "brdgSpn11wE", title: "How bridges carry so much weight", channel: "Span Studio", views: "2.4M views", age: "8 months ago", len: "15:58", c1: "#94a3b8", c2: "#1e293b", glyph: "bridge" },
  { id: "mbltyAm10mF", title: "10-minute morning mobility routine", channel: "Move Daily", views: "311K views", age: "1 week ago", len: "10:04", c1: "#2dd4bf", c2: "#115e59", glyph: "sun" },
  { id: "typoDev22kG", title: "Typography basics every developer should know", channel: "Kerning Club", views: "88K views", age: "4 days ago", len: "22:16", c1: "#c084fc", c2: "#4c1d95", glyph: "type" },
  { id: "nghtPht0phH", title: "Night photography with just your phone", channel: "Low Light", views: "450K views", age: "3 weeks ago", len: "9:47", c1: "#818cf8", c2: "#0f172a", glyph: "moon" },
];

export const byId = Object.fromEntries(videos.map((v) => [v.id, v]));

const glyphs = {
  bread: `<ellipse cx="320" cy="200" rx="150" ry="95" fill="#fde68a"/><ellipse cx="320" cy="185" rx="150" ry="80" fill="#fcd34d"/><path d="M230 170q40-30 80 0M300 160q40-30 80 0M360 175q30-22 60 0" stroke="#b45309" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  code: `<rect x="170" y="90" width="300" height="180" rx="18" fill="#1c1917" opacity=".85"/><path d="M250 150l-40 30 40 30M390 150l40 30-40 30M340 135l-40 90" stroke="#fdba74" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  sky: `<circle cx="460" cy="110" r="46" fill="#fef9c3"/><path d="M80 260q120-80 240-20t240-20v140H80z" fill="#1e40af" opacity=".7"/><path d="M80 300q140-60 280-10t200-10v80H80z" fill="#172554"/>`,
  cabin: `<path d="M320 90l150 110H170z" fill="#7c2d12"/><rect x="200" y="195" width="240" height="120" fill="#a16207"/><rect x="295" y="235" width="50" height="80" fill="#422006"/><rect x="225" y="220" width="45" height="40" fill="#fef3c7"/>`,
  bridge: `<path d="M60 250h520" stroke="#e2e8f0" stroke-width="14"/><path d="M60 250q260-200 520 0" stroke="#e2e8f0" stroke-width="10" fill="none"/>${[140, 220, 300, 380, 460].map((x) => `<path d="M${x} 250V${250 - Math.round(150 * (1 - Math.pow((x - 320) / 260, 2)))}" stroke="#e2e8f0" stroke-width="5"/>`).join("")}`,
  sun: `<circle cx="320" cy="180" r="70" fill="#fef08a"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${320 + Math.cos(a) * 95} ${180 + Math.sin(a) * 95}L${320 + Math.cos(a) * 125} ${180 + Math.sin(a) * 125}" stroke="#fef08a" stroke-width="12" stroke-linecap="round"/>`; }).join("")}`,
  type: `<text x="320" y="245" text-anchor="middle" font-family="Georgia,serif" font-size="210" font-weight="700" fill="#f5f3ff">Aa</text>`,
  moon: `<circle cx="330" cy="170" r="80" fill="#e0e7ff"/><circle cx="365" cy="145" r="72" fill="#1e1b4b"/>${[[120, 80], [200, 140], [500, 90], [540, 220], [160, 260], [450, 290]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join("")}`,
};

export function thumbnailSvg(id) {
  const v = byId[id] ?? videos[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${v.c1}"/><stop offset="1" stop-color="${v.c2}"/></linearGradient></defs>
  <rect width="640" height="360" fill="url(#g)"/>${glyphs[v.glyph]}
</svg>`;
}
