'use client'

import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { materialCategoryPath, type Material } from '@/lib/materials-data'

export type GoodsLine = {
  material: Material
  stock: string
  minOrder: string
  /** 出售 */
  saleOn: boolean
  marketPrice: string
  salePrice: string
  /** 出租 */
  rentOn: boolean
  rentPrice: string
  deposit: string
}

export function newGoodsLine(material: Material, saleOn: boolean, rentOn: boolean): GoodsLine {
  return { material, stock: '', minOrder: '', saleOn, marketPrice: '', salePrice: '', rentOn, rentPrice: '', deposit: '' }
}

const positive = (v: string) => v !== '' && Number(v) > 0
const nonNegative = (v: string) => v !== '' && Number(v) >= 0

/** 单行是否填写完整（只校验已启用的运营方式） */
export function lineComplete(l: GoodsLine, saleOn: boolean, rentOn: boolean) {
  if (!positive(l.stock) || !positive(l.minOrder)) return false
  const sale = saleOn && l.saleOn
  const rent = rentOn && l.rentOn
  if (!sale && !rent) return false
  if (sale && (!positive(l.marketPrice) || !positive(l.salePrice))) return false
  if (rent && (!positive(l.rentPrice) || !nonNegative(l.deposit))) return false
  return true
}

export function GoodsDetailTable({
  lines,
  saleOn,
  rentOn,
  rentPeriod,
  onChange,
  onAdd,
}: {
  lines: GoodsLine[]
  saleOn: boolean
  rentOn: boolean
  rentPeriod: string
  onChange: (lines: GoodsLine[]) => void
  onAdd: () => void
}) {
  const update = (i: number, patch: Partial<GoodsLine>) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const remove = (i: number) => onChange(lines.filter((_, idx) => idx !== i))
  const bizCols = (saleOn ? 3 : 0) + (rentOn ? 3 : 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          从物料库选择同品类下的多个规格型号，每一行对应一个 SKU，分别设置库存与价格；库存、起订量及已启用运营方式的价格为必填。
        </p>
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
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            {bizCols > 0 && (
              <tr>
                <th colSpan={7} className="border-b border-r px-3 py-1.5 text-left font-medium">
                  物料与库存
                </th>
                {saleOn && (
                  <th colSpan={3} className="border-b border-r bg-[#1890ff]/5 px-3 py-1.5 text-left font-medium text-[#1890ff]">
                    出售
                  </th>
                )}
                {rentOn && (
                  <th colSpan={3} className="border-b border-r bg-emerald-500/5 px-3 py-1.5 text-left font-medium text-emerald-700">
                    出租（按{rentPeriod}计租）
                  </th>
                )}
                <th className="border-b px-3 py-1.5" />
              </tr>
            )}
            <tr>
              <Th>物料编码</Th>
              <Th required>物料分类</Th>
              <Th required>物料名称</Th>
              <Th required>规格型号</Th>
              <Th required>计量单位</Th>
              <Th required>库存</Th>
              <Th required>起订量</Th>
              {saleOn && (
                <>
                  <Th>可售</Th>
                  <Th required>市场单价</Th>
                  <Th required>含税销售单价</Th>
                </>
              )}
              {rentOn && (
                <>
                  <Th>可租</Th>
                  <Th required>租金单价</Th>
                  <Th required>押金</Th>
                </>
              )}
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr>
                <td colSpan={8 + bizCols} className="px-3 py-10 text-center text-xs text-muted-foreground">
                  尚未添加商品明细，点击右上角「添加物料」从物料库选择规格型号
                </td>
              </tr>
            )}
            {lines.map((l, i) => {
              const m = l.material
              const sale = saleOn && l.saleOn
              const rent = rentOn && l.rentOn
              return (
                <tr key={m.code} className="border-t align-middle">
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
                  {saleOn && (
                    <>
                      <Td className="text-center">
                        <input type="checkbox" checked={l.saleOn} onChange={(e) => update(i, { saleOn: e.target.checked })} aria-label={`${m.name} ${m.spec} 可售`} className="accent-[#1890ff]" />
                      </Td>
                      <Td>
                        <CellInput prefix="¥" disabled={!sale} value={l.marketPrice} onChange={(v) => update(i, { marketPrice: v })} invalid={sale && !positive(l.marketPrice)} aria-label={`${m.name} ${m.spec} 市场单价`} />
                      </Td>
                      <Td>
                        <CellInput prefix="¥" disabled={!sale} value={l.salePrice} onChange={(v) => update(i, { salePrice: v })} invalid={sale && !positive(l.salePrice)} aria-label={`${m.name} ${m.spec} 含税销售单价`} />
                      </Td>
                    </>
                  )}
                  {rentOn && (
                    <>
                      <Td className="text-center">
                        <input type="checkbox" checked={l.rentOn} onChange={(e) => update(i, { rentOn: e.target.checked })} aria-label={`${m.name} ${m.spec} 可租`} className="accent-emerald-600" />
                      </Td>
                      <Td>
                        <CellInput prefix="¥" suffix={`/${m.unit}/${rentPeriod}`} disabled={!rent} value={l.rentPrice} onChange={(v) => update(i, { rentPrice: v })} invalid={rent && !positive(l.rentPrice)} aria-label={`${m.name} ${m.spec} 租金单价`} />
                      </Td>
                      <Td>
                        <CellInput prefix="¥" suffix={`/${m.unit}`} disabled={!rent} value={l.deposit} onChange={(v) => update(i, { deposit: v })} invalid={rent && !nonNegative(l.deposit)} aria-label={`${m.name} ${m.spec} 押金`} />
                      </Td>
                    </>
                  )}
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
  prefix,
  suffix,
  invalid,
  disabled,
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
  invalid?: boolean
  disabled?: boolean
  'aria-label': string
}) {
  return (
    <div
      className={cn(
        'flex h-8 min-w-24 items-center rounded border bg-background text-xs focus-within:border-[#1890ff]',
        invalid && !disabled && 'border-amber-300',
        disabled && 'bg-muted/50 text-muted-foreground',
      )}
    >
      {prefix && <span className="pl-2 text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        min={0}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={disabled ? '—' : '请输入'}
        className="h-full w-full min-w-0 flex-1 bg-transparent px-2 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        {...rest}
      />
      {suffix && <span className="pr-2 text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
  )
}
