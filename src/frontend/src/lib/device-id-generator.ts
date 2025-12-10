/**
 * Device ID Generator
 * 
 * Gera ID único persistente para o dispositivo usando Web Crypto API
 * (alternativa segura ao MAC address que não é acessível via navegador)
 */

/**
 * Gerar ou recuperar ID persistente do dispositivo
 */
export async function generatePersistentDeviceId(): Promise<string> {
  const key = 'fitos_device_id';
  
  // Verificar se já existe
  if (typeof localStorage !== 'undefined') {
    const existing = localStorage.getItem(key);
    if (existing) {
      return existing;
    }

    // Gerar novo ID aleatório usando Web Crypto API
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    
    const deviceId = Array.from(array, dec => dec.toString(36)).join('-');
    
    // Salvar persistentemente
    localStorage.setItem(key, deviceId);
    
    return deviceId;
  }

  // Fallback se localStorage não disponível
  return 'temp-' + Date.now().toString(36);
}

/**
 * Obter ID persistente existente
 */
export function getPersistentDeviceId(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('fitos_device_id');
}

/**
 * Resetar ID (útil para testes ou logout completo)
 */
export function resetPersistentDeviceId(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('fitos_device_id');
  }
}

/**
 * Gerar hash SHA-256 de string
 */
export async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(input);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Gerar hash único do dispositivo combinando vários fatores
 */
export async function generateDeviceHash(fingerprint: any): Promise<string> {
  const combined = [
    fingerprint.platform || 'unknown',
    fingerprint.screenResolution || 'unknown',
    fingerprint.hardwareConcurrency || '0',
    fingerprint.timezone || 'unknown',
    fingerprint.deviceType || 'unknown',
    getPersistentDeviceId() || 'temp'
  ].join('||');
  
  return generateHash(combined);
}

















