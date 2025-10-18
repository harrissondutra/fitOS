const fetch = require('node-fetch');

async function testApiLogin() {
  try {
    console.log('🔐 Testando login via API...');
    
    const response = await fetch('http://localhost:3001/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'harrissondutra@gmail.com',
        password: '123456'
      })
    });
    
    const result = await response.text();
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', response.headers.raw());
    console.log('📄 Response:', result);
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testApiLogin();
