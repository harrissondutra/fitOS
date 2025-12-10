/**
 * PDF Export Service - Sprint 7
 * Exportação de prescrições e relatórios em PDF profissional
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  clientName: string;
  professionalName: string;
  content: any;
  includeCharts?: boolean;
  watermark?: boolean;
}

export class PDFExportService {
  /**
   * Gerar PDF de prescrição nutricional
   */
  async generateNutritionPrescription(options: PDFExportOptions): Promise<Buffer> {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => { });

      // Cabeçalho
      this.addHeader(doc, options.title, options.subtitle);

      // Informações do paciente
      this.addPatientInfo(doc, options.clientName);

      // Prescrição
      this.addPrescriptionContent(doc, options.content);

      // Rodapé
      this.addFooter(doc, options.professionalName);

      // Watermark (se solicitado)
      if (options.watermark) {
        this.addWatermark(doc);
      }

      doc.end();

      // Ag Gerar buffer
      return Buffer.concat(buffers);

    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Adicionar cabeçalho ao PDF
   */
  private addHeader(doc: PDFDocument, title: string, subtitle?: string) {
    // Logo (se tiver)
    doc.fontSize(24)
       .text('FitOS', { align: 'center' });

    if (subtitle) {
      doc.fontSize(14)
         .text(subtitle, { align: 'center' });
    }

    doc.fontSize(20)
       .text(title, { align: 'center' })
       .moveDown();
  }

  /**
   * Adicionar informações do paciente
   */
  private addPatientInfo(doc: PDFDocument, clientName: string) {
    doc.fontSize(12)
       .text('Paciente:', { continued: true })
       .text(clientName, { indent: 100 })
       .text(`Data: ${new Date().toLocaleDateString('pt-BR')}`)
       .moveDown();
  }

  /**
   * Adicionar conteúdo da prescrição
   */
  private addPrescriptionContent(doc: PDFDocument, content: any) {
    doc.fontSize(14)
       .text('Prescrição Nutricional:', { underline: true })
       .moveDown();

    // Se for plano alimentar
    if (content.meals) {
      content.meals.forEach((meal: any, index: number) => {
        doc.fontSize(12)
           .text(`${index + 1}. ${meal.mealType}:`, { continued: true })
           .text(meal.foods.join(', '));
      });
    }

    // Se for orientações gerais
    if (content.recommendations) {
      doc.moveDown()
         .fontSize(12)
         .text('Recomendações:', { underline: true });
      
      content.recommendations.forEach((rec: string) => {
        doc.text(`• ${rec}`);
      });
    }
  }

  /**
   * Adicionar rodapé
   */
  private addFooter(doc: PDFDocument, professionalName: string) {
    doc.moveTo(50, doc.page.height - 100)
       .lineTo(doc.page.width - 50, doc.page.height - 100)
       .stroke()
       .moveDown()
       .fontSize(10)
       .text('Prescrito por:', { continued: true })
       .text(professionalName, { indent: 100 })
       .text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`)
       .fontSize(8)
       .text('Este documento foi gerado automaticamente pelo FitOS.', 
             { align: 'center' });
  }

  /**
   * Adicionar watermark
   */
  private addWatermark(doc: PDFDocument) {
    doc.fillColor('lightgray')
       .fontSize(72)
       .text('FITOS', {
         align: 'center',
         baseline: 'middle',
         opacity: 0.1,
         angle: 45
       });
  }

  /**
   * Upload PDF para Cloudinary
   */
  async uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
    // Implementação com Cloudinary
    // Retornar URL do PDF
    return `https://res.cloudinary.com/fitos/pdf/${filename}`;
  }
}

export default new PDFExportService();

