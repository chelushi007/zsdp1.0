'use client'

import { ArrowRight, Building2, Handshake, ShieldCheck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { opsRole, userRoles, type RoleId } from '@/lib/menu'

function Block({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground ${className}`}
    >
      {label}
    </div>
  )
}

export function PortalPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-6">
        <div className="flex size-7 items-center justify-center rounded bg-[#1890ff] text-white">
          <Store className="size-4" aria-hidden />
        </div>
        <span className="text-base font-semibold">租售店铺</span>
        <nav className="ml-8 hidden gap-6 text-sm text-muted-foreground md:flex" aria-label="门户导航">
          <span className="text-foreground">首页</span>
          <span>租赁专区</span>
          <span>出售专区</span>
          <span>店铺</span>
          <span>服务商</span>
        </nav>
        <Button size="sm" className="ml-auto bg-[#1890ff] hover:bg-[#1890ff]/90" onClick={onEnter}>
          进入工作台
          <ArrowRight data-icon="inline-end" />
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
        <Block label="门户轮播 / 活动 Banner" className="h-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['热门租赁', '新品出售', '优选店铺', '认证服务商'].map((k) => (
            <Block key={k} label={k} className="h-32" />
          ))}
        </div>
        <Block label="商品瀑布流列表" className="h-64" />
      </main>
    </div>
  )
}

const roleIcons: Record<RoleId, typeof Store> = {
  seller: Store,
  buyer: Building2,
  provider: Handshake,
  ops: ShieldCheck,
}

const roleDesc: Record<RoleId, string> = {
  seller: '管理店铺、发布租售商品、处理订单与结算',
  buyer: '查看在租商品、订单、账单与合同',
  provider: '管理受托商品、服务订单与佣金结算',
  ops: '平台用户、审核、订单监控与系统配置',
}

export function EntryPage({
  onPick,
  onBackPortal,
}: {
  onPick: (role: RoleId) => void
  onBackPortal: () => void
}) {
  const roles = [...userRoles, opsRole]
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#f0f2f5] p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded bg-[#1890ff] text-white">
            <Store className="size-5" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold">选择工作台入口</h1>
          <p className="text-sm text-muted-foreground">当前账号拥有多个身份，请选择要进入的工作台</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => {
            const Icon = roleIcons[r.id]
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onPick(r.id)}
                className="flex flex-col gap-3 rounded-md border border-border bg-card p-5 text-left transition-colors hover:border-[#1890ff] hover:shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded bg-[#1890ff]/10 text-[#1890ff]">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium">{r.id === 'ops' ? '运营工作台' : `${r.label}工作台`}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.account}</p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{roleDesc[r.id]}</p>
              </button>
            )
          })}
        </div>
        <div className="mt-6 text-center">
          <Button variant="link" className="text-muted-foreground" onClick={onBackPortal}>
            返回门户首页
          </Button>
        </div>
      </div>
    </div>
  )
}
