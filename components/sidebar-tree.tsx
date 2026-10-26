'use client'

import { ChevronRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuNode } from '@/lib/menu'

type Props = {
  nodes: MenuNode[]
  activeId: string
  expanded: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  depth?: number
}

export function SidebarTree({ nodes, activeId, expanded, onSelect, onToggle, depth = 0 }: Props) {
  return (
    <ul role={depth === 0 ? 'tree' : 'group'} className="flex flex-col">
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length)
        const isOpen = expanded.has(node.id)
        const isActive = node.id === activeId

        return (
          <li key={node.id} role="treeitem" aria-expanded={hasChildren ? isOpen : undefined} aria-selected={isActive}>
            <div
              className={cn(
                'group flex h-11 items-center gap-1 pr-3 text-sm transition-colors',
                isActive
                  ? 'bg-[#1890ff] text-white'
                  : depth > 0
                    ? 'bg-black/20 text-white/70 hover:bg-black/30 hover:text-white'
                    : 'text-white/80 hover:bg-white/5 hover:text-white',
              )}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(node.id)
                  if (hasChildren && !isOpen) onToggle(node.id)
                }}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <FileText className={cn('size-4 shrink-0', isActive ? 'text-white' : 'text-white/50')} aria-hidden />
                <span className={cn('truncate', node.emphasized && 'font-semibold text-white')}>{node.label}</span>
              </button>
              <button
                type="button"
                aria-label={hasChildren ? (isOpen ? `折叠 ${node.label}` : `展开 ${node.label}`) : undefined}
                tabIndex={hasChildren ? 0 : -1}
                onClick={() => hasChildren && onToggle(node.id)}
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded text-white/50',
                  hasChildren ? 'hover:text-white' : 'invisible',
                )}
              >
                <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
              </button>
            </div>
            {hasChildren && isOpen && (
              <SidebarTree
                nodes={node.children!}
                activeId={activeId}
                expanded={expanded}
                onSelect={onSelect}
                onToggle={onToggle}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
