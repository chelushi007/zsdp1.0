'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MATERIAL_ROOT,
  frequentMaterialCodes,
  materialCategories,
  materialFullCode,
  materials,
  type Material,
} from '@/lib/materials-data'

const PAGE_SIZE = 10
const PRIMARY = 'bg-[#1890ff] text-white hover:bg-[#1890ff]/90'

type Tab = 'all' | 'frequent' | 'selected'

export function MaterialPicker({
  excludeCodes,
  onConfirm,
  onClose,
}: {
  /** 已在明细中的物料，置灰不可重复选择 */
  excludeCodes: string[]
  onConfirm: (list: Material[]) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('all')
  const [category, setCategory] = useState<string | null>(null)
  const [treeKeyword, setTreeKeyword] = useState('')
  const [q, setQ] = useState({ code: '', name: '', spec: '', tag: '' })
  const [applied, setApplied] = useState(q)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Material[]>([])

  const treeCats = useMemo(() => {
    const kw = treeKeyword.trim().toLowerCase()
    if (!kw) return materialCategories
    return materialCategories.filter((c) => c.code.toLowerCase().includes(kw) || c.name.includes(kw))
  }, [treeKeyword])

  const rows = useMemo(() => {
    let list = materials
    if (tab === 'frequent') list = list.filter((m) => frequentMaterialCodes.includes(m.code))
    if (tab === 'selected') return selected
    if (category) list = list.filter((m) => m.categoryCode === category)
    const code = applied.code.trim().toLowerCase()
    const name = applied.name.trim()
    const spec = applied.spec.trim().toLowerCase()
    const tag = applied.tag.trim()
    return list.filter(
      (m) =>
        (!code || materialFullCode(m).toLowerCase().includes(code)) &&
        (!name || m.name.includes(name) || m.subCategory.includes(name)) &&
        (!spec || m.spec.toLowerCase().includes(spec)) &&
        (!tag || m.tags?.some((x) => x.includes(tag))),
    )
  }, [tab, category, applied, selected])

  const total = rows.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const isSelected = (m: Material) => selected.some((s) => s.code === m.code)
  const isExcluded = (m: Material) => excludeCodes.includes(m.code)
  const toggle = (m: Material) => {
    if (isExcluded(m)) return
    setSelected((list) => (list.some((s) => s.code === m.code) ? list.filter((s) => s.code !== m.code) : [...list, m]))
  }
  const selectableOnPage = pageRows.filter((m) => !isExcluded(m))
  const allOnPage = selectableOnPage.length > 0 && selectableOnPage.every(isSelected)
  const toggleAll = () => {
    if (allOnPage) setSelected((list) => list.filter((s) => !selectableOnPage.some((m) => m.code === s.code)))
    else setSelected((list) => [...list, ...selectableOnPage.filter((m) => !list.some((s) => s.code === m.code))])
  }

  const search = () => {
    setApplied(q)
    setPage(1)
  }

  const pageNumbers = (() => {
    const set = new Set<number>([1, pages, current, current - 1, current + 1].filter((n) => n >= 1 && n <= pages))
    return [...set].sort((a, b) => a - b)
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="material-picker-title">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 id="material-picker-title" className="text-sm font-semibold">
            物料信息
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="关闭">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex justify-center gap-8 border-b px-4 text-sm">
          {(
            [
              ['all', '物料信息'],
              ['frequent', '常用物料'],
              ['selected', '物料选中信息'],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k)
                setPage(1)
              }}
              className={cn(
                'relative -mb-px flex items-center gap-1.5 border-b-2 px-1 py-2.5',
                tab === k ? 'border-[#1890ff] text-[#1890ff]' : 'border-transparent text-foreground hover:text-[#1890ff]',
              )}
            >
              {label}
              {k === 'selected' && (
                <span className="rounded-full bg-red-500 px-1.5 text-[10px] leading-4 text-white">{selected.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1">
          {tab !== 'selected' && (
            <aside className="flex w-64 shrink-0 flex-col border-r">
              <div className="flex items-center gap-2 border-b p-3">
                <span className="shrink-0 text-xs">模糊查询</span>
                <input
                  value={treeKeyword}
                  onChange={(e) => setTreeKeyword(e.target.value)}
                  placeholder="分类编号、分类名称"
                  className="h-7 min-w-0 flex-1 rounded border bg-background px-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-[#1890ff]"
                  aria-label="分类模糊查询"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setCategory(null)
                    setPage(1)
                  }}
                  className={cn('flex w-full items-center gap-1 rounded px-2 py-1.5 text-left font-medium', category === null && 'bg-[#1890ff]/10 text-[#1890ff]')}
                >
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  {MATERIAL_ROOT.code}-{MATERIAL_ROOT.name}
                </button>
                <ul className="mt-0.5 flex flex-col">
                  {treeCats.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => {
                          setCategory(c.code)
                          setPage(1)
                        }}
                        className={cn(
                          'flex w-full items-center gap-1 rounded py-1.5 pl-6 pr-2 text-left hover:bg-muted',
                          category === c.code && 'bg-[#1890ff]/10 text-[#1890ff] hover:bg-[#1890ff]/10',
                        )}
                      >
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                        {c.code}-{c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {tab !== 'selected' && (
              <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5 text-xs">
                <span>物料信息</span>
                <QueryInput value={q.code} onChange={(v) => setQ({ ...q, code: v })} placeholder="编号" onEnter={search} />
                <QueryInput value={q.name} onChange={(v) => setQ({ ...q, name: v })} placeholder="名称、别名" onEnter={search} />
                <QueryInput value={q.spec} onChange={(v) => setQ({ ...q, spec: v })} placeholder="规格型号" onEnter={search} />
                <span>标签</span>
                <QueryInput value={q.tag} onChange={(v) => setQ({ ...q, tag: v })} placeholder="标签" onEnter={search} />
                <button type="button" onClick={search} className={cn('inline-flex h-7 items-center gap-1 rounded px-3 text-xs', PRIMARY)}>
                  <Search className="size-3.5" />
                  查询
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto px-4 py-2">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-10 border px-2 py-2">
                      {tab !== 'selected' && (
                        <input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="全选本页" className="accent-[#1890ff]" />
                      )}
                    </th>
                    <th className="border px-3 py-2 text-left font-medium">分类编号-物料编码</th>
                    <th className="border px-3 py-2 text-left font-medium">物料名称</th>
                    <th className="border px-3 py-2 text-left font-medium">规格型号</th>
                    <th className="border px-3 py-2 text-left font-medium">计量单位</th>
                    <th className="border px-3 py-2 text-left font-medium">辅助计量单位</th>
                    <th className="border px-3 py-2 text-left font-medium">标签</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border px-3 py-10 text-center text-xs text-muted-foreground">
                        {tab === 'selected' ? '尚未选中物料，请在「物料信息」中勾选' : '没有符合条件的物料'}
                      </td>
                    </tr>
                  )}
                  {pageRows.map((m) => {
                    const excluded = isExcluded(m)
                    const checked = isSelected(m)
                    return (
                      <tr
                        key={m.code}
                        onClick={() => toggle(m)}
                        className={cn('cursor-pointer hover:bg-[#1890ff]/5', checked && 'bg-[#1890ff]/10', excluded && 'cursor-not-allowed text-muted-foreground/60')}
                      >
                        <td className="border px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={excluded}
                            onChange={() => toggle(m)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`选择 ${m.name} ${m.spec}`}
                            className="accent-[#1890ff]"
                          />
                        </td>
                        <td className="border px-3 py-2 font-mono text-xs">{materialFullCode(m)}</td>
                        <td className="border px-3 py-2">
                          {m.name}
                          {excluded && <span className="ml-1 text-[10px]">（已添加）</span>}
                        </td>
                        <td className="border px-3 py-2">{m.spec}</td>
                        <td className="border px-3 py-2">{m.unit}</td>
                        <td className="border px-3 py-2">{m.auxUnit ?? '—'}</td>
                        <td className="border px-3 py-2 text-xs text-muted-foreground">{m.tags?.join('、') ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-2 text-xs">
              <span className="mr-2">共 {total} 条</span>
              <span className="rounded border px-2 py-1 text-muted-foreground">{PAGE_SIZE}条/页</span>
              <PageBtn disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="上一页">
                <ChevronLeft className="size-3.5" />
              </PageBtn>
              {pageNumbers.map((n, i) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - pageNumbers[i - 1] > 1 && <span className="text-muted-foreground">…</span>}
                  <PageBtn active={n === current} onClick={() => setPage(n)}>
                    {n}
                  </PageBtn>
                </span>
              ))}
              <PageBtn disabled={current >= pages} onClick={() => setPage(current + 1)} aria-label="下一页">
                <ChevronRight className="size-3.5" />
              </PageBtn>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 border-t px-4 py-3">
          <button type="button" onClick={onClose} className="h-8 rounded border px-5 text-sm hover:bg-muted">
            取消
          </button>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
            className={cn('h-8 rounded px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50', PRIMARY)}
          >
            确定{selected.length > 0 && `（${selected.length}）`}
          </button>
        </div>
      </div>
    </div>
  )
}

function QueryInput({ value, onChange, placeholder, onEnter }: { value: string; onChange: (v: string) => void; placeholder: string; onEnter: () => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) onEnter()
      }}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-7 w-32 rounded border bg-background px-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-[#1890ff]"
    />
  )
}

function PageBtn({ active, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 text-xs disabled:opacity-40',
        active ? 'border-[#1890ff] bg-[#1890ff] text-white' : 'hover:border-[#1890ff] hover:text-[#1890ff]',
      )}
    >
      {children}
    </button>
  )
}
