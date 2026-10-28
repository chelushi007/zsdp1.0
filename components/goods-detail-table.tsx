'use client'

import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { materialCategoryPath, type Material } from '@/lib/materials-data'

export type GoodsLine = {
  material: Material
  stock: string
  minOrder: string
}

export function newGoodsLine(material: Material): GoodsLine {
  return { material, stock: '', minOrder: '' }
}

const positive = (v: string) => v !== '' && Number(v) > 0

/** 单行是否填写完整：库存与起订量必填 */
export function lineComplete(l: GoodsLine) {
  return positive(l.stock) && positive(l.minOrder)
}

export function GoodsDetailTable({ lines, onChange, onAdd }: { lines: GoodsLine[]; onChange: (lines: GoodsLine[]) => void; onAdd: () => void }) {
  const update = (i: number, patch: Partial<GoodsLine>) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const remove = (i: number) => onChange(lines.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">从物料库选择同品类下的多个规格型号，每一行对应一个 SKU；库存与起订量为必填，价格在「上架」时按租售方式填写。</p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-8 items-center gap-1 rounded border border-[#1890ff] px-3 text-xs text-[#1890ff] hover:bg-[#1890ff]/5"
        >
          <Plus className="size-3.5" />
          添加物料
        </button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <Th>序号</Th>
              <Th>物料编码</Th>
              <Th required>物料分类</Th>
              <Th required>物料名称</Th>
              <Th required>规格型号</Th>
              <Th required>计量单位</Th>
              <Th required>库存</Th>
              <Th required>起订量</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-xs text-muted-foreground">
                  尚未添加商品明细，点击右上角「添加物料」从物料库选择规格型号
                </td>
              </tr>
            )}
            {lines.map((l, i) => {
              const m = l.material
              return (
                <tr key={m.code} className="border-t align-middle">
                  <Td className="text-center text-muted-foreground">{i + 1}</Td>
                  <Td className="font-mono text-xs">{m.code}</Td>
                  <Td>{materialCategoryPath(m)}</Td>
                  <Td className="font-medium">{m.name}</Td>
                  <Td>{m.spec}</Td>
                  <Td>{m.unit}</Td>
                  <Td>
                    <CellInput value={l.stock} onChange={(v) => update(i, { stock: v })} invalid={!positive(l.stock)} aria-label={`${m.name} ${m.spec} 库存`} />
                  </Td>
                  <Td>
                    <CellInput value={l.minOrder} onChange={(v) => update(i, { minOrder: v })} invalid={!positive(l.minOrder)} aria-label={`${m.name} ${m.spec} 起订量`} />
                  </Td>
                  <Td>
                    <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                      <Trash2 className="size-3.5" />
                      删除
                    </button>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <th className="whitespace-nowrap border-b border-r px-3 py-2 text-left font-medium last:border-r-0">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('whitespace-nowrap border-r px-3 py-1.5 last:border-r-0', className)}>{children}</td>
}

function CellInput({
  value,
  onChange,
  invalid,
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  'aria-label': string
}) {
  return (
    <div className={cn('flex h-8 min-w-24 items-center rounded border bg-background text-xs focus-within:border-[#1890ff]', invalid && 'border-amber-300')}>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="请输入"
        className="h-full w-full min-w-0 flex-1 bg-transparent px-2 outline-none placeholder:text-muted-foreground/60"
        {...rest}
      />
    </div>
  )
}
