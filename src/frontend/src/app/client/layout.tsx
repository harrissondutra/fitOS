import React from 'react';

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}



