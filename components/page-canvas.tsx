'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShopCreate, ShopInfo } from '@/components/shop-info'
import { GoodsList } from '@/components/goods-list'
import { GoodsPublish } from '@/components/goods-publish'
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

function OpsDashboardLayout({ onNavigate }: { onNavigate: (id: string) => void }) {
  const metrics = [
    ['平台 GMV（本月）', '¥ 12,480,000', '+8.2%'],
    ['在营店铺', '1,286', '+36'],
    ['今日订单', '2,431', '+12.5%'],
    ['活跃用户', '38,920', '+3.1%'],
  ]
  const todos = [
    ['店铺入驻审核', '23', 'ops-audit-shop'],
    ['商品发布审核', '158', 'ops-audit-goods'],
    ['异常订单处理', '7', 'ops-orders'],
    ['用户申诉', '4', 'ops-users'],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(([k, v, delta]) => (
          <div key={k} className="rounded-md border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{v}</p>
            <p className="mt-1 text-xs text-emerald-600">较上期 {delta}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Block label="平台订单 / GMV 趋势图表占位" className="h-56 lg:col-span-2" />
        <div className="flex flex-col rounded-md border border-border bg-card">
          <p className="border-b border-border px-4 py-3 text-sm font-medium">待办审核</p>
          <ul className="flex flex-1 flex-col">
            {todos.map(([label, count, id]) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/60"
                >
                  <span>{label}</span>
                  <span className="rounded-full bg-[#1890ff]/10 px-2 py-0.5 text-xs font-medium text-[#1890ff] tabular-nums">
                    {count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Block label="角色分布（商家 / 买租方 / 服务商）" className="h-44" />
        <Block label="类目成交 TOP10" className="h-44" />
        <Block label="系统公告与运营日志" className="h-44" />
      </div>
    </div>
  )
}

function ListLayout() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-md bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['编号', '请输入'],
            ['名称', '请输入'],
            ['类型', '全部'],
            ['状态', '请选择'],
            ['创建时间', '开始日期 - 结束日期'],
          ].map(([label, placeholder]) => (
            <label key={label} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-right">{label}</span>
              <span className="flex h-9 flex-1 items-center rounded border border-border px-3 text-muted-foreground">
                {placeholder}
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-[#1890ff] hover:bg-[#1890ff]/90">
            <Search data-icon="inline-start" />
            查询
          </Button>
          <Button variant="outline">重置</Button>
          <Button variant="outline" className="ml-auto">
            <Plus data-icon="inline-start" />
            新增
          </Button>
        </div>
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
  const [subTitle, setSubTitle] = useState<string | null>(null)
  const title = node.id === 'seller-shop-info' && subTitle ? subTitle : node.label

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{node.description ?? '页面说明待补充'}</p>
      </header>

      {node.id === 'seller-shop-info' ? (
        <ShopInfo key={node.id} onTitleChange={setSubTitle} />
      ) : node.id === 'seller-shop-create' ? (
        <ShopCreate key={node.id} onDone={() => onNavigate('seller-shop-info')} />
      ) : node.id === 'seller-goods-list' ? (
        <GoodsList key={node.id} onCreate={() => onNavigate('seller-goods-publish')} />
      ) : node.id === 'seller-goods-publish' ? (
        <GoodsPublish
          key={node.id}
          onBack={() => onNavigate('seller-goods-list')}
          onSubmitted={() => onNavigate('seller-goods-list')}
        />
      ) : isHub ? (
        <HubLayout node={node} onNavigate={onNavigate} />
      ) : node.id === 'ops-dashboard' ? (
        <OpsDashboardLayout onNavigate={onNavigate} />
      ) : isDashboard ? (
        <DashboardLayout />
      ) : (
        <ListLayout />
      )}
    </div>
  )
}
