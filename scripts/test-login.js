async function testLogin(identifier, password) {
  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: identifier, password }),
    });
    const status = res.status;
    const data = await res.json();
    return { status, ok: res.ok, data };
  } catch (err) {
    return { error: err.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Login API Endpoints:');

  // Test 1: Username 'superadmin'
  const t1 = await testLogin('superadmin', 'admin123');
  console.log('1. Login with username "superadmin":');
  console.log('   Status:', t1.status, '| Success:', t1.ok);
  if (t1.ok) {
    console.log('   User returned:', t1.data.user);
    console.log('   Token generated:', t1.data.token ? 'YES (Valid JWT)' : 'NO');
  } else {
    console.log('   Error:', t1.data);
  }

  // Test 2: Username 'admin'
  const t2 = await testLogin('admin', 'admin123');
  console.log('\n2. Login with username "admin":');
  console.log('   Status:', t2.status, '| Success:', t2.ok);
  if (t2.ok) {
    console.log('   User returned:', t2.data.user);
  } else {
    console.log('   Error:', t2.data);
  }

  // Test 3: Email 'superadmin@dental.com'
  const t3 = await testLogin('superadmin@dental.com', 'admin123');
  console.log('\n3. Login with email "superadmin@dental.com":');
  console.log('   Status:', t3.status, '| Success:', t3.ok);
  if (t3.ok) {
    console.log('   User returned:', t3.data.user);
  } else {
    console.log('   Error:', t3.data);
  }

  // Test 4: Email 'admin@dental.com'
  const t4 = await testLogin('admin@dental.com', 'admin123');
  console.log('\n4. Login with email "admin@dental.com":');
  console.log('   Status:', t4.status, '| Success:', t4.ok);
  if (t4.ok) {
    console.log('   User returned:', t4.data.user);
  } else {
    console.log('   Error:', t4.data);
  }

  // Test 5: Verify /api/auth/me with superadmin token
  if (t1.ok) {
    const meRes = await fetch('http://localhost:3001/api/auth/me', {
      headers: { Authorization: `Bearer ${t1.data.token}` }
    });
    const meData = await meRes.json();
    console.log('\n5. Verify /api/auth/me with superadmin token:');
    console.log('   Status:', meRes.status, '| User:', meData.user);
  }

  // Test 6: Invalid password
  const t6 = await testLogin('superadmin', 'wrongpass');
  console.log('\n6. Invalid password test:');
  console.log('   Status:', t6.status, '(Expected 401) | Error:', t6.data?.error);
}

runTests();
