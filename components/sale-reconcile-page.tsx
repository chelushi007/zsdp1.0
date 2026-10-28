'use client'

import { useState } from 'react'
import { FileText, Paperclip, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DialogField, DialogInput, PRIMARY_BTN, Tag } from '@/components/goods-list'
import { Card, INPUT_CLS, InfoGrid, OrderInfoCard, PageBar, TEXTAREA_CLS } from '@/components/sale-page-shared'
import { fmtMoney, saleAmount, type SaleOrder, type Statement, type StatementState } from '@/lib/orders-data'

const TODAY = '2024-10-28'

export type StatementDraft = {
  no: string
  amount: number
  period: string
  note: string
  attachment: string
}

const stateTone: Record<StatementState, string> = {
  待确认: 'bg-amber-50 text-amber-700 ring-amber-200',
  已确认: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  有异议: 'bg-red-50 text-red-700 ring-red-200',
}

export function StatementTag({ state }: { state: StatementState }) {
  return <Tag className={stateTone[state]}>{state}</Tag>
}

export function nextStatementNo(o: SaleOrder) {
  const seq = (o.statements?.length ?? 0) + 1
  return { seq, no: `DZ${o.id.slice(2)}-${String(seq).padStart(2, '0')}` }
}

function StatementHistory({ statements, onViewAttachment }: { statements: Statement[]; onViewAttachment?: (s: Statement) => void }) {
  if (statements.length === 0) {
    return <div className="flex h-24 items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">暂无对账记录，创建第一期对账单后将显示在这里</div>
  }
  const cols = '56px minmax(150px,1fr) 110px minmax(120px,1fr) 128px 84px minmax(160px,1.4fr)'
  return (
    <div className="overflow-x-auto rounded border border-border">
      <div className="min-w-[860px]">
        <div className="grid items-center gap-x-3 bg-muted/50 px-4 py-2 text-xs text-muted-foreground" style={{ gridTemplateColumns: cols }}>
          <span>期数</span>
          <span>对账单号</span>
          <span className="text-right">对账金额</span>
          <span>对账周期</span>
          <span>创建时间</span>
          <span>状态</span>
          <span>买方反馈</span>
        </div>
        <ul className="divide-y divide-border">
          {[...statements].reverse().map((s) => (
            <li key={s.no} className="grid items-start gap-x-3 px-4 py-3 text-sm" style={{ gridTemplateColumns: cols }}>
              <span className="tabular-nums">第 {s.seq} 期</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-xs">{s.no}</span>
                {s.attachment && (
                  <button type="button" onClick={() => onViewAttachment?.(s)} className="flex items-center gap-1 text-xs text-[#1890ff] hover:underline">
                    <Paperclip className="size-3" />
                    <span className="truncate">{s.attachment}</span>
                  </button>
                )}
              </span>
              <span className="text-right font-medium tabular-nums">{fmtMoney(s.amount)}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{s.period || '—'}</span>
                {s.note && (
                  <span className="truncate text-xs text-muted-foreground" title={s.note}>
                    {s.note}
                  </span>
                )}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">{s.createdAt}</span>
              <span>
                <StatementTag state={s.state} />
              </span>
              <span className="flex min-w-0 flex-col text-xs">
                {s.repliedAt ? (
                  <>
                    <span className={cn(s.state === '有异议' ? 'text-red-700' : 'text-foreground')}>{s.reply ?? (s.state === '已确认' ? '买方已确认对账' : '—')}</span>
                    <span className="text-muted-foreground">{s.repliedAt}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">等待买方确认</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function SaleReconcilePage({
  order: o,
  onBack,
  onCreate,
}: {
  order: SaleOrder
  onBack: () => void
  onCreate: (draft: StatementDraft) => void
}) {
  const history = o.statements ?? []
  const latest = history[history.length - 1]
  const canCreate = o.status === 'toReconcile' && (!latest || latest.state !== '待确认')
  const [creating, setCreating] = useState(canCreate && (!latest || latest.state === '有异议'))
  const { seq, no } = nextStatementNo(o)
  const orderAmount = saleAmount(o)

  const [amount, setAmount] = useState(String(latest?.state === '有异议' && o.freight ? orderAmount - o.freight : orderAmount))
  const [period, setPeriod] = useState(`${TODAY} 全量`)
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState('')

  const amountNum = Number(amount)
  const valid = amountNum > 0 && period.trim()
  const diff = amountNum - orderAmount

  const resetForm = () => {
    setAmount(String(orderAmount))
    setPeriod(`${TODAY} 全量`)
    setNote('')
    setAttachment('')
  }

  const confirmed = history.filter((s) => s.state === '已确认')
  const summaryRows: [string, React.ReactNode][] = [
    ['对账状态', o.reconcile ?? '—'],
    ['累计对账期数', `${history.length} 期`],
    ['最新对账单', latest ? <span key="n" className="font-mono text-xs">{latest.no}</span> : '—'],
    ['最新状态', latest ? <StatementTag key="s" state={latest.state} /> : '—'],
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageBar
        title="对账"
        order={o}
        onBack={onBack}
        extra={
          !creating && canCreate ? (
            <Button
              size="sm"
              className={PRIMARY_BTN}
              onClick={() => {
                resetForm()
                setCreating(true)
              }}
            >
              <Plus data-icon="inline-start" />
              创建对账单
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <OrderInfoCard order={o} />

          {creating && (
            <Card title={`创建对账单 · 第 ${seq} 期`} extra={<span className="font-mono text-xs text-muted-foreground">{no}</span>}>
              {latest?.state === '有异议' && (
                <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <FileText className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    上一期（{latest.no}）买方提出异议：{latest.reply}。请根据异议调整后重新创建对账单。
                  </span>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <DialogField label="对账金额" required hint={diff === 0 ? '与订单金额一致' : `与订单金额相差 ${diff > 0 ? '+' : ''}${fmtMoney(diff)}`}>
                  <DialogInput label="对账金额" type="number" prefix="¥" value={amount} onChange={setAmount} />
                </DialogField>
                <DialogField label="对账周期 / 范围" required hint="如：2024-10 全量、第 1 批 80 块">
                  <DialogInput label="对账周期" value={period} onChange={setPeriod} />
                </DialogField>
                <DialogField label="对账附件" hint="对账明细表、签收单等，支持 PDF / XLSX / 图片">
                  {attachment ? (
                    <div className="flex h-9 items-center justify-between rounded border border-border bg-background px-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{attachment}</span>
                      </span>
                      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setAttachment('')}>
                        移除
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAttachment(`${no}-对账明细.xlsx`)}
                      className={cn(INPUT_CLS, 'flex items-center justify-center gap-2 border-dashed text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]')}
                    >
                      <Upload className="size-4" />
                      上传附件
                    </button>
                  )}
                </DialogField>
                <DialogField label="订单金额">
                  <div className="flex h-9 items-center rounded border border-border bg-muted/40 px-3 text-sm tabular-nums">{fmtMoney(orderAmount)}</div>
                </DialogField>
                <div className="sm:col-span-2">
                  <DialogField label="对账说明">
                    <textarea aria-label="对账说明" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="说明本期对账的计算依据、数量差异、运费承担等" className={TEXTAREA_CLS} />
                  </DialogField>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                {history.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
                    取消
                  </Button>
                )}
                <Button size="sm" className={PRIMARY_BTN} disabled={!valid} onClick={() => {
                    onCreate({ no, amount: amountNum, period: period.trim(), note: note.trim(), attachment })
                    setCreating(false)
                  }}
                >
                  发送对账单给买方
                </Button>
              </div>
            </Card>
          )}

          <Card title="历史对账记录" extra={<span className="text-xs text-muted-foreground">共 {history.length} 期 · 买方已确认 {confirmed.length} 期</span>}>
            <StatementHistory statements={history} />
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card title="对账摘要">
            <InfoGrid cols={2} rows={summaryRows} />
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">订单金额</span>
                <span className="text-sm tabular-nums">{fmtMoney(orderAmount)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{creating ? '本期对账金额' : '最新对账金额'}</span>
                <span className="text-lg font-semibold tabular-nums">{fmtMoney(creating ? amountNum || 0 : (latest?.amount ?? 0))}</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {canCreate
                ? '对账单发送后买方可「确认对账」或「提出异议」。买方确认后订单进入待付款；如有异议可再次创建新一期对账单。'
                : latest?.state === '待确认'
                  ? '最新一期对账单正等待买方确认，确认或提出异议后可继续操作。'
                  : '当前订单不在对账环节，仅可查看历史对账记录。'}
            </p>
            <Button variant="outline" onClick={onBack}>
              返回列表
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}
