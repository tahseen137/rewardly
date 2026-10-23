/**
 * Quick verification script to check if key files have valid imports
 */

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/services/AuthService.ts',
  'src/services/SageService.ts',
  'src/screens/SageScreen.tsx',
  'src/screens/AuthScreen.tsx',
  'src/screens/OnboardingScreen.tsx',
  'src/navigation/AppNavigator.tsx',
  'src/components/Paywall.tsx',
];

console.log('🔍 Checking imports...\n');

let hasErrors = false;

for (const file of filesToCheck) {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${file} - FILE NOT FOUND`);
    hasErrors = true;
    continue;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Check for common import patterns
  const imports = content.match(/^import .+ from ['"][^'"]+['"];?$/gm) || [];
  const problematicImports = [];
  
  for (const importLine of imports) {
    const match = importLine.match(/from ['"]([^'"]+)['"]/);
    if (match) {
      const importPath = match[1];
      
      // Skip node_modules and relative paths that we can't easily verify
      if (importPath.startsWith('@') || importPath.startsWith('react') || importPath.startsWith('expo')) {
        continue;
      }
      
      // Check relative imports
      if (importPath.startsWith('.')) {
        const dir = path.dirname(fullPath);
        let resolvedPath = path.resolve(dir, importPath);
        
        // Try common extensions
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
        let found = false;
        
        for (const ext of extensions) {
          if (fs.existsSync(resolvedPath + ext)) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          problematicImports.push(`  ⚠️  ${importPath} (cannot resolve)`);
        }
      }
    }
  }
  
  if (problematicImports.length > 0) {
    console.log(`⚠️  ${file}:`);
    problematicImports.forEach(p => console.log(p));
    hasErrors = true;
  } else {
    console.log(`✅ ${file}`);
  }
}

console.log('\n' + (hasErrors ? '⚠️  Some issues found' : '✨ All imports look good!'));
process.exit(hasErrors ? 1 : 0);
