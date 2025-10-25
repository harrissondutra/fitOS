import express from 'express';
// import { KYCService, KYCProvider } from '../services/marketplace/kyc/KYCService';

const router = express.Router();
// const kycService = new KYCService();

// POST /api/marketplace/kyc/verify - Verificar identidade
router.post('/verify', async (req, res) => {
  try {
    const { documents, cpf, cnpj, provider } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documentos são obrigatórios' });
    }

    // const result = await kycService.verifyIdentity(
    //   documents,
    //   cpf,
    //   cnpj,
    //   provider as KYCProvider
    // );

    // res.json(result);
    return res.json({ success: true, message: 'KYC verification mocked' });
  } catch (error) {
    console.error('Erro na verificação KYC:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: (error as Error).message 
    });
  }
});

// GET /api/marketplace/kyc/providers - Listar providers disponíveis
router.get('/providers', async (req, res) => {
  try {
    // const providers = kycService.getProvidersInfo();
    // const stats = kycService.getProvidersStats();
    const providers = [];
    const stats = {};
    
    return res.json({
      providers,
      stats,
      active: 'mock'
    });
  } catch (error) {
    console.error('Erro ao listar providers KYC:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: (error as Error).message 
    });
  }
});

// POST /api/marketplace/kyc/providers/set - Alterar provider padrão
router.post('/providers/set', async (req, res) => {
  try {
    const { provider } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!provider) {
      return res.status(400).json({ error: 'Provider é obrigatório' });
    }

    // kycService.setDefaultProvider(provider as KYCProvider);
    
    return res.json({ 
      success: true, 
      message: `Provider alterado para ${provider}`,
      active: 'mock'
    });
  } catch (error) {
    console.error('Erro ao alterar provider KYC:', error);
    return res.status(400).json({ 
      error: 'Erro ao alterar provider',
      message: (error as Error).message 
    });
  }
});

// POST /api/marketplace/kyc/verification-url - Criar URL de verificação
router.post('/verification-url', async (req, res) => {
  try {
    const { provider } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // const url = await kycService.createVerificationUrl(
    //   userId, 
    //   provider as KYCProvider
    // );
    const url = 'https://mock-kyc-url.com';

    if (!url) {
      return res.status(400).json({ 
        error: 'URL de verificação não disponível para este provider' 
      });
    }

    return res.json({ url });
  } catch (error) {
    console.error('Erro ao criar URL de verificação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: (error as Error).message 
    });
  }
});

// POST /api/marketplace/kyc/webhooks/:provider - Webhooks
router.post('/webhooks/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const event = req.body;

    // const result = await kycService.handleWebhook(provider, event);
    const result = { success: true, message: 'Webhook handled mocked' };
    
    // res.json(result);
    return res.json({ success: true, message: 'KYC verification mocked' });
  } catch (error) {
    console.error(`Erro no webhook ${req.params.provider}:`, error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: (error as Error).message 
    });
  }
});

// GET /api/marketplace/kyc/status - Status dos providers
router.get('/status', async (req, res) => {
  try {
    // const stats = kycService.getProvidersStats();
    const stats = {};
    
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...stats
    });
  } catch (error) {
    console.error('Erro ao obter status KYC:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: (error as Error).message 
    });
  }
});

export default router;
