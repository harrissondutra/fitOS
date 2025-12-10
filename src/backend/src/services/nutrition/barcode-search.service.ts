/**
 * Barcode Search Service - Sprint 7
 * Busca de alimentos por código de barras
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';

const prisma = getPrismaClient();

/**
 * Buscar alimento por código de barras
 */
export async function searchFoodByBarcode(barcode: string) {
  try {
    logger.info(`Searching barcode: ${barcode}`);

    // 1. Buscar no banco local primeiro
    const localFood = await prisma.food.findUnique({
      where: { barcode }
    });

    if (localFood) {
      logger.info(`Found food locally: ${localFood.name}`);
      return {
        source: 'local',
        food: localFood
      };
    }

    // 2. Buscar no Open Food Facts (API gratuita)
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );

      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        
        // Transformar dados Open Food Facts para nosso formato
        const food = {
          name: product.product_name || product.product_name_pt || 'Produto não identificado',
          brand: product.brands || null,
          barcode: barcode,
          calories: (product.nutriments?.['energy-kcal_100g'] || 0) / 100,
          protein: (product.nutriments?.['proteins_100g'] || 0) / 100,
          carbs: (product.nutriments?.['carbohydrates_100g'] || 0) / 100,
          fat: (product.nutriments?.['fat_100g'] || 0) / 100,
          fiber: (product.nutriments?.['fiber_100g'] || 0) / 100,
          sugar: (product.nutriments?.['sugars_100g'] || 0) / 100,
          sodium: (product.nutriments?.['sodium_100g'] || 0) / 1000, // g para mg
          category: 'processed',
          source: 'openfoodfacts',
          servingSize: 100,
          servingUnit: 'g'
        };

        logger.info(`Found food in Open Food Facts: ${food.name}`);
        
        return {
          source: 'openfoodfacts',
          food
        };
      }
    } catch (error) {
      logger.warn(`Open Food Facts API error for barcode ${barcode}:`, error);
    }

    // 3. Não encontrado em nenhuma fonte
    logger.warn(`Food not found for barcode: ${barcode}`);
    
    return {
      source: 'not_found',
      food: null
    };

  } catch (error) {
    logger.error('Error searching barcode:', error);
    throw error;
  }
}

/**
 * Salvar alimento encontrado no banco local
 */
export async function saveFoodFromExternalSource(food: any) {
  try {
    const saved = await prisma.food.create({
      data: food
    });

    logger.info(`Saved external food to local database: ${saved.name}`);
    return saved;

  } catch (error) {
    logger.error('Error saving food:', error);
    throw error;
  }
}




