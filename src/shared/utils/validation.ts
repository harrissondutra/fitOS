/**
 * Utilitários de Validação de Documentos - FitOS
 * 
 * Validação de CPF e CNPJ seguindo algoritmos oficiais brasileiros
 */

import { DocumentType } from '../types/subscription.types';

// ============================================================================
// VALIDAÇÃO DE CPF
// ============================================================================

/**
 * Valida CPF brasileiro
 * @param cpf - CPF com ou sem formatação
 * @returns true se o CPF é válido
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verificar tamanho
  if (cleanCPF.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validar dígitos verificadores
  let sum = 0;
  let remainder: number;

  // Validar primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

// ============================================================================
// VALIDAÇÃO DE CNPJ
// ============================================================================

/**
 * Valida CNPJ brasileiro
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se o CNPJ é válido
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verificar tamanho
  if (cleanCNPJ.length !== 14) return false;
  
  // Eliminar CNPJs conhecidos como inválidos
  if (cleanCNPJ === '00000000000000' || 
      cleanCNPJ === '11111111111111' || 
      cleanCNPJ === '22222222222222' ||
      cleanCNPJ === '33333333333333' || 
      cleanCNPJ === '44444444444444' ||
      cleanCNPJ === '55555555555555' ||
      cleanCNPJ === '66666666666666' ||
      cleanCNPJ === '77777777777777' ||
      cleanCNPJ === '88888888888888' ||
      cleanCNPJ === '99999999999999') {
    return false;
  }

  // Validar dígitos verificadores
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;

  // Validar primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validar segundo dígito verificador
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

// ============================================================================
// VALIDAÇÃO GERAL
// ============================================================================

/**
 * Valida documento baseado no tipo
 * @param document - CPF ou CNPJ com ou sem formatação
 * @param type - Tipo do documento ('cpf' ou 'cnpj')
 * @returns true se o documento é válido
 */
export function validateDocument(document: string, type: DocumentType): boolean {
  if (type === 'cpf') {
    return validateCPF(document);
  } else {
    return validateCNPJ(document);
  }
}

/**
 * Formata CPF
 * @param cpf - CPF sem formatação
 * @returns CPF formatado (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Remove formatação de documento
 * @param document - CPF ou CNPJ com formatação
 * @returns Documento apenas com números
 */
export function cleanDocument(document: string): string {
  return document.replace(/\D/g, '');
}

