/**
 * Nutrition Services Index - FitOS Sprint 4
 * 
 * Exporta todos os services do módulo nutricional para facilitar importação.
 */

// Core Services
export { FoodDatabaseService } from './food-database.service';
export { MealPlanService } from './meal-plan.service';
export { RecipeService } from './recipe.service';
export { FoodDiaryService } from './food-diary.service';

// Professional & Client Services
export { NutritionProfessionalService } from './nutrition-professional.service';
export { NutritionClientService } from './nutrition-client.service';
export { NutritionConsultationService } from './nutrition-consultation.service';
export { NutritionGoalService } from './nutrition-goal.service';

// Advanced Services
export { LaboratoryExamService } from './laboratory-exam.service';
export { SupplementPrescriptionService } from './supplement-prescription.service';

// Service Instances (singletons)
export { foodDatabaseService } from './food-database.service';
export { mealPlanService } from './meal-plan.service';
export { recipeService } from './recipe.service';
export { foodDiaryService } from './food-diary.service';
export { nutritionProfessionalService } from './nutrition-professional.service';
export { nutritionClientService } from './nutrition-client.service';
export { nutritionConsultationService } from './nutrition-consultation.service';
export { nutritionGoalService } from './nutrition-goal.service';
export { laboratoryExamService } from './laboratory-exam.service';
export { supplementPrescriptionService } from './supplement-prescription.service';

// Types
export type {
  FoodCreateInput,
  FoodUpdateInput,
  FoodSearchFilters
} from './food-database.service';

export type {
  MealPlanCreateInput,
  MealPlanUpdateInput,
  MealInput,
  MealItemInput
} from './meal-plan.service';

export type {
  RecipeCreateInput,
  RecipeUpdateInput,
  RecipeSearchFilters,
  RecipeIngredientInput
} from './recipe.service';

export type {
  FoodDiaryEntryCreateInput,
  FoodDiaryEntryUpdateInput,
  FoodDiaryFilters
} from './food-diary.service';

export type {
  NutritionProfessionalCreateInput,
  NutritionProfessionalUpdateInput,
  NutritionProfessionalSearchFilters
} from './nutrition-professional.service';

export type {
  NutritionClientCreateInput,
  NutritionClientUpdateInput,
  NutritionClientSearchFilters
} from './nutrition-client.service';

export type {
  NutritionConsultationCreateInput,
  NutritionConsultationUpdateInput,
  NutritionConsultationFilters
} from './nutrition-consultation.service';

export type {
  NutritionGoalCreateInput,
  NutritionGoalUpdateInput,
  NutritionGoalFilters
} from './nutrition-goal.service';

export type {
  LaboratoryExamCreateInput,
  LaboratoryExamUpdateInput,
  LaboratoryExamFilters,
  ExamResultCreateInput,
  ExamAnalysisResult
} from './laboratory-exam.service';

export type {
  SupplementPrescriptionCreateInput,
  SupplementPrescriptionUpdateInput,
  SupplementPrescriptionFilters,
  SupplementStats
} from './supplement-prescription.service';
