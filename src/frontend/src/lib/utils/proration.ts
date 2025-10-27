interface PlanPricing {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
}

interface ProrationResult {
  proratedAmount: number;
  remainingDays: number;
  totalDays: number;
  creditAmount: number;
  newAmount: number;
}

/**
 * Calcula o prorata para mudança de plano
 * @param currentPlan - Plano atual
 * @param newPlan - Novo plano
 * @param periodStart - Data de início do período
 * @param periodEnd - Data de fim do período
 * @returns Resultado do cálculo de prorata
 */
export function calculateProration(
  currentPlan: PlanPricing,
  newPlan: PlanPricing,
  periodStart: Date,
  periodEnd: Date
): ProrationResult {
  const now = new Date();
  const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const currentPrice = currentPlan.price.monthly;
  const newPrice = newPlan.price.monthly;
  
  // Crédito pelo tempo não usado do plano atual (se downgrade)
  const creditAmount = remainingDays > 0 
    ? (currentPrice / totalDays) * remainingDays 
    : 0;
  
  // Novo valor proporcional
  const proratedAmount = remainingDays > 0
    ? (newPrice / totalDays) * remainingDays
    : newPrice;
  
  // Se upgrade: valor adicional
  // Se downgrade: pode ter crédito
  const additionalAmount = newPrice > currentPrice
    ? proratedAmount - creditAmount
    : Math.max(0, proratedAmount - creditAmount);
  
  return {
    proratedAmount,
    remainingDays,
    totalDays,
    creditAmount,
    newAmount: additionalAmount
  };
}

/**
 * Formata resultado de prorata para exibição
 * @param proration - Resultado do cálculo de prorata
 * @returns String formatada
 */
export function formatProration(proration: ProrationResult): string {
  const { formatCurrency } = require('./currency');
  
  if (proration.newAmount > 0) {
    return `Cobrança adicional de ${formatCurrency(proration.newAmount)}`;
  } else if (proration.creditAmount > proration.proratedAmount) {
    return `Crédito de ${formatCurrency(proration.creditAmount - proration.proratedAmount)}`;
  }
  return 'Sem cobrança adicional';
}

/**
 * Verifica se mudança de plano requer prorata
 * @param currentPlanId - ID do plano atual
 * @param newPlanId - ID do novo plano
 * @returns true se precisa de prorata
 */
export function requiresProration(currentPlanId: string, newPlanId: string): boolean {
  return currentPlanId !== newPlanId;
}

