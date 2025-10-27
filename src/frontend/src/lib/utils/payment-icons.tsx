import { 
  CreditCard, 
  QrCode, 
  FileText, 
  DollarSign,
  Building2 
} from 'lucide-react';

export type PaymentMethodType = 'card' | 'pix' | 'boleto' | 'default';
export type PaymentProviderType = 'stripe' | 'mercadopago' | 'default';

/**
 * Retorna o ícone Lucide React apropriado para o tipo de forma de pagamento
 * @param type - Tipo de forma de pagamento
 * @param className - Classes CSS opcionais
 * @returns Componente de ícone React
 */
export function getPaymentMethodIcon(
  type: PaymentMethodType,
  className: string = 'h-5 w-5'
) {
  switch (type) {
    case 'card':
      return <CreditCard className={className} />;
    case 'pix':
      return <QrCode className={className} />;
    case 'boleto':
      return <FileText className={className} />;
    default:
      return <DollarSign className={className} />;
  }
}

/**
 * Retorna o ícone para o provedor de pagamento
 * @param provider - Provedor de pagamento
 * @param className - Classes CSS opcionais
 * @returns Componente de ícone React
 */
export function getPaymentProviderIcon(
  provider: PaymentProviderType,
  className: string = 'h-5 w-5'
) {
  switch (provider) {
    case 'stripe':
    case 'mercadopago':
      return <Building2 className={className} />;
    default:
      return <DollarSign className={className} />;
  }
}

/**
 * Retorna a cor apropriada para o tipo de método
 * @param type - Tipo de forma de pagamento
 * @returns Classe de cor Tailwind
 */
export function getPaymentMethodColor(type: PaymentMethodType): string {
  switch (type) {
    case 'card':
      return 'text-blue-600';
    case 'pix':
      return 'text-green-600';
    case 'boleto':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Retorna o label em português para o tipo de método
 * @param type - Tipo de forma de pagamento
 * @returns Label em português
 */
export function getPaymentMethodLabel(type: PaymentMethodType): string {
  switch (type) {
    case 'card':
      return 'Cartão de Crédito';
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto Bancário';
    default:
      return 'Outro método';
  }
}

/**
 * Retorna o label do provedor
 * @param provider - Provedor de pagamento
 * @returns Label do provedor
 */
export function getPaymentProviderLabel(provider: PaymentProviderType): string {
  switch (provider) {
    case 'stripe':
      return 'Stripe';
    case 'mercadopago':
      return 'Mercado Pago';
    default:
      return 'Desconhecido';
  }
}

