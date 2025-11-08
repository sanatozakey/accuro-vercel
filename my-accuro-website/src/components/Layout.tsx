import React from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
interface LayoutProps {
  children: React.ReactNode
  showSplash?: boolean
}
export function Layout({ children, showSplash = false }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {!showSplash && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!showSplash && <Footer />}
    </div>
  )
}
