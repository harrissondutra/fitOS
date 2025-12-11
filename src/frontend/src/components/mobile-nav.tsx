"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Users, MessageSquare, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    const tabs = [
        {
            name: "Início",
            href: "/dashboard",
            icon: Home,
            match: (path: string) => path === "/dashboard"
        },
        {
            name: "Treinos",
            href: "/workouts",
            icon: Dumbbell,
            match: (path: string) => path.startsWith("/workouts")
        },
        {
            name: "Clientes",
            href: "/clients",
            icon: Users,
            match: (path: string) => path.startsWith("/clients")
        },
        {
            name: "Chat",
            href: "/chat",
            icon: MessageSquare,
            match: (path: string) => path.startsWith("/chat")
        },
        {
            name: "Menu",
            href: "/menu", // Or trigger sidebar
            icon: Menu,
            match: (path: string) => path === "/menu"
        }
    ]

    // Hide on auth pages or landing
    if (pathname.startsWith("/auth") || pathname === "/" || pathname.startsWith("/pricing") || pathname.startsWith("/checkout")) {
        return null
    }

    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
            <div className="bg-black/80 dark:bg-white/90 backdrop-blur-xl border border-white/10 dark:border-black/5 rounded-full p-2 shadow-2xl flex justify-between items-center px-6">
                {tabs.map((tab) => {
                    const isActive = tab.match(pathname)
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-primary text-primary-foreground transform scale-110 shadow-lg shadow-primary/25"
                                    : "text-white/60 dark:text-black/60 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5"
                            )}
                        >
                            <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
