'use client'

import { useState } from 'react'
import { ArrowLeft, FileSignature, FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DialogField, DialogInput, PRIMARY_BTN, Tag } from '@/components/goods-list'
import { fmtMoney, saleAmount, saleStatusMeta, type SaleOrder } from '@/lib/orders-data'

const TODAY = '2024-10-28'

type SignMode = NonNullable<SaleOrder['contractSign']>

export type ContractSubmit = {
  no: string
  mode: SignMode
  signer: string
  phone: string
  signedAt: string
  file: string
  note: string
}

function Card({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-md border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {extra}
      </header>
      <div className="flex flex-col gap-4 px-5 py-4">{children}</div>
    </section>
  )
}

function InfoGrid({ rows, cols = 3 }: { rows: [string, React.ReactNode][]; cols?: 2 | 3 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3 text-sm', cols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2')}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="truncate" title={typeof v === 'string' ? v : undefined}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  )
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

export function SaleContractPage({ order: o, onBack, onSubmit }: { order: SaleOrder; onBack: () => void; onSubmit: (v: ContractSubmit) => void }) {
  const [no, setNo] = useState(`HT${o.id.slice(2)}`)
  const [mode, setMode] = useState<SignMode>('线上')
  const [signer, setSigner] = useState('')
  const [phone, setPhone] = useState('')
  const [signedAt, setSignedAt] = useState(TODAY)
  const [file, setFile] = useState('')
  const [note, setNote] = useState('')

  const amount = saleAmount(o)
  const unit = `¥ ${o.unitPrice.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} / ${o.goods.unit}`
  const valid = no.trim() && (mode === '线上' ? signer.trim() && phone.trim() : signedAt && file.trim())
  const meta = saleStatusMeta[o.status]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" />
            返回销售订单
          </Button>
          <span className="h-4 w-px bg-border" aria-hidden />
          <h1 className="text-base font-semibold">发起合同</h1>
          <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
          <Tag className={meta.className}>{meta.label}</Tag>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <Card title="订单信息">
            <InfoGrid
              rows={[
                ['订单号', <span key="id" className="font-mono">{o.id}</span>],
                ['下单时间', o.createdAt],
                ['结算方式', o.payTerm],
                ['买方（甲方）', o.buyer],
                ['卖方（乙方）', o.seller],
                ['所属店铺', o.shop],
                ['服务商', o.provider ?? '—'],
                ['支付方式', o.payMethod],
                ['收货地址', o.address],
              ]}
            />
            <div className="overflow-hidden rounded border border-border">
              <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                <span>商品</span>
                <span className="text-right">数量</span>
                <span className="text-right">单价</span>
                <span className="text-right">小计</span>
              </div>
              <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] items-center px-4 py-3 text-sm">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{o.goods.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{o.goods.spec}</span>
                </span>
                <span className="text-right tabular-nums">
                  {o.quantity.toLocaleString()} {o.goods.unit}
                </span>
                <span className="text-right tabular-nums">{unit}</span>
                <span className="text-right tabular-nums">{fmtMoney(o.unitPrice * o.quantity)}</span>
              </div>
              <div className="flex items-center justify-end gap-6 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                <span>运费 {o.freight ? fmtMoney(o.freight) : '免运费'}</span>
                <span>
                  合同金额 <span className="text-sm font-semibold text-foreground">{fmtMoney(amount)}</span>
                </span>
              </div>
            </div>
          </Card>

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
              <DialogField label="合同金额">
                <div className="flex h-9 items-center rounded border border-border bg-muted/40 px-3 text-sm tabular-nums">{fmtMoney(amount)}</div>
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
                  <textarea
                    aria-label="备注"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="补充合同约定、交付要求等"
                    className="w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm placeholder:text-xs placeholder:text-muted-foreground/60 focus:border-[#1890ff] focus:outline-none"
                  />
                </DialogField>
              </div>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card title="合同摘要">
            <InfoGrid
              cols={2}
              rows={[
                ['合同编号', <span key="no" className="font-mono">{no || '—'}</span>],
                ['签署方式', mode === '线上' ? '线上电子签' : '线下纸质签'],
                ['标的', `${o.goods.name} ${o.quantity.toLocaleString()} ${o.goods.unit}`],
                ['结算方式', o.payTerm],
              ]}
            />
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">合同金额</span>
              <span className="text-lg font-semibold tabular-nums">{fmtMoney(amount)}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {mode === '线上' ? '发起后合同状态为「待签署」，买方完成电子签后自动变为「已签署」。' : '登记后合同状态直接为「已签署」，扫描件可在订单详情中查看。'}
            </p>
            <div className="flex flex-col gap-2">
              <Button className={PRIMARY_BTN} disabled={!valid} onClick={() => onSubmit({ no: no.trim(), mode, signer, phone, signedAt, file, note })}>
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
