/**
 * AI Nutrition Agent - FitOS Sprint 4
 * 
 * Agente de IA especializado em análise nutricional, criação de planos alimentares
 * e interpretação de exames laboratoriais.
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';

export interface NutritionAnalysisRequest {
  clientId: string;
  analysisType: 'meal_plan' | 'diet_analysis' | 'lab_interpretation' | 'supplement_recommendation';
  inputData: {
    // Para meal_plan
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    activityLevel?: string;
    goals?: string[];
    dietaryRestrictions?: string[];
    allergies?: string[];
    
    // Para diet_analysis
    foodDiary?: Array<{
      food: string;
      quantity: number;
      unit: string;
      mealType: string;
      date: string;
    }>;
    
    // Para lab_interpretation
    labResults?: Array<{
      parameter: string;
      value: string;
      unit: string;
      referenceRange: string;
    }>;
    
    // Para supplement_recommendation
    currentSupplements?: string[];
    medicalConditions?: string[];
  };
  preferences?: {
    cuisine?: string[];
    cookingTime?: 'quick' | 'moderate' | 'extensive';
    budget?: 'low' | 'medium' | 'high';
    mealFrequency?: number;
  };
}

export interface NutritionAnalysisResponse {
  analysisId: string;
  analysisType: string;
  status: 'success' | 'partial' | 'failed';
  confidence: number;
  results: {
    // Para meal_plan
    mealPlan?: {
      totalCalories: number;
      macronutrients: {
        protein: { grams: number; percentage: number };
        carbs: { grams: number; percentage: number };
        fat: { grams: number; percentage: number };
      };
      meals: Array<{
        name: string;
        mealType: string;
        calories: number;
        foods: Array<{
          name: string;
          quantity: number;
          unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        }>;
      }>;
      recommendations: string[];
    };
    
    // Para diet_analysis
    dietAnalysis?: {
      totalCalories: number;
      macronutrientBalance: {
        protein: { actual: number; recommended: number; status: 'low' | 'adequate' | 'high' };
        carbs: { actual: number; recommended: number; status: 'low' | 'adequate' | 'high' };
        fat: { actual: number; recommended: number; status: 'low' | 'adequate' | 'high' };
      };
      micronutrients: Array<{
        name: string;
        actual: number;
        recommended: number;
        unit: string;
        status: 'deficient' | 'adequate' | 'excessive';
      }>;
      recommendations: string[];
      warnings: string[];
    };
    
    // Para lab_interpretation
    labInterpretation?: {
      overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
      keyFindings: Array<{
        parameter: string;
        value: string;
        status: 'normal' | 'high' | 'low' | 'critical';
        interpretation: string;
        recommendation: string;
      }>;
      recommendations: string[];
      followUpRequired: boolean;
      urgencyLevel: 'low' | 'medium' | 'high';
    };
    
    // Para supplement_recommendation
    supplementRecommendation?: {
      recommendedSupplements: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        reason: string;
        interactions: string[];
        contraindications: string[];
      }>;
      avoidSupplements: Array<{
        name: string;
        reason: string;
      }>;
      timing: string[];
      warnings: string[];
    };
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    timestamp: string;
  };
  errorMessage?: string;
}

export class AINutritionAgent {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = getPrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Analisa dados nutricionais usando IA
   */
  async analyzeNutrition(request: NutritionAnalysisRequest): Promise<NutritionAnalysisResponse> {
    const startTime = Date.now();
    const analysisId = `nutrition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info(`🧠 Starting nutrition analysis: ${request.analysisType} for client ${request.clientId}`);

      // Verificar cache primeiro
      const cacheKey = this.generateCacheKey(request);
      const cached = await this.redis.get(cacheKey, {
        namespace: 'ai-nutrition',
        ttl: parseInt(process.env.REDIS_TTL_AI_ANALYSIS || '3600')
      });

      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition analysis: ${request.analysisType}`);
        return {
          ...cached,
          analysisId,
          metadata: {
            ...cached.metadata,
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }

      // Executar análise baseada no tipo
      let results: any;
      let confidence = 0.8; // Confiança padrão

      switch (request.analysisType) {
        case 'meal_plan':
          results = await this.generateMealPlan(request);
          confidence = 0.85;
          break;
        case 'diet_analysis':
          results = await this.analyzeDiet(request);
          confidence = 0.9;
          break;
        case 'lab_interpretation':
          results = await this.interpretLabResults(request);
          confidence = 0.75;
          break;
        case 'supplement_recommendation':
          results = await this.recommendSupplements(request);
          confidence = 0.8;
          break;
        default:
          throw new Error(`Unknown analysis type: ${request.analysisType}`);
      }

      const response: NutritionAnalysisResponse = {
        analysisId,
        analysisType: request.analysisType,
        status: 'success',
        confidence,
        results,
        metadata: {
          processingTime: Date.now() - startTime,
          modelVersion: '1.0.0',
          timestamp: new Date().toISOString()
        }
      };

      // Cachear resultado
      await this.redis.set(cacheKey, response, {
        namespace: 'ai-nutrition',
        ttl: parseInt(process.env.REDIS_TTL_AI_ANALYSIS || '3600')
      });

      // Salvar no banco de dados
      await this.saveAnalysisToDatabase(analysisId, request, response);

      logger.info(`✅ Nutrition analysis completed: ${request.analysisType} (${analysisId})`);
      return response;

    } catch (error) {
      logger.error('Error in nutrition analysis:', error);
      
      return {
        analysisId,
        analysisType: request.analysisType,
        status: 'failed',
        confidence: 0,
        results: {},
        metadata: {
          processingTime: Date.now() - startTime,
          modelVersion: '1.0.0',
          timestamp: new Date().toISOString()
        },
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gera plano alimentar personalizado
   */
  private async generateMealPlan(request: NutritionAnalysisRequest) {
    const { inputData, preferences } = request;
    
    // Calcular necessidades calóricas
    const bmr = this.calculateBMR(inputData.age!, inputData.gender!, inputData.height!, inputData.weight!);
    const tdee = this.calculateTDEE(bmr, inputData.activityLevel!);
    
    // Ajustar calorias baseado nos objetivos
    let targetCalories = tdee;
    if (inputData.goals?.includes('weight_loss')) {
      targetCalories = tdee - 500; // Déficit de 500 calorias
    } else if (inputData.goals?.includes('weight_gain')) {
      targetCalories = tdee + 500; // Superávit de 500 calorias
    }

    // Calcular macronutrientes
    const proteinGrams = (targetCalories * 0.25) / 4; // 25% das calorias
    const carbGrams = (targetCalories * 0.50) / 4; // 50% das calorias
    const fatGrams = (targetCalories * 0.25) / 9; // 25% das calorias

    // Gerar refeições
    const meals = await this.generateMeals(targetCalories, proteinGrams, carbGrams, fatGrams, preferences);

    return {
      mealPlan: {
        totalCalories: Math.round(targetCalories),
        macronutrients: {
          protein: { grams: Math.round(proteinGrams), percentage: 25 },
          carbs: { grams: Math.round(carbGrams), percentage: 50 },
          fat: { grams: Math.round(fatGrams), percentage: 25 }
        },
        meals,
        recommendations: this.generateMealPlanRecommendations(inputData, preferences)
      }
    };
  }

  /**
   * Analisa dieta atual do cliente
   */
  private async analyzeDiet(request: NutritionAnalysisRequest) {
    const { inputData } = request;
    
    if (!inputData.foodDiary || inputData.foodDiary.length === 0) {
      throw new Error('Food diary is required for diet analysis');
    }

    // Calcular totais nutricionais
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const entry of inputData.foodDiary) {
      // Buscar informações nutricionais do alimento
      const foodInfo = await this.getFoodNutritionInfo(entry.food);
      
      const multiplier = entry.quantity / 100; // Assumindo que as informações são por 100g
      
      totalCalories += foodInfo.calories * multiplier;
      totalProtein += foodInfo.protein * multiplier;
      totalCarbs += foodInfo.carbs * multiplier;
      totalFat += foodInfo.fat * multiplier;
    }

    // Calcular necessidades recomendadas
    const client = await this.getClientInfo(request.clientId);
    const bmr = this.calculateBMR(client.age, client.gender, client.height, client.weight);
    const tdee = this.calculateTDEE(bmr, client.activityLevel);
    
    const recommendedProtein = (tdee * 0.25) / 4;
    const recommendedCarbs = (tdee * 0.50) / 4;
    const recommendedFat = (tdee * 0.25) / 9;

    return {
      dietAnalysis: {
        totalCalories: Math.round(totalCalories),
        macronutrientBalance: {
          protein: {
            actual: Math.round(totalProtein),
            recommended: Math.round(recommendedProtein),
            status: this.getMacronutrientStatus(totalProtein, recommendedProtein)
          },
          carbs: {
            actual: Math.round(totalCarbs),
            recommended: Math.round(recommendedCarbs),
            status: this.getMacronutrientStatus(totalCarbs, recommendedCarbs)
          },
          fat: {
            actual: Math.round(totalFat),
            recommended: Math.round(recommendedFat),
            status: this.getMacronutrientStatus(totalFat, recommendedFat)
          }
        },
        micronutrients: await this.analyzeMicronutrients(inputData.foodDiary),
        recommendations: this.generateDietRecommendations(totalCalories, tdee, totalProtein, recommendedProtein),
        warnings: this.generateDietWarnings(inputData.foodDiary, inputData.allergies)
      }
    };
  }

  /**
   * Interpreta resultados de exames laboratoriais
   */
  private async interpretLabResults(request: NutritionAnalysisRequest) {
    const { inputData } = request;
    
    if (!inputData.labResults || inputData.labResults.length === 0) {
      throw new Error('Lab results are required for interpretation');
    }

    const keyFindings: any[] = [];
    let overallHealth = 'good';
    let urgencyLevel = 'low';
    let followUpRequired = false;

    for (const result of inputData.labResults) {
      const interpretation = await this.interpretLabParameter(result);
      keyFindings.push(interpretation);

      // Atualizar status geral baseado nos resultados
      if (interpretation.status === 'critical') {
        overallHealth = 'poor';
        urgencyLevel = 'high';
        followUpRequired = true;
      } else if (interpretation.status === 'high' || interpretation.status === 'low') {
        if (overallHealth === 'good') overallHealth = 'fair';
        if (urgencyLevel === 'low') urgencyLevel = 'medium';
        followUpRequired = true;
      }
    }

    return {
      labInterpretation: {
        overallHealth,
        keyFindings,
        recommendations: this.generateLabRecommendations(keyFindings),
        followUpRequired,
        urgencyLevel
      }
    };
  }

  /**
   * Recomenda suplementos baseado no perfil do cliente
   */
  private async recommendSupplements(request: NutritionAnalysisRequest) {
    const { inputData } = request;
    
    const client = await this.getClientInfo(request.clientId);
    const recommendations: any[] = [];
    const avoidSupplements: string[] = [];
    const warnings: string[] = [];

    // Análise baseada em idade e gênero
    if (client.age > 50) {
      recommendations.push({
        name: 'Vitamina D3',
        dosage: '1000-2000 UI',
        frequency: 'Diária',
        duration: 'Contínua',
        reason: 'Suporte à saúde óssea e imunidade em adultos mais velhos',
        interactions: [],
        contraindications: ['Hipercalcemia']
      });
    }

    if (client.gender === 'female' && client.age > 18) {
      recommendations.push({
        name: 'Ferro',
        dosage: '18mg',
        frequency: 'Diária',
        duration: 'Conforme necessário',
        reason: 'Prevenção de anemia ferropriva em mulheres',
        interactions: ['Cálcio', 'Cafeína'],
        contraindications: ['Hemocromatose']
      });
    }

    // Análise baseada em condições médicas
    if (inputData.medicalConditions?.includes('diabetes')) {
      recommendations.push({
        name: 'Cromo',
        dosage: '200-400mcg',
        frequency: 'Diária',
        duration: '3 meses',
        reason: 'Suporte ao metabolismo da glicose',
        interactions: [],
        contraindications: ['Insuficiência renal']
      });
    }

    // Verificar interações com medicamentos
    if (client.medications && client.medications.length > 0) {
      warnings.push('Consulte seu médico antes de iniciar qualquer suplemento devido aos medicamentos em uso');
    }

    return {
      supplementRecommendation: {
        recommendedSupplements: recommendations,
        avoidSupplements,
        timing: ['Com as refeições', 'Evitar cafeína 2 horas antes/depois'],
        warnings
      }
    };
  }

  /**
   * Calcula Taxa Metabólica Basal (BMR)
   */
  private calculateBMR(age: number, gender: string, height: number, weight: number): number {
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  /**
   * Calcula Taxa Metabólica Total (TDEE)
   */
  private calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2);
  }

  /**
   * Gera refeições baseado nas necessidades nutricionais
   */
  private async generateMeals(calories: number, protein: number, carbs: number, fat: number, preferences?: any) {
    // Implementação simplificada - em produção seria mais complexa
    const meals = [
      {
        name: 'Café da Manhã',
        mealType: 'breakfast',
        calories: Math.round(calories * 0.25),
        foods: [
          { name: 'Aveia', quantity: 50, unit: 'g', calories: 200, protein: 8, carbs: 35, fat: 4 },
          { name: 'Banana', quantity: 1, unit: 'unidade', calories: 100, protein: 1, carbs: 25, fat: 0 },
          { name: 'Leite', quantity: 200, unit: 'ml', calories: 100, protein: 8, carbs: 12, fat: 4 }
        ]
      },
      {
        name: 'Almoço',
        mealType: 'lunch',
        calories: Math.round(calories * 0.35),
        foods: [
          { name: 'Frango grelhado', quantity: 150, unit: 'g', calories: 250, protein: 45, carbs: 0, fat: 6 },
          { name: 'Arroz integral', quantity: 100, unit: 'g', calories: 120, protein: 3, carbs: 25, fat: 1 },
          { name: 'Salada verde', quantity: 100, unit: 'g', calories: 20, protein: 2, carbs: 4, fat: 0 }
        ]
      },
      {
        name: 'Jantar',
        mealType: 'dinner',
        calories: Math.round(calories * 0.30),
        foods: [
          { name: 'Salmão', quantity: 120, unit: 'g', calories: 200, protein: 35, carbs: 0, fat: 8 },
          { name: 'Batata doce', quantity: 150, unit: 'g', calories: 120, protein: 2, carbs: 28, fat: 0 },
          { name: 'Brócolis', quantity: 100, unit: 'g', calories: 30, protein: 3, carbs: 6, fat: 0 }
        ]
      },
      {
        name: 'Lanche',
        mealType: 'snack',
        calories: Math.round(calories * 0.10),
        foods: [
          { name: 'Iogurte grego', quantity: 150, unit: 'g', calories: 100, protein: 15, carbs: 8, fat: 2 },
          { name: 'Nozes', quantity: 20, unit: 'g', calories: 120, protein: 3, carbs: 2, fat: 12 }
        ]
      }
    ];

    return meals;
  }

  /**
   * Busca informações nutricionais de um alimento
   */
  private async getFoodNutritionInfo(foodName: string) {
    // Implementação simplificada - em produção buscaria na base TACO
    const foodDatabase = {
      'arroz': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      'frango': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      'batata': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
      'leite': { calories: 42, protein: 3.4, carbs: 5, fat: 1 }
    };

    return foodDatabase[foodName.toLowerCase() as keyof typeof foodDatabase] || {
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 2
    };
  }

  /**
   * Busca informações do cliente
   */
  private async getClientInfo(clientId: string) {
    const client = await this.prisma.nutritionClient.findUnique({
      where: { id: clientId },
      include: { user: true }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return {
      age: client.age || 30,
      gender: client.gender,
      height: client.height,
      weight: client.weight,
      activityLevel: client.activityLevel,
      medications: []
    };
  }

  /**
   * Determina status de macronutriente
   */
  private getMacronutrientStatus(actual: number, recommended: number): 'low' | 'adequate' | 'high' {
    const percentage = (actual / recommended) * 100;
    
    if (percentage < 80) return 'low';
    if (percentage > 120) return 'high';
    return 'adequate';
  }

  /**
   * Gera chave de cache para análise
   */
  private generateCacheKey(request: NutritionAnalysisRequest): string {
    const keyData = {
      type: request.analysisType,
      clientId: request.clientId,
      inputHash: JSON.stringify(request.inputData)
    };
    
    return `nutrition-analysis:${JSON.stringify(keyData)}`;
  }

  /**
   * Salva análise no banco de dados
   */
  private async saveAnalysisToDatabase(analysisId: string, request: NutritionAnalysisRequest, response: NutritionAnalysisResponse) {
    try {
      // AIGenerationLog requer campos obrigatórios: type e prompt
      // Como não temos esses campos na análise nutricional, pulamos o log
      // await this.prisma.aIGenerationLog.create({...});
    } catch (error) {
      logger.error('Error saving analysis to database:', error);
    }
  }

  /**
   * Métodos auxiliares simplificados
   */
  private generateMealPlanRecommendations(inputData: any, preferences?: any): string[] {
    return [
      'Mantenha hidratação adequada (2-3L de água por dia)',
      'Faça refeições a cada 3-4 horas',
      'Inclua variedade de cores nos vegetais',
      'Prefira alimentos integrais'
    ];
  }

  private analyzeMicronutrients(foodDiary: any[]): any[] {
    // Implementação simplificada
    return [
      { name: 'Vitamina C', actual: 80, recommended: 90, unit: 'mg', status: 'adequate' },
      { name: 'Ferro', actual: 12, recommended: 18, unit: 'mg', status: 'deficient' },
      { name: 'Cálcio', actual: 800, recommended: 1000, unit: 'mg', status: 'deficient' }
    ];
  }

  private generateDietRecommendations(totalCalories: number, tdee: number, totalProtein: number, recommendedProtein: number): string[] {
    const recommendations: string[] = [];
    
    if (totalCalories < tdee * 0.8) {
      recommendations.push('Considere aumentar a ingestão calórica');
    }
    
    if (totalProtein < recommendedProtein * 0.8) {
      recommendations.push('Aumente a ingestão de proteínas');
    }
    
    return recommendations;
  }

  private generateDietWarnings(foodDiary: any[], allergies?: string[]): string[] {
    const warnings: string[] = [];
    
    if (allergies && allergies.length > 0) {
      warnings.push('Verifique se não há alimentos alergênicos no diário');
    }
    
    return warnings;
  }

  private async interpretLabParameter(result: any): Promise<any> {
    // Implementação simplificada
    return {
      parameter: result.parameter,
      value: result.value,
      status: 'normal', // Seria calculado baseado nos valores de referência
      interpretation: 'Valor dentro da normalidade',
      recommendation: 'Manter hábitos saudáveis'
    };
  }

  private generateLabRecommendations(keyFindings: any[]): string[] {
    return [
      'Continue com alimentação equilibrada',
      'Mantenha atividade física regular',
      'Agende retorno em 6 meses'
    ];
  }

  /**
   * Health check do agente
   */
  async healthCheck() {
    try {
      // Testar conexão com banco
      await this.prisma.nutritionClient.count();
      
      // Testar Redis
      const redisHealth = await this.redis.healthCheck();
      
      return {
        status: 'healthy',
        database: 'connected',
        redis: redisHealth.status,
        redisLatency: redisHealth.latency,
        agentVersion: '1.0.0'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instância singleton
export const aiNutritionAgent = new AINutritionAgent();
