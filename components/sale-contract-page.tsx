'use client'

import { useState } from 'react'
import { AlertTriangle, FileSignature, FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DialogField, DialogInput, PRIMARY_BTN } from '@/components/goods-list'
import { Card, InfoGrid, OrderInfoCard, PageBar, TEXTAREA_CLS } from '@/components/sale-page-shared'
import {
  belowMinOrderLines,
  fmtMoney,
  goodsTax,
  orderLines,
  saleAmount,
  taxLabel,
  taxRatesOf,
  type PayTerm,
  type SaleOrder,
} from '@/lib/orders-data'

const TODAY = '2024-10-28'

type SignMode = NonNullable<SaleOrder['contractSign']>

/** 合同模板按上架单约定的履约方式区分：先款后货 / 货到付款的付款与交付条款不同 */
type ContractTemplate = {
  id: string
  name: string
  payTerm: PayTerm
  desc: string
  clauses: string[]
}

const TEMPLATES: ContractTemplate[] = [
  {
    id: 'T-SALE-PREPAY',
    name: '周转材料购销合同（先款后货）',
    payTerm: '先款后货',
    desc: '买方对账确认后付款，卖方收到货款后发货。',
    clauses: ['买方在对账单确认后 3 个工作日内付清货款', '卖方收到全款后 5 个工作日内发货', '货物验收以签收单为准，异议期 7 天'],
  },
  {
    id: 'T-SALE-COD',
    name: '周转材料购销合同（货到付款）',
    payTerm: '货到付款',
    desc: '卖方先发货，买方验收后对账付款。',
    clauses: ['卖方在合同生效后 5 个工作日内发货', '买方收货验收后 3 个工作日内确认对账单', '买方在对账确认后 7 个工作日内付清货款'],
  },
]

export type ContractSubmit = {
  no: string
  mode: SignMode
  template: string
  signer: string
  phone: string
  signedAt: string
  file: string
  note: string
}

function ModeOption({ active, title, desc, icon: Icon, onClick }: { active: boolean; title: string; desc: string; icon: typeof FileText; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-start gap-3 rounded-md border p-4 text-left transition-colors',
        active ? 'border-[#1890ff] bg-[#1890ff]/5' : 'border-border hover:border-[#1890ff]/50',
      )}
    >
      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded', active ? 'bg-[#1890ff] text-white' : 'bg-muted text-muted-foreground')}>
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{desc}</span>
      </span>
    </button>
  )
}

function ReadonlyField({ children }: { children: React.ReactNode }) {
  return <div className="flex h-9 items-center rounded border border-border bg-muted/40 px-3 text-sm tabular-nums">{children}</div>
}

export function SaleContractPage({ order: o, onBack, onSubmit }: { order: SaleOrder; onBack: () => void; onSubmit: (v: ContractSubmit) => void }) {
  const matched = TEMPLATES.find((t) => t.payTerm === o.payTerm) ?? TEMPLATES[0]
  const [no, setNo] = useState(`HT${o.id.slice(2)}`)
  const [mode, setMode] = useState<SignMode>('线上')
  const [templateId, setTemplateId] = useState(matched.id)
  const [signer, setSigner] = useState('')
  const [phone, setPhone] = useState('')
  const [signedAt, setSignedAt] = useState(TODAY)
  const [file, setFile] = useState('')
  const [note, setNote] = useState('')
  const [ackMinOrder, setAckMinOrder] = useState(false)

  const template = TEMPLATES.find((t) => t.id === templateId) ?? matched
  const templateMismatch = template.payTerm !== o.payTerm
  const lines = orderLines(o)
  const amount = saleAmount(o)
  const tax = goodsTax(o)
  const below = belowMinOrderLines(o)
  const taxText = taxRatesOf(o).map(taxLabel).join(' / ')

  const valid =
    no.trim() &&
    (below.length === 0 || ackMinOrder) &&
    (mode === '线上' ? signer.trim() && phone.trim() : signedAt && file.trim())

  return (
    <div className="flex flex-col gap-4">
      <PageBar title="发起合同" order={o} onBack={onBack} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <OrderInfoCard order={o} amountLabel="合同金额" />

          {below.length > 0 && (
            <div role="alert" className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                以下商品数量低于上架单约定的起订量
              </span>
              <ul className="flex flex-col gap-0.5 pl-6">
                {below.map((l) => (
                  <li key={l.code}>
                    {l.name}：订购 {l.quantity.toLocaleString()} {l.unit}，起订 {l.minOrder?.toLocaleString()} {l.unit}
                  </li>
                ))}
              </ul>
              <label className="flex cursor-pointer items-center gap-2 pl-6">
                <input type="checkbox" checked={ackMinOrder} onChange={(e) => setAckMinOrder(e.target.checked)} className="size-3.5 accent-[#1890ff]" />
                已与买方协商一致，按实际数量签订合同
              </label>
            </div>
          )}

          <Card title="签署方式">
            <div role="radiogroup" aria-label="签署方式" className="flex flex-col gap-3 sm:flex-row">
              <ModeOption active={mode === '线上'} icon={FileSignature} title="线上电子签" desc="由平台生成电子合同并发送给买方签署人，双方在线完成电子签章，签署完成后自动归档。" onClick={() => setMode('线上')} />
              <ModeOption active={mode === '线下'} icon={FileText} title="线下纸质签" desc="双方线下签订纸质合同，商家上传盖章扫描件并登记签署日期，合同即时生效。" onClick={() => setMode('线下')} />
            </div>
          </Card>

          <Card title="合同信息">
            <div className="grid gap-4 sm:grid-cols-2">
              <DialogField label="合同编号" required>
                <DialogInput label="合同编号" value={no} onChange={setNo} />
              </DialogField>
              <DialogField label="合同模板" required hint={templateMismatch ? `订单履约方式为「${o.payTerm}」，当前模板条款与之不一致` : '已按订单履约方式自动匹配'}>
                <select
                  aria-label="合同模板"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={cn('h-9 rounded border bg-background px-3 text-sm focus:border-[#1890ff] focus:outline-none', templateMismatch ? 'border-amber-400' : 'border-border')}
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </DialogField>
              <DialogField label="履约方式">
                <ReadonlyField>{o.payTerm}</ReadonlyField>
              </DialogField>
              <DialogField label="税率">
                <ReadonlyField>
                  {taxText}
                  {tax > 0 && <span className="ml-2 text-xs text-muted-foreground">税额 {fmtMoney(tax)}</span>}
                </ReadonlyField>
              </DialogField>
              <DialogField label="合同金额（含运费）">
                <ReadonlyField>{fmtMoney(amount)}</ReadonlyField>
              </DialogField>
              <DialogField label="合同标的">
                <ReadonlyField>
                  <span className="truncate">
                    {lines.length} 项商品 · 上架单 {[...new Set(lines.map((l) => l.listingNo).filter(Boolean))].join('、') || '—'}
                  </span>
                </ReadonlyField>
              </DialogField>
              {mode === '线上' ? (
                <>
                  <DialogField label="甲方签署人" required hint="买方负责签署合同的联系人">
                    <DialogInput label="甲方签署人" value={signer} onChange={setSigner} placeholder="请输入姓名" />
                  </DialogField>
                  <DialogField label="签署人手机号" required hint="电子签署链接与验证码将发送至该手机号">
                    <DialogInput label="签署人手机号" value={phone} onChange={setPhone} placeholder="请输入手机号" />
                  </DialogField>
                </>
              ) : (
                <>
                  <DialogField label="签署日期" required>
                    <input
                      type="date"
                      aria-label="签署日期"
                      value={signedAt}
                      onChange={(e) => setSignedAt(e.target.value)}
                      className="h-9 rounded border border-border bg-background px-3 text-sm focus:border-[#1890ff] focus:outline-none"
                    />
                  </DialogField>
                  <DialogField label="合同扫描件" required hint="支持 PDF / JPG / PNG，需含双方盖章页">
                    {file ? (
                      <div className="flex h-9 items-center justify-between rounded border border-border bg-background px-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{file}</span>
                        </span>
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setFile('')}>
                          移除
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFile(`${no || '合同'}-盖章扫描件.pdf`)}
                        className="flex h-9 items-center justify-center gap-2 rounded border border-dashed border-border text-sm text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]"
                      >
                        <Upload className="size-4" />
                        上传扫描件
                      </button>
                    )}
                  </DialogField>
                </>
              )}
              <div className="sm:col-span-2">
                <DialogField label="备注">
                  <textarea aria-label="备注" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="补充合同约定、交付要求等" className={TEXTAREA_CLS} />
                </DialogField>
              </div>
            </div>
          </Card>

          <Card title="主要条款预览" extra={<span className="text-xs text-muted-foreground">{template.name}</span>}>
            <p className="text-xs text-muted-foreground">{template.desc}</p>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
              {template.clauses.map((c) => (
                <li key={c}>{c}</li>
              ))}
              <li>
                商品以上架单约定的规格、税率（{taxText}）为准；数量、单价以本订单明细为准
                {o.freight ? `，运费 ${fmtMoney(o.freight)} 由买方承担` : '，免运费'}。
              </li>
            </ol>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card title="合同摘要">
            <InfoGrid
              cols={2}
              rows={[
                ['合同编号', <span key="no" className="font-mono">{no || '—'}</span>],
                ['签署方式', mode === '线上' ? '线上电子签' : '线下纸质签'],
                ['合同模板', template.name],
                ['标的', lines.length > 1 ? `${lines[0].name} 等 ${lines.length} 项` : `${o.goods.name} ${o.quantity.toLocaleString()} ${o.goods.unit}`],
                ['履约方式', o.payTerm],
                ['税率', taxText],
                ['起订量校验', below.length ? <span key="mo" className="text-amber-700">{below.length} 项未达</span> : '全部达标'],
              ]}
            />
            <div className="flex flex-col gap-1 border-t border-border pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">合同金额</span>
                <span className="text-lg font-semibold tabular-nums">{fmtMoney(amount)}</span>
              </div>
              {tax > 0 && (
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>其中税额</span>
                  <span className="tabular-nums">{fmtMoney(tax)}</span>
                </div>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {mode === '线上' ? '发起后合同状态为「待签署」，买方完成电子签后自动变为「已签署」。' : '登记后合同状态直接为「已签署」，扫描件可在订单详情中查看。'}
            </p>
            <div className="flex flex-col gap-2">
              <Button className={PRIMARY_BTN} disabled={!valid} onClick={() => onSubmit({ no: no.trim(), mode, template: template.name, signer, phone, signedAt, file, note })}>
                {mode === '线上' ? '发起线上签署' : '登记线下合同'}
              </Button>
              <Button variant="outline" onClick={onBack}>
                取消
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
