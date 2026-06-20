import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarWidth, setSidebarWidth] = useState(240)

  // Listen for sidebar collapse toggle via sidebar width
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const sidebar = document.querySelector('aside')
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth)
      }
    })
    const sidebar = document.querySelector('aside')
    if (sidebar) observer.observe(sidebar)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: 'margin-left 0.25s ease',
      }}>
        <Header />
        <main style={{ flex: 1, overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
