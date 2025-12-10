// FitOS Push Notification Routes
// Rotas para gerenciar push notifications

import { Router } from 'express';
import { pushNotificationService } from '../services/push-notification.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';

const prisma = getPrismaClient();

const router = Router();
const authMiddleware = getAuthMiddleware();

// Obter chave pública VAPID
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = pushNotificationService.getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('[Push Routes] Error getting VAPID key:', error);
    res.status(500).json({ error: 'Erro ao obter chave VAPID' });
  }
});

// Inscrever usuário para push notifications
router.post('/subscribe', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Subscription inválida' });
    }

    const success = await pushNotificationService.saveUserSubscription(userId, subscription);
    
    if (success) {
      return res.json({ message: 'Inscrição realizada com sucesso' });
    } else {
      return res.status(500).json({ error: 'Erro ao salvar inscrição' });
    }
  } catch (error) {
    console.error('[Push Routes] Error subscribing:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar inscrição do usuário
router.post('/unsubscribe', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const success = await pushNotificationService.removeUserSubscription(userId);
    
    if (success) {
      return res.json({ message: 'Inscrição cancelada com sucesso' });
    } else {
      return res.status(500).json({ error: 'Erro ao cancelar inscrição' });
    }
  } catch (error) {
    console.error('[Push Routes] Error unsubscribing:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar notificação de teste
router.post('/test', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { title, body } = req.body;
    
    const payload = {
      title: title || 'Teste FitOS',
      body: body || 'Esta é uma notificação de teste do FitOS',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    const success = await pushNotificationService.sendToUser(userId, payload);
    
    if (success) {
      return res.json({ message: 'Notificação de teste enviada' });
    } else {
      return res.status(500).json({ error: 'Erro ao enviar notificação' });
    }
  } catch (error) {
    console.error('[Push Routes] Error sending test notification:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar lembrete de treino
router.post('/workout-reminder', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { workoutName, scheduledTime } = req.body;
    
    if (!workoutName || !scheduledTime) {
      return res.status(400).json({ error: 'Nome do treino e horário são obrigatórios' });
    }

    const success = await pushNotificationService.sendWorkoutReminder(
      userId, 
      workoutName, 
      new Date(scheduledTime)
    );
    
    if (success) {
      return res.json({ message: 'Lembrete de treino enviado' });
    } else {
      return res.status(500).json({ error: 'Erro ao enviar lembrete' });
    }
  } catch (error) {
    console.error('[Push Routes] Error sending workout reminder:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar notificação de progresso
router.post('/progress-update', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { achievement } = req.body;
    
    if (!achievement) {
      return res.status(400).json({ error: 'Conquista é obrigatória' });
    }

    const success = await pushNotificationService.sendProgressUpdate(userId, achievement);
    
    if (success) {
      return res.json({ message: 'Notificação de progresso enviada' });
    } else {
      return res.status(500).json({ error: 'Erro ao enviar notificação' });
    }
  } catch (error) {
    console.error('[Push Routes] Error sending progress update:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar notificação de mensagem
router.post('/message', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { senderName, message } = req.body;
    
    if (!senderName || !message) {
      return res.status(400).json({ error: 'Nome do remetente e mensagem são obrigatórios' });
    }

    const success = await pushNotificationService.sendMessage(userId, senderName, message);
    
    if (success) {
      return res.json({ message: 'Notificação de mensagem enviada' });
    } else {
      return res.status(500).json({ error: 'Erro ao enviar notificação' });
    }
  } catch (error) {
    console.error('[Push Routes] Error sending message notification:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
