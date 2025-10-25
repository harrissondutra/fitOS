"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ShippingInfoProps {
  onAddressChange: (address: any) => void;
}

export default function ShippingInfo({ onAddressChange }: ShippingInfoProps) {
  const [address, setAddress] = useState({
    fullName: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAddress((prev) => ({ ...prev, [id]: value }));
    onAddressChange({ ...address, [id]: value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setAddress((prev) => ({ ...prev, [id]: value }));
    onAddressChange({ ...address, [id]: value });
  };

  // Mock de estados brasileiros
  const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SP', 'SE', 'TO'];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Nome Completo</Label>
        <Input id="fullName" value={address.fullName} onChange={handleInputChange} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" value={address.cep} onChange={handleInputChange} maxLength={8} required />
        </div>
        <div>
          <Label htmlFor="street">Rua</Label>
          <Input id="street" value={address.street} onChange={handleInputChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="number">Número</Label>
          <Input id="number" value={address.number} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" value={address.complement} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" value={address.neighborhood} onChange={handleInputChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" value={address.city} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Select onValueChange={(value) => handleSelectChange('state', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

