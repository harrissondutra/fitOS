
import { Router, Request, Response } from 'express';
import { ContactEmailService } from '../services/email/contact-email.service';

const router = Router();
const contactEmailService = new ContactEmailService();

/**
 * POST /api/contact/sales
 * Enviar formulário de contato de vendas
 */
router.post('/sales', async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, phone, company, size, message } = req.body;
        console.log('[DEBUG] Contact Sales Body:', req.body);

        // Validação básica
        if (!firstName || !email || !company) {
            console.log('[DEBUG] Missing fields:', { firstName, email, company }, 'Received body keys:', Object.keys(req.body));
            return res.status(400).json({
                error: 'Campos obrigatórios faltando.',
                received: req.body,
                missing: { firstName: !firstName, email: !email, company: !company }
            });
        }

        await contactEmailService.sendSalesContactEmail({
            firstName,
            lastName,
            email,
            phone,
            company,
            size,
            message
        });

        return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar contato de vendas:', error);
        return res.status(500).json({ error: 'Erro interno ao enviar mensagem.' });
    }
});

export default router;
