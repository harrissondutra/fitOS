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
        // Prevent default browser install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if on Android or Desktop (Chrome/Edge)
            if (!platform || platform === 'android' || platform === 'desktop') {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        // Check standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            setShowPrompt(false);
            return;
        }

        if (isIOS) {
            setPlatform("ios");
            // iOS: Always show prompt after delay (since we can't detect installability easily reliably without user action)
            const timer = setTimeout(() => setShowPrompt(true), 2000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        } else if (isAndroid) {
            setPlatform("android");
        } else {
            setPlatform("desktop");
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [platform]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
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
                className="fixed top-0 left-0 right-0 z-[100] p-4 md:hidden print:hidden pointer-events-none"
            >
                <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2rem] p-4 flex items-center gap-4 pointer-events-auto ring-1 ring-black/5">
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

                    {(platform === "ios") ? (
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-medium text-blue-500 whitespace-nowrap animate-pulse">
                                Toque em <Share className="inline w-3 h-3" /> ↓
                            </span>
                        </div>
                    ) : (
                        <Button
                            onClick={handleInstallClick}
                            size="sm"
                            className="rounded-full h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-blue-500/20 shadow-lg text-xs"
                        >
                            Instalar
                        </Button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
