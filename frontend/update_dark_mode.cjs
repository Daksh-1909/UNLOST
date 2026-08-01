const fs = require('fs');
let css = fs.readFileSync('frontend/src/index.css', 'utf8');

const newDark = `.dark {
  --color-primary: 180 130 90;
  --color-secondary: 140 100 70;
  --color-accent: 200 160 130;
  --color-background: 20 18 17;
  --color-surface: 30 28 26;
  --color-text: 210 205 200;
  --color-text-secondary: 150 145 140;
  --color-text-muted: 110 105 100;
  --color-success: 80 140 90;
  --color-warning: 190 140 40;
  --color-danger: 190 80 70;
  --color-border: 45 40 37;
}`;

css = css.replace(/\.dark\s*\{[\s\S]*?\}/, newDark);
fs.writeFileSync('frontend/src/index.css', css);
console.log('Updated index.css');
