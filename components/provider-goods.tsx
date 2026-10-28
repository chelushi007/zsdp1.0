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
  groupSpecs,
  type BizType,
  type SpecGroup,
} from "@/components/goods-list";

/** 受托商品状态：待受理 / 已受理待上架 / 运营中 / 已下架 / 已退回 */
type EntrustStatus = "pending" | "accepted" | "listed" | "off" | "returned";

type MarkupMode = "percent" | "fixed";

/** 服务商上架记录：在商家底价基础上加价对外销售 / 出租 */
type ProviderListing = {
  id: string;
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
};

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

/** 运营状态：仅已受理的商品有运营状态（待上架 / 运营中 / 已下架） */
function operationMeta(g: EntrustedGoods) {
  if (g.status === "listed") return statusMeta.listed;
  if (g.status === "accepted") return statusMeta.accepted;
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

function round2(n: number) {
  return Math.round(n * 100) / 100;
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

/** 底价行：展示商家给出的底价，服务商不可修改 */
function BasePriceRow({ goods }: { goods: EntrustedGoods }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded border border-dashed border-border px-3 py-2 text-xs">
      <span>
        <span className="text-muted-foreground">
          {bizMeta[goods.type].label}底价{" "}
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
        受理后该商品进入「待上架」，可在底价基础上加价上架
        {bizMeta[goods.type].label}，上架数量合计不得超过受托数量{" "}
        {goods.quantity.toLocaleString()} {goods.unit}
        。加价差额为您的服务收益，底价部分结算给委托方。
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
      <DialogField label="补充说明">
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

/** 上架：按受托的租售方式，在商家底价基础上加价后对外上架 */
function ListDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: EntrustedGoods;
  onClose: () => void;
  onConfirm: (l: ProviderListing) => void;
}) {
  const available = goods.quantity - lockedQty(goods);
  const type = goods.type;
  const [markupMode, setMarkupMode] = useState<MarkupMode>("percent");
  const [markupValue, setMarkupValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [minDays, setMinDays] = useState("");

  const base = goods.basePrice;
  const markup = Number(markupValue);
  const markupOk = markupValue !== "" && markup >= 0;
  const price = markupOk
    ? round2(
        markupMode === "percent" ? base * (1 + markup / 100) : base + markup,
      )
    : base;
  const profit = round2(price - base);
  const profitRate = base > 0 ? round2((profit / base) * 100) : 0;

  const qty = Number(quantity);
  const qtyOk = Number.isInteger(qty) && qty > 0 && qty <= available;
  const qtyHint =
    quantity && !qtyOk
      ? qty > available
        ? `超出受托数量：受托 ${goods.quantity.toLocaleString()} ${goods.unit}，上架中已占用 ${lockedQty(goods).toLocaleString()} ${goods.unit}，最多还可上架 ${available.toLocaleString()} ${goods.unit}`
        : "请输入大于 0 的整数"
      : `受托 ${goods.quantity.toLocaleString()} ${goods.unit}，上架中 ${lockedQty(goods).toLocaleString()} ${goods.unit}，可上架 ${available.toLocaleString()} ${goods.unit}`;
  const ok = markupOk && qtyOk && (type === "sale" || Number(minDays) > 0);

  const submit = () => {
    if (!ok) return;
    const id = `PL${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${String(goods.listings.length + 1).padStart(3, "0")}`;
    const common = {
      id,
      listedAt: nowStamp(),
      type,
      status: "on" as const,
      basePrice: base,
      markupMode,
      markupValue: markup,
      price,
      quantity: qty,
      used: 0,
    };
    onConfirm(
      type === "sale"
        ? { ...common, minOrder: minOrder ? Number(minOrder) : undefined }
        : {
            ...common,
            period: "天",
            deposit: goods.deposit,
            minDays: Number(minDays),
          },
    );
  };

  const unitSuffix = priceSuffix(goods);

  return (
    <Modal
      title={goods.status === "off" ? "重新上架" : "加价上架"}
      titleId="provider-list-dialog-title"
      width="max-w-[560px]"
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
            onClick={submit}
          >
            确认上架
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="租售方式" hint="按委托方授权的方式上架，不可更改">
          <div className="flex h-9 items-center rounded border border-border bg-muted/40 px-3 text-sm">
            <Tag className={bizMeta[type].className}>{bizMeta[type].label}</Tag>
          </div>
        </DialogField>
        <DialogField label="商家底价">
          <div className="flex h-9 items-center rounded border border-border bg-muted/40 px-3 text-sm tabular-nums">
            ¥ {fmtPrice(base)}{" "}
            <span className="ml-1 text-xs text-muted-foreground">
              {unitSuffix}
            </span>
          </div>
        </DialogField>
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
        <DialogField
          label={markupMode === "percent" ? "加价比例" : "加价金额"}
          required
          hint="在商家底价基础上加价，差额为服务收益"
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
          <>
            <DialogField label="押金" hint="按委托方约定收取，不参与加价">
              <div className="flex h-9 items-center rounded border border-border bg-muted/40 px-3 text-sm tabular-nums">
                ¥ {fmtPrice(goods.deposit ?? 0)}{" "}
                <span className="ml-1 text-xs text-muted-foreground">
                  / {goods.unit}
                </span>
              </div>
            </DialogField>
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
          </>
        )}
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
    </Modal>
  );
}

type ListingEditPatch = Pick<
  ProviderListing,
  "markupMode" | "markupValue" | "price" | "quantity" | "minOrder" | "minDays"
>;

/** 编辑：带入商品与委托信息（不可改），调整当前上架中记录的加价、交易条件与上架数量 */
function EditDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: EntrustedGoods;
  onClose: () => void;
  onConfirm: (listingId: string, patch: ListingEditPatch) => void;
}) {
  const listing =
    goods.listings.find((l) => l.status === "on") ?? goods.listings[0];
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

  if (!listing) return null;

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
      title="编辑上架信息"
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
            {bizMeta[type].label}底价
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
          hint="商家底价由委托方给定，服务商只能调整加价"
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

function Actions({
  goods,
  onAction,
  hideDetail,
}: {
  goods: EntrustedGoods;
  onAction: (a: Action) => void;
  hideDetail?: boolean;
}) {
  const detailLink = hideDetail ? null : (
    <ActionLink onClick={() => onAction("detail")}>详情</ActionLink>
  );
  const map: Record<EntrustStatus, React.ReactNode> = {
    pending: (
      <>
        {detailLink}
        <ActionLink onClick={() => onAction("accept")}>受理</ActionLink>
        <ActionLink tone="danger" onClick={() => onAction("return")}>
          退回
        </ActionLink>
      </>
    ),
    accepted: (
      <>
        {detailLink}
        <ActionLink onClick={() => onAction("list")}>上架</ActionLink>
        <ActionLink tone="danger" onClick={() => onAction("return")}>
          退回
        </ActionLink>
      </>
    ),
    listed: (
      <>
        {detailLink}
        <ActionLink onClick={() => onAction("edit")}>编辑</ActionLink>
        <ActionLink onClick={() => onAction("list")}>上架</ActionLink>
        <ActionLink tone="danger" onClick={() => onAction("off")}>
          下架
        </ActionLink>
      </>
    ),
    off: (
      <>
        {detailLink}
        <ActionLink onClick={() => onAction("list")}>重新上架</ActionLink>
        <ActionLink tone="danger" onClick={() => onAction("return")}>
          退回
        </ActionLink>
      </>
    ),
    returned: detailLink ?? (
      <span className="text-xs text-muted-foreground">—</span>
    ),
  };
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {map[goods.status]}
    </span>
  );
}

const columns =
  "36px 100px minmax(170px,1.4fr) minmax(110px,1fr) 72px 112px 84px 84px 80px 80px 88px 100px minmax(130px,1fr)";
const specSummaryColumns =
  "108px minmax(150px,1.2fr) 64px 120px 90px 90px 96px minmax(170px,1fr)";
const listingColumns =
  "120px 128px 72px minmax(140px,1fr) minmax(150px,1fr) 100px 80px 120px";
const groupListingColumns =
  "120px minmax(130px,1fr) 128px 72px minmax(140px,1fr) minmax(150px,1fr) 100px 80px 120px";

/** 一组同名受托商品的全部上架记录：多规格时在行内标注编码与规格，仅展示对外价格 */
function GroupListingTable({ items }: { items: EntrustedGoods[] }) {
  const rows = items.flatMap((g) => g.listings.map((l) => ({ g, l })));
  const multi = items.length > 1;
  const cols = multi ? groupListingColumns : listingColumns;
  const types = new Set(rows.map((r) => r.l.type));
  const onlyRent = types.size === 1 && types.has("rent");
  const onlySale = types.size === 1 && types.has("sale");
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
          共 {rows.length} 条{multi ? ` · ${items.length} 个规格` : ""}
        </span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: cols }}
      >
        <span>上架单号</span>
        {multi && <span>商品编码 / 规格</span>}
        <span>上架时间</span>
        <span>租售方式</span>
        <span>{onlyRent ? "对外租金" : onlySale ? "对外售价" : "对外价格"}</span>
        <span>
          {onlyRent ? "押金 / 最短租期" : onlySale ? "起订量" : "交易条件"}
        </span>
        <span>{onlyRent ? "已租 / 上架" : onlySale ? "已售 / 上架" : "成交 / 上架"}</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      {rows.map(({ g, l }) => {
        const suffix =
          l.type === "sale" ? `/ ${g.unit}` : `/ ${g.unit} / ${l.period}`;
        return (
          <div
            key={l.id}
            className="grid items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
            style={{ gridTemplateColumns: cols }}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {l.id}
            </span>
            {multi && (
              <span className="flex min-w-0 flex-col leading-4">
                <span className="font-mono text-xs text-muted-foreground">
                  {g.code}
                </span>
                <span className="truncate text-xs" title={g.spec}>
                  {g.spec}
                </span>
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {l.listedAt}
            </span>
            <Tag className={bizMeta[l.type].className}>
              {bizMeta[l.type].label}
            </Tag>
            <span className="flex flex-col leading-tight">
              <span className="tabular-nums">
                ¥ {fmtPrice(l.price)} {suffix}
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                底价 ¥ {fmtPrice(l.basePrice)} ·{" "}
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
            <Tag
              className={
                l.status === "on"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-muted text-muted-foreground ring-border"
              }
            >
              {l.status === "on" ? "上架中" : "已下架"}
            </Tag>
            <span className="flex items-center gap-3">
              <ActionLink>详情</ActionLink>
              {l.status === "on" ? (
                <ActionLink tone="danger">下架</ActionLink>
              ) : (
                <ActionLink>重新上架</ActionLink>
              )}
            </span>
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

/** 规格明细：同名受托商品下各规格的委托方式、底价、数量与受理 / 运营状态，可带出上架记录 */
/** 受托商品详情页：委托单信息、规格与数量、全部上架记录；受理 / 退回按委托单整体操作 */
function EntrustDetail({
  group,
  onBack,
  onAction,
}: {
  group: SpecGroup<EntrustedGoods>;
  onBack: () => void;
  onAction: (g: EntrustedGoods, a: Action) => void;
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
          head.status === "pending" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction(head, "return")}
              >
                退回委托
              </Button>
              <Button
                size="sm"
                className={PRIMARY_BTN}
                onClick={() => onAction(head, "accept")}
              >
                受理委托
              </Button>
            </>
          ) : single && accepted ? (
            <>
              {head.status === "listed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(head, "edit")}
                >
                  编辑
                </Button>
              )}
              <Button
                size="sm"
                className={PRIMARY_BTN}
                onClick={() => onAction(head, "list")}
              >
                {head.status === "off" ? "重新上架" : "上架"}
              </Button>
            </>
          ) : !single && accepted ? (
            <span className="text-xs text-muted-foreground">
              上架 / 编辑 / 下架请在下方「规格与数量」中按规格进行
            </span>
          ) : null
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
            <DescItem label="商家底价">
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
              <span className="flex flex-col items-start gap-1">
                <Tag className={operation.className}>{operation.label}</Tag>
                {head.statusNote && (
                  <span className="text-xs text-muted-foreground">
                    {head.statusNote}
                  </span>
                )}
              </span>
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

      {!single && (
        <DetailSection
          title="规格与数量"
          extra="受理 / 退回按委托单整体操作；上架、编辑、下架按规格操作"
          flush
        >
          <div
            className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: specSummaryColumns }}
          >
            <span>商品编码</span>
            <span>规格型号</span>
            <span>方式</span>
            <span>商家底价</span>
            <span>受托数量</span>
            <span>上架数量</span>
            <span>运营状态</span>
            <span>操作</span>
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
                <span className="flex min-w-0 flex-col items-start gap-1">
                  {op ? (
                    <Tag className={op.className}>{op.label}</Tag>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {g.statusNote && (
                    <span
                      className="line-clamp-1 text-[11px] leading-4 text-muted-foreground"
                      title={g.statusNote}
                    >
                      {g.statusNote}
                    </span>
                  )}
                </span>
                {accepted ? (
                  <Actions
                    goods={g}
                    hideDetail
                    onAction={(a) => onAction(g, a)}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {g.status === "returned" ? "已退回" : "待受理"}
                  </span>
                )}
              </div>
            );
          })}
        </DetailSection>
      )}

      <DetailSection
        title="上架记录"
        extra="在商家底价基础上加价对外上架，差额为服务收益"
        flush
      >
        <div className="p-3">
          <GroupListingTable items={items} />
        </div>
      </DetailSection>
    </div>
  );
}

export function ProviderGoods() {
  const [goods, setGoods] = useState<EntrustedGoods[]>(seed);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<{
    action: Exclude<Action, "detail">;
    id: string;
  } | null>(null);
  /** 同一委托单下的全部规格：受理 / 退回按委托单整体生效 */
  const orderIds = (g: EntrustedGoods) =>
    goods
      .filter((x) => x.name === g.name && x.seller === g.seller)
      .map((x) => x.id);
  const [detailName, setDetailName] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sellers = Array.from(new Set(goods.map((g) => g.seller)));
  const dialogGoods = dialog
    ? goods.find((g) => g.id === dialog.id)
    : undefined;

  const update = (
    id: string | string[],
    patch: (g: EntrustedGoods) => EntrustedGoods,
    message: string,
  ) => {
    const ids = Array.isArray(id) ? id : [id];
    setGoods((list) =>
      list.map((g) =>
        ids.includes(g.id) ? { ...patch(g), updatedAt: nowStamp() } : g,
      ),
    );
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
  const toggle = (name: string) =>
    setExpanded((e) => ({ ...e, [name]: !e[name] }));
  const handleAction = (g: EntrustedGoods, action: Action) => {
    if (action === "detail") setDetailName(g.name);
    else setDialog({ action, id: g.id });
  };

  const typeLabel = draft.type ? bizMeta[draft.type].label : "";
  const groups = groupSpecs(visible);
  const detailGroup = detailName
    ? groupSpecs(goods.filter((g) => g.name === detailName))[0]
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      {detailGroup ? (
        <EntrustDetail
          group={detailGroup}
          onBack={() => setDetailName(null)}
          onAction={handleAction}
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
                同一委托单的多个规格归为一行，点击编码前的角标展开查看上架记录
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
                  <span>商家底价</span>
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
                  const open = expanded[grp.name] ?? false;
                  const listingCount = items.reduce(
                    (n, g) => n + g.listings.length,
                    0,
                  );
                  const types = Array.from(new Set(items.map((g) => g.type)));
                  const prices = items.map((g) => g.basePrice);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
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
                    <Fragment key={grp.name}>
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
                            onClick={() => toggle(grp.name)}
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
                        <span className="flex flex-wrap gap-1">
                          {types.map((t) => (
                            <Tag key={t} className={bizMeta[t].className}>
                              {bizMeta[t].label}
                            </Tag>
                          ))}
                        </span>
                        <span className="flex flex-col text-xs tabular-nums">
                          {single ? (
                            <>
                              <span>
                                ¥ {fmtPrice(head.basePrice)} {priceSuffix(head)}
                              </span>
                              {head.type === "rent" &&
                                head.deposit !== undefined && (
                                  <span className="text-[11px] text-muted-foreground">
                                    押金 ¥ {fmtPrice(head.deposit)}
                                  </span>
                                )}
                            </>
                          ) : (
                            <>
                              <span>
                                {minPrice === maxPrice
                                  ? `¥ ${fmtPrice(minPrice)}`
                                  : `¥ ${fmtPrice(minPrice)} ~ ${fmtPrice(maxPrice)}`}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                按规格不同
                              </span>
                            </>
                          )}
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
                        <span className="flex flex-col items-start gap-1">
                          <Tag className={accept.className}>{accept.label}</Tag>
                          {head.status === "returned" ? (
                            <span className="text-[11px] leading-4 text-red-600">
                              已退回
                            </span>
                          ) : (
                            !single && (
                              <span className="text-[11px] leading-4 text-muted-foreground">
                                按委托单整体受理
                              </span>
                            )
                          )}
                        </span>
                        <span className="flex min-w-0 flex-col items-start gap-1">
                          <StatusSummary
                            statuses={items.map((g) => g.status)}
                            order={statusOrder}
                            meta={statusMeta}
                          />
                          {single && head.statusNote && (
                            <span
                              className="line-clamp-1 text-[11px] leading-4 text-muted-foreground"
                              title={head.statusNote}
                            >
                              {head.statusNote}
                            </span>
                          )}
                        </span>
                        {single ? (
                          <Actions
                            goods={head}
                            onAction={(action) => handleAction(head, action)}
                          />
                        ) : (
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <ActionLink
                              onClick={() => handleAction(head, "detail")}
                            >
                              详情
                            </ActionLink>
                            {head.status === "pending" ? (
                              <>
                                <ActionLink
                                  onClick={() => handleAction(head, "accept")}
                                >
                                  受理
                                </ActionLink>
                                <ActionLink
                                  tone="danger"
                                  onClick={() => handleAction(head, "return")}
                                >
                                  退回
                                </ActionLink>
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                上架等操作请进入详情按规格进行
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {open && (
                        <div
                          id={`provider-listings-${head.id}`}
                          className="border-b border-border bg-muted/20 px-4 py-3 pl-[84px]"
                        >
                          <GroupListingTable items={items} />
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
      {dialog?.action === "edit" && dialogGoods && (
        <EditDialog
          key={dialogGoods.id}
          goods={dialogGoods}
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
          key={dialogGoods.id}
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(l) =>
            update(
              dialogGoods.id,
              (g) => ({
                ...g,
                status: "listed",
                statusNote: undefined,
                listings: [l, ...g.listings],
              }),
              `已上架：${dialogGoods.name}（${bizMeta[l.type].label} ¥ ${fmtPrice(l.price)}）`,
            )
          }
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
