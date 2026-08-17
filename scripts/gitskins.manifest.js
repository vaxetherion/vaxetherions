// scripts/gitskins.manifest.js
// Manifest tunggal seluruh aset GitSkins milik @vaxetherion.
// Dipakai bersama oleh scripts/download-assets.js dan tests/readme.spec.js
// agar sumber kebenaran (single source of truth) URL hanya ada di satu tempat.

export const GITSKINS_BASE_URL = 'https://www.gitskins.com';

export const GITSKINS_MANIFEST = [
  {
    name: 'portrait',
    url: 'https://www.gitskins.com/api/section/portrait?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark',
  },
  {
    name: 'wordmark',
    url: 'https://www.gitskins.com/api/section/wordmark?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark',
  },
  {
    name: 'hero-neon',
    url: 'https://www.gitskins.com/api/readme-reference/hero?username=vaxetherion&theme=neon',
  },
  {
    name: 'stack',
    url: 'https://www.gitskins.com/api/section/stack?username=vaxetherion&theme=github-dark&v=profile-preview-2&style=terminal&mode=dark',
  },
  {
    name: 'stats',
    url: 'https://www.gitskins.com/api/section/stats?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark',
  },
  {
    name: 'heatmap-aurora',
    url: 'https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=aurora&v=profile-preview-2&style=terminal&mode=dark',
  },
  {
    name: 'heatmap-dark',
    url: 'https://www.gitskins.com/api/section/heatmap?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark',
  },
  {
    name: 'projects',
    url: 'https://www.gitskins.com/api/section/projects?username=vaxetherion&theme=github-dark&v=profile-preview-2&mode=dark',
  },
  {
    name: 'competitive',
    url: 'https://www.gitskins.com/api/readme-reference/competitive?username=vaxetherion&theme=github-dark&v=competitive-layout-2',
  },
  {
    name: 'hero-dark',
    url: 'https://www.gitskins.com/api/section/hero?username=vaxetherion&theme=neon&v=profile-preview-2&mode=dark',
  },
];
