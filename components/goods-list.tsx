'use client'

import { Fragment, useState } from 'react'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Select, categoryTree } from '@/components/shop-form-fields'

type BizType = 'sale' | 'rent'
type ListingStatus = 'on' | 'off'

/** 上架记录：一个商品可多次上架，每条记录对应一种业务类型 */
type Listing = {
  id: string
  type: BizType
  status: ListingStatus
  price: number
  /** 出租业务的计价周期 */
  period?: '天' | '月'
  /** 出租业务押金（按单位计） */
  deposit?: number
  /** 出租业务最短租期（天） */
  minDays?: number
  /** 出售业务起订量 */
  minOrder?: number
  /** 本次上架数量 */
  quantity: number
  /** 已售出 / 已租出数量 */
  used: number
}

/** 商品状态：草稿 / 运营中 / 已下架 / 违规下架 / 审核驳回 */
type GoodsStatus = 'draft' | 'active' | 'off' | 'violation' | 'rejected'

type Goods = {
  code: string
  name: string
  spec: string
  category: string
  subCategory: string
  unit: string
  /** 商品总库存（实物） */
  stock: number
  status: GoodsStatus
  /** 违规下架 / 审核驳回的原因说明 */
  statusNote?: string
  listings: Listing[]
  updatedAt: string
}

const goodsData: Goods[] = [
  {
    code: 'G2024030001',
    name: '覆膜竹胶板 1220×2440×15mm',
    spec: '15mm / 整张',
    category: '循环物资',
    subCategory: '模板类',
    unit: '张',
    stock: 5000,
    status: 'active',
    listings: [
      { id: 'L240302001', type: 'sale', status: 'on', price: 128, minOrder: 50, quantity: 3200, used: 1250 },
      { id: 'L240302002', type: 'rent', status: 'on', price: 0.6, period: '天', deposit: 60, minDays: 30, quantity: 1800, used: 1260 },
    ],
    updatedAt: '2024-10-12 09:20',
  },
  {
    code: 'G2024030002',
    name: '盘扣式钢管脚手架 Φ48×3.2 立杆 2.0m',
    spec: 'Q355 / 热镀锌',
    category: '循环物资',
    subCategory: '脚手架类',
    unit: '根',
    stock: 12000,
    status: 'active',
    listings: [
      { id: 'L240315001', type: 'rent', status: 'on', price: 0.045, period: '天', deposit: 85, minDays: 90, quantity: 12000, used: 9800 },
      { id: 'L240110003', type: 'rent', status: 'off', price: 0.05, period: '天', deposit: 85, minDays: 90, quantity: 8000, used: 8000 },
    ],
    updatedAt: '2024-10-20 16:45',
  },
  {
    code: 'G2024040003',
    name: '钢支撑 Φ609×16 基坑内支撑',
    spec: '9m / 12m 标准节',
    category: '循环物资',
    subCategory: '支护类',
    unit: '吨',
    stock: 420,
    status: 'active',
    listings: [
      { id: 'L240408001', type: 'sale', status: 'off', price: 5800, minOrder: 10, quantity: 120, used: 120 },
      { id: 'L240408002', type: 'rent', status: 'on', price: 12, period: '天', deposit: 3000, minDays: 180, quantity: 420, used: 410 },
    ],
    updatedAt: '2024-09-30 11:10',
  },
  {
    code: 'G2024050004',
    name: '装配式围挡 2.5m 高 彩钢',
    spec: '2.5m×2.0m / 片',
    category: '循环物资',
    subCategory: '拼装类',
    unit: '片',
    stock: 860,
    status: 'draft',
    listings: [{ id: 'L240520001', type: 'sale', status: 'off', price: 365, minOrder: 20, quantity: 860, used: 210 }],
    updatedAt: '2024-10-02 08:50',
  },
  {
    code: 'G2024060005',
    name: '施工轨道 P43 钢轨 12.5m',
    spec: '43kg/m',
    category: '循环物资',
    subCategory: '轨道类',
    unit: '根',
    stock: 60,
    status: 'off',
    listings: [{ id: 'L240611001', type: 'rent', status: 'off', price: 280, period: '月', deposit: 6000, minDays: 90, quantity: 60, used: 18 }],
    updatedAt: '2024-08-19 13:25',
  },
  {
    code: 'G2024070006',
    name: 'H 型钢 400×200×8×13',
    spec: 'Q235B / 12m',
    category: '循环物资',
    subCategory: '型材类',
    unit: '吨',
    stock: 395,
    status: 'active',
    listings: [
      { id: 'L240703001', type: 'sale', status: 'on', price: 4280, minOrder: 5, quantity: 95, used: 30 },
      { id: 'L240703002', type: 'rent', status: 'on', price: 9.5, period: '天', deposit: 2500, minDays: 60, quantity: 300, used: 120 },
    ],
    updatedAt: '2024-10-25 17:05',
  },
  {
    code: 'G2024080007',
    name: 'YJV 低压电缆 3×95+1×50',
    spec: '0.6/1kV / 米',
    category: '循环物资',
    subCategory: '电线电缆',
    unit: '米',
    stock: 8000,
    status: 'violation',
    statusNote: '商品图片含联系方式水印，违反平台发布规范',
    listings: [{ id: 'L240816001', type: 'rent', status: 'off', price: 0.35, period: '天', deposit: 45, minDays: 30, quantity: 8000, used: 7900 }],
    updatedAt: '2024-10-22 10:00',
  },
  {
    code: 'G2024090008',
    name: '打包箱式活动房 3×6m 标准箱',
    spec: '含门窗 / 不含电',
    category: '循环物资',
    subCategory: '房屋建筑类',
    unit: '个',
    stock: 64,
    status: 'rejected',
    statusNote: '缺少产品合格证明材料，请补充后重新提交',
    listings: [
      { id: 'L240905001', type: 'sale', status: 'off', price: 16800, minOrder: 1, quantity: 24, used: 6 },
      { id: 'L240905002', type: 'rent', status: 'off', price: 980, period: '月', deposit: 5000, minDays: 180, quantity: 40, used: 33 },
    ],
    updatedAt: '2024-10-18 09:35',
  },
]

const bizMeta: Record<BizType, { label: string; status: string; className: string }> = {
  sale: { label: '出售', status: '在售', className: 'bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30' },
  rent: { label: '出租', status: '在租', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

const listingStatusMeta: Record<ListingStatus, { label: string; className: string }> = {
  on: { label: '上架中', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  off: { label: '已下架', className: 'bg-muted text-muted-foreground ring-border' },
}

const goodsStatusOrder: GoodsStatus[] = ['draft', 'active', 'off', 'violation', 'rejected']

const goodsStatusMeta: Record<GoodsStatus, { label: string; className: string; countClass: string }> = {
  draft: { label: '草稿', className: 'bg-muted text-muted-foreground ring-border', countClass: 'text-muted-foreground' },
  active: { label: '运营中', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', countClass: 'text-emerald-700' },
  off: { label: '已下架', className: 'bg-gray-100 text-gray-600 ring-gray-200', countClass: 'text-gray-600' },
  violation: { label: '违规下架', className: 'bg-red-50 text-red-600 ring-red-200', countClass: 'text-red-600' },
  rejected: { label: '审核驳回', className: 'bg-amber-50 text-amber-700 ring-amber-200', countClass: 'text-amber-700' },
}

/** 运营中商品的业务类型，由上架中的记录推导：有出售记录为「在售」，有出租记录为「在租」 */
function activeBizTypes(g: Goods): BizType[] {
  if (g.status !== 'active') return []
  const active = g.listings.filter((l) => l.status === 'on')
  return (['sale', 'rent'] as BizType[]).filter((t) => active.some((l) => l.type === t))
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

function GoodsActions({ status }: { status: GoodsStatus }) {
  const actions: Record<GoodsStatus, React.ReactNode> = {
    draft: (
      <>
        <ActionLink>编辑</ActionLink>
        <ActionLink>提交审核</ActionLink>
        <ActionLink tone="danger">删除</ActionLink>
      </>
    ),
    active: (
      <>
        <ActionLink>详情</ActionLink>
        <ActionLink>编辑</ActionLink>
        <ActionLink>上架</ActionLink>
        <ActionLink>调整库存</ActionLink>
        <ActionLink tone="danger">下架</ActionLink>
      </>
    ),
    off: (
      <>
        <ActionLink>详情</ActionLink>
        <ActionLink>编辑</ActionLink>
        <ActionLink>重新上架</ActionLink>
      </>
    ),
    violation: (
      <>
        <ActionLink>详情</ActionLink>
        <ActionLink>查看违规原因</ActionLink>
        <ActionLink>整改后重新提交</ActionLink>
      </>
    ),
    rejected: (
      <>
        <ActionLink>详情</ActionLink>
        <ActionLink>编辑</ActionLink>
        <ActionLink>重新提交审核</ActionLink>
      </>
    ),
  }
  return <span className="flex flex-wrap items-center gap-x-3 gap-y-1">{actions[status]}</span>
}

type Filters = { code: string; name: string; category: string; status: GoodsStatus | '' }
const emptyFilters: Filters = { code: '', name: '', category: '', status: '' }

const statusOptions: { label: string; value: GoodsStatus }[] = goodsStatusOrder.map((s) => ({
  label: goodsStatusMeta[s].label,
  value: s,
}))
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
  const statusLabel = statusOptions.find((o) => o.value === draft.status)?.label ?? ''
  return (
    <div className="flex flex-col gap-4 rounded-md bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <FilterRow label="状态">
          <Select
            label="状态"
            value={statusLabel}
            placeholder="全部"
            options={statusOptions.map((o) => o.label)}
            onChange={(l) => onDraftChange({ ...draft, status: statusOptions.find((o) => o.label === l)?.value ?? '' })}
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
  if (f.status && g.status !== f.status) return false
  return true
}

const columns = '48px 118px minmax(160px,1.5fr) 120px 90px 100px minmax(170px,1fr)'
const listingColumns = '120px 72px minmax(160px,1fr) 110px 80px 130px'

function ListingTable({ goods }: { goods: Goods }) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">上架记录</span>
        <span className="text-muted-foreground">共 {goods.listings.length} 条</span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: listingColumns }}
      >
        <span>上架单号</span>
        <span>业务类型</span>
        <span>价格</span>
        <span>已售 / 已租</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      {goods.listings.map((l) => {
        const meta = bizMeta[l.type]
        return (
          <div
            key={l.id}
            className="grid items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
            style={{ gridTemplateColumns: listingColumns }}
          >
            <span className="font-mono text-xs text-muted-foreground">{l.id}</span>
            <Tag className={meta.className}>{meta.label}</Tag>
            <span className="tabular-nums">
              ¥ {fmtPrice(l.price)} / {goods.unit}
              {l.type === 'rent' && l.period ? ` / ${l.period}` : ''}
            </span>
            <span className="tabular-nums">
              {l.used.toLocaleString()} {goods.unit}
            </span>
            <Tag className={listingStatusMeta[l.status].className}>{listingStatusMeta[l.status].label}</Tag>
            <span className="flex items-center gap-3">
              <ActionLink>详情</ActionLink>
              {l.status === 'on' ? <ActionLink tone="danger">下架</ActionLink> : <ActionLink>重新上架</ActionLink>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function GoodsList({ onCreate }: { onCreate: () => void }) {
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [applied, setApplied] = useState<Filters>(emptyFilters)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const visible = goodsData.filter((g) => matches(g, applied))
  const isFiltered = Object.values(applied).some(Boolean)

  /** 各状态数量按除状态以外的其他条件统计，便于在页签间切换时看到全貌 */
  const baseFilters: Filters = { ...applied, status: '' }
  const base = goodsData.filter((g) => matches(g, baseFilters))
  const countOf = (s: GoodsStatus | '') => (s ? base.filter((g) => g.status === s).length : base.length)

  const selectStatus = (s: GoodsStatus | '') => {
    setDraft((d) => ({ ...d, status: s }))
    setApplied((a) => ({ ...a, status: s }))
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
        <div className="flex items-center gap-1 border-b border-border px-2 text-xs" role="tablist" aria-label="商品状态">
          {(['', ...goodsStatusOrder] as (GoodsStatus | '')[]).map((s) => {
            const active = applied.status === s
            const label = s ? goodsStatusMeta[s].label : '全部'
            return (
              <button
                key={s || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectStatus(s)}
                className={cn(
                  'relative flex h-10 items-center gap-1.5 px-3 hover:text-foreground',
                  active ? 'font-medium text-[#1890ff]' : 'text-muted-foreground',
                )}
              >
                {label}
                <span className={cn('tabular-nums', active ? 'text-[#1890ff]' : s ? goodsStatusMeta[s].countClass : '')}>
                  {countOf(s)}
                </span>
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1890ff]" aria-hidden />}
              </button>
            )
          })}
          <span className="ml-auto pr-2 text-muted-foreground">
            {isFiltered ? `筛选结果 ${visible.length} 条 · ` : ''}点击编码前的角标可展开查看上架记录
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div
              className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: columns }}
            >
              <span className="text-center">展开</span>
              <span>商品编码</span>
              <span>商品名称</span>
              <span>品类</span>
              <span>库存</span>
              <span>状态</span>
              <span>操作</span>
            </div>

            {visible.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">没有符合筛选条件的商品</p>
            )}

            {visible.map((g) => {
              const open = expanded[g.code] ?? false
              const bizTypes = activeBizTypes(g)
              const statusMeta = goodsStatusMeta[g.status]
              return (
                <Fragment key={g.code}>
                  <div
                    className={cn(
                      'grid items-center gap-3 border-b border-border px-4 py-3 text-sm hover:bg-muted/30',
                      open && 'bg-muted/20',
                    )}
                    style={{ gridTemplateColumns: columns }}
                  >
                    <span className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggle(g.code)}
                        aria-expanded={open}
                        aria-controls={`listings-${g.code}`}
                        aria-label={open ? `收起 ${g.name} 上架记录` : `展开 ${g.name} 上架记录`}
                        className="relative flex size-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]"
                      >
                        <ChevronRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} aria-hidden />
                        <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[#1890ff] text-[9px] leading-none text-white">
                          {g.listings.length}
                        </span>
                      </button>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{g.code}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{g.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{g.spec}</span>
                    </span>
                    <span className="text-xs">
                      <span className="text-muted-foreground">{g.category} / </span>
                      {g.subCategory}
                    </span>
                    <span className="tabular-nums">
                      {g.stock.toLocaleString()} {g.unit}
                    </span>
                    <span className="flex min-w-0 flex-col items-start gap-1">
                      <Tag className={statusMeta.className}>{statusMeta.label}</Tag>
                      {bizTypes.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {bizTypes.map((t) => bizMeta[t].status).join(' · ')}
                        </span>
                      )}
                      {g.statusNote && (
                        <span className="line-clamp-2 text-[11px] leading-4 text-muted-foreground" title={g.statusNote}>
                          {g.statusNote}
                        </span>
                      )}
                    </span>
                    <GoodsActions status={g.status} />
                  </div>
                  {open && (
                    <div id={`listings-${g.code}`} className="border-b border-border bg-muted/20 px-4 py-3 pl-[84px]">
                      <ListingTable goods={g} />
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
