const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Navbar.tsx', 'utf8');
content = content.replace(
  '<div className="h-4 w-px bg-border/30 mx-2 hidden md:block"></div>\n',
  '<div className="h-4 w-px bg-border/30 mx-2 hidden md:block"></div>\n        </div>\n'
);
fs.writeFileSync('frontend/src/components/Navbar.tsx', content);
console.log('Fixed nav');
