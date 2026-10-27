'use client'

import { useState } from 'react'
import { ArrowLeft, Check, FileText, ImagePlus, Info, Plus, ShoppingCart, Timer, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Select, Tip, categoryTree } from '@/components/shop-form-fields'

/* ---------- 基础数据 ---------- */

const UNITS = ['张', '件', '套', '根', '米', '吨', '平方米', '块']
const CONDITIONS = ['全新', '九成新', '八成新', '七成新及以下']
const SHOPS = ['华东建设工程有限公司周转材料店', '苏州分公司模板租赁店', '杭州分公司脚手架专营店']
const RENT_PERIODS = ['天', '月'] as const
const GOODS_IMAGES_MAX = 9

type RentPeriod = (typeof RENT_PERIODS)[number]

/* ---------- 通用表单控件 ---------- */

function Section({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-3.5 w-1 rounded-full bg-[#1890ff]" aria-hidden />
          {title}
        </h2>
        {extra}
      </div>
      {children}
    </section>
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

function TextInput({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = 'text',
  readOnly,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  prefix?: string
  suffix?: string
  type?: 'text' | 'number'
  readOnly?: boolean
}) {
  return (
    <span
      className={cn(
        'flex h-9 items-center rounded border border-border bg-background text-sm focus-within:border-[#1890ff]',
        readOnly && 'bg-muted/40',
      )}
    >
      {prefix && <span className="pl-3 text-muted-foreground">{prefix}</span>}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-xs placeholder:text-muted-foreground/60 read-only:text-muted-foreground"
      />
      {suffix && <span className="pr-3 text-xs text-muted-foreground">{suffix}</span>}
    </span>
  )
}

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-24 rounded border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-xs placeholder:text-muted-foreground/60 focus:border-[#1890ff]"
    />
  )
}

function RadioGroup<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 items-center gap-1 rounded border border-border bg-background p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'h-7 flex-1 rounded px-3 text-xs',
            value === o ? 'bg-[#1890ff] text-white' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-[#1890ff]' : 'bg-muted-foreground/30',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/* ---------- 商品图片 ---------- */

function GoodsImages({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="group relative flex size-24 items-center justify-center rounded border border-border bg-muted/40 text-xs text-muted-foreground"
          >
            图片 {i + 1}
            {i === 0 && (
              <span className="absolute left-0 top-0 rounded-br bg-[#1890ff] px-1.5 text-[10px] leading-4 text-white">主图</span>
            )}
            <button
              type="button"
              aria-label={`删除图片 ${i + 1}`}
              onClick={() => onChange(count - 1)}
              className="absolute -right-1.5 -top-1.5 hidden size-5 items-center justify-center rounded-full bg-foreground/80 text-white group-hover:flex"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {count < GOODS_IMAGES_MAX && (
          <button
            type="button"
            onClick={() => onChange(count + 1)}
            className="flex size-24 flex-col items-center justify-center gap-1 rounded border border-dashed border-border text-xs text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]"
          >
            <ImagePlus className="size-5" aria-hidden />
            上传图片
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        已上传 {count} / {GOODS_IMAGES_MAX} 张，首张为主图，建议 800×800 以上，支持 JPG / PNG，单张不超过 5MB
      </p>
    </div>
  )
}

/* ---------- 附件 ---------- */

type Attachment = { name: string; size: string }

function Attachments({ files, onChange }: { files: Attachment[]; onChange: (f: Attachment[]) => void }) {
  const add = () =>
    onChange([...files, { name: `产品合格证-${String(files.length + 1).padStart(2, '0')}.pdf`, size: '1.2 MB' }])
  return (
    <div className="flex flex-col gap-2">
      {files.map((f, i) => (
        <div key={f.name} className="flex h-9 items-center gap-2 rounded border border-border bg-background px-3 text-sm">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{f.name}</span>
          <span className="text-xs text-muted-foreground">{f.size}</span>
          <button
            type="button"
            aria-label={`删除 ${f.name}`}
            onClick={() => onChange(files.filter((_, idx) => idx !== i))}
            className="text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex h-9 w-fit items-center gap-1.5 rounded border border-dashed border-border px-3 text-xs text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]"
      >
        <Plus className="size-3.5" aria-hidden />
        上传合格证 / 检测报告（PDF、JPG，单个不超过 10MB）
      </button>
    </div>
  )
}

/* ---------- 租售方式 ---------- */

function BizCard({
  enabled,
  onToggle,
  icon,
  title,
  description,
  tone,
  children,
}: {
  enabled: boolean
  onToggle: (v: boolean) => void
  icon: React.ReactNode
  title: string
  description: string
  tone: 'blue' | 'green'
  children: React.ReactNode
}) {
  const accent = tone === 'blue' ? 'border-[#1890ff] bg-[#1890ff]/5' : 'border-emerald-500 bg-emerald-50/60'
  const iconTone = tone === 'blue' ? 'bg-[#1890ff]/10 text-[#1890ff]' : 'bg-emerald-100 text-emerald-700'
  return (
    <div className={cn('flex flex-col rounded-md border transition-colors', enabled ? accent : 'border-border bg-background')}>
      <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
        <span className={cn('flex size-9 items-center justify-center rounded', iconTone)}>{icon}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">{title}</span>
          <span className="truncate text-xs text-muted-foreground">{description}</span>
        </span>
        <Switch checked={enabled} onChange={onToggle} label={`启用${title}`} />
      </label>
      {enabled && <div className="grid gap-4 border-t border-border/60 bg-card px-4 py-4 md:grid-cols-2">{children}</div>}
    </div>
  )
}

/* ---------- 页面 ---------- */

export function GoodsPublish({ onBack, onSubmitted }: { onBack: () => void; onSubmitted?: () => void }) {
  const [name, setName] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [spec, setSpec] = useState('')
  const [unit, setUnit] = useState('')
  const [brand, setBrand] = useState('')
  const [condition, setCondition] = useState('')
  const [shop, setShop] = useState(SHOPS[0])
  const [images, setImages] = useState(0)

  const [stock, setStock] = useState('')
  const [warnStock, setWarnStock] = useState('')
  const [location, setLocation] = useState('')

  const [saleOn, setSaleOn] = useState(true)
  const [salePrice, setSalePrice] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [taxIncluded, setTaxIncluded] = useState(true)
  const [negotiable, setNegotiable] = useState(false)

  const [rentOn, setRentOn] = useState(false)
  const [rentPeriod, setRentPeriod] = useState<RentPeriod>('天')
  const [rentPrice, setRentPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [minDays, setMinDays] = useState('')
  const [maxDays, setMaxDays] = useState('')
  const [lossRule, setLossRule] = useState('')

  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [agreed, setAgreed] = useState(false)

  const unitLabel = unit || '单位'
  const bizSelected = saleOn || rentOn
  const saleOk = !saleOn || Number(salePrice) > 0
  const rentOk = !rentOn || (Number(rentPrice) > 0 && Number(deposit) >= 0 && Number(minDays) > 0)
  const basicOk = name.trim().length > 0 && subCategory && spec.trim().length > 0 && unit && images > 0 && Number(stock) > 0
  const canSubmit = agreed && basicOk && bizSelected && saleOk && rentOk

  const blocker = !basicOk
    ? '请完善基本信息（名称、品类、规格、单位、主图、库存）'
    : !bizSelected
      ? '请至少启用一种租售方式'
      : !saleOk
        ? '请填写出售单价'
        : !rentOk
          ? '请填写租金单价、押金与最短租期'
          : !agreed
            ? '勾选同意商品发布规范后方可提交'
            : '提交后进入平台审核，审核通过自动上架为「运营中」'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          返回商品列表
        </Button>
        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-inset ring-border">
          商品编码：保存后系统自动生成
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_272px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="基本信息">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="商品名称" required span>
                <TextInput value={name} onChange={setName} placeholder="请输入商品名称，如：建筑模板 915×1830×15mm 覆膜板，不超过 60 字" />
              </Field>
              <Field label="品类" required>
                <div className="flex gap-2">
                  <span className="flex h-9 items-center rounded border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                    {categoryTree[0].name}
                  </span>
                  <Select
                    label="二级品类"
                    placeholder="请选择二级品类"
                    value={subCategory}
                    options={categoryTree[0].children}
                    onChange={setSubCategory}
                  />
                </div>
              </Field>
              <Field label="所属店铺" required>
                <Select label="所属店铺" placeholder="请选择店铺" value={shop} options={SHOPS} onChange={setShop} />
              </Field>
              <Field label="规格型号" required>
                <TextInput value={spec} onChange={setSpec} placeholder="如：915×1830×15mm" />
              </Field>
              <Field label="计量单位" required>
                <Select label="计量单位" placeholder="请选择单位" value={unit} options={UNITS} onChange={setUnit} />
              </Field>
              <Field label="品牌 / 厂家">
                <TextInput value={brand} onChange={setBrand} placeholder="选填，如：鲁班建材" />
              </Field>
              <Field label="成色">
                <Select label="成色" placeholder="请选择成色" value={condition} options={CONDITIONS} onChange={setCondition} />
              </Field>
              <Field label="商品图片" required span>
                <GoodsImages count={images} onChange={setImages} />
              </Field>
            </div>
          </Section>

          <Section title="库存信息">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="总库存" required hint="商品实物数量，出售与出租共用">
                <TextInput type="number" value={stock} onChange={setStock} placeholder="0" suffix={unitLabel} />
              </Field>
              <Field label="库存预警值" hint="低于该值时列表标记为紧张">
                <TextInput type="number" value={warnStock} onChange={setWarnStock} placeholder="选填" suffix={unitLabel} />
              </Field>
              <Field label="存放地点">
                <TextInput value={location} onChange={setLocation} placeholder="如：上海松江周转材料仓" />
              </Field>
            </div>
          </Section>

          <Section
            title="租售方式"
            extra={<span className="text-xs text-muted-foreground">可同时启用，每种方式提交后生成一条上架记录</span>}
          >
            <div className="flex flex-col gap-3">
              <BizCard
                enabled={saleOn}
                onToggle={setSaleOn}
                icon={<ShoppingCart className="size-4" aria-hidden />}
                title="出售"
                description="按单价一次性售出，库存随成交扣减"
                tone="blue"
              >
                <Field label="销售单价" required>
                  <TextInput type="number" value={salePrice} onChange={setSalePrice} placeholder="0.00" prefix="¥" suffix={`/ ${unitLabel}`} />
                </Field>
                <Field label="起订量">
                  <TextInput type="number" value={minOrder} onChange={setMinOrder} placeholder="不限" suffix={unitLabel} />
                </Field>
                <div className="flex items-center gap-6 text-sm md:col-span-2">
                  <label className="flex items-center gap-2">
                    <Switch checked={taxIncluded} onChange={setTaxIncluded} label="价格含税" />
                    价格含税（13% 增值税）
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch checked={negotiable} onChange={setNegotiable} label="支持议价" />
                    支持议价
                  </label>
                </div>
              </BizCard>

              <BizCard
                enabled={rentOn}
                onToggle={setRentOn}
                icon={<Timer className="size-4" aria-hidden />}
                title="出租"
                description="按天或按月计租，归还后库存回收"
                tone="green"
              >
                <Field label="计租周期" required>
                  <RadioGroup label="计租周期" value={rentPeriod} options={RENT_PERIODS} onChange={setRentPeriod} />
                </Field>
                <Field label="租金单价" required>
                  <TextInput
                    type="number"
                    value={rentPrice}
                    onChange={setRentPrice}
                    placeholder="0.00"
                    prefix="¥"
                    suffix={`/ ${unitLabel} / ${rentPeriod}`}
                  />
                </Field>
                <Field label="押金" required hint="归还验收合格后退还">
                  <TextInput type="number" value={deposit} onChange={setDeposit} placeholder="0.00" prefix="¥" suffix={`/ ${unitLabel}`} />
                </Field>
                <Field label="最短租期" required>
                  <TextInput type="number" value={minDays} onChange={setMinDays} placeholder="0" suffix={rentPeriod} />
                </Field>
                <Field label="最长租期">
                  <TextInput type="number" value={maxDays} onChange={setMaxDays} placeholder="不限" suffix={rentPeriod} />
                </Field>
                <Field label="损耗赔付标准" span>
                  <TextArea
                    value={lossRule}
                    onChange={setLossRule}
                    placeholder="说明归还时的验收标准及损坏、丢失的赔付方式，如：板面破损超过 10% 按原价 60% 赔付"
                  />
                </Field>
              </BizCard>

              {!bizSelected && <Tip tone="warn">请至少启用一种租售方式，否则商品无法上架。</Tip>}
            </div>
          </Section>

          <Section title="商品详情">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="商品描述" span>
                <TextArea
                  value={description}
                  onChange={setDescription}
                  placeholder="介绍材质、工艺、适用场景、交付方式等，不超过 2000 字"
                />
              </Field>
              <Field label="资质附件" span hint="提交审核时平台将核验合格证或检测报告">
                <Attachments files={files} onChange={setFiles} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <PreviewCard
            name={name}
            subCategory={subCategory}
            spec={spec}
            unit={unit}
            stock={stock}
            images={images}
            sale={saleOn ? { price: salePrice, minOrder } : null}
            rent={rentOn ? { price: rentPrice, period: rentPeriod, deposit, minDays } : null}
          />
          <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Info className="size-4 text-[#1890ff]" aria-hidden />
              发布流程
            </p>
            <ol className="flex flex-col gap-1.5">
              {['填写信息并保存草稿', '提交平台审核（1 个工作日内）', '审核通过自动上架为「运营中」', '审核驳回可修改后重新提交'].map(
                (s, i) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-foreground">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ),
              )}
            </ol>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 flex flex-col items-center gap-3 rounded-md border border-border bg-card px-5 py-4 text-center">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="size-4 accent-[#1890ff]" />
          <span>
            请阅读并同意
            <button type="button" className="mx-0.5 text-[#1890ff] hover:underline">
              《租售商品发布规范》
            </button>
            后提交
          </span>
        </label>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button className="bg-[#1890ff] hover:bg-[#1890ff]/90" disabled={!canSubmit} onClick={onSubmitted}>
            提交审核
          </Button>
          <Button variant="outline">保存草稿</Button>
          <Button variant="ghost" onClick={onBack}>
            取消
          </Button>
        </div>
        <p className={cn('text-xs', canSubmit ? 'text-muted-foreground' : 'text-amber-700')}>{blocker}</p>
      </div>
    </div>
  )
}

/* ---------- 右侧预览 ---------- */

function fmt(v: string) {
  const n = Number(v)
  return n > 0 ? n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
}

function PreviewCard({
  name,
  subCategory,
  spec,
  unit,
  stock,
  images,
  sale,
  rent,
}: {
  name: string
  subCategory: string
  spec: string
  unit: string
  stock: string
  images: number
  sale: { price: string; minOrder: string } | null
  rent: { price: string; period: RentPeriod; deposit: string; minDays: string } | null
}) {
  const u = unit || '单位'
  const listings = [
    sale && { key: 'sale', label: '出售', tone: 'bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30', main: `¥ ${fmt(sale.price)} / ${u}`, sub: sale.minOrder ? `起订 ${sale.minOrder} ${u}` : '不限起订量' },
    rent && {
      key: 'rent',
      label: '出租',
      tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      main: `¥ ${fmt(rent.price)} / ${u} / ${rent.period}`,
      sub: `押金 ¥ ${fmt(rent.deposit)}${rent.minDays ? ` · 最短 ${rent.minDays} ${rent.period}` : ''}`,
    },
  ].filter(Boolean) as { key: string; label: string; tone: string; main: string; sub: string }[]

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
      <p className="text-sm font-medium">上架预览</p>
      <div className="flex gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center rounded border border-border bg-muted/40 text-[10px] text-muted-foreground">
          {images > 0 ? '主图' : '暂无图'}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className={cn('line-clamp-2 text-sm font-medium leading-5', !name && 'text-muted-foreground/60')}>
            {name || '商品名称'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[subCategory || '品类', spec || '规格型号'].join(' · ')}
          </p>
          <p className="text-xs text-muted-foreground">
            库存 {Number(stock) > 0 ? Number(stock).toLocaleString() : '—'} {u}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">将生成 {listings.length} 条上架记录</p>
        {listings.length === 0 && <p className="text-xs text-amber-700">尚未启用租售方式</p>}
        {listings.map((l) => (
          <div key={l.key} className="flex items-center gap-2 rounded border border-border px-2.5 py-2">
            <span className={cn('rounded px-1.5 text-[10px] leading-4 ring-1 ring-inset', l.tone)}>{l.label}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm tabular-nums">{l.main}</span>
              <span className="truncate text-[11px] text-muted-foreground">{l.sub}</span>
            </span>
            <Check className={cn('size-4', l.main.includes('—') ? 'text-muted-foreground/30' : 'text-emerald-600')} aria-hidden />
          </div>
        ))}
      </div>
    </div>
  )
}
