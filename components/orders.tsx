"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { ActionLink, bizMeta } from "@/components/goods-list";
import { Select } from "@/components/shop-form-fields";
import { SaleDetailModal } from "@/components/sale-order-detail";
import { SaleContractPage } from "@/components/sale-contract-page";
import { SaleReconcilePage } from "@/components/sale-reconcile-page";
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
  nowStamp,
} from "@/components/orders-shared";
import {
  DEMO,
  TODAY,
  actorOf,
  afterDelivered,
  afterOrdersData,
  afterPaid,
  afterStatusMeta,
  afterStatusOrder,
  afterTypeMeta,
  depositTotal,
  fmtMoney,
  overdueDays,
  ownsOrder,
  payTermOptions,
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
  settleAmount,
  type AfterOrder,
  type AfterStatus,
  type OrderRole,
  type RentOrder,
  type RentStatus,
  type SaleOrder,
  type SaleStatus,
  type Statement,
  type StatementState,
} from "@/lib/orders-data";

export type OrdersKind = "rent" | "sale" | "after";

/* ---------- 通用列表状态 ---------- */

type Listed = {
  id: string;
  updatedAt: string;
  timeline: { at: string; label: string; by: string }[];
};

function useOrderList<T extends Listed>(initial: T[]) {
  const [rows, setRows] = useState<T[]>(initial);
  const [dialog, setDialog] = useState<{
    id: string;
    action: ActionDef<T>;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const run = (
    row: T,
    action: ActionDef<T>,
    values: Record<string, string> = {},
  ) => {
    const next = action.apply(row, values);
    setRows((list) => list.map((r) => (r.id === row.id ? next : r)));
    setDialog(null);
    setToast(action.toast(next, values));
    window.setTimeout(() => setToast(null), 2600);
  };
  const trigger = (row: T, action: ActionDef<T>) => {
    if (action.instant) run(row, action);
    else setDialog({ id: row.id, action });
  };
  const commit = (next: T, message: string) => {
    setRows((list) => list.map((r) => (r.id === next.id ? next : r)));
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };
  const dialogRow = dialog ? rows.find((r) => r.id === dialog.id) : undefined;
  const detailRow = detailId ? rows.find((r) => r.id === detailId) : undefined;
  return {
    rows,
    dialog,
    dialogRow,
    detailRow,
    toast,
    run,
    trigger,
    commit,
    setDialog,
    setDetailId,
  };
}

function inRange(date: string, from: string, to: string) {
  const d = date.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function sourceOf(o: { provider?: string }) {
  return o.provider ? "服务商代理" : "自营";
}

/** 对手方：商家 / 服务商看承租(购买)方，买/租方看出租(出售)方 */
function counterpart(
  o: { seller: string; buyer: string; provider?: string },
  role: OrderRole,
) {
  return role === "buyer" ? (o.provider ?? o.seller) : o.buyer;
}

function SettleCell({ o }: { o: RentOrder | SaleOrder }) {
  return (
    <span className="flex flex-col text-xs">
      <span>{o.payTerm}</span>
      <span
        className={
          o.reconcile === "待对账" ? "text-teal-700" : "text-muted-foreground"
        }
      >
        {o.reconcile ?? "—"}
      </span>
    </span>
  );
}

/** 对账与付款环节：先款后货在下单后、货到付款在交付后进入；买/租方可对账后付款，也可跳过对账直接付款 */
function replyStatement(
  x: RentOrder | SaleOrder,
  state: StatementState,
  reply?: string,
): { statements?: Statement[] } {
  if (x.kind !== "sale" || !x.statements?.length) return {};
  const list = x.statements;
  const last = list[list.length - 1];
  return {
    statements: [
      ...list.slice(0, -1),
      { ...last, state, repliedAt: nowStamp(), reply: reply || undefined },
    ],
  };
}

function settleActions<T extends RentOrder | SaleOrder>(
  o: T,
  role: OrderRole,
): ActionDef<T>[] {
  const by = actorOf[role];
  const list: ActionDef<T>[] = [];
  const amount = settleAmount(o);
  const payLabel =
    o.kind === "rent"
      ? o.payTerm === "先款后货"
        ? "支付租金与押金"
        : "支付租金"
      : "支付货款";

  if (o.status === "toReconcile") {
    if (role === "buyer") {
      list.push({
        id: "reconcile",
        group: "对账",
        label: "确认对账",
        title: "确认对账",
        fields: [{ key: "note", label: "对账说明" }],
        apply: (x, v) =>
          withEvent(
            {
              ...x,
              status: "unpaid",
              reconcile: "已对账",
              ...replyStatement(x, "已确认", v.note),
            },
            `买/租方确认对账 ${fmtMoney(x.statementAmount ?? amount)}`,
            by,
            v.note,
          ),
        toast: () => "对账已确认",
      });
      list.push({
        id: "payDirect",
        group: "支付",
        label: "直接付款",
        title: "直接付款",
        confirmLabel: `确认支付 ${fmtMoney(amount)}`,
        apply: (x) =>
          withEvent(
            { ...x, status: afterPaid(x), reconcile: "免对账" },
            `${payLabel} ${fmtMoney(amount)}（未对账）`,
            by,
          ),
        toast: () => "付款成功",
      });
      list.push({
        id: "dispute",
        group: "对账",
        label: "对账有异议",
        tone: "danger",
        fields: [{ key: "reason", label: "异议内容", required: true }],
        apply: (x, v) =>
          withEvent(
            { ...x, ...replyStatement(x, "有异议", v.reason) },
            "买/租方提出对账异议",
            by,
            v.reason,
          ),
        toast: () => "异议已提交",
      });
    } else {
      if (o.kind === "sale" && role === "seller")
        list.push({
          id: "statement",
          group: "对账",
          label: "对账",
          instant: true,
          apply: (x) => x,
          toast: () => "",
        });
      else
        list.push({
          id: "statement",
          group: "对账",
          label: o.statementAmount ? "重发对账单" : "发送对账单",
          title: "发送对账单",
          fields: [
            {
              key: "amount",
              label: "对账金额",
              type: "number",
              prefix: "¥",
              required: true,
              initial: String(o.statementAmount ?? amount),
            },
            { key: "note", label: "对账说明" },
          ],
          apply: (x, v) =>
            withEvent(
              { ...x, statementAmount: Number(v.amount) || amount },
              `${by}发送对账单 ${fmtMoney(Number(v.amount) || amount)}`,
              by,
              v.note,
            ),
          toast: () => "对账单已发送",
        });
    }
  }

  if (o.status === "unpaid") {
    if (role === "buyer")
      list.push({
        id: "pay",
        group: "支付",
        label: "去支付",
        title: payLabel,
        confirmLabel: `确认支付 ${fmtMoney(o.statementAmount ?? amount)}`,
        apply: (x) =>
          withEvent(
            { ...x, status: afterPaid(x) },
            `${payLabel} ${fmtMoney(x.statementAmount ?? amount)}`,
            by,
          ),
        toast: () => "付款成功",
      });
    else if (o.kind === "sale" && role === "seller")
      list.push({
        id: "confirmPaid",
        group: "支付",
        label: "确认收款",
        title: "确认收款",
        fields: [
          {
            key: "amount",
            label: "实收金额",
            type: "number",
            prefix: "¥",
            required: true,
            initial: String(o.statementAmount ?? amount),
          },
          { key: "ref", label: "收款凭证 / 流水号" },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, status: afterPaid(x) },
            `商家确认收款 ${fmtMoney(Number(v.amount) || amount)}`,
            by,
            v.ref,
          ),
        toast: () => "已确认收款",
      });
    else
      list.push({
        id: "urgePay",
        group: "支付",
        label: "催付款",
        instant: true,
        apply: (x) => withEvent(x, `${by}催促付款`, by),
        toast: () => "已发送付款提醒",
      });
  }
  return list;
}

function Summary({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded bg-muted/40 px-3 py-2 text-sm">{children}</div>
  );
}

function ContractLink({ no }: { no?: string }) {
  if (!no) return null;
  return (
    <ActionLink>
      <span className="inline-flex items-center gap-1">
        <FileText className="size-3" aria-hidden />
        合同
      </span>
    </ActionLink>
  );
}

/* =====================================================================
 * 租赁订单
 * ===================================================================== */

function rentActions(o: RentOrder, role: OrderRole): ActionDef<RentOrder>[] {
  const by = actorOf[role];
  const s = o.status;
  const list: ActionDef<RentOrder>[] = [...settleActions(o, role)];
  const cancel: ActionDef<RentOrder> = {
    id: "cancel",
    label: "取消订单",
    tone: "danger",
    fields: [{ key: "reason", label: "取消原因", required: true }],
    apply: (x, v) =>
      withEvent({ ...x, status: "cancelled" }, `${by}取消订单`, by, v.reason),
    toast: () => "订单已取消",
  };
  const beforeDelivery =
    (s === "toReconcile" || s === "unpaid") && o.payTerm === "先款后货";
  if (beforeDelivery) list.push(cancel);

  if (role === "buyer") {
    if (s === "toShip")
      list.push({
        id: "urge",
        label: "催发货",
        instant: true,
        apply: (x) => withEvent(x, "催促发货", by),
        toast: () => "已发送发货提醒",
      });
    if (s === "shipped")
      list.push({
        id: "receive",
        label: "确认收货",
        confirmLabel: "确认收货",
        apply: (x) =>
          withEvent(
            { ...x, status: "renting" },
            "买/租方确认收货，开始计租",
            by,
          ),
        toast: () => "已确认收货",
      });
    if (s === "renting") {
      list.push({
        id: "renew",
        label: "申请续租",
        fields: [
          {
            key: "dueDate",
            label: "续租至",
            type: "date",
            required: true,
            initial: o.dueDate,
          },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, dueDate: v.dueDate },
            `申请续租至 ${v.dueDate}`,
            by,
          ),
        toast: (x) => `已续租至 ${x.dueDate}`,
      });
      list.push({
        id: "return",
        label: "申请归还",
        fields: [
          { key: "date", label: "预计送达日期", type: "date", required: true },
          { key: "note", label: "归还说明" },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, status: "returning" },
            "买/租方申请归还",
            by,
            `预计 ${v.date} 送达${v.note ? `，${v.note}` : ""}`,
          ),
        toast: () => "归还申请已提交",
      });
    }
    if (s === "done")
      list.push({
        id: "review",
        label: "评价",
        instant: true,
        apply: (x) => withEvent(x, "买/租方提交评价", by),
        toast: () => "评价已提交",
      });
  }

  if (role === "seller" || role === "provider") {
    if (s === "toShip") {
      if (role === "seller")
        list.push({
          id: "ship",
          label: "发货",
          fields: [
            {
              key: "logistics",
              label: "承运信息",
              placeholder: "车牌 / 司机 / 联系电话",
              required: true,
            },
          ],
          apply: (x, v) =>
            withEvent(
              { ...x, status: "shipped", logistics: v.logistics },
              "商家发货",
              by,
              v.logistics,
            ),
          toast: () => "已发货",
        });
      else
        list.push({
          id: "notify",
          label: "通知商家发货",
          instant: true,
          apply: (x) => withEvent(x, "服务商通知商家发货", by),
          toast: () => "已通知商家发货",
        });
    }
    if (s === "renting" && overdueDays(o) > 0)
      list.push({
        id: "remind",
        label: "提醒归还",
        instant: true,
        apply: (x) => withEvent(x, `${by}提醒承租方归还`, by),
        toast: () => "已发送归还提醒",
      });
    if (s === "returning")
      list.push({
        id: "collect",
        label: "确认收回",
        confirmLabel: "确认收回",
        apply: (x) =>
          withEvent(
            { ...x, status: "checking", returnDate: TODAY },
            `${by}确认收回，待验收`,
            by,
          ),
        toast: () => "已确认收回",
      });
    if (s === "checking")
      list.push({
        id: "settle",
        label: o.payTerm === "先款后货" ? "验收并退押金" : "验收",
        fields: [
          {
            key: "deduction",
            label: "损耗扣款",
            type: "number",
            prefix: "¥",
            initial: "0",
          },
          { key: "note", label: "验收说明" },
        ],
        apply: (x, v) => {
          const d = Number(v.deduction) || 0;
          const next = {
            ...x,
            status: afterDelivered(x),
            deduction: d,
            returnDate: x.returnDate ?? TODAY,
            reconcile:
              x.payTerm === "货到付款" ? ("待对账" as const) : x.reconcile,
          };
          const label =
            x.payTerm === "先款后货"
              ? d > 0
                ? `验收完成，扣除损耗 ${fmtMoney(d)} 后退还押金`
                : "验收完成，全额退还押金"
              : `验收完成，应结租金 ${fmtMoney(settleAmount(next))}`;
          return withEvent(next, label, by, v.note);
        },
        toast: (x) =>
          x.payTerm === "先款后货"
            ? `退还押金 ${fmtMoney(depositTotal(x) - (x.deduction ?? 0))}`
            : "验收完成，待对账",
      });
  }
  return list;
}

function RentOrders({ role }: { role: OrderRole }) {
  const own = rentOrdersData.filter((o) => ownsOrder(o, role));
  const {
    rows,
    dialog,
    dialogRow,
    detailRow,
    toast,
    run,
    trigger,
    setDialog,
    setDetailId,
  } = useOrderList(own);
  const [draft, setDraft] = useState<BaseFilters>(emptyBaseFilters);
  const [applied, setApplied] = useState<BaseFilters>(emptyBaseFilters);
  const [termDraft, setTermDraft] = useState("");
  const [termApplied, setTermApplied] = useState("");
  const [status, setStatus] = useState<RentStatus | "">("");

  const match = (o: RentOrder, f: BaseFilters, term: string) => {
    const kw = f.keyword.trim().toLowerCase();
    if (
      kw &&
      !o.id.toLowerCase().includes(kw) &&
      !o.goods.name.toLowerCase().includes(kw) &&
      !(o.contractNo ?? "").toLowerCase().includes(kw)
    )
      return false;
    if (f.party && counterpart(o, role) !== f.party) return false;
    if (f.source && sourceOf(o) !== f.source) return false;
    if (term && o.payTerm !== term) return false;
    if (!inRange(o.createdAt, f.from, f.to)) return false;
    return true;
  };
  const base = rows.filter((o) => match(o, applied, termApplied));
  const visible = status ? base.filter((o) => o.status === status) : base;
  const countOf = (s: RentStatus | "") =>
    s ? base.filter((o) => o.status === s).length : base.length;
  const parties = [...new Set(rows.map((o) => counterpart(o, role)))];

  const n = (...s: RentStatus[]) =>
    rows.filter((o) => s.includes(o.status)).length;
  const active = rows.filter(
    (o) =>
      ["shipped", "renting", "returning", "checking"].includes(o.status) &&
      o.payTerm === "先款后货",
  );
  const overdue = rows.filter((o) => overdueDays(o) > 0).length;
  const receivable = rows
    .filter((o) => o.status === "toReconcile" || o.status === "unpaid")
    .reduce((s, o) => s + (o.statementAmount ?? settleAmount(o)), 0);
  const kpis: Record<OrderRole, Kpi[]> = {
    seller: [
      {
        label: "待对账 / 待收款",
        value: String(n("toReconcile", "unpaid")),
        tone: n("toReconcile", "unpaid") ? "warn" : "default",
      },
      { label: "待发货", value: String(n("toShip")) },
      { label: "租赁中", value: String(n("renting", "shipped")) },
      {
        label: "逾期订单",
        value: String(overdue),
        tone: overdue ? "warn" : "default",
      },
    ],
    buyer: [
      { label: "待对账", value: String(n("toReconcile")) },
      {
        label: "待付款",
        value: String(n("unpaid")),
        tone: n("unpaid") ? "warn" : "default",
      },
      {
        label: "待付金额",
        value: fmtMoney(receivable),
        tone: receivable ? "warn" : "default",
      },
      {
        label: "在押押金",
        value: fmtMoney(active.reduce((s, o) => s + depositTotal(o), 0)),
      },
    ],
    provider: [
      { label: "待对账 / 待收款", value: String(n("toReconcile", "unpaid")) },
      { label: "待协调发货", value: String(n("toShip")) },
      { label: "代理在租", value: String(n("renting", "shipped")) },
      {
        label: "预计服务收益",
        value: fmtMoney(
          rows
            .filter((o) => o.status !== "cancelled")
            .reduce((s, o) => s + providerGain(o), 0),
        ),
        tone: "good",
      },
    ],
  };

  const cols: Column<RentOrder>[] = [
    {
      key: "id",
      label: "订单号",
      width: "132px",
      render: (o) => <IdCell id={o.id} sub={o.contractNo} />,
    },
    {
      key: "goods",
      label: "租赁商品",
      width: "minmax(180px,1.3fr)",
      render: (o) => (
        <GoodsCell
          name={o.goods.name}
          spec={o.goods.spec}
          qty={o.quantity}
          unit={o.goods.unit}
        />
      ),
    },
    {
      key: "party",
      label: "承租方",
      width: "minmax(150px,1fr)",
      roles: ["seller"],
      render: (o) => (
        <PartyCell
          name={o.buyer}
          sub={o.provider ? `代理：${o.provider}` : "自营"}
          subTone={o.provider ? "primary" : "muted"}
        />
      ),
    },
    {
      key: "lessor",
      label: "出租方",
      width: "minmax(150px,1fr)",
      roles: ["buyer"],
      render: (o) => (
        <PartyCell
          name={o.provider ?? o.seller}
          sub={o.provider ? `商家：${o.seller}` : undefined}
        />
      ),
    },
    {
      key: "owner",
      label: "委托商家",
      width: "minmax(130px,1fr)",
      roles: ["provider"],
      render: (o) => <PartyCell name={o.seller} />,
    },
    {
      key: "lessee",
      label: "承租方",
      width: "minmax(130px,1fr)",
      roles: ["provider"],
      render: (o) => <PartyCell name={o.buyer} />,
    },
    {
      key: "price",
      label: "租金 / 押金",
      width: "128px",
      roles: ["seller", "buyer"],
      render: (o) => (
        <MoneyCell
          main={`¥ ${o.unitPrice.toLocaleString("zh-CN", { maximumFractionDigits: 3 })}/${o.goods.unit}/天`}
          sub={`押金 ¥ ${o.deposit.toLocaleString()}/${o.goods.unit}`}
        />
      ),
    },
    {
      key: "spread",
      label: "底价 / 对外",
      width: "128px",
      roles: ["provider"],
      render: (o) => (
        <MoneyCell
          main={`¥ ${o.unitPrice.toLocaleString("zh-CN", { maximumFractionDigits: 3 })}/${o.goods.unit}/天`}
          sub={`底价 ¥ ${(o.basePrice ?? 0).toLocaleString("zh-CN", { maximumFractionDigits: 3 })}`}
        />
      ),
    },
    {
      key: "term",
      label: "租期",
      width: "150px",
      render: (o) => {
        const od = overdueDays(o);
        return (
          <span className="flex flex-col text-xs">
            <span className="font-mono">
              {o.startDate} ~ {o.returnDate ?? o.dueDate}
            </span>
            <span className="text-muted-foreground">
              {rentDays(o)} 天{o.returnDate ? " · 已归还" : ""}
              {od > 0 && (
                <span className="ml-1 text-red-600">逾期 {od} 天</span>
              )}
            </span>
          </span>
        );
      },
    },
    {
      key: "amount",
      label:
        role === "seller"
          ? "应收租金"
          : role === "buyer"
            ? "应付租金"
            : "服务收益",
      width: "112px",
      align: "right",
      render: (o) =>
        role === "provider" ? (
          <MoneyCell
            main={fmtMoney(providerGain(o))}
            sub={`订单 ${fmtMoney(rentAmount(o))}`}
            tone="good"
          />
        ) : (
          <MoneyCell
            main={fmtMoney(rentAmount(o))}
            sub={o.deduction ? `扣损耗 ${fmtMoney(o.deduction)}` : undefined}
          />
        ),
    },
    {
      key: "settle",
      label: "结算方式",
      width: "84px",
      render: (o) => <SettleCell o={o} />,
    },
    {
      key: "status",
      label: "状态",
      width: "76px",
      render: (o) => (
        <Tag className={rentStatusMeta[o.status].className}>
          {rentStatusMeta[o.status].label}
        </Tag>
      ),
    },
    {
      key: "created",
      label: "下单时间",
      width: "92px",
      render: (o) => <Stamp value={o.createdAt} />,
    },
    {
      key: "actions",
      label: "操作",
      width: "minmax(150px,1fr)",
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
  ];

  const detailSections = (o: RentOrder): DetailSection[] => [
    {
      title: "租赁信息",
      rows: [
        ["商品", `${o.goods.name} · ${o.goods.spec}`],
        ["数量", `${o.quantity.toLocaleString()} ${o.goods.unit}`],
        [
          "租金单价",
          `¥ ${o.unitPrice.toLocaleString("zh-CN", { maximumFractionDigits: 3 })} / ${o.goods.unit} / 天`,
        ],
        ...(role === "provider"
          ? ([
              [
                "商家底价",
                `¥ ${(o.basePrice ?? 0).toLocaleString("zh-CN", { maximumFractionDigits: 3 })} / ${o.goods.unit} / 天`,
              ],
            ] as [string, React.ReactNode][])
          : []),
        [
          "押金",
          `${fmtMoney(depositTotal(o))}（¥ ${o.deposit.toLocaleString()} / ${o.goods.unit}）`,
        ],
        [
          "租期",
          `${o.startDate} ~ ${o.returnDate ?? o.dueDate}（${rentDays(o)} 天）`,
        ],
        [
          role === "provider"
            ? "服务收益"
            : role === "seller"
              ? "应收租金"
              : "应付租金",
          <span key="amt" className="font-medium">
            {fmtMoney(role === "provider" ? providerGain(o) : rentAmount(o))}
          </span>,
        ],
        ["损耗扣款", o.deduction ? fmtMoney(o.deduction) : "—"],
      ],
    },
    {
      title: "结算",
      rows: [
        ["结算方式", o.payTerm],
        ["对账状态", o.reconcile ?? "—"],
        ["对账单金额", o.statementAmount ? fmtMoney(o.statementAmount) : "—"],
        ["应结金额", fmtMoney(settleAmount(o))],
      ],
    },
    {
      title: "交易方",
      rows: [
        ["商家（出租方）", o.seller],
        ["承租方", o.buyer],
        ["服务商", o.provider ?? "—"],
        ["合同编号", o.contractNo ?? "—"],
      ],
    },
    {
      title: "交付",
      rows: [
        ["使用地点", o.address],
        ["承运信息", o.logistics ?? "—"],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip items={kpis[role]} />
      <FilterPanel
        draft={draft}
        onChange={setDraft}
        onSearch={() => {
          setApplied(draft);
          setTermApplied(termDraft);
        }}
        onReset={() => {
          setDraft(emptyBaseFilters);
          setApplied(emptyBaseFilters);
          setTermDraft("");
          setTermApplied("");
          setStatus("");
        }}
        keywordLabel="订单"
        keywordPlaceholder="订单号 / 商品名称 / 合同号"
        partyLabel={role === "buyer" ? "出租方" : "承租方"}
        partyOptions={parties}
        showSource={role === "seller"}
        dateLabel="下单时间"
        extra={
          <FilterRow label="结算方式">
            <Select
              label="结算方式"
              placeholder="全部"
              value={termDraft}
              options={payTermOptions}
              onChange={setTermDraft}
            />
          </FilterRow>
        }
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
          minWidth="1320px"
          emptyText="没有符合条件的租赁订单"
        />
      </div>

      {dialog && dialogRow && (
        <ActionDialog
          key={dialog.action.id + dialogRow.id}
          action={dialog.action}
          summary={
            <Summary>
              <span className="font-mono text-xs text-muted-foreground">
                {dialogRow.id}
              </span>{" "}
              · {dialogRow.goods.name} · {dialogRow.quantity.toLocaleString()}{" "}
              {dialogRow.goods.unit}
            </Summary>
          }
          onClose={() => setDialog(null)}
          onConfirm={(v) => run(dialogRow, dialog.action, v)}
        />
      )}
      {detailRow && (
        <DetailModal
          title={`租赁订单 ${detailRow.id}`}
          status={
            <Tag className={rentStatusMeta[detailRow.status].className}>
              {rentStatusMeta[detailRow.status].label}
            </Tag>
          }
          sections={detailSections(detailRow)}
          timeline={detailRow.timeline}
          onClose={() => setDetailId(null)}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

/* =====================================================================
 * 销售订单
 * ===================================================================== */

function saleActions(o: SaleOrder, role: OrderRole): ActionDef<SaleOrder>[] {
  const by = actorOf[role];
  const s = o.status;
  const list: ActionDef<SaleOrder>[] = [];
  const cancel: ActionDef<SaleOrder> = {
    id: "cancel",
    group: "合同",
    label: "取消订单",
    tone: "danger",
    fields: [{ key: "reason", label: "取消原因", required: true }],
    apply: (x, v) =>
      withEvent({ ...x, status: "cancelled" }, `${by}取消订单`, by, v.reason),
    toast: () => "订单已取消",
  };
  const afterNegotiated = (x: SaleOrder): SaleStatus =>
    x.payTerm === "先款后货" ? "toReconcile" : "toShip";
  const beforeDelivery =
    s === "negotiating" ||
    s === "toShip" ||
    ((s === "toReconcile" || s === "unpaid") && o.payTerm === "先款后货");

  if (s === "negotiating") {
    if (role === "buyer")
      list.push({
        id: "bid",
        group: "合同",
        label: "修改出价",
        fields: [
          {
            key: "price",
            label: `出价（¥/${o.goods.unit}）`,
            type: "number",
            prefix: "¥",
            required: true,
            initial: String(o.bidPrice ?? o.unitPrice),
          },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, bidPrice: Number(v.price) || x.bidPrice },
            `买方出价 ¥${v.price}/${x.goods.unit}`,
            by,
          ),
        toast: () => "出价已更新",
      });
    else {
      list.push({
        id: "acceptBid",
        group: "合同",
        label: "接受出价",
        confirmLabel: `按 ¥${o.bidPrice ?? o.unitPrice}/${o.goods.unit} 成交`,
        apply: (x) =>
          withEvent(
            {
              ...x,
              status: afterNegotiated(x),
              unitPrice: x.bidPrice ?? x.unitPrice,
              reconcile: x.payTerm === "先款后货" ? "待对账" : x.reconcile,
            },
            `${by}接受出价，按 ¥${x.bidPrice ?? x.unitPrice}/${x.goods.unit} 成交`,
            by,
          ),
        toast: () => "已成交",
      });
      list.push({
        id: "counter",
        group: "合同",
        label: "还价",
        fields: [
          {
            key: "price",
            label: `还价（¥/${o.goods.unit}）`,
            type: "number",
            prefix: "¥",
            required: true,
            initial: String(o.unitPrice),
          },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, unitPrice: Number(v.price) || x.unitPrice },
            `${by}还价 ¥${v.price}/${x.goods.unit}`,
            by,
          ),
        toast: () => "还价已发送",
      });
      list.push({
        id: "rejectBid",
        group: "合同",
        label: "拒绝议价",
        tone: "danger",
        fields: [{ key: "reason", label: "拒绝原因", required: true }],
        apply: (x, v) =>
          withEvent(
            { ...x, status: "cancelled" },
            `${by}拒绝议价`,
            by,
            v.reason,
          ),
        toast: () => "已拒绝议价",
      });
    }
  }

  if (s !== "negotiating" && s !== "cancelled") {
    if (!o.contractNo && role !== "buyer")
      list.push({
        id: "contract",
        group: "合同",
        label: "发起合同",
        instant: true,
        apply: (x) => x,
        toast: () => "",
      });
    if (o.contractNo && o.contractState === "待签署" && role === "buyer")
      list.push({
        id: "sign",
        group: "合同",
        label: "签署合同",
        confirmLabel: "确认电子签署",
        apply: (x) =>
          withEvent(
            { ...x, contractState: "已签署" },
            "买方完成电子签署",
            by,
            x.contractNo,
          ),
        toast: () => "合同已签署",
      });
  }
  list.push(...settleActions(o, role));

  if (role === "buyer") {
    if (s === "toShip")
      list.push({
        id: "urge",
        group: "发货",
        label: "催发货",
        instant: true,
        apply: (x) => withEvent(x, "催促发货", by),
        toast: () => "已发送发货提醒",
      });
    if (s === "shipped")
      list.push({
        id: "receive",
        group: "发货",
        label: "确认收货",
        confirmLabel: "确认收货",
        apply: (x) =>
          withEvent(
            {
              ...x,
              status: afterDelivered(x),
              reconcile: x.payTerm === "货到付款" ? "待对账" : x.reconcile,
            },
            "买方确认收货",
            by,
          ),
        toast: (x) =>
          x.status === "toReconcile" ? "已确认收货，待对账" : "已确认收货",
      });
    if (s === "done") {
      list.push({
        id: "after",
        group: "退货",
        label: "申请退货 / 售后",
        fields: [{ key: "reason", label: "售后原因", required: true }],
        apply: (x, v) =>
          withEvent(
            { ...x, status: "afterSale" },
            "买方申请售后",
            by,
            v.reason,
          ),
        toast: () => "售后申请已提交",
      });
      if (o.invoice === "已开票")
        list.push({
          id: "invoice",
          group: "支付",
          label: "查看发票",
          instant: true,
          apply: (x) => x,
          toast: () => "已打开电子发票",
        });
    }
  }
  if (role === "seller") {
    if (s === "toShip")
      list.push({
        id: "ship",
        group: "发货",
        label: "发货",
        title: "发货",
        fields: [
          {
            key: "company",
            label: "物流公司 / 车辆",
            required: true,
            placeholder: "如：德邦物流 或 沪A·D1286",
          },
          { key: "no", label: "物流单号 / 提货单号", required: true },
          {
            key: "date",
            label: "发货日期",
            type: "date",
            required: true,
            initial: TODAY,
          },
        ],
        apply: (x, v) =>
          withEvent(
            {
              ...x,
              status: "shipped",
              shipCompany: v.company,
              logistics: v.no,
            },
            "商家发货",
            by,
            `${v.company} · ${v.no}`,
          ),
        toast: () => "已发货",
      });
    if (s === "afterSale")
      list.push({
        id: "returnDone",
        group: "退货",
        label: "确认退货",
        title: "确认退货",
        fields: [
          {
            key: "qty",
            label: `退货数量（${o.goods.unit}）`,
            type: "number",
            required: true,
            initial: String(o.quantity),
          },
          {
            key: "refund",
            label: "退款金额",
            type: "number",
            prefix: "¥",
            required: true,
            initial: String(saleAmount(o)),
          },
          { key: "note", label: "验收说明" },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, status: "done" },
            `商家确认退货 ${v.qty}${x.goods.unit}，退款 ${fmtMoney(Number(v.refund) || 0)}`,
            by,
            v.note,
          ),
        toast: () => "已确认退货",
      });
    if (s === "done" && o.invoice === "待开票")
      list.push({
        id: "invoice",
        group: "支付",
        label: "开票",
        title: "开具发票",
        fields: [
          { key: "title", label: "发票抬头", required: true, initial: o.buyer },
          { key: "taxNo", label: "纳税人识别号", required: true },
          {
            key: "amount",
            label: "开票金额",
            type: "number",
            prefix: "¥",
            required: true,
            initial: String(o.statementAmount ?? saleAmount(o)),
          },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, invoice: "已开票", invoiceNo: `FP${x.id.slice(2)}` },
            `商家开具发票 ${fmtMoney(Number(v.amount) || saleAmount(x))}`,
            by,
            v.title,
          ),
        toast: () => "发票已开具",
      });
    if (s === "done" && !o.closed)
      list.push({
        id: "close",
        group: "合同",
        label: "结束订单",
        title: "结束订单",
        confirmLabel: "确认结束",
        apply: (x) =>
          withEvent(
            { ...x, closed: true },
            "商家结束订单",
            by,
            x.invoice === "待开票" ? "发票尚未开具" : undefined,
          ),
        toast: () => "订单已结束",
      });
  }
  if (role === "provider") {
    if (s === "toShip")
      list.push({
        id: "notify",
        group: "发货",
        label: "通知商家发货",
        instant: true,
        apply: (x) => withEvent(x, "服务商通知商家发货", by),
        toast: () => "已通知商家发货",
      });
    if (s === "shipped")
      list.push({
        id: "track",
        group: "发货",
        label: "跟进物流",
        instant: true,
        apply: (x) => withEvent(x, "服务商跟进物流", by),
        toast: () => "已同步物流",
      });
  }
  if (beforeDelivery) list.push(cancel);
  return list;
}

function SaleOrders({ role }: { role: OrderRole }) {
  const own = saleOrdersData.filter((o) => ownsOrder(o, role));
  const {
    rows,
    dialog,
    dialogRow,
    detailRow,
    toast,
    run,
    trigger,
    commit,
    setDialog,
    setDetailId,
  } = useOrderList(own);
  const [contractId, setContractId] = useState<string | null>(null);
  const contractRow = contractId
    ? rows.find((o) => o.id === contractId)
    : undefined;
  const [reconcileId, setReconcileId] = useState<string | null>(null);
  const reconcileRow = reconcileId
    ? rows.find((o) => o.id === reconcileId)
    : undefined;
  const [draft, setDraft] = useState<BaseFilters>(emptyBaseFilters);
  const [applied, setApplied] = useState<BaseFilters>(emptyBaseFilters);
  const [termDraft, setTermDraft] = useState("");
  const [termApplied, setTermApplied] = useState("");
  const [status, setStatus] = useState<SaleStatus | "">("");

  const match = (o: SaleOrder, f: BaseFilters, term: string) => {
    const kw = f.keyword.trim().toLowerCase();
    if (
      kw &&
      ![o.id, o.goods.name, o.logistics ?? "", o.pickupNo ?? "", o.shop].some(
        (v) => v.toLowerCase().includes(kw),
      )
    )
      return false;
    if (f.party && counterpart(o, role) !== f.party) return false;
    if (f.source && sourceOf(o) !== f.source) return false;
    if (term && o.payTerm !== term) return false;
    if (!inRange(o.createdAt, f.from, f.to)) return false;
    return true;
  };
  const base = rows.filter((o) => match(o, applied, termApplied));
  const visible = status ? base.filter((o) => o.status === status) : base;
  const countOf = (s: SaleStatus | "") =>
    s ? base.filter((o) => o.status === s).length : base.length;
  const parties = [...new Set(rows.map((o) => counterpart(o, role)))];

  const n = (...s: SaleStatus[]) =>
    rows.filter((o) => s.includes(o.status)).length;
  const month = rows.filter(
    (o) => o.createdAt.startsWith("2024-10") && o.status !== "cancelled",
  );
  const owed = rows
    .filter((o) => o.status === "toReconcile" || o.status === "unpaid")
    .reduce((s, o) => s + (o.statementAmount ?? saleAmount(o)), 0);
  const kpis: Record<OrderRole, Kpi[]> = {
    seller: [
      {
        label: "议价中",
        value: String(n("negotiating")),
        tone: n("negotiating") ? "warn" : "default",
      },
      {
        label: "待对账 / 待收款",
        value: String(n("toReconcile", "unpaid")),
        tone: n("toReconcile", "unpaid") ? "warn" : "default",
      },
      { label: "待发货", value: String(n("toShip")) },
      {
        label: "本月成交额",
        value: fmtMoney(
          month
            .filter((o) => o.status !== "negotiating")
            .reduce((s, o) => s + saleAmount(o), 0),
        ),
      },
    ],
    buyer: [
      { label: "待对账", value: String(n("toReconcile")) },
      {
        label: "待付款",
        value: String(n("unpaid")),
        tone: n("unpaid") ? "warn" : "default",
      },
      { label: "待收货", value: String(n("toShip", "shipped")) },
      {
        label: "待付金额",
        value: fmtMoney(owed),
        tone: owed ? "warn" : "default",
      },
    ],
    provider: [
      { label: "待对账 / 待收款", value: String(n("toReconcile", "unpaid")) },
      { label: "待协调发货", value: String(n("toShip")) },
      {
        label: "售后中",
        value: String(n("afterSale")),
        tone: n("afterSale") ? "warn" : "default",
      },
      {
        label: "累计服务收益",
        value: fmtMoney(
          rows
            .filter((o) => o.status !== "cancelled")
            .reduce((s, o) => s + providerGain(o), 0),
        ),
        tone: "good",
      },
    ],
  };

  const cols: Column<SaleOrder>[] = [
    {
      key: "id",
      label: "订单号",
      width: "132px",
      render: (o) => <IdCell id={o.id} sub={o.contractNo} />,
    },
    {
      key: "goods",
      label: "商品",
      width: "minmax(180px,1.3fr)",
      render: (o) => (
        <GoodsCell
          name={o.goods.name}
          spec={o.goods.spec}
          qty={o.quantity}
          unit={o.goods.unit}
        />
      ),
    },
    {
      key: "buyer",
      label: "买方",
      width: "minmax(150px,1fr)",
      roles: ["seller"],
      render: (o) => (
        <PartyCell
          name={o.buyer}
          sub={o.provider ? `代理：${o.provider}` : "自营"}
          subTone={o.provider ? "primary" : "muted"}
        />
      ),
    },
    {
      key: "shop",
      label: "所属店铺",
      width: "minmax(130px,1fr)",
      roles: ["seller"],
      render: (o) => <PartyCell name={o.shop} />,
    },
    {
      key: "sellerParty",
      label: "卖方",
      width: "minmax(150px,1fr)",
      roles: ["buyer"],
      render: (o) => (
        <PartyCell
          name={o.provider ?? o.seller}
          sub={o.provider ? `商家：${o.seller}` : undefined}
        />
      ),
    },
    {
      key: "owner",
      label: "委托商家",
      width: "minmax(130px,1fr)",
      roles: ["provider"],
      render: (o) => <PartyCell name={o.seller} />,
    },
    {
      key: "purchaser",
      label: "买方",
      width: "minmax(130px,1fr)",
      roles: ["provider"],
      render: (o) => <PartyCell name={o.buyer} />,
    },
    {
      key: "price",
      label: role === "provider" ? "底价 / 成交价" : "单价",
      width: "112px",
      render: (o) => (
        <MoneyCell
          main={`¥ ${o.unitPrice.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}/${o.goods.unit}`}
          sub={
            role === "provider"
              ? `底价 ¥ ${(o.basePrice ?? 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`
              : undefined
          }
        />
      ),
    },
    {
      key: "amount",
      label:
        role === "seller"
          ? "应收金额"
          : role === "buyer"
            ? "应付金额"
            : "服务收益",
      width: "112px",
      align: "right",
      render: (o) =>
        role === "provider" ? (
          <MoneyCell
            main={fmtMoney(providerGain(o))}
            sub={`订单 ${fmtMoney(saleAmount(o))}`}
            tone="good"
          />
        ) : (
          <MoneyCell
            main={fmtMoney(saleAmount(o))}
            sub={o.freight ? `含运费 ${fmtMoney(o.freight)}` : "免运费"}
          />
        ),
    },
    {
      key: "settle",
      label: "结算方式",
      width: "84px",
      render: (o) => <SettleCell o={o} />,
    },
    {
      key: "status",
      label: "状态",
      width: "72px",
      render: (o) => (
        <Tag className={saleStatusMeta[o.status].className}>
          {saleStatusMeta[o.status].label}
        </Tag>
      ),
    },
    {
      key: "created",
      label: "下单时间",
      width: "92px",
      render: (o) => <Stamp value={o.createdAt} />,
    },
    {
      key: "actions",
      label: "操作",
      width: "minmax(220px,1.4fr)",
      render: (o) => (
        <ActionCell
          actions={saleActions(o, role)}
          onAction={(a) =>
            a.id === "contract"
              ? setContractId(o.id)
              : a.id === "statement" && role === "seller"
                ? setReconcileId(o.id)
                : trigger(o, a)
          }
          extra={
            <ActionLink onClick={() => setDetailId(o.id)}>详情</ActionLink>
          }
        />
      ),
    },
  ];

  if (reconcileRow)
    return (
      <>
        <SaleReconcilePage
          key={reconcileRow.id}
          order={reconcileRow}
          onBack={() => setReconcileId(null)}
          onCreate={(d) => {
            const seq = (reconcileRow.statements?.length ?? 0) + 1;
            const statement: Statement = {
              no: d.no,
              seq,
              amount: d.amount,
              cycle: d.cycle,
              period: d.period,
              periodStart: d.periodStart,
              periodEnd: d.periodEnd,
              lines: d.lines,
              note: d.note || undefined,
              attachment: d.attachment || undefined,
              state: "待确认",
              createdAt: nowStamp(),
            };
            const next = withEvent(
              {
                ...reconcileRow,
                statementAmount: d.amount,
                statements: [...(reconcileRow.statements ?? []), statement],
              },
              `商家发送对账单 ${fmtMoney(d.amount)}（第 ${seq} 期）`,
              actorOf[role],
              d.note || undefined,
            );
            commit(next, `第 ${seq} 期对账单已发送给买方`);
          }}
        />
        <Toast message={toast} />
      </>
    );

  if (contractRow)
    return (
      <>
        <SaleContractPage
          key={contractRow.id}
          order={contractRow}
          onBack={() => setContractId(null)}
          onSubmit={(v) => {
            const by = actorOf[role];
            const online = v.mode === "线上";
            const next = withEvent(
              {
                ...contractRow,
                contractNo: v.no,
                contractSign: v.mode,
                contractState: online
                  ? ("待签署" as const)
                  : ("已签署" as const),
              },
              online
                ? `商家发起线上合同，待 ${v.signer} 电子签署`
                : "商家登记线下签署合同",
              by,
              online ? v.no : `${v.no} · ${v.signedAt}`,
            );
            commit(
              next,
              online ? "线上合同已发起，等待买方签署" : "线下合同已登记",
            );
            setContractId(null);
          }}
        />
        <Toast message={toast} />
      </>
    );

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip items={kpis[role]} />
      <FilterPanel
        draft={draft}
        onChange={setDraft}
        onSearch={() => {
          setApplied(draft);
          setTermApplied(termDraft);
        }}
        onReset={() => {
          setDraft(emptyBaseFilters);
          setApplied(emptyBaseFilters);
          setTermDraft("");
          setTermApplied("");
          setStatus("");
        }}
        keywordLabel="订单"
        keywordPlaceholder="订单号 / 商品名称 / 物流单号"
        partyLabel={role === "buyer" ? "卖方" : "买方"}
        partyOptions={parties}
        showSource={role === "seller"}
        dateLabel="下单时间"
        extra={
          <FilterRow label="结算方式">
            <Select
              label="结算方式"
              placeholder="全部"
              value={termDraft}
              options={payTermOptions}
              onChange={setTermDraft}
            />
          </FilterRow>
        }
      />
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <StatusTabs
          order={saleStatusOrder}
          meta={saleStatusMeta}
          active={status}
          countOf={countOf}
          onSelect={setStatus}
          ariaLabel="销售订单状态"
          right={`共 ${visible.length} 条`}
        />
        <OrderTable
          columns={visibleColumns(cols, role)}
          rows={visible}
          minWidth="1360px"
          emptyText="没有符合条件的销售订单"
        />
      </div>

      {detailRow && (
        <SaleDetailModal
          key={detailRow.id}
          order={detailRow}
          role={role}
          onClose={() => setDetailId(null)}
        />
      )}
      {dialog && dialogRow && (
        <ActionDialog
          key={dialog.action.id + dialogRow.id}
          action={dialog.action}
          summary={
            <Summary>
              <span className="font-mono text-xs text-muted-foreground">
                {dialogRow.id}
              </span>{" "}
              · {dialogRow.goods.name} · {dialogRow.quantity.toLocaleString()}{" "}
              {dialogRow.goods.unit} · {fmtMoney(saleAmount(dialogRow))}
            </Summary>
          }
          onClose={() => setDialog(null)}
          onConfirm={(v) => run(dialogRow, dialog.action, v)}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

/* =====================================================================
 * 售后处理
 * ===================================================================== */

/** 当前角色是否为该售后单的责任处理方 */
function isRespondent(o: AfterOrder, role: OrderRole) {
  return (
    (role === "seller" && o.respondent === "商家") ||
    (role === "provider" && o.respondent === "服务商")
  );
}

function afterActions(o: AfterOrder, role: OrderRole): ActionDef<AfterOrder>[] {
  const by = actorOf[role];
  const s = o.status;
  const list: ActionDef<AfterOrder>[] = [];
  const money =
    o.type === "refund" || o.type === "return" || o.type === "deposit";

  if (role === "buyer") {
    if (s === "pending")
      list.push({
        id: "withdraw",
        label: "撤销申请",
        tone: "danger",
        confirmLabel: "确认撤销",
        apply: (x) =>
          withEvent({ ...x, status: "withdrawn" }, "买/租方撤销申请", by),
        toast: () => "售后申请已撤销",
      });
    if (s === "awaitReturn")
      list.push({
        id: "returnShip",
        label: "填写退货物流",
        fields: [
          { key: "company", label: "物流公司", required: true },
          { key: "no", label: "运单号", required: true },
        ],
        apply: (x, v) =>
          withEvent(
            { ...x, returnLogistics: `${v.company} ${v.no}` },
            "买/租方寄回商品",
            by,
            `${v.company} ${v.no}`,
          ),
        toast: () => "退货物流已提交",
      });
    if (s === "processing" || s === "awaitRefund")
      list.push({
        id: "urge",
        label: "催处理",
        instant: true,
        apply: (x) => withEvent(x, "买/租方催促处理", by),
        toast: () => "已发送处理提醒",
      });
    if (s === "rejected")
      list.push({
        id: "platform",
        label: "申请平台介入",
        fields: [{ key: "reason", label: "申诉说明", required: true }],
        apply: (x, v) =>
          withEvent(
            { ...x, status: "platform", handler: "平台 · 客服专员" },
            "买/租方申请平台介入",
            by,
            v.reason,
          ),
        toast: () => "已提交平台介入",
      });
    return list;
  }

  if (!isRespondent(o, role)) return list;

  if (s === "pending") {
    list.push({
      id: "accept",
      label: "同意",
      title: `同意${afterTypeMeta[o.type].label}`,
      fields: [
        ...(money
          ? [
              {
                key: "amount",
                label: "退款金额",
                type: "number" as const,
                prefix: "¥",
                required: true,
                initial: String(o.amount),
              },
            ]
          : []),
        { key: "note", label: "处理说明" },
      ],
      apply: (x, v) => {
        const next: AfterStatus =
          x.type === "return"
            ? "awaitReturn"
            : money
              ? "awaitRefund"
              : "processing";
        const amount = money ? Number(v.amount) || x.amount : x.amount;
        return withEvent(
          {
            ...x,
            status: next,
            amount,
            handler: `${by} · ${role === "seller" ? "售后专员" : "李工"}`,
          },
          `${by}同意${afterTypeMeta[x.type].label}${money ? ` ${fmtMoney(amount)}` : ""}`,
          by,
          v.note,
        );
      },
      toast: () => "已同意",
    });
    list.push({
      id: "reject",
      label: "拒绝",
      tone: "danger",
      fields: [{ key: "reason", label: "拒绝原因", required: true }],
      apply: (x, v) =>
        withEvent(
          {
            ...x,
            status: "rejected",
            note: v.reason,
            handler: `${by} · 售后专员`,
          },
          `${by}拒绝申请`,
          by,
          v.reason,
        ),
      toast: () => "已拒绝该售后申请",
    });
    if (role === "provider")
      list.push({
        id: "forward",
        label: "转交商家",
        confirmLabel: "确认转交",
        apply: (x) =>
          withEvent(
            { ...x, respondent: "商家", handler: "商家 · 待分配" },
            "服务商转交委托商家处理",
            by,
          ),
        toast: () => "已转交商家",
      });
  }
  if (s === "awaitReturn")
    list.push({
      id: "received",
      label: "确认收到退货",
      confirmLabel: "确认签收",
      apply: (x) =>
        withEvent(
          { ...x, status: x.type === "return" ? "awaitRefund" : "processing" },
          `${by}确认收到退货`,
          by,
        ),
      toast: () => "已签收",
    });
  if (s === "awaitRefund")
    list.push({
      id: "refund",
      label: "确认退款",
      confirmLabel: `确认退款 ${fmtMoney(o.amount)}`,
      apply: (x) =>
        withEvent(
          { ...x, status: "done" },
          `${by}完成退款 ${fmtMoney(x.amount)}`,
          by,
        ),
      toast: () => "退款已完成",
    });
  if (s === "processing")
    list.push({
      id: "finish",
      label: "处理完成",
      fields: [{ key: "note", label: "处理结果", required: true }],
      apply: (x, v) =>
        withEvent(
          { ...x, status: "done", note: v.note },
          `${by}处理完成`,
          by,
          v.note,
        ),
      toast: () => "售后已处理完成",
    });
  return list;
}

function AfterOrders({ role }: { role: OrderRole }) {
  const own = afterOrdersData.filter((o) => ownsOrder(o, role));
  const {
    rows,
    dialog,
    dialogRow,
    detailRow,
    toast,
    run,
    trigger,
    setDialog,
    setDetailId,
  } = useOrderList(own);
  const [draft, setDraft] = useState<BaseFilters>(emptyBaseFilters);
  const [applied, setApplied] = useState<BaseFilters>(emptyBaseFilters);
  const [typeDraft, setTypeDraft] = useState("");
  const [typeApplied, setTypeApplied] = useState("");
  const [status, setStatus] = useState<AfterStatus | "">("");

  const other = (o: AfterOrder) =>
    role === "buyer"
      ? o.respondent === "服务商"
        ? (o.provider ?? o.seller)
        : o.seller
      : o.applicant;
  const match = (o: AfterOrder, f: BaseFilters, t: string) => {
    const kw = f.keyword.trim().toLowerCase();
    if (
      kw &&
      !o.id.toLowerCase().includes(kw) &&
      !o.orderId.toLowerCase().includes(kw) &&
      !o.goods.name.toLowerCase().includes(kw)
    )
      return false;
    if (f.party && other(o) !== f.party) return false;
    if (f.source && sourceOf(o) !== f.source) return false;
    if (t && afterTypeMeta[o.type].label !== t) return false;
    if (!inRange(o.createdAt, f.from, f.to)) return false;
    return true;
  };
  const base = rows.filter((o) => match(o, applied, typeApplied));
  const visible = status ? base.filter((o) => o.status === status) : base;
  const countOf = (s: AfterStatus | "") =>
    s ? base.filter((o) => o.status === s).length : base.length;
  const parties = [...new Set(rows.map(other))];

  const n = (...s: AfterStatus[]) =>
    rows.filter((o) => s.includes(o.status)).length;
  const mine = rows.filter((o) => isRespondent(o, role));
  const kpis: Record<OrderRole, Kpi[]> = {
    seller: [
      {
        label: "待我处理",
        value: String(mine.filter((o) => o.status === "pending").length),
        tone: mine.some((o) => o.status === "pending") ? "warn" : "default",
      },
      { label: "处理中", value: String(n("processing", "awaitReturn")) },
      {
        label: "待退款金额",
        value: fmtMoney(
          rows
            .filter((o) => o.status === "awaitRefund")
            .reduce((s, o) => s + o.amount, 0),
        ),
      },
      {
        label: "平台介入",
        value: String(n("platform")),
        tone: n("platform") ? "warn" : "default",
      },
    ],
    buyer: [
      {
        label: "申请中",
        value: String(n("pending", "processing", "awaitReturn", "awaitRefund")),
      },
      { label: "待我退货", value: String(n("awaitReturn")) },
      { label: "已完成", value: String(n("done")), tone: "good" },
      {
        label: "已拒绝 / 介入",
        value: String(n("rejected", "platform")),
        tone: n("rejected") ? "warn" : "default",
      },
    ],
    provider: [
      {
        label: "待我受理",
        value: String(mine.filter((o) => o.status === "pending").length),
        tone: mine.some((o) => o.status === "pending") ? "warn" : "default",
      },
      { label: "处理中", value: String(n("processing", "awaitReturn")) },
      {
        label: "已转交商家",
        value: String(rows.filter((o) => o.respondent === "商家").length),
      },
      {
        label: "本月售后金额",
        value: fmtMoney(
          rows
            .filter((o) => o.createdAt.startsWith("2024-10"))
            .reduce((s, o) => s + o.amount, 0),
        ),
      },
    ],
  };

  const cols: Column<AfterOrder>[] = [
    {
      key: "id",
      label: "售后单号",
      width: "128px",
      render: (o) => <IdCell id={o.id} />,
    },
    {
      key: "order",
      label: "关联订单",
      width: "150px",
      render: (o) => (
        <span className="flex items-center gap-1.5">
          <Tag
            className={
              bizMeta[o.orderKind === "rent" ? "rent" : "sale"].className
            }
          >
            {o.orderKind === "rent" ? "租赁" : "销售"}
          </Tag>
          <span className="font-mono text-xs">{o.orderId}</span>
        </span>
      ),
    },
    {
      key: "goods",
      label: "商品",
      width: "minmax(170px,1.2fr)",
      render: (o) => (
        <GoodsCell
          name={o.goods.name}
          spec={o.goods.spec}
          qty={o.quantity}
          unit={o.goods.unit}
        />
      ),
    },
    {
      key: "type",
      label: "售后类型",
      width: "84px",
      render: (o) => (
        <Tag className={afterTypeMeta[o.type].className}>
          {afterTypeMeta[o.type].label}
        </Tag>
      ),
    },
    {
      key: "applicant",
      label: "申请方",
      width: "minmax(140px,1fr)",
      roles: ["seller", "provider"],
      render: (o) => (
        <PartyCell
          name={o.applicant}
          sub={
            o.provider
              ? `${role === "seller" ? "代理" : "商家"}：${role === "seller" ? o.provider : o.seller}`
              : "自营"
          }
          subTone={o.provider ? "primary" : "muted"}
        />
      ),
    },
    {
      key: "respondentParty",
      label: "处理方",
      width: "minmax(140px,1fr)",
      roles: ["buyer"],
      render: (o) => <PartyCell name={other(o)} sub={o.respondent} />,
    },
    {
      key: "reason",
      label: "申请原因",
      width: "minmax(180px,1.4fr)",
      render: (o) => (
        <span
          className="line-clamp-2 text-xs leading-4 text-muted-foreground"
          title={o.reason}
        >
          {o.reason}
        </span>
      ),
    },
    {
      key: "amount",
      label: "申请金额",
      width: "92px",
      align: "right",
      render: (o) => <MoneyCell main={o.amount ? fmtMoney(o.amount) : "—"} />,
    },
    {
      key: "status",
      label: "状态",
      width: "88px",
      render: (o) => (
        <span className="flex flex-col items-start gap-1">
          <Tag className={afterStatusMeta[o.status].className}>
            {afterStatusMeta[o.status].label}
          </Tag>
          {role !== "buyer" &&
            !isRespondent(o, role) &&
            o.status !== "done" &&
            o.status !== "withdrawn" && (
              <span className="text-[11px] text-muted-foreground">
                {o.respondent}处理中
              </span>
            )}
        </span>
      ),
    },
    {
      key: "handler",
      label: "处理人",
      width: "104px",
      roles: ["seller", "provider"],
      render: (o) => (
        <span className="text-xs text-muted-foreground">
          {o.handler ?? "待分配"}
        </span>
      ),
    },
    {
      key: "created",
      label: "申请时间",
      width: "92px",
      render: (o) => <Stamp value={o.createdAt} />,
    },
    {
      key: "actions",
      label: "操作",
      width: "minmax(140px,1fr)",
      render: (o) => (
        <ActionCell
          actions={afterActions(o, role)}
          onAction={(a) => trigger(o, a)}
          extra={
            <ActionLink onClick={() => setDetailId(o.id)}>详情</ActionLink>
          }
        />
      ),
    },
  ];

  const detailSections = (o: AfterOrder): DetailSection[] => [
    {
      title: "售后申请",
      rows: [
        [
          "关联订单",
          `${o.orderKind === "rent" ? "租赁订单" : "销售订单"} ${o.orderId}`,
        ],
        ["售后类型", afterTypeMeta[o.type].label],
        [
          "商品",
          `${o.goods.name} · ${o.quantity.toLocaleString()} ${o.goods.unit}`,
        ],
        ["申请金额", o.amount ? fmtMoney(o.amount) : "—"],
        ["申请原因", o.reason],
        ["退货物流", o.returnLogistics ?? "—"],
      ],
    },
    {
      title: "处理",
      rows: [
        ["申请方", o.applicant],
        [
          "责任处理方",
          `${o.respondent}${o.respondent === "服务商" ? ` · ${o.provider ?? ""}` : ` · ${o.seller}`}`,
        ],
        ["处理人", o.handler ?? "待分配"],
        ["处理结果", o.note ?? "—"],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip items={kpis[role]} />
      <FilterPanel
        draft={draft}
        onChange={setDraft}
        onSearch={() => {
          setApplied(draft);
          setTypeApplied(typeDraft);
        }}
        onReset={() => {
          setDraft(emptyBaseFilters);
          setApplied(emptyBaseFilters);
          setTypeDraft("");
          setTypeApplied("");
          setStatus("");
        }}
        keywordLabel="单号"
        keywordPlaceholder="售后单号 / 订单号 / 商品"
        partyLabel={role === "buyer" ? "处理方" : "申请方"}
        partyOptions={parties}
        showSource={role === "seller"}
        dateLabel="申请时间"
        extra={
          <FilterRow label="售后类型">
            <Select
              label="售后类型"
              placeholder="全部"
              value={typeDraft}
              options={Object.values(afterTypeMeta).map((m) => m.label)}
              onChange={setTypeDraft}
            />
          </FilterRow>
        }
      />
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <StatusTabs
          order={afterStatusOrder}
          meta={afterStatusMeta}
          active={status}
          countOf={countOf}
          onSelect={setStatus}
          ariaLabel="售后状态"
          right={`共 ${visible.length} 条`}
        />
        <OrderTable
          columns={visibleColumns(cols, role)}
          rows={visible}
          minWidth="1240px"
          emptyText="没有符合条件的售后单"
        />
      </div>

      {dialog && dialogRow && (
        <ActionDialog
          key={dialog.action.id + dialogRow.id}
          action={dialog.action}
          summary={
            <Summary>
              <span className="font-mono text-xs text-muted-foreground">
                {dialogRow.id}
              </span>{" "}
              · {afterTypeMeta[dialogRow.type].label} · {dialogRow.goods.name}
              {dialogRow.amount ? ` · ${fmtMoney(dialogRow.amount)}` : ""}
            </Summary>
          }
          onClose={() => setDialog(null)}
          onConfirm={(v) => run(dialogRow, dialog.action, v)}
        />
      )}
      {detailRow && (
        <DetailModal
          title={`售后单 ${detailRow.id}`}
          status={
            <Tag className={afterStatusMeta[detailRow.status].className}>
              {afterStatusMeta[detailRow.status].label}
            </Tag>
          }
          sections={detailSections(detailRow)}
          timeline={detailRow.timeline}
          onClose={() => setDetailId(null)}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

/* ---------- 入口 ---------- */

export function OrdersPage({
  role,
  kind,
}: {
  role: OrderRole;
  kind: OrdersKind;
}) {
  if (kind === "rent") return <RentOrders key={role} role={role} />;
  if (kind === "sale") return <SaleOrders key={role} role={role} />;
  return <AfterOrders key={role} role={role} />;
}

export const demoAccounts = DEMO;
