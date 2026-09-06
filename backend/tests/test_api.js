import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('Running Express backend integration tests...');
  
  // Clean up any test users from DB directly
  import('mongoose').then(async (mongoose) => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unlost';
    await mongoose.default.connect(mongoURI);
    
    // Clear test registration data if exists
    const User = mongoose.default.models.User || mongoose.default.model('User', new mongoose.default.Schema({}), 'users');
    await User.deleteOne({ email: 'test_node@paruluniversity.ac.in' });
    console.log('Cleared test user from database.');
    await mongoose.default.disconnect();
    
    // Proceed with API HTTP tests
    await testAuthAndItemsFlow();
  }).catch((err) => {
    console.error('Mongoose setup failed:', err);
    process.exit(1);
  });
}

async function testAuthAndItemsFlow() {
  // Use a cookie jar/session simulator by capturing cookie headers
  let sessionCookie = '';

  // 1. Test registration
  console.log('1. Testing registration...');
  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'test_node',
      email: 'test_node@paruluniversity.ac.in',
      password: 'password123'
    })
  });
  const regJson = await regRes.json();
  assert.strictEqual(regRes.status, 200);
  assert.strictEqual(regJson.success, true);
  console.log('✔ Registration passed');

  // 2. Test login
  console.log('2. Testing login...');
  const loginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_node@paruluniversity.ac.in',
      password: 'password123'
    })
  });
  const loginJson = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginJson.success, true);
  assert.strictEqual(loginJson.user.username, 'test_node');
  
  // Save session cookie
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
  console.log('✔ Login passed. Cookie:', sessionCookie);

  // 3. Test current user endpoint
  console.log('3. Testing api/user...');
  const userRes = await fetch(`${BASE_URL}/api/user`, {
    headers: { Cookie: sessionCookie }
  });
  const userJson = await userRes.json();
  assert.strictEqual(userRes.status, 200);
  assert.strictEqual(userJson.authenticated, true);
  assert.strictEqual(userJson.user.username, 'test_node');
  console.log('✔ api/user passed');

  // 4. Test items endpoint
  console.log('4. Testing api/items...');
  const itemsRes = await fetch(`${BASE_URL}/api/items`, {
    headers: { Cookie: sessionCookie }
  });
  const itemsJson = await itemsRes.json();
  assert.strictEqual(itemsRes.status, 200);
  assert.strictEqual(itemsJson.success, true);
  assert.ok(Array.isArray(itemsJson.items));
  console.log(`✔ api/items passed (found ${itemsJson.items.length} items)`);

  // 5. Test logout
  console.log('5. Testing logout...');
  const logoutRes = await fetch(`${BASE_URL}/api/logout`, {
    headers: { Cookie: sessionCookie }
  });
  const logoutJson = await logoutRes.json();
  assert.strictEqual(logoutRes.status, 200);
  assert.strictEqual(logoutJson.success, true);
  console.log('✔ Logout passed');

  // 6. Test user endpoint after logout
  console.log('6. Testing user endpoint after logout...');
  const userPostLogoutRes = await fetch(`${BASE_URL}/api/user`, {
    headers: {}
  });
  const userPostLogoutJson = await userPostLogoutRes.json();
  assert.strictEqual(userPostLogoutJson.authenticated, false);
  console.log('✔ Logged out session check passed');

  console.log('All MERN backend integration tests completed successfully!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
