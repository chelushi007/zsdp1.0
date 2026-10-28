"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Paperclip, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DialogField,
  DialogInput,
  PRIMARY_BTN,
  Tag,
} from "@/components/goods-list";
import {
  Card,
  INPUT_CLS,
  InfoGrid,
  OrderInfoCard,
  PageBar,
  TEXTAREA_CLS,
} from "@/components/sale-page-shared";
import {
  fmtMoney,
  orderLines,
  reconciledQty,
  saleAmount,
  statementCycles,
  type OrderLine,
  type SaleOrder,
  type Statement,
  type StatementCycle,
  type StatementLine,
  type StatementState,
} from "@/lib/orders-data";

const TODAY = "2024-10-28";

export type StatementDraft = {
  no: string;
  amount: number;
  cycle: StatementCycle;
  period: string;
  lines: StatementLine[];
  note: string;
  attachment: string;
};

const stateTone: Record<StatementState, string> = {
  待确认: "bg-amber-50 text-amber-700 ring-amber-200",
  已确认: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  有异议: "bg-red-50 text-red-700 ring-red-200",
};

export function StatementTag({ state }: { state: StatementState }) {
  return <Tag className={stateTone[state]}>{state}</Tag>;
}

export function nextStatementNo(o: SaleOrder) {
  const seq = (o.statements?.length ?? 0) + 1;
  return { seq, no: `DZ${o.id.slice(2)}-${String(seq).padStart(2, "0")}` };
}

/** 根据周期类型给出默认的周期描述：一次性为全量，按月 / 按季度取当前所属期 */
function defaultPeriod(cycle: StatementCycle) {
  const [y, m] = TODAY.split("-").map(Number);
  if (cycle === "按月") return `${y}-${String(m).padStart(2, "0")} 月度对账`;
  if (cycle === "按季度") return `${y} 年第 ${Math.ceil(m / 3)} 季度对账`;
  return `${TODAY} 一次性对账`;
}

const cycleHint: Record<StatementCycle, string> = {
  一次性: "一次性对账：按订单全部未对账数量一次对账，不分期",
  按月: "按月分期：默认带入本月未对账数量，可按实际到货调整",
  按季度: "按季度分期：默认带入本季度未对账数量，可按实际到货调整",
};

type LineRow = OrderLine & { done: number; remain: number };

function StatementHistory({
  statements,
  lines,
  onViewAttachment,
}: {
  statements: Statement[];
  lines: OrderLine[];
  onViewAttachment?: (s: Statement) => void;
}) {
  if (statements.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
        暂无对账记录，创建第一期对账单后将显示在这里
      </div>
    );
  }
  const cols =
    "56px minmax(150px,1fr) 110px minmax(150px,1.1fr) minmax(170px,1.3fr) 128px 84px minmax(150px,1.2fr)";
  return (
    <div className="overflow-x-auto rounded border border-border">
      <div className="min-w-[1040px]">
        <div
          className="grid items-center gap-x-3 bg-muted/50 px-4 py-2 text-xs text-muted-foreground"
          style={{ gridTemplateColumns: cols }}
        >
          <span>期数</span>
          <span>对账单号</span>
          <span className="text-right">对账金额</span>
          <span>对账方式</span>
          <span>对账商品</span>
          <span>创建时间</span>
          <span>状态</span>
          <span>买方反馈</span>
        </div>
        <ul className="divide-y divide-border">
          {[...statements].reverse().map((s) => (
            <li
              key={s.no}
              className="grid items-start gap-x-3 px-4 py-3 text-sm"
              style={{ gridTemplateColumns: cols }}
            >
              <span className="tabular-nums">
                {s.cycle === "一次性" ? "一次性" : `第 ${s.seq} 期`}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-xs">{s.no}</span>
                {s.attachment && (
                  <button
                    type="button"
                    onClick={() => onViewAttachment?.(s)}
                    className="flex items-center gap-1 text-xs text-[#1890ff] hover:underline"
                  >
                    <Paperclip className="size-3" />
                    <span className="truncate">{s.attachment}</span>
                  </button>
                )}
              </span>
              <span className="text-right font-medium tabular-nums">
                {fmtMoney(s.amount)}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-1.5">
                  {s.cycle && (
                    <Tag className="bg-muted text-muted-foreground ring-border">
                      {s.cycle}
                    </Tag>
                  )}
                  <span className="truncate text-xs">{s.period || "—"}</span>
                </span>
                {s.note && (
                  <span
                    className="truncate text-xs text-muted-foreground"
                    title={s.note}
                  >
                    {s.note}
                  </span>
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 text-xs">
                {s.lines?.length ? (
                  s.lines.map((l) => {
                    const line = lines.find((x) => x.code === l.code);
                    return (
                      <span
                        key={l.code}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span
                          className="truncate text-muted-foreground"
                          title={line?.name}
                        >
                          {line?.name ?? l.code}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {l.quantity.toLocaleString()} {line?.unit ?? ""}
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {s.createdAt}
              </span>
              <span>
                <StatementTag state={s.state} />
              </span>
              <span className="flex min-w-0 flex-col text-xs">
                {s.repliedAt ? (
                  <>
                    <span
                      className={cn(
                        s.state === "有异议"
                          ? "text-red-700"
                          : "text-foreground",
                      )}
                    >
                      {s.reply ??
                        (s.state === "已确认" ? "买方已确认对账" : "—")}
                    </span>
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
  );
}

/** 本期对账商品明细：展示订单总数量、已对账数量、剩余数量，本次对账数量可编辑 */
function StatementLinesEditor({
  rows,
  qty,
  onChange,
  readOnly,
}: {
  rows: LineRow[];
  qty: Record<string, string>;
  onChange: (code: string, v: string) => void;
  /** 一次性对账时数量固定为全部剩余，不可编辑 */
  readOnly?: boolean;
}) {
  const cols = "minmax(190px,1.6fr) 96px 96px 96px 132px 118px";
  const total = rows.reduce(
    (s, r) => s + (Number(qty[r.code]) || 0) * r.unitPrice,
    0,
  );
  return (
    <div className="overflow-x-auto rounded border border-border">
      <div className="min-w-[780px]">
        <div
          className="grid items-center gap-x-3 bg-muted/50 px-4 py-2 text-xs text-muted-foreground"
          style={{ gridTemplateColumns: cols }}
        >
          <span>商品</span>
          <span className="text-right">订单总数量</span>
          <span className="text-right">已对账</span>
          <span className="text-right">剩余可对账</span>
          <span className="text-right">本次对账数量</span>
          <span className="text-right">本期金额</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const n = Number(qty[r.code]) || 0;
            const over = n > r.remain;
            return (
              <li
                key={r.code}
                className="grid items-center gap-x-3 px-4 py-2.5 text-sm"
                style={{ gridTemplateColumns: cols }}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{r.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {r.spec} · ¥{" "}
                    {r.unitPrice.toLocaleString("zh-CN", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    / {r.unit}
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  {r.quantity.toLocaleString()} {r.unit}
                </span>
                <span className="text-right tabular-nums text-muted-foreground">
                  {r.done.toLocaleString()} {r.unit}
                </span>
                <span
                  className={cn(
                    "text-right tabular-nums",
                    r.remain === 0 && "text-emerald-700",
                  )}
                >
                  {r.remain.toLocaleString()} {r.unit}
                </span>
                <span className="flex items-center justify-end gap-1.5">
                  <input
                    aria-label={`${r.name} 本次对账数量`}
                    type="number"
                    min={0}
                    max={r.remain}
                    value={qty[r.code] ?? ""}
                    onChange={(e) => onChange(r.code, e.target.value)}
                    disabled={r.remain === 0 || readOnly}
                    className={cn(
                      INPUT_CLS,
                      "h-8 w-24 text-right tabular-nums disabled:bg-muted/40 disabled:text-muted-foreground",
                      readOnly && "disabled:text-foreground",
                      over && "border-red-400 focus:border-red-400",
                    )}
                  />
                  <span className="w-5 text-xs text-muted-foreground">
                    {r.unit}
                  </span>
                </span>
                <span className="flex flex-col items-end text-right tabular-nums">
                  <span>{fmtMoney(n * r.unitPrice)}</span>
                  {over && (
                    <span className="text-[11px] text-red-600">
                      超出剩余数量
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-end gap-6 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span>
            本期商品 {rows.filter((r) => (Number(qty[r.code]) || 0) > 0).length}{" "}
            / {rows.length} 项
          </span>
          <span>
            本期货款{" "}
            <span className="text-sm font-semibold text-foreground">
              {fmtMoney(total)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** 对账进度：各商品已对账 / 总数量 */
function ProgressList({ rows }: { rows: LineRow[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => {
        const pct = r.quantity ? Math.round((r.done / r.quantity) * 100) : 0;
        return (
          <li key={r.code} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate" title={r.name}>
                {r.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {r.done.toLocaleString()} / {r.quantity.toLocaleString()}{" "}
                {r.unit}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct >= 100 ? "bg-emerald-500" : "bg-[#1890ff]",
                )}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SaleReconcilePage({
  order: o,
  onBack,
  onCreate,
}: {
  order: SaleOrder;
  onBack: () => void;
  onCreate: (draft: StatementDraft) => void;
}) {
  const history = o.statements ?? [];
  const latest = history[history.length - 1];
  const canCreate =
    o.status === "toReconcile" && (!latest || latest.state !== "待确认");
  const { seq, no } = nextStatementNo(o);
  const orderAmount = saleAmount(o);
  const lines = orderLines(o);

  const rows: LineRow[] = lines.map((l) => {
    const done = reconciledQty(o, l.code);
    return { ...l, done, remain: Math.max(0, l.quantity - done) };
  });
  const allDone = rows.every((r) => r.remain === 0);

  const [creating, setCreating] = useState(
    canCreate &&
      !allDone &&
      (!latest || latest.state === "有异议" || history.length > 0),
  );
  const [cycle, setCycle] = useState<StatementCycle>(latest?.cycle ?? "一次性");
  const [period, setPeriod] = useState(
    defaultPeriod(latest?.cycle ?? "一次性"),
  );
  const [qty, setQty] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.code, String(r.remain)])),
  );
  const [freightIncluded, setFreightIncluded] = useState(seq === 1 || allDone);
  const oneOff = cycle === "一次性";
  /** 已发出过分期对账单后，对账方式随首期固定，不可再切换 */
  const cycleLocked = history.length > 0 && !!latest?.cycle;
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState("");

  const draftLines: StatementLine[] = rows
    .map((r) => ({ code: r.code, quantity: Number(qty[r.code]) || 0 }))
    .filter((l) => l.quantity > 0);
  const goodsTotal = rows.reduce(
    (s, r) => s + (Number(qty[r.code]) || 0) * r.unitPrice,
    0,
  );
  const freightPart = freightIncluded ? o.freight : 0;
  const amountNum = goodsTotal + freightPart;
  const overflow = rows.some((r) => (Number(qty[r.code]) || 0) > r.remain);
  const valid =
    draftLines.length > 0 && amountNum > 0 && period.trim() && !overflow;
  const isLastPeriod = rows.every(
    (r) => (Number(qty[r.code]) || 0) >= r.remain,
  );

  const fillRemain = () =>
    setQty(Object.fromEntries(rows.map((r) => [r.code, String(r.remain)])));

  const changeCycle = (c: StatementCycle) => {
    if (cycleLocked) return;
    setCycle(c);
    setPeriod(defaultPeriod(c));
    if (c === "一次性") {
      fillRemain();
      setFreightIncluded(o.freight > 0);
    }
  };

  const resetForm = () => {
    const c = latest?.cycle ?? "一次性";
    setCycle(c);
    setPeriod(defaultPeriod(c));
    setQty(Object.fromEntries(rows.map((r) => [r.code, String(r.remain)])));
    setFreightIncluded(seq === 1);
    setNote("");
    setAttachment("");
  };

  const confirmed = history.filter((s) => s.state === "已确认");
  const confirmedAmount = confirmed.reduce((s, x) => s + x.amount, 0);
  const summaryRows: [string, React.ReactNode][] = [
    ["对账状态", o.reconcile ?? "—"],
    ["对账方式", latest?.cycle ?? (creating ? cycle : "—")],
    ["累计对账期数", `${history.length} 期`],
    ["买方已确认", `${confirmed.length} 期`],
    [
      "最新对账单",
      latest ? (
        <span key="n" className="font-mono text-xs">
          {latest.no}
        </span>
      ) : (
        "—"
      ),
    ],
    ["最新状态", latest ? <StatementTag key="s" state={latest.state} /> : "—"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageBar
        title="对账"
        order={o}
        onBack={onBack}
        extra={
          !creating && canCreate && !allDone ? (
            <Button
              size="sm"
              className={PRIMARY_BTN}
              onClick={() => {
                resetForm();
                setCreating(true);
              }}
            >
              <Plus data-icon="inline-start" />
              {oneOff && seq === 1 ? "创建对账单" : `创建第 ${seq} 期对账单`}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <OrderInfoCard order={o} />

          {creating && (
            <Card
              title={
                oneOff ? "创建对账单 · 一次性对账" : `创建对账单 · 第 ${seq} 期`
              }
              extra={
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {confirmed.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="size-3.5" />前 {confirmed.length}{" "}
                      期已确认
                    </span>
                  )}
                  <span className="font-mono">{no}</span>
                </span>
              }
            >
              {latest?.state === "有异议" && (
                <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <FileText className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    上一期（{latest.no}）买方提出异议：{latest.reply}
                    。请根据异议调整后重新创建对账单。
                  </span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <DialogField
                  label="对账方式"
                  required
                  hint={
                    cycleLocked
                      ? `首期已按「${cycle}」对账，后续各期沿用该方式`
                      : cycleHint[cycle]
                  }
                >
                  <div
                    role="radiogroup"
                    aria-label="对账方式"
                    className="grid grid-cols-3 gap-2"
                  >
                    {statementCycles.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={cycle === c}
                        disabled={cycleLocked && cycle !== c}
                        onClick={() => changeCycle(c)}
                        className={cn(
                          "h-9 rounded border text-sm transition-colors",
                          cycle === c
                            ? "border-[#1890ff] bg-[#1890ff]/5 font-medium text-[#1890ff]"
                            : "border-border bg-background text-muted-foreground hover:border-[#1890ff]/50 hover:text-foreground",
                          cycleLocked &&
                            cycle !== c &&
                            "cursor-not-allowed opacity-50 hover:border-border hover:text-muted-foreground",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </DialogField>
                {oneOff ? (
                  <DialogField
                    label="对账范围"
                    hint="一次性对账覆盖订单全部商品数量，无需分期"
                  >
                    <div className="flex h-9 items-center justify-between rounded border border-border bg-muted/40 px-3 text-sm">
                      <span className="text-xs text-muted-foreground">
                        全部未对账数量
                      </span>
                      <span className="tabular-nums">{period}</span>
                    </div>
                  </DialogField>
                ) : (
                  <DialogField
                    label="所属期 / 范围"
                    required
                    hint="按所选方式自动带出，可手动修改"
                  >
                    <DialogInput
                      label="所属期"
                      value={period}
                      onChange={setPeriod}
                    />
                  </DialogField>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    商品明细{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {oneOff
                        ? `（${rows.length} 项，一次性对账按全部剩余数量）`
                        : `（${rows.length} 项，本次对账数量可编辑）`}
                    </span>
                  </span>
                  {!oneOff && (
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        className="text-[#1890ff] hover:underline"
                        onClick={fillRemain}
                      >
                        填入全部剩余
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setQty(
                            Object.fromEntries(rows.map((r) => [r.code, "0"])),
                          )
                        }
                      >
                        清零
                      </button>
                    </div>
                  )}
                </div>
                <StatementLinesEditor
                  rows={rows}
                  qty={qty}
                  readOnly={oneOff}
                  onChange={(code, v) => setQty((q) => ({ ...q, [code]: v }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DialogField
                  label="运费"
                  hint={
                    !o.freight
                      ? "本订单免运费"
                      : oneOff
                        ? "一次性对账将运费一并计入"
                        : "运费只计入一期，默认首期收取，末期可勾选补收"
                  }
                >
                  <label
                    className={cn(
                      INPUT_CLS,
                      "flex cursor-pointer items-center justify-between gap-2",
                      !o.freight &&
                        "cursor-default bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-[#1890ff]"
                        checked={freightIncluded && o.freight > 0}
                        disabled={!o.freight || oneOff}
                        onChange={(e) => setFreightIncluded(e.target.checked)}
                      />
                      本期计入运费
                    </span>
                    <span className="tabular-nums">
                      {o.freight ? fmtMoney(o.freight) : "¥ 0.00"}
                    </span>
                  </label>
                </DialogField>
                <DialogField
                  label={oneOff ? "对账金额" : "本期对账金额"}
                  hint={`货款 ${fmtMoney(goodsTotal)}${freightPart ? ` + 运费 ${fmtMoney(freightPart)}` : ""}`}
                >
                  <div className="flex h-9 items-center justify-between rounded border border-border bg-muted/40 px-3 text-sm">
                    <span className="text-xs text-muted-foreground">
                      自动计算
                    </span>
                    <span className="font-semibold tabular-nums">
                      {fmtMoney(amountNum)}
                    </span>
                  </div>
                </DialogField>
                <DialogField
                  label="对账附件"
                  hint="对账明细表、签收单等，支持 PDF / XLSX / 图片"
                >
                  {attachment ? (
                    <div className="flex h-9 items-center justify-between rounded border border-border bg-background px-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{attachment}</span>
                      </span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setAttachment("")}
                      >
                        移除
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAttachment(`${no}-对账明细.xlsx`)}
                      className={cn(
                        INPUT_CLS,
                        "flex items-center justify-center gap-2 border-dashed text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]",
                      )}
                    >
                      <Upload className="size-4" />
                      上传附件
                    </button>
                  )}
                </DialogField>
                <DialogField label="订单金额">
                  <div className="flex h-9 items-center justify-between rounded border border-border bg-muted/40 px-3 text-sm tabular-nums">
                    <span className="text-xs text-muted-foreground">
                      含运费
                    </span>
                    <span>{fmtMoney(orderAmount)}</span>
                  </div>
                </DialogField>
                <div className="sm:col-span-2">
                  <DialogField label="对账说明">
                    <textarea
                      aria-label="对账说明"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="说明本期对账的计算依据、数量差异、运费承担等"
                      className={TEXTAREA_CLS}
                    />
                  </DialogField>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  {overflow ? (
                    <span className="text-red-600">
                      存在超出剩余可对账数量的商品，请调整
                    </span>
                  ) : oneOff ? (
                    "一次性对账：发送后订单商品全部对账完毕，不再分期"
                  ) : isLastPeriod ? (
                    "本期对账后订单商品将全部对账完毕"
                  ) : (
                    "本期对账后仍有剩余数量，可继续创建下一期"
                  )}
                </span>
                <span className="flex items-center gap-2">
                  {history.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreating(false)}
                    >
                      取消
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className={PRIMARY_BTN}
                    disabled={!valid}
                    onClick={() => {
                      onCreate({
                        no,
                        amount: amountNum,
                        cycle,
                        period: period.trim(),
                        lines: draftLines,
                        note: note.trim(),
                        attachment,
                      });
                      setCreating(false);
                    }}
                  >
                    {oneOff
                      ? "发送对账单给买方"
                      : `发送第 ${seq} 期对账单给买方`}
                  </Button>
                </span>
              </div>
            </Card>
          )}

          <Card
            title="历史对账记录"
            extra={
              <span className="text-xs text-muted-foreground">
                共 {history.length} 期 · 买方已确认 {confirmed.length} 期 ·
                已确认金额 {fmtMoney(confirmedAmount)}
              </span>
            }
          >
            <StatementHistory statements={history} lines={lines} />
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card title="对账摘要">
            <InfoGrid cols={2} rows={summaryRows} />
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">订单金额</span>
                <span className="text-sm tabular-nums">
                  {fmtMoney(orderAmount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">
                  已确认对账金额
                </span>
                <span className="text-sm tabular-nums">
                  {fmtMoney(confirmedAmount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">
                  {creating
                    ? oneOff
                      ? "本次对账金额"
                      : `本期（第 ${seq} 期）对账金额`
                    : "最新对账金额"}
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {fmtMoney(creating ? amountNum : (latest?.amount ?? 0))}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <span className="text-xs font-medium">商品对账进度</span>
              <ProgressList rows={rows} />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {allDone
                ? "订单全部商品均已完成对账。"
                : canCreate
                  ? "对账单发送后买方可「确认对账」或「提出异议」。按月 / 按季度分期对账时，每期只对本期数量，买方确认后可继续创建下一期。"
                  : latest?.state === "待确认"
                    ? "最新一期对账单正等待买方确认，确认或提出异议后可继续操作。"
                    : "当前订单不在对账环节，仅可查看历史对账记录。"}
            </p>
            <Button variant="outline" onClick={onBack}>
              返回列表
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
