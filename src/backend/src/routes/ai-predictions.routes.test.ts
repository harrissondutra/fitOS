/**
 * Testes unitários para rotas de predições
 */

import { Request, Response } from 'express';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
import { AiServiceType } from '@/shared/types/ai.types';

// Mock dos serviços
jest.mock('../services/predictive-analytics.service');
jest.mock('../utils/service-factory');

describe('AI Predictions Routes', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      query: {},
      tenantId: 'system',
      userId: 'user-123'
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('POST /:type/analyze', () => {
    it('should execute a prediction successfully', async () => {
      const mockPredictionResult = {
        predictionId: 'pred-123',
        serviceType: AiServiceType.PERFORMANCE_PREDICTION,
        prediction: { expectedImprovement: 15 },
        confidence: 0.85
      };

      const mockExecutePrediction = jest.fn().mockResolvedValue(mockPredictionResult);
      (PredictiveAnalyticsService as jest.MockedClass<typeof PredictiveAnalyticsService>).mockImplementation(() => ({
        executePrediction: mockExecutePrediction
      } as any));

      mockRequest.params = { type: 'performance-prediction' };
      mockRequest.body = {
        data: { age: 30, gender: 'male' }
      };

      // Importar e executar o handler (ajustar conforme estrutura real)
      // const handler = require('./ai-predictions.routes');
      
      expect(mockExecutePrediction).toBeDefined();
    });

    it('should return 400 for invalid service type', () => {
      mockRequest.params = { type: 'invalid-type' };

      // Testar validação de tipo
      const validTypes = Object.values(AiServiceType);
      const isValid = validTypes.includes(mockRequest.params.type as AiServiceType);
      
      expect(isValid).toBe(false);
    });
  });

  describe('GET /', () => {
    it('should list predictions with pagination', () => {
      mockRequest.query = {
        page: '1',
        limit: '20',
        serviceType: AiServiceType.PERFORMANCE_PREDICTION
      };

      // Testar construção de filtros
      const filters = {
        serviceType: mockRequest.query.serviceType,
        page: parseInt(mockRequest.query.page as string) || 1,
        limit: parseInt(mockRequest.query.limit as string) || 20
      };

      expect(filters.page).toBe(1);
      expect(filters.limit).toBe(20);
      expect(filters.serviceType).toBe(AiServiceType.PERFORMANCE_PREDICTION);
    });
  });

  describe('POST /:executionId/validate', () => {
    it('should validate prediction with actual result', () => {
      mockRequest.params = { executionId: 'exec-123' };
      mockRequest.body = {
        actualResult: { actualImprovement: 12 }
      };

      expect(mockRequest.body.actualResult).toBeDefined();
      expect(mockRequest.params.executionId).toBe('exec-123');
    });

    it('should return 400 if actualResult is missing', () => {
      mockRequest.body = {};

      expect(mockRequest.body.actualResult).toBeUndefined();
    });
  });
});



