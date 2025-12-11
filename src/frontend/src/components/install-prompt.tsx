"use client"

import { useState, useEffect } from "react"
import { X, Share, PlusSquare, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | null>(null)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        // Check if running in standalone mode (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        if (isIOS) {
            setPlatform("ios");
            // Show prompt after a delay for iOS
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        } else if (isAndroid) {
            setPlatform("android");
        } else {
            setPlatform("desktop");
        }

        // Capture the PWA install prompt event (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:hidden"
            >
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-zinc-800 relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-muted-foreground"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-[1rem] bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
                            <img src="/icons/icon-192x192.png" alt="App Icon" className="w-full h-full object-cover rounded-[1rem]" onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/192x192/10B981/white?text=FitOS"
                            }} />
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">Instalar FitOS App</h3>
                            <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                                Tenha a melhor experiência! Instale o app na sua tela inicial para acesso rápido.
                            </p>
                        </div>

                        {platform === "ios" && (
                            <div className="w-full bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 text-left space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <Share size={20} className="text-blue-500" />
                                    <span>1. Toque no botão <strong>Compartilhar</strong></span>
                                </div>
                                <div className="w-full h-px bg-gray-200 dark:bg-zinc-700" />
                                <div className="flex items-center gap-3">
                                    <PlusSquare size={20} className="text-gray-600 dark:text-gray-300" />
                                    <span>2. Selecione <strong>Adicionar à Tela de Início</strong></span>
                                </div>
                            </div>
                        )}

                        {(platform === "android" || platform === "desktop") && (
                            <Button
                                onClick={handleInstallClick}
                                className="w-full h-12 rounded-full font-bold text-base shadow-lg shadow-primary/20 bg-primary hover:bg-[#059669]"
                            >
                                <Download className="mr-2 h-4 w-4" /> Instalar Agora
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
