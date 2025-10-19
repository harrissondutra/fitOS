import { toast } from '@/hooks/use-toast';

export const toastUtils = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'success',
    });
  },

  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'error',
    });
  },

  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'warning',
    });
  },

  info: (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  },

  // Toast específicos para operações de usuários
  user: {
    created: (name: string) => {
      toastUtils.success('Usuário criado', `${name} foi criado com sucesso!`);
    },
    updated: (name: string) => {
      toastUtils.success('Usuário atualizado', `${name} foi atualizado com sucesso!`);
    },
    deleted: (name: string) => {
      toastUtils.success('Usuário excluído', `${name} foi excluído com sucesso!`);
    },
    statusChanged: (name: string, status: 'ativado' | 'desativado') => {
      toastUtils.success('Status alterado', `${name} foi ${status} com sucesso!`);
    },
    passwordReset: (name: string) => {
      toastUtils.success('Senha redefinida', `A senha de ${name} foi redefinida com sucesso!`);
    },
    createError: (error?: string) => {
      toastUtils.error('Erro ao criar usuário', error || 'Ocorreu um erro inesperado');
    },
    updateError: (error?: string) => {
      toastUtils.error('Erro ao atualizar usuário', error || 'Ocorreu um erro inesperado');
    },
    deleteError: (error?: string) => {
      toastUtils.error('Erro ao excluir usuário', error || 'Ocorreu um erro inesperado');
    },
    statusError: (error?: string) => {
      toastUtils.error('Erro ao alterar status', error || 'Ocorreu um erro inesperado');
    },
    passwordError: (error?: string) => {
      toastUtils.error('Erro ao redefinir senha', error || 'Ocorreu um erro inesperado');
    },
  },

  // Toast específicos para operações em lote
  bulk: {
    success: (action: string, count: number) => {
      toastUtils.success('Ação em lote executada', `${action} executada para ${count} usuário(s)`);
    },
    error: (action: string, error?: string) => {
      toastUtils.error('Erro na ação em lote', `Erro ao executar ${action}: ${error || 'Ocorreu um erro inesperado'}`);
    },
  },

  // Toast específicos para exportação
  export: {
    started: () => {
      toastUtils.info('Exportação iniciada', 'A exportação dos dados foi iniciada');
    },
    error: (error?: string) => {
      toastUtils.error('Erro na exportação', error || 'Ocorreu um erro ao exportar os dados');
    },
  },

  // Toast específicos para importação CSV
  csv: {
    fileRequired: () => {
      toastUtils.warning('Arquivo necessário', 'Por favor, selecione um arquivo CSV válido');
    },
    importError: (error?: string) => {
      toastUtils.error('Erro na importação', error || 'Ocorreu um erro ao importar o arquivo CSV');
    },
  },

  // Toast específicos para planos
  plan: {
    created: (name: string) => {
      toastUtils.success('Plano criado', `${name} foi criado com sucesso!`);
    },
    updated: (name: string) => {
      toastUtils.success('Plano atualizado', `${name} foi atualizado com sucesso!`);
    },
    activated: (name: string) => {
      toastUtils.success('Plano ativado', `${name} foi ativado com sucesso!`);
    },
    deactivated: (name: string) => {
      toastUtils.success('Plano desativado', `${name} foi desativado com sucesso!`);
    },
    duplicated: (name: string) => {
      toastUtils.success('Plano duplicado', `${name} foi duplicado com sucesso!`);
    },
    error: (action: string, error?: string) => {
      toastUtils.error(`Erro ao ${action} plano`, error || 'Ocorreu um erro inesperado');
    },
  },

  // Toast específicos para tenants
  tenant: {
    updated: (name: string) => {
      toastUtils.success('Tenant atualizado', `${name} foi atualizado com sucesso!`);
    },
    slotsAdded: (count: number) => {
      toastUtils.success('Slots adicionados', `${count} slots extras foram adicionados com sucesso!`);
    },
    converted: (name: string) => {
      toastUtils.success('Tenant convertido', `${name} foi convertido para business com sucesso!`);
    },
    error: (action: string, error?: string) => {
      toastUtils.error(`Erro ao ${action} tenant`, error || 'Ocorreu um erro inesperado');
    },
  },

  // Toast para funcionalidades em desenvolvimento
  comingSoon: (feature: string) => {
    toastUtils.info('Em desenvolvimento', `${feature} estará disponível em breve`);
  },

  // Toast para validações
  validation: {
    passwordLength: () => {
      toastUtils.warning('Senha inválida', 'A senha deve ter pelo menos 8 caracteres');
    },
    required: (field: string) => {
      toastUtils.warning('Campo obrigatório', `${field} é obrigatório`);
    },
  },
};
