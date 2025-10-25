"use client";

import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Smartphone, Banknote } from 'lucide-react';

interface PaymentMethodsProps {
  onPaymentMethodChange: (method: string) => void;
}

export default function PaymentMethods({ onPaymentMethodChange }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [cardInfo, setCardInfo] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method);
    onPaymentMethodChange(method);
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCardInfo((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
        {/* Credit Card */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="credit_card" id="credit_card" />
          <Label htmlFor="credit_card" className="flex items-center space-x-2 cursor-pointer">
            <CreditCard size={20} />
            <span>Cartão de Crédito</span>
          </Label>
        </div>

        {selectedMethod === 'credit_card' && (
          <Card className="ml-6">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="number">Número do Cartão</Label>
                  <Input
                    id="number"
                    placeholder="1234 5678 9012 3456"
                    value={cardInfo.number}
                    onChange={handleCardInputChange}
                    maxLength={19}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome no Cartão</Label>
                  <Input
                    id="name"
                    placeholder="João Silva"
                    value={cardInfo.name}
                    onChange={handleCardInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Validade</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      value={cardInfo.expiry}
                      onChange={handleCardInputChange}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cardInfo.cvv}
                      onChange={handleCardInputChange}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PIX */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pix" id="pix" />
          <Label htmlFor="pix" className="flex items-center space-x-2 cursor-pointer">
            <Smartphone size={20} />
            <span>PIX</span>
          </Label>
        </div>

        {selectedMethod === 'pix' && (
          <Card className="ml-6">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">
                Após finalizar o pedido, você receberá o QR Code para pagamento via PIX.
                O pagamento é processado instantaneamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Boleto */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="boleto" id="boleto" />
          <Label htmlFor="boleto" className="flex items-center space-x-2 cursor-pointer">
            <Banknote size={20} />
            <span>Boleto Bancário</span>
          </Label>
        </div>

        {selectedMethod === 'boleto' && (
          <Card className="ml-6">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">
                Após finalizar o pedido, você receberá o boleto para impressão.
                O pedido será processado após a confirmação do pagamento.
              </p>
            </CardContent>
          </Card>
        )}
      </RadioGroup>
    </div>
  );
}

