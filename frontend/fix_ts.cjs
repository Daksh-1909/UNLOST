const fs = require('fs');

// Navbar.tsx
let nav = fs.readFileSync('frontend/src/components/Navbar.tsx', 'utf8');
nav = nav.replace('useState([]);', 'useState<any[]>([]);');
nav = nav.replace('const markAsRead = async (id) =>', 'const markAsRead = async (id: string) =>');
fs.writeFileSync('frontend/src/components/Navbar.tsx', nav);

// AdminAnalytics.tsx
let admin = fs.readFileSync('frontend/src/pages/AdminAnalytics.tsx', 'utf8');
admin = admin.replace(', XCircle', '');
admin = admin.replace('entry, index', '_, index');
fs.writeFileSync('frontend/src/pages/AdminAnalytics.tsx', admin);

// ItemDetail.tsx
let item = fs.readFileSync('frontend/src/pages/ItemDetail.tsx', 'utf8');
item = item.replace(', Mail', '');
item = item.replace(', TRANSITION_BASE', '');
fs.writeFileSync('frontend/src/pages/ItemDetail.tsx', item);
console.log('Fixed TS');
