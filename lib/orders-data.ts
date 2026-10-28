import type { BizType } from '@/components/goods-list'

/** 原型固定「今天」，用于计算逾期与剩余租期 */
export const TODAY = '2024-10-28'

/** 三个演示账号。同一笔订单会同时出现在相关角色的列表中，只是视角与可用操作不同 */
export const DEMO = {
  seller: '演示商户（上海）有限公司',
  buyer: '演示集团股份有限公司',
  provider: '演示资产服务有限公司',
} as const

export type OrderRole = 'seller' | 'buyer' | 'provider'
export type Actor = '商家' | '买/租方' | '服务商' | '系统' | '平台'

export const actorOf: Record<OrderRole, Actor> = { seller: '商家', buyer: '买/租方', provider: '服务商' }

export type TimelineItem = { at: string; label: string; by: Actor; note?: string }

export type OrderGoods = { code: string; name: string; spec: string; unit: string }

/** 先款后货：对账 → 付款 → 发货；货到付款：发货 → 收货(验收) → 对账 → 付款 */
export type PayTerm = '先款后货' | '货到付款'
/** 对账状态：待对账 / 已对账 / 免对账（跳过对账直接付款）；未到对账环节时为空 */
export type ReconcileState = '待对账' | '已对账' | '免对账'

type OrderBase = {
  id: string
  goods: OrderGoods
  quantity: number
  seller: string
  buyer: string
  /** 服务商代理成交时存在；为空表示商家自营 */
  provider?: string
  /** 代理成交时商家给服务商的底价 */
  basePrice?: number
  /** 对买/租方的成交单价 */
  unitPrice: number
  payTerm: PayTerm
  reconcile?: ReconcileState
  /** 已发送的对账单金额 */
  statementAmount?: number
  contractNo?: string
  remark?: string
  createdAt: string
  updatedAt: string
  timeline: TimelineItem[]
}

export type RentStatus = 'toReconcile' | 'unpaid' | 'toShip' | 'shipped' | 'renting' | 'returning' | 'checking' | 'done' | 'cancelled'

export type RentOrder = OrderBase & {
  kind: 'rent'
  status: RentStatus
  /** 押金单价（元/单位） */
  deposit: number
  startDate: string
  dueDate: string
  returnDate?: string
  address: string
  logistics?: string
  /** 验收时的损耗扣款 */
  deduction?: number
}

export type SaleStatus = 'negotiating' | 'toReconcile' | 'unpaid' | 'toShip' | 'shipped' | 'done' | 'afterSale' | 'cancelled'
export type PayMethod = '对公转账' | '在线支付' | '账期结算'
export type InvoiceState = '已开票' | '待开票' | '不开票'

export type SaleOrder = OrderBase & {
  kind: 'sale'
  status: SaleStatus
  freight: number
  address: string
  /** 商家所属店铺 */
  shop: string
  /** 物流单号 */
  logistics?: string
  /** 自提时的提货单号 */
  pickupNo?: string
  /** 买方议价出价 */
  bidPrice?: number
  payMethod: PayMethod
  invoice: InvoiceState
}

export type AfterType = 'refund' | 'return' | 'exchange' | 'repair' | 'deposit'
export type AfterStatus = 'pending' | 'processing' | 'awaitReturn' | 'awaitRefund' | 'done' | 'rejected' | 'withdrawn' | 'platform'
export type Respondent = '商家' | '服务商'

export type AfterOrder = {
  id: string
  orderId: string
  orderKind: BizType
  goods: OrderGoods
  quantity: number
  type: AfterType
  reason: string
  amount: number
  status: AfterStatus
  applicant: string
  /** 当前负责处理的一方：代理订单默认由服务商受理，可转交商家 */
  respondent: Respondent
  seller: string
  buyer: string
  provider?: string
  handler?: string
  note?: string
  returnLogistics?: string
  createdAt: string
  updatedAt: string
  timeline: TimelineItem[]
}

/* ---------- 状态与类型字典 ---------- */

type Meta = { label: string; className: string }

const amber = 'bg-amber-50 text-amber-700 ring-amber-200'
const blue = 'bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30'
const sky = 'bg-sky-50 text-sky-700 ring-sky-200'
const green = 'bg-emerald-50 text-emerald-700 ring-emerald-200'
const violet = 'bg-violet-50 text-violet-700 ring-violet-200'
const orange = 'bg-orange-50 text-orange-700 ring-orange-200'
const gray = 'bg-muted text-muted-foreground ring-border'
const red = 'bg-red-50 text-red-700 ring-red-200'
const rose = 'bg-rose-50 text-rose-700 ring-rose-200'

const teal = 'bg-teal-50 text-teal-700 ring-teal-200'

export const payTermOptions: PayTerm[] = ['先款后货', '货到付款']

export const rentStatusOrder: RentStatus[] = ['toReconcile', 'unpaid', 'toShip', 'shipped', 'renting', 'returning', 'checking', 'done', 'cancelled']
export const rentStatusMeta: Record<RentStatus, Meta> = {
  toReconcile: { label: '待对账', className: teal },
  unpaid: { label: '待付款', className: amber },
  toShip: { label: '待发货', className: blue },
  shipped: { label: '待收货', className: sky },
  renting: { label: '租赁中', className: green },
  returning: { label: '归还中', className: violet },
  checking: { label: '待验收', className: orange },
  done: { label: '已完成', className: gray },
  cancelled: { label: '已取消', className: gray },
}

export const saleStatusOrder: SaleStatus[] = ['negotiating', 'toReconcile', 'unpaid', 'toShip', 'shipped', 'done', 'afterSale', 'cancelled']
export const saleStatusMeta: Record<SaleStatus, Meta> = {
  negotiating: { label: '议价中', className: 'bg-violet-50 text-violet-700 ring-violet-200' },
  toReconcile: { label: '待对账', className: teal },
  unpaid: { label: '待付款', className: amber },
  toShip: { label: '待发货', className: blue },
  shipped: { label: '待收货', className: sky },
  done: { label: '已完成', className: green },
  afterSale: { label: '售后中', className: rose },
  cancelled: { label: '已取消', className: gray },
}

export const afterStatusOrder: AfterStatus[] = ['pending', 'processing', 'awaitReturn', 'awaitRefund', 'done', 'rejected', 'platform', 'withdrawn']
export const afterStatusMeta: Record<AfterStatus, Meta> = {
  pending: { label: '待处理', className: amber },
  processing: { label: '处理中', className: blue },
  awaitReturn: { label: '待退货', className: violet },
  awaitRefund: { label: '待退款', className: orange },
  done: { label: '已完成', className: green },
  rejected: { label: '已拒绝', className: red },
  platform: { label: '平台介入', className: rose },
  withdrawn: { label: '已撤销', className: gray },
}

export const afterTypeMeta: Record<AfterType, Meta> = {
  refund: { label: '退款', className: orange },
  return: { label: '退货退款', className: violet },
  exchange: { label: '换货', className: sky },
  repair: { label: '维修', className: blue },
  deposit: { label: '押金争议', className: rose },
}

/* ---------- 计算工具 ---------- */

const DAY = 86_400_000

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY)
}

/** 计费租期：已归还按实际归还日，否则按约定到期日 */
export function rentDays(o: RentOrder) {
  return Math.max(1, daysBetween(o.startDate, o.returnDate ?? o.dueDate))
}

export function rentAmount(o: RentOrder) {
  return o.unitPrice * o.quantity * rentDays(o)
}

export function depositTotal(o: RentOrder) {
  return o.deposit * o.quantity
}

/** 逾期天数：租赁中 / 归还中且已过约定到期日 */
export function overdueDays(o: RentOrder) {
  if (o.status !== 'renting' && o.status !== 'returning') return 0
  return Math.max(0, daysBetween(o.dueDate, TODAY))
}

export function saleAmount(o: SaleOrder) {
  return o.unitPrice * o.quantity + o.freight
}

/** 服务商代理收益 = (对外价 - 底价) × 数量 (× 租期) */
export function providerGain(o: RentOrder | SaleOrder) {
  if (!o.basePrice) return 0
  const diff = o.unitPrice - o.basePrice
  return o.kind === 'rent' ? diff * o.quantity * rentDays(o) : diff * o.quantity
}

/** 应结算总额：租赁为租金 + 押金 − 损耗；销售为货款 + 运费 */
export function settleAmount(o: RentOrder | SaleOrder) {
  if (o.kind === 'sale') return saleAmount(o)
  return o.payTerm === '先款后货' ? rentAmount(o) + depositTotal(o) : rentAmount(o) - (o.deduction ?? 0)
}

/** 付款完成后的下一状态 */
export function afterPaid<T extends RentOrder | SaleOrder>(o: T): T['status'] {
  return o.payTerm === '先款后货' ? 'toShip' : 'done'
}

/** 货到付款订单在交付(验收)完成后进入对账；先款后货直接完成 */
export function afterDelivered<T extends RentOrder | SaleOrder>(o: T): T['status'] {
  return o.payTerm === '货到付款' ? 'toReconcile' : 'done'
}

export function fmtMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
}

export function ownsOrder(o: { seller: string; buyer: string; provider?: string }, role: OrderRole) {
  if (role === 'seller') return o.seller === DEMO.seller
  if (role === 'buyer') return o.buyer === DEMO.buyer
  return o.provider === DEMO.provider
}

/* ---------- 示例商品 ---------- */

const G = {
  support: { code: 'G2024010001', name: '钢支撑 Φ609×16', spec: 'Q235B / 6m 标准节', unit: '吨' },
  hBeam: { code: 'G2024020002', name: 'H 型钢 400×200', spec: 'Q355B / 12m', unit: '吨' },
  scaffold: { code: 'G2024040003', name: '盘扣式脚手架 横杆 1.2m', spec: 'Q355 / 热镀锌', unit: '根' },
  fence: { code: 'G2024060004', name: '装配式围挡 2.5m', spec: '彩钢板 / 含立柱', unit: '片' },
  box: { code: 'G2024070006', name: '打包箱式活动房 3×6m', spec: '标准箱 / 含门窗', unit: '个' },
  formwork: { code: 'G2024080105', name: '组合式钢模板 300×1500 平模', spec: 'Q235 / 5mm 面板', unit: '块' },
  hoist: { code: 'G2024090011', name: '施工升降机 SC200/200', spec: '双笼 / 2t×2', unit: '台' },
} satisfies Record<string, OrderGoods>

const P = {
  crec12: '中铁十二局集团华东建设有限公司',
  scg4: '上海建工四建集团有限公司',
  cscec8: '中建八局第二建设有限公司',
  hengchang: '苏州恒昌建筑器材租赁有限公司',
  dingli: '南京鼎立模块化建筑有限公司',
  zhongxin: '浙江中欣机械租赁有限公司',
}

const ADDR = {
  shanghai: '上海市浦东新区临港新片区 两港大道 1588 号 项目部',
  suzhou: '江苏省苏州市工业园区 星湖街 328 号 施工现场',
  hangzhou: '浙江省杭州市萧山区 机场高速 K12 项目部',
  nanjing: '江苏省南京市江北新区 浦珠北路 商业综合体工地',
}

/* ---------- 租赁订单 ---------- */

export const rentOrdersData: RentOrder[] = [
  {
    kind: 'rent',
    id: 'RO2024102101',
    status: 'renting',
    payTerm: '先款后货',
    reconcile: '已对账',
    goods: G.support,
    quantity: 60,
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.crec12,
    basePrice: 10,
    unitPrice: 11.5,
    deposit: 3000,
    startDate: '2024-09-25',
    dueDate: '2025-03-23',
    address: ADDR.suzhou,
    logistics: '沪A·D1286 / 王师傅 138****2210',
    contractNo: 'HT-2024-0925-01',
    createdAt: '2024-09-20 10:12',
    updatedAt: '2024-09-25 15:30',
    timeline: [
      { at: '2024-09-20 10:12', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-09-20 16:40', label: '支付首期租金与押金', by: '买/租方' },
      { at: '2024-09-22 09:05', label: '服务商通知商家发货', by: '服务商' },
      { at: '2024-09-23 08:30', label: '商家发货', by: '商家', note: '沪A·D1286，2 车' },
      { at: '2024-09-25 15:30', label: '买/租方确认收货，开始计租', by: '买/租方' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024102302',
    status: 'toShip',
    payTerm: '先款后货',
    reconcile: '免对账',
    goods: G.scaffold,
    quantity: 8000,
    seller: P.hengchang,
    provider: DEMO.provider,
    buyer: DEMO.buyer,
    basePrice: 0.02,
    unitPrice: 0.024,
    deposit: 25,
    startDate: '2024-10-30',
    dueDate: '2025-04-27',
    address: ADDR.shanghai,
    contractNo: 'HT-2024-1023-07',
    createdAt: '2024-10-23 14:20',
    updatedAt: '2024-10-24 09:10',
    timeline: [
      { at: '2024-10-23 14:20', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-10-24 09:10', label: '支付首期租金与押金', by: '买/租方' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024101803',
    status: 'shipped',
    payTerm: '先款后货',
    reconcile: '已对账',
    goods: G.hBeam,
    quantity: 40,
    seller: DEMO.seller,
    buyer: DEMO.buyer,
    unitPrice: 9,
    deposit: 2500,
    startDate: '2024-10-30',
    dueDate: '2025-01-27',
    address: ADDR.shanghai,
    logistics: '沪B·K7721 / 李师傅 139****0876',
    contractNo: 'HT-2024-1018-03',
    createdAt: '2024-10-18 11:05',
    updatedAt: '2024-10-27 17:20',
    timeline: [
      { at: '2024-10-18 11:05', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-10-19 10:00', label: '支付首期租金与押金', by: '买/租方' },
      { at: '2024-10-27 17:20', label: '商家发货', by: '商家', note: '沪B·K7721，预计 10-30 到场' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024092004',
    status: 'renting',
    payTerm: '先款后货',
    reconcile: '免对账',
    goods: G.box,
    quantity: 12,
    seller: P.dingli,
    buyer: DEMO.buyer,
    unitPrice: 32,
    deposit: 5000,
    startDate: '2024-09-22',
    dueDate: '2025-03-21',
    address: ADDR.nanjing,
    contractNo: 'HT-2024-0920-11',
    createdAt: '2024-09-15 09:40',
    updatedAt: '2024-09-22 11:00',
    timeline: [
      { at: '2024-09-15 09:40', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-09-16 15:00', label: '支付首期租金与押金', by: '买/租方' },
      { at: '2024-09-20 08:00', label: '商家发货', by: '商家' },
      { at: '2024-09-22 11:00', label: '买/租方确认收货，开始计租', by: '买/租方' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024081505',
    status: 'returning',
    payTerm: '货到付款',
    goods: G.fence,
    quantity: 300,
    seller: DEMO.seller,
    buyer: P.scg4,
    unitPrice: 0.6,
    deposit: 150,
    startDate: '2024-08-18',
    dueDate: '2024-10-17',
    address: ADDR.hangzhou,
    contractNo: 'HT-2024-0815-02',
    createdAt: '2024-08-15 16:30',
    updatedAt: '2024-10-26 10:40',
    timeline: [
      { at: '2024-08-15 16:30', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-08-16 09:00', label: '商家发货', by: '商家' },
      { at: '2024-08-18 10:20', label: '买/租方确认收货，开始计租', by: '买/租方' },
      { at: '2024-10-17 00:00', label: '超过约定到期日，进入逾期', by: '系统' },
      { at: '2024-10-26 10:40', label: '买/租方申请归还', by: '买/租方', note: '预计 10-30 分两车送回' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024070106',
    status: 'checking',
    payTerm: '货到付款',
    goods: G.formwork,
    quantity: 600,
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.cscec8,
    basePrice: 0.35,
    unitPrice: 0.42,
    deposit: 150,
    startDate: '2024-07-05',
    dueDate: '2024-10-03',
    returnDate: '2024-10-04',
    address: ADDR.nanjing,
    contractNo: 'HT-2024-0701-05',
    createdAt: '2024-07-01 10:00',
    updatedAt: '2024-10-05 09:30',
    timeline: [
      { at: '2024-07-01 10:00', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-07-05 14:00', label: '买/租方确认收货，开始计租', by: '买/租方' },
      { at: '2024-10-01 09:00', label: '买/租方申请归还', by: '买/租方' },
      { at: '2024-10-05 09:30', label: '服务商确认收回，待验收', by: '服务商' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024050107',
    status: 'done',
    payTerm: '先款后货',
    reconcile: '已对账',
    goods: G.support,
    quantity: 30,
    seller: DEMO.seller,
    buyer: DEMO.buyer,
    unitPrice: 9.5,
    deposit: 3000,
    startDate: '2024-05-06',
    dueDate: '2024-08-04',
    returnDate: '2024-08-03',
    deduction: 4500,
    address: ADDR.shanghai,
    contractNo: 'HT-2024-0501-09',
    createdAt: '2024-05-01 09:20',
    updatedAt: '2024-08-06 16:00',
    timeline: [
      { at: '2024-05-01 09:20', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-05-06 10:30', label: '买/租方确认收货，开始计租', by: '买/租方' },
      { at: '2024-08-03 15:00', label: '商家确认收回', by: '商家' },
      { at: '2024-08-06 16:00', label: '验收完成，扣除损耗 ¥4,500 后退还押金', by: '商家' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024102708',
    status: 'toReconcile',
    payTerm: '先款后货',
    reconcile: '待对账',
    goods: G.hoist,
    quantity: 2,
    seller: P.zhongxin,
    buyer: DEMO.buyer,
    unitPrice: 850,
    deposit: 80000,
    startDate: '2024-11-05',
    dueDate: '2025-05-04',
    address: ADDR.shanghai,
    createdAt: '2024-10-27 15:45',
    updatedAt: '2024-10-27 15:45',
    timeline: [{ at: '2024-10-27 15:45', label: '买/租方提交订单，待对账', by: '买/租方' }],
  },
  {
    kind: 'rent',
    id: 'RO2024101009',
    status: 'cancelled',
    payTerm: '先款后货',
    goods: G.hBeam,
    quantity: 25,
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.scg4,
    basePrice: 8.5,
    unitPrice: 9.8,
    deposit: 2500,
    startDate: '2024-10-12',
    dueDate: '2025-01-10',
    address: ADDR.hangzhou,
    createdAt: '2024-10-10 09:00',
    updatedAt: '2024-10-11 18:00',
    timeline: [
      { at: '2024-10-10 09:00', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-10-11 18:00', label: '买/租方取消订单', by: '买/租方', note: '项目延期' },
    ],
  },
  {
    kind: 'rent',
    id: 'RO2024102610',
    status: 'toShip',
    payTerm: '货到付款',
    goods: G.scaffold,
    quantity: 5000,
    seller: DEMO.seller,
    buyer: P.crec12,
    unitPrice: 0.022,
    deposit: 25,
    startDate: '2024-11-01',
    dueDate: '2025-02-28',
    address: ADDR.suzhou,
    contractNo: 'HT-2024-1026-12',
    createdAt: '2024-10-26 13:10',
    updatedAt: '2024-10-26 17:45',
    timeline: [
      { at: '2024-10-26 13:10', label: '买/租方提交订单', by: '买/租方' },
      { at: '2024-10-26 17:45', label: '商家确认订单，货到付款', by: '商家' },
    ],
  },
]

/* ---------- 销售订单 ---------- */

export const saleOrdersData: SaleOrder[] = [
  {
    kind: 'sale',
    id: 'SO2024102809',
    status: 'negotiating',
    payTerm: '货到付款',
    shop: '苏州分公司模板租赁店',
    goods: G.formwork,
    quantity: 600,
    seller: DEMO.seller,
    buyer: DEMO.buyer,
    unitPrice: 186,
    bidPrice: 172,
    freight: 1800,
    address: ADDR.shanghai,
    payMethod: '对公转账',
    invoice: '待开票',
    createdAt: '2024-10-28 10:12',
    updatedAt: '2024-10-28 10:12',
    timeline: [
      { at: '2024-10-28 10:12', label: '买方提交订单并出价 ¥172/块', by: '买/租方' },
    ],
  },
  {
    kind: 'sale',
    id: 'SO2024102201',
    shop: '华东建设工程有限公司周转材料店',
    status: 'shipped',
    payTerm: '货到付款',
    goods: G.formwork,
    quantity: 400,
    seller: P.hengchang,
    provider: DEMO.provider,
    buyer: DEMO.buyer,
    basePrice: 175,
    unitPrice: 196,
    freight: 1800,
    address: ADDR.shanghai,
    logistics: '德邦物流 DP88120935',
    payMethod: '对公转账',
    invoice: '待开票',
    contractNo: 'MM-2024-1022-04',
    createdAt: '2024-10-22 10:30',
    updatedAt: '2024-10-25 14:00',
    timeline: [
      { at: '2024-10-22 10:30', label: '买方提交订单', by: '买/租方' },
      { at: '2024-10-23 09:20', label: '服务商确认订单，货到付款', by: '服务商' },
      { at: '2024-10-25 14:00', label: '商家发货', by: '商家', note: '德邦物流 DP88120935' },
    ],
  },
  {
    kind: 'sale',
    id: 'SO2024102502',
    shop: '苏州分公司模板租赁店',
    status: 'toShip',
    payTerm: '先款后货',
    reconcile: '已对账',
    goods: G.hBeam,
    quantity: 20,
    seller: DEMO.seller,
    buyer: DEMO.buyer,
    unitPrice: 4100,
    freight: 0,
    address: '买方自提 · 上海市宝山区 月罗公路 仓库',
    payMethod: '在线支付',
    invoice: '待开票',
    contractNo: 'MM-2024-1025-02',
    createdAt: '2024-10-25 16:10',
    updatedAt: '2024-10-25 16:15',
    timeline: [
      { at: '2024-10-25 16:10', label: '买方提交订单', by: '买/租方' },
      { at: '2024-10-25 16:15', label: '在线支付成功', by: '买/租方' },
    ],
  },
  {
    kind: 'sale',
    id: 'SO2024092003',
    shop: '华东建设工程有限公司周转材料店',
    status: 'done',
    payTerm: '货到付款',
    reconcile: '已对账',
    goods: G.fence,
    quantity: 200,
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.cscec8,
    basePrice: 320,
    unitPrice: 365,
    freight: 1200,
    address: ADDR.nanjing,
    logistics: '安能物流 AN20240921887',
    payMethod: '对公转账',
    invoice: '已开票',
    contractNo: 'MM-2024-0920-06',
    createdAt: '2024-09-20 09:00',
    updatedAt: '2024-09-26 11:30',
    timeline: [
      { at: '2024-09-20 09:00', label: '买方提交订单', by: '买/租方' },
      { at: '2024-09-21 10:00', label: '服务商确认订单，货到付款', by: '服务商' },
      { at: '2024-09-21 15:30', label: '商家发货', by: '商家' },
      { at: '2024-09-24 10:00', label: '买方确认收货', by: '买/租方' },
      { at: '2024-09-26 11:30', label: '商家开具发票', by: '商家' },
    ],
  },
  {
    kind: 'sale',
    id: 'SO2024102704',
    shop: '杭州分公司脚手架专营店',
    status: 'unpaid',
    payTerm: '先款后货',
    reconcile: '免对账',
    goods: G.box,
    quantity: 4,
    seller: P.dingli,
    buyer: DEMO.buyer,
    unitPrice: 15800,
    freight: 3200,
    address: ADDR.shanghai,
    payMethod: '对公转账',
    invoice: '待开票',
    createdAt: '2024-10-27 11:20',
    updatedAt: '2024-10-27 11:20',
    timeline: [{ at: '2024-10-27 11:20', label: '买方提交订单，待付款', by: '买/租方' }],
  },
  {
    kind: 'sale',
    id: 'SO2024101505',
    shop: '华东建设工程有限公司周转材料店',
    status: 'done',
    payTerm: '货到付款',
    reconcile: '已对账',
    goods: G.support,
    quantity: 15,
    seller: DEMO.seller,
    buyer: P.crec12,
    unitPrice: 4300,
    freight: 0,
    address: ADDR.suzhou,
    pickupNo: 'TH20241016001',
    payMethod: '账期结算',
    invoice: '待开票',
    contractNo: 'MM-2024-1015-01',
    createdAt: '2024-10-15 10:00',
    updatedAt: '2024-10-19 09:30',
    timeline: [
      { at: '2024-10-15 10:00', label: '买方提交订单（账期结算）', by: '买/租方' },
      { at: '2024-10-16 08:30', label: '商家发货', by: '商家' },
      { at: '2024-10-19 09:30', label: '买方确认收货', by: '买/租方' },
    ],
  },
  {
    kind: 'sale',
    id: 'SO2024100806',
    shop: '苏州分公司模板租赁店',
    status: 'afterSale',
    payTerm: '先款后货',
    reconcile: '已对账',
    goods: G.scaffold,
    quantity: 12000,
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.scg4,
    basePrice: 6.8,
    unitPrice: 7.5,
    freight: 2600,
    address: ADDR.hangzhou,
    logistics: '跨越速运 KY1008223',
    payMethod: '对公转账',
    invoice: '待开票',
    contractNo: 'MM-2024-1008-03',
    createdAt: '2024-10-08 09:30',
    updatedAt: '2024-10-26 15:00',
    timeline: [
      { at: '2024-10-08 09:30', label: '买方提交订单', by: '买/租方' },
      { at: '2024-10-09 10:00', label: '商家确认订单，货到付款', by: '商家' },
      { at: '2024-10-10 14:00', label: '商家发货', by: '商家' },
      { at: '2024-10-14 09:00', label: '买方确认收货', by: '买/租方' },
      { at: '2024-10-26 15:00', label: '买方申请售后（退货退款）', by: '买/租方' },
    ],
  },
  {
    kind: 'sale',
    id: 'SO2024102807',
    shop: '华东建设工程有限公司周转材料店',
    status: 'toReconcile',
    payTerm: '先款后货',
    reconcile: '待对账',
    goods: G.formwork,
    quantity: 150,
    seller: DEMO.seller,
    buyer: DEMO.buyer,
    unitPrice: 186,
    freight: 600,
    address: ADDR.shanghai,
    payMethod: '在线支付',
    invoice: '待开票',
    createdAt: '2024-10-28 08:30',
    updatedAt: '2024-10-28 08:30',
    timeline: [{ at: '2024-10-28 08:30', label: '买方提交订单，待对账', by: '买/租方' }],
  },
  {
    kind: 'sale',
    id: 'SO2024093008',
    shop: '杭州分公司脚手架专营店',
    status: 'cancelled',
    payTerm: '先款后货',
    goods: G.fence,
    quantity: 80,
    seller: DEMO.seller,
    buyer: DEMO.buyer,
    unitPrice: 330,
    freight: 500,
    address: ADDR.shanghai,
    payMethod: '对公转账',
    invoice: '不开票',
    createdAt: '2024-09-30 10:00',
    updatedAt: '2024-10-02 09:00',
    timeline: [
      { at: '2024-09-30 10:00', label: '买方提交订单', by: '买/租方' },
      { at: '2024-10-02 09:00', label: '买方取消订单', by: '买/租方', note: '改为租赁' },
    ],
  },
]

/* ---------- 售后单 ---------- */

export const afterOrdersData: AfterOrder[] = [
  {
    id: 'AS2024102601',
    orderId: 'SO2024100806',
    orderKind: 'sale',
    goods: G.scaffold,
    quantity: 300,
    type: 'return',
    reason: '到货后抽检发现 300 根横杆焊缝开裂，不符合 Q355 验收标准，申请退货退款。',
    amount: 2250,
    status: 'pending',
    applicant: P.scg4,
    respondent: '服务商',
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.scg4,
    createdAt: '2024-10-26 15:00',
    updatedAt: '2024-10-26 15:00',
    timeline: [{ at: '2024-10-26 15:00', label: '买方提交售后申请', by: '买/租方' }],
  },
  {
    id: 'AS2024102002',
    orderId: 'RO2024050107',
    orderKind: 'rent',
    goods: G.support,
    quantity: 30,
    type: 'deposit',
    reason: '归还验收扣除损耗 ¥4,500，我方认为属于正常使用磨损，申请复核并退回扣款。',
    amount: 4500,
    status: 'processing',
    applicant: DEMO.buyer,
    respondent: '商家',
    seller: DEMO.seller,
    buyer: DEMO.buyer,
    handler: '商家 · 王经理',
    createdAt: '2024-10-20 10:30',
    updatedAt: '2024-10-22 09:15',
    timeline: [
      { at: '2024-10-20 10:30', label: '买/租方提交押金争议', by: '买/租方' },
      { at: '2024-10-22 09:15', label: '商家受理，安排复核验收记录', by: '商家', note: '已调取 08-06 验收照片' },
    ],
  },
  {
    id: 'AS2024101803',
    orderId: 'SO2024092003',
    orderKind: 'sale',
    goods: G.fence,
    quantity: 12,
    type: 'exchange',
    reason: '12 片彩钢板在运输中被压变形，无法安装，申请换货。',
    amount: 0,
    status: 'awaitReturn',
    applicant: P.cscec8,
    respondent: '服务商',
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.cscec8,
    handler: '服务商 · 李工',
    createdAt: '2024-10-18 14:00',
    updatedAt: '2024-10-19 10:00',
    timeline: [
      { at: '2024-10-18 14:00', label: '买方提交换货申请', by: '买/租方' },
      { at: '2024-10-19 10:00', label: '服务商同意换货，等待买方寄回', by: '服务商' },
    ],
  },
  {
    id: 'AS2024101204',
    orderId: 'RO2024092004',
    orderKind: 'rent',
    goods: G.box,
    quantity: 2,
    type: 'repair',
    reason: '2 个箱体门锁损坏无法闭合，申请上门维修。',
    amount: 0,
    status: 'done',
    applicant: DEMO.buyer,
    respondent: '商家',
    seller: P.dingli,
    buyer: DEMO.buyer,
    handler: '商家 · 张工',
    note: '10-15 上门更换门锁 2 套',
    createdAt: '2024-10-12 09:00',
    updatedAt: '2024-10-15 17:30',
    timeline: [
      { at: '2024-10-12 09:00', label: '买/租方提交维修申请', by: '买/租方' },
      { at: '2024-10-12 11:20', label: '商家受理，安排上门', by: '商家' },
      { at: '2024-10-15 17:30', label: '维修完成，买/租方确认', by: '买/租方' },
    ],
  },
  {
    id: 'AS2024100905',
    orderId: 'SO2024101505',
    orderKind: 'sale',
    goods: G.support,
    quantity: 0.4,
    type: 'refund',
    reason: '过磅实际到货 14.6 吨，较订单少 0.4 吨，申请退还差价。',
    amount: 1720,
    status: 'awaitRefund',
    applicant: P.crec12,
    respondent: '商家',
    seller: DEMO.seller,
    buyer: P.crec12,
    handler: '商家 · 财务部',
    createdAt: '2024-10-20 16:00',
    updatedAt: '2024-10-21 10:00',
    timeline: [
      { at: '2024-10-20 16:00', label: '买方提交退款申请', by: '买/租方', note: '附过磅单' },
      { at: '2024-10-21 10:00', label: '商家同意退款 ¥1,720', by: '商家' },
    ],
  },
  {
    id: 'AS2024092806',
    orderId: 'SO2024102201',
    orderKind: 'sale',
    goods: G.formwork,
    quantity: 400,
    type: 'refund',
    reason: '运费与报价单不符，多收 ¥600，申请退回差额。',
    amount: 600,
    status: 'rejected',
    applicant: DEMO.buyer,
    respondent: '服务商',
    seller: P.hengchang,
    provider: DEMO.provider,
    buyer: DEMO.buyer,
    handler: '服务商 · 客服部',
    note: '运费按实际里程结算，已提供运单及计费明细',
    createdAt: '2024-10-25 18:00',
    updatedAt: '2024-10-26 09:40',
    timeline: [
      { at: '2024-10-25 18:00', label: '买方提交退款申请', by: '买/租方' },
      { at: '2024-10-26 09:40', label: '服务商拒绝申请', by: '服务商', note: '运费按实际里程结算' },
    ],
  },
  {
    id: 'AS2024102707',
    orderId: 'RO2024102101',
    orderKind: 'rent',
    goods: G.support,
    quantity: 5,
    type: 'exchange',
    reason: '5 吨钢支撑法兰盘螺栓孔位偏差，无法与现场既有节段对接，申请调换。',
    amount: 0,
    status: 'pending',
    applicant: P.crec12,
    respondent: '服务商',
    seller: DEMO.seller,
    provider: DEMO.provider,
    buyer: P.crec12,
    createdAt: '2024-10-27 09:30',
    updatedAt: '2024-10-27 09:30',
    timeline: [{ at: '2024-10-27 09:30', label: '买/租方提交换货申请', by: '买/租方' }],
  },
  {
    id: 'AS2024101808',
    orderId: 'RO2024081505',
    orderKind: 'rent',
    goods: G.fence,
    quantity: 300,
    type: 'deposit',
    reason: '因台风停工导致归还延迟，申请减免逾期期间租金并全额退还押金。',
    amount: 1980,
    status: 'platform',
    applicant: P.scg4,
    respondent: '商家',
    seller: DEMO.seller,
    buyer: P.scg4,
    handler: '平台 · 客服专员',
    createdAt: '2024-10-18 11:00',
    updatedAt: '2024-10-24 14:20',
    timeline: [
      { at: '2024-10-18 11:00', label: '买/租方提交押金争议', by: '买/租方' },
      { at: '2024-10-21 09:00', label: '商家拒绝减免', by: '商家', note: '合同未约定不可抗力免租' },
      { at: '2024-10-24 14:20', label: '买/租方申请平台介入', by: '买/租方' },
    ],
  },
]
