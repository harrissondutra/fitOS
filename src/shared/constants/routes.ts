export const ROUTES = {
  NUTRITION_CLIENT: {
    BASE: '/nutrition-client',
    DASHBOARD: '/nutrition-client/dashboard',
    DIET: '/nutrition-client/dieta',
    DIARY: '/nutrition-client/diary',
    MEAL_PLAN: '/nutrition-client/meal-plan',
    PROGRESS: '/nutrition-client/progress',
    CONSULTATIONS: '/nutrition-client/consultations',
  },
} as const;

export type RouteKeys = typeof ROUTES;


