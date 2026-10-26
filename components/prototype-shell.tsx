'use client'

import { useState } from 'react'
import { Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarTree } from '@/components/sidebar-tree'
import { TopBar } from '@/components/top-bar'
import { PageCanvas } from '@/components/page-canvas'
import { EntryPage, PortalPage } from '@/components/landing-pages'
import { findPath, menuTree, workspaceMenu, type RoleId } from '@/lib/menu'

type View = 'portal' | 'entry' | 'workbench'

const views: { id: View; label: string }[] = [
  { id: 'portal', label: '门户首页' },
  { id: 'entry', label: '工作台入口选择' },
  { id: 'workbench', label: '工作台' },
]

export function PrototypeShell() {
  const [view, setView] = useState<View>('workbench')
  const [role, setRole] = useState<RoleId>('seller')
  const [activeId, setActiveId] = useState('seller-settle')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['seller-settle']))
  const [collapsed, setCollapsed] = useState(false)

  const nodes = workspaceMenu(role)
  const fullPath = findPath(menuTree, activeId) ?? [menuTree[0]]
  const breadcrumb = fullPath.slice(1)

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
        trail.slice(1, -1).forEach((n) => next.add(n.id))
        return next
      })
    }
  }

  const enterWorkbench = (nextRole: RoleId) => {
    setRole(nextRole)
    setActiveId(workspaceMenu(nextRole)[0].id)
    setExpanded(new Set())
    setView('workbench')
  }

  return (
    <div className="flex h-dvh flex-col bg-[#f0f2f5] text-foreground">
      <div className="flex h-8 shrink-0 items-center gap-3 border-b border-border bg-card px-4 text-xs">
        <span className="font-medium text-muted-foreground">原型导航</span>
        <div className="flex items-center gap-1">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                'rounded-sm px-2 py-0.5 transition-colors',
                view === v.id ? 'bg-[#1890ff]/10 text-[#1890ff]' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-muted-foreground">租售店铺 · 原型设计稿</span>
      </div>

      {view === 'portal' && <PortalPage onEnter={() => setView('entry')} />}
      {view === 'entry' && <EntryPage onPick={enterWorkbench} onBackPortal={() => setView('portal')} />}

      {view === 'workbench' && (
        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              'flex shrink-0 flex-col bg-[#1f2d3d] text-white transition-[width]',
              collapsed ? 'w-0 overflow-hidden' : 'w-64',
            )}
          >
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-5">
              <div className="flex size-7 items-center justify-center rounded bg-[#1890ff]">
                <Store className="size-4" aria-hidden />
              </div>
              <span className="text-base font-semibold tracking-wide">租售店铺</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">
              <SidebarTree nodes={nodes} activeId={activeId} expanded={expanded} onSelect={navigate} onToggle={toggle} />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              role={role}
              breadcrumb={breadcrumb}
              onRoleChange={enterWorkbench}
              onNavigate={navigate}
              onBackWorkbench={() => navigate(nodes[0].id)}
              onBackPortal={() => setView('portal')}
              onToggleSidebar={() => setCollapsed((c) => !c)}
            />
            <main className="min-h-0 flex-1 overflow-y-auto p-4">
              <PageCanvas path={fullPath} onNavigate={navigate} />
            </main>
          </div>
        </div>
      )}
    </div>
  )
}
