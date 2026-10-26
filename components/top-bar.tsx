'use client'

import { Home, Menu, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRole, userRoles, type MenuNode, type RoleId } from '@/lib/menu'

type Props = {
  role: RoleId
  breadcrumb: MenuNode[]
  onRoleChange: (role: RoleId) => void
  onNavigate: (id: string) => void
  onBackWorkbench: () => void
  onBackPortal: () => void
  onToggleSidebar: () => void
}

export function TopBar({
  role,
  breadcrumb,
  onRoleChange,
  onNavigate,
  onBackWorkbench,
  onBackPortal,
  onToggleSidebar,
}: Props) {
  const current = getRole(role)
  const isOps = role === 'ops'

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 bg-[#1890ff] px-4 text-white">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="收起/展开菜单"
        className="flex size-8 items-center justify-center rounded hover:bg-white/15"
      >
        <Menu className="size-4" />
      </button>

      <nav aria-label="面包屑" className="flex items-center gap-1.5 text-sm">
        <button type="button" onClick={onBackWorkbench} aria-label="首页" className="flex items-center hover:opacity-80">
          <Home className="size-4" />
        </button>
        {breadcrumb.map((node, i) => {
          const isLast = i === breadcrumb.length - 1
          return (
            <span key={node.id} className="flex items-center gap-1.5">
              <span className="text-white/60">/</span>
              <button
                type="button"
                onClick={() => onNavigate(node.id)}
                className={cn(isLast ? 'font-medium' : 'text-white/80 hover:text-white')}
              >
                {node.label}
              </button>
            </span>
          )
        })}
      </nav>

      <div className="flex h-8 items-center overflow-hidden rounded bg-white/15 text-sm">
        <button type="button" onClick={onBackWorkbench} className="h-full px-3 hover:bg-white/15">
          返回工作台
        </button>
        <span className="h-4 w-px bg-white/40" aria-hidden />
        <button type="button" onClick={onBackPortal} className="h-full px-3 hover:bg-white/15">
          返回门户
        </button>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {!isOps && (
          <div role="radiogroup" aria-label="切换角色" className="flex h-9 items-center rounded bg-white/15 p-0.5 text-sm">
            {userRoles.map((r) => {
              const active = r.id === role
              return (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onRoleChange(r.id)}
                  className={cn(
                    'h-full rounded-sm px-4 font-medium transition-colors',
                    active ? 'bg-white text-[#1890ff] shadow-sm' : 'text-white hover:bg-white/15',
                  )}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        )}

        <span className="hidden h-5 w-px bg-white/40 md:block" aria-hidden />

        <div className="flex items-center gap-4 text-sm">
          <span className="hidden md:inline">{current.account}</span>
          <button type="button" aria-label="刷新" className="flex size-7 items-center justify-center rounded hover:bg-white/15">
            <RefreshCw className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#0b2a5b] text-sm font-semibold">
              {current.account.slice(0, 1)}
            </span>
            <span className="font-medium">{current.account}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
