const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Home.tsx', 'utf8');

// The Quick Actions section
content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 gap-4">/g,
  '<motion.div initial="hidden" whileInView="visible" viewport={scrollRevealViewport} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">'
);
content = content.replace(
  /<\/div>\s*\{\/\* Recently Reported Section \*\/\}/g,
  '</motion.div>\n\n  {/* Recently Reported Section */}'
);

// Section Headers
content = content.replace(
  /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">/g,
  '<motion.div initial="hidden" whileInView="visible" viewport={scrollRevealViewport} variants={scrollRevealVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">'
);
content = content.replace(
  /<\/div>\n\s*<div className="flex flex-col sm:flex-row gap-3/g,
  '</motion.div>\n          <div className="flex flex-col sm:flex-row gap-3'
);

// The Item Grid
content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">/g,
  '<motion.div initial="hidden" whileInView="visible" viewport={scrollRevealViewport} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">'
);
content = content.replace(
  /<\/div>\n\s*\{\/\* View All Button \*\/\}/g,
  '</motion.div>\n\n        {/* View All Button */}'
);

// Wrap the item card mapping
content = content.replace(
  /\{filteredItems.slice\(0, 8\).map\(\(item\) => \(\n\s*<div\n\s*key=\{item.id\}/g,
  '{filteredItems.slice(0, 8).map((item) => (\n            <motion.div\n              variants={staggerItem}\n              key={item.id}'
);

// Close motion.div for item card
content = content.replace(
  /<\/button>\n\s*<\/div>\n\s*\)\)}/g,
  '</button>\n            </motion.div>\n          ))}'
);

// Hero section buttons
content = content.replace(
  /<Link\n\s*to="\/report"\n\s*className="px-6 py-3.5 rounded-xl btn-primary-custom/g,
  '<motion.div whileHover="hover" whileTap="tap" variants={tapHoverVariants}><Link\n              to="/report"\n              className="px-6 py-3.5 rounded-xl btn-primary-custom'
);
content = content.replace(
  /<\/Link>\n\s*<Link\n\s*to="\/items"/g,
  '</Link></motion.div>\n            <motion.div whileHover="hover" whileTap="tap" variants={tapHoverVariants}><Link\n              to="/items"'
);
content = content.replace(
  /<\/span>\n\s*<\/Link>\n\s*<\/div>\n\s*<\/div>/g,
  '</span>\n            </Link></motion.div>\n          </div>\n        </div>'
);

fs.writeFileSync('frontend/src/pages/Home.tsx', content);
console.log('Successfully patched Home.tsx');
