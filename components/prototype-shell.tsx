'use client'

import { useState } from 'react'
import { Store } from 'lucide-react'
import { SidebarTree } from '@/components/sidebar-tree'
import { PageCanvas } from '@/components/page-canvas'
import { findPath, menuTree } from '@/lib/menu'

const initialExpanded = new Set(['seller', 'buyer', 'provider'])

export function PrototypeShell() {
  const [activeId, setActiveId] = useState('seller-settle')
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded)

  const path = findPath(menuTree, activeId) ?? [menuTree[0]]

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const navigate = (id: string) => {
    setActiveId(id)
    const trail = findPath(menuTree, id)
    if (trail) {
      setExpanded((prev) => {
        const next = new Set(prev)
        trail.slice(0, -1).forEach((n) => next.add(n.id))
        return next
      })
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Store className="size-4" aria-hidden />
        </div>
        <span className="text-sm font-semibold">租售店铺</span>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">原型设计稿</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
          <div className="px-3 pt-3 pb-2 text-xs font-medium text-muted-foreground">页面结构</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <SidebarTree
              nodes={menuTree}
              activeId={activeId}
              expanded={expanded}
              onSelect={navigate}
              onToggle={toggle}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <PageCanvas path={path} onNavigate={navigate} />
        </main>
      </div>
    </div>
  )
}
