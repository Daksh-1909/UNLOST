const fs = require('fs');

const files = [
  'frontend/src/pages/ItemDetail.tsx',
  'frontend/src/pages/AdminAnalytics.tsx',
  'frontend/src/components/Navbar.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace \` with `
    content = content.replace(/\\`/g, '`');
    // Replace \$ with $
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed backticks in files');
