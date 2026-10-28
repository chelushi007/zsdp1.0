'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Modal, Tag } from '@/components/goods-list'
import { Timeline } from '@/components/orders-shared'
import { fmtMoney, providerGain, saleAmount, saleStatusMeta, type OrderRole, type SaleOrder } from '@/lib/orders-data'

const TABS = ['订单商品', '订单合同', '对账单', '发货单', '发票', '业务日记'] as const
type Tab = (typeof TABS)[number]

type Row = [string, React.ReactNode]

function unitPrice(n: number, unit: string) {
  return `¥ ${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} / ${unit}`
}

function stampOf(o: SaleOrder, keyword: string) {
  return o.timeline.find((t) => t.label.includes(keyword))?.at
}

function Rows({ rows, cols = 2 }: { rows: Row[]; cols?: 2 | 3 }) {
  return (
    <dl className={cn('grid gap-x-4 gap-y-3 text-sm', cols === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function DocCard({ title, no, state, stateTone = 'muted', children }: { title: string; no?: string; state: string; stateTone?: 'good' | 'warn' | 'muted'; children: React.ReactNode }) {
  const tone = { good: 'bg-emerald-50 text-emerald-700 ring-emerald-200', warn: 'bg-amber-50 text-amber-700 ring-amber-200', muted: 'bg-muted text-muted-foreground ring-border' }[stateTone]
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border p-4">
      <header className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-sm font-medium">{title}</span>
          {no && <span className="font-mono text-xs text-muted-foreground">{no}</span>}
        </span>
        <Tag className={tone}>{state}</Tag>
      </header>
      {children}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">{text}</div>
}

function GoodsTab({ o, role }: { o: SaleOrder; role: OrderRole }) {
  const amount = role === 'provider' ? providerGain(o) : saleAmount(o)
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-[1fr_90px_110px_110px] bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>商品</span>
          <span className="text-right">数量</span>
          <span className="text-right">单价</span>
          <span className="text-right">小计</span>
        </div>
        <div className="grid grid-cols-[1fr_90px_110px_110px] items-center px-3 py-3 text-sm">
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{o.goods.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {o.goods.code} · {o.goods.spec}
            </span>
          </span>
          <span className="text-right">
            {o.quantity.toLocaleString()} {o.goods.unit}
          </span>
          <span className="text-right">{unitPrice(o.unitPrice, o.goods.unit)}</span>
          <span className="text-right font-medium">{fmtMoney(o.unitPrice * o.quantity)}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-border bg-muted/20 px-3 py-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>运费</span>
            <span>{o.freight ? fmtMoney(o.freight) : '免运费'}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>{role === 'provider' ? '服务收益' : '订单金额'}</span>
            <span>{fmtMoney(amount)}</span>
          </div>
        </div>
      </div>
      <Rows
        cols={3}
        rows={[
          ['结算方式', o.payTerm],
          ['支付方式', o.payMethod],
          ['所属店铺', o.shop],
          ['买方', o.buyer],
          ['卖方', o.seller],
          ['服务商', o.provider ?? '自营'],
          ...(o.status === 'negotiating' ? ([['买方出价', <span key="bid" className="font-medium text-violet-700">{unitPrice(o.bidPrice ?? o.unitPrice, o.goods.unit)}</span>]] as Row[]) : []),
          ...(role === 'provider' ? ([['商家底价', unitPrice(o.basePrice ?? 0, o.goods.unit)]] as Row[]) : []),
          ['收货地址', o.address],
          ...(o.remark ? ([['备注', o.remark]] as Row[]) : []),
        ]}
      />
    </div>
  )
}

function ContractTab({ o }: { o: SaleOrder }) {
  if (!o.contractNo) return <Empty text={o.status === 'negotiating' ? '议价成交后可发起合同' : '尚未发起合同'} />
  const pending = o.contractState === '待签署'
  return (
    <DocCard title="购销合同" no={o.contractNo} state={pending ? '待买方签署' : '已签署'} stateTone={pending ? 'warn' : 'good'}>
      <Rows
        rows={[
          ['签署方式', o.contractSign ? (o.contractSign === '线上' ? '线上电子签' : '线下纸质签') : '线上电子签'],
          [pending ? '发起时间' : '签署时间', stampOf(o, '合同') ?? stampOf(o, '签署') ?? o.createdAt],
          ['合同金额', fmtMoney(saleAmount(o))],
          ['甲方（买方）', o.buyer],
          ['乙方（卖方）', o.seller],
          ['标的', `${o.goods.name} ${o.quantity.toLocaleString()} ${o.goods.unit}`],
          ['结算方式', o.payTerm],
        ]}
      />
      <div>
        <Button variant="outline" size="sm">
          查看合同文件
        </Button>
      </div>
    </DocCard>
  )
}

function StatementTab({ o }: { o: SaleOrder }) {
  const list = o.statements ?? []
  if (list.length === 0 && !o.statementAmount && !o.reconcile) return <Empty text="尚未生成对账单" />
  const paid = !['negotiating', 'toReconcile', 'unpaid', 'cancelled'].includes(o.status)
  const reconciled = o.reconcile === '已对账' || o.reconcile === '免对账'
  if (list.length === 0)
    return (
      <DocCard title="对账单" no={`DZ${o.id.slice(2)}`} state={o.reconcile ?? '待对账'} stateTone={reconciled ? 'good' : 'warn'}>
        <Rows
          rows={[
            ['对账金额', <span key="amt" className="font-medium">{fmtMoney(o.statementAmount ?? saleAmount(o))}</span>],
            ['收款状态', paid ? <span className="text-emerald-700">已收款</span> : <span className="text-amber-700">待收款</span>],
            ['支付方式', o.payMethod],
          ]}
        />
      </DocCard>
    )
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          共 {list.length} 期 · 对账状态 {o.reconcile ?? '待对账'}
        </span>
        <span>{paid ? '已收款' : '待收款'}</span>
      </div>
      {[...list].reverse().map((s) => (
        <DocCard key={s.no} title={`对账单 · 第 ${s.seq} 期`} no={s.no} state={s.state} stateTone={s.state === '已确认' ? 'good' : s.state === '有异议' ? 'muted' : 'warn'}>
          <Rows
            rows={[
              ['对账金额', <span key="amt" className="font-medium">{fmtMoney(s.amount)}</span>],
              ['对账周期', s.period ?? '—'],
              ['创建时间', s.createdAt],
              [s.state === '有异议' ? '异议时间' : '确认时间', s.repliedAt ?? '—'],
              ...(s.note ? ([['对账说明', s.note]] as Row[]) : []),
              ...(s.reply ? ([['买方反馈', <span key="r" className={s.state === '有异议' ? 'text-red-700' : undefined}>{s.reply}</span>]] as Row[]) : []),
              ...(s.attachment ? ([['附件', <span key="a" className="text-[#1890ff]">{s.attachment}</span>]] as Row[]) : []),
            ]}
          />
        </DocCard>
      ))}
    </div>
  )
}

function ShipmentTab({ o }: { o: SaleOrder }) {
  const no = o.logistics ?? o.pickupNo
  if (!no) return <Empty text={o.status === 'toShip' ? '待商家发货' : '尚未发货'} />
  const received = o.status !== 'shipped' && o.status !== 'toShip'
  return (
    <DocCard title="发货单" no={`FH${o.id.slice(2)}`} state={received ? '已签收' : '运输中'} stateTone={received ? 'good' : 'warn'}>
      <Rows
        rows={[
          ['发货时间', stampOf(o, '发货') ?? '—'],
          ['签收时间', stampOf(o, '收货') ?? '—'],
          ['物流公司 / 车辆', o.shipCompany ?? '—'],
          [o.pickupNo ? '提货单号' : '物流单号', <span key="no" className="font-mono">{no}</span>],
          ['发货数量', `${o.quantity.toLocaleString()} ${o.goods.unit}`],
          ['收货地址', o.address],
        ]}
      />
    </DocCard>
  )
}

function InvoiceTab({ o }: { o: SaleOrder }) {
  if (o.invoice === '不开票') return <Empty text="买方选择不开票" />
  if (o.invoice === '待开票') return <Empty text={o.status === 'done' ? '订单已完成，待商家开票' : '订单完成后可开票'} />
  return (
    <DocCard title="增值税发票" no={o.invoiceNo ?? `FP${o.id.slice(2)}`} state="已开票" stateTone="good">
      <Rows
        rows={[
          ['开票时间', stampOf(o, '发票') ?? '—'],
          ['开票金额', <span key="amt" className="font-medium">{fmtMoney(o.statementAmount ?? saleAmount(o))}</span>],
          ['发票抬头', o.buyer],
          ['销售方', o.seller],
        ]}
      />
      <div>
        <Button variant="outline" size="sm">
          下载电子发票
        </Button>
      </div>
    </DocCard>
  )
}

export function SaleDetailModal({ order: o, role, onClose }: { order: SaleOrder; role: OrderRole; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('订单商品')
  const meta = saleStatusMeta[o.status]
  const ready: Record<Tab, boolean> = {
    订单商品: true,
    订单合同: Boolean(o.contractNo),
    对账单: Boolean(o.statements?.length || o.statementAmount || o.reconcile),
    发货单: Boolean(o.logistics || o.pickupNo),
    发票: o.invoice === '已开票',
    业务日记: true,
  }

  return (
    <Modal
      title="订单详情"
      titleId="sale-detail-title"
      width="max-w-[860px]"
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-3 rounded bg-muted/40 px-3 py-2">
        <span className="flex items-center gap-3">
          <span className="font-mono text-sm">销售订单 {o.id}</span>
          <span className="text-xs text-muted-foreground">下单 {o.createdAt}</span>
        </span>
        <span className="flex items-center gap-2">
          {o.closed && <Tag className="bg-muted text-muted-foreground ring-border">已结束</Tag>}
          <Tag className={meta.className}>{meta.label}</Tag>
        </span>
      </div>
      <div role="tablist" aria-label="订单详情" className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px flex items-center gap-1.5 px-3 py-2 text-sm transition-colors',
              tab === t ? 'border-b-2 border-[#1890ff] font-medium text-[#1890ff]' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
            {ready[t] && t !== '订单商品' && t !== '业务日记' && <span className="size-1.5 rounded-full bg-emerald-500" aria-label="已生成" />}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="min-h-[260px]">
        {tab === '订单商品' && <GoodsTab o={o} role={role} />}
        {tab === '订单合同' && <ContractTab o={o} />}
        {tab === '对账单' && <StatementTab o={o} />}
        {tab === '发货单' && <ShipmentTab o={o} />}
        {tab === '发票' && <InvoiceTab o={o} />}
        {tab === '业务日记' && (
          <div className="max-h-[400px] overflow-y-auto pr-1">
            <Timeline items={o.timeline} />
          </div>
        )}
      </div>
    </Modal>
  )
}
