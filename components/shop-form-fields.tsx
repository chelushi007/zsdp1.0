'use client'

import { useState } from 'react'
import { Check, ChevronRight, ImagePlus, Info, Minus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ---------- 类目数据 ---------- */

export const categoryTree: { name: string; children: string[] }[] = [
  {
    name: '循环物资',
    children: ['模板类', '支护类', '脚手架类', '拼装类', '轨道类', '型材类', '电线电缆', '房屋建筑类', '其他材料'],
  },
]

export const MAX_CATEGORIES = 5

function CheckBox({
  state,
  disabled,
}: {
  state: 'checked' | 'indeterminate' | 'unchecked'
  disabled?: boolean
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-sm border bg-background',
        state === 'unchecked' ? 'border-border' : 'border-[#1890ff] bg-[#1890ff] text-white',
        disabled && 'opacity-40',
      )}
    >
      {state === 'checked' && <Check className="size-3" />}
      {state === 'indeterminate' && <Minus className="size-3" />}
    </span>
  )
}

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(value)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [categoryTree[0].name]: true })
  const full = draft.length >= MAX_CATEGORIES

  const openDialog = () => {
    setDraft(value)
    setOpen(true)
  }

  const toggleChild = (name: string) => {
    if (draft.includes(name)) setDraft(draft.filter((v) => v !== name))
    else if (!full) setDraft([...draft, name])
  }

  const toggleGroup = (children: string[]) => {
    const selected = children.filter((c) => draft.includes(c))
    if (selected.length === children.length) {
      setDraft(draft.filter((v) => !children.includes(v)))
      return
    }
    const room = MAX_CATEGORIES - draft.length
    const toAdd = children.filter((c) => !draft.includes(c)).slice(0, Math.max(room, 0))
    setDraft([...draft, ...toAdd])
  }

  const removeValue = (name: string) => onChange(value.filter((v) => v !== name))

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-9 flex-wrap items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-left hover:border-[#1890ff]"
      >
        {value.length === 0 && (
          <span className="px-1 text-xs text-muted-foreground/60">请选择主营类目，最多 {MAX_CATEGORIES} 个</span>
        )}
        {value.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded bg-[#1890ff]/10 px-2 py-0.5 text-xs text-[#1890ff]">
            {v}
            <span
              role="button"
              tabIndex={0}
              aria-label={`移除 ${v}`}
              onClick={(e) => {
                e.stopPropagation()
                removeValue(v)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  removeValue(v)
                }
              }}
              className="rounded-sm hover:bg-[#1890ff]/20"
            >
              <X className="size-3" aria-hidden />
            </span>
          </span>
        ))}
        <span className="ml-auto pr-1 text-xs tabular-nums text-muted-foreground">
          {value.length}/{MAX_CATEGORIES}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-dialog-title"
            className="flex max-h-[85vh] w-full max-w-[720px] flex-col rounded-md bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 id="category-dialog-title" className="text-base font-semibold">
                选择类目
              </h3>
              <div className="flex items-center gap-3">
                <span className={cn('text-xs text-muted-foreground', full && 'text-amber-600')}>
                  {full ? `已选满 ${MAX_CATEGORIES} 个` : `已选 ${draft.length} 个，还可选 ${MAX_CATEGORIES - draft.length} 个`}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="关闭"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto p-3" aria-label="类目树">
              {categoryTree.map((g) => {
                const isOpen = expanded[g.name] ?? false
                const selected = g.children.filter((c) => draft.includes(c)).length
                const groupState =
                  selected === 0 ? 'unchecked' : selected === g.children.length ? 'checked' : 'indeterminate'
                return (
                  <li key={g.name} className="mb-1">
                    <div className="flex items-center gap-2 rounded bg-muted/60 px-2 py-2">
                      <button
                        type="button"
                        aria-label={isOpen ? `收起 ${g.name}` : `展开 ${g.name}`}
                        aria-expanded={isOpen}
                        onClick={() => setExpanded((e) => ({ ...e, [g.name]: !isOpen }))}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className={cn('size-4 transition-transform', isOpen && 'rotate-90')} aria-hidden />
                      </button>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={groupState === 'indeterminate' ? 'mixed' : groupState === 'checked'}
                        onClick={() => toggleGroup(g.children)}
                        className="flex items-center gap-2 text-sm font-semibold"
                      >
                        <CheckBox state={groupState} />
                        {g.name}
                        {selected > 0 && (
                          <span className="rounded-full bg-[#1890ff] px-1.5 text-[10px] font-normal leading-4 text-white">{selected}</span>
                        )}
                      </button>
                    </div>
                    {isOpen && (
                      <ul className="py-1">
                        {g.children.map((c) => {
                          const checked = draft.includes(c)
                          const disabled = !checked && full
                          return (
                            <li key={c}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                disabled={disabled}
                                onClick={() => toggleChild(c)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded py-2 pl-12 pr-2 text-left text-sm hover:bg-muted/50',
                                  checked && 'text-[#1890ff]',
                                  disabled && 'cursor-not-allowed text-muted-foreground hover:bg-transparent',
                                )}
                              >
                                <CheckBox state={checked ? 'checked' : 'unchecked'} disabled={disabled} />
                                {c}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded border border-[#1890ff] px-5 text-sm text-[#1890ff] hover:bg-[#1890ff]/5"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(draft)
                  setOpen(false)
                }}
                className="h-9 rounded bg-[#1890ff] px-5 text-sm font-medium text-white hover:bg-[#1890ff]/90"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- 省市区数据（示意） ---------- */

export const regionTree: Record<string, Record<string, string[]>> = {
  上海市: {
    上海市: ['浦东新区', '徐汇区', '松江区', '嘉定区', '闵行区', '青浦区', '静安区'],
  },
  北京市: {
    北京市: ['朝阳区', '海淀区', '东城区', '西城区', '通州区'],
  },
  浙江省: {
    杭州市: ['西湖区', '滨江区', '余杭区', '萧山区'],
    宁波市: ['海曙区', '鄞州区', '北仑区'],
  },
  江苏省: {
    南京市: ['玄武区', '鼓楼区', '江宁区'],
    苏州市: ['姑苏区', '工业园区', '昆山市'],
  },
  广东省: {
    广州市: ['天河区', '越秀区', '番禺区'],
    深圳市: ['南山区', '福田区', '宝安区'],
  },
}

export type Region = { province: string; city: string; district: string }

export function Select({
  value,
  placeholder,
  options,
  onChange,
  disabled,
  label,
}: {
  value: string
  placeholder: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
  label: string
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 flex-1 rounded border border-border bg-background px-2 text-sm disabled:cursor-not-allowed disabled:bg-muted/50',
        !value && 'text-xs text-muted-foreground/60',
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export function RegionCascader({
  value,
  onChange,
  detail,
  onDetailChange,
}: {
  value: Region
  onChange: (next: Region) => void
  detail: string
  onDetailChange: (v: string) => void
}) {
  const cities = value.province ? Object.keys(regionTree[value.province] ?? {}) : []
  const districts = value.province && value.city ? regionTree[value.province]?.[value.city] ?? [] : []

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Select
          label="省份"
          placeholder="请选择省"
          value={value.province}
          options={Object.keys(regionTree)}
          onChange={(province) => onChange({ province, city: '', district: '' })}
        />
        <Select
          label="城市"
          placeholder="请选择市"
          value={value.city}
          options={cities}
          disabled={!value.province}
          onChange={(city) => onChange({ ...value, city, district: '' })}
        />
        <Select
          label="区县"
          placeholder="请选择区（县）"
          value={value.district}
          options={districts}
          disabled={!value.city}
          onChange={(district) => onChange({ ...value, district })}
        />
      </div>
      <input
        type="text"
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
        placeholder="请输入详细地址，如：张江路 100 号 3 号楼"
        className="h-9 rounded border border-border bg-background px-3 text-sm placeholder:text-xs placeholder:text-muted-foreground/60"
      />
    </div>
  )
}

/* ---------- 上传控件 ---------- */

export function Tip({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p
      className={cn(
        'flex items-start gap-1.5 rounded px-2.5 py-1.5 text-xs leading-relaxed',
        tone === 'info' ? 'bg-[#1890ff]/5 text-muted-foreground' : 'bg-amber-50 text-amber-700',
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

export function LogoUploader({ hasLogo, onToggle }: { hasLogo: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-label={hasLogo ? '移除并重新上传 Logo' : '上传店铺 Logo'}
          className={cn(
            'group relative flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded border text-xs',
            hasLogo
              ? 'border-border bg-[#1890ff]/10 text-[#1890ff]'
              : 'border-dashed border-border text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]',
          )}
        >
          {hasLogo ? (
            <>
              <span className="text-2xl font-bold">沪</span>
              <span className="absolute inset-0 hidden items-center justify-center rounded bg-black/50 text-white group-hover:flex">
                <Trash2 className="size-4" aria-hidden />
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="size-5" aria-hidden />
              上传 Logo
            </>
          )}
        </button>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">正确示意图</span>
          <div className="flex items-end gap-3">
            <figure className="flex flex-col items-center gap-1">
              <span className="flex size-12 items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700">
                1 : 1
              </span>
              <figcaption className="text-emerald-700">推荐</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-1">
              <span className="flex h-12 w-20 items-center justify-center rounded border border-red-200 bg-red-50 text-[10px] text-red-500 line-through">
                16 : 9
              </span>
              <figcaption className="text-red-500">不推荐</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-1">
              <span className="flex h-12 w-7 items-center justify-center rounded border border-red-200 bg-red-50 text-[10px] text-red-500 line-through">
                竖图
              </span>
              <figcaption className="text-red-500">不推荐</figcaption>
            </figure>
          </div>
          <span>{hasLogo ? '已上传 1 / 1 张' : '0 / 1 张'} · 支持 JPG / PNG，不超过 2MB</span>
        </div>
      </div>
      <Tip>为保证展示效果，店铺 Logo 建议上传 1:1 比例正方形图片，参考正确示意图，只支持上传 1 张。</Tip>
    </div>
  )
}

export const COMPANY_IMAGES_MIN = 2
export const COMPANY_IMAGES_MAX = 30

export function CompanyImagesUploader({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  const tooFew = count < COMPANY_IMAGES_MIN
  const full = count >= COMPANY_IMAGES_MAX
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'group relative flex aspect-video flex-col items-center justify-center rounded border text-xs',
              i === 0 ? 'border-[#1890ff] bg-[#1890ff]/10 text-[#1890ff]' : 'border-border bg-muted text-muted-foreground',
            )}
          >
            <span>{i === 0 ? '企业正门实景' : `企业图片 ${i + 1}`}</span>
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-[#1890ff] px-1.5 text-[10px] leading-4 text-white">首图</span>
            )}
            <button
              type="button"
              onClick={() => onChange(count - 1)}
              aria-label={`删除第 ${i + 1} 张企业图片`}
              className="absolute right-1 top-1 hidden rounded bg-black/55 p-1 text-white group-hover:flex"
            >
              <Trash2 className="size-3" aria-hidden />
            </button>
          </div>
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => onChange(count + 1)}
            className="flex aspect-video flex-col items-center justify-center gap-1 rounded border border-dashed border-border text-xs text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]"
          >
            <ImagePlus className="size-5" aria-hidden />
            {count === 0 ? '上传正门实景' : '添加图片'}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={cn('tabular-nums', tooFew ? 'text-amber-600' : 'text-muted-foreground')}>
          已上传 {count} / {COMPANY_IMAGES_MAX} 张{tooFew && `，至少还需 ${COMPANY_IMAGES_MIN - count} 张`}
        </span>
        <span className="text-muted-foreground">支持拖拽排序，首图将作为店铺封面</span>
      </div>
      <Tip tone={tooFew ? 'warn' : 'info'}>
        店铺第一张图片请上传企业正门实景照片，画面力求规整美观，尺寸比例为 16:9，最多可上传 {COMPANY_IMAGES_MAX} 张，最少{' '}
        {COMPANY_IMAGES_MIN} 张。
      </Tip>
    </div>
  )
}
