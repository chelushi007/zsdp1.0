'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tag } from '@/components/goods-list'
import { fmtMoney, saleAmount, saleStatusMeta, type SaleOrder } from '@/lib/orders-data'

export function Card({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-md border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {extra}
      </header>
      <div className="flex flex-col gap-4 px-5 py-4">{children}</div>
    </section>
  )
}

export function InfoGrid({ rows, cols = 3 }: { rows: [string, React.ReactNode][]; cols?: 2 | 3 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3 text-sm', cols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2')}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="truncate" title={typeof v === 'string' ? v : undefined}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function PageBar({ title, order: o, onBack, extra }: { title: string; order: SaleOrder; onBack: () => void; extra?: React.ReactNode }) {
  const meta = saleStatusMeta[o.status]
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          返回销售订单
        </Button>
        <span className="h-4 w-px bg-border" aria-hidden />
        <h1 className="text-base font-semibold">{title}</h1>
        <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
        <Tag className={meta.className}>{meta.label}</Tag>
      </div>
      {extra}
    </div>
  )
}

export function OrderInfoCard({ order: o, amountLabel = '订单金额' }: { order: SaleOrder; amountLabel?: string }) {
  const amount = saleAmount(o)
  const unit = `¥ ${o.unitPrice.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} / ${o.goods.unit}`
  return (
    <Card title="订单信息">
      <InfoGrid
        rows={[
          ['订单号', <span key="id" className="font-mono">{o.id}</span>],
          ['下单时间', o.createdAt],
          ['结算方式', o.payTerm],
          ['买方（甲方）', o.buyer],
          ['卖方（乙方）', o.seller],
          ['所属店铺', o.shop],
          ['服务商', o.provider ?? '—'],
          ['支付方式', o.payMethod],
          ['合同编号', o.contractNo ? <span key="ht" className="font-mono">{o.contractNo}</span> : '—'],
          ['收货地址', o.address],
        ]}
      />
      <div className="overflow-hidden rounded border border-border">
        <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
          <span>商品</span>
          <span className="text-right">数量</span>
          <span className="text-right">单价</span>
          <span className="text-right">小计</span>
        </div>
        <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] items-center px-4 py-3 text-sm">
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{o.goods.name}</span>
            <span className="truncate text-xs text-muted-foreground">{o.goods.spec}</span>
          </span>
          <span className="text-right tabular-nums">
            {o.quantity.toLocaleString()} {o.goods.unit}
          </span>
          <span className="text-right tabular-nums">{unit}</span>
          <span className="text-right tabular-nums">{fmtMoney(o.unitPrice * o.quantity)}</span>
        </div>
        <div className="flex items-center justify-end gap-6 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span>运费 {o.freight ? fmtMoney(o.freight) : '免运费'}</span>
          <span>
            {amountLabel} <span className="text-sm font-semibold text-foreground">{fmtMoney(amount)}</span>
          </span>
        </div>
      </div>
    </Card>
  )
}

export const INPUT_CLS = 'h-9 rounded border border-border bg-background px-3 text-sm focus:border-[#1890ff] focus:outline-none'
export const TEXTAREA_CLS =
  'w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm placeholder:text-xs placeholder:text-muted-foreground/60 focus:border-[#1890ff] focus:outline-none'
