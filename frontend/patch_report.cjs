const fs = require('fs');

let reportCode = fs.readFileSync('frontend/src/pages/Report.tsx', 'utf8');

if (!reportCode.includes('setMatches')) {
  reportCode = reportCode.replace(
    /const \[isSuccess, setSuccess\] = useState\(false\);/,
    "const [isSuccess, setSuccess] = useState(false);\n  const [matches, setMatches] = useState<string[]>([]);"
  );
  
  reportCode = reportCode.replace(
    /setSuccess\(true\);\n\s*setTimeout\(\(\) => \{\n\s*navigate\('\/items'\);\n\s*\}, 1800\);/,
    `setSuccess(true);
        if (data.matches && data.matches.length > 0) {
          setMatches(data.matches);
          // If there are matches, don't auto-redirect, let the user review them.
        } else {
          setTimeout(() => {
            navigate('/items');
          }, 2000);
        }`
  );
  
  const successUI = `
      <motion.div 
        key="success-state"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-success" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text">Report Submitted!</h2>
        <p className="text-textSecondary mb-6">Your item has been successfully posted to the directory.</p>
        
        {matches.length > 0 ? (
          <div className="w-full max-w-md bg-warning/10 border border-warning/30 rounded-xl p-6 text-left">
            <h3 className="font-bold text-warning flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5"/> Possible Matches Found!</h3>
            <p className="text-sm text-textSecondary mb-4">We found {matches.length} item(s) in the system that might match your report.</p>
            <div className="space-y-3">
              {matches.map(matchId => (
                <button
                  key={matchId}
                  onClick={() => navigate(\`/item/\${matchId}\`)}
                  className="w-full px-4 py-2 bg-surface hover:bg-white/50 border border-border/30 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center"
                >
                  View Match 
                  <span className="text-primary">&rarr;</span>
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/items')} className="mt-4 text-sm text-textSecondary hover:text-text underline w-full text-center">Or continue to browse</button>
          </div>
        ) : (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mt-4" />
        )}
      </motion.div>
  `;

  reportCode = reportCode.replace(
    /<motion\.div \n\s*key="success-state"[\s\S]*?<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mt-4" \/>\n\s*<\/motion\.div>/,
    successUI
  );

  fs.writeFileSync('frontend/src/pages/Report.tsx', reportCode);
  console.log('Successfully patched Report.tsx');
} else {
  console.log('Report.tsx already patched');
}
