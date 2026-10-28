'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { ActionLink, bizMeta } from '@/components/goods-list'
import { Select } from '@/components/shop-form-fields'
import {
  ActionCell,
  ActionDialog,
  DetailModal,
  FilterPanel,
  FilterRow,
  GoodsCell,
  IdCell,
  KpiStrip,
  MoneyCell,
  OrderTable,
  PartyCell,
  RoleBanner,
  Stamp,
  StatusTabs,
  Tag,
  Toast,
  emptyBaseFilters,
  visibleColumns,
  withEvent,
  type ActionDef,
  type BaseFilters,
  type Column,
  type DetailSection,
  type Kpi,
} from '@/components/orders-shared'
import {
  DEMO,
  TODAY,
  actorOf,
  afterOrdersData,
  afterStatusMeta,
  afterStatusOrder,
  afterTypeMeta,
  depositTotal,
  fmtMoney,
  overdueDays,
  ownsOrder,
  providerGain,
  rentAmount,
  rentDays,
  rentOrdersData,
  rentStatusMeta,
  rentStatusOrder,
  saleAmount,
  saleOrdersData,
  saleStatusMeta,
  saleStatusOrder,
  type AfterOrder,
  type AfterStatus,
  type OrderRole,
  type RentOrder,
  type RentStatus,
  type SaleOrder,
  type SaleStatus,
} from '@/lib/orders-data'

export type OrdersKind = 'rent' | 'sale' | 'after'

/* ---------- 通用列表状态 ---------- */

type Listed = { id: string; updatedAt: string; timeline: { at: string; label: string; by: string }[] }

function useOrderList<T extends Listed>(initial: T[]) {
  const [rows, setRows] = useState<T[]>(initial)
  const [dialog, setDialog] = useState<{ id: string; action: ActionDef<T> } | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const run = (row: T, action: ActionDef<T>, values: Record<string, string> = {}) => {
    const next = action.apply(row, values)
    setRows((list) => list.map((r) => (r.id === row.id ? next : r)))
    setDialog(null)
    setToast(action.toast(next, values))
    window.setTimeout(() => setToast(null), 2600)
  }
  const trigger = (row: T, action: ActionDef<T>) => {
    if (action.instant || (!action.fields?.length && !action.desc)) run(row, action)
    else setDialog({ id: row.id, action })
  }
  const dialogRow = dialog ? rows.find((r) => r.id === dialog.id) : undefined
  const detailRow = detailId ? rows.find((r) => r.id === detailId) : undefined
  return { rows, dialog, dialogRow, detailRow, toast, run, trigger, setDialog, setDetailId }
}

function inRange(date: string, from: string, to: string) {
  const d = date.slice(0, 10)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

function sourceOf(o: { provider?: string }) {
  return o.provider ? '服务商代理' : '自营'
}

/** 对手方：商家 / 服务商看承租(购买)方，买/租方看出租(出售)方 */
function counterpart(o: { seller: string; buyer: string; provider?: string }, role: OrderRole) {
  return role === 'buyer' ? o.provider ?? o.seller : o.buyer
}

function Summary({ children }: { children: React.ReactNode }) {
  return <div className="rounded bg-muted/40 px-3 py-2 text-sm">{children}</div>
}

function ContractLink({ no }: { no?: string }) {
  if (!no) return null
  return (
    <ActionLink>
      <span className="inline-flex items-center gap-1">
        <FileText className="size-3" aria-hidden />
        合同
      </span>
    </ActionLink>
  )
}

/* =====================================================================
 * 租赁订单
 * ===================================================================== */

const rentBanner: Record<OrderRole, string> = {
  seller: '以出租方身份查看自营及服务商代理成交的租赁订单：负责发货、收回验收与押金结算，关注逾期与应收租金。',
  buyer: '以承租方身份查看向商家或服务商租入的订单：负责付款、确认收货、续租与申请归还，关注在押押金与到期时间。',
  provider: '以代理方身份查看受托商品的租赁成交：协调商家发货与收回验收，关注底价与对外价之间的服务收益。',
}

function rentActions(o: RentOrder, role: OrderRole): ActionDef<RentOrder>[] {
  const by = actorOf[role]
  const s = o.status
  const list: ActionDef<RentOrder>[] = []
  const cancel: ActionDef<RentOrder> = {
    id: 'cancel',
    label: '取消订单',
    tone: 'danger',
    desc: '订单尚未付款，取消后不产生费用。',
    fields: [{ key: 'reason', label: '取消原因', placeholder: '请填写取消原因', required: true }],
    apply: (x, v) => withEvent({ ...x, status: 'cancelled' }, `${by}取消订单`, by, v.reason),
    toast: () => '订单已取消',
  }

  if (role === 'buyer') {
    if (s === 'unpaid') {
      list.push({
        id: 'pay',
        label: '去支付',
        title: '支付订单',
        desc: `需支付首期租金 ${fmtMoney(o.unitPrice * o.quantity * Math.min(30, rentDays(o)))}（按 30 天预付）及押金 ${fmtMoney(depositTotal(o))}。`,
        confirmLabel: '确认支付',
        apply: (x) => withEvent({ ...x, status: 'toShip' }, '支付首期租金与押金', by),
        toast: () => '支付成功，等待出租方发货',
      })
      list.push(cancel)
    }
    if (s === 'toShip') list.push({ id: 'urge', label: '催发货', instant: true, apply: (x) => withEvent(x, '催促发货', by), toast: () => '已提醒出租方尽快发货' })
    if (s === 'shipped')
      list.push({
        id: 'receive',
        label: '确认收货',
        desc: '确认租赁物已全部到场并验收无误后，订单进入租赁中，租金自起租日起计算。',
        apply: (x) => withEvent({ ...x, status: 'renting' }, '买/租方确认收货，开始计租', by),
        toast: () => '已确认收货，开始计租',
      })
    if (s === 'renting') {
      list.push({
        id: 'renew',
        label: '申请续租',
        fields: [{ key: 'dueDate', label: '续租至', type: 'date', required: true, initial: o.dueDate }],
        apply: (x, v) => withEvent({ ...x, dueDate: v.dueDate }, `申请续租至 ${v.dueDate}`, by),
        toast: (x) => `已续租至 ${x.dueDate}`,
      })
      list.push({
        id: 'return',
        label: '申请归还',
        fields: [
          { key: 'date', label: '预计送达日期', type: 'date', required: true },
          { key: 'note', label: '归还说明', placeholder: '如：分两车送回，需协助卸货' },
        ],
        apply: (x, v) => withEvent({ ...x, status: 'returning' }, '买/租方申请归还', by, `预计 ${v.date} 送达${v.note ? `，${v.note}` : ''}`),
        toast: () => '归还申请已提交，等待出租方确认收回',
      })
    }
    if (s === 'done') list.push({ id: 'review', label: '评价', instant: true, apply: (x) => withEvent(x, '买/租方提交评价', by), toast: () => '感谢您的评价' })
  }

  if (role === 'seller' || role === 'provider') {
    if (s === 'unpaid') list.push(cancel)
    if (s === 'toShip') {
      if (role === 'seller')
        list.push({
          id: 'ship',
          label: '发货',
          fields: [{ key: 'logistics', label: '承运信息', placeholder: '车牌 / 司机 / 联系电话', required: true }],
          apply: (x, v) => withEvent({ ...x, status: 'shipped', logistics: v.logistics }, '商家发货', by, v.logistics),
          toast: () => '已发货，等待承租方确认收货',
        })
      else list.push({ id: 'notify', label: '通知商家发货', instant: true, apply: (x) => withEvent(x, '服务商通知商家发货', by), toast: () => '已通知委托商家安排发货' })
    }
    if (s === 'renting' && overdueDays(o) > 0)
      list.push({ id: 'remind', label: '提醒归还', instant: true, apply: (x) => withEvent(x, `${by}提醒承租方归还`, by), toast: () => '已向承租方发送归还提醒' })
    if (s === 'returning')
      list.push({
        id: 'collect',
        label: '确认收回',
        desc: '确认已收到归还的租赁物，订单进入验收环节；验收完成后结算押金。',
        apply: (x) => withEvent({ ...x, status: 'checking', returnDate: TODAY }, `${by}确认收回，待验收`, by),
        toast: () => '已确认收回，请尽快完成验收',
      })
    if (s === 'checking')
      list.push({
        id: 'settle',
        label: '验收并结算押金',
        fields: [
          { key: 'deduction', label: '损耗扣款', type: 'number', prefix: '¥', initial: '0' },
          { key: 'note', label: '验收说明', placeholder: '如：3 根横杆变形，按合同折价' },
        ],
        apply: (x, v) => {
          const d = Number(v.deduction) || 0
          return withEvent(
            { ...x, status: 'done', deduction: d, returnDate: x.returnDate ?? TODAY },
            d > 0 ? `验收完成，扣除损耗 ${fmtMoney(d)} 后退还押金` : '验收完成，全额退还押金',
            by,
            v.note,
          )
        },
        toast: (x) => `验收完成，退还押金 ${fmtMoney(depositTotal(x) - (x.deduction ?? 0))}`,
      })
  }
  return list
}

function RentOrders({ role }: { role: OrderRole }) {
  const own = rentOrdersData.filter((o) => ownsOrder(o, role))
  const { rows, dialog, dialogRow, detailRow, toast, run, trigger, setDialog, setDetailId } = useOrderList(own)
  const [draft, setDraft] = useState<BaseFilters>(emptyBaseFilters)
  const [applied, setApplied] = useState<BaseFilters>(emptyBaseFilters)
  const [status, setStatus] = useState<RentStatus | ''>('')

  const match = (o: RentOrder, f: BaseFilters) => {
    const kw = f.keyword.trim().toLowerCase()
    if (kw && !o.id.toLowerCase().includes(kw) && !o.goods.name.toLowerCase().includes(kw) && !(o.contractNo ?? '').toLowerCase().includes(kw)) return false
    if (f.party && counterpart(o, role) !== f.party) return false
    if (f.source && sourceOf(o) !== f.source) return false
    if (!inRange(o.createdAt, f.from, f.to)) return false
    return true
  }
  const base = rows.filter((o) => match(o, applied))
  const visible = status ? base.filter((o) => o.status === status) : base
  const countOf = (s: RentStatus | '') => (s ? base.filter((o) => o.status === s).length : base.length)
  const parties = [...new Set(rows.map((o) => counterpart(o, role)))]

  const n = (...s: RentStatus[]) => rows.filter((o) => s.includes(o.status)).length
  const active = rows.filter((o) => ['shipped', 'renting', 'returning', 'checking'].includes(o.status))
  const overdue = rows.filter((o) => overdueDays(o) > 0).length
  const kpis: Record<OrderRole, Kpi[]> = {
    seller: [
      { label: '待发货', value: String(n('toShip')), hint: '已付款等待安排发货' },
      { label: '租赁中', value: String(n('renting', 'shipped')), hint: '含在途待收货' },
      { label: '待收回 / 验收', value: String(n('returning', 'checking')), hint: '需确认收回并验收结算' },
      { label: '逾期订单', value: String(overdue), hint: '超过约定到期日未归还', tone: overdue ? 'warn' : 'default' },
    ],
    buyer: [
      { label: '待付款', value: String(n('unpaid')), hint: '含首期租金与押金' },
      { label: '待收货', value: String(n('toShip', 'shipped')), hint: '出租方发货中' },
      { label: '在租订单', value: String(n('renting')), hint: '按日计租中' },
      { label: '在押押金', value: fmtMoney(active.reduce((s, o) => s + depositTotal(o), 0)), hint: '验收完成后退还' },
    ],
    provider: [
      { label: '待协调发货', value: String(n('toShip')), hint: '需通知委托商家发货' },
      { label: '代理在租', value: String(n('renting', 'shipped')), hint: '受托商品租赁中' },
      { label: '待收回 / 验收', value: String(n('returning', 'checking')) },
      {
        label: '预计服务收益',
        value: fmtMoney(rows.filter((o) => o.status !== 'cancelled' && o.status !== 'unpaid').reduce((s, o) => s + providerGain(o), 0)),
        hint: '(对外租金 − 底价) × 数量 × 租期',
        tone: 'good',
      },
    ],
  }

  const cols: Column<RentOrder>[] = [
    { key: 'id', label: '订单号', width: '132px', render: (o) => <IdCell id={o.id} sub={o.contractNo} /> },
    { key: 'goods', label: '租赁商品', width: 'minmax(180px,1.3fr)', render: (o) => <GoodsCell name={o.goods.name} spec={o.goods.spec} qty={o.quantity} unit={o.goods.unit} /> },
    {
      key: 'party',
      label: '承租方',
      width: 'minmax(150px,1fr)',
      roles: ['seller'],
      render: (o) => <PartyCell name={o.buyer} sub={o.provider ? `代理：${o.provider}` : '自营成交'} subTone={o.provider ? 'primary' : 'muted'} />,
    },
    {
      key: 'lessor',
      label: '出租方',
      width: 'minmax(150px,1fr)',
      roles: ['buyer'],
      render: (o) => <PartyCell name={o.provider ?? o.seller} sub={o.provider ? `服务商代理 · 商家 ${o.seller}` : '商家自营'} />,
    },
    { key: 'owner', label: '委托商家', width: 'minmax(130px,1fr)', roles: ['provider'], render: (o) => <PartyCell name={o.seller} /> },
    { key: 'lessee', label: '承租方', width: 'minmax(130px,1fr)', roles: ['provider'], render: (o) => <PartyCell name={o.buyer} /> },
    {
      key: 'price',
      label: '租金 / 押金',
      width: '128px',
      roles: ['seller', 'buyer'],
      render: (o) => (
        <MoneyCell
          main={`¥ ${o.unitPrice.toLocaleString('zh-CN', { maximumFractionDigits: 3 })}/${o.goods.unit}/天`}
          sub={`押金 ¥ ${o.deposit.toLocaleString()}/${o.goods.unit}`}
        />
      ),
    },
    {
      key: 'spread',
      label: '底价 / 对外',
      width: '128px',
      roles: ['provider'],
      render: (o) => (
        <MoneyCell
          main={`¥ ${o.unitPrice.toLocaleString('zh-CN', { maximumFractionDigits: 3 })}/${o.goods.unit}/天`}
          sub={`底价 ¥ ${(o.basePrice ?? 0).toLocaleString('zh-CN', { maximumFractionDigits: 3 })}`}
        />
      ),
    },
    {
      key: 'term',
      label: '租期',
      width: '150px',
      render: (o) => {
        const od = overdueDays(o)
        return (
          <span className="flex flex-col text-xs">
            <span className="font-mono">
              {o.startDate} ~ {o.returnDate ?? o.dueDate}
            </span>
            <span className="text-muted-foreground">
              {rentDays(o)} 天{o.returnDate ? ' · 已归还' : ''}
              {od > 0 && <span className="ml-1 text-red-600">逾期 {od} 天</span>}
            </span>
          </span>
        )
      },
    },
    {
      key: 'amount',
      label: role === 'seller' ? '应收租金' : role === 'buyer' ? '应付租金' : '服务收益',
      width: '112px',
      align: 'right',
      render: (o) =>
        role === 'provider' ? (
          <MoneyCell main={fmtMoney(providerGain(o))} sub={`订单 ${fmtMoney(rentAmount(o))}`} tone="good" />
        ) : (
          <MoneyCell main={fmtMoney(rentAmount(o))} sub={o.deduction ? `扣损耗 ${fmtMoney(o.deduction)}` : o.returnDate ? '已结算' : '按到期日估算'} />
        ),
    },
    { key: 'status', label: '状态', width: '76px', render: (o) => <Tag className={rentStatusMeta[o.status].className}>{rentStatusMeta[o.status].label}</Tag> },
    { key: 'created', label: '下单时间', width: '92px', render: (o) => <Stamp value={o.createdAt} /> },
    {
      key: 'actions',
      label: '操作',
      width: 'minmax(150px,1fr)',
      render: (o) => (
        <ActionCell
          actions={rentActions(o, role)}
          onAction={(a) => trigger(o, a)}
          extra={
            <>
              <ActionLink onClick={() => setDetailId(o.id)}>详情</ActionLink>
              <ContractLink no={o.contractNo} />
            </>
          }
        />
      ),
    },
  ]

  const detailSections = (o: RentOrder): DetailSection[] => [
    {
      title: '租赁信息',
      rows: [
        ['商品', `${o.goods.name} · ${o.goods.spec}`],
        ['数量', `${o.quantity.toLocaleString()} ${o.goods.unit}`],
        ['租金单价', `¥ ${o.unitPrice.toLocaleString('zh-CN', { maximumFractionDigits: 3 })} / ${o.goods.unit} / 天`],
        ...(role === 'provider' ? ([['商家底价', `¥ ${(o.basePrice ?? 0).toLocaleString('zh-CN', { maximumFractionDigits: 3 })} / ${o.goods.unit} / 天`]] as [string, React.ReactNode][]) : []),
        ['押金', `${fmtMoney(depositTotal(o))}（¥ ${o.deposit.toLocaleString()} / ${o.goods.unit}）`],
        ['租期', `${o.startDate} ~ ${o.returnDate ?? o.dueDate}（${rentDays(o)} 天）`],
        [role === 'provider' ? '服务收益' : role === 'seller' ? '应收租金' : '应付租金', <span key="amt" className="font-medium">{fmtMoney(role === 'provider' ? providerGain(o) : rentAmount(o))}</span>],
        ['损耗扣款', o.deduction ? fmtMoney(o.deduction) : '—'],
      ],
    },
    {
      title: '交易方',
      rows: [
        ['商家（出租方）', o.seller],
        ['承租方', o.buyer],
        ['服务商', o.provider ?? '— 商家自营'],
        ['合同编号', o.contractNo ?? '待签署'],
      ],
    },
    {
      title: '交付',
      rows: [
        ['使用地点', o.address],
        ['承运信息', o.logistics ?? '—'],
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <RoleBanner role={role} text={rentBanner[role]} />
      <KpiStrip items={kpis[role]} />
      <FilterPanel
        draft={draft}
        onChange={setDraft}
        onSearch={() => setApplied(draft)}
        onReset={() => {
          setDraft(emptyBaseFilters)
          setApplied(emptyBaseFilters)
          setStatus('')
        }}
        keywordLabel="订单"
        keywordPlaceholder="订单号 / 商品名称 / 合同号"
        partyLabel={role === 'buyer' ? '出租方' : '承租方'}
        partyOptions={parties}
        showSource={role === 'seller'}
        dateLabel="下单时间"
      />
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <StatusTabs
          order={rentStatusOrder}
          meta={rentStatusMeta}
          active={status}
          countOf={countOf}
          onSelect={setStatus}
          ariaLabel="租赁订单状态"
          right={`共 ${visible.length} 条`}
        />
        <OrderTable
          columns={visibleColumns(cols, role)}
          rows={visible}
          minWidth="1240px"
          emptyText="没有符合条件的租赁订单"
          footer={
            <>
              <span>共 {visible.length} 条</span>
              <span>今日：{TODAY} · 逾期按约定到期日计算</span>
            </>
          }
        />
      </div>

      {dialog && dialogRow && (
        <ActionDialog
          key={dialog.action.id + dialogRow.id}
          action={dialog.action}
          summary={
            <Summary>
              <span className="font-mono text-xs text-muted-foreground">{dialogRow.id}</span> · {dialogRow.goods.name} · {dialogRow.quantity.toLocaleString()} {dialogRow.goods.unit}
            </Summary>
          }
          onClose={() => setDialog(null)}
          onConfirm={(v) => run(dialogRow, dialog.action, v)}
        />
      )}
      {detailRow && (
        <DetailModal
          title={`租赁订单 ${detailRow.id}`}
          status={<Tag className={rentStatusMeta[detailRow.status].className}>{rentStatusMeta[detailRow.status].label}</Tag>}
          sections={detailSections(detailRow)}
          timeline={detailRow.timeline}
          onClose={() => setDetailId(null)}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}

/* =====================================================================
 * 销售订单
 * ===================================================================== */

const saleBanner: Record<OrderRole, string> = {
  seller: '以卖方身份查看自营及服务商代理成交的销售订单：负责发货、开票与账期跟进，关注待发货与售后中订单。',
  buyer: '以买方身份查看采购订单：负责付款、确认收货与申请售后，可查看物流与发票状态。',
  provider: '以代理方身份查看受托商品的销售成交：协调商家发货与物流跟进，关注底价与成交价之间的服务收益。',
}

function saleActions(o: SaleOrder, role: OrderRole): ActionDef<SaleOrder>[] {
  const by = actorOf[role]
  const s = o.status
  const list: ActionDef<SaleOrder>[] = []
  const cancel: ActionDef<SaleOrder> = {
    id: 'cancel',
    label: '取消订单',
    tone: 'danger',
    fields: [{ key: 'reason', label: '取消原因', required: true, placeholder: '请填写取消原因' }],
    apply: (x, v) => withEvent({ ...x, status: 'cancelled' }, `${by}取消订单`, by, v.reason),
    toast: () => '订单已取消',
  }
  if (role === 'buyer') {
    if (s === 'unpaid') {
      list.push({
        id: 'pay',
        label: '去支付',
        title: '支付订单',
        desc: `订单金额 ${fmtMoney(saleAmount(o))}（含运费 ${fmtMoney(o.freight)}），支付方式：${o.payMethod}。`,
        confirmLabel: '确认支付',
        apply: (x) => withEvent({ ...x, status: 'toShip' }, x.payMethod === '对公转账' ? '对公转账到账' : '在线支付成功', by),
        toast: () => '支付成功，等待卖方发货',
      })
      list.push(cancel)
    }
    if (s === 'toShip') list.push({ id: 'urge', label: '催发货', instant: true, apply: (x) => withEvent(x, '催促发货', by), toast: () => '已提醒卖方尽快发货' })
    if (s === 'shipped')
      list.push({
        id: 'receive',
        label: '确认收货',
        desc: '请核对到货数量与规格，确认后订单完成，可申请开票。',
        apply: (x) => withEvent({ ...x, status: 'done' }, '买方确认收货', by),
        toast: () => '已确认收货，订单完成',
      })
    if (s === 'done') {
      list.push({
        id: 'after',
        label: '申请售后',
        fields: [{ key: 'reason', label: '售后原因', required: true, placeholder: '如：到货数量不符、质量问题' }],
        apply: (x, v) => withEvent({ ...x, status: 'afterSale' }, '买方申请售后', by, v.reason),
        toast: () => '售后申请已提交，可在「售后处理」中跟进',
      })
      if (o.invoice === '已开票') list.push({ id: 'invoice', label: '查看发票', instant: true, apply: (x) => x, toast: () => '已打开电子发票' })
    }
  }
  if (role === 'seller') {
    if (s === 'unpaid') list.push(cancel)
    if (s === 'toShip')
      list.push({
        id: 'ship',
        label: '发货',
        fields: [
          { key: 'company', label: '物流公司 / 车辆', required: true, placeholder: '如：德邦物流 或 沪A·12345' },
          { key: 'no', label: '运单号', placeholder: '选填' },
        ],
        apply: (x, v) => {
          const logistics = [v.company, v.no].filter(Boolean).join(' ')
          return withEvent({ ...x, status: 'shipped', logistics }, '商家发货', by, logistics)
        },
        toast: () => '已发货，等待买方确认收货',
      })
    if (s === 'done' && o.invoice === '待开票')
      list.push({
        id: 'invoice',
        label: '开票',
        fields: [
          { key: 'title', label: '发票抬头', required: true, initial: o.buyer },
          { key: 'taxNo', label: '纳税人识别号', required: true, placeholder: '91310000XXXXXXXXXX' },
        ],
        apply: (x, v) => withEvent({ ...x, invoice: '已开票' }, '商家开具发票', by, v.title),
        toast: () => '发票已开具并推送给买方',
      })
  }
  if (role === 'provider') {
    if (s === 'unpaid') list.push(cancel)
    if (s === 'toShip') list.push({ id: 'notify', label: '通知商家发货', instant: true, apply: (x) => withEvent(x, '服务商通知商家发货', by), toast: () => '已通知委托商家安排发货' })
    if (s === 'shipped') list.push({ id: 'track', label: '跟进物流', instant: true, apply: (x) => withEvent(x, '服务商跟进物流', by), toast: () => `已同步物流：${o.logistics ?? '待更新'}` })
  }
  return list
}

function SaleOrders({ role }: { role: OrderRole }) {
  const own = saleOrdersData.filter((o) => ownsOrder(o, role))
  const { rows, dialog, dialogRow, detailRow, toast, run, trigger, setDialog, setDetailId } = useOrderList(own)
  const [draft, setDraft] = useState<BaseFilters>(emptyBaseFilters)
  const [applied, setApplied] = useState<BaseFilters>(emptyBaseFilters)
  const [status, setStatus] = useState<SaleStatus | ''>('')

  const match = (o: SaleOrder, f: BaseFilters) => {
    const kw = f.keyword.trim().toLowerCase()
    if (kw && !o.id.toLowerCase().includes(kw) && !o.goods.name.toLowerCase().includes(kw) && !(o.logistics ?? '').toLowerCase().includes(kw)) return false
    if (f.party && counterpart(o, role) !== f.party) return false
    if (f.source && sourceOf(o) !== f.source) return false
    if (!inRange(o.createdAt, f.from, f.to)) return false
    return true
  }
  const base = rows.filter((o) => match(o, applied))
  const visible = status ? base.filter((o) => o.status === status) : base
  const countOf = (s: SaleStatus | '') => (s ? base.filter((o) => o.status === s).length : base.length)
  const parties = [...new Set(rows.map((o) => counterpart(o, role)))]

  const n = (...s: SaleStatus[]) => rows.filter((o) => s.includes(o.status)).length
  const month = rows.filter((o) => o.createdAt.startsWith('2024-10') && o.status !== 'cancelled' && o.status !== 'unpaid')
  const kpis: Record<OrderRole, Kpi[]> = {
    seller: [
      { label: '待发货', value: String(n('toShip')), hint: '已付款等待发货' },
      { label: '待收货', value: String(n('shipped')), hint: '在途中' },
      { label: '售后中', value: String(n('afterSale')), tone: n('afterSale') ? 'warn' : 'default' },
      { label: '本月成交额', value: fmtMoney(month.reduce((s, o) => s + saleAmount(o), 0)), hint: '含运费，不含已取消 / 未付款' },
    ],
    buyer: [
      { label: '待付款', value: String(n('unpaid')) },
      { label: '待收货', value: String(n('toShip', 'shipped')), hint: '含卖方备货中' },
      { label: '待开票', value: String(rows.filter((o) => o.status === 'done' && o.invoice === '待开票').length), hint: '已完成订单' },
      { label: '待付金额', value: fmtMoney(rows.filter((o) => o.status === 'unpaid').reduce((s, o) => s + saleAmount(o), 0)), tone: 'warn' },
    ],
    provider: [
      { label: '待协调发货', value: String(n('toShip')) },
      { label: '在途跟进', value: String(n('shipped')) },
      { label: '售后中', value: String(n('afterSale')), tone: n('afterSale') ? 'warn' : 'default' },
      {
        label: '累计服务收益',
        value: fmtMoney(rows.filter((o) => o.status !== 'cancelled' && o.status !== 'unpaid').reduce((s, o) => s + providerGain(o), 0)),
        hint: '(成交价 − 底价) × 数量',
        tone: 'good',
      },
    ],
  }

  const cols: Column<SaleOrder>[] = [
    { key: 'id', label: '订单号', width: '132px', render: (o) => <IdCell id={o.id} sub={o.contractNo} /> },
    { key: 'goods', label: '商品', width: 'minmax(180px,1.3fr)', render: (o) => <GoodsCell name={o.goods.name} spec={o.goods.spec} qty={o.quantity} unit={o.goods.unit} /> },
    {
      key: 'buyer',
      label: '买方',
      width: 'minmax(150px,1fr)',
      roles: ['seller'],
      render: (o) => <PartyCell name={o.buyer} sub={o.provider ? `代理：${o.provider}` : '自营成交'} subTone={o.provider ? 'primary' : 'muted'} />,
    },
    {
      key: 'sellerParty',
      label: '卖方',
      width: 'minmax(150px,1fr)',
      roles: ['buyer'],
      render: (o) => <PartyCell name={o.provider ?? o.seller} sub={o.provider ? `服务商代理 · 商家 ${o.seller}` : '商家自营'} />,
    },
    { key: 'owner', label: '委托商家', width: 'minmax(130px,1fr)', roles: ['provider'], render: (o) => <PartyCell name={o.seller} /> },
    { key: 'purchaser', label: '买方', width: 'minmax(130px,1fr)', roles: ['provider'], render: (o) => <PartyCell name={o.buyer} /> },
    {
      key: 'price',
      label: role === 'provider' ? '底价 / 成交价' : '单价',
      width: '112px',
      render: (o) => (
        <MoneyCell
          main={`¥ ${o.unitPrice.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}/${o.goods.unit}`}
          sub={role === 'provider' ? `底价 ¥ ${(o.basePrice ?? 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}` : undefined}
        />
      ),
    },
    {
      key: 'amount',
      label: role === 'seller' ? '应收金额' : role === 'buyer' ? '应付金额' : '服务收益',
      width: '112px',
      align: 'right',
      render: (o) =>
        role === 'provider' ? (
          <MoneyCell main={fmtMoney(providerGain(o))} sub={`订单 ${fmtMoney(saleAmount(o))}`} tone="good" />
        ) : (
          <MoneyCell main={fmtMoney(saleAmount(o))} sub={o.freight ? `含运费 ${fmtMoney(o.freight)}` : '自提 / 免运费'} />
        ),
    },
    {
      key: 'delivery',
      label: '收货 / 物流',
      width: 'minmax(160px,1fr)',
      render: (o) => (
        <span className="flex min-w-0 flex-col text-xs">
          <span className="truncate" title={o.address}>
            {o.address}
          </span>
          <span className="truncate font-mono text-muted-foreground">{o.logistics ?? '未发货'}</span>
        </span>
      ),
    },
    {
      key: 'pay',
      label: '支付 / 发票',
      width: '92px',
      roles: ['seller', 'buyer'],
      render: (o) => (
        <span className="flex flex-col text-xs">
          <span>{o.payMethod}</span>
          <span className={o.invoice === '待开票' ? 'text-amber-600' : 'text-muted-foreground'}>{o.invoice}</span>
        </span>
      ),
    },
    { key: 'status', label: '状态', width: '72px', render: (o) => <Tag className={saleStatusMeta[o.status].className}>{saleStatusMeta[o.status].label}</Tag> },
    { key: 'created', label: '下单时间', width: '92px', render: (o) => <Stamp value={o.createdAt} /> },
    {
      key: 'actions',
      label: '操作',
      width: 'minmax(140px,1fr)',
      render: (o) => (
        <ActionCell
          actions={saleActions(o, role)}
          onAction={(a) => trigger(o, a)}
          extra={
            <>
              <ActionLink onClick={() => setDetailId(o.id)}>详情</ActionLink>
              <ContractLink no={o.contractNo} />
            </>
          }
        />
      ),
    },
  ]

  const detailSections = (o: SaleOrder): DetailSection[] => [
    {
      title: '商品与金额',
      rows: [
        ['商品', `${o.goods.name} · ${o.goods.spec}`],
        ['数量', `${o.quantity.toLocaleString()} ${o.goods.unit}`],
        ['成交单价', `¥ ${o.unitPrice.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} / ${o.goods.unit}`],
        ...(role === 'provider' ? ([['商家底价', `¥ ${(o.basePrice ?? 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} / ${o.goods.unit}`]] as [string, React.ReactNode][]) : []),
        ['运费', o.freight ? fmtMoney(o.freight) : '自提 / 免运费'],
        [role === 'provider' ? '服务收益' : '订单金额', <span key="amt" className="font-medium">{fmtMoney(role === 'provider' ? providerGain(o) : saleAmount(o))}</span>],
        ['支付方式', o.payMethod],
        ['发票', o.invoice],
      ],
    },
    {
      title: '交易方',
      rows: [
        ['商家（卖方）', o.seller],
        ['买方', o.buyer],
        ['服务商', o.provider ?? '— 商家自营'],
        ['合同编号', o.contractNo ?? '待签署'],
      ],
    },
    {
      title: '交付',
      rows: [
        ['收货地址', o.address],
        ['物流信息', o.logistics ?? '未发货'],
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <RoleBanner role={role} text={saleBanner[role]} />
      <KpiStrip items={kpis[role]} />
      <FilterPanel
        draft={draft}
        onChange={setDraft}
        onSearch={() => setApplied(draft)}
        onReset={() => {
          setDraft(emptyBaseFilters)
          setApplied(emptyBaseFilters)
          setStatus('')
        }}
        keywordLabel="订单"
        keywordPlaceholder="订单号 / 商品名称 / 运单号"
        partyLabel={role === 'buyer' ? '卖方' : '买方'}
        partyOptions={parties}
        showSource={role === 'seller'}
        dateLabel="下单时间"
      />
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <StatusTabs order={saleStatusOrder} meta={saleStatusMeta} active={status} countOf={countOf} onSelect={setStatus} ariaLabel="销售订单状态" right={`共 ${visible.length} 条`} />
        <OrderTable
          columns={visibleColumns(cols, role)}
          rows={visible}
          minWidth="1240px"
          emptyText="没有符合条件的销售订单"
          footer={
            <>
              <span>共 {visible.length} 条</span>
              <span>金额均含税；账期订单在结算管理中对账</span>
            </>
          }
        />
      </div>

      {dialog && dialogRow && (
        <ActionDialog
          key={dialog.action.id + dialogRow.id}
          action={dialog.action}
          summary={
            <Summary>
              <span className="font-mono text-xs text-muted-foreground">{dialogRow.id}</span> · {dialogRow.goods.name} · {dialogRow.quantity.toLocaleString()} {dialogRow.goods.unit} ·{' '}
              {fmtMoney(saleAmount(dialogRow))}
            </Summary>
          }
          onClose={() => setDialog(null)}
          onConfirm={(v) => run(dialogRow, dialog.action, v)}
        />
      )}
      {detailRow && (
        <DetailModal
          title={`销售订单 ${detailRow.id}`}
          status={<Tag className={saleStatusMeta[detailRow.status].className}>{saleStatusMeta[detailRow.status].label}</Tag>}
          sections={detailSections(detailRow)}
          timeline={detailRow.timeline}
          onClose={() => setDetailId(null)}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}

/* =====================================================================
 * 售后处理
 * ===================================================================== */

const afterBanner: Record<OrderRole, string> = {
  seller: '以责任方身份处理自营订单的售后，以及服务商转交的代理订单售后：审核申请、确认退货、执行退款或维修。',
  buyer: '以申请方身份跟进退款、退货、换货、维修与押金争议：可撤销申请、填写退货物流，对处理结果不满可申请平台介入。',
  provider: '以代理方身份首先受理代理订单的售后：可直接同意 / 拒绝，或转交委托商家处理，并跟进退货与退款进度。',
}

/** 当前角色是否为该售后单的责任处理方 */
function isRespondent(o: AfterOrder, role: OrderRole) {
  return (role === 'seller' && o.respondent === '商家') || (role === 'provider' && o.respondent === '服务商')
}

function afterActions(o: AfterOrder, role: OrderRole): ActionDef<AfterOrder>[] {
  const by = actorOf[role]
  const s = o.status
  const list: ActionDef<AfterOrder>[] = []
  const money = o.type === 'refund' || o.type === 'return' || o.type === 'deposit'

  if (role === 'buyer') {
    if (s === 'pending')
      list.push({
        id: 'withdraw',
        label: '撤销申请',
        tone: 'danger',
        desc: '撤销后本售后单关闭，如仍有问题可重新发起。',
        apply: (x) => withEvent({ ...x, status: 'withdrawn' }, '买/租方撤销申请', by),
        toast: () => '售后申请已撤销',
      })
    if (s === 'awaitReturn')
      list.push({
        id: 'returnShip',
        label: '填写退货物流',
        fields: [
          { key: 'company', label: '物流公司', required: true, placeholder: '如：顺丰 / 德邦' },
          { key: 'no', label: '运单号', required: true },
        ],
        apply: (x, v) => withEvent({ ...x, returnLogistics: `${v.company} ${v.no}` }, '买/租方寄回商品', by, `${v.company} ${v.no}`),
        toast: () => '退货物流已提交，等待对方签收',
      })
    if (s === 'processing' || s === 'awaitRefund')
      list.push({ id: 'urge', label: '催处理', instant: true, apply: (x) => withEvent(x, '买/租方催促处理', by), toast: () => `已提醒${o.respondent}尽快处理` })
    if (s === 'rejected')
      list.push({
        id: 'platform',
        label: '申请平台介入',
        fields: [{ key: 'reason', label: '申诉说明', required: true, placeholder: '请说明不认可拒绝理由的依据' }],
        apply: (x, v) => withEvent({ ...x, status: 'platform', handler: '平台 · 客服专员' }, '买/租方申请平台介入', by, v.reason),
        toast: () => '已提交平台介入，客服将在 1 个工作日内联系双方',
      })
    return list
  }

  if (!isRespondent(o, role)) return list

  if (s === 'pending') {
    list.push({
      id: 'accept',
      label: '同意',
      title: `同意${afterTypeMeta[o.type].label}`,
      desc:
        o.type === 'return'
          ? '同意后等待买方寄回商品，签收后进入退款。'
          : o.type === 'exchange' || o.type === 'repair'
            ? '同意后进入处理中，完成换货 / 维修后点击「处理完成」。'
            : '同意后进入待退款，请在 3 个工作日内完成退款。',
      fields: [
        ...(money ? [{ key: 'amount', label: '退款金额', type: 'number' as const, prefix: '¥', required: true, initial: String(o.amount) }] : []),
        { key: 'note', label: '处理说明', placeholder: '选填' },
      ],
      apply: (x, v) => {
        const next: AfterStatus = x.type === 'return' ? 'awaitReturn' : money ? 'awaitRefund' : 'processing'
        const amount = money ? Number(v.amount) || x.amount : x.amount
        return withEvent({ ...x, status: next, amount, handler: `${by} · ${role === 'seller' ? '售后专员' : '李工'}` }, `${by}同意${afterTypeMeta[x.type].label}${money ? ` ${fmtMoney(amount)}` : ''}`, by, v.note)
      },
      toast: (x) => `已同意，当前状态：${afterStatusMeta[x.status].label}`,
    })
    list.push({
      id: 'reject',
      label: '拒绝',
      tone: 'danger',
      fields: [{ key: 'reason', label: '拒绝原因', required: true, placeholder: '将同步给申请方' }],
      apply: (x, v) => withEvent({ ...x, status: 'rejected', note: v.reason, handler: `${by} · 售后专员` }, `${by}拒绝申请`, by, v.reason),
      toast: () => '已拒绝该售后申请',
    })
    if (role === 'provider')
      list.push({
        id: 'forward',
        label: '转交商家',
        desc: '涉及商品质量或押金的争议可转交委托商家处理，转交后由商家负责后续操作。',
        confirmLabel: '确认转交',
        apply: (x) => withEvent({ ...x, respondent: '商家', handler: '商家 · 待分配' }, '服务商转交委托商家处理', by),
        toast: () => '已转交委托商家处理',
      })
  }
  if (s === 'awaitReturn')
    list.push({
      id: 'received',
      label: '确认收到退货',
      desc: o.type === 'return' ? '确认签收并验货后进入待退款。' : '确认签收后安排换货发出。',
      apply: (x) => withEvent({ ...x, status: x.type === 'return' ? 'awaitRefund' : 'processing' }, `${by}确认收到退货`, by),
      toast: (x) => (x.status === 'awaitRefund' ? '已签收，请尽快退款' : '已签收，请安排换货'),
    })
  if (s === 'awaitRefund')
    list.push({
      id: 'refund',
      label: '确认退款',
      desc: `将向申请方退款 ${fmtMoney(o.amount)}，原路退回。`,
      confirmLabel: '确认退款',
      apply: (x) => withEvent({ ...x, status: 'done' }, `${by}完成退款 ${fmtMoney(x.amount)}`, by),
      toast: () => '退款已完成',
    })
  if (s === 'processing')
    list.push({
      id: 'finish',
      label: '处理完成',
      fields: [{ key: 'note', label: '处理结果', required: true, placeholder: '如：已更换 12 片围挡 / 已退回扣款' }],
      apply: (x, v) => withEvent({ ...x, status: 'done', note: v.note }, `${by}处理完成`, by, v.note),
      toast: () => '售后已处理完成',
    })
  return list
}

function AfterOrders({ role }: { role: OrderRole }) {
  const own = afterOrdersData.filter((o) => ownsOrder(o, role))
  const { rows, dialog, dialogRow, detailRow, toast, run, trigger, setDialog, setDetailId } = useOrderList(own)
  const [draft, setDraft] = useState<BaseFilters>(emptyBaseFilters)
  const [applied, setApplied] = useState<BaseFilters>(emptyBaseFilters)
  const [typeDraft, setTypeDraft] = useState('')
  const [typeApplied, setTypeApplied] = useState('')
  const [status, setStatus] = useState<AfterStatus | ''>('')

  const other = (o: AfterOrder) => (role === 'buyer' ? (o.respondent === '服务商' ? o.provider ?? o.seller : o.seller) : o.applicant)
  const match = (o: AfterOrder, f: BaseFilters, t: string) => {
    const kw = f.keyword.trim().toLowerCase()
    if (kw && !o.id.toLowerCase().includes(kw) && !o.orderId.toLowerCase().includes(kw) && !o.goods.name.toLowerCase().includes(kw)) return false
    if (f.party && other(o) !== f.party) return false
    if (f.source && sourceOf(o) !== f.source) return false
    if (t && afterTypeMeta[o.type].label !== t) return false
    if (!inRange(o.createdAt, f.from, f.to)) return false
    return true
  }
  const base = rows.filter((o) => match(o, applied, typeApplied))
  const visible = status ? base.filter((o) => o.status === status) : base
  const countOf = (s: AfterStatus | '') => (s ? base.filter((o) => o.status === s).length : base.length)
  const parties = [...new Set(rows.map(other))]

  const n = (...s: AfterStatus[]) => rows.filter((o) => s.includes(o.status)).length
  const mine = rows.filter((o) => isRespondent(o, role))
  const kpis: Record<OrderRole, Kpi[]> = {
    seller: [
      { label: '待我处理', value: String(mine.filter((o) => o.status === 'pending').length), hint: '含服务商转交', tone: mine.some((o) => o.status === 'pending') ? 'warn' : 'default' },
      { label: '处理中', value: String(n('processing', 'awaitReturn')) },
      { label: '待退款', value: String(n('awaitRefund')), hint: fmtMoney(rows.filter((o) => o.status === 'awaitRefund').reduce((s, o) => s + o.amount, 0)) },
      { label: '平台介入', value: String(n('platform')), tone: n('platform') ? 'warn' : 'default' },
    ],
    buyer: [
      { label: '申请中', value: String(n('pending', 'processing', 'awaitReturn', 'awaitRefund')) },
      { label: '待我退货', value: String(n('awaitReturn')), hint: '需填写退货物流' },
      { label: '已完成', value: String(n('done')), tone: 'good' },
      { label: '已拒绝 / 介入', value: String(n('rejected', 'platform')), tone: n('rejected') ? 'warn' : 'default' },
    ],
    provider: [
      { label: '待我受理', value: String(mine.filter((o) => o.status === 'pending').length), tone: mine.some((o) => o.status === 'pending') ? 'warn' : 'default' },
      { label: '处理中', value: String(n('processing', 'awaitReturn')) },
      { label: '已转交商家', value: String(rows.filter((o) => o.respondent === '商家').length), hint: '由委托商家负责' },
      { label: '本月售后金额', value: fmtMoney(rows.filter((o) => o.createdAt.startsWith('2024-10')).reduce((s, o) => s + o.amount, 0)) },
    ],
  }

  const cols: Column<AfterOrder>[] = [
    { key: 'id', label: '售后单号', width: '128px', render: (o) => <IdCell id={o.id} /> },
    {
      key: 'order',
      label: '关联订单',
      width: '150px',
      render: (o) => (
        <span className="flex items-center gap-1.5">
          <Tag className={bizMeta[o.orderKind === 'rent' ? 'rent' : 'sale'].className}>{o.orderKind === 'rent' ? '租赁' : '销售'}</Tag>
          <span className="font-mono text-xs">{o.orderId}</span>
        </span>
      ),
    },
    { key: 'goods', label: '商品', width: 'minmax(170px,1.2fr)', render: (o) => <GoodsCell name={o.goods.name} spec={o.goods.spec} qty={o.quantity} unit={o.goods.unit} /> },
    { key: 'type', label: '售后类型', width: '84px', render: (o) => <Tag className={afterTypeMeta[o.type].className}>{afterTypeMeta[o.type].label}</Tag> },
    {
      key: 'applicant',
      label: '申请方',
      width: 'minmax(140px,1fr)',
      roles: ['seller', 'provider'],
      render: (o) => <PartyCell name={o.applicant} sub={o.provider ? `代理订单 · ${role === 'seller' ? o.provider : o.seller}` : '自营订单'} subTone={o.provider ? 'primary' : 'muted'} />,
    },
    {
      key: 'respondentParty',
      label: '处理方',
      width: 'minmax(140px,1fr)',
      roles: ['buyer'],
      render: (o) => <PartyCell name={other(o)} sub={o.respondent === '服务商' ? '服务商受理' : '商家受理'} />,
    },
    {
      key: 'reason',
      label: '申请原因',
      width: 'minmax(180px,1.4fr)',
      render: (o) => (
        <span className="line-clamp-2 text-xs leading-4 text-muted-foreground" title={o.reason}>
          {o.reason}
        </span>
      ),
    },
    { key: 'amount', label: '申请金额', width: '92px', align: 'right', render: (o) => <MoneyCell main={o.amount ? fmtMoney(o.amount) : '—'} /> },
    {
      key: 'status',
      label: '状态',
      width: '88px',
      render: (o) => (
        <span className="flex flex-col items-start gap-1">
          <Tag className={afterStatusMeta[o.status].className}>{afterStatusMeta[o.status].label}</Tag>
          {role !== 'buyer' && !isRespondent(o, role) && o.status !== 'done' && o.status !== 'withdrawn' && (
            <span className="text-[11px] text-muted-foreground">{o.respondent}处理中</span>
          )}
        </span>
      ),
    },
    {
      key: 'handler',
      label: '处理人',
      width: '104px',
      roles: ['seller', 'provider'],
      render: (o) => <span className="text-xs text-muted-foreground">{o.handler ?? '待分配'}</span>,
    },
    { key: 'created', label: '申请时间', width: '92px', render: (o) => <Stamp value={o.createdAt} /> },
    {
      key: 'actions',
      label: '操作',
      width: 'minmax(140px,1fr)',
      render: (o) => <ActionCell actions={afterActions(o, role)} onAction={(a) => trigger(o, a)} extra={<ActionLink onClick={() => setDetailId(o.id)}>详情</ActionLink>} />,
    },
  ]

  const detailSections = (o: AfterOrder): DetailSection[] => [
    {
      title: '售后申请',
      rows: [
        ['关联订单', `${o.orderKind === 'rent' ? '租赁订单' : '销售订单'} ${o.orderId}`],
        ['售后类型', afterTypeMeta[o.type].label],
        ['商品', `${o.goods.name} · ${o.quantity.toLocaleString()} ${o.goods.unit}`],
        ['申请金额', o.amount ? fmtMoney(o.amount) : '—'],
        ['申请原因', o.reason],
        ['退货物流', o.returnLogistics ?? '—'],
      ],
    },
    {
      title: '处理',
      rows: [
        ['申请方', o.applicant],
        ['责任处理方', `${o.respondent}${o.respondent === '服务商' ? ` · ${o.provider ?? ''}` : ` · ${o.seller}`}`],
        ['处理人', o.handler ?? '待分配'],
        ['处理结果 / 备注', o.note ?? '—'],
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <RoleBanner role={role} text={afterBanner[role]} />
      <KpiStrip items={kpis[role]} />
      <FilterPanel
        draft={draft}
        onChange={setDraft}
        onSearch={() => {
          setApplied(draft)
          setTypeApplied(typeDraft)
        }}
        onReset={() => {
          setDraft(emptyBaseFilters)
          setApplied(emptyBaseFilters)
          setTypeDraft('')
          setTypeApplied('')
          setStatus('')
        }}
        keywordLabel="单号"
        keywordPlaceholder="售后单号 / 订单号 / 商品"
        partyLabel={role === 'buyer' ? '处理方' : '申请方'}
        partyOptions={parties}
        showSource={role === 'seller'}
        dateLabel="申请时间"
        extra={
          <FilterRow label="售后类型">
            <Select label="售后类型" placeholder="全部" value={typeDraft} options={Object.values(afterTypeMeta).map((m) => m.label)} onChange={setTypeDraft} />
          </FilterRow>
        }
      />
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <StatusTabs order={afterStatusOrder} meta={afterStatusMeta} active={status} countOf={countOf} onSelect={setStatus} ariaLabel="售后状态" right={`共 ${visible.length} 条`} />
        <OrderTable
          columns={visibleColumns(cols, role)}
          rows={visible}
          minWidth="1240px"
          emptyText="没有符合条件的售后单"
          footer={
            <>
              <span>共 {visible.length} 条</span>
              <span>{role === 'buyer' ? '对处理结果有异议可在被拒绝后申请平台介入' : '售后超过 48 小时未响应将由平台提醒'}</span>
            </>
          }
        />
      </div>

      {dialog && dialogRow && (
        <ActionDialog
          key={dialog.action.id + dialogRow.id}
          action={dialog.action}
          summary={
            <Summary>
              <span className="font-mono text-xs text-muted-foreground">{dialogRow.id}</span> · {afterTypeMeta[dialogRow.type].label} · {dialogRow.goods.name}
              {dialogRow.amount ? ` · ${fmtMoney(dialogRow.amount)}` : ''}
            </Summary>
          }
          onClose={() => setDialog(null)}
          onConfirm={(v) => run(dialogRow, dialog.action, v)}
        />
      )}
      {detailRow && (
        <DetailModal
          title={`售后单 ${detailRow.id}`}
          status={<Tag className={afterStatusMeta[detailRow.status].className}>{afterStatusMeta[detailRow.status].label}</Tag>}
          sections={detailSections(detailRow)}
          timeline={detailRow.timeline}
          onClose={() => setDetailId(null)}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}

/* ---------- 入口 ---------- */

export function OrdersPage({ role, kind }: { role: OrderRole; kind: OrdersKind }) {
  if (kind === 'rent') return <RentOrders key={role} role={role} />
  if (kind === 'sale') return <SaleOrders key={role} role={role} />
  return <AfterOrders key={role} role={role} />
}

export const demoAccounts = DEMO
