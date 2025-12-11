"use client"

import { useState, useEffect } from "react"
import { X, Share, PlusSquare, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false);
    const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | null>(null)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const android = /android/.test(userAgent);
        setIsIOS(ios);

        if (ios) setPlatform("ios");
        else if (android) setPlatform("android");
        else setPlatform("desktop");

        // Check if running in standalone mode (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            console.log("App is in standalone mode");
            return;
        }

        // Always show prompt after a small delay to allow animation "drop down"
        // This fulfills "Always display" even if browser event is lazy
        const timer = setTimeout(() => {
            setShowPrompt(true);
        }, 1500);

        // Capture the PWA install prompt event (Android/Desktop)
        // Note: Chrome on Android might block this if user declined recently.
        // But we still want to show our UI.
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            console.log("beforeinstallprompt fired");
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Fallback: If no event captured (browser restriction or already dismissed),
            // we should show instructions or just alert the user.
            // For now, let's open a localized instruction tooltip or alert.
            // Simulating "iOS" behavior for Android if event is missing.
            if (platform === 'android') {
                alert("Para instalar, toque nos 3 pontinhos do navegador e selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
            } else if (platform === 'ios') {
                alert("Para instalar no iOS:\n\n1. Toque no botão de Compartilhar (Share) abaixo.\n2. Role para baixo e selecione 'Adicionar à Tela de Início'.");
            } else {
                alert("Para instalar, procure a opção 'Instalar' no menu do seu navegador.");
            }
            return;
        }

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
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[9999] p-4 print:hidden pointer-events-none"
            >
                <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[1.5rem] p-3 md:p-4 flex items-center gap-3 md:gap-4 pointer-events-auto ring-1 ring-black/5 max-w-md mx-auto">
                    <button
                        onClick={handleDismiss}
                        className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-zinc-800 rounded-full text-muted-foreground shadow-sm border border-border"
                    >
                        <X size={14} />
                    </button>

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] shadow-inner flex items-center justify-center shrink-0 overflow-hidden">
                        <img src="/icons/icon-192x192.png" alt="App" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight text-foreground">Instalar FitOS App</h3>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                            {platform === 'ios' ? 'Adicione à Tela de Início' : 'Instale para melhor performance'}
                        </p>
                    </div>

                    <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="rounded-full h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-blue-500/20 shadow-lg text-xs"
                    >
                        Instalar
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
