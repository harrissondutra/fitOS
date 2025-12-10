import { CSVImportResult, UserFormData } from '../../../shared/types';
import { UserRole } from '../../../shared/types/auth.types';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export interface CSVRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
}

export class CSVParser {
  /**
   * Validar formato do CSV
   */
  static validateCSVHeaders(headers: string[]): { valid: boolean; missingHeaders: string[] } {
    const requiredHeaders = ['firstName', 'lastName', 'email', 'role'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    return {
      valid: missingHeaders.length === 0,
      missingHeaders
    };
  }

  /**
   * Validar linha do CSV
   */
  static validateRow(row: any, rowIndex: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar firstName
    if (!row.firstName || typeof row.firstName !== 'string' || row.firstName.trim().length === 0) {
      errors.push(`Linha ${rowIndex + 1}: Nome é obrigatório`);
    }

    // Validar lastName
    if (!row.lastName || typeof row.lastName !== 'string' || row.lastName.trim().length === 0) {
      errors.push(`Linha ${rowIndex + 1}: Sobrenome é obrigatório`);
    }

    // Validar email
    if (!row.email || typeof row.email !== 'string') {
      errors.push(`Linha ${rowIndex + 1}: Email é obrigatório`);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email.trim())) {
        errors.push(`Linha ${rowIndex + 1}: Email inválido`);
      }
    }

    // Validar role
    if (!row.role || typeof row.role !== 'string') {
      errors.push(`Linha ${rowIndex + 1}: Role é obrigatório`);
    } else {
      const validRoles: string[] = ['CLIENT', 'TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN', 'PROFESSIONAL'];
      if (!validRoles.includes(String(row.role).toUpperCase())) {
        errors.push(`Linha ${rowIndex + 1}: Role inválido.`);
      }
    }

    // Validar phone (opcional)
    if (row.phone && typeof row.phone !== 'string') {
      errors.push(`Linha ${rowIndex + 1}: Telefone deve ser texto`);
    }

    // Validar status (opcional)
    if (row.status && typeof row.status !== 'string') {
      errors.push(`Linha ${rowIndex + 1}: Status deve ser texto`);
    } else if (row.status) {
      const validStatuses: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
      if (!validStatuses.includes(row.status.toUpperCase() as UserStatus)) {
        errors.push(`Linha ${rowIndex + 1}: Status inválido. Use: ${validStatuses.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Converter linha do CSV para UserFormData
   */
  static rowToUserFormData(row: any): UserFormData {
    return {
      firstName: row.firstName?.trim() || '',
      lastName: row.lastName?.trim() || '',
      email: row.email?.trim().toLowerCase() || '',
      phone: row.phone?.trim() || undefined,
      role: ((row.role?.toUpperCase() as unknown as UserRole) || ('CLIENT' as unknown as UserRole)),
      status: row.status ? (row.status.toUpperCase() as UserStatus) : 'ACTIVE',
      password: this.generateTemporaryPassword()
    };
  }

  /**
   * Gerar senha temporária
   */
  static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Processar arquivo CSV
   */
  static async parseCSV(file: File): Promise<CSVImportResult> {
    // Verificar se estamos no ambiente do navegador
    if (typeof window === 'undefined' || typeof (globalThis as any).FileReader === 'undefined') {
      throw new Error('FileReader is not available in this environment');
    }
    
    return new Promise((resolve) => {
      const reader = new (globalThis as any).FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim().length > 0);
          
          if (lines.length < 2) {
            resolve({
              success: false,
              totalRows: 0,
              successCount: 0,
              errorCount: 0,
              errors: [{ row: 0, field: 'file', message: 'Arquivo CSV vazio ou inválido' }],
              importedUsers: []
            });
            return;
          }

          // Extrair headers
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Validar headers
          const headerValidation = this.validateCSVHeaders(headers);
          if (!headerValidation.valid) {
            resolve({
              success: false,
              totalRows: 0,
              successCount: 0,
              errorCount: 0,
              errors: headerValidation.missingHeaders.map(header => ({
                row: 0,
                field: header,
                message: `Cabeçalho obrigatório ausente: ${header}`
              })),
              importedUsers: []
            });
            return;
          }

          // Processar linhas
          const importedUsers: UserFormData[] = [];
          const errors: Array<{ row: number; field: string; message: string }> = [];
          let successCount = 0;
          let errorCount = 0;

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = line.split(',').map(v => v.trim());
            
            // Criar objeto da linha
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            // Validar linha
            const validation = this.validateRow(row, i);
            if (validation.valid) {
              const userData = this.rowToUserFormData(row);
              importedUsers.push(userData);
              successCount++;
            } else {
              validation.errors.forEach(error => {
                errors.push({
                  row: i + 1,
                  field: 'general',
                  message: error
                });
              });
              errorCount++;
            }
          }

          resolve({
            success: errorCount === 0,
            totalRows: lines.length - 1,
            successCount,
            errorCount,
            errors,
            importedUsers: importedUsers as any[]
          });

        } catch (error) {
          resolve({
            success: false,
            totalRows: 0,
            successCount: 0,
            errorCount: 0,
            errors: [{ row: 0, field: 'file', message: 'Erro ao processar arquivo CSV' }],
            importedUsers: []
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          errors: [{ row: 0, field: 'file', message: 'Erro ao ler arquivo' }],
          importedUsers: []
        });
      };

      reader.readAsText(file);
    });
  }

  /**
   * Gerar CSV de exemplo
   */
  static generateExampleCSV(): string {
    const headers = ['firstName', 'lastName', 'email', 'phone', 'role', 'status'];
    const exampleData = [
      ['João', 'Silva', 'joao.silva@email.com', '(11) 99999-9999', 'CLIENT', 'ACTIVE'],
      ['Maria', 'Santos', 'maria.santos@email.com', '(11) 88888-8888', 'TRAINER', 'ACTIVE'],
      ['Pedro', 'Costa', 'pedro.costa@email.com', '', 'ADMIN', 'ACTIVE']
    ];

    const csvContent = [headers, ...exampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
