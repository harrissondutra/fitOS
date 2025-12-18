
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { Search, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Only Superuser UI for managing Scraped Exercises
export default function SuperuserScrapingPage() {
    const { exercises, loading, refetch } = useExercises(); // Reuse hook for listing
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [scraping, setScraping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const handleScrape = async () => {
        if (!scrapeUrl) return;
        setScraping(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/exercises/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ url: scrapeUrl })
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message || 'Failed');

            toast({ title: 'Success', description: 'Exercise scraped successfully!' });
            setScrapeUrl('');
            refetch();
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setScraping(false);
        }
    };

    const [scrapingAll, setScrapingAll] = useState(false);
    const handleScrapeAll = async () => {
        if (!confirm('Isso iniciará um processo longo para baixar todo o catálogo. Deseja continuar?')) return;
        setScrapingAll(true);
        try {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('better-auth.session_token');
            if (!token) {
                throw new Error('Você não está autenticado (Token não encontrado).');
            }

            const res = await fetch('/api/exercises/scrape-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message || 'Failed');

            toast({ title: 'Iniciado', description: `Scraping iniciado em background. ${json.data.categoriesFound} categorias encontradas.` });
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setScrapingAll(false);
        }
    }

    const filtered = exercises.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e as any).sourceUrl?.includes(searchTerm)
    );


    // Progress Polling
    const [progress, setProgress] = useState<any>(null);
    const [isPolling, setIsPolling] = useState(false);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPolling || scrapingAll) {
            interval = setInterval(async () => {
                try {
                    const token = localStorage.getItem('accessToken') || localStorage.getItem('better-auth.session_token');
                    if (!token) return;
                    const res = await fetch('/api/exercises/scrape-status', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const json = await res.json();
                    if (json.success) {
                        setProgress(json.data);
                        // Force list refresh during scraping
                        if (json.data.isScraping) refetch();

                        if (!json.data.isScraping && scrapingAll) {
                            setScrapingAll(false);
                            toast({ title: 'Finalizado', description: 'Scraping concluído.' });
                            refetch();
                        }
                    }
                } catch (e) { console.error(e); }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isPolling, scrapingAll]);

    // Auto-start polling on mount if needed or just button
    React.useEffect(() => { setIsPolling(true); }, []);


    return (
        <div className="space-y-6 container mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Scraping (Superuser)</h1>
                    <p className="text-muted-foreground">Gerencie exercícios importados do FitnessProgrammer</p>
                </div>
                <Button variant="destructive" onClick={handleScrapeAll} disabled={scrapingAll || (progress?.isScraping)}>
                    {(scrapingAll || progress?.isScraping) ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                    {(scrapingAll || progress?.isScraping) ? 'Processando Catálogo...' : 'Importar Todo o Catálogo'}
                </Button>
            </div>

            {/* Show card if scrapingAll is active OR if backend says isScraping */}
            {(scrapingAll || (progress && (progress.isScraping || progress.progress.processedCategories > 0))) && (
                <Card className="bg-muted/50 border-primary/20 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                                {progress?.isScraping ? 'Importando Catálogo...' : 'Iniciando Processo...'}
                            </CardTitle>
                            <span className="text-xs font-mono text-muted-foreground">
                                {progress?.isScraping ? 'Em Execução' : 'Aguardando Resposta...'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!progress ? (
                            <div className="text-sm text-center py-4 text-muted-foreground">
                                Conectando ao serviço de scraping...
                            </div>
                        ) : (
                            <>
                                {/* Overall Progress */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progresso Total (Categorias)</span>
                                        <span>{Math.round((progress.progress.processedCategories / (progress.progress.totalCategories || 1)) * 100)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-in-out"
                                            style={{ width: `${(progress.progress.processedCategories / (progress.progress.totalCategories || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                                        <span>{progress.progress.processedCategories} de {progress.progress.totalCategories} categorias scaneadas</span>
                                    </div>
                                </div>

                                {/* Current Category Detail */}
                                <div className="p-3 bg-background rounded border space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-primary">{progress.progress.currentCategory || 'Preparando...'}</span>
                                        <span className="text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                            {progress.progress.processedExercises} / {progress.progress.exercisesInCurrentCategory} exercícios
                                        </span>
                                    </div>
                                    {/* Sub-progress for exercises if available */}
                                    {(progress.progress.exercisesInCurrentCategory > 0) && (
                                        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${(progress.progress.processedExercises / progress.progress.exercisesInCurrentCategory) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Logs */}
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Logs de Atividade</p>
                                    <div className="text-[10px] text-muted-foreground max-h-40 overflow-y-auto space-y-1 font-mono bg-black/90 text-green-400 p-2 rounded border border-green-900/50 shadow-inner">
                                        {(progress.progress.logs || []).map((log: string, i: number) => (
                                            <div key={i} className="whitespace-pre-wrap break-all border-b border-green-900/30 pb-0.5 last:border-0">
                                                {log}
                                            </div>
                                        ))}
                                        {(!progress.progress.logs || progress.progress.logs.length === 0) && <span className="opacity-50">. . .</span>}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Importar Novo Exercício</CardTitle>
                    <CardDescription>Cole a URL do exercício para importar. (Ex: https://fitnessprogramer.com/exercise/name)</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="relative flex-1">
                        <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="https://fitnessprogramer.com/exercise/..."
                            className="pl-9"
                            value={scrapeUrl}
                            onChange={e => setScrapeUrl(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleScrape} disabled={scraping}>
                        {scraping ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        {scraping ? 'Importing...' : 'Importar'}
                    </Button>
                </CardContent>
            </Card>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrar por nome..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Lista
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(ex => (
                        <ExerciseCard
                            key={ex.id}
                            exercise={ex}
                            showActions={true} // Allow edit
                            onEdit={() => {/* Placeholder for edit opening */ }}
                            onDelete={() => {/* Placeholder */ }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
