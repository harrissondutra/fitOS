import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export interface BioimpedanceMeasurement {
  // Dados básicos
  weight: number; // Peso (kg)
  height: number; // Altura (cm)
  age: number; // Idade (anos)
  gender: 'male' | 'female'; // Gênero

  // Composição corporal básica
  totalBodyWater: number; // Água corporal total (L)
  protein: number; // Proteína (kg)
  minerals: number; // Minerais (kg)
  bodyFatMass: number; // Massa de gordura (kg)
  skeletalMuscleMass: number; // Massa muscular esquelética (kg)

  // Análise de obesidade
  bmi: number; // IMC
  bodyFatPercentage: number; // PGC - Porcentual de gordura corporal
  waistHipRatio?: number; // Relação cintura-quadril
  visceralFatLevel?: number; // Nível de gordura visceral (1-59)

  // Dados adicionais
  fatFreeMass: number; // Massa livre de gordura (kg)
  basalMetabolicRate: number; // TMB (kcal)
  obesityDegree: number; // Grau de obesidade (%)
  skeletalMuscleIndex: number; // SMI (kg/m²)
  recommendedCalories: number; // Ingestão calórica recomendada

  // Peso ideal e controles
  idealWeight: number; // Peso ideal (kg)
  weightControl: number; // Controle de peso (kg)
  fatControl: number; // Controle de gordura (kg)
  muscleControl: number; // Controle muscular (kg)

  // Análise segmentar - Massa magra
  leftArmMuscle: number; // Braço esquerdo (kg)
  rightArmMuscle: number; // Braço direito (kg)
  trunkMuscle: number; // Tronco (kg)
  leftLegMuscle: number; // Perna esquerda (kg)
  rightLegMuscle: number; // Perna direita (kg)

  // Análise segmentar - Gordura
  leftArmFat: number; // Gordura braço esquerdo (kg)
  rightArmFat: number; // Gordura braço direito (kg)
  trunkFat: number; // Gordura tronco (kg)
  leftLegFat: number; // Gordura perna esquerda (kg)
  rightLegFat: number; // Gordura perna direita (kg)

  // Impedância bioelétrica - 20kHz
  impedance20kRightArm?: number; // Impedância braço direito 20kHz
  impedance20kLeftArm?: number; // Impedância braço esquerdo 20kHz
  impedance20kTrunk?: number; // Impedância tronco 20kHz
  impedance20kRightLeg?: number; // Impedância perna direita 20kHz
  impedance20kLeftLeg?: number; // Impedância perna esquerda 20kHz

  // Impedância bioelétrica - 100kHz
  impedance100kRightArm?: number; // Impedância braço direito 100kHz
  impedance100kLeftArm?: number; // Impedância braço esquerdo 100kHz
  impedance100kTrunk?: number; // Impedância tronco 100kHz
  impedance100kRightLeg?: number; // Impedância perna direita 100kHz
  impedance100kLeftLeg?: number; // Impedância perna esquerda 100kHz

  // Dados adicionais
  notes?: string; // Observações
  equipment?: string; // Equipamento utilizado
  operator?: string; // Operador que fez a medição
}

export interface CreateMeasurementData {
  tenantId: string;
  clientId: string;
  professionalId: string;
  measurement: BioimpedanceMeasurement;
  measuredAt?: Date;
}

export interface UpdateMeasurementData {
  measurement?: Partial<BioimpedanceMeasurement>;
  notes?: string;
  measuredAt?: Date;
}

export interface MeasurementFilters {
  tenantId: string;
  clientId?: string;
  professionalId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class BioimpedanceService {
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  /**
   * Cria nova medição de bioimpedância
   */
  async createMeasurement(data: CreateMeasurementData, userId: string): Promise<{
    success: boolean;
    measurement?: any;
    error?: string;
  }> {
    try {
      // Valida dados obrigatórios
      const validation = this.validateMeasurement(data.measurement);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Calcula índices adicionais
      const calculatedData = this.calculateIndices(data.measurement);

      // Cria medição no banco usando o novo modelo
      const measurement = await prisma.bioimpedanceMeasurement.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          professionalId: data.professionalId,
          measurementId: (data.measurement as any).measurementId || `measurement_${Date.now()}`,
          measuredAt: data.measuredAt || new Date(),
          
          // Dados básicos
          height: data.measurement.height,
          age: data.measurement.age,
          gender: data.measurement.gender,
          weight: data.measurement.weight,
          
          // Composição corporal
          totalBodyWater: data.measurement.totalBodyWater,
          protein: data.measurement.protein,
          minerals: data.measurement.minerals,
          bodyFatMass: data.measurement.bodyFatMass,
          skeletalMuscleMass: data.measurement.skeletalMuscleMass,
          
          // Análise de obesidade
          bmi: data.measurement.bmi,
          bodyFatPercentage: data.measurement.bodyFatPercentage,
          waistHipRatio: data.measurement.waistHipRatio,
          visceralFatLevel: data.measurement.visceralFatLevel,
          
          // Dados adicionais
          fatFreeMass: data.measurement.fatFreeMass,
          basalMetabolicRate: data.measurement.basalMetabolicRate,
          obesityDegree: data.measurement.obesityDegree,
          skeletalMuscleIndex: data.measurement.skeletalMuscleIndex,
          recommendedCalories: data.measurement.recommendedCalories,
          
          // Controles
          idealWeight: data.measurement.idealWeight,
          weightControl: data.measurement.weightControl,
          fatControl: data.measurement.fatControl,
          muscleControl: data.measurement.muscleControl,
          
          // Análise segmentar - Massa magra
          leftArmMuscle: data.measurement.leftArmMuscle,
          rightArmMuscle: data.measurement.rightArmMuscle,
          trunkMuscle: data.measurement.trunkMuscle,
          leftLegMuscle: data.measurement.leftLegMuscle,
          rightLegMuscle: data.measurement.rightLegMuscle,
          
          // Análise segmentar - Gordura
          leftArmFat: data.measurement.leftArmFat,
          rightArmFat: data.measurement.rightArmFat,
          trunkFat: data.measurement.trunkFat,
          leftLegFat: data.measurement.leftLegFat,
          rightLegFat: data.measurement.rightLegFat,
          
          // Impedância bioelétrica - 20kHz
          impedance20kRightArm: data.measurement.impedance20kRightArm,
          impedance20kLeftArm: data.measurement.impedance20kLeftArm,
          impedance20kTrunk: data.measurement.impedance20kTrunk,
          impedance20kRightLeg: data.measurement.impedance20kRightLeg,
          impedance20kLeftLeg: data.measurement.impedance20kLeftLeg,
          
          // Impedância bioelétrica - 100kHz
          impedance100kRightArm: data.measurement.impedance100kRightArm,
          impedance100kLeftArm: data.measurement.impedance100kLeftArm,
          impedance100kTrunk: data.measurement.impedance100kTrunk,
          impedance100kRightLeg: data.measurement.impedance100kRightLeg,
          impedance100kLeftLeg: data.measurement.impedance100kLeftLeg,
          
          // Dados adicionais
          equipment: data.measurement.equipment,
          operator: data.measurement.operator,
          notes: data.measurement.notes,
          qrCode: (data.measurement as any).qrCode || null
        },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          professional: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: data.tenantId,
        userId,
        action: 'create',
        entityType: 'bioimpedance',
        entityId: measurement.id,
        changes: { after: measurement }
      });

      // Notificação
      await this.notificationService.createBioimpedanceNotification(
        data.professionalId,
        data.tenantId,
        measurement,
        'Cliente'
      );

      return { success: true, measurement };
    } catch (error: any) {
      console.error('Erro ao criar medição de bioimpedância:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualiza medição existente
   */
  async updateMeasurement(
    measurementId: string,
    data: UpdateMeasurementData,
    userId: string
  ): Promise<{ success: boolean; measurement?: any; error?: string }> {
    try {
      const existingMeasurement = await prisma.biometricData.findUnique({
        where: { id: measurementId }
      });

      if (!existingMeasurement) {
        return { success: false, error: 'Medição não encontrada' };
      }

      // Valida dados se fornecidos
      if (data.measurement) {
        const validation = this.validateMeasurement(data.measurement as BioimpedanceMeasurement);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Recalcula índices se dados básicos mudaram
        const calculatedData = this.calculateIndices(data.measurement as BioimpedanceMeasurement);
        data.measurement = { ...data.measurement, ...calculatedData };
      }

      const updatedMeasurement = await prisma.biometricData.update({
        where: { id: measurementId },
        data: {
          ...(data.measurement && { value: data.measurement.weight || 0 }),
          ...(data.notes && { notes: data.notes }),
          ...(data.measuredAt && { recordedAt: data.measuredAt })
        },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: existingMeasurement.tenantId,
        userId,
        action: 'update',
        entityType: 'bioimpedance',
        entityId: measurementId,
        changes: { before: existingMeasurement, after: updatedMeasurement }
      });

      return { success: true, measurement: updatedMeasurement };
    } catch (error: any) {
      console.error('Erro ao atualizar medição:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove medição
   */
  async deleteMeasurement(
    measurementId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const measurement = await prisma.biometricData.findUnique({
        where: { id: measurementId }
      });

      if (!measurement) {
        return { success: false, error: 'Medição não encontrada' };
      }

      await prisma.biometricData.delete({
        where: { id: measurementId }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: measurement.tenantId,
        userId,
        action: 'delete',
        entityType: 'bioimpedance',
        entityId: measurementId,
        changes: { before: measurement }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar medição:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista medições com filtros
   */
  async getMeasurements(filters: MeasurementFilters): Promise<{
    success: boolean;
    measurements?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      const where: any = {
        tenantId: filters.tenantId,
        type: 'bioimpedance'
      };

      if (filters.clientId) {
        where.clientId = filters.clientId;
      }

      if (filters.professionalId) {
        where.metadata = {
          path: ['professionalId'],
          equals: filters.professionalId
        };
      }

      if (filters.startDate || filters.endDate) {
        where.measuredAt = {};
        if (filters.startDate) {
          where.measuredAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.measuredAt.lte = filters.endDate;
        }
      }

      const [measurements, total] = await Promise.all([
        prisma.biometricData.findMany({
          where,
          include: {
            client: {
              select: { id: true, name: true, email: true }
            },
            tenant: {
              select: { id: true, name: true }
            }
          },
          orderBy: { recordedAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.biometricData.count({ where })
      ]);

      return { success: true, measurements, total };
    } catch (error: any) {
      console.error('Erro ao listar medições:', error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Obtém histórico de evolução de um cliente
   */
  async getClientEvolution(
    clientId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    success: boolean;
    evolution?: any[];
    error?: string;
  }> {
    try {
      const where: any = {
        clientId,
        tenantId,
        type: 'bioimpedance'
      };

      if (startDate || endDate) {
        where.measuredAt = {};
        if (startDate) {
          where.measuredAt.gte = startDate;
        }
        if (endDate) {
          where.measuredAt.lte = endDate;
        }
      }

      const evolution = await prisma.biometricData.findMany({
        where,
        select: {
          id: true,
          recordedAt: true,
          value: true,
          // notes: true
        },
        orderBy: { recordedAt: 'asc' }
      });

      return { success: true, evolution };
    } catch (error: any) {
      console.error('Erro ao obter evolução do membro:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Compara duas medições
   */
  async compareMeasurements(
    measurement1Id: string,
    measurement2Id: string
  ): Promise<{
    success: boolean;
    comparison?: any;
    error?: string;
  }> {
    try {
      const [measurement1, measurement2] = await Promise.all([
        prisma.biometricData.findUnique({
          where: { id: measurement1Id }
        }),
        prisma.biometricData.findUnique({
          where: { id: measurement2Id }
        })
      ]);

      if (!measurement1 || !measurement2) {
        return { success: false, error: 'Uma ou ambas as medições não foram encontradas' };
      }

      const data1 = measurement1 as any;
      const data2 = measurement2 as any;

      const comparison = {
        measurement1: {
          id: measurement1.id,
          measuredAt: measurement1.recordedAt,
          data: data1
        },
        measurement2: {
          id: measurement2.id,
          measuredAt: measurement2.recordedAt,
          data: data2
        },
        differences: this.calculateDifferences(data1, data2),
        timeDifference: measurement2.recordedAt.getTime() - measurement1.recordedAt.getTime()
      };

      return { success: true, comparison };
    } catch (error: any) {
      console.error('Erro ao comparar medições:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém estatísticas de bioimpedância
   */
  async getBioimpedanceStats(tenantId: string, clientId?: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const where: any = {
        tenantId,
        type: 'bioimpedance'
      };

      if (clientId) {
        where.clientId = clientId;
      }

      const measurements = await prisma.biometricData.findMany({
        where,
        select: { value: true, recordedAt: true },
        orderBy: { recordedAt: 'desc' }
      });

      if (measurements.length === 0) {
        return { success: true, stats: { total: 0 } };
      }

      const stats = this.calculateStats(measurements);
      return { success: true, stats };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Valida dados da medição
   */
  private validateMeasurement(measurement: BioimpedanceMeasurement): {
    valid: boolean;
    error?: string;
  } {
    const required = ['weight', 'height', 'age', 'gender', 'bodyFatPercentage', 'skeletalMuscleMass'];
    
    for (const field of required) {
      if (measurement[field as keyof BioimpedanceMeasurement] === undefined) {
        return { valid: false, error: `Campo obrigatório ausente: ${field}` };
      }
    }

    if (measurement.weight <= 0 || measurement.weight > 500) {
      return { valid: false, error: 'Peso deve estar entre 0 e 500 kg' };
    }

    if (measurement.height <= 0 || measurement.height > 300) {
      return { valid: false, error: 'Altura deve estar entre 0 e 300 cm' };
    }

    if (measurement.age <= 0 || measurement.age > 120) {
      return { valid: false, error: 'Idade deve estar entre 0 e 120 anos' };
    }

    if (measurement.bodyFatPercentage < 0 || measurement.bodyFatPercentage > 100) {
      return { valid: false, error: 'Gordura corporal deve estar entre 0 e 100%' };
    }

    return { valid: true };
  }

  /**
   * Calcula índices adicionais
   */
  private calculateIndices(measurement: BioimpedanceMeasurement): any {
    const { weight, height, age, gender, bodyFatPercentage, skeletalMuscleMass } = measurement;

    // IMC
    const bmi = weight / Math.pow(height / 100, 2);

    // Taxa metabólica basal (Harris-Benedict)
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Densidade corporal (Brozek)
    const bodyDensity = 1.10938 - (0.0008267 * bodyFatPercentage) + (0.0000016 * Math.pow(bodyFatPercentage, 2)) - (0.0002574 * age);

    // Idade metabólica (aproximação)
    const metabolicAge = Math.max(age - 5, Math.min(age + 10, 80));

    return {
      bmi: Math.round(bmi * 100) / 100,
      bmr: Math.round(bmr),
      bodyDensity: Math.round(bodyDensity * 1000) / 1000,
      metabolicAge
    };
  }

  /**
   * Calcula diferenças entre duas medições
   */
  private calculateDifferences(data1: any, data2: any): any {
    const differences: any = {};

    const fields = [
      'weight', 'bodyFatPercentage', 'skeletalMuscleMass', 'boneMass', 'waterPercentage',
      'visceralFat', 'bmi', 'bmr', 'metabolicAge'
    ];

    for (const field of fields) {
      if (data1[field] !== undefined && data2[field] !== undefined) {
        const diff = data2[field] - data1[field];
        const percentChange = data1[field] !== 0 ? (diff / data1[field]) * 100 : 0;
        
        differences[field] = {
          absolute: Math.round(diff * 100) / 100,
          percentage: Math.round(percentChange * 100) / 100
        };
      }
    }

    return differences;
  }

  /**
   * Calcula estatísticas das medições
   */
  private calculateStats(measurements: any[]): any {
    const data = measurements.map(m => m.data);
    
    const stats: any = {
      total: measurements.length,
      latest: data[0],
      oldest: data[data.length - 1],
      averages: {},
      trends: {}
    };

    // Calcula médias
    const fields = ['weight', 'bodyFatPercentage', 'skeletalMuscleMass', 'bmi', 'bmr'];
    for (const field of fields) {
      const values = data.map(d => d[field]).filter(v => v !== undefined);
      if (values.length > 0) {
        stats.averages[field] = Math.round(
          (values.reduce((a, b) => a + b, 0) / values.length) * 100
        ) / 100;
      }
    }

    // Calcula tendências (últimas 3 medições)
    if (data.length >= 2) {
      const latest = data[0];
      const previous = data[1];
      
      for (const field of fields) {
        if (latest[field] !== undefined && previous[field] !== undefined) {
          const change = latest[field] - previous[field];
          stats.trends[field] = {
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            change: Math.round(change * 100) / 100
          };
        }
      }
    }

    return stats;
  }

  /**
   * Busca medições de bioimpedância de um cliente
   */
  async getClientMeasurements(
    clientId: string, 
    tenantId: string, 
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    success: boolean;
    measurements?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      const measurements = await prisma.bioimpedanceMeasurement.findMany({
        where: {
          clientId,
          tenantId
        },
        orderBy: {
          measuredAt: 'desc'
        },
        take: limit,
        skip: offset,
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      const total = await prisma.bioimpedanceMeasurement.count({
        where: {
          clientId,
          tenantId
        }
      });

      return {
        success: true,
        measurements,
        total
      };
    } catch (error: any) {
      console.error('Erro ao buscar medições:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Busca medição específica por ID
   */
  async getMeasurementById(
    measurementId: string,
    tenantId: string
  ): Promise<{
    success: boolean;
    measurement?: any;
    error?: string;
  }> {
    try {
      const measurement = await prisma.bioimpedanceMeasurement.findFirst({
        where: {
          id: measurementId,
          tenantId
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!measurement) {
        return { success: false, error: 'Medição não encontrada' };
      }

      return {
        success: true,
        measurement
      };
    } catch (error: any) {
      console.error('Erro ao buscar medição:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gera análise completa baseada no relatório InBody
   */
  async generateAnalysis(measurement: any): Promise<any> {
    const analysis = {
      // Análise de composição corporal
      bodyComposition: {
        totalBodyWater: {
          value: measurement.totalBodyWater,
          normal: measurement.normalWeightRange,
          classification: this.classifyValue(
            measurement.totalBodyWater,
            measurement.normalWeightRange.min,
            measurement.normalWeightRange.max
          )
        },
        protein: {
          value: measurement.protein,
          normal: measurement.normalMuscleRange,
          classification: this.classifyValue(
            measurement.protein,
            measurement.normalMuscleRange.min,
            measurement.normalMuscleRange.max
          )
        },
        minerals: {
          value: measurement.minerals,
          normal: measurement.normalFatRange,
          classification: this.classifyValue(
            measurement.minerals,
            measurement.normalFatRange.min,
            measurement.normalFatRange.max
          )
        },
        bodyFatMass: {
          value: measurement.bodyFatMass,
          normal: measurement.normalFatRange,
          classification: this.classifyValue(
            measurement.bodyFatMass,
            measurement.normalFatRange.min,
            measurement.normalFatRange.max
          )
        },
        weight: {
          value: measurement.weight,
          normal: measurement.normalWeightRange,
          classification: this.classifyValue(
            measurement.weight,
            measurement.normalWeightRange.min,
            measurement.normalWeightRange.max
          )
        }
      },
      
      // Análise músculo-gordura
      muscleFatAnalysis: {
        weight: {
          value: measurement.weight,
          percentage: 100,
          classification: measurement.weightClassification || 'Normal'
        },
        skeletalMuscleMass: {
          value: measurement.skeletalMuscleMass,
          percentage: (measurement.skeletalMuscleMass / measurement.weight) * 100,
          classification: measurement.muscleClassification || 'Normal'
        },
        bodyFatMass: {
          value: measurement.bodyFatMass,
          percentage: measurement.bodyFatPercentage,
          classification: measurement.fatClassification || 'Normal'
        }
      },
      
      // Análise de obesidade
      obesityAnalysis: {
        bmi: {
          value: measurement.bmi,
          normal: measurement.normalBMIRange,
          classification: measurement.bmiClassification || 'Normal'
        },
        bodyFatPercentage: {
          value: measurement.bodyFatPercentage,
          normal: measurement.normalBodyFatRange,
          classification: measurement.bodyFatClassification || 'Normal'
        }
      },
      
      // Controle de peso
      weightControl: {
        idealWeight: measurement.idealWeight,
        weightControl: measurement.weightControl,
        fatControl: measurement.fatControl,
        muscleControl: measurement.muscleControl
      },
      
      // Relação cintura-quadril
      waistHipRatio: {
        value: measurement.waistHipRatio || 0,
        normal: measurement.normalWaistHipRange,
        classification: this.classifyValue(
          measurement.waistHipRatio || 0,
          measurement.normalWaistHipRange.min,
          measurement.normalWaistHipRange.max
        )
      },
      
      // Gordura visceral
      visceralFat: {
        level: measurement.visceralFatLevel || 0,
        classification: this.classifyVisceralFat(measurement.visceralFatLevel || 0)
      },
      
      // Dados adicionais
      additionalData: {
        fatFreeMass: {
          value: measurement.fatFreeMass,
          normal: { min: 0, max: 100 },
          classification: 'Normal'
        },
        basalMetabolicRate: {
          value: measurement.basalMetabolicRate,
          normal: { min: 1200, max: 3000 },
          classification: 'Normal'
        },
        obesityDegree: {
          value: measurement.obesityDegree,
          normal: { min: 90, max: 110 },
          classification: this.classifyValue(measurement.obesityDegree, 90, 110)
        },
        skeletalMuscleIndex: measurement.skeletalMuscleIndex,
        recommendedCalories: measurement.recommendedCalories
      },
      
      // Análise segmentar
      segmentalAnalysis: {
        muscle: {
          leftArm: {
            value: measurement.leftArmMuscle,
            percentage: (measurement.leftArmMuscle / measurement.skeletalMuscleMass) * 100,
            classification: 'Normal'
          },
          rightArm: {
            value: measurement.rightArmMuscle,
            percentage: (measurement.rightArmMuscle / measurement.skeletalMuscleMass) * 100,
            classification: 'Normal'
          },
          trunk: {
            value: measurement.trunkMuscle,
            percentage: (measurement.trunkMuscle / measurement.skeletalMuscleMass) * 100,
            classification: 'Normal'
          },
          leftLeg: {
            value: measurement.leftLegMuscle,
            percentage: (measurement.leftLegMuscle / measurement.skeletalMuscleMass) * 100,
            classification: 'Normal'
          },
          rightLeg: {
            value: measurement.rightLegMuscle,
            percentage: (measurement.rightLegMuscle / measurement.skeletalMuscleMass) * 100,
            classification: 'Normal'
          }
        },
        fat: {
          leftArm: {
            value: measurement.leftArmFat,
            percentage: (measurement.leftArmFat / measurement.bodyFatMass) * 100,
            classification: 'Normal'
          },
          rightArm: {
            value: measurement.rightArmFat,
            percentage: (measurement.rightArmFat / measurement.bodyFatMass) * 100,
            classification: 'Normal'
          },
          trunk: {
            value: measurement.trunkFat,
            percentage: (measurement.trunkFat / measurement.bodyFatMass) * 100,
            classification: 'Normal'
          },
          leftLeg: {
            value: measurement.leftLegFat,
            percentage: (measurement.leftLegFat / measurement.bodyFatMass) * 100,
            classification: 'Normal'
          },
          rightLeg: {
            value: measurement.rightLegFat,
            percentage: (measurement.rightLegFat / measurement.bodyFatMass) * 100,
            classification: 'Normal'
          }
        }
      },
      
      // Pontuação InBody
      inbodyScore: {
        total: measurement.inbodyScore || 0,
        max: 100,
        classification: this.classifyInbodyScore(measurement.inbodyScore || 0)
      }
    };

    return analysis;
  }

  /**
   * Gera estimativas de calorias para exercícios
   */
  generateExerciseCalorieEstimates(weight: number): any[] {
    const activities = [
      { name: 'Golfe', mets: 4.8 },
      { name: 'Gate-ball', mets: 5.2 },
      { name: 'Caminhada', mets: 5.5 },
      { name: 'Ioga', mets: 5.5 },
      { name: 'Badminton', mets: 6.2 },
      { name: 'Tênis de mesa', mets: 6.2 },
      { name: 'Tênis', mets: 8.2 },
      { name: 'Ciclismo', mets: 8.2 },
      { name: 'Boxe', mets: 8.2 },
      { name: 'Basquetebol', mets: 8.2 },
      { name: 'Escalada', mets: 8.9 },
      { name: 'Pular corda', mets: 9.6 },
      { name: 'Aeróbica', mets: 9.6 },
      { name: 'Jogging', mets: 9.6 },
      { name: 'Futebol', mets: 9.6 },
      { name: 'Natação', mets: 9.6 },
      { name: 'Esgrima japonesa', mets: 13.7 },
      { name: 'Raquetebol', mets: 13.7 },
      { name: 'Squash', mets: 13.7 },
      { name: 'Taekwondo', mets: 13.7 }
    ];

    return activities.map(activity => {
      const calories30min = (activity.mets * weight * 0.5).toFixed(0);
      const calories60min = (activity.mets * weight).toFixed(0);
      
      return {
        activity: activity.name,
        calories30min: parseInt(calories30min),
        calories60min: parseInt(calories60min),
        intensity: this.getIntensityLevel(activity.mets)
      };
    });
  }

  /**
   * Classifica valor baseado em faixa normal
   */
  private classifyValue(value: number, min: number, max: number): string {
    if (value < min) return 'Abaixo';
    if (value > max) return 'Acima';
    return 'Normal';
  }

  /**
   * Classifica gordura visceral
   */
  private classifyVisceralFat(level: number): string {
    if (level < 10) return 'Normal';
    if (level < 15) return 'Levemente elevado';
    return 'Elevado';
  }

  /**
   * Classifica pontuação InBody
   */
  private classifyInbodyScore(score: number): string {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Bom';
    if (score >= 70) return 'Regular';
    return 'Precisa melhorar';
  }

  /**
   * Determina nível de intensidade baseado em METs
   */
  private getIntensityLevel(mets: number): string {
    if (mets < 3) return 'low';
    if (mets < 6) return 'moderate';
    if (mets < 10) return 'high';
    return 'very_high';
  }

  /**
   * BodyScan AI - Análise corporal por fotos usando OpenAI Vision
   * Sprint 7 - Nova funcionalidade
   */
  async analyzeByPhotos(data: {
    tenantId: string;
    clientId: string;
    professionalId: string;
    frontPhotoUrl: string;
    sidePhotoUrl: string;
    clientAge?: number;
    clientGender?: 'male' | 'female' | 'other';
    clientHeight?: number;
  }): Promise<any> {
    try {
      // Importar dinamicamente para evitar dependência circular
      const { PhotoBodyAnalysisService } = await import('./nutrition/photo-body-analysis.service');
      const photoAnalysisService = new PhotoBodyAnalysisService();
      
      // Obter dados do cliente
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        select: { birthDate: true, gender: true, height: true }
      });

      const clientAge = data.clientAge || (client?.birthDate ? this.calculateAge(client.birthDate) : 30);
      const clientGender = data.clientGender || (client?.gender as any) || 'other';
      const clientHeight = data.clientHeight || client?.height || undefined;

      // Chamar IA para análise
      const aiResult = await photoAnalysisService.analyzeBodyComposition({
        frontPhotoUrl: data.frontPhotoUrl,
        sidePhotoUrl: data.sidePhotoUrl,
        clientAge,
        clientGender,
        clientHeight
      });

      // Criar medição no banco
      const measurement = await prisma.bioimpedanceMeasurement.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          professionalId: data.professionalId,
          measurementId: `photo_ai_${Date.now()}`,
          measuredAt: new Date(),
          
          // Dados básicos
          height: aiResult.estimatedHeight || clientHeight || 170,
          age: clientAge,
          gender: clientGender,
          weight: aiResult.estimatedWeight,
          
          // Dados estimados pela IA
          totalBodyWater: aiResult.estimatedTotalBodyWater || 35,
          protein: 10, // Estimativa padrão
          minerals: 3, // Estimativa padrão
          bodyFatMass: aiResult.estimatedFatMass || 15,
          skeletalMuscleMass: aiResult.estimatedMuscleMass || 40,
          
          // Análise de obesidade
          bmi: aiResult.estimatedBMI,
          bodyFatPercentage: aiResult.estimatedBodyFat,
          visceralFatLevel: Math.round(aiResult.estimatedVisceralFat),
          
          // Dados adicionais
          fatFreeMass: aiResult.estimatedWeight - (aiResult.estimatedFatMass || 15),
          basalMetabolicRate: aiResult.estimatedBasalMetabolicRate || 1600,
          obesityDegree: 100 * ((aiResult.estimatedBMI || 22) / 25),
          skeletalMuscleIndex: 8.5, // Estimativa padrão
          recommendedCalories: (aiResult.estimatedBasalMetabolicRate || 1600) * 1.3,
          
          // Controles
          idealWeight: 70, // Seria calculado baseado na altura
          weightControl: 0,
          fatControl: 0,
          muscleControl: 0,
          
          // Análise segmentar - Estimativas aproximadas
          leftArmMuscle: 3,
          rightArmMuscle: 3,
          trunkMuscle: 20,
          leftLegMuscle: 7,
          rightLegMuscle: 7,
          
          leftArmFat: 1.5,
          rightArmFat: 1.5,
          trunkFat: 8,
          leftLegFat: 3,
          rightLegFat: 3,
          
          // Marcadores de origem BodyScan AI
          inbodyDataSource: 'photo_ai',
          inbodyDeviceModel: 'BodyScan AI',
          frontPhotoUrl: data.frontPhotoUrl,
          sidePhotoUrl: data.sidePhotoUrl,
          photoAnalysis: aiResult.fullAnalysis,
          photoAnalyzedAt: new Date(),
          aiCostTracked: true,
          
          notes: 'Análise realizada por IA com base em fotografias'
        }
      });

      // Notificação e auditoria
      await this.notificationService.sendNotification({
        userId: data.clientId,
        type: 'measurement_created',
        title: 'Nova análise corporal',
        message: 'Análise por fotos concluída com sucesso',
        data: { measurementId: measurement.id }
      });

      await this.auditService.log({
        userId: data.professionalId,
        action: 'bioimpedance_photo_analysis',
        resource: 'bioimpedance_measurement',
        resourceId: measurement.id,
        metadata: { method: 'photo_ai' }
      });

      return {
        success: true,
        measurement
      };
    } catch (error: any) {
      console.error('BodyScan AI error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calcula idade a partir da data de nascimento
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

export default new BioimpedanceService();
