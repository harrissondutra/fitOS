// FitOS IndexedDB Manager
// Gerenciador de banco de dados local para PWA

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FitOSDB extends DBSchema {
  workouts: {
    key: string;
    value: WorkoutData;
    indexes: {
      'by-date': Date;
      'by-type': string;
      'by-status': string;
    };
  };
  exercises: {
    key: string;
    value: ExerciseData;
    indexes: {
      'by-category': string;
      'by-muscle-group': string;
      'by-equipment': string;
    };
  };
  progress: {
    key: string;
    value: ProgressData;
    indexes: {
      'by-date': Date;
      'by-type': string;
      'by-metric': string;
    };
  };
  nutrition: {
    key: string;
    value: NutritionData;
    indexes: {
      'by-date': Date;
      'by-meal': string;
      'by-type': string;
    };
  };
  chat: {
    key: string;
    value: ChatData;
    indexes: {
      'by-timestamp': Date;
      'by-sender': string;
      'by-recipient': string;
    };
  };
  settings: {
    key: string;
    value: SettingsData;
  };
  cache: {
    key: string;
    value: CacheData;
    indexes: {
      'by-type': string;
      'by-expiry': Date;
    };
  };
}

// Interfaces de dados
export interface WorkoutData {
  id: string;
  name: string;
  description?: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'custom';
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  exercises: ExerciseInWorkout[];
  duration?: number; // em minutos
  caloriesBurned?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  synced: boolean;
}

export interface ExerciseInWorkout {
  exerciseId: string;
  name: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number; // em segundos
  distance?: number; // em metros
  restTime?: number; // em segundos
  notes?: string;
  completed: boolean;
}

export interface ExerciseData {
  id: string;
  name: string;
  description?: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface ProgressData {
  id: string;
  type: 'weight' | 'measurements' | 'photos' | 'metrics' | 'goals';
  value: any;
  unit?: string;
  notes?: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface NutritionData {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface ChatData {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  recipientName?: string;
  type: 'text' | 'image' | 'file' | 'workout' | 'nutrition';
  metadata?: any;
  timestamp: Date;
  read: boolean;
  synced: boolean;
}

export interface SettingsData {
  key: string;
  value: any;
  updatedAt: Date;
}

export interface CacheData {
  key: string;
  value: any;
  type: string;
  expiry: Date;
  createdAt: Date;
}

export class IndexedDBManager {
  private db: IDBPDatabase<FitOSDB> | null = null;
  private dbName = 'fitos-db';
  private version = 1;

  // Inicializar banco de dados
  async init(): Promise<boolean> {
    try {
      this.db = await openDB<FitOSDB>(this.dbName, this.version, {
        upgrade(db) {
          // Tabela de treinos
          if (!db.objectStoreNames.contains('workouts')) {
            const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
            workoutStore.createIndex('by-date', 'createdAt');
            workoutStore.createIndex('by-type', 'type');
            workoutStore.createIndex('by-status', 'status');
          }

          // Tabela de exercícios
          if (!db.objectStoreNames.contains('exercises')) {
            const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
            exerciseStore.createIndex('by-category', 'category');
            exerciseStore.createIndex('by-muscle-group', 'muscleGroups');
            exerciseStore.createIndex('by-equipment', 'equipment');
          }

          // Tabela de progresso
          if (!db.objectStoreNames.contains('progress')) {
            const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
            progressStore.createIndex('by-date', 'recordedAt');
            progressStore.createIndex('by-type', 'type');
            progressStore.createIndex('by-metric', 'type');
          }

          // Tabela de nutrição
          if (!db.objectStoreNames.contains('nutrition')) {
            const nutritionStore = db.createObjectStore('nutrition', { keyPath: 'id' });
            nutritionStore.createIndex('by-date', 'loggedAt');
            nutritionStore.createIndex('by-meal', 'mealType');
            nutritionStore.createIndex('by-type', 'mealType');
          }

          // Tabela de chat
          if (!db.objectStoreNames.contains('chat')) {
            const chatStore = db.createObjectStore('chat', { keyPath: 'id' });
            chatStore.createIndex('by-timestamp', 'timestamp');
            chatStore.createIndex('by-sender', 'senderId');
            chatStore.createIndex('by-recipient', 'recipientId');
          }

          // Tabela de configurações
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }

          // Tabela de cache
          if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
            cacheStore.createIndex('by-type', 'type');
            cacheStore.createIndex('by-expiry', 'expiry');
          }
        },
      });

      console.log('[IndexedDB] Database initialized successfully');
      return true;
    } catch (error) {
      console.error('[IndexedDB] Database initialization failed:', error);
      return false;
    }
  }

  // Verificar se o banco está inicializado
  private ensureDB(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
  }

  // ===== WORKOUTS =====

  async saveWorkout(workout: WorkoutData): Promise<boolean> {
    this.ensureDB();
    try {
      await this.db!.put('workouts', workout);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save workout:', error);
      return false;
    }
  }

  async getWorkout(id: string): Promise<WorkoutData | null> {
    this.ensureDB();
    try {
      return await this.db!.get('workouts', id) || null;
    } catch (error) {
      console.error('[IndexedDB] Failed to get workout:', error);
      return null;
    }
  }

  async getWorkouts(limit?: number, offset?: number): Promise<WorkoutData[]> {
    this.ensureDB();
    try {
      const workouts = await this.db!.getAllFromIndex('workouts', 'by-date');
      const sorted = workouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      if (limit) {
        const start = offset || 0;
        return sorted.slice(start, start + limit);
      }
      
      return sorted;
    } catch (error) {
      console.error('[IndexedDB] Failed to get workouts:', error);
      return [];
    }
  }

  async deleteWorkout(id: string): Promise<boolean> {
    this.ensureDB();
    try {
      await this.db!.delete('workouts', id);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to delete workout:', error);
      return false;
    }
  }

  // ===== EXERCISES =====

  async saveExercise(exercise: ExerciseData): Promise<boolean> {
    this.ensureDB();
    try {
      await this.db!.put('exercises', exercise);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save exercise:', error);
      return false;
    }
  }

  async getExercise(id: string): Promise<ExerciseData | null> {
    this.ensureDB();
    try {
      return await this.db!.get('exercises', id) || null;
    } catch (error) {
      console.error('[IndexedDB] Failed to get exercise:', error);
      return null;
    }
  }

  async getExercisesByCategory(category: string): Promise<ExerciseData[]> {
    this.ensureDB();
    try {
      return await this.db!.getAllFromIndex('exercises', 'by-category', category);
    } catch (error) {
      console.error('[IndexedDB] Failed to get exercises by category:', error);
      return [];
    }
  }

  // ===== PROGRESS =====

  async saveProgress(progress: ProgressData): Promise<boolean> {
    this.ensureDB();
    try {
      await this.db!.put('progress', progress);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save progress:', error);
      return false;
    }
  }

  async getProgressByType(type: string, limit?: number): Promise<ProgressData[]> {
    this.ensureDB();
    try {
      const progress = await this.db!.getAllFromIndex('progress', 'by-type', type);
      const sorted = progress.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
      
      if (limit) {
        return sorted.slice(0, limit);
      }
      
      return sorted;
    } catch (error) {
      console.error('[IndexedDB] Failed to get progress by type:', error);
      return [];
    }
  }

  // ===== NUTRITION =====

  async saveNutrition(nutrition: NutritionData): Promise<boolean> {
    this.ensureDB();
    try {
      await this.db!.put('nutrition', nutrition);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save nutrition:', error);
      return false;
    }
  }

  async getNutritionByDate(date: Date): Promise<NutritionData[]> {
    this.ensureDB();
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const nutrition = await this.db!.getAllFromIndex('nutrition', 'by-date');
      return nutrition.filter(n => n.loggedAt >= startOfDay && n.loggedAt <= endOfDay);
    } catch (error) {
      console.error('[IndexedDB] Failed to get nutrition by date:', error);
      return [];
    }
  }

  // ===== CHAT =====

  async saveChatMessage(chat: ChatData): Promise<boolean> {
    this.ensureDB();
    try {
      await this.db!.put('chat', chat);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save chat message:', error);
      return false;
    }
  }

  async getChatMessages(limit?: number): Promise<ChatData[]> {
    this.ensureDB();
    try {
      const messages = await this.db!.getAllFromIndex('chat', 'by-timestamp');
      const sorted = messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      if (limit) {
        return sorted.slice(0, limit);
      }
      
      return sorted;
    } catch (error) {
      console.error('[IndexedDB] Failed to get chat messages:', error);
      return [];
    }
  }

  // ===== SETTINGS =====

  async saveSetting(key: string, value: any): Promise<boolean> {
    this.ensureDB();
    try {
      const setting: SettingsData = {
        key,
        value,
        updatedAt: new Date(),
      };
      await this.db!.put('settings', setting);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save setting:', error);
      return false;
    }
  }

  async getSetting(key: string): Promise<any> {
    this.ensureDB();
    try {
      const setting = await this.db!.get('settings', key);
      return setting?.value || null;
    } catch (error) {
      console.error('[IndexedDB] Failed to get setting:', error);
      return null;
    }
  }

  // ===== CACHE =====

  async saveToCache(key: string, value: any, type: string, expiryMinutes: number = 60): Promise<boolean> {
    this.ensureDB();
    try {
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
      
      const cacheData: CacheData = {
        key,
        value,
        type,
        expiry,
        createdAt: new Date(),
      };
      
      await this.db!.put('cache', cacheData);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save to cache:', error);
      return false;
    }
  }

  async getFromCache(key: string): Promise<any> {
    this.ensureDB();
    try {
      const cacheData = await this.db!.get('cache', key);
      
      if (!cacheData) return null;
      
      // Verificar se expirou
      if (new Date() > cacheData.expiry) {
        await this.db!.delete('cache', key);
        return null;
      }
      
      return cacheData.value;
    } catch (error) {
      console.error('[IndexedDB] Failed to get from cache:', error);
      return null;
    }
  }

  // ===== UTILITIES =====

  async clearExpiredCache(): Promise<number> {
    this.ensureDB();
    try {
      const now = new Date();
      const cacheData = await this.db!.getAll('cache');
      const expired = cacheData.filter(item => item.expiry < now);
      
      for (const item of expired) {
        await this.db!.delete('cache', item.key);
      }
      
      return expired.length;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear expired cache:', error);
      return 0;
    }
  }

  async getDatabaseSize(): Promise<number> {
    this.ensureDB();
    try {
      // Esta é uma estimativa simples
      const stores: (keyof FitOSDB)[] = ['workouts', 'exercises', 'progress', 'nutrition', 'chat', 'settings', 'cache'];
      let totalSize = 0;
      
      for (const storeName of stores) {
        const data = await this.db!.getAll(storeName as any);
        totalSize += JSON.stringify(data).length;
      }
      
      return totalSize;
    } catch (error) {
      console.error('[IndexedDB] Failed to get database size:', error);
      return 0;
    }
  }

  async clearDatabase(): Promise<boolean> {
    this.ensureDB();
    try {
      const stores: (keyof FitOSDB)[] = ['workouts', 'exercises', 'progress', 'nutrition', 'chat', 'settings', 'cache'];
      
      for (const storeName of stores) {
        await this.db!.clear(storeName as any);
      }
      
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear database:', error);
      return false;
    }
  }
}

// Instância singleton
let dbInstance: IndexedDBManager | null = null;

export function getIndexedDB(): IndexedDBManager {
  if (!dbInstance) {
    dbInstance = new IndexedDBManager();
  }
  return dbInstance;
}

// Função de conveniência para inicializar
export async function initIndexedDB(): Promise<IndexedDBManager> {
  const db = getIndexedDB();
  await db.init();
  return db;
}
