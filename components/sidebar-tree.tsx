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
                'group flex h-8 items-center gap-1 rounded-sm pr-2 text-sm transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
              )}
              style={{ paddingLeft: `${depth * 16 + 4}px` }}
            >
              <button
                type="button"
                aria-label={hasChildren ? (isOpen ? `折叠 ${node.label}` : `展开 ${node.label}`) : undefined}
                tabIndex={hasChildren ? 0 : -1}
                onClick={() => hasChildren && onToggle(node.id)}
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground',
                  hasChildren ? 'hover:text-foreground' : 'invisible',
                )}
              >
                <ChevronRight className={cn('size-3 transition-transform', isOpen && 'rotate-90')} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelect(node.id)
                  if (hasChildren && !isOpen) onToggle(node.id)
                }}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className={cn('truncate', node.emphasized && 'font-semibold')}>{node.label}</span>
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
