import { ChevronRight, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MenuNode } from '@/lib/menu'

type Props = {
  path: MenuNode[]
  onNavigate: (id: string) => void
}

function Block({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground ${className}`}
    >
      {label}
    </div>
  )
}

function DashboardLayout() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {['待处理订单', '在租商品', '本月结算', '待签合同'].map((k) => (
          <div key={k} className="rounded-md border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">--</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Block label="趋势图表占位" className="h-56 lg:col-span-2" />
        <Block label="待办事项列表" className="h-56" />
      </div>
    </div>
  )
}

function ListLayout() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
        <div className="flex h-8 flex-1 items-center gap-2 rounded-sm border border-border px-2 text-xs text-muted-foreground">
          <Search className="size-3.5" aria-hidden />
          关键词搜索
        </div>
        <Block label="状态筛选" className="h-8 w-28" />
        <Block label="日期范围" className="h-8 w-36" />
        <Button size="sm">查询</Button>
        <Button size="sm" variant="outline">
          <Plus data-icon="inline-start" />
          新增
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="grid grid-cols-6 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          {['编号', '名称', '类型', '状态', '更新时间', '操作'].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 items-center border-b border-border px-4 py-3 last:border-0">
            {Array.from({ length: 5 }).map((_, j) => (
              <span key={j} className="h-3 w-3/4 rounded bg-muted" />
            ))}
            <span className="text-xs text-primary">查看 · 编辑</span>
          </div>
        ))}
        <div className="flex items-center justify-end gap-2 px-4 py-3 text-xs text-muted-foreground">
          共 -- 条
          <Block label="分页" className="h-7 w-40" />
        </div>
      </div>
    </div>
  )
}

function HubLayout({ node, onNavigate }: { node: MenuNode; onNavigate: (id: string) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {node.children!.map((child) => (
        <button
          key={child.id}
          type="button"
          onClick={() => onNavigate(child.id)}
          className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="text-sm font-medium">{child.label}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">{child.description}</span>
          {child.children && (
            <span className="mt-1 text-xs text-primary">{child.children.length} 个子页面</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function PageCanvas({ path, onNavigate }: Props) {
  const node = path[path.length - 1]
  const isDashboard = node.id.endsWith('dashboard') || node.id === 'portal'
  const isHub = Boolean(node.children?.length)

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="面包屑" className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>租售店铺</span>
        {path.map((p) => (
          <span key={p.id} className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden />
            <button
              type="button"
              onClick={() => onNavigate(p.id)}
              className={p.id === node.id ? 'text-foreground' : 'hover:text-foreground'}
            >
              {p.label}
            </button>
          </span>
        ))}
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{node.label}</h1>
        <p className="text-sm text-muted-foreground">{node.description ?? '页面说明待补充'}</p>
      </header>

      {isHub ? <HubLayout node={node} onNavigate={onNavigate} /> : isDashboard ? <DashboardLayout /> : <ListLayout />}
    </div>
  )
}
