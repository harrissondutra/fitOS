"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Users, MessageSquare, Menu, Apple, Stethoscope, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

interface MobileNavProps {
    // onMenuClick removed as we use useSidebar hook
}

export function MobileNav({ }: MobileNavProps) {
    const pathname = usePathname()
    // Use the sidebar hook to control the sidebar state directly
    const { toggleSidebar, openMobile, setOpenMobile } = useSidebar()

    if (!pathname) return null

    const tabs = [
        {
            name: "Início",
            href: "/dashboard",
            icon: Home,
            match: (path: string) => path === "/dashboard"
        },
        {
            name: "Treinos",
            href: "/trainer/workouts",
            icon: Dumbbell,
            match: (path: string) => path.startsWith("/trainer/workouts")
        },
        {
            name: "Dietas",
            href: "/nutrition-client/dieta",
            icon: UtensilsCrossed,
            match: (path: string) => path.startsWith("/nutrition-client/dieta")
        },
        {
            name: "Avaliações Fisicas",
            href: "/trainer/assessments",
            icon: Stethoscope,
            match: (path: string) => path.startsWith("/trainer/assessments")
        },
        {
            name: "Menu",
            href: "#",
            icon: Menu,
            match: (path: string) => false,
            onClick: () => {
                // Toggle sidebar manually
                toggleSidebar()
            }
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
                    const baseClassName = cn(
                        "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                        isActive
                            ? "bg-primary text-primary-foreground transform scale-110 shadow-lg shadow-primary/25"
                            : "text-white/60 dark:text-black/60 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5"
                    )

                    if (tab.onClick) {
                        return (
                            <button
                                key={tab.name}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation() // Ensure click doesn't bubble incorrectly
                                    tab.onClick?.()
                                }}
                                className={cn(baseClassName, "cursor-pointer active:scale-95")} // Added touch feedback
                            >
                                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </button>
                        )
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={baseClassName}
                        >
                            <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}