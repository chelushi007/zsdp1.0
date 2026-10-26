'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowLeft, Plus, Search, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CategoryPicker,
  Select,
  categoryTree,
  CompanyImagesUploader,
  COMPANY_IMAGES_MIN,
  LogoUploader,
  MAX_CATEGORIES,
  RegionCascader,
  type Region,
} from '@/components/shop-form-fields'

type ShopStatus = 'open' | 'pending' | 'closed'

type OrgLevel = 'self' | 'sub'

type Shop = {
  id: string
  name: string
  status: ShopStatus
  openedAt: string | null
  contact: string
  phone: string
  org: string
  orgLevel: OrgLevel
  categories: string[]
  region: Region
  detailAddress: string
  intro: string
  businessHours: string
  hasLogo: boolean
  companyIntro: string
  companyImages: number
  license: string
  createdAt: string
  updatedAt: string
}

function fullAddress(shop: Pick<Shop, 'region' | 'detailAddress'>) {
  const { province, city, district } = shop.region
  const parts = province === city ? [province, district] : [province, city, district]
  return [...parts, shop.detailAddress].filter(Boolean).join(' ')
}

const statusMeta: Record<ShopStatus, { label: string; className: string }> = {
  open: { label: '运营中', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  pending: { label: '未开通', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-600 ring-gray-200' },
}

const CURRENT_ORG = '演示商户（上海）有限公司'

const shops: Shop[] = [
  {
    id: 'SP20240301001',
    name: '沪上循环物资租售旗舰店',
    status: 'open',
    openedAt: '2024-03-01 10:20',
    contact: '王敏',
    phone: '138 0011 2233',
    org: CURRENT_ORG,
    orgLevel: 'self',
    categories: ['模板类', '支护类', '脚手架类'],
    region: { province: '上海市', city: '上海市', district: '浦东新区' },
    detailAddress: '张江路 100 号 3 号楼',
    intro: '建筑模板、支护、脚手架等循环物资的租赁与销售，支持整体方案配置。',
    businessHours: '周一至周六 09:00 - 18:00',
    hasLogo: true,
    companyIntro:
      '成立于 2012 年，专注建筑循环物资周转服务，自有 20,000 ㎡ 堆场，服务施工企业 800 余家，提供配送、安拆、回收一站式服务。',
    companyImages: 6,
    license: '91310115MA1K3XXXXX',
    createdAt: '2024-02-26 15:02',
    updatedAt: '2024-09-18 09:41',
  },
  {
    id: 'SP20240415002',
    name: '脚手架与支护租赁中心（松江）',
    status: 'open',
    openedAt: '2024-04-15 14:05',
    contact: '李强',
    phone: '139 2233 4455',
    org: CURRENT_ORG,
    orgLevel: 'self',
    categories: ['脚手架类', '支护类', '拼装类', '型材类'],
    region: { province: '上海市', city: '上海市', district: '松江区' },
    detailAddress: '沪松公路 2000 号',
    intro: '盘扣脚手架、钢支撑、拼装式围挡等短租与长租。',
    businessHours: '全年无休 08:00 - 20:00',
    hasLogo: true,
    companyIntro: '华东地区循环物资租赁服务商，物资保有量 3 万吨，提供安拆班组与现场巡检。',
    companyImages: 12,
    license: '91310117MA1J2XXXXX',
    createdAt: '2024-04-10 11:30',
    updatedAt: '2024-10-02 16:12',
  },
  {
    id: 'SP20240620003',
    name: '电线电缆周转物资店',
    status: 'pending',
    openedAt: null,
    contact: '赵雪',
    phone: '137 6655 8899',
    org: CURRENT_ORG,
    orgLevel: 'self',
    categories: ['电线电缆', '其他材料'],
    region: { province: '上海市', city: '上海市', district: '徐汇区' },
    detailAddress: '漕河泾开发区 88 号',
    intro: '临电电缆、配电箱等周转物资租赁与二手销售。',
    businessHours: '周一至周五 09:30 - 18:30',
    hasLogo: false,
    companyIntro: '临时用电物资全生命周期服务商，提供租赁、检测与回收。',
    companyImages: 1,
    license: '91310104MA1H5XXXXX',
    createdAt: '2024-06-20 09:12',
    updatedAt: '2024-06-20 09:12',
  },
  {
    id: 'SP20230812004',
    name: '轨道型材租赁店（苏州分公司）',
    status: 'open',
    openedAt: '2023-08-12 09:00',
    contact: '陈浩',
    phone: '136 1122 3344',
    org: '演示商户（苏州）分公司',
    orgLevel: 'sub',
    categories: ['轨道类', '型材类', '拼装类'],
    region: { province: '江苏省', city: '苏州市', district: '工业园区' },
    detailAddress: '星湖街 328 号',
    intro: '施工轨道、钢型材等循环物资租赁。',
    businessHours: '周一至周日 08:30 - 21:00',
    hasLogo: true,
    companyIntro: '苏州区域循环物资服务网点，覆盖苏锡常施工项目。',
    companyImages: 4,
    license: '91320594MA1G8XXXXX',
    createdAt: '2023-08-05 10:00',
    updatedAt: '2024-07-30 18:20',
  },
  {
    id: 'SP20241008005',
    name: '房屋建筑类物资租售店（杭州分公司）',
    status: 'pending',
    openedAt: null,
    contact: '周丽',
    phone: '135 9988 7766',
    org: '演示商户（杭州）分公司',
    orgLevel: 'sub',
    categories: ['房屋建筑类', '模板类', '其他材料'],
    region: { province: '浙江省', city: '杭州市', district: '滨江区' },
    detailAddress: '江南大道 588 号',
    intro: '活动板房、集装箱房及配套建筑物资租售。',
    businessHours: '周一至周日 09:00 - 19:00',
    hasLogo: false,
    companyIntro: '杭州区域临建设施与循环物资服务网点。',
    companyImages: 0,
    license: '91330108MA1F6XXXXX',
    createdAt: '2024-10-08 13:45',
    updatedAt: '2024-10-08 13:45',
  },
  {
    id: 'SP20230105006',
    name: '模板支护租赁店（嘉兴项目部）',
    status: 'closed',
    openedAt: '2023-01-05 10:30',
    contact: '孙伟',
    phone: '131 4455 6677',
    org: '演示商户（嘉兴）项目部',
    orgLevel: 'sub',
    categories: ['模板类', '支护类'],
    region: { province: '浙江省', city: '嘉兴市', district: '南湖区' },
    detailAddress: '中环南路 1500 号',
    intro: '项目周边模板、支护物资就近周转租赁。',
    businessHours: '周一至周六 09:00 - 17:30',
    hasLogo: true,
    companyIntro: '项目部级循环物资周转点，项目竣工后已关闭。',
    companyImages: 3,
    license: '91330402MA1E4XXXXX',
    createdAt: '2022-12-28 09:00',
    updatedAt: '2024-05-16 14:08',
  },
]

function StatusBadge({ status }: { status: ShopStatus }) {
  const meta = statusMeta[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        meta.className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  )
}

function ActionLink({
  children,
  onClick,
  tone = 'primary',
}: {
  children: React.ReactNode
  onClick?: () => void
  tone?: 'primary' | 'danger' | 'muted'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-xs hover:underline',
        tone === 'primary' && 'text-[#1890ff]',
        tone === 'danger' && 'text-red-600',
        tone === 'muted' && 'text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

function RowActions({
  shop,
  onDetail,
  onEdit,
  onClose,
}: {
  shop: Shop
  onDetail: () => void
  onEdit: () => void
  onClose: () => void
}) {
  const common = <ActionLink onClick={onDetail}>详情</ActionLink>
  switch (shop.status) {
    case 'open':
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {common}
          <ActionLink onClick={onEdit}>编辑</ActionLink>
          <ActionLink tone="danger" onClick={onClose}>
            关闭店铺
          </ActionLink>
        </div>
      )
    case 'pending':
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {common}
          <ActionLink onClick={onEdit}>编辑</ActionLink>
          <ActionLink>开通店铺</ActionLink>
          <ActionLink tone="danger">删除</ActionLink>
        </div>
      )
    case 'closed':
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {common}
          <ActionLink>重新开��</ActionLink>
        </div>
      )
  }
}

type Filters = { id: string; name: string; status: ShopStatus | ''; category: string; includeSub: boolean }

const emptyFilters: Filters = { id: '', name: '', status: '', category: '', includeSub: false }

const statusOptions: { label: string; value: ShopStatus }[] = [
  { label: '运营中', value: 'open' },
  { label: '未开通', value: 'pending' },
  { label: '已关闭', value: 'closed' },
]

const allCategories = categoryTree.flatMap((g) => g.children)

function FilterInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <input
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 flex-1 rounded border border-border bg-background px-3 text-sm placeholder:text-xs placeholder:text-muted-foreground/60"
    />
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
  onDraftChange: (next: Filters) => void
  onSearch: () => void
  onReset: () => void
  onCreate: () => void
}) {
  const statusLabel = statusOptions.find((o) => o.value === draft.status)?.label ?? ''
  return (
    <div className="flex flex-col gap-4 rounded-md bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-16 shrink-0 text-right">店铺编号</span>
          <FilterInput
            label="店铺编号"
            value={draft.id}
            placeholder="请输入"
            onChange={(id) => onDraftChange({ ...draft, id })}
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <span className="w-16 shrink-0 text-right">店铺名称</span>
          <FilterInput
            label="店铺名称"
            value={draft.name}
            placeholder="请输入"
            onChange={(name) => onDraftChange({ ...draft, name })}
          />
        </label>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-16 shrink-0 text-right">店铺状态</span>
          <Select
            label="店铺状态"
            value={statusLabel}
            placeholder="全部"
            options={statusOptions.map((o) => o.label)}
            onChange={(label) =>
              onDraftChange({ ...draft, status: statusOptions.find((o) => o.label === label)?.value ?? '' })
            }
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="w-16 shrink-0 text-right">主营类目</span>
          <Select
            label="主营类目"
            value={draft.category}
            placeholder="全部类目"
            options={allCategories}
            onChange={(category) => onDraftChange({ ...draft, category })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button className="bg-[#1890ff] hover:bg-[#1890ff]/90" onClick={onSearch}>
          <Search data-icon="inline-start" />
          查询
        </Button>
        <Button variant="outline" onClick={onReset}>
          重置
        </Button>
        <label className="ml-4 flex cursor-pointer select-none items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.includeSub}
            onChange={(e) => onDraftChange({ ...draft, includeSub: e.target.checked })}
            className="size-4 rounded border-border accent-[#1890ff]"
          />
          本级及下级
          <span className="text-xs text-muted-foreground">（勾选后同时查看下级机构的店铺）</span>
        </label>
        <Button variant="outline" className="ml-auto" onClick={onCreate}>
          <Plus data-icon="inline-start" />
          新增店铺
        </Button>
      </div>
    </div>
  )
}

function matches(shop: Shop, f: Filters) {
  if (!f.includeSub && shop.orgLevel !== 'self') return false
  if (f.id && !shop.id.toLowerCase().includes(f.id.trim().toLowerCase())) return false
  if (f.name && !shop.name.includes(f.name.trim())) return false
  if (f.status && shop.status !== f.status) return false
  if (f.category && !shop.categories.includes(f.category)) return false
  return true
}

function ConfirmCloseDialog({ shop, onCancel, onConfirm }: { shop: Shop; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="close-shop-title"
        aria-describedby="close-shop-desc"
        className="w-full max-w-[420px] rounded-md bg-card p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="size-4" aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <h3 id="close-shop-title" className="text-base font-semibold">
              确认关闭店铺？
            </h3>
            <p id="close-shop-desc" className="text-sm leading-relaxed text-muted-foreground">
              关闭后「{shop.name}」将从门户下架，买/租方无法浏览和下单，进行中的订单与合同不受影响。关闭后可在列表中重新开通。
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            取消
          </Button>
          <Button size="sm" className="bg-red-600 text-white hover:bg-red-600/90" onClick={onConfirm}>
            确认关闭
          </Button>
        </div>
      </div>
    </div>
  )
}

const columns = '125px minmax(160px,1.4fr) minmax(150px,1fr) 80px 135px 60px 115px minmax(170px,1fr)'

function OrgCell({ shop }: { shop: Shop }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate text-xs">{shop.org}</span>
      <span
        className={cn(
          'shrink-0 rounded px-1 text-[10px] leading-4 ring-1 ring-inset',
          shop.orgLevel === 'self' ? 'bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30' : 'bg-muted text-muted-foreground ring-border',
        )}
      >
        {shop.orgLevel === 'self' ? '本级' : '下级'}
      </span>
    </span>
  )
}

function ShopList({
  shops,
  onDetail,
  onEdit,
  onCreate,
  onClose,
}: {
  shops: Shop[]
  onDetail: (shop: Shop) => void
  onEdit: (shop: Shop) => void
  onCreate: () => void
  onClose: (shop: Shop) => void
}) {
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [applied, setApplied] = useState<Filters>(emptyFilters)
  const visible = shops.filter((s) => matches(s, applied))
  const isFiltered = applied !== emptyFilters && Object.values(applied).some(Boolean)

  const counts = {
    open: visible.filter((s) => s.status === 'open').length,
    pending: visible.filter((s) => s.status === 'pending').length,
    closed: visible.filter((s) => s.status === 'closed').length,
  }

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
          <span className="font-medium">
            {isFiltered ? `筛选结果 ${visible.length}` : `全部 ${visible.length}`}
          </span>
          <span className="text-emerald-700">运营中 {counts.open}</span>
          <span className="text-amber-700">未开通 {counts.pending}</span>
          <span className="text-gray-600">已关闭 {counts.closed}</span>
          <span className="ml-auto text-muted-foreground">
            查看范围：{applied.includeSub ? '本级及下级' : '仅本级'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1040px]">
            <div
              className="grid items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: columns }}
            >
              <span>店铺编号</span>
              <span>店铺名称</span>
              <span>所属机构</span>
              <span>状态</span>
              <span>开通时间</span>
              <span>联系人</span>
              <span>联系人电话</span>
              <span>操作</span>
            </div>
            {visible.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">没有符合筛选条件的店铺</p>
            )}
            {visible.map((shop) => (
              <div
                key={shop.id}
                className="grid items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/30"
                style={{ gridTemplateColumns: columns }}
              >
                <span className="font-mono text-xs text-muted-foreground">{shop.id}</span>
                <button
                  type="button"
                  onClick={() => onDetail(shop)}
                  className="truncate text-left font-medium hover:text-[#1890ff]"
                >
                  {shop.name}
                </button>
                <OrgCell shop={shop} />
                <StatusBadge status={shop.status} />
                <span className="text-xs tabular-nums text-muted-foreground">{shop.openedAt ?? '—'}</span>
                <span>{shop.contact}</span>
                <span className="tabular-nums">{shop.phone}</span>
                <RowActions
                  shop={shop}
                  onDetail={() => onDetail(shop)}
                  onEdit={() => onEdit(shop)}
                  onClose={() => onClose(shop)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span>共 {visible.length} 条</span>
          <div className="flex items-center gap-1">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-border">‹</span>
            <span className="flex h-7 w-7 items-center justify-center rounded border border-[#1890ff] text-[#1890ff]">1</span>
            <span className="flex h-7 w-7 items-center justify-center rounded border border-border">›</span>
            <span className="ml-2 flex h-7 items-center rounded border border-border px-2">10 条/页</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
  span,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  span?: boolean
  hint?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5 text-sm', span && 'md:col-span-2')}>
      <span className="flex items-baseline gap-2 text-muted-foreground">
        <span>
          {required && <span className="mr-0.5 text-red-500">*</span>}
          {label}
        </span>
        {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      </span>
      {children}
    </div>
  )
}

function Input({ placeholder, value }: { placeholder?: string; value?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 items-center rounded border border-border bg-background px-3',
        value ? 'text-foreground' : 'text-xs text-muted-foreground/60',
      )}
    >
      {value ?? placeholder}
    </span>
  )
}

function Textarea({ placeholder, value }: { placeholder?: string; value?: string }) {
  return (
    <span
      className={cn(
        'flex min-h-24 items-start rounded border border-border bg-background px-3 py-2 leading-relaxed',
        value ? 'text-foreground' : 'text-xs text-muted-foreground/60',
      )}
    >
      {value ?? placeholder}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-3.5 w-1 rounded-full bg-[#1890ff]" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  )
}

function ShopForm({ shop, onBack }: { shop?: Shop; onBack: () => void }) {
  const isEdit = Boolean(shop)
  const [categories, setCategories] = useState<string[]>(shop?.categories ?? [])
  const [region, setRegion] = useState<Region>(shop?.region ?? { province: '', city: '', district: '' })
  const [detailAddress, setDetailAddress] = useState(shop?.detailAddress ?? '')
  const [hasLogo, setHasLogo] = useState(shop?.hasLogo ?? false)
  const [companyImages, setCompanyImages] = useState(shop?.companyImages ?? 0)
  const [agreed, setAgreed] = useState(isEdit)

  const imagesOk = companyImages >= COMPANY_IMAGES_MIN
  const canPublish = agreed && imagesOk && categories.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          返回列表
        </Button>
        {isEdit && <StatusBadge status={shop!.status} />}
      </div>

      <Section title="基本信息">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="店铺名称" required>
            <Input placeholder="请输入店铺名称，不超过 30 个字" value={shop?.name} />
          </Field>
          <Field label="营业时间">
            <Input placeholder="例如：周���至周五 09:00 - 18:00" value={shop?.businessHours} />
          </Field>
          <Field label="主营类目" required span hint={`最多选择 ${MAX_CATEGORIES} 个类目，首个类目将作为店铺主类目展示`}>
            <CategoryPicker value={categories} onChange={setCategories} />
          </Field>
          <Field label="店铺地址" required span>
            <RegionCascader
              value={region}
              onChange={setRegion}
              detail={detailAddress}
              onDetailChange={setDetailAddress}
            />
          </Field>
          <Field label="店铺 Logo" required span>
            <LogoUploader hasLogo={hasLogo} onToggle={() => setHasLogo((v) => !v)} />
          </Field>
          <Field label="店铺简介" span>
            <Textarea placeholder="介绍店铺的经营范围、服务特色等，不超过 200 字" value={shop?.intro} />
          </Field>
        </div>
      </Section>

      <Section title="企业信息介绍">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="企业简介" required span>
            <Textarea
              placeholder="介绍企业背景、规模、服务能力与优势等，建议 100 - 500 字"
              value={shop?.companyIntro}
            />
          </Field>
          <Field label="企业图片" required span>
            <CompanyImagesUploader count={companyImages} onChange={setCompanyImages} />
          </Field>
        </div>
      </Section>

      <Section title="联系人信息">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="联系人" required>
            <Input placeholder="请输入联系人姓名" value={shop?.contact} />
          </Field>
          <Field label="联系人电话" required>
            <Input placeholder="请输入手机号" value={shop?.phone} />
          </Field>
        </div>
      </Section>

      <Section title="资质信息">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="统一社会信用代码" required>
            <Input placeholder="请输入 18 位统一社会信用代码" value={shop?.license} />
          </Field>
          <Field label="营业执照" required>
            <span className="flex h-9 items-center rounded border border-dashed border-border px-3 text-xs text-muted-foreground/60">
              点击上传营业执照扫描件
            </span>
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-md border border-border bg-card px-5 py-3">
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 accent-[#1890ff]"
          />
          <span>
            请阅读并同意
            <button type="button" className="mx-0.5 text-[#1890ff] hover:underline">
              《租售店铺开店须知》
            </button>
            后发布
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button className="bg-[#1890ff] hover:bg-[#1890ff]/90" disabled={!canPublish}>
            {isEdit ? '保存并发布' : '发布并开通'}
          </Button>
          <Button variant="outline">{isEdit ? '仅保存' : '仅保存（未开通）'}</Button>
          <Button variant="ghost" onClick={onBack}>
            取消
          </Button>
          <p className="ml-auto text-xs text-muted-foreground">
            {!agreed
              ? '勾选同意开店须知后方可发布'
              : !imagesOk
                ? `企业图片至少上传 ${COMPANY_IMAGES_MIN} 张后方可发布`
                : categories.length === 0
                  ? '请选择主营类目后发布'
                  : isEdit
                    ? '发布后修改立即生效'
                    : '仅保存时店铺状态为「未开通」，可在列表中开通'}
          </p>
        </div>
      </div>
    </div>
  )
}

function DescItem({ label, value, span }: { label: string; value: React.ReactNode; span?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1 text-sm', span && 'md:col-span-2 lg:col-span-3')}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="leading-relaxed">{value}</dd>
    </div>
  )
}

function DetailActions({ shop, onEdit, onClose }: { shop: Shop; onEdit: () => void; onClose: () => void }) {
  switch (shop.status) {
    case 'open':
      return (
        <>
          <Button variant="outline" size="sm" onClick={onEdit}>
            编辑
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600" onClick={onClose}>
            关闭店铺
          </Button>
        </>
      )
    case 'pending':
      return (
        <>
          <Button variant="outline" size="sm" onClick={onEdit}>
            编辑
          </Button>
          <Button size="sm" className="bg-[#1890ff] hover:bg-[#1890ff]/90">
            开通店铺
          </Button>
        </>
      )
    case 'closed':
      return (
        <Button size="sm" className="bg-[#1890ff] hover:bg-[#1890ff]/90">
          重新开通
        </Button>
      )
  }
}

const timeline: Record<ShopStatus, [string, string][]> = {
  open: [
    ['店铺开通', '审核通过，店铺上线运营'],
    ['资质审核通过', '营业执照与信用代码核验通过'],
    ['提交开通申请', '完善店铺信息并提交'],
    ['创建店铺', '保存基础信息'],
  ],
  pending: [
    ['待开通', '信息已保存，尚未提交开通'],
    ['创建店铺', '保存基础信息'],
  ],
  closed: [
    ['店铺关闭', '商家主动关闭，商品全部下架'],
    ['店铺开通', '审核通过，店铺上线运营'],
    ['创建店铺', '保存基础信息'],
  ],
}

function ShopDetail({
  shop,
  onBack,
  onEdit,
  onClose,
}: {
  shop: Shop
  onBack: () => void
  onEdit: () => void
  onClose: () => void
}) {
  const stats = [
    ['在售 / 在租商品', shop.status === 'open' ? '128' : '0'],
    ['累计订单', shop.status === 'pending' ? '0' : '1,024'],
    ['本月成交额', shop.status === 'open' ? '¥ 186,400' : '¥ 0'],
    ['店铺评分', shop.status === 'pending' ? '—' : '4.8'],
  ]

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
        <ArrowLeft data-icon="inline-start" />
        返回列表
      </Button>

      <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5 md:flex-row md:items-center">
        <div
          className={cn(
            'flex size-16 shrink-0 items-center justify-center rounded-md',
            shop.hasLogo ? 'bg-[#1890ff]/10 text-[#1890ff]' : 'border border-dashed border-border text-muted-foreground',
          )}
          aria-label={shop.hasLogo ? '店铺 Logo' : '未上传 Logo'}
        >
          {shop.hasLogo ? <span className="text-2xl font-bold">{shop.name.slice(0, 1)}</span> : <Store className="size-7" aria-hidden />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{shop.name}</h2>
            <StatusBadge status={shop.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            店铺编号 <span className="font-mono">{shop.id}</span> · 主类目 {shop.categories[0]} · 开通时间{' '}
            {shop.openedAt ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <DetailActions shop={shop} onEdit={onEdit} onClose={onClose} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-md border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Section title="基本信息">
            <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DescItem label="店铺名称" value={shop.name} />
              <DescItem label="所属机构" value={`${shop.org}（${shop.orgLevel === 'self' ? '本级' : '下级'}）`} />
              <DescItem label="营业时间" value={shop.businessHours} />
              <DescItem
                label="店铺 Logo"
                value={shop.hasLogo ? <span className="text-emerald-700">已上传（1:1）</span> : <span className="text-amber-600">未上传</span>}
              />
              <DescItem
                label={`主营类目（${shop.categories.length}/${MAX_CATEGORIES}）`}
                span
                value={
                  <span className="flex flex-wrap gap-1.5">
                    {shop.categories.map((c, i) => (
                      <span
                        key={c}
                        className={cn(
                          'rounded px-2 py-0.5 text-xs',
                          i === 0 ? 'bg-[#1890ff] text-white' : 'bg-[#1890ff]/10 text-[#1890ff]',
                        )}
                      >
                        {i === 0 && '主 · '}
                        {c}
                      </span>
                    ))}
                  </span>
                }
              />
              <DescItem
                label="店铺地址"
                span
                value={
                  <span className="flex flex-col gap-0.5">
                    <span>{fullAddress(shop)}</span>
                    <span className="text-xs text-muted-foreground">
                      {shop.region.province} / {shop.region.city} / {shop.region.district}
                    </span>
                  </span>
                }
              />
              <DescItem label="店铺简介" value={shop.intro} span />
            </dl>
          </Section>
          <Section title="企业信息介绍">
            <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DescItem
                label={`企业图片（${shop.companyImages} 张）`}
                value={
                  shop.companyImages < COMPANY_IMAGES_MIN ? (
                    <span className="text-amber-600">不足 {COMPANY_IMAGES_MIN} 张，发布前需补充</span>
                  ) : (
                    <span className="text-emerald-700">已满足要求</span>
                  )
                }
              />
              <DescItem label="企业简介" value={shop.companyIntro} span />
              {shop.companyImages > 0 && (
                <DescItem
                  label="图片预览"
                  span
                  value={
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                      {Array.from({ length: Math.min(shop.companyImages, 6) }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'relative flex aspect-video items-center justify-center rounded border text-[11px]',
                            i === 0
                              ? 'border-[#1890ff] bg-[#1890ff]/10 text-[#1890ff]'
                              : 'border-border bg-muted text-muted-foreground',
                          )}
                        >
                          {i === 0 ? '正门实景' : `图片 ${i + 1}`}
                          {i === 5 && shop.companyImages > 6 && (
                            <span className="absolute inset-0 flex items-center justify-center rounded bg-black/55 text-xs text-white">
                              +{shop.companyImages - 6}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  }
                />
              )}
            </dl>
          </Section>
          <Section title="联系人信息">
            <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DescItem label="联系人" value={shop.contact} />
              <DescItem label="联系人电话" value={<span className="tabular-nums">{shop.phone}</span>} />
            </dl>
          </Section>
          <Section title="资质信息">
            <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DescItem label="统一社会信用代码" value={<span className="font-mono">{shop.license}</span>} />
              <DescItem
                label="营业执照"
                value={<span className="inline-block h-16 w-24 rounded border border-border bg-muted" aria-label="营业执照图片" />}
              />
              <DescItem label="资质状态" value={shop.status === 'pending' ? '待核验' : '已核验'} />
            </dl>
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <Section title="状态记录">
            <ol className="flex flex-col">
              {timeline[shop.status].map(([title, desc], i) => (
                <li key={title} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="flex flex-col items-center">
                    <span
                      className={cn('mt-1 size-2.5 rounded-full', i === 0 ? 'bg-[#1890ff]' : 'bg-border')}
                      aria-hidden
                    />
                    <span className="w-px flex-1 bg-border last:hidden" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className={cn(i === 0 && 'font-medium')}>{title}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {i === 0 ? shop.updatedAt : shop.createdAt}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
          <Section title="系统信息">
            <dl className="grid gap-3">
              <DescItem label="创建时间" value={<span className="tabular-nums">{shop.createdAt}</span>} />
              <DescItem label="最近更新" value={<span className="tabular-nums">{shop.updatedAt}</span>} />
              <DescItem label="所属商家" value="演示商户（上海）有限公司" />
            </dl>
          </Section>
        </div>
      </div>
    </div>
  )
}

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; shop: Shop } | { type: 'detail'; shop: Shop }

export function ShopInfo({ onTitleChange }: { onTitleChange?: (title: string) => void }) {
  const [mode, setMode] = useState<Mode>({ type: 'list' })
  const [shopList, setShopList] = useState<Shop[]>(shops)
  const [closing, setClosing] = useState<Shop | null>(null)

  const confirmClose = () => {
    if (!closing) return
    const today = new Date().toISOString().slice(0, 10)
    const updated: Shop = { ...closing, status: 'closed', updatedAt: today }
    setShopList((list) => list.map((s) => (s.id === updated.id ? updated : s)))
    if (mode.type === 'detail' && mode.shop.id === updated.id) setMode({ type: 'detail', shop: updated })
    setClosing(null)
  }

  const dialog = closing && (
    <ConfirmCloseDialog shop={closing} onCancel={() => setClosing(null)} onConfirm={confirmClose} />
  )

  const go = (next: Mode) => {
    setMode(next)
    onTitleChange?.(
      next.type === 'list'
        ? '店铺信息'
        : next.type === 'create'
          ? '新增店铺'
          : next.type === 'edit'
            ? '编辑店铺'
            : '店铺详情',
    )
  }

  switch (mode.type) {
    case 'list':
      return (
        <>
          <ShopList
            shops={shopList}
            onDetail={(shop) => go({ type: 'detail', shop })}
            onEdit={(shop) => go({ type: 'edit', shop })}
            onCreate={() => go({ type: 'create' })}
            onClose={setClosing}
          />
          {dialog}
        </>
      )
    case 'create':
      return <ShopForm onBack={() => go({ type: 'list' })} />
    case 'edit':
      return <ShopForm shop={mode.shop} onBack={() => go({ type: 'list' })} />
    case 'detail':
      return (
        <>
          <ShopDetail
            shop={mode.shop}
            onBack={() => go({ type: 'list' })}
            onEdit={() => go({ type: 'edit', shop: mode.shop })}
            onClose={() => setClosing(mode.shop)}
          />
          {dialog}
        </>
      )
  }
}
