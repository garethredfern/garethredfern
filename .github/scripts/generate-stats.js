const fs = require("fs");
const path = require("path");

const USERNAME = "garethredfern";

async function fetchGitHubStats() {
  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const fetchJSON = async (url) => {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    return res.json();
  };

  const user = await fetchJSON(`https://api.github.com/users/${USERNAME}`);

  let totalStars = 0;
  let totalForks = 0;
  let page = 1;

  while (true) {
    const repos = await fetchJSON(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}`
    );
    if (repos.length === 0) break;
    for (const repo of repos) {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
    }
    page++;
  }

  // Contribution count from the events API (last year approximation)
  // The search API gives a more accurate count
  const searchRes = await fetchJSON(
    `https://api.github.com/search/commits?q=author:${USERNAME}&per_page=1`
  );
  const totalCommits = searchRes.total_count || 0;

  return {
    stars: totalStars,
    commits: totalCommits,
    repos: user.public_repos,
    followers: user.followers,
    forks: totalForks,
  };
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function generateSVG(stats, theme) {
  const isDark = theme === "dark";
  const bg = isDark ? "#0d1117" : "#ffffff";
  const cardBorder = isDark ? "#30363d" : "#d1d9e0";
  const textPrimary = isDark ? "#e6edf3" : "#1f2328";
  const textSecondary = isDark ? "#8b949e" : "#656d76";
  const iconColor = isDark ? "#8b949e" : "#656d76";

  const items = [
    {
      label: "Total Stars",
      value: formatNumber(stats.stars),
      icon: `<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" fill="${iconColor}"/>`,
    },
    {
      label: "Total Commits",
      value: formatNumber(stats.commits),
      icon: `<path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.25a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" fill="${iconColor}"/>`,
    },
    {
      label: "Public Repos",
      value: formatNumber(stats.repos),
      icon: `<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" fill="${iconColor}"/>`,
    },
    {
      label: "Followers",
      value: formatNumber(stats.followers),
      icon: `<path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" fill="${iconColor}"/>`,
    },
    {
      label: "Total Forks",
      value: formatNumber(stats.forks),
      icon: `<path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878Zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm3-8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" fill="${iconColor}"/>`,
    },
  ];

  const cardWidth = 460;
  const cardHeight = 170;
  const colWidth = cardWidth / 5;

  const statElements = items
    .map((item, i) => {
      const cx = colWidth * i + colWidth / 2;
      return `
      <g transform="translate(${cx}, 85)">
        <svg x="-8" y="-30" width="16" height="16" viewBox="0 0 16 16">${item.icon}</svg>
        <text y="0" text-anchor="middle" fill="${textPrimary}" font-size="18" font-weight="700" font-family="'Fira Code', monospace">${item.value}</text>
        <text y="20" text-anchor="middle" fill="${textSecondary}" font-size="10" font-family="'Fira Code', monospace">${item.label}</text>
      </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#9945FF"/>
      <stop offset="100%" stop-color="#14F195"/>
    </linearGradient>
    <clipPath id="card-clip">
      <rect width="${cardWidth}" height="${cardHeight}" rx="12"/>
    </clipPath>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&amp;display=swap');
    </style>
  </defs>

  <g clip-path="url(#card-clip)">
    <!-- Background -->
    <rect width="${cardWidth}" height="${cardHeight}" fill="${bg}" rx="12"/>

    <!-- Border -->
    <rect x="0.5" y="0.5" width="${cardWidth - 1}" height="${cardHeight - 1}" rx="11.5" stroke="${cardBorder}" stroke-width="1" fill="none"/>

    <!-- Gradient accent bar -->
    <rect width="${cardWidth}" height="4" fill="url(#accent)"/>

    <!-- Title -->
    <text x="20" y="38" fill="${textPrimary}" font-size="14" font-weight="700" font-family="'Fira Code', monospace">garethredfern's GitHub Stats</text>

    <!-- Stats -->
    ${statElements}
  </g>
</svg>`;
}

async function main() {
  console.log("Fetching GitHub stats...");
  const stats = await fetchGitHubStats();
  console.log("Stats:", stats);

  const outDir = process.env.OUTPUT_DIR || "dist";
  fs.mkdirSync(outDir, { recursive: true });

  const darkSVG = generateSVG(stats, "dark");
  const lightSVG = generateSVG(stats, "light");

  fs.writeFileSync(path.join(outDir, "stats-dark.svg"), darkSVG);
  fs.writeFileSync(path.join(outDir, "stats-light.svg"), lightSVG);

  console.log(`SVGs written to ${outDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
