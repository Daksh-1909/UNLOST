const fs = require('fs');
let css = fs.readFileSync('frontend/src/index.css', 'utf8');

const replacement = `/* Glassmorphism minimal utility classes */
.glass-panel {
  @apply bg-surface/40 border border-primary/10 backdrop-blur-md rounded-xl shadow-sm;
}

.glass-card {
  @apply bg-surface/50 border border-primary/10 rounded-xl backdrop-blur-md transition-all duration-200 ease-out;
}

.glass-card:hover {
  @apply scale-[1.01] border-primary/20 shadow-lg shadow-primary/10;
}

.glass-input {
  @apply bg-background/60 border border-primary/10 text-text rounded-xl px-4 py-3 transition-all duration-200 ease-out;
}
.glass-input:focus {
  @apply outline-none border-secondary bg-surface/80;
}
.glass-input::placeholder {
  @apply text-textSecondary/50;
}

/* Custom minimal buttons */
.btn-primary-custom {
  @apply bg-primary-gradient text-white rounded-xl transition-all duration-200 ease-out;
}
.btn-primary-custom:hover {
  @apply scale-[1.02] brightness-110;
}

.btn-secondary-custom {
  @apply bg-transparent border border-primary/20 text-primary rounded-xl transition-all duration-200 ease-out;
}
.btn-secondary-custom:hover {
  @apply bg-primary/5 border-primary/40;
}`;

css = css.replace(/\/\* Glassmorphism minimal utility classes \*\/[\s\S]*?\.btn-secondary-custom:hover\s*\{[\s\S]*?\}/, replacement);
fs.writeFileSync('frontend/src/index.css', css);
console.log('Fixed glass classes');
