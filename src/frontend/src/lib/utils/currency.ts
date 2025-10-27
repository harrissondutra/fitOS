/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value - Valor numérico
 * @returns String formatada como "R$ 99,90"
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Converte string de moeda para número
 * @param str - String como "R$ 99,90"
 * @returns Número
 */
export const parseCurrency = (str: string): number => {
  // Remove símbolos e converte vírgula para ponto
  const cleanStr = str
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleanStr) || 0;
};

/**
 * Formata valores grandes com sufixo (K, M)
 * @param value - Valor numérico
 * @returns String formatada como "R$ 10K" ou "R$ 1M"
 */
export const formatLargeCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
};

