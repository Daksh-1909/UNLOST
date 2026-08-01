const fs = require('fs');

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
}

let tailwind = fs.readFileSync('frontend/tailwind.config.js', 'utf8');
tailwind = tailwind.replace(/"var\(--color-([a-zA-Z-]+)\)"/g, '"rgb(var(--color-$1) / <alpha-value>)"');
fs.writeFileSync('frontend/tailwind.config.js', tailwind);

let indexCss = fs.readFileSync('frontend/src/index.css', 'utf8');
const hexRegex = /--color-[a-zA-Z-]+:\s*(#[0-9A-Fa-f]{6});/g;
indexCss = indexCss.replace(hexRegex, (match, hex) => {
    return match.replace(hex, hexToRgb(hex));
});
fs.writeFileSync('frontend/src/index.css', indexCss);
console.log('Fixed CSS variables!');
