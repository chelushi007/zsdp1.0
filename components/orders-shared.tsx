'use client'

import { useState } from 'react'
import { CheckCircle2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Select } from '@/components/shop-form-fields'
import { ActionLink, DialogField, DialogInput, Modal, PRIMARY_BTN, Tag } from '@/components/goods-list'
import type { Actor, OrderRole, TimelineItem } from '@/lib/orders-data'

export function nowStamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 追加一条流转记录并刷新更新时间 */
export function withEvent<T extends { updatedAt: string; timeline: TimelineItem[] }>(o: T, label: string, by: Actor, note?: string): T {
  const at = nowStamp()
  return { ...o, updatedAt: at, timeline: [...o.timeline, { at, label, by, note: note || undefined }] }
}

/* ---------- 操作定义 ---------- */

export type ActionField = {
  key: string
  label: string
  type?: 'text' | 'number' | 'date'
  placeholder?: string
  prefix?: string
  suffix?: string
  required?: boolean
  initial?: string
}

export type ActionDef<T> = {
  id: string
  label: string
  tone?: 'primary' | 'danger'
  /** 为 true 时不弹窗，直接执行 */
  instant?: boolean
  title?: string
  /** 履约环节分组 */
  group?: string
  fields?: ActionField[]
  confirmLabel?: string
  apply: (o: T, values: Record<string, string>) => T
  toast: (o: T, values: Record<string, string>) => string
}

export function ActionDialog<T>({
  action,
  summary,
  onClose,
  onConfirm,
}: {
  action: ActionDef<T>
  summary: React.ReactNode
  onClose: () => void
  onConfirm: (values: Record<string, string>) => void
}) {
  const fields = action.fields ?? []
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.initial ?? ''])),
  )
  const missing = fields.filter((f) => f.required && !values[f.key]?.trim())
  const titleId = `order-action-${action.id}`
  return (
    <Modal
      title={action.title ?? action.label}
      titleId={titleId}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={missing.length > 0}
            onClick={() => onConfirm(values)}
            className={action.tone === 'danger' ? 'bg-red-600 hover:bg-red-600/90' : PRIMARY_BTN}
          >
            {action.confirmLabel ?? `确认${action.label}`}
          </Button>
        </>
      }
    >
      {summary}
      {fields.map((f) => (
        <DialogField key={f.key} label={f.label} required={f.required}>
          {f.type === 'date' ? (
            <input
              type="date"
              aria-label={f.label}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="h-9 rounded border border-border bg-background px-3 text-sm focus:border-[#1890ff] focus:outline-none"
            />
          ) : (
            <DialogInput
              label={f.label}
              type={f.type === 'number' ? 'number' : 'text'}
              value={values[f.key]}
              placeholder={f.placeholder}
              prefix={f.prefix}
              suffix={f.suffix}
              onChange={(v) => setValues({ ...values, [f.key]: v })}
            />
          )}
        </DialogField>
      ))}
    </Modal>
  )
}

/* ---------- 列表框架 ---------- */

export type Column<T> = {
  key: string
  label: string
  width: string
  roles?: OrderRole[]
  align?: 'left' | 'right' | 'center'
  render: (row: T) => React.ReactNode
}

export function visibleColumns<T>(cols: Column<T>[], role: OrderRole) {
  return cols.filter((c) => !c.roles || c.roles.includes(role))
}

export type Kpi = { label: string; value: string; tone?: 'default' | 'warn' | 'good' }

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="flex flex-col gap-1 rounded-md border border-border bg-card px-4 py-3">
          <span className="text-xs text-muted-foreground">{k.label}</span>
          <span
            className={cn(
              'text-xl font-semibold tabular-nums',
              k.tone === 'warn' && 'text-red-600',
              k.tone === 'good' && 'text-emerald-600',
            )}
          >
            {k.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 shrink-0 text-right">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  )
}

const INPUT = 'h-9 min-w-0 flex-1 rounded border border-border bg-background px-3 text-sm placeholder:text-xs placeholder:text-muted-foreground/60 focus:border-[#1890ff] focus:outline-none'

export type BaseFilters = { keyword: string; party: string; source: string; from: string; to: string }
export const emptyBaseFilters: BaseFilters = { keyword: '', party: '', source: '', from: '', to: '' }

export function FilterPanel({
  draft,
  onChange,
  onSearch,
  onReset,
  keywordLabel,
  keywordPlaceholder,
  partyLabel,
  partyOptions,
  showSource,
  dateLabel,
  extra,
}: {
  draft: BaseFilters
  onChange: (f: BaseFilters) => void
  onSearch: () => void
  onReset: () => void
  keywordLabel: string
  keywordPlaceholder: string
  partyLabel: string
  partyOptions: string[]
  showSource?: boolean
  dateLabel: string
  extra?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterRow label={keywordLabel}>
          <input
            aria-label={keywordLabel}
            value={draft.keyword}
            placeholder={keywordPlaceholder}
            onChange={(e) => onChange({ ...draft, keyword: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) onSearch()
            }}
            className={INPUT}
          />
        </FilterRow>
        <FilterRow label={partyLabel}>
          <Select label={partyLabel} placeholder="全部" value={draft.party} options={partyOptions} onChange={(v) => onChange({ ...draft, party: v })} />
        </FilterRow>
        {showSource && (
          <FilterRow label="订单来源">
            <Select label="订单来源" placeholder="全部" value={draft.source} options={['自营', '服务商代理']} onChange={(v) => onChange({ ...draft, source: v })} />
          </FilterRow>
        )}
        {extra}
        <FilterRow label={dateLabel}>
          <input
            type="date"
            aria-label={`${dateLabel}开始`}
            value={draft.from}
            max={draft.to || undefined}
            onChange={(e) => onChange({ ...draft, from: e.target.value })}
            className="h-9 min-w-0 flex-1 rounded border border-border bg-background px-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">至</span>
          <input
            type="date"
            aria-label={`${dateLabel}结束`}
            value={draft.to}
            min={draft.from || undefined}
            onChange={(e) => onChange({ ...draft, to: e.target.value })}
            className="h-9 min-w-0 flex-1 rounded border border-border bg-background px-2 text-sm"
          />
        </FilterRow>
      </div>
      <div className="flex items-center gap-2">
        <Button className={PRIMARY_BTN} onClick={onSearch}>
          <Search data-icon="inline-start" />
          查询
        </Button>
        <Button variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  )
}

export function StatusTabs<S extends string>({
  order,
  meta,
  active,
  countOf,
  onSelect,
  ariaLabel,
  right,
}: {
  order: S[]
  meta: Record<S, { label: string }>
  active: S | ''
  countOf: (s: S | '') => number
  onSelect: (s: S | '') => void
  ariaLabel: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 text-xs" role="tablist" aria-label={ariaLabel}>
      {(['', ...order] as (S | '')[]).map((s) => {
        const on = active === s
        const n = countOf(s)
        return (
          <button
            key={s || 'all'}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(s)}
            className={cn(
              'relative flex h-10 shrink-0 items-center gap-1.5 px-3 hover:text-foreground',
              on ? 'font-medium text-[#1890ff]' : 'text-muted-foreground',
            )}
          >
            {s ? meta[s].label : '全部'}
            <span className={cn('tabular-nums', on ? 'text-[#1890ff]' : n > 0 ? 'text-foreground/70' : 'text-muted-foreground/50')}>{n}</span>
            {on && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1890ff]" aria-hidden />}
          </button>
        )
      })}
      {right && <span className="ml-auto shrink-0 pr-2 text-muted-foreground">{right}</span>}
    </div>
  )
}

export function OrderTable<T extends { id: string }>({
  columns,
  rows,
  minWidth,
  emptyText,
  footer,
}: {
  columns: Column<T>[]
  rows: T[]
  minWidth: string
  emptyText: string
  footer?: React.ReactNode
}) {
  const template = columns.map((c) => c.width).join(' ')
  const alignClass = (a?: Column<T>['align']) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : '')
  return (
    <>
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          <div
            className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((c) => (
              <span key={c.key} className={alignClass(c.align)}>
                {c.label}
              </span>
            ))}
          </div>
          {rows.length === 0 && <div className="px-4 py-12 text-center text-sm text-muted-foreground">{emptyText}</div>}
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted/30"
              style={{ gridTemplateColumns: template }}
            >
              {columns.map((c) => (
                <div key={c.key} className={cn('min-w-0', alignClass(c.align))}>
                  {c.render(r)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {footer && <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">{footer}</div>}
    </>
  )
}

/* ---------- 单元格 ---------- */

export function Stamp({ value }: { value: string }) {
  return (
    <span className="flex flex-col font-mono text-xs leading-4 text-muted-foreground">
      <span>{value.slice(0, 10)}</span>
      {value.length > 10 && <span className="text-[11px]">{value.slice(11)}</span>}
    </span>
  )
}

export function IdCell({ id, sub }: { id: string; sub?: string }) {
  return (
    <span className="flex flex-col">
      <span className="font-mono text-xs">{id}</span>
      {sub && <span className="font-mono text-[11px] text-muted-foreground">{sub}</span>}
    </span>
  )
}

export function GoodsCell({
  name,
  spec,
  qty,
  unit,
  code,
  listingNo,
  extraCount,
}: {
  name: string
  spec: string
  qty: number
  unit: string
  /** 商品编码 */
  code?: string
  /** 上架单号 */
  listingNo?: string
  /** 多商品订单时，除首行外的其他商品数 */
  extraCount?: number
}) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium">
        {name}
        {extraCount ? <span className="ml-1 text-xs font-normal text-[#1890ff]">等 {extraCount + 1} 项</span> : null}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {spec} · {qty.toLocaleString()} {unit}
      </span>
      {(code || listingNo) && (
        <span className="truncate font-mono text-[11px] text-muted-foreground" title={listingNo ? `上架单 ${listingNo}` : undefined}>
          {code}
          {listingNo && ` · ${listingNo}`}
        </span>
      )}
    </span>
  )
}

export function PartyCell({ name, sub, subTone }: { name: string; sub?: string; subTone?: 'primary' | 'muted' }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate" title={name}>
        {name}
      </span>
      {sub && <span className={cn('truncate text-xs', subTone === 'primary' ? 'text-[#1890ff]' : 'text-muted-foreground')}>{sub}</span>}
    </span>
  )
}

export function MoneyCell({ main, sub, tone }: { main: string; sub?: string; tone?: 'good' | 'warn' }) {
  return (
    <span className="flex flex-col tabular-nums">
      <span className={cn('font-medium', tone === 'good' && 'text-emerald-700', tone === 'warn' && 'text-red-600')}>{main}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </span>
  )
}

export function ActionCell<T>({
  actions,
  onAction,
  extra,
}: {
  actions: ActionDef<T>[]
  onAction: (a: ActionDef<T>) => void
  extra?: React.ReactNode
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {extra}
      {actions.map((a) => (
        <ActionLink key={a.id} tone={a.tone} onClick={() => onAction(a)}>
          {a.label}
        </ActionLink>
      ))}
    </span>
  )
}

/* ---------- 详情 ---------- */

const actorTone: Record<Actor, string> = {
  商家: 'bg-[#1890ff]',
  '买/租方': 'bg-emerald-500',
  服务商: 'bg-violet-500',
  系统: 'bg-muted-foreground/60',
  平台: 'bg-rose-500',
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="flex flex-col">
      {[...items].reverse().map((t, i) => (
        <li key={`${t.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
          <span className="flex flex-col items-center">
            <span className={cn('mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-card', actorTone[t.by])} aria-hidden />
            {i < items.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm">
              {t.label}
              <span className="ml-2 rounded bg-muted px-1 text-[11px] text-muted-foreground">{t.by}</span>
            </span>
            {t.note && <span className="text-xs text-muted-foreground">{t.note}</span>}
            <span className="font-mono text-[11px] text-muted-foreground">{t.at}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export type DetailSection = { title: string; rows: [string, React.ReactNode][] }

export function DetailModal({
  title,
  status,
  sections,
  timeline,
  onClose,
  actions,
  heading = '订单详情',
  body,
}: {
  title: React.ReactNode
  status: React.ReactNode
  sections: DetailSection[]
  timeline: TimelineItem[]
  onClose: () => void
  actions?: React.ReactNode
  heading?: string
  body?: React.ReactNode
}) {
  return (
    <Modal
      title={heading}
      titleId="order-detail-title"
      width="max-w-[860px]"
      onClose={onClose}
      footer={
        <>
          {actions}
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-between gap-3 rounded bg-muted/40 px-3 py-2">
        <span className="font-mono text-sm">{title}</span>
        {status}
      </div>
      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          {body}
          {sections.map((s) => (
            <section key={s.title} className="flex flex-col gap-2">
              <h4 className="text-xs font-medium text-muted-foreground">{s.title}</h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <section className="flex flex-col gap-2 border-l border-border pl-5">
          <h4 className="text-xs font-medium text-muted-foreground">流转记录</h4>
          <div className="max-h-[360px] overflow-y-auto pr-1">
            <Timeline items={timeline} />
          </div>
        </section>
      </div>
    </Modal>
  )
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg"
    >
      <CheckCircle2 className="size-4 text-emerald-400" aria-hidden />
      {message}
    </div>
  )
}

export { Tag }
