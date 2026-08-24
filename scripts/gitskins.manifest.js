// scripts/gitskins.manifest.js
// Manifest tunggal seluruh aset GitSkins milik @vaxetherion.
// Dipakai bersama oleh scripts/download-assets.js dan tests/readme.spec.js
// agar sumber kebenaran (single source of truth) URL hanya ada di satu tempat.
//
// Format: { name, url } — url adalah URL lengkap API GitSkins.
// Name digunakan sebagai nama file lokal: assets/<name>.svg

export const GITSKINS_BASE_URL = 'https://www.gitskins.com';

export const GITSKINS_MANIFEST = [
  // ── Hero / Opening ──────────────────────────────────────────────────────
  {
    name: 'hero-neon',
    url: 'https://www.gitskins.com/api/readme-reference/hero?username=vaxetherion&theme=neon',
  },
  {
    name: 'hero-dark',
    url: 'https://www.gitskins.com/api/section/hero?username=vaxetherion&theme=neon&v=profile-preview-2&mode=dark',
  },
  // ── Character Calendar / Snake Animation ─────────────────────────────────
  {
    name: 'character-calendar',
    url: 'https://www.gitskins.com/api/readme-reference/character-calendar?username=vaxetherion&theme=github-dark&motion=snake&v=reference-snake-4',
  },
  // ── Dividers ─────────────────────────────────────────────────────────────
  {
    name: 'divider-neon',
    url: 'https://www.gitskins.com/api/readme-reference/divider?username=vaxetherion&theme=neon',
  },
  // ── Focus Banner ─────────────────────────────────────────────────────────
  {
    name: 'focus-neon',
    url: 'https://www.gitskins.com/api/readme-reference/focus?username=vaxetherion&theme=neon&location=&focus=BUILDING%20IN%20PUBLIC%7COPEN%20SOURCE%7CALWAYS%20LEARNING',
  },
  // ── Portrait ─────────────────────────────────────────────────────────────
  {
    name: 'portrait-aurora',
    url: 'https://www.gitskins.com/api/section/portrait?username=vaxetherion&theme=aurora',
  },
  {
    name: 'portrait-terminal',
    url: 'https://www.gitskins.com/api/section/portrait?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark',
  },
  // ── Wordmark ─────────────────────────────────────────────────────────────
  {
    name: 'wordmark-terminal',
    url: 'https://www.gitskins.com/api/section/wordmark?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark',
  },
  // ── About ────────────────────────────────────────────────────────────────
  {
    name: 'about-neon',
    url: 'https://www.gitskins.com/api/section/about?username=vaxetherion&theme=neon',
  },
  {
    name: 'about-terminal',
    url: 'https://www.gitskins.com/api/section/about?username=vaxetherion&theme=github-dark&style=terminal',
  },
  // ── Social ───────────────────────────────────────────────────────────────
  {
    name: 'social-neon',
    url: 'https://www.gitskins.com/api/section/social?username=vaxetherion&theme=neon',
  },
  // ── Tech Stack ───────────────────────────────────────────────────────────
  {
    name: 'stack-neon',
    url: 'https://www.gitskins.com/api/section/stack?username=vaxetherion&theme=neon',
  },
  {
    name: 'stack-terminal',
    url: 'https://www.gitskins.com/api/section/stack?username=vaxetherion&theme=github-dark&style=terminal',
  },
  // ── Stats ────────────────────────────────────────────────────────────────
  {
    name: 'stats-neon',
    url: 'https://www.gitskins.com/api/section/stats?username=vaxetherion&theme=neon&style=terminal',
  },
  {
    name: 'stats-terminal',
    url: 'https://www.gitskins.com/api/section/stats?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark',
  },
  // ── Heatmap ──────────────────────────────────────────────────────────────
  {
    name: 'heatmap-aurora',
    url: 'https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=aurora&v=profile-preview-2&style=terminal&mode=dark',
  },
  {
    name: 'heatmap-dark',
    url: 'https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark',
  },
  {
    name: 'heatmap-neon',
    url: 'https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=neon',
  },
  {
    name: 'heatmap-terminal',
    url: 'https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=github-dark&style=terminal',
  },
  // ── Activity Graph ───────────────────────────────────────────────────────
  {
    name: 'activity-graph',
    url: 'https://www.gitskins.com/api/readme-reference/activity-graph?username=vaxetherion&theme=github-dark',
  },
  // ── Projects ─────────────────────────────────────────────────────────────
  {
    name: 'projects-terminal',
    url: 'https://www.gitskins.com/api/section/projects?username=vaxetherion&theme=github-dark&style=terminal',
  },
  {
    name: 'projects-neon',
    url: 'https://www.gitskins.com/api/section/projects?username=vaxetherion&theme=neon',
  },
  // ── Competitive ──────────────────────────────────────────────────────────
  {
    name: 'competitive',
    url: 'https://www.gitskins.com/api/readme-reference/competitive?username=vaxetherion&theme=github-dark&v=competitive-layout-2',
  },
  // ── Technology Stack (Full Stack Logos) ──────────────────────────────────
  {
    name: 'tech-stack-full',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=React.js%2CNext.js%2CVue.js%2CNuxt.js%2CSvelte%2CSvelteKit%2CTailwindCSS%2CBootstrap%2CNode.js%2CExpress.js%2CNestJS%2CDjango%2CFastAPI%2CLaravel%2CSpringBoot%2C.NET',
  },
  {
    name: 'tech-stack-ai',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=PyTorch%2CTensorFlow%2CLangChain%2CLlamaIndex%2CThree.js%2CPixiJS%2CUnity%2CUnrealEngine%2CGodot%2CJest%2CVitest%2CCypress%2CPlaywright',
  },
  {
    name: 'tech-stack-devops',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=Docker%2CVercel%2CNetlify%2CLinux%2CZorinOS%2CUbuntu%2CAWS%2CGoogleCloud%2CTerraform%2COpenTofu%2CKubernetes%2CAnsible%2CChef%2CPuppet',
  },
  {
    name: 'tech-stack-db',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=MySQL%2CPostgreSQL%2CMongoDB%2CRedis%2CSQLite%2CPrisma%2CDrizzle',
  },
  {
    name: 'tech-stack-mobile',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=ReactNative%2CFlutter%2CElectron%2CTauri',
  },
  {
    name: 'tech-stack-langs',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=JavaScript%2CTypeScript%2CPython%2CJava%2CKotlin%2CSwift%2CGo%2CRust%2CC%2CC%2B%2B%2CRuby%2CScala%2CElixir',
  },
  {
    name: 'tech-stack-tools',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=Git%2CGitHub%2CGitLab%2CPrometheus%2CGrafana%2CGraphQL%2CgRPC%2CApacheKafka%2CRabbitMQ%2CApacheSpark',
  },
  {
    name: 'tech-stack-frontend',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=HTML%2CCSS%2CSass/SCSS%2CLess%2CPostCSS%2CVite%2CWebpack%2CTurbopack%2CRollup%2CQt%2CGTK',
  },
  {
    name: 'tech-stack-testing',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=Jest%2CVitest%2CCypress%2CPlaywright%2CBurpSuite%2CMetasploit',
  },
  {
    name: 'tech-stack-web',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=HTML%2CCSS%2CReact.js%2CNext.js%2CNode.js%2CExpress.js%2CMongoDB%2CRedis%2CDocker',
  },
  {
    name: 'tech-stack-misc',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=YAML%2CJSON%2CTOML%2CXML%2CProtobuf%2CLaTeX%2CMarkdown',
  },
  {
    name: 'tech-stack-cloud',
    url: 'https://www.gitskins.com/api/readme-reference/technology-stack?logos=AWS%2CGoogleCloud%2CKubernetes%2CDocker%2CTerraform%2CPrometheus%2CGrafana',
  },
];
