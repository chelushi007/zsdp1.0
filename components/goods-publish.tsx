'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  ImagePlus,
  Info,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RegionCascader, Select, Tip, regionTree, type Region } from '@/components/shop-form-fields'
import { MaterialPicker } from '@/components/material-picker'
import { GoodsDetailTable, lineComplete, newGoodsLine, type GoodsLine } from '@/components/goods-detail-table'
import { type Material } from '@/lib/materials-data'

/* ---------- 基础数据 ---------- */

const SHOPS = ['华东建设工程有限公司周转材料店', '苏州分公司模板租赁店', '杭州分公司脚手架专营店']
const GOODS_IMAGES_MAX = 9
const EMPTY_REGION: Region = { province: '', city: '', district: '' }


/** 禁售地区：精确到省或市，city 为空表示整省禁售 */
type BanArea = { province: string; city?: string }

function banAreaKey(a: BanArea) {
  return a.city ? `${a.province}/${a.city}` : a.province
}
function banAreaLabel(a: BanArea) {
  return a.city ? `${a.province} · ${a.city}` : `${a.province}（全省）`
}

type BanTemplate = { id: string; name: string; desc: string; areas: BanArea[]; updatedAt: string }

/** 区域禁售模板：引用后带入禁售地区，可继续自定义增减 */
const INITIAL_BAN_TEMPLATES: BanTemplate[] = [
  { id: 'T1', name: '仅限华东', desc: '北京、广东全省禁售', areas: [{ province: '北京市' }, { province: '广东省' }], updatedAt: '2024-09-12' },
  {
    id: 'T2',
    name: '仅限本市',
    desc: '除上海外其余省份全部禁售',
    areas: [{ province: '北京市' }, { province: '浙江省' }, { province: '江苏省' }, { province: '广东省' }],
    updatedAt: '2024-08-03',
  },
  {
    id: 'T3',
    name: '华南限售',
    desc: '广州、深圳禁售',
    areas: [{ province: '广东省', city: '广州市' }, { province: '广东省', city: '深圳市' }],
    updatedAt: '2024-07-21',
  },
]

type FreightMode = '包邮' | '固定运费' | '按数量计费' | '按距离计费' | '到付'
type FreightRule = {
  mode: FreightMode
  /** 固定运费 / 按距离起步费 / 按数量首件运费 */
  base: string
  perKm: string
  freeOver: string
  /** 按数量计费：首件数量、续件数量、续件运费 */
  firstQty: string
  addQty: string
  addFee: string
}
const EMPTY_FREIGHT: FreightRule = { mode: '包邮', base: '', perKm: '', freeOver: '', firstQty: '', addQty: '', addFee: '' }

/** 运费模板：选中后带出计费方式与金额 */
const FREIGHT_TEMPLATES: { name: string; desc: string; rule: FreightRule }[] = [
  { name: '周转材料-包邮', desc: '全国包邮，由商家承担运费', rule: { ...EMPTY_FREIGHT, mode: '包邮' } },
  { name: '周转材料-固定运费', desc: '每单固定 300 元，满 20000 元免运费', rule: { ...EMPTY_FREIGHT, mode: '固定运费', base: '300', freeOver: '20000' } },
  {
    name: '周转材料-按数量计费',
    desc: '首 100 件 300 元，每增加 100 件加收 150 元',
    rule: { ...EMPTY_FREIGHT, mode: '按数量计费', firstQty: '100', base: '300', addQty: '100', addFee: '150' },
  },
  { name: '大件-按距离计费', desc: '起步 500 元，超出 50km 每公里 8 元', rule: { ...EMPTY_FREIGHT, mode: '按距离计费', base: '500', perKm: '8' } },
  { name: '运费到付', desc: '由买方承担运费，物流到付', rule: { ...EMPTY_FREIGHT, mode: '到付' } },
]
const FREIGHT_MODES: FreightMode[] = ['包邮', '固定运费', '按数量计费', '按距离计费', '到付']

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

/* ---------- 发布流程图 ---------- */

type FlowNode = { key: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }>; tone: 'current' | 'default' | 'success' | 'warn' }

const FLOW_NODES: FlowNode[] = [
  { key: 'fill', title: '填写商品信息', desc: '基本信息、库存、运营方式、运费', icon: FileText, tone: 'current' },
  { key: 'draft', title: '保存草稿', desc: '可随时修改，不对外展示', icon: Save, tone: 'default' },
  { key: 'review', title: '提交平台审核', desc: '1 个工作日内完成', icon: ShieldCheck, tone: 'default' },
  { key: 'live', title: '审核通过 · 自动上架', desc: '状态变为「运营中」', icon: CheckCircle2, tone: 'success' },
]

const flowTone: Record<FlowNode['tone'], { ring: string; icon: string; title: string }> = {
  current: { ring: 'border-[#1890ff] bg-[#1890ff]/5', icon: 'bg-[#1890ff] text-white', title: 'text-[#1890ff]' },
  default: { ring: 'border-border bg-background', icon: 'bg-muted text-muted-foreground', title: 'text-foreground' },
  success: { ring: 'border-emerald-200 bg-emerald-50/60', icon: 'bg-emerald-600 text-white', title: 'text-emerald-700' },
  warn: { ring: 'border-amber-200 bg-amber-50/60', icon: 'bg-amber-500 text-white', title: 'text-amber-700' },
}

function PublishFlow() {
  return (
    <section aria-label="发布流程" className="rounded-md border border-border bg-card px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-medium">
          <Info className="size-4 text-[#1890ff]" aria-hidden />
          发布流程
        </h2>
        <span className="text-xs text-muted-foreground">当前处于第 1 步</span>
      </div>

      <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0">
        {FLOW_NODES.map((node, i) => {
          const tone = flowTone[node.tone]
          const Icon = node.icon
          const isLast = i === FLOW_NODES.length - 1
          return (
            <li key={node.key} className="flex flex-1 flex-col lg:flex-row lg:items-center">
              <div className={cn('flex flex-1 items-center gap-3 rounded-md border px-3 py-2.5', tone.ring)}>
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', tone.icon)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={cn('text-sm font-medium', tone.title)}>
                    <span className="mr-1 text-xs text-muted-foreground">{i + 1}.</span>
                    {node.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{node.desc}</span>
                </span>
              </div>
              {!isLast && (
                <span className="flex items-center justify-center py-1 text-muted-foreground lg:px-1.5 lg:py-0" aria-hidden>
                  <ChevronRight className="hidden size-4 lg:block" />
                  <ChevronDown className="size-4 lg:hidden" />
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground lg:flex-row lg:items-center lg:gap-4">
        <span className="flex items-center gap-1.5">
          <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-white">
            <RotateCcw className="size-2.5" aria-hidden />
          </span>
          审核驳回：返回第 1 步修改后可重新提交
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-white">
            <Ban className="size-2.5" aria-hidden />
          </span>
          上架后如违规将被强制下架，整改后重新提交审核
        </span>
      </div>
    </section>
  )
}

/* ---------- 禁售模板管理 ---------- */

function BanTemplateManager({
  templates,
  currentAreas,
  onChange,
  onApply,
  onClose,
}: {
  templates: BanTemplate[]
  currentAreas: BanArea[]
  onChange: (list: BanTemplate[]) => void
  onApply: (id: string) => void
  onClose: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ name: string; desc: string; areas: BanArea[] }>({ name: '', desc: '', areas: [] })
  const [pick, setPick] = useState<{ province: string; city: string }>({ province: '', city: '' })
  const [creating, setCreating] = useState(false)

  const startCreate = (fromCurrent: boolean) => {
    setCreating(true)
    setEditingId(null)
    setDraft({ name: '', desc: '', areas: fromCurrent ? currentAreas : [] })
  }
  const startEdit = (t: BanTemplate) => {
    setCreating(false)
    setEditingId(t.id)
    setDraft({ name: t.name, desc: t.desc, areas: t.areas })
  }
  const cancelEdit = () => {
    setCreating(false)
    setEditingId(null)
  }
  const addArea = () => {
    if (!pick.province) return
    const area: BanArea = pick.city ? { province: pick.province, city: pick.city } : { province: pick.province }
    setDraft((d) => {
      const key = banAreaKey(area)
      if (d.areas.some((a) => banAreaKey(a) === key || (!a.city && a.province === area.province))) return d
      const rest = area.city ? d.areas : d.areas.filter((a) => a.province !== area.province)
      return { ...d, areas: [...rest, area] }
    })
    setPick({ province: '', city: '' })
  }
  const removeArea = (key: string) => setDraft((d) => ({ ...d, areas: d.areas.filter((a) => banAreaKey(a) !== key) }))

  const nameTaken = templates.some((t) => t.name === draft.name.trim() && t.id !== editingId)
  const draftOk = draft.name.trim().length > 0 && draft.areas.length > 0 && !nameTaken

  const save = () => {
    if (!draftOk) return
    const today = new Date().toISOString().slice(0, 10)
    const record = { name: draft.name.trim(), desc: draft.desc.trim(), areas: draft.areas, updatedAt: today }
    if (editingId) {
      onChange(templates.map((t) => (t.id === editingId ? { ...t, ...record } : t)))
    } else {
      onChange([...templates, { id: `T${Date.now()}`, ...record }])
    }
    cancelEdit()
  }
  const remove = (id: string) => {
    onChange(templates.filter((t) => t.id !== id))
    if (editingId === id) cancelEdit()
  }

  const editing = creating || editingId !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ban-template-title"
        className="flex max-h-[85vh] w-full max-w-[760px] flex-col rounded-md bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 id="ban-template-title" className="text-base font-semibold">
            管理禁售模板
          </h3>
          <button type="button" aria-label="关闭" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {!editing && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">共 {templates.length} 个模板，发布商品时可直接引用</span>
                <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => startCreate(false)}>
                  <Plus data-icon="inline-start" />
                  新建模板
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#1890ff] hover:bg-[#1890ff]/90"
                  disabled={currentAreas.length === 0}
                  onClick={() => startCreate(true)}
                >
                  将当前禁售地区存为模板
                </Button>
              </div>

              {templates.length === 0 ? (
                <p className="rounded border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  暂无模板，点击「新建模板」创建
                </p>
              ) : (
                <ul className="divide-y divide-border rounded border border-border">
                  {templates.map((t) => (
                    <li key={t.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-xs text-muted-foreground">更新于 {t.updatedAt}</span>
                        </span>
                        {t.desc && <span className="text-xs text-muted-foreground">{t.desc}</span>}
                        <span className="flex flex-wrap gap-1">
                          {t.areas.map((a) => (
                            <span key={banAreaKey(a)} className="rounded bg-red-50 px-1.5 text-[11px] leading-5 text-red-600 ring-1 ring-inset ring-red-200">
                              {banAreaLabel(a)}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 pt-0.5 text-xs">
                        <button type="button" onClick={() => onApply(t.id)} className="text-[#1890ff] hover:underline">
                          引用
                        </button>
                        <button type="button" onClick={() => startEdit(t)} className="text-[#1890ff] hover:underline">
                          编辑
                        </button>
                        <button type="button" onClick={() => remove(t.id)} className="text-red-600 hover:underline">
                          删除
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {editing && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium">{editingId ? '编辑模板' : '新建模板'}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="模板名称" required hint={nameTaken ? '名称已存在' : undefined}>
                  <TextInput value={draft.name} onChange={(name) => setDraft((d) => ({ ...d, name }))} placeholder="如：仅限华东" />
                </Field>
                <Field label="说明">
                  <TextInput value={draft.desc} onChange={(desc) => setDraft((d) => ({ ...d, desc }))} placeholder="选填，便于识别模板用途" />
                </Field>
              </div>
              <Field label="添加禁售地区" hint="可选择整省禁售，或精确到地级市">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex w-40">
                    <Select
                      label="模板省份"
                      placeholder="选择省份"
                      value={pick.province}
                      options={Object.keys(regionTree)}
                      onChange={(province) => setPick({ province, city: '' })}
                    />
                  </div>
                  <div className="flex w-40">
                    <Select
                      label="模板城市"
                      placeholder={pick.province ? '全省' : '先选择省份'}
                      value={pick.city}
                      options={pick.province ? Object.keys(regionTree[pick.province]) : []}
                      onChange={(city) => setPick((p) => ({ ...p, city }))}
                      disabled={!pick.province}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addArea} disabled={!pick.province}>
                    <Plus data-icon="inline-start" />
                    添加
                  </Button>
                </div>
              </Field>
              <Field label="禁售地区" required hint={draft.areas.length ? `共 ${draft.areas.length} 个地区` : '至少添加一个禁售地区'}>
                {draft.areas.length === 0 ? (
                  <p className="flex h-9 items-center text-sm text-muted-foreground">尚未添加</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {draft.areas.map((a) => {
                      const key = banAreaKey(a)
                      return (
                        <span key={key} className="flex h-8 items-center gap-1 rounded border border-red-200 bg-red-50 pl-2.5 pr-1 text-xs text-red-600">
                          <Ban className="size-3" aria-hidden />
                          {banAreaLabel(a)}
                          <button
                            type="button"
                            aria-label={`移除 ${banAreaLabel(a)}`}
                            onClick={() => removeArea(key)}
                            className="ml-0.5 flex size-5 items-center justify-center rounded hover:bg-red-100"
                          >
                            <X className="size-3" aria-hidden />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </Field>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          {editing ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                取消
              </Button>
              <Button type="button" size="sm" className="bg-[#1890ff] hover:bg-[#1890ff]/90" disabled={!draftOk} onClick={save}>
                保存模板
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- 模板选择 ---------- */

function TemplatePicker({
  label,
  templates,
  value,
  onChange,
}: {
  label: string
  templates: { name: string; desc: string }[]
  value: string
  onChange: (name: string) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {templates.map((t) => {
        const active = value === t.name
        return (
          <button
            key={t.name}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(t.name)}
            className={cn(
              'flex items-start gap-2 rounded border px-3 py-2 text-left transition-colors',
              active ? 'border-[#1890ff] bg-[#1890ff]/5' : 'border-border bg-background hover:border-[#1890ff]/50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                active ? 'border-[#1890ff] bg-[#1890ff] text-white' : 'border-border',
              )}
            >
              {active && <Check className="size-3" aria-hidden />}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm">{t.name}</span>
              <span className="text-xs text-muted-foreground">{t.desc}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- 运营方式 ---------- */

/* ---------- 页面 ---------- */

export function GoodsPublish({ onBack, onSubmitted }: { onBack: () => void; onSubmitted?: () => void }) {
  const [name, setName] = useState('')
  const [shop, setShop] = useState(SHOPS[0])
  const [images, setImages] = useState(0)
  const [region, setRegion] = useState<Region>(EMPTY_REGION)
  const [address, setAddress] = useState('')

  const [lines, setLines] = useState<GoodsLine[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)


  const [banEnabled, setBanEnabled] = useState(false)
  const [banAreas, setBanAreas] = useState<BanArea[]>([])
  const [banSource, setBanSource] = useState<string | null>(null)
  const [banPick, setBanPick] = useState<{ province: string; city: string }>({ province: '', city: '' })
  const [banTemplates, setBanTemplates] = useState<BanTemplate[]>(INITIAL_BAN_TEMPLATES)
  const [banTemplateId, setBanTemplateId] = useState('')
  const [banManagerOpen, setBanManagerOpen] = useState(false)

  const [freightTemplate, setFreightTemplate] = useState(FREIGHT_TEMPLATES[0].name)
  const [freight, setFreight] = useState<FreightRule>(FREIGHT_TEMPLATES[0].rule)

  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [agreed, setAgreed] = useState(false)

  const applyBanTemplate = (id: string) => {
    setBanTemplateId(id)
    const t = banTemplates.find((x) => x.id === id)
    if (!t) return
    setBanAreas(t.areas)
    setBanSource(t.name)
  }
  const addBanArea = () => {
    if (!banPick.province) return
    const area: BanArea = banPick.city ? { province: banPick.province, city: banPick.city } : { province: banPick.province }
    setBanAreas((list) => {
      // 整省禁售时移除该省下已单独添加的城市；添加城市时若整省已禁售则忽略
      const key = banAreaKey(area)
      if (list.some((a) => banAreaKey(a) === key || (!a.city && a.province === area.province))) return list
      const rest = area.city ? list : list.filter((a) => a.province !== area.province)
      return [...rest, area]
    })
    setBanPick({ province: '', city: '' })
  }
  const removeBanArea = (key: string) => setBanAreas((list) => list.filter((a) => banAreaKey(a) !== key))
  const bannedProvinceCount = new Set(banAreas.map((a) => a.province)).size

  const applyFreightTemplate = (name: string) => {
    setFreightTemplate(name)
    const t = FREIGHT_TEMPLATES.find((x) => x.name === name)
    if (t) setFreight(t.rule)
  }
  const updateFreight = (patch: Partial<FreightRule>) => setFreight((f) => ({ ...f, ...patch }))
  const num = (v: string) => (v === '' ? NaN : Number(v))

  const addMaterials = (list: Material[]) => {
    setLines((prev) => [...prev, ...list.filter((m) => !prev.some((l) => l.material.code === m.code)).map(newGoodsLine)])
    setPickerOpen(false)
  }

  const unitLabel = lines[0]?.material.unit ?? '单位'
  const incompleteLines = lines.filter((l) => !lineComplete(l)).length
  const linesOk = lines.length > 0 && incompleteLines === 0
  const totalStock = lines.reduce((sum, l) => sum + (Number(l.stock) || 0), 0)
  const regionOk = Boolean(region.province && region.city && region.district) && address.trim().length > 0
  const basicOk = name.trim().length > 0 && images > 0 && regionOk
  const freightOk =
    freight.mode === '包邮' ||
    freight.mode === '到付' ||
    (freight.mode === '固定运费' && num(freight.base) >= 0) ||
    (freight.mode === '按距离计费' && num(freight.base) >= 0 && num(freight.perKm) > 0) ||
    (freight.mode === '按数量计费' &&
      num(freight.firstQty) > 0 &&
      num(freight.base) >= 0 &&
      num(freight.addQty) > 0 &&
      num(freight.addFee) >= 0)
  const canSubmit = agreed && basicOk && linesOk && freightOk

  const blocker = !basicOk
    ? !regionOk
      ? '请选择商品所在地并填写具体地址'
      : '请完善基本信息（名称、主图）'
    : lines.length === 0
      ? '请添加至少一条商品明细'
      : incompleteLines > 0
        ? `还有 ${incompleteLines} 条明细未填写完整（库存、起订量）`
        : !freightOk
          ? '请完善运费设置'
          : !agreed
            ? '勾选同意商品发布规范后方可提交'
            : '提交后进入平台审核，审核通过后可在商品列表中选择租售方式上架'

  const regionLabel = [region.province, region.city, region.district].filter(Boolean).join(' / ')

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

      <PublishFlow />

      {pickerOpen && <MaterialPicker excludeCodes={lines.map((l) => l.material.code)} onConfirm={addMaterials} onClose={() => setPickerOpen(false)} />}

      {banManagerOpen && (
        <BanTemplateManager
          templates={banTemplates}
          currentAreas={banAreas}
          onChange={(list) => {
            setBanTemplates(list)
            if (!list.some((t) => t.id === banTemplateId)) setBanTemplateId('')
          }}
          onApply={(id) => {
            applyBanTemplate(id)
            setBanEnabled(true)
            setBanManagerOpen(false)
          }}
          onClose={() => setBanManagerOpen(false)}
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="基本信息">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="商品名称" required span>
                <TextInput value={name} onChange={setName} placeholder="请输入商品名称，如：建筑模板 915×1830×15mm 覆膜板，不超过 60 字" />
              </Field>
              <Field label="所属店铺" required>
                <Select label="所属店铺" placeholder="请选择店铺" value={shop} options={SHOPS} onChange={setShop} />
              </Field>
              <Field label="商品所在地" required span hint="省 / 市 / 区县 + 具体地址，用于计算运费与买方筛选">
                <RegionCascader value={region} onChange={setRegion} detail={address} onDetailChange={setAddress} />
              </Field>
              <Field label="商品图片" required span>
                <GoodsImages count={images} onChange={setImages} />
              </Field>
            </div>
          </Section>

          <Section
            title="商品明细"
            extra={
              <span className="text-xs text-muted-foreground">
                {lines.length > 0 ? `${lines.length} 个规格 · 总库存 ${totalStock.toLocaleString('zh-CN')}` : '同品类可添加多个规格型号'}
              </span>
            }
          >
            <GoodsDetailTable lines={lines} onChange={setLines} onAdd={() => setPickerOpen(true)} />
          </Section>

          <Section
            title="区域禁售"
            extra={
              <button type="button" onClick={() => setBanManagerOpen(true)} className="text-xs text-[#1890ff] hover:underline">
                管理禁售模板
              </button>
            }
          >
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={banEnabled} onChange={setBanEnabled} label="启用区域禁售" />
                启用区域禁售
                <span className="text-xs text-muted-foreground">（关闭时全国范围均可下单）</span>
              </label>

              {banEnabled && (
                <>
                  <Field label="引用模板" hint="引用后会替换当前禁售地区，可继续自定义增减；修改不影响模板本身">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex w-64">
                        <Select
                          label="禁售模板"
                          placeholder={banTemplates.length ? '选择禁售模板' : '暂无模板，请先创建'}
                          value={banTemplates.find((t) => t.id === banTemplateId)?.name ?? ''}
                          options={banTemplates.map((t) => t.name)}
                          onChange={(n) => applyBanTemplate(banTemplates.find((t) => t.name === n)?.id ?? '')}
                          disabled={banTemplates.length === 0}
                        />
                      </div>
                      {banSource && (
                        <span className="text-xs text-muted-foreground">
                          当前来源：模板「{banSource}」{banAreas.length > 0 && '（可继续调整）'}
                        </span>
                      )}
                    </div>
                  </Field>

                  <Field label="自定义添加" hint="可选择整省禁售，或精确到地级市">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex w-40">
                        <Select
                          label="禁售省份"
                          placeholder="选择省份"
                          value={banPick.province}
                          options={Object.keys(regionTree)}
                          onChange={(province) => setBanPick({ province, city: '' })}
                        />
                      </div>
                      <div className="flex w-40">
                        <Select
                          label="禁售城市"
                          placeholder={banPick.province ? '全省' : '先选择省份'}
                          value={banPick.city}
                          options={banPick.province ? Object.keys(regionTree[banPick.province]) : []}
                          onChange={(city) => setBanPick((p) => ({ ...p, city }))}
                          disabled={!banPick.province}
                        />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addBanArea} disabled={!banPick.province}>
                        <Plus data-icon="inline-start" />
                        添加
                      </Button>
                    </div>
                  </Field>

                  <Field
                    label="禁售地区"
                    hint={banAreas.length ? `共 ${banAreas.length} 个地区，涉及 ${bannedProvinceCount} 个省份` : '尚未添加禁售地区'}
                  >
                    {banAreas.length === 0 ? (
                      <p className="flex h-9 items-center text-sm text-muted-foreground">请通过引用或自定义添加禁售地区</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {banAreas.map((a) => {
                          const key = banAreaKey(a)
                          return (
                            <span
                              key={key}
                              className="flex h-8 items-center gap-1 rounded border border-red-200 bg-red-50 pl-2.5 pr-1 text-xs text-red-600"
                            >
                              <Ban className="size-3" aria-hidden />
                              {banAreaLabel(a)}
                              <button
                                type="button"
                                aria-label={`移除 ${banAreaLabel(a)}`}
                                onClick={() => removeBanArea(key)}
                                className="ml-0.5 flex size-5 items-center justify-center rounded hover:bg-red-100"
                              >
                                <X className="size-3" aria-hidden />
                              </button>
                            </span>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => setBanManagerOpen(true)}
                          className="h-8 px-2 text-xs text-[#1890ff] hover:underline"
                        >
                          存为模板
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBanAreas([])
                            setBanSource(null)
                            setBanTemplateId('')
                          }}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          清空
                        </button>
                      </div>
                    )}
                  </Field>

                  {banAreas.length > 0 && (
                    <Tip>禁售地区的买方将无法查看价格与下单，商品详情页显示「该地区暂不支持」。</Tip>
                  )}
                </>
              )}
            </div>
          </Section>

          <Section
            title="运费设置"
            extra={
              <button type="button" className="text-xs text-[#1890ff] hover:underline">
                管理运费模板
              </button>
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="选择模板" hint="选择后可在下方微调，修改不影响模板本身">
                <TemplatePicker
                  label="运费模板"
                  templates={FREIGHT_TEMPLATES}
                  value={freightTemplate}
                  onChange={applyFreightTemplate}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="计费方式" required>
                  <Select
                    label="计费方式"
                    placeholder="请选择计费方式"
                    value={freight.mode}
                    options={FREIGHT_MODES}
                    onChange={(mode) => updateFreight({ mode: mode as FreightMode })}
                  />
                </Field>
                {freight.mode === '固定运费' && (
                  <>
                    <Field label="每单运费" required>
                      <TextInput type="number" value={freight.base} onChange={(v) => updateFreight({ base: v })} placeholder="0.00" prefix="¥" suffix="/ 单" />
                    </Field>
                    <Field label="满额包邮" hint="订单金额达到后免运费">
                      <TextInput type="number" value={freight.freeOver} onChange={(v) => updateFreight({ freeOver: v })} placeholder="不设置" prefix="¥" />
                    </Field>
                  </>
                )}
                {freight.mode === '按数量计费' && (
                  <>
                    <Field label="首件数量" required>
                      <TextInput type="number" value={freight.firstQty} onChange={(v) => updateFreight({ firstQty: v })} placeholder="0" suffix={unitLabel} />
                    </Field>
                    <Field label="首件运费" required>
                      <TextInput type="number" value={freight.base} onChange={(v) => updateFreight({ base: v })} placeholder="0.00" prefix="¥" />
                    </Field>
                    <Field label="续件数量" required hint="每增加该数量加收一次续件运费">
                      <TextInput type="number" value={freight.addQty} onChange={(v) => updateFreight({ addQty: v })} placeholder="0" suffix={unitLabel} />
                    </Field>
                    <Field label="续件运费" required>
                      <TextInput type="number" value={freight.addFee} onChange={(v) => updateFreight({ addFee: v })} placeholder="0.00" prefix="¥" />
                    </Field>
                    <Field label="满额包邮" hint="订单金额达到后免运费">
                      <TextInput type="number" value={freight.freeOver} onChange={(v) => updateFreight({ freeOver: v })} placeholder="不设置" prefix="¥" />
                    </Field>
                  </>
                )}
                {freight.mode === '按距离计费' && (
                  <>
                    <Field label="起步运费" required hint="含 50km 以内">
                      <TextInput type="number" value={freight.base} onChange={(v) => updateFreight({ base: v })} placeholder="0.00" prefix="¥" />
                    </Field>
                    <Field label="超出每公里" required>
                      <TextInput type="number" value={freight.perKm} onChange={(v) => updateFreight({ perKm: v })} placeholder="0.00" prefix="¥" suffix="/ km" />
                    </Field>
                  </>
                )}
                {freight.mode === '包邮' && (
                  <p className="flex items-center text-sm text-muted-foreground md:col-span-2">
                    <Truck className="mr-1.5 size-4" aria-hidden />
                    全国包邮，运费由商家承担
                  </p>
                )}
                {freight.mode === '到付' && (
                  <p className="flex items-center text-sm text-muted-foreground md:col-span-2">
                    <Truck className="mr-1.5 size-4" aria-hidden />
                    运费由买方在收货时支付给物流方
                  </p>
                )}
              </div>
              {regionLabel && freight.mode === '按距离计费' && (
                <Tip>运输距离以商品所在地「{regionLabel}」为起点，按买方收货地址估算。</Tip>
              )}
              {freight.mode === '按数量计费' && num(freight.firstQty) > 0 && num(freight.addQty) > 0 && (
                <Tip>
                  示例：购买 {num(freight.firstQty) + num(freight.addQty) * 2} {unitLabel}，运费 = ¥ {fmt(freight.base)} + 2 × ¥{' '}
                  {fmt(freight.addFee)} = ¥ {fmt(String(num(freight.base) + 2 * num(freight.addFee)))}
                </Tip>
              )}
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

/* ---------- 工具 ---------- */

function fmt(v: string) {
  const n = Number(v)
  return n > 0 ? n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
}
