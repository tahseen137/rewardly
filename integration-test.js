/**
 * Integration Test - Verify Wave 1 Build
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Wave 1 Integration Test\n');
console.log('='.repeat(50));

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function expect(value) {
  return {
    toBeTruthy: () => {
      if (!value) throw new Error(`Expected truthy, got ${value}`);
    },
    toExist: () => {
      if (!fs.existsSync(value)) throw new Error(`File not found: ${value}`);
    },
    toContain: (substring) => {
      if (!value.includes(substring)) throw new Error(`Expected to contain "${substring}"`);
    },
    toHaveLength: (len) => {
      if (!value || value.length !== len) throw new Error(`Expected length ${len}, got ${value?.length}`);
    }
  };
}

// ============================================================================
// Tests
// ============================================================================

test('US cards data file exists', () => {
  expect(path.join(__dirname, 'src/data/us_cards.json')).toExist();
});

test('US cards data is valid JSON with cards array', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/us_cards.json'), 'utf-8'));
  expect(data.cards).toBeTruthy();
  expect(Array.isArray(data.cards)).toBeTruthy();
});

test('US rewards programs file exists', () => {
  expect(path.join(__dirname, 'src/data/us_rewards_programs.json')).toExist();
});

test('AuthScreen exists and imports correctly', () => {
  const file = path.join(__dirname, 'src/screens/AuthScreen.tsx');
  expect(file).toExist();
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('export default function AuthScreen');
  expect(content).toContain('AuthService');
});

test('OnboardingScreen exists and has 3 steps', () => {
  const file = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
  expect(file).toExist();
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('TOTAL_STEPS = 3');
  expect(content).toContain('Country');
  expect(content).toContain('Cards');
  expect(content).toContain('Sage');
});

test('SageScreen exists and imports chat components', () => {
  const file = path.join(__dirname, 'src/screens/SageScreen.tsx');
  expect(file).toExist();
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('ChatBubble');
  expect(content).toContain('ChatInput');
  expect(content).toContain('QuickActions');
  expect(content).toContain('CardRecommendationCard');
});

test('Chat components are exported', () => {
  const file = path.join(__dirname, 'src/components/chat/index.ts');
  expect(file).toExist();
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('ChatBubble');
  expect(content).toContain('ChatInput');
  expect(content).toContain('QuickActions');
  expect(content).toContain('CardRecommendationCard');
});

test('AuthService implements all required methods', () => {
  const file = path.join(__dirname, 'src/services/AuthService.ts');
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('export async function signIn');
  expect(content).toContain('export async function signUp');
  expect(content).toContain('export async function signInWithGoogle');
  expect(content).toContain('export async function signInWithApple');
  expect(content).toContain('export async function continueAsGuest');
  expect(content).toContain('export async function signOut');
});

test('SageService implements message sending', () => {
  const file = path.join(__dirname, 'src/services/SageService.ts');
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('async sendMessage');
  expect(content).toContain('conversationId');
  expect(content).toContain('portfolio');
});

test('SubscriptionService exports all tiers', () => {
  const file = path.join(__dirname, 'src/services/SubscriptionService.ts');
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('free');
  expect(content).toContain('plus');
  expect(content).toContain('pro');
  expect(content).toContain('elite');
  expect(content).toContain('SUBSCRIPTION_TIERS');
});

test('FeatureGate exports feature checking functions', () => {
  const file = path.join(__dirname, 'src/services/FeatureGate.ts');
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('isFeatureEnabled');
  expect(content).toContain('checkFeatureAccess');
  expect(content).toContain('withFeatureGate');
});

test('Paywall component exists', () => {
  const file = path.join(__dirname, 'src/components/Paywall.tsx');
  expect(file).toExist();
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('export default function Paywall');
  expect(content).toContain('SubscriptionTier');
});

test('AppNavigator includes Sage tab', () => {
  const file = path.join(__dirname, 'src/navigation/AppNavigator.tsx');
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('Sage');
  expect(content).toContain('SageScreen');
  expect(content).toContain('Sparkles');
  expect(content).toContain('import { Home, CreditCard, Settings, Sparkles }');
});

test('AppNavigator has correct tab order', () => {
  const file = path.join(__dirname, 'src/navigation/AppNavigator.tsx');
  const content = fs.readFileSync(file, 'utf-8');
  
  // Verify tab order: Home -> Sage -> MyCards -> Settings
  const homePos = content.indexOf('<Tab.Screen\n        name="Home"');
  const sagePos = content.indexOf('<Tab.Screen\n        name="Sage"');
  const cardsPos = content.indexOf('<Tab.Screen\n        name="MyCards"');
  const settingsPos = content.indexOf('<Tab.Screen\n        name="Settings"');
  
  expect(homePos < sagePos && sagePos < cardsPos && cardsPos < settingsPos).toBeTruthy();
});

test('Supabase edge function exists', () => {
  const file = path.join(__dirname, 'supabase/functions/sage-chat/index.ts');
  expect(file).toExist();
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('serve');
  expect(content).toContain('ChatRequest');
  expect(content).toContain('sendMessage');
});

test('Screens are exported from index', () => {
  const file = path.join(__dirname, 'src/screens/index.ts');
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('SageScreen');
  expect(content).toContain('AuthScreen');
  expect(content).toContain('OnboardingScreen');
});

test('CardDataService supports country filtering', () => {
  const file = path.join(__dirname, 'src/services/CardDataService.ts');
  const content = fs.readFileSync(file, 'utf-8');
  expect(content).toContain('getCountry()');
  expect(content).toContain('getCardsByCountry');
  expect(content).toContain('onCountryChange');
});

// ============================================================================
// Run Tests
// ============================================================================

console.log('');
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}`);
    failed++;
  }
}

console.log('');
console.log('='.repeat(50));
console.log(`📊 Results: ${passed}/${tests.length} passed`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('\n✨ All integration tests passed!');
  process.exit(0);
}
