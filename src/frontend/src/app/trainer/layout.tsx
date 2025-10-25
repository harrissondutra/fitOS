import React from "react"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
