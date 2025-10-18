const { auth } = require('./src/config/auth.ts');

async function testLogin() {
  try {
    console.log('🔐 Testando login com Better Auth...');
    
    // Testar login
    const result = await auth.api.signInEmail({
      body: {
        email: 'harrissondutra@gmail.com',
        password: '123456'
      }
    });
    
    console.log('✅ Resultado do login:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLogin();
