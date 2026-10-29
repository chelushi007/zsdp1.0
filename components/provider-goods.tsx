"use client";

import { Fragment, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shop-form-fields";
import {
  ActionLink,
  DescItem,
  DetailHeader,
  DetailSection,
  DialogField,
  DialogInput,
  GroupCode,
  GroupName,
  Modal,
  PRIMARY_BTN,
  StatCard,
  StatusSummary,
  Tag,
  bizMeta,
  fmtPrice,
  round2,
  type BizType,
  type SpecGroup,
} from "@/components/goods-list";
import {
  updateEntrust,
  useEntrusts,
  type EntrustRecord,
} from "@/lib/entrust-store";

/** 受托商品状态：待受理 / 已受理待上架 / 运营中 / 已下架 / 已退回 */
type EntrustStatus = "pending" | "accepted" | "listed" | "off" | "returned";

type MarkupMode = "percent" | "fixed";

type ApprovalStatus = "pending" | "approved";

/** 服务商上架记录：在委托价基础上加价对外销售 / 出租；提交后需平台审批，审批通过前可编辑 */
type ProviderListing = {
  id: string;
  /** 上架单号：同一次上架的多个规格共用 */
  batch: string;
  approval: ApprovalStatus;
  type: BizType;
  status: "on" | "off";
  basePrice: number;
  markupMode: MarkupMode;
  markupValue: number;
  price: number;
  period?: "天" | "月";
  deposit?: number;
  minDays?: number;
  minOrder?: number;
  quantity: number;
  used: number;
  listedAt: string;
};

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 受托商品：一条记录只对应一种委托方式（出售或出租），同一商品同时委托租售时拆为两条 */
type EntrustedGoods = {
  id: string;
  code: string;
  name: string;
  spec: string;
  subCategory: string;
  unit: string;
  seller: string;
  type: BizType;
  quantity: number;
  /** 商家底价：出售按单位计，出租按单位 / 天计 */
  basePrice: number;
  /** 出租押金（仅出租） */
  deposit?: number;
  /** 商家发起委托的时间 */
  entrustedAt: string;
  /** 服务商受理的时间，未受理 / 已退回时为空 */
  acceptedAt?: string;
  status: EntrustStatus;
  statusNote?: string;
  listings: ProviderListing[];
  updatedAt: string;
  /** 来源于商家侧实时发起的委托单时记录其单号，受理 / 退回需回写 */
  recordId?: string;
};

/** 当前登录的服务商 */
const CURRENT_PROVIDER = "华建周转材料服务有限公司";

/** 将商家侧发起的委托单拆为受托商品行：每种委托方式 × 每个规格一行 */
function rowsFromRecord(r: EntrustRecord): EntrustedGoods[] {
  return r.types.flatMap((type) =>
    r.lines.map((l) => ({
      id: `${r.id}-${type}-${l.code}`,
      recordId: r.id,
      code: l.code,
      name: r.goodsName,
      spec: l.spec,
      subCategory: r.subCategory,
      unit: r.unit,
      seller: r.shop,
      type,
      quantity: l.quantity,
      basePrice: (type === "sale" ? l.salePrice : l.rentPrice) ?? 0,
      deposit: type === "rent" ? l.rentDeposit : undefined,
      entrustedAt: `${r.createdAt} 00:00`,
      acceptedAt: r.acceptedAt,
      status: r.status,
      statusNote: r.statusNote,
      listings: [],
      updatedAt: r.acceptedAt ?? `${r.createdAt} 00:00`,
    })),
  );
}

/** 合并本地状态与委托单：受理 / 退回以委托单为准，上架后的运营状态以本地为准 */
function mergeRows(local: EntrustedGoods[], records: EntrustRecord[]) {
  const derived = records
    .filter((r) => !r.seeded && r.provider === CURRENT_PROVIDER)
    .flatMap(rowsFromRecord);
  const localMap = new Map(local.map((g) => [g.id, g]));
  const merged = derived.map((d) => {
    const l = localMap.get(d.id);
    if (!l) return d;
    const keepLocal =
      d.status === "accepted" && (l.status === "listed" || l.status === "off");
    return {
      ...l,
      quantity: d.quantity,
      basePrice: d.basePrice,
      deposit: d.deposit,
      status: keepLocal ? l.status : d.status,
      statusNote: keepLocal ? l.statusNote : d.statusNote,
      acceptedAt: d.acceptedAt ?? l.acceptedAt,
    };
  });
  return [...merged, ...local.filter((g) => !g.recordId)];
}

const seed: EntrustedGoods[] = [
  {
    id: "E2024090001",
    code: "G2024040003",
    name: "钢支撑 Φ609×16 基坑内支撑",
    spec: "9m 标准节",
    subCategory: "支护类",
    unit: "吨",
    seller: "上海松江周转材料有限公司",
    type: "rent",
    quantity: 120,
    basePrice: 10,
    deposit: 3000,
    entrustedAt: "2024-09-18",
    acceptedAt: "2024-09-19 09:40",
    status: "listed",
    listings: [
      {
        id: "PL240920001",

        batch: "PL240920001",

        approval: "approved",
        listedAt: "2024-09-20 10:30",
        type: "rent",
        status: "on",
        basePrice: 10,
        markupMode: "percent",
        markupValue: 15,
        price: 11.5,
        period: "天",
        deposit: 3000,
        minDays: 180,
        quantity: 100,
        used: 62,
      },
    ],
    updatedAt: "2024-10-21 14:30",
  },
  {
    id: "E2024090011",
    code: "G2024040010",
    name: "钢支撑 Φ609×16 基坑内支撑",
    spec: "12m 标准节",
    subCategory: "支护类",
    unit: "吨",
    seller: "上海松江周转材料有限公司",
    type: "rent",
    quantity: 80,
    basePrice: 10,
    deposit: 3000,
    entrustedAt: "2024-09-18",
    acceptedAt: "2024-09-19 09:40",
    status: "listed",
    listings: [
      {
        id: "PL240920002",

        batch: "PL240920002",

        approval: "approved",
        listedAt: "2024-09-20 10:35",
        type: "rent",
        status: "on",
        basePrice: 10,
        markupMode: "percent",
        markupValue: 15,
        price: 11.5,
        period: "天",
        deposit: 3000,
        minDays: 180,
        quantity: 80,
        used: 40,
      },
    ],
    updatedAt: "2024-10-21 14:30",
  },
  {
    id: "E2024090012",
    code: "G2024040011",
    name: "钢支撑 Φ609×16 基坑内支撑",
    spec: "6m 调节节",
    subCategory: "支护类",
    unit: "吨",
    seller: "上海松江周转材料有限公司",
    type: "rent",
    quantity: 30,
    basePrice: 10,
    deposit: 3000,
    entrustedAt: "2024-09-18",
    acceptedAt: "2024-09-19 09:40",
    status: "accepted",
    listings: [],
    updatedAt: "2024-10-12 09:20",
  },
  {
    id: "E2024090002",
    code: "G2024080105",
    name: "组合式钢模板 300×1500 平模",
    spec: "Q235 / 5mm 面板",
    subCategory: "模板类",
    unit: "块",
    seller: "苏州恒昌建筑器材租赁",
    type: "sale",
    quantity: 1500,
    basePrice: 175,
    entrustedAt: "2024-09-25",
    acceptedAt: "2024-09-26 11:00",
    status: "listed",
    listings: [
      {
        id: "PL240928001",

        batch: "PL240928001",

        approval: "pending",
        listedAt: "2024-09-28 14:05",
        type: "sale",
        status: "on",
        basePrice: 175,
        markupMode: "percent",
        markupValue: 12,
        price: 196,
        minOrder: 50,
        quantity: 1200,
        used: 340,
      },
    ],
    updatedAt: "2024-10-22 11:20",
  },
  {
    id: "E2024100002",
    code: "G2024070006",
    name: "H 型钢 400×200×8×13",
    spec: "Q235B / 12m",
    subCategory: "型材类",
    unit: "吨",
    seller: "上海松江周转材料有限公司",
    type: "sale",
    quantity: 80,
    basePrice: 4100,
    entrustedAt: "2024-10-26",
    status: "pending",
    listings: [],
    updatedAt: "2024-10-26 10:12",
  },
  {
    id: "E2024100003",
    code: "G2024070006",
    name: "H 型钢 400×200×8×13",
    spec: "Q235B / 12m",
    subCategory: "型材类",
    unit: "吨",
    seller: "上海松江周转材料有限公司",
    type: "rent",
    quantity: 80,
    basePrice: 8.5,
    deposit: 2500,
    entrustedAt: "2024-10-26",
    status: "pending",
    listings: [],
    updatedAt: "2024-10-26 10:12",
  },
  {
    id: "E2024100004",
    code: "G2024090101",
    name: "盘扣式脚手架 横杆 1.2m",
    spec: "Q355 / 热镀锌",
    subCategory: "脚手架类",
    unit: "根",
    seller: "苏州恒昌建筑器材租赁",
    type: "rent",
    quantity: 20000,
    basePrice: 0.02,
    deposit: 25,
    entrustedAt: "2024-10-24",
    acceptedAt: "2024-10-25 09:05",
    status: "accepted",
    listings: [],
    updatedAt: "2024-10-25 09:05",
  },
  {
    id: "E2024080005",
    code: "G2024060201",
    name: "装配式围挡 2.5m 高 彩钢",
    spec: "2.5m×2.0m / 片",
    subCategory: "拼装类",
    unit: "片",
    seller: "杭州城建临设科技有限公司",
    type: "sale",
    quantity: 600,
    basePrice: 320,
    entrustedAt: "2024-08-02",
    acceptedAt: "2024-08-03 15:20",
    status: "off",
    statusNote: "商家调整供货价，暂停销售",
    listings: [
      {
        id: "PL240805001",

        batch: "PL240805001",

        approval: "approved",
        listedAt: "2024-08-05 09:15",
        type: "sale",
        status: "off",
        basePrice: 320,
        markupMode: "fixed",
        markupValue: 45,
        price: 365,
        minOrder: 20,
        quantity: 600,
        used: 210,
      },
    ],
    updatedAt: "2024-10-02 08:50",
  },
  {
    id: "E2024070006",
    code: "G2024050301",
    name: "打包箱式活动房 3×6m 标准箱",
    spec: "含门窗 / 不含电",
    subCategory: "房屋建筑类",
    unit: "个",
    seller: "南京鼎立集成房屋有限公司",
    type: "sale",
    quantity: 30,
    basePrice: 15800,
    entrustedAt: "2024-07-15",
    status: "returned",
    statusNote: "商家底价高于市场价，暂无法代理",
    listings: [],
    updatedAt: "2024-07-16 15:40",
  },
  {
    id: "E2024070007",
    code: "G2024050301",
    name: "打包箱式活动房 3×6m 标准箱",
    spec: "含门窗 / 不含电",
    subCategory: "房屋建筑类",
    unit: "个",
    seller: "南京鼎立集成房屋有限公司",
    type: "rent",
    quantity: 30,
    basePrice: 30,
    deposit: 5000,
    entrustedAt: "2024-07-15",
    status: "returned",
    statusNote: "商家底价高于市场价，暂无法代理",
    listings: [],
    updatedAt: "2024-07-16 15:40",
  },
];

const statusOrder: EntrustStatus[] = [
  "pending",
  "accepted",
  "listed",
  "off",
  "returned",
];

const statusMeta: Record<
  EntrustStatus,
  { label: string; className: string; countClass: string }
> = {
  pending: {
    label: "待受理",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    countClass: "text-amber-700",
  },
  accepted: {
    label: "待上架",
    className: "bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30",
    countClass: "text-[#1890ff]",
  },
  listed: {
    label: "运营中",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    countClass: "text-emerald-700",
  },
  off: {
    label: "已下架",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
    countClass: "text-gray-600",
  },
  returned: {
    label: "已退回",
    className: "bg-red-50 text-red-600 ring-red-200",
    countClass: "text-red-600",
  },
};

/** 委托单分组：同一商品的出售 / 出租分别成组，组内为各规格 */
type OrderGroup = SpecGroup<EntrustedGoods> & { key: string; type: BizType };
function orderKey(g: Pick<EntrustedGoods, "name" | "type">) {
  return `${g.name}__${g.type}`;
}
function groupOrders(list: EntrustedGoods[]): OrderGroup[] {
  const groups: OrderGroup[] = [];
  for (const item of list) {
    const key = orderKey(item);
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(item);
    else groups.push({ key, name: item.name, type: item.type, items: [item] });
  }
  return groups;
}

/** 受理状态：待受理 / 已退回 视为未受理，其余均为已受理 */
function isAccepted(g: EntrustedGoods) {
  return g.status === "accepted" || g.status === "listed" || g.status === "off";
}

const acceptMeta = {
  accepted: {
    label: "已受理",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  pending: {
    label: "未受理",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
};

/** 运营状态：仅已上架过的商品有运营状态（运营中 / 已下架），待上架不单独标识 */
function operationMeta(g: EntrustedGoods) {
  if (g.status === "listed") return statusMeta.listed;
  if (g.status === "off") return statusMeta.off;
  return null;
}

/** 上架中记录占用的受托数量 */
function lockedQty(g: EntrustedGoods) {
  return g.listings
    .filter((l) => l.status === "on")
    .reduce((s, l) => s + l.quantity, 0);
}

function priceSuffix(g: EntrustedGoods) {
  return g.type === "sale" ? `/ ${g.unit}` : `/ ${g.unit} / 天`;
}


function GoodsSummary({ goods }: { goods: EntrustedGoods }) {
  return (
    <div className="flex items-center gap-3 rounded bg-muted/40 px-3 py-2 text-sm">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{goods.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {goods.code} · {goods.spec} · 委托方：{goods.seller}
        </span>
      </span>
      <Tag className={bizMeta[goods.type].className}>
        {bizMeta[goods.type].label}
      </Tag>
      <span className="shrink-0 text-xs text-muted-foreground">
        受托{" "}
        <span className="tabular-nums text-foreground">
          {goods.quantity.toLocaleString()}
        </span>{" "}
        {goods.unit}
      </span>
    </div>
  );
}

/** 委托价行：展示商家给出的委托价，服务商不可修改 */
function BasePriceRow({ goods }: { goods: EntrustedGoods }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded border border-dashed border-border px-3 py-2 text-xs">
      <span>
        <span className="text-muted-foreground">
          {bizMeta[goods.type].label}委托价{" "}
        </span>
        <span className="tabular-nums">
          ¥ {fmtPrice(goods.basePrice)} {priceSuffix(goods)}
        </span>
      </span>
      {goods.type === "rent" && (
        <span>
          <span className="text-muted-foreground">押金 </span>
          <span className="tabular-nums">
            ¥ {fmtPrice(goods.deposit ?? 0)} / {goods.unit}
          </span>
        </span>
      )}
    </div>
  );
}

/** 受理：确认接受商家委托 */
function AcceptDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: EntrustedGoods;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="受理委托"
      titleId="accept-dialog-title"
      width="max-w-[480px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" className={PRIMARY_BTN} onClick={onConfirm}>
            确认受理
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />
      <BasePriceRow goods={goods} />
      <p className="text-sm leading-relaxed text-muted-foreground">
        受理后该商品进入「待上架」，可在委托价基础上加价上架
        {bizMeta[goods.type].label}，上架数量合计不得超过受托数量{" "}
        {goods.quantity.toLocaleString()} {goods.unit}
        。加价差额为您的服务收益，委托价部分结算给委托方。
      </p>
    </Modal>
  );
}

const RETURN_REASONS = [
  "底价高于市场价",
  "品类不在服务范围",
  "仓储 / 运力不足",
  "资料不全",
  "其他",
];

/** 退回：拒绝委托并说明原因 */
function ReturnDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: EntrustedGoods;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal
      title="退回委托"
      titleId="return-dialog-title"
      width="max-w-[460px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            className="bg-red-600 text-white hover:bg-red-600/90"
            disabled={!reason}
            onClick={() => onConfirm(note ? `${reason}：${note}` : reason)}
          >
            确认退回
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle className="size-4" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          退回后「{goods.name}」的委托关系终止，委托方 {goods.seller}{" "}
          将收到退回原因。已上架记录将同步下架。
        </p>
      </div>
      <DialogField label="退回原因" required>
        <Select
          label="退回原因"
          placeholder="请选择原因"
          value={reason}
          options={RETURN_REASONS}
          onChange={setReason}
        />
      </DialogField>
      <DialogField label="补充���明">
        <DialogInput
          label="补充说明"
          value={note}
          onChange={setNote}
          placeholder="选填，将同步给委托方"
        />
      </DialogField>
    </Modal>
  );
}

type ListDraftLine = {
  on: boolean;
  markupValue: string;
  quantity: string;
  minOrder: string;
};

function markupPrice(base: number, mode: MarkupMode, v: string) {
  const n = Number(v);
  if (v === "" || n < 0) return base;
  return round2(mode === "percent" ? base * (1 + n / 100) : base + n);
}

/** 上架：以整个受托商品为单位生成一张上架单，引用委托明细按规格分别加价、定量；提交后待平台审批 */
function ListDialog({
  items,
  onClose,
  onConfirm,
}: {
  items: EntrustedGoods[];
  onClose: () => void;
  onConfirm: (created: { id: string; listing: ProviderListing }[]) => void;
}) {
  const head = items[0];
  const type = head.type;
  const relist = items.every((g) => g.status === "off");
  const [markupMode, setMarkupMode] = useState<MarkupMode>("percent");
  const [minDays, setMinDays] = useState("");
  const [lines, setLines] = useState<Record<string, ListDraftLine>>(() =>
    Object.fromEntries(
      items.map((g) => {
        const available = g.quantity - lockedQty(g);
        return [
          g.id,
          {
            on: available > 0,
            markupValue: "",
            quantity: available > 0 ? String(available) : "",
            minOrder: "",
          },
        ];
      }),
    ),
  );
  const setLine = (id: string, patch: Partial<ListDraftLine>) =>
    setLines((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  const allOn = items.every((g) => lines[g.id].on);
  const toggleAll = () =>
    setLines((m) =>
      Object.fromEntries(
        Object.entries(m).map(([c, d]) => [c, { ...d, on: !allOn }]),
      ),
    );

  const lineState = items.map((g) => {
    const d = lines[g.id];
    const available = g.quantity - lockedQty(g);
    const qty = Number(d.quantity);
    const qtyOk =
      !d.on ||
      (d.quantity !== "" && Number.isInteger(qty) && qty > 0 && qty <= available);
    const markupOk = !d.on || (d.markupValue !== "" && Number(d.markupValue) >= 0);
    const price = markupPrice(g.basePrice, markupMode, d.markupValue);
    const profit = round2(price - g.basePrice);
    return { g, d, available, qty, qtyOk, markupOk, price, profit };
  });
  const included = lineState.filter((x) => x.d.on);
  const ok =
    included.length > 0 &&
    lineState.every((x) => x.qtyOk && x.markupOk) &&
    (type === "sale" || Number(minDays) > 0);
  const totalQty = included.reduce((s, x) => s + x.qty, 0);
  const totalProfit = included.reduce((s, x) => s + x.profit * x.qty, 0);

  const submit = () => {
    if (!ok) return;
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const batches = new Set(items.flatMap((g) => g.listings.map((l) => l.batch)));
    const batch = `PS${stamp}${String(batches.size + 1).padStart(3, "0")}`;
    onConfirm(
      included.map(({ g, d, qty, price }, i) => {
        const common = {
          id: `PL${stamp}${String(batches.size + 1).padStart(3, "0")}${String(i + 1).padStart(2, "0")}`,
          batch,
          approval: "pending" as const,
          listedAt: nowStamp(),
          type,
          status: "on" as const,
          basePrice: g.basePrice,
          markupMode,
          markupValue: Number(d.markupValue),
          price,
          quantity: qty,
          used: 0,
        };
        const listing: ProviderListing =
          type === "sale"
            ? { ...common, minOrder: d.minOrder ? Number(d.minOrder) : undefined }
            : { ...common, period: "天", deposit: g.deposit, minDays: Number(minDays) };
        return { id: g.id, listing };
      }),
    );
  };

  const unitSuffix = priceSuffix(head);
  const cols = `24px minmax(130px,1fr) 100px 120px minmax(130px,1fr) 120px${type === "sale" ? " 110px" : ""}`;

  return (
    <Modal
      title={relist ? "重新上架" : "加价上架"}
      titleId="provider-list-dialog-title"
      width="max-w-[900px]"
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-muted-foreground">
            {included.length > 0
              ? `将生成 1 张上架单：${included.length} 个规格共 ${totalQty.toLocaleString()} ${head.unit}，预计服务收益 ¥ ${fmtPrice(round2(totalProfit))}；提交后待平台审批`
              : "上架以整个受托商品为单位，按规格分别加价、定量"}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            className={PRIMARY_BTN}
            disabled={!ok}
            onClick={submit}
          >
            提交上架
          </Button>
        </>
      }
    >
      <div className="grid gap-3 rounded bg-muted/40 px-3 py-2 text-xs sm:grid-cols-5">
        <span className="flex min-w-0 flex-col gap-0.5 sm:col-span-2">
          <span className="text-muted-foreground">商品</span>
          <span className="truncate font-medium" title={head.name}>
            {head.name}
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-muted-foreground">委托方</span>
          <span className="truncate" title={head.seller}>
            {head.seller}
          </span>
        </span>
        <span className="flex flex-col items-start gap-0.5">
          <span className="text-muted-foreground">租售方式</span>
          <Tag className={bizMeta[type].className}>{bizMeta[type].label}</Tag>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">规格 / 单位</span>
          <span>
            {items.length} 个 · {head.unit}
          </span>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="加价方式" required hint="上架单内全部规格采用同一加价方式">
          <div
            role="radiogroup"
            aria-label="加价方式"
            className="flex h-9 items-center gap-4 text-sm"
          >
            {(
              [
                ["percent", "按比例"],
                ["fixed", "固定金额"],
              ] as [MarkupMode, string][]
            ).map(([m, label]) => (
              <label key={m} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="markup-mode"
                  checked={markupMode === m}
                  onChange={() => setMarkupMode(m)}
                  className="accent-[#1890ff]"
                />
                {label}
              </label>
            ))}
          </div>
        </DialogField>
        {type === "rent" && (
          <DialogField label="最短租期" required hint="押金按委托方约定收取，不参与加价">
            <DialogInput
              label="最短租期"
              type="number"
              value={minDays}
              onChange={setMinDays}
              placeholder="0"
              suffix="天"
              invalid={minDays !== "" && Number(minDays) <= 0}
            />
          </DialogField>
        )}
      </div>

      <DialogField
        label="上架明细"
        required
        hint={`引用委托明细，勾选需要上架的规格并分别填写加价与数量；对外价 = 委托价 + 加价，差额为服务收益。已选 ${included.length} / ${items.length} 个规格`}
      >
        <div className="overflow-x-auto rounded border border-border">
          <div
            className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: cols }}
          >
            <input
              type="checkbox"
              aria-label={allOn ? "取消全选规格" : "全选规格"}
              checked={allOn}
              onChange={toggleAll}
              className="accent-[#1890ff]"
            />
            <span>规格型号</span>
            <span>委托价</span>
            <span>{markupMode === "percent" ? "加价比例" : "加价金额"}</span>
            <span>{type === "sale" ? "对外售价" : "对外租金"}</span>
            <span>上架数量</span>
            {type === "sale" && <span>起订量</span>}
          </div>
          {lineState.map(({ g, d, available, qtyOk, markupOk, price, profit }) => (
            <div
              key={g.id}
              className={cn(
                "grid items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0",
                !d.on && "text-muted-foreground",
              )}
              style={{ gridTemplateColumns: cols }}
            >
              <input
                type="checkbox"
                aria-label={`上架 ${g.spec}`}
                checked={d.on}
                disabled={available <= 0}
                onChange={(e) => setLine(g.id, { on: e.target.checked })}
                className="accent-[#1890ff]"
              />
              <span className="flex min-w-0 flex-col leading-4">
                <span className="truncate font-medium" title={g.spec}>
                  {g.spec}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {g.code} · 可上架 {available.toLocaleString()} {g.unit}
                </span>
              </span>
              <span className="flex flex-col text-xs leading-4 tabular-nums">
                <span>¥ {fmtPrice(g.basePrice)}</span>
                <span className="text-[11px] text-muted-foreground">{unitSuffix}</span>
              </span>
              <DialogInput
                label={`${g.spec} 加价`}
                type="number"
                value={d.markupValue}
                onChange={(v) => setLine(g.id, { markupValue: v })}
                placeholder="0"
                prefix={markupMode === "fixed" ? "+ ¥" : "+"}
                suffix={markupMode === "percent" ? "%" : undefined}
                invalid={!markupOk}
                disabled={!d.on}
              />
              <span
                className={cn(
                  "flex h-9 flex-col justify-center rounded border px-2 text-xs leading-4 tabular-nums",
                  d.on
                    ? "border-[#1890ff]/40 bg-[#1890ff]/5"
                    : "border-border bg-muted/40",
                )}
              >
                <span className={cn("text-sm font-medium", d.on && "text-[#1890ff]")}>
                  ¥ {fmtPrice(price)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  收益 ¥ {fmtPrice(profit)} {unitSuffix}
                </span>
              </span>
              <DialogInput
                label={`${g.spec} 上架数量`}
                type="number"
                value={d.quantity}
                onChange={(v) => setLine(g.id, { quantity: v })}
                placeholder="0"
                suffix={g.unit}
                invalid={!qtyOk}
                disabled={!d.on}
              />
              {type === "sale" && (
                <DialogInput
                  label={`${g.spec} 起订量`}
                  type="number"
                  value={d.minOrder}
                  onChange={(v) => setLine(g.id, { minOrder: v })}
                  placeholder="不限"
                  suffix={g.unit}
                  disabled={!d.on}
                />
              )}
            </div>
          ))}
        </div>
      </DialogField>
    </Modal>
  );
}

type ListingEditPatch = Pick<
  ProviderListing,
  "markupMode" | "markupValue" | "price" | "quantity" | "minOrder" | "minDays"
>;

/** 编辑上架记录：仅上架单待审批时可编辑，带入商品与委托信息（不可改），调整该规格记录的加价、交易条件与上架数量 */
function EditDialog({
  goods,
  listing,
  onClose,
  onConfirm,
}: {
  goods: EntrustedGoods;
  listing: ProviderListing;
  onClose: () => void;
  onConfirm: (listingId: string, patch: ListingEditPatch) => void;
}) {
  const type = goods.type;
  const base = goods.basePrice;
  const unitSuffix = priceSuffix(goods);
  const [markupMode, setMarkupMode] = useState<MarkupMode>(
    listing?.markupMode ?? "percent",
  );
  const [markupValue, setMarkupValue] = useState(
    listing ? String(listing.markupValue) : "",
  );
  const [quantity, setQuantity] = useState(
    listing ? String(listing.quantity) : "",
  );
  const [minOrder, setMinOrder] = useState(
    listing?.minOrder ? String(listing.minOrder) : "",
  );
  const [minDays, setMinDays] = useState(
    listing?.minDays ? String(listing.minDays) : "",
  );

  const otherLocked = lockedQty(goods) - (listing.status === "on" ? listing.quantity : 0);
  const available = goods.quantity - otherLocked;
  const markup = Number(markupValue);
  const markupOk = markupValue !== "" && markup >= 0;
  const price = markupOk
    ? round2(markupMode === "percent" ? base * (1 + markup / 100) : base + markup)
    : base;
  const profit = round2(price - base);
  const profitRate = base > 0 ? round2((profit / base) * 100) : 0;
  const qty = Number(quantity);
  const qtyOk =
    Number.isInteger(qty) && qty > 0 && qty <= available && qty >= listing.used;
  const qtyHint =
    quantity && !qtyOk
      ? qty > available
        ? `受托 ${goods.quantity.toLocaleString()} ${goods.unit}，其他上架中记录占用 ${otherLocked.toLocaleString()} ${goods.unit}，本条最多 ${available.toLocaleString()} ${goods.unit}`
        : qty < listing.used
          ? `本条已成交 ${listing.used.toLocaleString()} ${goods.unit}，上架数量不可低于该值`
          : "请输入大于 0 的整数"
      : `已成交 ${listing.used.toLocaleString()} ${goods.unit} · 本条最多可上架 ${available.toLocaleString()} ${goods.unit}`;
  const nextMinOrder = minOrder ? Number(minOrder) : undefined;
  const nextMinDays = Number(minDays);
  const changed =
    markupMode !== listing.markupMode ||
    markup !== listing.markupValue ||
    qty !== listing.quantity ||
    (type === "sale"
      ? nextMinOrder !== listing.minOrder
      : nextMinDays !== listing.minDays);
  const ok =
    markupOk && qtyOk && (type === "sale" || nextMinDays > 0) && changed;

  return (
    <Modal
      title={`编辑上架记录 ${listing.id}`}
      titleId="provider-edit-dialog-title"
      width="max-w-[600px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            className={PRIMARY_BTN}
            disabled={!ok}
            onClick={() =>
              onConfirm(listing.id, {
                markupMode,
                markupValue: markup,
                price,
                quantity: qty,
                minOrder: type === "sale" ? nextMinOrder : listing.minOrder,
                minDays: type === "rent" ? nextMinDays : listing.minDays,
              })
            }
          >
            保存修改
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />
      <div className="grid gap-3 rounded border border-dashed border-border px-3 py-2 text-xs sm:grid-cols-3">
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">上架单号</span>
          <span className="font-mono">{listing.id}</span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">
            {bizMeta[type].label}委托价
          </span>
          <span className="tabular-nums">
            ¥ {fmtPrice(base)} {unitSuffix}
          </span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">
            {type === "rent" ? "押金" : "上架时间"}
          </span>
          <span className="tabular-nums">
            {type === "rent"
              ? `¥ ${fmtPrice(goods.deposit ?? 0)} / ${goods.unit}`
              : listing.listedAt}
          </span>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="加价方式" required>
          <div
            role="radiogroup"
            aria-label="加价方式"
            className="flex h-9 items-center gap-4 text-sm"
          >
            {(
              [
                ["percent", "按比例"],
                ["fixed", "固定金额"],
              ] as [MarkupMode, string][]
            ).map(([m, label]) => (
              <label key={m} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="edit-markup-mode"
                  checked={markupMode === m}
                  onChange={() => setMarkupMode(m)}
                  className="accent-[#1890ff]"
                />
                {label}
              </label>
            ))}
          </div>
        </DialogField>
        <DialogField
          label={markupMode === "percent" ? "加价比例" : "加价金额"}
          required
          hint="委托价由委托方给定，服务商只能调整加价"
        >
          <DialogInput
            label="加价"
            type="number"
            value={markupValue}
            onChange={setMarkupValue}
            placeholder="0"
            prefix={markupMode === "fixed" ? "+ ¥" : "+"}
            suffix={markupMode === "percent" ? "%" : unitSuffix}
          />
        </DialogField>
        <DialogField label={type === "sale" ? "对外售价" : "对外租金"}>
          <div className="flex h-9 items-center justify-between rounded border border-[#1890ff]/40 bg-[#1890ff]/5 px-3 text-sm tabular-nums">
            <span className="font-medium text-[#1890ff]">
              ¥ {fmtPrice(price)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {unitSuffix}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              收益 ¥ {fmtPrice(profit)}（{profitRate}%）
            </span>
          </div>
        </DialogField>
        {type === "sale" ? (
          <DialogField label="起订量">
            <DialogInput
              label="起订量"
              type="number"
              value={minOrder}
              onChange={setMinOrder}
              placeholder="不限"
              suffix={goods.unit}
            />
          </DialogField>
        ) : (
          <DialogField label="最短租期" required>
            <DialogInput
              label="最短租期"
              type="number"
              value={minDays}
              onChange={setMinDays}
              placeholder="0"
              suffix="天"
            />
          </DialogField>
        )}
        <div className="sm:col-span-2">
          <DialogField label="上架数量" required hint={qtyHint}>
            <DialogInput
              label="上架数量"
              type="number"
              value={quantity}
              onChange={setQuantity}
              placeholder="0"
              suffix={goods.unit}
            />
          </DialogField>
        </div>
      </div>
    </Modal>
  );
}

const OFF_REASONS = [
  "商家调整底价",
  "库存不足",
  "暂停代理",
  "委托即将到期",
  "其他",
];

function OffDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: EntrustedGoods;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [reason, setReason] = useState("");
  const onCount = goods.listings.filter((l) => l.status === "on").length;
  return (
    <Modal
      title="确认下架？"
      titleId="provider-off-dialog-title"
      width="max-w-[440px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            className="bg-red-600 text-white hover:bg-red-600/90"
            disabled={!reason}
            onClick={() => onConfirm(reason)}
          >
            确认下架
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        「{goods.name}」的 {onCount}{" "}
        条上架中记录将同步下架，买/租方无法浏览和下单；委托关系保留，可随时重新上架。
      </p>
      <DialogField label="下架原因" required>
        <Select
          label="下架原因"
          placeholder="请选择原因"
          value={reason}
          options={OFF_REASONS}
          onChange={setReason}
        />
      </DialogField>
    </Modal>
  );
}

type Action = "detail" | "edit" | "accept" | "return" | "list" | "off";

/** 商品级操作：受理 / 退回 / 上架以整个受托商品为单位；编辑在上架记录中进行（待审批时）；下架按规格 */
function Actions({
  items,
  onAction,
}: {
  items: EntrustedGoods[];
  onAction: (a: Action) => void;
}) {
  const head = items[0];
  const single = items.length === 1;
  const detailLink = <ActionLink onClick={() => onAction("detail")}>详情</ActionLink>;
  const returnLink = (
    <ActionLink tone="danger" onClick={() => onAction("return")}>
      退回
    </ActionLink>
  );
  const canList = items.some(
    (g) => isAccepted(g) && g.quantity - lockedQty(g) > 0,
  );
  const map: Record<EntrustStatus, React.ReactNode> = {
    pending: (
      <>
        {detailLink}
        <ActionLink onClick={() => onAction("accept")}>受理</ActionLink>
        {returnLink}
      </>
    ),
    accepted: (
      <>
        {detailLink}
        {canList && <ActionLink onClick={() => onAction("list")}>上架</ActionLink>}
        {returnLink}
      </>
    ),
    listed: (
      <>
        {detailLink}
        {canList && <ActionLink onClick={() => onAction("list")}>上架</ActionLink>}
        {single && (
          <ActionLink tone="danger" onClick={() => onAction("off")}>
            下架
          </ActionLink>
        )}
      </>
    ),
    off: (
      <>
        {detailLink}
        {canList && <ActionLink onClick={() => onAction("list")}>重新上架</ActionLink>}
        {returnLink}
      </>
    ),
    returned: detailLink,
  };
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {map[head.status]}
    </span>
  );
}

const columns =
  "36px 100px minmax(170px,1.4fr) minmax(110px,1fr) 72px 92px 92px 90px 90px 88px 100px minmax(140px,1fr)";
const specSummaryColumns =
  "108px minmax(150px,1.2fr) 64px 130px 100px 100px 100px 110px";
const listingColumns =
  "118px 118px minmax(120px,1fr) minmax(140px,1fr) minmax(150px,1fr) 100px 96px 120px";

const approvalMeta: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: {
    label: "待审批",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  approved: {
    label: "已审批",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

/** 一组同名受托商品的全部上架记录：按规格逐条展示，待审批记录可编辑；readonly 时仅查看 */
function GroupListingTable({
  items,
  readonly,
  onEdit,
  onOff,
  onRelist,
}: {
  items: EntrustedGoods[];
  readonly?: boolean;
  onEdit?: (goodsId: string, listingId: string) => void;
  onOff?: (goodsId: string, listingId: string) => void;
  onRelist?: () => void;
}) {
  const rows = items
    .flatMap((g) => g.listings.map((l) => ({ g, l })))
    .sort((a, b) => b.l.listedAt.localeCompare(a.l.listedAt));
  const cols = listingColumns;
  const types = new Set(rows.map((r) => r.l.type));
  const onlyRent = types.size === 1 && types.has("rent");
  const onlySale = types.size === 1 && types.has("sale");
  const batches = new Set(rows.map((r) => r.l.batch)).size;
  if (rows.length === 0)
    return (
      <div className="rounded border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        尚未上架，受理后可在操作列点击「上架」加价上架
      </div>
    );
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">上架记录</span>
        <span className="text-muted-foreground">
          共 {batches} 张上架单 · {rows.length} 条规格记录
          {rows.some((r) => r.l.approval === "pending") ? " · 待审批记录可编辑" : ""}
        </span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: cols }}
      >
        <span>上架单号</span>
        <span>上架时间</span>
        <span>规格型号</span>
        <span>{onlyRent ? "对外租金" : onlySale ? "对外售价" : "对外价格"}</span>
        <span>
          {onlyRent ? "押金 / 最短租期" : onlySale ? "起订量" : "交易条件"}
        </span>
        <span>{onlyRent ? "已租 / 上架" : onlySale ? "已售 / 上架" : "成交 / 上架"}</span>
        <span>状态</span>
        <span>{readonly ? "审批" : "操作"}</span>
      </div>
      {rows.map(({ g, l }) => {
        const suffix =
          l.type === "sale" ? `/ ${g.unit}` : `/ ${g.unit} / ${l.period}`;
        const ap = approvalMeta[l.approval];
        return (
          <div
            key={l.id}
            className="grid items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
            style={{ gridTemplateColumns: cols }}
          >
            <span className="flex flex-col font-mono text-xs leading-4 text-muted-foreground">
              <span>{l.batch}</span>
              <span className="text-[11px]">{l.id}</span>
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {l.listedAt}
            </span>
            <span className="flex min-w-0 flex-col leading-4">
              <span className="truncate text-xs font-medium" title={g.spec}>
                {g.spec}
              </span>
              <span className="flex">
                <Tag className={bizMeta[l.type].className}>
                  {bizMeta[l.type].label}
                </Tag>
              </span>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="tabular-nums">
                ¥ {fmtPrice(l.price)} {suffix}
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                委托价 ¥ {fmtPrice(l.basePrice)} ·{" "}
                {l.markupMode === "percent"
                  ? `加价 ${l.markupValue}%`
                  : `加价 ¥ ${fmtPrice(l.markupValue)}`}
              </span>
            </span>
            <span className="text-xs tabular-nums">
              {l.type === "sale"
                ? l.minOrder
                  ? `${l.minOrder.toLocaleString()} ${g.unit} 起订`
                  : "不限"
                : `押金 ¥ ${fmtPrice(l.deposit ?? 0)} / ${g.unit} · ${l.minDays ?? 0} 天起租`}
            </span>
            <span className="tabular-nums">
              {l.used.toLocaleString()} / {l.quantity.toLocaleString()} {g.unit}
            </span>
            <span className="flex flex-wrap gap-1">
              <Tag
                className={
                  l.status === "on"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-muted text-muted-foreground ring-border"
                }
              >
                {l.status === "on" ? "上架中" : "已下架"}
              </Tag>
              {!readonly && l.status === "on" && l.approval === "pending" && (
                <Tag className={ap.className}>{ap.label}</Tag>
              )}
            </span>
            {readonly ? (
              <span className="flex">
                <Tag className={ap.className}>{ap.label}</Tag>
              </span>
            ) : (
              <span className="flex items-center gap-3">
                {l.status === "on" && l.approval === "pending" && (
                  <ActionLink onClick={() => onEdit?.(g.id, l.id)}>编辑</ActionLink>
                )}
                {l.status === "on" ? (
                  <ActionLink tone="danger" onClick={() => onOff?.(g.id, l.id)}>
                    下架
                  </ActionLink>
                ) : (
                  <ActionLink onClick={onRelist}>重新上架</ActionLink>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** status 仅由列表上方的状态页签控制，不再出现在条件区 */
type Filters = {
  keyword: string;
  seller: string;
  type: BizType | "";
  status: EntrustStatus | "";
  from: string;
  to: string;
};
const emptyFilters: Filters = {
  keyword: "",
  seller: "",
  type: "",
  status: "",
  from: "",
  to: "",
};

function matches(g: EntrustedGoods, f: Filters) {
  const kw = f.keyword.trim().toLowerCase();
  if (
    kw &&
    !g.name.toLowerCase().includes(kw) &&
    !g.code.toLowerCase().includes(kw)
  )
    return false;
  if (f.seller && g.seller !== f.seller) return false;
  if (f.type && g.type !== f.type) return false;
  if (f.status && g.status !== f.status) return false;
  if (f.from && g.entrustedAt < f.from) return false;
  if (f.to && g.entrustedAt > f.to) return false;
  return true;
}

const DATE_INPUT =
  "h-9 min-w-0 flex-1 rounded border border-border bg-background px-2 text-sm text-foreground";

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 shrink-0 text-right">{label}</span>
      {children}
    </div>
  );
}

/** 受托商品详情页：只读——委托信息、委托明细（各规格委托价 / 数量 / 运营状态）与全部上架记录；受理 / 退回 / 上架 / 下架等业务操作在列表与上架记录中进行 */
function EntrustDetail({
  group,
  onBack,
}: {
  group: SpecGroup<EntrustedGoods>;
  onBack: () => void;
}) {
  const items = group.items;
  const head = items[0];
  const single = items.length === 1;
  const allListings = items.flatMap((g) => g.listings);
  const totalQty = items.reduce((s, g) => s + g.quantity, 0);
  const listedQty = items.reduce((s, g) => s + lockedQty(g), 0);
  const onListings = allListings.filter((l) => l.status === "on");
  const used = allListings.reduce((s, l) => s + l.used, 0);
  const accepted = isAccepted(head);
  const accept = accepted ? acceptMeta.accepted : acceptMeta.pending;
  const types = Array.from(new Set(items.map((g) => g.type)));
  const entrustedAt = items.map((g) => g.entrustedAt).sort()[0];
  const acceptedAt = items
    .map((g) => g.acceptedAt)
    .filter(Boolean)
    .sort()[0];
  const updatedAt = items
    .map((g) => g.updatedAt)
    .sort()
    .at(-1);
  const operation = operationMeta(head);

  return (
    <div className="flex flex-col gap-4">
      <DetailHeader
        title={group.name}
        onBack={onBack}
        tags={
          <>
            {!single && (
              <Tag className="bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/20">
                {items.length} 规格
              </Tag>
            )}
            {types.map((t) => (
              <Tag key={t} className={bizMeta[t].className}>
                委托{bizMeta[t].label}
              </Tag>
            ))}
            <Tag className={accept.className}>{accept.label}</Tag>
            {head.status === "returned" && (
              <Tag className={statusMeta.returned.className}>已退回</Tag>
            )}
          </>
        }
        subtitle={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="font-mono">委托单 {head.id}</span>
            <span>委托方：{head.seller}</span>
            <span>{head.subCategory}</span>
            <span>计量单位：{head.unit}</span>
          </span>
        }
        actions={
          <span className="text-xs text-muted-foreground">
            详情仅供查看，受理 / 退回 / 上架 / 下架请回到列表操作
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="受托数量"
          value={totalQty}
          unit={head.unit}
          hint={
            single
              ? `可上架 ${(totalQty - listedQty).toLocaleString()} ${head.unit}`
              : `${items.length} 个规格合计 · 可上架 ${(totalQty - listedQty).toLocaleString()} ${head.unit}`
          }
        />
        <StatCard
          label="上架数量"
          value={listedQty}
          unit={head.unit}
          hint={`${onListings.length} 条上架中记录 · 共 ${allListings.length} 条`}
        />
        <StatCard
          label="累计成交"
          value={used}
          unit={head.unit}
          hint="已售出 / 已租出合计"
        />
        <StatCard
          label="受理情况"
          value={accept.label}
          hint={
            head.status === "returned"
              ? `已退回 · ${head.statusNote ?? ""}`
              : acceptedAt
                ? `受理于 ${acceptedAt}`
                : "委托单整体受理，受理后可加价上架"
          }
        />
      </div>

      <DetailSection title="委托信息">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DescItem label="委托单号">
            <span className="font-mono text-xs">{head.id}</span>
          </DescItem>
          <DescItem label="商品名称">{group.name}</DescItem>
          {single && <DescItem label="规格型号">{head.spec}</DescItem>}
          <DescItem label="商品编码">
            <span className="font-mono text-xs">
              {Array.from(new Set(items.map((g) => g.code))).join("、")}
            </span>
          </DescItem>
          <DescItem label="委托方">{head.seller}</DescItem>
          <DescItem label="品类">{head.subCategory}</DescItem>
          <DescItem label="计量单位">{head.unit}</DescItem>
          <DescItem label="委托方式">
            {types.map((t) => bizMeta[t].label).join(" / ")}
          </DescItem>
          {single && (
            <DescItem label="委托价">
              <span className="tabular-nums">
                ¥ {fmtPrice(head.basePrice)} {priceSuffix(head)}
                {head.type === "rent" && head.deposit !== undefined
                  ? ` · 押金 ¥ ${fmtPrice(head.deposit)} / ${head.unit}`
                  : ""}
              </span>
            </DescItem>
          )}
          {single && operation && (
            <DescItem label="运营状态">
              <Tag className={operation.className}>{operation.label}</Tag>
            </DescItem>
          )}
          <DescItem label="委托时间">
            <span className="font-mono text-xs">{entrustedAt}</span>
          </DescItem>
          <DescItem label="受托时间">
            <span className="font-mono text-xs">{acceptedAt ?? "—"}</span>
          </DescItem>
          <DescItem label="最近更新">
            <span className="font-mono text-xs">{updatedAt}</span>
          </DescItem>
        </div>
      </DetailSection>

      <DetailSection
        title="委托明细"
        extra={`${items.length} 个规格 · 受托 ${totalQty.toLocaleString()} ${head.unit}；上架以整个商品为单位引用明细，按规格分别加价、定量`}
        flush
      >
          <div
            className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: specSummaryColumns }}
          >
            <span>商品编码</span>
            <span>规格型号</span>
            <span>方式</span>
            <span>委托价</span>
            <span>受托数量</span>
            <span>上架数量</span>
            <span>可上架</span>
            <span>运营状态</span>
          </div>
          {items.map((g) => {
            const op = operationMeta(g);
            return (
              <div
                key={g.id}
                className="grid items-center gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0"
                style={{ gridTemplateColumns: specSummaryColumns }}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {g.code}
                </span>
                <span className="truncate font-medium" title={g.spec}>
                  {g.spec}
                </span>
                <span className="flex">
                  <Tag className={bizMeta[g.type].className}>
                    {bizMeta[g.type].label}
                  </Tag>
                </span>
                <span className="flex flex-col text-xs tabular-nums">
                  <span>
                    ¥ {fmtPrice(g.basePrice)} {priceSuffix(g)}
                  </span>
                  {g.type === "rent" && g.deposit !== undefined && (
                    <span className="text-[11px] text-muted-foreground">
                      押金 ¥ {fmtPrice(g.deposit)}
                    </span>
                  )}
                </span>
                <span className="tabular-nums">
                  {g.quantity.toLocaleString()} {g.unit}
                </span>
                <span className="tabular-nums">
                  {lockedQty(g).toLocaleString()} {g.unit}
                </span>
                <span className="tabular-nums">
                  {(g.quantity - lockedQty(g)).toLocaleString()} {g.unit}
                </span>
                <span className="flex min-w-0 flex-col items-start gap-1">
                  {op ? (
                    <Tag className={op.className}>{op.label}</Tag>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {g.status === "returned"
                        ? "已退回"
                        : g.status === "pending"
                          ? "待受理"
                          : "待上架"}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </DetailSection>

      <DetailSection
        title="上架记录"
        extra="在委托价基础上加价对外上架，差额为服务收益；提交后待平台审批，审批通过前可在列表的上架记录中编辑"
        flush
      >
        <div className="p-3">
          <GroupListingTable items={items} readonly />
        </div>
      </DetailSection>
    </div>
  );
}

export function ProviderGoods() {
  const [local, setGoods] = useState<EntrustedGoods[]>(seed);
  const records = useEntrusts();
  const goods = mergeRows(local, records);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<{
    action: Exclude<Action, "detail">;
    id: string;
    listingId?: string;
  } | null>(null);
  /** 同一委托单下的全部规格：受理 / 退回按委托单整体生效 */
  const orderIds = (g: EntrustedGoods) =>
    goods
      .filter(
        (x) =>
          x.name === g.name && x.seller === g.seller && x.type === g.type,
      )
      .map((x) => x.id);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sellers = Array.from(new Set(goods.map((g) => g.seller)));
  const dialogGoods = dialog
    ? goods.find((g) => g.id === dialog.id)
    : undefined;
  const dialogItems = dialogGoods
    ? goods.filter((g) => orderKey(g) === orderKey(dialogGoods))
    : [];
  const dialogListing =
    dialogGoods && dialog?.listingId
      ? dialogGoods.listings.find((l) => l.id === dialog.listingId)
      : undefined;

  const update = (
    id: string | string[],
    patch: (g: EntrustedGoods) => EntrustedGoods,
    message: string,
  ) => {
    const ids = Array.isArray(id) ? id : [id];
    const stamp = nowStamp();
    const next = new Map<string, EntrustedGoods>();
    for (const g of goods) {
      if (ids.includes(g.id)) next.set(g.id, { ...patch(g), updatedAt: stamp });
    }
    setGoods((list) => {
      const touched = new Set(list.map((g) => g.id));
      const updated = list.map((g) => next.get(g.id) ?? g);
      const added = [...next.values()].filter((g) => !touched.has(g.id));
      return [...added, ...updated];
    });
    // 商家侧实时发起的委托单：受理 / 退回结果回写，商家列表同步变化
    const synced = new Set<string>();
    for (const g of next.values()) {
      if (!g.recordId || synced.has(g.recordId)) continue;
      if (g.status !== "accepted" && g.status !== "returned") continue;
      synced.add(g.recordId);
      const status = g.status;
      updateEntrust(g.recordId, (r) =>
        r.status === status
          ? r
          : {
              ...r,
              status,
              statusNote: status === "returned" ? g.statusNote : undefined,
              acceptedAt: status === "accepted" ? stamp : r.acceptedAt,
            },
      );
    }
    setDialog(null);
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const visible = goods.filter((g) => matches(g, applied));
  const base = goods.filter((g) => matches(g, { ...applied, status: "" }));
  const countOf = (s: EntrustStatus | "") =>
    s ? base.filter((g) => g.status === s).length : base.length;
  const selectStatus = (s: EntrustStatus | "") => {
    setDraft((d) => ({ ...d, status: s }));
    setApplied((a) => ({ ...a, status: s }));
  };
  const toggle = (key: string) =>
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  const handleAction = (g: EntrustedGoods, action: Action) => {
    if (action === "detail") setDetailKey(orderKey(g));
    else setDialog({ action, id: g.id });
  };
  const editListing = (goodsId: string, listingId: string) =>
    setDialog({ action: "edit", id: goodsId, listingId });
  /** 按规格下架单条上架记录；该规格无上架中记录时运营状态转为已下架 */
  const offListing = (goodsId: string, listingId: string) => {
    const g = goods.find((x) => x.id === goodsId);
    if (!g) return;
    update(
      goodsId,
      (x) => {
        const listings = x.listings.map((l) =>
          l.id === listingId ? { ...l, status: "off" as const } : l,
        );
        const anyOn = listings.some((l) => l.status === "on");
        return {
          ...x,
          listings,
          status: anyOn ? x.status : "off",
          statusNote: anyOn ? x.statusNote : "服务商按规格下架",
        };
      },
      `已下架上架记录 ${listingId}：${g.name}（${g.spec}）`,
    );
  };

  const typeLabel = draft.type ? bizMeta[draft.type].label : "";
  const groups = groupOrders(visible);
  const detailGroup = detailKey
    ? groupOrders(goods.filter((g) => orderKey(g) === detailKey))[0]
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      {detailGroup ? (
        <EntrustDetail
          group={detailGroup}
          onBack={() => setDetailKey(null)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-md bg-card p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterRow label="商品">
                <input
                  aria-label="商品名称或编码"
                  value={draft.keyword}
                  placeholder="名称 / 编码"
                  onChange={(e) =>
                    setDraft({ ...draft, keyword: e.target.value })
                  }
                  className="h-9 flex-1 rounded border border-border bg-background px-3 text-sm placeholder:text-xs placeholder:text-muted-foreground/60"
                />
              </FilterRow>
              <FilterRow label="委托方">
                <Select
                  label="委托方"
                  placeholder="全部委托方"
                  value={draft.seller}
                  options={sellers}
                  onChange={(seller) => setDraft({ ...draft, seller })}
                />
              </FilterRow>
              <FilterRow label="委托方式">
                <Select
                  label="委托方式"
                  placeholder="全部"
                  value={typeLabel}
                  options={["出售", "出租"]}
                  onChange={(l) =>
                    setDraft({
                      ...draft,
                      type: l === "出售" ? "sale" : l === "出租" ? "rent" : "",
                    })
                  }
                />
              </FilterRow>
              <FilterRow label="委托时间">
                <input
                  type="date"
                  aria-label="委托开始日期"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                  className={DATE_INPUT}
                />
                <span className="text-xs text-muted-foreground">至</span>
                <input
                  type="date"
                  aria-label="委托结束日期"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                  className={DATE_INPUT}
                />
              </FilterRow>
            </div>
            <div className="flex items-center gap-2">
              <Button className={PRIMARY_BTN} onClick={() => setApplied(draft)}>
                <Search data-icon="inline-start" />
                查询
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(emptyFilters);
                  setApplied(emptyFilters);
                }}
              >
                重置
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div
              className="flex items-center gap-1 border-b border-border px-2 text-xs"
              role="tablist"
              aria-label="受托状态"
            >
              {(["", ...statusOrder] as (EntrustStatus | "")[]).map((s) => {
                const active = applied.status === s;
                return (
                  <button
                    key={s || "all"}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectStatus(s)}
                    className={cn(
                      "relative flex h-10 items-center gap-1.5 px-3 hover:text-foreground",
                      active
                        ? "font-medium text-[#1890ff]"
                        : "text-muted-foreground",
                    )}
                  >
                    {s ? statusMeta[s].label : "全部"}
                    <span
                      className={cn(
                        "tabular-nums",
                        active
                          ? "text-[#1890ff]"
                          : s
                            ? statusMeta[s].countClass
                            : "",
                      )}
                    >
                      {countOf(s)}
                    </span>
                    {active && (
                      <span
                        className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1890ff]"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
              <span className="ml-auto pr-2 text-muted-foreground">
                同一委托单的多个规格归为一行，点击编码前的角标展开查看上架记录；待审批的上架记录可在其中编辑
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1280px]">
                <div
                  className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground"
                  style={{ gridTemplateColumns: columns }}
                >
                  <span className="text-center">展开</span>
                  <span>商品编码</span>
                  <span>商品名称</span>
                  <span>委托方</span>
                  <span>委托方式</span>
                  <span>委托时间</span>
                  <span>受托时间</span>
                  <span>受托数量</span>
                  <span>上架数量</span>
                  <span>受理情况</span>
                  <span>运营状态</span>
                  <span>操作</span>
                </div>

                {visible.length === 0 && (
                  <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                    没有符合筛选条件的受托商品
                  </p>
                )}

                {groups.map((grp) => {
                  const items = grp.items;
                  const head = items[0];
                  const single = items.length === 1;
                  const open = expanded[grp.key] ?? false;
                  const listingCount = items.reduce(
                    (n, g) => n + g.listings.length,
                    0,
                  );
                  const entrustedAt = items.map((g) => g.entrustedAt).sort()[0];
                  const acceptedAt = items
                    .map((g) => g.acceptedAt)
                    .filter(Boolean)
                    .sort()
                    .at(-1);
                  const accept = isAccepted(head)
                    ? acceptMeta.accepted
                    : acceptMeta.pending;
                  return (
                    <Fragment key={grp.key}>
                      <div
                        className={cn(
                          "grid items-center gap-3 border-b border-border px-4 py-3 text-sm hover:bg-muted/30",
                          open && "bg-muted/20",
                        )}
                        style={{ gridTemplateColumns: columns }}
                      >
                        <span className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggle(grp.key)}
                            aria-expanded={open}
                            aria-controls={`provider-listings-${head.id}`}
                            aria-label={
                              open
                                ? `收起 ${grp.name} 上架记录`
                                : `展开 ${grp.name} 上架记录`
                            }
                            className="relative flex size-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:border-[#1890ff] hover:text-[#1890ff]"
                          >
                            <ChevronRight
                              className={cn(
                                "size-3.5 transition-transform",
                                open && "rotate-90",
                              )}
                              aria-hidden
                            />
                            <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[#1890ff] text-[9px] leading-none text-white">
                              {listingCount}
                            </span>
                          </button>
                        </span>
                        <GroupCode codes={items.map((g) => g.code)} />
                        <GroupName
                          name={grp.name}
                          size={items.length}
                          sub={
                            single
                              ? `${head.subCategory} · ${head.spec}`
                              : head.subCategory
                          }
                        />
                        <span className="truncate text-xs" title={head.seller}>
                          {head.seller}
                        </span>
                        <span className="flex">
                          <Tag className={bizMeta[grp.type].className}>
                            {bizMeta[grp.type].label}
                          </Tag>
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {entrustedAt}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {acceptedAt ? (
                            <span className="flex flex-col leading-4">
                              <span>{acceptedAt.slice(0, 10)}</span>
                              <span className="text-[11px]">
                                {acceptedAt.slice(11)}
                              </span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </span>
                        <span className="tabular-nums">
                          {items
                            .reduce((n, g) => n + g.quantity, 0)
                            .toLocaleString()}{" "}
                          {head.unit}
                        </span>
                        <span className="tabular-nums">
                          {items
                            .reduce((n, g) => n + lockedQty(g), 0)
                            .toLocaleString()}{" "}
                          {head.unit}
                        </span>
                        <span className="flex">
                          <Tag className={accept.className}>{accept.label}</Tag>
                        </span>
                        <span className="flex min-w-0 flex-col items-start gap-1">
                          <StatusSummary
                            statuses={items
                              .map((g) => g.status)
                              .filter((st) => st === "listed" || st === "off")}
                            order={statusOrder}
                            meta={statusMeta}
                          />
                        </span>
                        <Actions
                          items={items}
                          onAction={(action) => handleAction(head, action)}
                        />
                      </div>
                      {open && (
                        <div
                          id={`provider-listings-${head.id}`}
                          className="border-b border-border bg-muted/20 px-4 py-3 pl-[84px]"
                        >
                          <GroupListingTable
                            items={items}
                            onEdit={editListing}
                            onOff={offListing}
                            onRelist={() => handleAction(head, "list")}
                          />
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
              <span>
                共 {groups.length} 个商品 · {visible.length} 个规格
              </span>
              <span>最近更新：{visible[0]?.updatedAt ?? "—"}</span>
            </div>
          </div>
        </>
      )}

      {dialog?.action === "accept" && dialogGoods && (
        <AcceptDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            update(
              orderIds(dialogGoods),
              (g) => ({
                ...g,
                status: "accepted",
                acceptedAt: nowStamp(),
                statusNote: undefined,
              }),
              `已受理委托单 ${dialogGoods.id}：${dialogGoods.name}，可加价上架`,
            )
          }
        />
      )}
      {dialog?.action === "return" && dialogGoods && (
        <ReturnDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(note) =>
            update(
              orderIds(dialogGoods),
              (g) => ({
                ...g,
                status: "returned",
                statusNote: note,
                listings: g.listings.map((l) => ({
                  ...l,
                  status: "off" as const,
                })),
              }),
              `已退回委托单 ${dialogGoods.id}：${dialogGoods.name}`,
            )
          }
        />
      )}
      {dialog?.action === "edit" && dialogGoods && dialogListing && (
        <EditDialog
          key={dialogListing.id}
          goods={dialogGoods}
          listing={dialogListing}
          onClose={() => setDialog(null)}
          onConfirm={(listingId, patch) =>
            update(
              dialogGoods.id,
              (g) => ({
                ...g,
                listings: g.listings.map((l) =>
                  l.id === listingId ? { ...l, ...patch } : l,
                ),
              }),
              `已保存：${dialogGoods.name}（对外价 ¥ ${fmtPrice(patch.price)}）`,
            )
          }
        />
      )}
      {dialog?.action === "list" && dialogGoods && (
        <ListDialog
          key={orderKey(dialogGoods)}
          items={dialogItems.filter((g) => isAccepted(g))}
          onClose={() => setDialog(null)}
          onConfirm={(created) => {
            const byId = new Map(created.map((c) => [c.id, c.listing]));
            const qty = created.reduce((s, c) => s + c.listing.quantity, 0);
            update(
              created.map((c) => c.id),
              (g) => {
                const l = byId.get(g.id);
                return l
                  ? {
                      ...g,
                      status: "listed",
                      statusNote: undefined,
                      listings: [l, ...g.listings],
                    }
                  : g;
              },
              `已提交上架单 ${created[0].listing.batch}：${dialogGoods.name}（${bizMeta[dialogGoods.type].label} ${created.length} 个规格共 ${qty.toLocaleString()} ${dialogGoods.unit}，待平台审批）`,
            );
          }}
        />
      )}
      {dialog?.action === "off" && dialogGoods && (
        <OffDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(note) =>
            update(
              dialogGoods.id,
              (g) => ({
                ...g,
                status: "off",
                statusNote: note,
                listings: g.listings.map((l) => ({
                  ...l,
                  status: "off" as const,
                })),
              }),
              `已下架：${dialogGoods.name}`,
            )
          }
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg"
        >
          <CheckCircle2 className="size-4 text-emerald-400" aria-hidden />
          {toast}
        </div>
      )}
    </div>
  );
}
