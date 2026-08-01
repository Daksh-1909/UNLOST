const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Items.tsx', 'utf8');

// Add useNavigate
if (!content.includes('useNavigate')) {
    content = content.replace(
        /import React, \{ useEffect, useState \} from 'react';/,
        "import React, { useEffect, useState } from 'react';\nimport { useNavigate } from 'react-router-dom';"
    );
}

// Add const navigate = useNavigate();
if (!content.includes('const navigate = useNavigate();')) {
    content = content.replace(
        /const Items: React.FC = \(\) => \{/,
        "const Items: React.FC = () => {\n  const navigate = useNavigate();"
    );
}

// Replace card onClick
content = content.replace(
    /onClick=\{\(\) => \{\s+if \(item\.status !== 'Claimed'\) \{\s+setClaimingItem\(item\);\s+\}\s+\}\}/g,
    "onClick={() => navigate(`/item/${(item as any)._id || item.id}`)}"
);

// Remove the claim modal completely.
// Let's find where AnimatePresence for the modal is. It's near the end.
const modalRegex = /\{\/\* Claim Modal \*\/\}\s*<AnimatePresence>[\s\S]*?<\/AnimatePresence>/g;
content = content.replace(modalRegex, '');

fs.writeFileSync('frontend/src/pages/Items.tsx', content);
console.log('Updated Items.tsx');
