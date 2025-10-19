'use client';

import React, { useState } from 'react';
import { X, ArrowRight, Check, AlertCircle } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  tenantType: 'individual' | 'business';
  onUpgrade: (upgradeType: 'business' | 'slots' | 'feature', data?: any) => void;
  className?: string;
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlan,
  tenantType,
  onUpgrade,
  className = ''
}: UpgradeModalProps) {
  const [upgradeType, setUpgradeType] = useState<'business' | 'slots' | 'feature' | null>(null);
  const [formData, setFormData] = useState({
    subdomain: '',
    role: '',
    quantity: 1,
    featureName: '',
    reason: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (upgradeType) {
      onUpgrade(upgradeType, formData);
      onClose();
    }
  };

  const resetForm = () => {
    setUpgradeType(null);
    setFormData({
      subdomain: '',
      role: '',
      quantity: 1,
      featureName: '',
      reason: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className={`inline-block transform overflow-hidden rounded-lg bg-background text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle ${className}`}>
          <div className="bg-background px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">
                {upgradeType ? 'Solicitar Upgrade' : 'Opções de Upgrade'}
              </h3>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {!upgradeType ? (
              <div className="space-y-4">
                {tenantType === 'individual' && (
                  <button
                    onClick={() => setUpgradeType('business')}
                    className="w-full p-4 text-left border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">Tornar-se Profissional</h4>
                        <p className="text-sm text-muted-foreground">
                          Criar subdomain e habilitar funcionalidades de colaboradores
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                )}

                {tenantType === 'business' && (
                  <>
                    <button
                      onClick={() => setUpgradeType('slots')}
                      className="w-full p-4 text-left border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">Solicitar Slots Extras</h4>
                          <p className="text-sm text-muted-foreground">
                            Adicionar mais colaboradores ao seu plano
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>

                    <button
                      onClick={() => setUpgradeType('feature')}
                      className="w-full p-4 text-left border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">Solicitar Feature</h4>
                          <p className="text-sm text-muted-foreground">
                            Habilitar funcionalidades específicas
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {upgradeType === 'business' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subdomain desejado
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={formData.subdomain}
                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                        placeholder="minha-academia"
                        className="flex-1 border-input rounded-l-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
                        required
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-sm">
                        .fitos.com
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Seu subdomain será: {formData.subdomain}.fitos.com
                    </p>
                  </div>
                )}

                {upgradeType === 'slots' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tipo de colaborador
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="block w-full border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="admin">Administrador</option>
                        <option value="trainer">Personal Trainer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        className="block w-full border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
                        required
                      />
                    </div>
                  </>
                )}

                {upgradeType === 'feature' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Feature desejada
                      </label>
                      <select
                        value={formData.featureName}
                        onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
                        className="block w-full border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="aiAgents">AI Agents</option>
                        <option value="wearables">Wearables</option>
                        <option value="computerVision">Computer Vision</option>
                        <option value="marketplace">Marketplace</option>
                        <option value="whiteLabel">White Label</option>
                        <option value="advancedAnalytics">Analytics Avançado</option>
                        <option value="apiAccess">API Access</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Motivo da solicitação
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    placeholder="Explique por que você precisa desta funcionalidade..."
                    className="block w-full border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>
                    Sua solicitação será enviada para aprovação do super administrador.
                  </span>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setUpgradeType(null)}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                  >
                    Enviar Solicitação
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
