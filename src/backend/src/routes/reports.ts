import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { requireRole } from '../middleware/permissions';
import { query, validationResult } from 'express-validator';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/reports/generate
 * @desc Gerar relatório em PDF ou CSV
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/generate',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('template').isString().notEmpty().withMessage('Template é obrigatório'),
    query('startDate').isISO8601().withMessage('Data de início inválida'),
    query('endDate').isISO8601().withMessage('Data de fim inválida'),
    query('clientId').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { template, startDate, endDate, clientId } = req.query;

      // Construir filtros base
      const whereClause: any = {
        tenantId: req.user.tenantId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      if (clientId && clientId !== 'all') {
        whereClause.clientId = clientId;
      }

      // Se for TRAINER, filtrar apenas clientes atribuídos
      if (req.user.role === 'TRAINER') {
        const trainerClients = await prisma.clientTrainer.findMany({
          where: { trainerId: req.user.id },
          select: { clientId: true }
        });
        
        const clientIds = trainerClients.map(tc => tc.clientId);
        if (clientIds.length === 0) {
          return res.status(404).json({ success: false, error: 'Nenhum cliente encontrado' });
        }
        
        whereClause.clientId = { in: clientIds };
      }

      let reportData: any;
      let filename: string;
      let contentType: string;

      switch (template) {
        case 'bioimpedance-pdf':
          reportData = await generateBioimpedancePDF(whereClause);
          filename = `bioimpedance_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          contentType = 'application/pdf';
          break;

        case 'appointments-csv':
          reportData = await generateAppointmentsCSV(whereClause);
          filename = `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          contentType = 'text/csv';
          break;

        case 'crm-pipeline-csv':
          reportData = await generateCRMPipelineCSV(whereClause);
          filename = `crm_pipeline_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          contentType = 'text/csv';
          break;

        case 'goals-progress-pdf':
          reportData = await generateGoalsProgressPDF(whereClause);
          filename = `goals_progress_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          contentType = 'application/pdf';
          break;

        case 'attendance-csv':
          reportData = await generateAttendanceCSV(whereClause);
          filename = `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          contentType = 'text/csv';
          break;

        case 'analytics-pdf':
          reportData = await generateAnalyticsPDF(whereClause);
          filename = `analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          contentType = 'application/pdf';
          break;

        default:
          return res.status(400).json({ success: false, error: 'Template não encontrado' });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(reportData);
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

// Função para gerar PDF de bioimpedância
async function generateBioimpedancePDF(whereClause: any): Promise<Buffer> {
  const measurements = await prisma.biometricData.findMany({
    where: whereClause,
    include: {
      client: {
        select: { name: true }
      }
    },
    orderBy: { recordedAt: 'desc' }
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;
  const lineHeight = 20;

  // Título
  page.drawText('Relatório de Bioimpedância', {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  y -= 40;

  // Data de geração
  page.drawText(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, {
    x: 50,
    y,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });
  y -= 30;

  // Cabeçalho da tabela
  page.drawText('Cliente', { x: 50, y, size: 12, font: boldFont });
  page.drawText('Tipo', { x: 200, y, size: 12, font: boldFont });
  page.drawText('Valor', { x: 300, y, size: 12, font: boldFont });
  page.drawText('Data', { x: 400, y, size: 12, font: boldFont });
  y -= 20;

  // Linha separadora
  page.drawLine({
    start: { x: 50, y },
    end: { x: 550, y },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  y -= 10;

  // Dados
  measurements.forEach((measurement) => {
    if (y < 100) {
      // Nova página se necessário
      const newPage = pdfDoc.addPage([600, 800]);
      y = 750;
    }

    page.drawText(measurement.client.name, { x: 50, y, size: 10, font: font });
    page.drawText(measurement.dataType, { x: 200, y, size: 10, font: font });
    page.drawText(`${measurement.value} ${measurement.unit}`, { x: 300, y, size: 10, font: font });
    page.drawText(format(new Date(measurement.recordedAt), 'dd/MM/yyyy', { locale: ptBR }), { x: 400, y, size: 10, font: font });
    y -= lineHeight;
  });

  return Buffer.from(await pdfDoc.save());
}

// Função para gerar CSV de agendamentos
async function generateAppointmentsCSV(whereClause: any): Promise<string> {
  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      client: {
        select: { name: true, email: true }
      }
    },
    orderBy: { scheduledAt: 'desc' }
  });

  const headers = ['ID', 'Título', 'Cliente', 'Email', 'Data', 'Duração', 'Status', 'Local'];
  const rows = appointments.map(apt => [
    apt.id,
    apt.title,
    apt.client.name,
    apt.client.email || '',
    format(new Date(apt.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    apt.duration.toString(),
    apt.status,
    apt.location || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

// Função para gerar CSV do pipeline CRM
async function generateCRMPipelineCSV(whereClause: any): Promise<string> {
  const clients = await prisma.clientProfile.findMany({
    where: whereClause,
    include: {
      client: {
        select: { name: true, email: true }
      },
      _count: {
        select: { interactions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const headers = ['ID', 'Cliente', 'Email', 'Status', 'Interações', 'Total Gasto', 'Última Interação'];
  const rows = clients.map(client => [
    client.id,
    client.client.name,
    client.client.email || '',
    client.status,
    client._count.interactions.toString(),
    client.totalSpent.toString(),
    client.lastInteractionAt ? format(new Date(client.lastInteractionAt), 'dd/MM/yyyy', { locale: ptBR }) : ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

// Função para gerar PDF de progresso de metas
async function generateGoalsProgressPDF(whereClause: any): Promise<Buffer> {
  const goals = await prisma.clientGoal.findMany({
    where: whereClause,
    include: {
      client: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;
  const lineHeight = 20;

  // Título
  page.drawText('Relatório de Progresso de Metas', {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  y -= 40;

  // Data de geração
  page.drawText(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, {
    x: 50,
    y,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });
  y -= 30;

  // Cabeçalho da tabela
  page.drawText('Cliente', { x: 50, y, size: 12, font: boldFont });
  page.drawText('Meta', { x: 200, y, size: 12, font: boldFont });
  page.drawText('Atual', { x: 300, y, size: 12, font: boldFont });
  page.drawText('Alvo', { x: 350, y, size: 12, font: boldFont });
  page.drawText('Status', { x: 450, y, size: 12, font: boldFont });
  y -= 20;

  // Linha separadora
  page.drawLine({
    start: { x: 50, y },
    end: { x: 550, y },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  y -= 10;

  // Dados
  goals.forEach((goal) => {
    if (y < 100) {
      const newPage = pdfDoc.addPage([600, 800]);
      y = 750;
    }

    page.drawText(goal.client.name, { x: 50, y, size: 10, font: font });
    page.drawText(goal.title, { x: 200, y, size: 10, font: font });
    page.drawText(goal.current.toString(), { x: 300, y, size: 10, font: font });
    page.drawText(goal.target.toString(), { x: 350, y, size: 10, font: font });
    page.drawText(goal.status, { x: 450, y, size: 10, font: font });
    y -= lineHeight;
  });

  return Buffer.from(await pdfDoc.save());
}

// Função para gerar CSV de presença
async function generateAttendanceCSV(whereClause: any): Promise<string> {
  const attendance = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      client: {
        select: { name: true }
      },
      appointment: {
        select: { title: true, scheduledAt: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const headers = ['ID', 'Cliente', 'Agendamento', 'Data', 'Check-in', 'Check-out', 'Status'];
  const rows = attendance.map(att => [
    att.id,
    att.client.name,
    att.appointment.title,
    format(new Date(att.appointment.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    att.checkInAt ? format(new Date(att.checkInAt), 'HH:mm', { locale: ptBR }) : '',
    att.checkOutAt ? format(new Date(att.checkOutAt), 'HH:mm', { locale: ptBR }) : '',
    att.status
  ]);

  return [headers, ...rows].map(row => 
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

// Função para gerar PDF de analytics
async function generateAnalyticsPDF(whereClause: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;
  const lineHeight = 20;

  // Título
  page.drawText('Relatório de Analytics', {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  y -= 40;

  // Data de geração
  page.drawText(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, {
    x: 50,
    y,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });
  y -= 30;

  // Buscar dados de analytics
  const appointments = await prisma.appointment.count({ where: whereClause });
  const completedAppointments = await prisma.appointment.count({ 
    where: { ...whereClause, status: 'completed' } 
  });
  const clients = await prisma.client.count({ where: { tenantId: whereClause.tenantId } });
  const biometricData = await prisma.biometricData.count({ where: whereClause });

  // Métricas
  page.drawText('Métricas Principais', {
    x: 50,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  y -= 30;

  page.drawText(`Total de Agendamentos: ${appointments}`, { x: 50, y, size: 12, font: font });
  y -= lineHeight;
  page.drawText(`Agendamentos Concluídos: ${completedAppointments}`, { x: 50, y, size: 12, font: font });
  y -= lineHeight;
  page.drawText(`Taxa de Comparecimento: ${appointments > 0 ? Math.round((completedAppointments / appointments) * 100) : 0}%`, { x: 50, y, size: 12, font: font });
  y -= lineHeight;
  page.drawText(`Total de Clientes: ${clients}`, { x: 50, y, size: 12, font: font });
  y -= lineHeight;
  page.drawText(`Medições Biométricas: ${biometricData}`, { x: 50, y, size: 12, font: font });
  y -= lineHeight;

  return Buffer.from(await pdfDoc.save());
}

export default router;
