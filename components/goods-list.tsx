'use client'

import { Fragment, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Select, categoryTree } from '@/components/shop-form-fields'

export type BizType = 'sale' | 'rent'
type ListingStatus = 'on' | 'off'

/** 委托给服务商代为运营的信息 */
export type Entrust = {
  types: BizType[]
  provider: string
  quantity: number
  /** 商家底价：出售按单位计，出租按单位 / 天计 */
  salePrice?: number
  rentPrice?: number
  rentDeposit?: number
  /** 委托期限（月） */
  months: number
  status: 'pending' | 'accepted'
  createdAt: string
}

/** 上架记录：一个商品可多次上架，每条记录对应一种租售方式 */
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
  entrust?: Entrust
  createdAt: string
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
    stock: 6000,
    status: 'active',
    listings: [
      { id: 'L240302001', type: 'sale', status: 'on', price: 128, minOrder: 50, quantity: 3200, used: 1250 },
      { id: 'L240302002', type: 'rent', status: 'on', price: 0.6, period: '天', deposit: 60, minDays: 30, quantity: 1800, used: 1260 },
    ],
    createdAt: '2024-03-15 10:20',
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
    createdAt: '2024-05-08 14:30',
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
    entrust: {
      types: ['rent'],
      provider: '华建周转材料服务有限公司',
      quantity: 120,
      rentPrice: 10,
      rentDeposit: 3000,
      months: 6,
      status: 'accepted',
      createdAt: '2024-09-18',
    },
    createdAt: '2024-04-02 09:05',
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
    createdAt: '2024-06-18 16:40',
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
    createdAt: '2024-05-27 11:15',
    updatedAt: '2024-08-19 13:25',
  },
  {
    code: 'G2024070006',
    name: 'H 型钢 400×200×8×13',
    spec: 'Q235B / 12m',
    category: '循环物资',
    subCategory: '型材类',
    unit: '吨',
    stock: 480,
    status: 'active',
    listings: [
      { id: 'L240703001', type: 'sale', status: 'on', price: 4280, minOrder: 5, quantity: 95, used: 30 },
      { id: 'L240703002', type: 'rent', status: 'on', price: 9.5, period: '天', deposit: 2500, minDays: 60, quantity: 300, used: 120 },
    ],
    createdAt: '2024-07-09 10:00',
    updatedAt: '2024-10-25 17:05',
  },
  {
    code: 'G2024100009',
    name: '组合式钢模板 300×1500 平模',
    spec: 'Q235 / 5mm 面板',
    category: '循环物资',
    subCategory: '模板类',
    unit: '块',
    stock: 2400,
    status: 'active',
    listings: [{ id: 'L241022001', type: 'sale', status: 'on', price: 186, minOrder: 100, quantity: 1200, used: 160 }],
    entrust: {
      types: ['sale', 'rent'],
      provider: '中建租赁服务（上海）有限公司',
      quantity: 800,
      salePrice: 175,
      rentPrice: 0.35,
      rentDeposit: 150,
      months: 12,
      status: 'pending',
      createdAt: '2024-10-27',
    },
    createdAt: '2024-08-21 15:30',
    updatedAt: '2024-10-27 10:15',
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
    createdAt: '2024-09-12 09:45',
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
    createdAt: '2024-10-16 13:20',
    updatedAt: '2024-10-18 09:35',
  },
]

export const bizMeta: Record<BizType, { label: string; className: string }> = {
  sale: { label: '出售', className: 'bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30' },
  rent: { label: '出租', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
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

export function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-5 items-center rounded px-1.5 text-xs ring-1 ring-inset', className)}>{children}</span>
  )
}

export function fmtPrice(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: n < 1 ? 2 : 0, maximumFractionDigits: 3 })
}

export function ActionLink({
  children,
  tone = 'primary',
  onClick,
}: {
  children: React.ReactNode
  tone?: 'primary' | 'danger'
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('text-xs hover:underline', tone === 'primary' ? 'text-[#1890ff]' : 'text-red-600')}
    >
      {children}
    </button>
  )
}

type GoodsAction = 'edit' | 'list' | 'stock' | 'off' | 'entrust' | 'cancelEntrust'

function GoodsActions({ goods, onAction }: { goods: Goods; onAction: (a: GoodsAction) => void }) {
  const entrustLink = !goods.entrust ? (
    <ActionLink onClick={() => onAction('entrust')}>委托</ActionLink>
  ) : goods.entrust.status === 'pending' ? (
    <ActionLink tone="danger" onClick={() => onAction('cancelEntrust')}>
      撤回委托
    </ActionLink>
  ) : null
  const actions: Record<GoodsStatus, React.ReactNode> = {
    draft: (
      <>
        <ActionLink onClick={() => onAction('edit')}>编辑</ActionLink>
        <ActionLink>提交审核</ActionLink>
        <ActionLink tone="danger">删除</ActionLink>
      </>
    ),
    active: (
      <>
        <ActionLink>详情</ActionLink>
        <ActionLink onClick={() => onAction('edit')}>编辑</ActionLink>
        <ActionLink onClick={() => onAction('list')}>上架</ActionLink>
        <ActionLink onClick={() => onAction('stock')}>调整库存</ActionLink>
        {entrustLink}
        <ActionLink tone="danger" onClick={() => onAction('off')}>
          下架
        </ActionLink>
      </>
    ),
    off: (
      <>
        <ActionLink>详情</ActionLink>
        <ActionLink onClick={() => onAction('edit')}>编辑</ActionLink>
        <ActionLink onClick={() => onAction('list')}>重新上架</ActionLink>
        {entrustLink}
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
  return <span className="flex flex-wrap items-center gap-x-3 gap-y-1">{actions[goods.status]}</span>
}

/* ---------- 操作弹窗 ---------- */

/** 上架中记录占用的库存，调整库存时不可低于该值 */
function lockedStock(g: Goods) {
  return g.listings.filter((l) => l.status === 'on').reduce((s, l) => s + l.quantity, 0)
}

export function Modal({
  title,
  titleId,
  width = 'max-w-[520px]',
  children,
  footer,
  onClose,
}: {
  title: string
  titleId: string
  width?: string
  children: React.ReactNode
  footer: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn('flex w-full flex-col rounded-md bg-card shadow-xl', width)}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 id={titleId} className="text-base font-semibold">
            {title}
          </h3>
          <button type="button" aria-label="关闭" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>
      </div>
    </div>
  )
}

export function DialogField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm">
        {required && <span className="mr-0.5 text-red-500">*</span>}
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function DialogInput({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  prefix?: string
  suffix?: string
  type?: 'text' | 'number'
}) {
  return (
    <div className="flex h-9 items-center rounded border border-border bg-background text-sm focus-within:border-[#1890ff]">
      {prefix && <span className="pl-3 text-muted-foreground">{prefix}</span>}
      <input
        aria-label={label}
        type={type}
        min={type === 'number' ? 0 : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-xs placeholder:text-muted-foreground/60"
      />
      {suffix && <span className="pr-3 text-xs text-muted-foreground">{suffix}</span>}
    </div>
  )
}

function GoodsSummary({ goods }: { goods: Goods }) {
  return (
    <div className="flex items-center gap-3 rounded bg-muted/40 px-3 py-2 text-sm">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{goods.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {goods.code} · {goods.spec}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        总库存 <span className="tabular-nums text-foreground">{goods.stock.toLocaleString()}</span> {goods.unit}
      </span>
    </div>
  )
}

export const PRIMARY_BTN = 'bg-[#1890ff] hover:bg-[#1890ff]/90'

export const PROVIDERS = ['华建周转材料服务有限公司', '中建租赁服务（上海）有限公司', '筑友设备运营服务商', '鼎盛建材流通服务中心']
const ENTRUST_MONTHS = ['3 个月', '6 个月', '12 个月']

/** 委托：将商品委托给服务商代为出售 / 出租，服务商受理后可加价上架 */
function EntrustDialog({ goods, onClose, onConfirm }: { goods: Goods; onClose: () => void; onConfirm: (e: Entrust) => void }) {
  const available = goods.stock - lockedStock(goods)
  const [types, setTypes] = useState<BizType[]>([])
  const [provider, setProvider] = useState('')
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [rentPrice, setRentPrice] = useState('')
  const [rentDeposit, setRentDeposit] = useState('')
  const [months, setMonths] = useState('6 个月')

  const toggleType = (t: BizType) => setTypes((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]))

  const qty = Number(quantity)
  const qtyOk = qty > 0 && qty <= available
  const saleOk = !types.includes('sale') || Number(salePrice) > 0
  const rentOk = !types.includes('rent') || (Number(rentPrice) > 0 && rentDeposit !== '' && Number(rentDeposit) >= 0)
  const ok = types.length > 0 && provider !== '' && qtyOk && saleOk && rentOk

  const submit = () => {
    if (!ok) return
    onConfirm({
      types: (['sale', 'rent'] as BizType[]).filter((t) => types.includes(t)),
      provider,
      quantity: qty,
      salePrice: types.includes('sale') ? Number(salePrice) : undefined,
      rentPrice: types.includes('rent') ? Number(rentPrice) : undefined,
      rentDeposit: types.includes('rent') ? Number(rentDeposit) : undefined,
      months: Number.parseInt(months, 10),
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <Modal
      title="委托服务商运营"
      titleId="entrust-dialog-title"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" className={PRIMARY_BTN} disabled={!ok} onClick={submit}>
            提交委托
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />
      <DialogField label="委托方式" required hint="可同时勾选；服务商受理后按您填写的底价加价上架，差价为服务商收益">
        <div role="group" aria-label="委托方式" className="grid grid-cols-2 gap-2">
          {(['sale', 'rent'] as BizType[]).map((t) => {
            const active = types.includes(t)
            return (
              <button
                key={t}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => toggleType(t)}
                className={cn(
                  'flex h-9 items-center justify-center gap-1.5 rounded border text-sm transition-colors',
                  active ? 'border-[#1890ff] bg-[#1890ff]/5 text-[#1890ff]' : 'border-border hover:border-[#1890ff]/50',
                )}
              >
                {active && <CheckCircle2 className="size-3.5" aria-hidden />}
                委托{bizMeta[t].label}
              </button>
            )
          })}
        </div>
      </DialogField>
      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="服务商" required>
          <Select label="服务商" placeholder="请选择服务商" value={provider} options={PROVIDERS} onChange={setProvider} />
        </DialogField>
        <DialogField
          label="委托数量"
          required
          hint={quantity && !qtyOk ? `不可超过可委托库存 ${available.toLocaleString()} ${goods.unit}` : `可委托库存 ${available.toLocaleString()} ${goods.unit}`}
        >
          <DialogInput label="委托数量" type="number" value={quantity} onChange={setQuantity} placeholder="0" suffix={goods.unit} />
        </DialogField>
        {types.includes('sale') && (
          <DialogField label="出售底价" required>
            <DialogInput label="出售底价" type="number" value={salePrice} onChange={setSalePrice} placeholder="0.00" prefix="¥" suffix={`/ ${goods.unit}`} />
          </DialogField>
        )}
        {types.includes('rent') && (
          <>
            <DialogField label="出租底价" required>
              <DialogInput label="出租底价" type="number" value={rentPrice} onChange={setRentPrice} placeholder="0.00" prefix="¥" suffix={`/ ${goods.unit} / 天`} />
            </DialogField>
            <DialogField label="押金" required>
              <DialogInput label="押金" type="number" value={rentDeposit} onChange={setRentDeposit} placeholder="0.00" prefix="¥" suffix={`/ ${goods.unit}`} />
            </DialogField>
          </>
        )}
        <DialogField label="委托期限" required>
          <Select label="委托期限" placeholder="请选择" value={months} options={ENTRUST_MONTHS} onChange={setMonths} />
        </DialogField>
      </div>
    </Modal>
  )
}

/** 上架：为商品新增一条上架记录 */
function ListDialog({ goods, onClose, onConfirm }: { goods: Goods; onClose: () => void; onConfirm: (l: Listing) => void }) {
  const available = goods.stock - lockedStock(goods)
  const [type, setType] = useState<BizType>('sale')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [period, setPeriod] = useState<'天' | '月'>('天')
  const [deposit, setDeposit] = useState('')
  const [minDays, setMinDays] = useState('')

  const qty = Number(quantity)
  const qtyOk = qty > 0 && qty <= available
  const ok = Number(price) > 0 && qtyOk && (type === 'sale' || (Number(deposit) >= 0 && deposit !== '' && Number(minDays) > 0))

  const submit = () => {
    if (!ok) return
    const id = `L${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(goods.listings.length + 1).padStart(3, '0')}`
    onConfirm(
      type === 'sale'
        ? { id, type, status: 'on', price: Number(price), minOrder: minOrder ? Number(minOrder) : undefined, quantity: qty, used: 0 }
        : { id, type, status: 'on', price: Number(price), period, deposit: Number(deposit), minDays: Number(minDays), quantity: qty, used: 0 },
    )
  }

  return (
    <Modal
      title={goods.status === 'off' ? '重新上架' : '新增上架'}
      titleId="list-dialog-title"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" className={PRIMARY_BTN} disabled={!ok} onClick={submit}>
            确认上架
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />
      <DialogField label="租售方式" required>
        <div role="radiogroup" aria-label="租售方式" className="grid grid-cols-2 gap-2">
          {(['sale', 'rent'] as BizType[]).map((t) => {
            const active = type === t
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(t)}
                className={cn(
                  'flex h-9 items-center justify-center gap-1.5 rounded border text-sm transition-colors',
                  active ? 'border-[#1890ff] bg-[#1890ff]/5 text-[#1890ff]' : 'border-border hover:border-[#1890ff]/50',
                )}
              >
                {bizMeta[t].label}
              </button>
            )
          })}
        </div>
      </DialogField>
      <div className="grid gap-4 sm:grid-cols-2">
        {type === 'rent' && (
          <DialogField label="计租周期" required>
            <div role="radiogroup" aria-label="计租周期" className="flex h-9 items-center gap-4 text-sm">
              {(['天', '月'] as const).map((p) => (
                <label key={p} className="flex items-center gap-1.5">
                  <input type="radio" name="list-period" checked={period === p} onChange={() => setPeriod(p)} className="accent-[#1890ff]" />
                  按{p}
                </label>
              ))}
            </div>
          </DialogField>
        )}
        <DialogField label={type === 'sale' ? '销售单价' : '租金单价'} required>
          <DialogInput
            label="单价"
            type="number"
            value={price}
            onChange={setPrice}
            placeholder="0.00"
            prefix="¥"
            suffix={type === 'sale' ? `/ ${goods.unit}` : `/ ${goods.unit} / ${period}`}
          />
        </DialogField>
        {type === 'sale' ? (
          <DialogField label="起订量">
            <DialogInput label="起订量" type="number" value={minOrder} onChange={setMinOrder} placeholder="不限" suffix={goods.unit} />
          </DialogField>
        ) : (
          <>
            <DialogField label="押金" required>
              <DialogInput label="押金" type="number" value={deposit} onChange={setDeposit} placeholder="0.00" prefix="¥" suffix={`/ ${goods.unit}`} />
            </DialogField>
            <DialogField label="最短租期" required>
              <DialogInput label="最短租期" type="number" value={minDays} onChange={setMinDays} placeholder="0" suffix={period} />
            </DialogField>
          </>
        )}
        <DialogField
          label="上架数量"
          required
          hint={
            quantity && !qtyOk
              ? `不可超过可上架库存 ${available.toLocaleString()} ${goods.unit}`
              : `可上架库存 ${available.toLocaleString()} ${goods.unit}（总库存减去上架中记录占用）`
          }
        >
          <DialogInput label="上架数量" type="number" value={quantity} onChange={setQuantity} placeholder="0" suffix={goods.unit} />
        </DialogField>
      </div>
    </Modal>
  )
}

/** 调整库存：直接修改总库存数量 */
function StockDialog({ goods, onClose, onConfirm }: { goods: Goods; onClose: () => void; onConfirm: (stock: number) => void }) {
  const locked = lockedStock(goods)
  const [amount, setAmount] = useState(String(goods.stock))

  const next = Number(amount)
  const amountOk = amount !== '' && Number.isInteger(next) && next >= 0
  const belowLocked = amountOk && next < locked
  const changed = next !== goods.stock
  const ok = amountOk && !belowLocked && changed

  return (
    <Modal
      title="调整库存"
      titleId="stock-dialog-title"
      width="max-w-[440px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" className={PRIMARY_BTN} disabled={!ok} onClick={() => onConfirm(next)}>
            确认调整
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />
      <DialogField
        label="总库存"
        required
        hint={
          belowLocked
            ? `上架中记录已占用 ${locked.toLocaleString()} ${goods.unit}，库存不可低于该值`
            : `当前 ${goods.stock.toLocaleString()} ${goods.unit}，上架中记录占用 ${locked.toLocaleString()} ${goods.unit}`
        }
      >
        <DialogInput label="总库存" type="number" value={amount} onChange={setAmount} placeholder="0" suffix={goods.unit} />
      </DialogField>
    </Modal>
  )
}

const OFF_REASONS = ['库存不足', '价格调整', '暂停经营', '商品信息变更', '其他']

/** 下架：商品整体下架，所有上架中记录同步下架 */
function OffDialog({ goods, onClose, onConfirm }: { goods: Goods; onClose: () => void; onConfirm: (note: string) => void }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const onCount = goods.listings.filter((l) => l.status === 'on').length
  const ok = reason !== ''

  return (
    <Modal
      title="确认下架商品？"
      titleId="off-dialog-title"
      width="max-w-[460px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" className="bg-red-600 text-white hover:bg-red-600/90" disabled={!ok} onClick={() => onConfirm(note ? `${reason}：${note}` : reason)}>
            确认下架
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle className="size-4" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          下架后「{goods.name}」将从门户隐藏，{onCount} 条上架中记录同步下架，买/租方无法浏览和下单；进行中的订单与合同不受影响。下架后可在列表中重新上架。
        </p>
      </div>
      <DialogField label="下架原因" required>
        <Select label="下架原因" placeholder="请选择原因" value={reason} options={OFF_REASONS} onChange={setReason} />
      </DialogField>
      <DialogField label="补充说明">
        <DialogInput label="补充说明" value={note} onChange={setNote} placeholder="选填" />
      </DialogField>
    </Modal>
  )
}

type EntrustFilter = '' | 'has' | 'none' | 'pending' | 'accepted'
type Filters = { code: string; name: string; category: string; status: GoodsStatus | ''; entrust: EntrustFilter }
const emptyFilters: Filters = { code: '', name: '', category: '', status: '', entrust: '' }

const entrustOptions: { label: string; value: EntrustFilter }[] = [
  { label: '有委托', value: 'has' },
  { label: '有 · 待受理', value: 'pending' },
  { label: '有 · 已受理', value: 'accepted' },
  { label: '无委托', value: 'none' },
]

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
  const entrustLabel = entrustOptions.find((o) => o.value === draft.entrust)?.label ?? ''
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
        <FilterRow label="状态">
          <Select
            label="状态"
            value={statusLabel}
            placeholder="全部"
            options={statusOptions.map((o) => o.label)}
            onChange={(l) => onDraftChange({ ...draft, status: statusOptions.find((o) => o.label === l)?.value ?? '' })}
          />
        </FilterRow>
        <FilterRow label="委托情况">
          <Select
            label="委托情况"
            value={entrustLabel}
            placeholder="全部"
            options={entrustOptions.map((o) => o.label)}
            onChange={(l) => onDraftChange({ ...draft, entrust: entrustOptions.find((o) => o.label === l)?.value ?? '' })}
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
  if (f.entrust === 'has' && !g.entrust) return false
  if (f.entrust === 'none' && g.entrust) return false
  if ((f.entrust === 'pending' || f.entrust === 'accepted') && g.entrust?.status !== f.entrust) return false
  return true
}

const columns = '48px 118px minmax(160px,1.5fr) 120px 90px 100px 72px 92px minmax(170px,1fr)'
const listingColumns = '120px 72px minmax(160px,1fr) 110px 80px 130px'
const entrustColumns = '100px 72px minmax(160px,1fr) 100px minmax(170px,1fr) 80px 90px'

const entrustStatusMeta: Record<Entrust['status'], { label: string; className: string }> = {
  pending: { label: '待受理', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  accepted: { label: '已受理', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

/** 委托记录：一条委托按出售 / 出租拆成多行展示，便于逐项查看底价 */
function EntrustTable({ goods, onCancel }: { goods: Goods; onCancel: () => void }) {
  const e = goods.entrust
  if (!e) return null
  const meta = entrustStatusMeta[e.status]
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">委托记录</span>
        <span className="text-muted-foreground">共 {e.types.length} 条</span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: entrustColumns }}
      >
        <span>委托日期</span>
        <span>委托方式</span>
        <span>服务商</span>
        <span>委托数量</span>
        <span>底价</span>
        <span>受理情况</span>
        <span>操作</span>
      </div>
      {e.types.map((t, i) => (
        <div
          key={t}
          className={cn('grid items-center gap-3 px-3 py-2 text-sm', i > 0 && 'border-t border-border')}
          style={{ gridTemplateColumns: entrustColumns }}
        >
          <span className="font-mono text-xs text-muted-foreground">{e.createdAt}</span>
          <Tag className={bizMeta[t].className}>{bizMeta[t].label}</Tag>
          <span className="truncate" title={e.provider}>
            {e.provider}
          </span>
          <span className="tabular-nums">
            {e.quantity.toLocaleString()} {goods.unit}
          </span>
          <span className="text-xs tabular-nums">
            {t === 'sale' ? (
              <>
                ¥ {fmtPrice(e.salePrice ?? 0)} / {goods.unit}
              </>
            ) : (
              <>
                ¥ {fmtPrice(e.rentPrice ?? 0)} / {goods.unit} / 天
                {e.rentDeposit !== undefined ? `，押金 ¥ ${fmtPrice(e.rentDeposit)}` : ''}
              </>
            )}
          </span>
          <Tag className={meta.className}>{meta.label}</Tag>
          <span className="flex items-center gap-3">
            <ActionLink>详情</ActionLink>
            {e.status === 'pending' && (
              <ActionLink tone="danger" onClick={onCancel}>
                撤回
              </ActionLink>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

const usedLabel = (t: BizType) => (t === 'sale' ? '已售' : '已租')

/** 表头按该商品上架记录的租售类型取名：只有出售显示「已售」，只有出租显示「已租」，混合时为「已售 / 已租」并在行内标注 */
function listingUsedHeader(listings: Listing[]) {
  const types = new Set(listings.map((l) => l.type))
  if (types.size === 1) return usedLabel([...types][0])
  return '已售 / 已租'
}

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
        <span>租售方式</span>
        <span>价格</span>
        <span>{listingUsedHeader(goods.listings)}</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      {goods.listings.map((l) => {
        const meta = bizMeta[l.type]
        const mixed = new Set(goods.listings.map((x) => x.type)).size > 1
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
              {mixed && <span className="mr-1 text-xs text-muted-foreground">{usedLabel(l.type)}</span>}
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

export function GoodsList({ onCreate, onEdit }: { onCreate: () => void; onEdit?: (code: string) => void }) {
  const [goods, setGoods] = useState<Goods[]>(goodsData)
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [applied, setApplied] = useState<Filters>(emptyFilters)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [dialog, setDialog] = useState<{ action: Exclude<GoodsAction, 'edit'>; code: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const dialogGoods = dialog ? goods.find((g) => g.code === dialog.code) : undefined

  const now = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  }
  const updateGoods = (code: string, patch: (g: Goods) => Goods, message: string) => {
    setGoods((list) => list.map((g) => (g.code === code ? { ...patch(g), updatedAt: now() } : g)))
    setDialog(null)
    setToast(message)
    window.setTimeout(() => setToast(null), 2500)
  }
  const handleAction = (g: Goods, action: GoodsAction) => {
    if (action === 'edit') {
      onEdit?.(g.code)
      return
    }
    if (action === 'cancelEntrust') {
      if (g.entrust?.status !== 'pending') return
      updateGoods(g.code, (x) => ({ ...x, entrust: undefined }), `已撤回委托：${g.name}`)
      return
    }
    setDialog({ action, code: g.code })
  }

  const visible = goods.filter((g) => matches(g, applied))
  const isFiltered = Object.values(applied).some(Boolean)

  /** 各状态数量按除状态以外的其他条件统计，便于在页签间切换时看到全貌 */
  const baseFilters: Filters = { ...applied, status: '' }
  const base = goods.filter((g) => matches(g, baseFilters))
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
            {isFiltered ? `筛选结果 ${visible.length} 条 · ` : ''}点击编码前的角标可展开查看上架 / 委托记录
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1040px]">
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
              <span>委托情况</span>
              <span>创建时间</span>
              <span>操作</span>
            </div>

            {visible.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">没有符合筛选条件的商品</p>
            )}

            {visible.map((g) => {
              const open = expanded[g.code] ?? false
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
                        aria-label={open ? `收起 ${g.name} 记录` : `展开 ${g.name} 记录`}
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
                      {g.statusNote && (
                        <span className="line-clamp-2 text-[11px] leading-4 text-muted-foreground" title={g.statusNote}>
                          {g.statusNote}
                        </span>
                      )}
                    </span>
                    <span className="flex flex-col items-start gap-0.5">
                      {g.entrust ? (
                        <>
                          <Tag className="bg-violet-50 text-violet-700 ring-violet-200">有</Tag>
                          <span className="text-[11px] leading-4 text-muted-foreground">{entrustStatusMeta[g.entrust.status].label}</span>
                        </>
                      ) : (
                        <Tag className="bg-muted text-muted-foreground ring-border">无</Tag>
                      )}
                    </span>
                    <span className="flex flex-col font-mono text-xs leading-4 text-muted-foreground">
                      <span>{g.createdAt.slice(0, 10)}</span>
                      <span className="text-[11px]">{g.createdAt.slice(11)}</span>
                    </span>
                    <GoodsActions goods={g} onAction={(a) => handleAction(g, a)} />
                  </div>
                  {open && (
                    <div id={`listings-${g.code}`} className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-3 pl-[84px]">
                      <ListingTable goods={g} />
                      {g.entrust && <EntrustTable goods={g} onCancel={() => handleAction(g, 'cancelEntrust')} />}
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

      {dialog?.action === 'list' && dialogGoods && (
        <ListDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(l) =>
            updateGoods(
              dialogGoods.code,
              (g) => ({ ...g, status: 'active', listings: [l, ...g.listings] }),
              `已上架：${dialogGoods.name}（${bizMeta[l.type].label} ${l.quantity.toLocaleString()} ${dialogGoods.unit}）`,
            )
          }
        />
      )}
      {dialog?.action === 'entrust' && dialogGoods && (
        <EntrustDialog
          key={dialogGoods.code}
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(entrust) =>
            updateGoods(
              dialogGoods.code,
              (g) => ({ ...g, entrust }),
              `已提交委托：${dialogGoods.name}（${entrust.types.map((t) => bizMeta[t].label).join('/')} ${entrust.quantity.toLocaleString()} ${dialogGoods.unit}，待 ${entrust.provider} 受理）`,
            )
          }
        />
      )}
      {dialog?.action === 'stock' && dialogGoods && (
        <StockDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(stock) =>
            updateGoods(dialogGoods.code, (g) => ({ ...g, stock }), `库存已调整为 ${stock.toLocaleString()} ${dialogGoods.unit}`)
          }
        />
      )}
      {dialog?.action === 'off' && dialogGoods && (
        <OffDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(note) =>
            updateGoods(
              dialogGoods.code,
              (g) => ({ ...g, status: 'off', statusNote: note, listings: g.listings.map((l) => ({ ...l, status: 'off' as const })) }),
              `已下架：${dialogGoods.name}`,
            )
          }
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg"
        >
          <CheckCircle2 className="size-4 text-emerald-400" aria-hidden />
          {toast}
        </div>
      )}
    </div>
  )
}
