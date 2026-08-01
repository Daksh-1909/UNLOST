const fs = require('fs');

// 1. Update tailwind.config.js
let tailwind = fs.readFileSync('frontend/tailwind.config.js', 'utf8');
tailwind = tailwind.replace(
  /'linear-gradient\(135deg, #5C321E, #926347, #C9A07A\)'/,
  "'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)), rgb(var(--color-accent)))'"
);
fs.writeFileSync('frontend/tailwind.config.js', tailwind);

// 2. Update index.css for pure black / neon dark mode
let css = fs.readFileSync('frontend/src/index.css', 'utf8');

const newDark = `.dark {
  --color-primary: 168 128 255; /* Light Purple / Violet */
  --color-secondary: 255 77 109; /* Red */
  --color-accent: 255 210 63; /* Yellow */
  --color-background: 0 0 0; /* Pure Black */
  --color-surface: 12 12 14; /* Very dark grey tint */
  --color-text: 245 245 250; /* Cool white */
  --color-text-secondary: 170 170 180; /* Cool grey */
  --color-text-muted: 110 110 120; /* Muted grey */
  --color-success: 80 180 120;
  --color-warning: 255 210 63;
  --color-danger: 255 77 109;
  --color-border: 35 35 45; /* Subtle border */
}`;

css = css.replace(/\.dark\s*\{[\s\S]*?\}/, newDark);
fs.writeFileSync('frontend/src/index.css', css);

console.log('Updated tailwind gradient and dark mode colors');
