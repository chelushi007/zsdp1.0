'use client'

import { Fragment, useState } from 'react'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Select, categoryTree } from '@/components/shop-form-fields'

type BizType = 'sale' | 'rent'
type StockLevel = 'enough' | 'low' | 'out'

type SaleBiz = {
  type: 'sale'
  price: number
  unit: string
  stock: number
  minOrder: number
  listedAt: string
  deliveryDays: number
}

type RentBiz = {
  type: 'rent'
  price: number
  unit: string
  period: '天' | '月'
  deposit: number
  stock: number
  rented: number
  minDays: number
  listedAt: string
  deliveryDays: number
}

type Goods = {
  code: string
  name: string
  spec: string
  category: string
  subCategory: string
  biz: (SaleBiz | RentBiz)[]
  updatedAt: string
}

const goodsData: Goods[] = [
  {
    code: 'G2024030001',
    name: '覆膜竹胶板 1220×2440×15mm',
    spec: '15mm / 整张',
    category: '循环物资',
    subCategory: '模板类',
    biz: [
      { type: 'sale', price: 128, unit: '张', stock: 3200, minOrder: 50, listedAt: '2024-03-02 10:30', deliveryDays: 3 },
      {
        type: 'rent',
        price: 0.6,
        unit: '张',
        period: '天',
        deposit: 60,
        stock: 1800,
        rented: 1260,
        minDays: 30,
        listedAt: '2024-03-02 10:30',
        deliveryDays: 2,
      },
    ],
    updatedAt: '2024-10-12 09:20',
  },
  {
    code: 'G2024030002',
    name: '盘扣式钢管脚手架 Φ48×3.2 立杆 2.0m',
    spec: 'Q355 / 热镀锌',
    category: '循环物资',
    subCategory: '脚手架类',
    biz: [
      {
        type: 'rent',
        price: 0.045,
        unit: '根',
        period: '天',
        deposit: 85,
        stock: 12000,
        rented: 9800,
        minDays: 90,
        listedAt: '2024-03-15 14:00',
        deliveryDays: 5,
      },
    ],
    updatedAt: '2024-10-20 16:45',
  },
  {
    code: 'G2024040003',
    name: '钢支撑 Φ609×16 基坑内支撑',
    spec: '9m / 12m 标准节',
    category: '循环物资',
    subCategory: '支护类',
    biz: [
      { type: 'sale', price: 5800, unit: '吨', stock: 0, minOrder: 10, listedAt: '2024-04-08 09:00', deliveryDays: 7 },
      {
        type: 'rent',
        price: 12,
        unit: '吨',
        period: '天',
        deposit: 3000,
        stock: 420,
        rented: 410,
        minDays: 180,
        listedAt: '2024-04-08 09:00',
        deliveryDays: 7,
      },
    ],
    updatedAt: '2024-09-30 11:10',
  },
  {
    code: 'G2024050004',
    name: '装配式围挡 2.5m 高 彩钢',
    spec: '2.5m×2.0m / 片',
    category: '循环物资',
    subCategory: '拼装类',
    biz: [{ type: 'sale', price: 365, unit: '片', stock: 860, minOrder: 20, listedAt: '2024-05-20 15:30', deliveryDays: 4 }],
    updatedAt: '2024-10-02 08:50',
  },
  {
    code: 'G2024060005',
    name: '施工轨道 P43 钢轨 12.5m',
    spec: '43kg/m',
    category: '循环物资',
    subCategory: '轨道类',
    biz: [
      {
        type: 'rent',
        price: 280,
        unit: '根',
        period: '月',
        deposit: 6000,
        stock: 60,
        rented: 18,
        minDays: 90,
        listedAt: '2024-06-11 10:00',
        deliveryDays: 10,
      },
    ],
    updatedAt: '2024-08-19 13:25',
  },
  {
    code: 'G2024070006',
    name: 'H 型钢 400×200×8×13',
    spec: 'Q235B / 12m',
    category: '循环物资',
    subCategory: '型材类',
    biz: [
      { type: 'sale', price: 4280, unit: '吨', stock: 95, minOrder: 5, listedAt: '2024-07-03 09:40', deliveryDays: 5 },
      {
        type: 'rent',
        price: 9.5,
        unit: '吨',
        period: '天',
        deposit: 2500,
        stock: 300,
        rented: 120,
        minDays: 60,
        listedAt: '2024-07-03 09:40',
        deliveryDays: 5,
      },
    ],
    updatedAt: '2024-10-25 17:05',
  },
  {
    code: 'G2024080007',
    name: 'YJV 低压电缆 3×95+1×50',
    spec: '0.6/1kV / 米',
    category: '循环物资',
    subCategory: '电线电缆',
    biz: [
      {
        type: 'rent',
        price: 0.35,
        unit: '米',
        period: '天',
        deposit: 45,
        stock: 8000,
        rented: 7900,
        minDays: 30,
        listedAt: '2024-08-16 11:20',
        deliveryDays: 2,
      },
    ],
    updatedAt: '2024-10-22 10:00',
  },
  {
    code: 'G2024090008',
    name: '打包箱式活动房 3×6m 标准箱',
    spec: '含门窗 / 不含电',
    category: '循环物资',
    subCategory: '房屋建筑类',
    biz: [
      { type: 'sale', price: 16800, unit: '个', stock: 24, minOrder: 1, listedAt: '2024-09-05 14:10', deliveryDays: 15 },
      {
        type: 'rent',
        price: 980,
        unit: '个',
        period: '月',
        deposit: 5000,
        stock: 40,
        rented: 33,
        minDays: 180,
        listedAt: '2024-09-05 14:10',
        deliveryDays: 15,
      },
    ],
    updatedAt: '2024-10-18 09:35',
  },
]

const bizMeta: Record<BizType, { label: string; status: string; className: string }> = {
  sale: { label: '出售', status: '在售', className: 'bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30' },
  rent: { label: '出租', status: '在租', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

function available(b: SaleBiz | RentBiz) {
  return b.type === 'sale' ? b.stock : b.stock - b.rented
}

function stockLevel(g: Goods): StockLevel {
  const total = g.biz.reduce((sum, b) => sum + available(b), 0)
  const capacity = g.biz.reduce((sum, b) => sum + b.stock, 0)
  if (total <= 0) return 'out'
  if (capacity > 0 && total / capacity < 0.15) return 'low'
  return 'enough'
}

const stockMeta: Record<StockLevel, { label: string; className: string }> = {
  enough: { label: '充足', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  low: { label: '紧张', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  out: { label: '缺货', className: 'bg-red-50 text-red-700 ring-red-200' },
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-5 items-center rounded px-1.5 text-xs ring-1 ring-inset', className)}>{children}</span>
  )
}

function fmtPrice(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: n < 1 ? 2 : 0, maximumFractionDigits: 3 })
}

function ActionLink({
  children,
  tone = 'primary',
}: {
  children: React.ReactNode
  tone?: 'primary' | 'danger'
}) {
  return (
    <button
      type="button"
      className={cn('text-xs hover:underline', tone === 'primary' ? 'text-[#1890ff]' : 'text-red-600')}
    >
      {children}
    </button>
  )
}

type Filters = { code: string; name: string; category: string; biz: BizType | ''; stock: StockLevel | '' }
const emptyFilters: Filters = { code: '', name: '', category: '', biz: '', stock: '' }

const bizOptions: { label: string; value: BizType }[] = [
  { label: '在售', value: 'sale' },
  { label: '在租', value: 'rent' },
]
const stockOptions: { label: string; value: StockLevel }[] = [
  { label: '充足', value: 'enough' },
  { label: '紧张', value: 'low' },
  { label: '缺货', value: 'out' },
]
const allCategories = categoryTree.flatMap((g) => g.children)

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      aria-label={label}
      value={value}
      placeholder="请输入"
      onChange={(e) => onChange(e.target.value)}
      className="h-9 flex-1 rounded border border-border bg-background px-3 text-sm placeholder:text-xs placeholder:text-muted-foreground/60"
    />
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 shrink-0 text-right">{label}</span>
      {children}
    </div>
  )
}

function FilterPanel({
  draft,
  onDraftChange,
  onSearch,
  onReset,
  onCreate,
}: {
  draft: Filters
  onDraftChange: (f: Filters) => void
  onSearch: () => void
  onReset: () => void
  onCreate: () => void
}) {
  const bizLabel = bizOptions.find((o) => o.value === draft.biz)?.label ?? ''
  const stockLabel = stockOptions.find((o) => o.value === draft.stock)?.label ?? ''
  return (
    <div className="flex flex-col gap-4 rounded-md bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FilterRow label="商品编码">
          <FilterInput label="商品编码" value={draft.code} onChange={(code) => onDraftChange({ ...draft, code })} />
        </FilterRow>
        <FilterRow label="商品名称">
          <FilterInput label="商品名称" value={draft.name} onChange={(name) => onDraftChange({ ...draft, name })} />
        </FilterRow>
        <FilterRow label="品类">
          <Select
            label="品类"
            value={draft.category}
            placeholder="全部品类"
            options={allCategories}
            onChange={(category) => onDraftChange({ ...draft, category })}
          />
        </FilterRow>
        <FilterRow label="商品状态">
          <Select
            label="商品状态"
            value={bizLabel}
            placeholder="全部"
            options={bizOptions.map((o) => o.label)}
            onChange={(l) => onDraftChange({ ...draft, biz: bizOptions.find((o) => o.label === l)?.value ?? '' })}
          />
        </FilterRow>
        <FilterRow label="库存状态">
          <Select
            label="库存状态"
            value={stockLabel}
            placeholder="全部"
            options={stockOptions.map((o) => o.label)}
            onChange={(l) => onDraftChange({ ...draft, stock: stockOptions.find((o) => o.label === l)?.value ?? '' })}
          />
        </FilterRow>
      </div>
      <div className="flex items-center gap-2">
        <Button className="bg-[#1890ff] hover:bg-[#1890ff]/90" onClick={onSearch}>
          <Search data-icon="inline-start" />
          查询
        </Button>
        <Button variant="outline" onClick={onReset}>
          重置
        </Button>
        <Button variant="outline" className="ml-auto" onClick={onCreate}>
          <Plus data-icon="inline-start" />
          发布商品
        </Button>
      </div>
    </div>
  )
}

function matches(g: Goods, f: Filters) {
  if (f.code && !g.code.toLowerCase().includes(f.code.trim().toLowerCase())) return false
  if (f.name && !g.name.includes(f.name.trim())) return false
  if (f.category && g.subCategory !== f.category) return false
  if (f.biz && !g.biz.some((b) => b.type === f.biz)) return false
  if (f.stock && stockLevel(g) !== f.stock) return false
  return true
}

const columns = '32px 118px minmax(180px,1.5fr) 120px 100px 64px minmax(180px,1fr)'

function BizDetail({ biz }: { biz: SaleBiz | RentBiz }) {
  const meta = bizMeta[biz.type]
  const avail = available(biz)
  const items: [string, string][] =
    biz.type === 'sale'
      ? [
          ['销售单价', `¥ ${fmtPrice(biz.price)} / ${biz.unit}`],
          ['可售库存', `${biz.stock.toLocaleString()} ${biz.unit}`],
          ['起订量', `${biz.minOrder} ${biz.unit}`],
          ['发货周期', `${biz.deliveryDays} 天内发货`],
          ['上架时间', biz.listedAt],
        ]
      : [
          ['租金单价', `¥ ${fmtPrice(biz.price)} / ${biz.unit} / ${biz.period}`],
          ['押金', `¥ ${fmtPrice(biz.deposit)} / ${biz.unit}`],
          ['可租 / 在租', `${avail.toLocaleString()} / ${biz.rented.toLocaleString()} ${biz.unit}`],
          ['最短租期', `${biz.minDays} 天`],
          ['交付周期', `${biz.deliveryDays} 天内交付`],
          ['上架时间', biz.listedAt],
        ]
  return (
    <div className="flex flex-col gap-3 rounded border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Tag className={meta.className}>{meta.label}</Tag>
        <span className="text-xs text-muted-foreground">业务状态：{meta.status}</span>
        <span className={cn('ml-auto text-xs', avail <= 0 ? 'text-red-600' : 'text-muted-foreground')}>
          {avail <= 0 ? '当前无可用库存' : `可用 ${avail.toLocaleString()} ${biz.unit}`}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm lg:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function GoodsList({ onCreate }: { onCreate: () => void }) {
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [applied, setApplied] = useState<Filters>(emptyFilters)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const visible = goodsData.filter((g) => matches(g, applied))
  const isFiltered = Object.values(applied).some(Boolean)
  const counts = {
    sale: visible.filter((g) => g.biz.some((b) => b.type === 'sale')).length,
    rent: visible.filter((g) => g.biz.some((b) => b.type === 'rent')).length,
    out: visible.filter((g) => stockLevel(g) === 'out').length,
  }

  const toggle = (code: string) => setExpanded((e) => ({ ...e, [code]: !e[code] }))

  return (
    <div className="flex flex-col gap-4">
      <FilterPanel
        draft={draft}
        onDraftChange={setDraft}
        onSearch={() => setApplied(draft)}
        onReset={() => {
          setDraft(emptyFilters)
          setApplied(emptyFilters)
        }}
        onCreate={onCreate}
      />

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center gap-4 border-b border-border px-4 py-2.5 text-xs">
          <span className="font-medium">{isFiltered ? `筛选结果 ${visible.length}` : `全部 ${visible.length}`}</span>
          <span className="text-[#1890ff]">在售 {counts.sale}</span>
          <span className="text-emerald-700">在租 {counts.rent}</span>
          <span className="text-red-600">缺货 {counts.out}</span>
          <span className="ml-auto text-muted-foreground">点击编码前的箭头可展开查看出售 / 出租业务明细</span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div
              className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: columns }}
            >
              <span className="sr-only">展开</span>
              <span>商品编码</span>
              <span>商品名称</span>
              <span>品类</span>
              <span>商品状态</span>
              <span>库存状态</span>
              <span>操作</span>
            </div>

            {visible.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">没有符合筛选条件的商品</p>
            )}

            {visible.map((g) => {
              const open = expanded[g.code] ?? false
              const level = stockLevel(g)
              return (
                <Fragment key={g.code}>
                  <div
                    className={cn(
                      'grid items-center gap-3 border-b border-border px-4 py-3 text-sm hover:bg-muted/30',
                      open && 'bg-muted/20',
                    )}
                    style={{ gridTemplateColumns: columns }}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(g.code)}
                      aria-expanded={open}
                      aria-controls={`biz-${g.code}`}
                      aria-label={open ? `收起 ${g.name} 业务明细` : `展开 ${g.name} 业务明细`}
                      className="relative flex size-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]"
                    >
                      <ChevronRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} aria-hidden />
                      <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[#1890ff] text-[9px] leading-none text-white">
                        {g.biz.length}
                      </span>
                    </button>
                    <span className="font-mono text-xs text-muted-foreground">{g.code}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{g.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{g.spec}</span>
                    </span>
                    <span className="text-xs">
                      <span className="text-muted-foreground">{g.category} / </span>
                      {g.subCategory}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {g.biz.map((b) => (
                        <Tag key={b.type} className={bizMeta[b.type].className}>
                          {bizMeta[b.type].status}
                        </Tag>
                      ))}
                    </span>
                    <Tag className={stockMeta[level].className}>{stockMeta[level].label}</Tag>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <ActionLink>详情</ActionLink>
                      <ActionLink>编辑</ActionLink>
                      <ActionLink>调整库存</ActionLink>
                      <ActionLink tone="danger">下架</ActionLink>
                    </span>
                  </div>
                  {open && (
                    <div
                      id={`biz-${g.code}`}
                      className="grid gap-3 border-b border-border bg-muted/20 px-4 py-3 pl-[76px] md:grid-cols-2"
                    >
                      {g.biz.map((b) => (
                        <BizDetail key={b.type} biz={b} />
                      ))}
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span>共 {visible.length} 条</span>
          <span>最近更新：{visible[0]?.updatedAt ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
