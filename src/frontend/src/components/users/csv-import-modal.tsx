'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X
} from 'lucide-react';
import { CSVImportModalProps, CSVImportResult } from '../../../../shared/types';
import { toastUtils } from '@/lib/toast-utils';

export function CSVImportModal({ 
  isOpen, 
  onClose, 
  onImport 
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toastUtils.csv.fileRequired();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const result = await onImport(file);
      setResult(result);
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      toastUtils.csv.importError();
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setImporting(false);
    onClose();
  };

  const downloadExampleCSV = () => {
    const csvContent = `firstName,lastName,email,phone,role,status
João,Silva,joao.silva@email.com,(11) 99999-9999,CLIENT,ACTIVE
Maria,Santos,maria.santos@email.com,(11) 88888-8888,TRAINER,ACTIVE
Pedro,Costa,pedro.costa@email.com,,ADMIN,ACTIVE`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemplo-usuarios.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Usuários via CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os dados dos usuários que deseja importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exemplo de CSV */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">Formato do CSV</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExampleCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Exemplo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              O arquivo deve conter as seguintes colunas (obrigatórias): firstName, lastName, email, role
            </p>
            <div className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border">
              firstName,lastName,email,phone,role,status
            </div>
          </div>

          {/* Upload Area */}
          {!result && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Arraste o arquivo CSV aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Máximo 10MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Arquivo
                  </Button>
                </div>
              )}

              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando usuários...</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="w-full" />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <Alert className={result.success ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-destructive/20 bg-destructive/10'}>
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <AlertDescription>
                    {result.success 
                      ? `Importação concluída! ${result.successCount} usuário(s) importado(s) com sucesso.`
                      : `Importação falhou! ${result.errorCount} erro(s) encontrado(s).`
                    }
                  </AlertDescription>
                </div>
              </Alert>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 p-3 rounded">
                  <div className="text-2xl font-bold text-foreground">{result.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total de Linhas</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.successCount}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Sucessos</div>
                </div>
                <div className="bg-destructive/10 p-3 rounded">
                  <div className="text-2xl font-bold text-destructive">{result.errorCount}</div>
                  <div className="text-sm text-destructive">Erros</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
                  <h4 className="text-sm font-medium text-destructive mb-2">Erros encontrados:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-xs text-destructive/80">
                        Linha {error.row}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Fechar' : 'Cancelar'}
          </Button>
          {!result && file && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importando...' : 'Importar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
