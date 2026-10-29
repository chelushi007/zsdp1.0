"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/goods-list";
import { Timeline } from "@/components/orders-shared";
import { Card, InfoGrid, PageBar } from "@/components/sale-page-shared";
import {
  belowMinOrderLines,
  fmtMoney,
  goodsAmount,
  goodsTax,
  orderLines,
  providerGain,
  saleAmount,
  taxLabel,
  taxRatesOf,
  type OrderRole,
  type SaleOrder,
} from "@/lib/orders-data";

const TABS = [
  "订单商品",
  "订单合同",
  "对账单",
  "发货单",
  "发票",
  "业务日记",
] as const;
type Tab = (typeof TABS)[number];

type Row = [string, React.ReactNode];

function unitPrice(n: number, unit: string) {
  return `¥ ${n.toLocaleString("zh-CN", { maximumFractionDigits: 2 })} / ${unit}`;
}

function stampOf(o: SaleOrder, keyword: string) {
  return o.timeline.find((t) => t.label.includes(keyword))?.at;
}

function DocCard({
  title,
  no,
  state,
  stateTone = "muted",
  children,
}: {
  title: string;
  no?: string;
  state: string;
  stateTone?: "good" | "warn" | "muted";
  children: React.ReactNode;
}) {
  const tone = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-700 ring-amber-200",
    muted: "bg-muted text-muted-foreground ring-border",
  }[stateTone];
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border p-4">
      <header className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-sm font-medium">{title}</span>
          {no && (
            <span className="font-mono text-xs text-muted-foreground">
              {no}
            </span>
          )}
        </span>
        <Tag className={tone}>{state}</Tag>
      </header>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      {text}
    </div>
  );
}

/* ---------- 订单商品 ---------- */

function GoodsTab({ o, role }: { o: SaleOrder; role: OrderRole }) {
  const lines = orderLines(o);
  const tax = goodsTax(o);
  const below = belowMinOrderLines(o);
  const cols =
    "grid-cols-[minmax(0,2.2fr)_minmax(90px,1fr)_minmax(110px,1fr)_80px_minmax(110px,1fr)]";
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-md border border-border">
        <div
          className={cn(
            "grid bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
            cols,
          )}
        >
          <span>
            商品 / 上架单
            {lines.length > 1 && <span className="ml-1">（{lines.length} 项）</span>}
          </span>
          <span className="text-right">数量</span>
          <span className="text-right">单价</span>
          <span className="text-right">税率</span>
          <span className="text-right">小计</span>
        </div>
        <ul className="divide-y divide-border">
          {lines.map((l) => {
            const short = l.minOrder !== undefined && l.quantity < l.minOrder;
            return (
              <li
                key={l.code}
                className={cn("grid items-center px-3 py-3 text-sm", cols)}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{l.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {l.spec}
                  </span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {l.code}
                    {l.listingNo && ` · 上架单 ${l.listingNo}`}
                  </span>
                </span>
                <span className="flex flex-col items-end tabular-nums">
                  <span>
                    {l.quantity.toLocaleString()} {l.unit}
                  </span>
                  {l.minOrder !== undefined && (
                    <span
                      className={cn(
                        "text-[11px]",
                        short ? "text-red-600" : "text-muted-foreground",
                      )}
                    >
                      起订 {l.minOrder.toLocaleString()} {l.unit}
                      {short && " · 未达"}
                    </span>
                  )}
                </span>
                <span className="text-right tabular-nums">
                  {unitPrice(l.unitPrice, l.unit)}
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {taxLabel(l.taxRate)}
                </span>
                <span className="text-right font-medium tabular-nums">
                  {fmtMoney(l.unitPrice * l.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-1 border-t border-border bg-muted/20 px-3 py-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>货款小计</span>
            <span className="tabular-nums">{fmtMoney(goodsAmount(o))}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>其中税额</span>
              <span className="tabular-nums">{fmtMoney(tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>运费</span>
            <span className="tabular-nums">
              {o.freight ? fmtMoney(o.freight) : "免运费"}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>订单金额</span>
            <span className="tabular-nums">{fmtMoney(saleAmount(o))}</span>
          </div>
          {role === "provider" && (
            <div className="flex justify-between font-medium text-emerald-700">
              <span>服务收益</span>
              <span className="tabular-nums">{fmtMoney(providerGain(o))}</span>
            </div>
          )}
        </div>
      </div>
      {below.length > 0 && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {below.map((l) => l.name).join("、")} 的数量低于上架单起订量，发起合同时需确认。
        </p>
      )}
      <InfoGrid
        rows={[
          ["履约方式", o.payTerm],
          ["支付方式", o.payMethod],
          ["所属店铺", o.shop],
          ["买方", o.buyer],
          ["卖方", o.seller],
          ["服务商", o.provider ?? "自营"],
          ...(o.status === "negotiating"
            ? ([
                [
                  "买方出价",
                  <span key="bid" className="font-medium text-violet-700">
                    {unitPrice(o.bidPrice ?? o.unitPrice, o.goods.unit)}
                  </span>,
                ],
              ] as Row[])
            : []),
          ...(role === "provider"
            ? ([["商家底价", unitPrice(o.basePrice ?? 0, o.goods.unit)]] as Row[])
            : []),
          ["收货地址", o.address],
          ...(o.remark ? ([["备注", o.remark]] as Row[]) : []),
        ]}
      />
    </div>
  );
}

/* ---------- 订单合同 ---------- */

function ContractTab({ o }: { o: SaleOrder }) {
  if (!o.contractNo)
    return (
      <Empty
        text={o.status === "negotiating" ? "议价成交后可发起合同" : "尚未发起合同"}
      />
    );
  const pending = o.contractState === "待签署";
  const lines = orderLines(o);
  return (
    <DocCard
      title="购销合同"
      no={o.contractNo}
      state={pending ? "待买方签署" : "已签署"}
      stateTone={pending ? "warn" : "good"}
    >
      <InfoGrid
        cols={2}
        rows={[
          [
            "签署方式",
            o.contractSign
              ? o.contractSign === "线上"
                ? "线上电子签"
                : "线下纸质签"
              : "线上电子签",
          ],
          [
            pending ? "发起时间" : "签署时间",
            stampOf(o, "合同") ?? stampOf(o, "签署") ?? o.createdAt,
          ],
          ["合同金额", fmtMoney(saleAmount(o))],
          ["税率", taxRatesOf(o).map(taxLabel).join(" / ")],
          ["甲方（买方）", o.buyer],
          ["乙方（卖方）", o.seller],
          [
            "合同标的",
            <span key="subject" className="flex flex-col gap-0.5">
              {lines.map((l) => (
                <span key={l.code} className="text-xs">
                  {l.name} {l.quantity.toLocaleString()} {l.unit}
                  {l.listingNo && (
                    <span className="ml-1 font-mono text-muted-foreground">
                      {l.listingNo}
                    </span>
                  )}
                </span>
              ))}
            </span>,
          ],
          ["履约方式", o.payTerm],
        ]}
      />
      <div>
        <Button variant="outline" size="sm">
          查看合同文件
        </Button>
      </div>
    </DocCard>
  );
}

/* ---------- 对账单 ---------- */

function StatementTab({ o }: { o: SaleOrder }) {
  const list = o.statements ?? [];
  if (list.length === 0 && !o.statementAmount && !o.reconcile)
    return <Empty text="尚未生成对账单" />;
  const paid = !["negotiating", "toReconcile", "unpaid", "cancelled"].includes(
    o.status,
  );
  const reconciled = o.reconcile === "已对账" || o.reconcile === "免对账";
  if (list.length === 0)
    return (
      <DocCard
        title="对账单"
        no={`DZ${o.id.slice(2)}`}
        state={o.reconcile ?? "待对账"}
        stateTone={reconciled ? "good" : "warn"}
      >
        <InfoGrid
          cols={2}
          rows={[
            [
              "对账金额",
              <span key="amt" className="font-medium">
                {fmtMoney(o.statementAmount ?? saleAmount(o))}
              </span>,
            ],
            [
              "收款状态",
              paid ? (
                <span className="text-emerald-700">已收款</span>
              ) : (
                <span className="text-amber-700">待收款</span>
              ),
            ],
            ["支付方式", o.payMethod],
          ]}
        />
      </DocCard>
    );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          共 {list.length} 期 · 对账状态 {o.reconcile ?? "待对账"}
        </span>
        <span>{paid ? "已收款" : "待收款"}</span>
      </div>
      {[...list].reverse().map((s) => (
        <DocCard
          key={s.no}
          title={`对账单 · 第 ${s.seq} 期`}
          no={s.no}
          state={s.state}
          stateTone={
            s.state === "已确认" ? "good" : s.state === "有异议" ? "muted" : "warn"
          }
        >
          <InfoGrid
            cols={2}
            rows={[
              [
                "对账金额",
                <span key="amt" className="font-medium">
                  {fmtMoney(s.amount)}
                </span>,
              ],
              [
                "对账方式",
                s.cycle ? `${s.cycle} · ${s.period ?? "—"}` : (s.period ?? "—"),
              ],
              ...(s.lines?.length
                ? ([
                    [
                      "对账商品",
                      <span key="l" className="flex flex-col gap-0.5">
                        {s.lines.map((l) => {
                          const line = orderLines(o).find((x) => x.code === l.code);
                          return (
                            <span key={l.code} className="text-xs">
                              {line?.name ?? l.code}：{l.quantity.toLocaleString()}{" "}
                              {line?.unit ?? ""}
                            </span>
                          );
                        })}
                      </span>,
                    ],
                  ] as Row[])
                : []),
              ["创建时间", s.createdAt],
              [s.state === "有异议" ? "异议时间" : "确认时间", s.repliedAt ?? "—"],
              ...(s.note ? ([["对账说明", s.note]] as Row[]) : []),
              ...(s.reply
                ? ([
                    [
                      "买方反馈",
                      <span
                        key="r"
                        className={s.state === "有异议" ? "text-red-700" : undefined}
                      >
                        {s.reply}
                      </span>,
                    ],
                  ] as Row[])
                : []),
              ...(s.attachment
                ? ([
                    [
                      "附件",
                      <span key="a" className="text-[#1890ff]">
                        {s.attachment}
                      </span>,
                    ],
                  ] as Row[])
                : []),
            ]}
          />
        </DocCard>
      ))}
    </div>
  );
}

/* ---------- 发货单 / 发票 ---------- */

function ShipmentTab({ o }: { o: SaleOrder }) {
  const no = o.logistics ?? o.pickupNo;
  if (!no)
    return <Empty text={o.status === "toShip" ? "待商家发货" : "尚未发货"} />;
  const received = o.status !== "shipped" && o.status !== "toShip";
  return (
    <DocCard
      title="发货单"
      no={`FH${o.id.slice(2)}`}
      state={received ? "已签收" : "运输中"}
      stateTone={received ? "good" : "warn"}
    >
      <InfoGrid
        cols={2}
        rows={[
          ["发货时间", stampOf(o, "发货") ?? "—"],
          ["签收时间", stampOf(o, "收货") ?? "—"],
          ["物流公司 / 车辆", o.shipCompany ?? "—"],
          [
            o.pickupNo ? "提货单号" : "物流单号",
            <span key="no" className="font-mono">
              {no}
            </span>,
          ],
          [
            "发货商品",
            <span key="g" className="flex flex-col gap-0.5">
              {orderLines(o).map((l) => (
                <span key={l.code} className="text-xs">
                  {l.name}：{l.quantity.toLocaleString()} {l.unit}
                </span>
              ))}
            </span>,
          ],
          ["收货地址", o.address],
        ]}
      />
    </DocCard>
  );
}

function InvoiceTab({ o }: { o: SaleOrder }) {
  if (o.invoice === "不开票") return <Empty text="买方选择不开票" />;
  if (o.invoice === "待开票")
    return (
      <Empty
        text={o.status === "done" ? "订单已完成，待商家开票" : "订单完成后可开票"}
      />
    );
  return (
    <DocCard
      title="增值税发票"
      no={o.invoiceNo ?? `FP${o.id.slice(2)}`}
      state="已开票"
      stateTone="good"
    >
      <InfoGrid
        cols={2}
        rows={[
          ["开票时间", stampOf(o, "发票") ?? "—"],
          [
            "开票金额",
            <span key="amt" className="font-medium">
              {fmtMoney(o.statementAmount ?? saleAmount(o))}
            </span>,
          ],
          ["税率", taxRatesOf(o).map(taxLabel).join(" / ")],
          ["税额", goodsTax(o) > 0 ? fmtMoney(goodsTax(o)) : "—"],
          ["发票抬头", o.buyer],
          ["销售方", o.seller],
        ]}
      />
      <div>
        <Button variant="outline" size="sm">
          下载电子发票
        </Button>
      </div>
    </DocCard>
  );
}

/* ---------- 右侧进度摘要 ---------- */

function ProgressCard({ o }: { o: SaleOrder }) {
  const statements = o.statements ?? [];
  const confirmed = statements.filter((s) => s.state === "已确认").length;
  const shipNo = o.logistics ?? o.pickupNo;
  const steps: { label: string; value: string; done: boolean }[] = [
    {
      label: "合同",
      value: o.contractNo
        ? `${o.contractNo}${o.contractState ? ` · ${o.contractState}` : ""}`
        : o.status === "negotiating"
          ? "议价中"
          : "未发起",
      done: Boolean(o.contractNo) && o.contractState !== "待签署",
    },
    {
      label: "对账",
      value:
        statements.length > 0
          ? `${confirmed}/${statements.length} 期已确认`
          : (o.reconcile ?? "未开始"),
      done: o.reconcile === "已对账" || o.reconcile === "免对账",
    },
    {
      label: "发货",
      value: shipNo
        ? o.status === "shipped"
          ? "运输中"
          : "已签收"
        : "未发货",
      done: Boolean(shipNo) && o.status !== "shipped",
    },
    {
      label: "发票",
      value: o.invoice ?? "待开票",
      done: o.invoice === "已开票" || o.invoice === "不开票",
    },
  ];
  return (
    <Card title="履约进度">
      <ol className="flex flex-col gap-3">
        {steps.map((s) => (
          <li key={s.label} className="flex items-start gap-3 text-sm">
            <span
              aria-hidden
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                s.done ? "bg-emerald-500" : "bg-border",
              )}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="truncate">{s.value}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ---------- 页面 ---------- */

export function SaleDetailPage({
  order: o,
  role,
  onBack,
}: {
  order: SaleOrder;
  role: OrderRole;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("订单商品");
  const ready: Record<Tab, boolean> = {
    订单商品: true,
    订单合同: Boolean(o.contractNo),
    对账单: Boolean(o.statements?.length || o.statementAmount || o.reconcile),
    发货单: Boolean(o.logistics || o.pickupNo),
    发票: o.invoice === "已开票",
    业务日记: true,
  };

  return (
    <div className="flex flex-col gap-4">
      <PageBar
        title="订单详情"
        order={o}
        onBack={onBack}
        extra={
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            {o.closed && (
              <Tag className="bg-muted text-muted-foreground ring-border">已结束</Tag>
            )}
            <span>下单 {o.createdAt}</span>
            <span>更新 {o.updatedAt}</span>
          </span>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex flex-col rounded-md border border-border bg-card">
          <div
            role="tablist"
            aria-label="订单详情"
            className="flex gap-1 border-b border-border px-3"
          >
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors",
                  tab === t
                    ? "border-b-2 border-[#1890ff] font-medium text-[#1890ff]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                {ready[t] && t !== "订单商品" && t !== "业务日记" && (
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-label="已生成" />
                )}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="min-h-[320px] p-5">
            {tab === "订单商品" && <GoodsTab o={o} role={role} />}
            {tab === "订单合同" && <ContractTab o={o} />}
            {tab === "对账单" && <StatementTab o={o} />}
            {tab === "发货单" && <ShipmentTab o={o} />}
            {tab === "发票" && <InvoiceTab o={o} />}
            {tab === "业务日记" && <Timeline items={o.timeline} />}
          </div>
        </section>
        <div className="flex flex-col gap-4">
          <Card title="金额">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-xs text-muted-foreground">订单金额</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {fmtMoney(saleAmount(o))}
                </dd>
              </div>
              <div className="flex items-baseline justify-between text-muted-foreground">
                <dt className="text-xs">税率</dt>
                <dd className="text-xs">{taxRatesOf(o).map(taxLabel).join(" / ")}</dd>
              </div>
              {goodsTax(o) > 0 && (
                <div className="flex items-baseline justify-between text-muted-foreground">
                  <dt className="text-xs">其中税额</dt>
                  <dd className="text-xs tabular-nums">{fmtMoney(goodsTax(o))}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between text-muted-foreground">
                <dt className="text-xs">运费</dt>
                <dd className="text-xs tabular-nums">
                  {o.freight ? fmtMoney(o.freight) : "免运费"}
                </dd>
              </div>
              {role === "provider" && (
                <div className="flex items-baseline justify-between border-t border-border pt-2 text-emerald-700">
                  <dt className="text-xs">服务收益</dt>
                  <dd className="font-medium tabular-nums">{fmtMoney(providerGain(o))}</dd>
                </div>
              )}
            </dl>
          </Card>
          <ProgressCard o={o} />
        </div>
      </div>
    </div>
  );
}
