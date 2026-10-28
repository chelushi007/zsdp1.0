"use client";

import { Fragment, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, categoryTree } from "@/components/shop-form-fields";

export type BizType = "sale" | "rent";
type ListingStatus = "on" | "off";

/** 委托给服务商代为运营的信息 */
export type Entrust = {
  types: BizType[];
  provider: string;
  quantity: number;
  /** 商家底价：出售按单位计，出租按单位 / 天计 */
  salePrice?: number;
  rentPrice?: number;
  rentDeposit?: number;
  /** 委托期限（月） */
  months: number;
  status: "pending" | "accepted";
  createdAt: string;
};

/** 上架记录：一个商品可多次上架，每条记录对应一种租售方式 */
type Listing = {
  id: string;
  type: BizType;
  status: ListingStatus;
  price: number;
  /** 出租业务的计价周期 */
  period?: "天" | "月";
  /** 出租业务押金（按单位计） */
  deposit?: number;
  /** 出租业务最短租期（天） */
  minDays?: number;
  /** 出售业务起订量 */
  minOrder?: number;
  /** 出租业务最长租期 */
  maxDays?: number;
  /** 税率，「不含税」表示报价不含税 */
  taxRate?: string;
  /** 结算方式 */
  payTerm?: "先款后货" | "货到付款";
  /** 是否支持议价 */
  negotiable?: boolean;
  /** 出租损耗赔付标准 */
  lossRule?: string;
  /** 本次上架数量 */
  quantity: number;
  /** 已售出 / 已租出数量 */
  used: number;
};

/** 商品状态：草稿 / 运营中 / 已下架 / 违规下架 / 审核驳回 */
type GoodsStatus = "draft" | "active" | "off" | "violation" | "rejected";

type Goods = {
  code: string;
  name: string;
  spec: string;
  shop: string;
  category: string;
  subCategory: string;
  unit: string;
  /** 商品总库存（实物） */
  stock: number;
  status: GoodsStatus;
  /** 违规下架 / 审核驳回的原因说明 */
  statusNote?: string;
  listings: Listing[];
  entrust?: Entrust;
  createdAt: string;
  updatedAt: string;
};

const goodsData: Goods[] = [
  {
    code: "G2024030001",
    shop: "华东建设工程有限公司周转材料店",
    name: "覆膜竹胶板 1220×2440×15mm",
    spec: "15mm / 整张",
    category: "循环物资",
    subCategory: "模板类",
    unit: "张",
    stock: 6000,
    status: "active",
    listings: [
      {
        id: "L240302001",
        type: "sale",
        status: "on",
        price: 128,
        minOrder: 50,
        quantity: 3200,
        used: 1250,
      },
      {
        id: "L240302002",
        type: "rent",
        status: "on",
        price: 0.6,
        period: "天",
        deposit: 60,
        minDays: 30,
        quantity: 1800,
        used: 1260,
      },
    ],
    createdAt: "2024-03-15 10:20",
    updatedAt: "2024-10-12 09:20",
  },
  {
    code: "G2024030002",
    shop: "杭州分公司脚手架专营店",
    name: "盘扣式钢管脚手架 Φ48×3.2 立杆 2.0m",
    spec: "Q355 / 热镀锌",
    category: "循环物资",
    subCategory: "脚手架类",
    unit: "根",
    stock: 12000,
    status: "active",
    listings: [
      {
        id: "L240315001",
        type: "rent",
        status: "on",
        price: 0.045,
        period: "天",
        deposit: 85,
        minDays: 90,
        quantity: 12000,
        used: 9800,
      },
      {
        id: "L240110003",
        type: "rent",
        status: "off",
        price: 0.05,
        period: "天",
        deposit: 85,
        minDays: 90,
        quantity: 8000,
        used: 8000,
      },
    ],
    createdAt: "2024-05-08 14:30",
    updatedAt: "2024-10-20 16:45",
  },
  {
    code: "G2024040003",
    shop: "华东建设工程有限公司周转材料店",
    name: "钢支撑 Φ609×16 基坑内支撑",
    spec: "9m 标准节",
    category: "循环物资",
    subCategory: "支护类",
    unit: "吨",
    stock: 420,
    status: "active",
    listings: [
      {
        id: "L240408001",
        type: "sale",
        status: "off",
        price: 5800,
        minOrder: 10,
        quantity: 120,
        used: 120,
      },
      {
        id: "L240408002",
        type: "rent",
        status: "on",
        price: 12,
        period: "天",
        deposit: 3000,
        minDays: 180,
        quantity: 420,
        used: 410,
      },
    ],
    entrust: {
      types: ["rent"],
      provider: "华建周转材料服务有限公司",
      quantity: 120,
      rentPrice: 10,
      rentDeposit: 3000,
      months: 6,
      status: "accepted",
      createdAt: "2024-09-18",
    },
    createdAt: "2024-04-02 09:05",
    updatedAt: "2024-09-30 11:10",
  },
  {
    code: "G2024040010",
    shop: "华东建设工程有限公司周转材料店",
    name: "钢支撑 Φ609×16 基坑内支撑",
    spec: "12m 标准节",
    category: "循环物资",
    subCategory: "支护类",
    unit: "吨",
    stock: 260,
    status: "active",
    listings: [
      {
        id: "L240408003",
        type: "rent",
        status: "on",
        price: 12,
        period: "天",
        deposit: 3000,
        minDays: 180,
        quantity: 260,
        used: 180,
      },
    ],
    createdAt: "2024-04-02 09:05",
    updatedAt: "2024-09-30 11:10",
  },
  {
    code: "G2024040011",
    shop: "华东建设工程有限公司周转材料店",
    name: "钢支撑 Φ609×16 基坑内支撑",
    spec: "6m 调节节",
    category: "循环物资",
    subCategory: "支护类",
    unit: "吨",
    stock: 80,
    status: "active",
    listings: [
      {
        id: "L240408004",
        type: "sale",
        status: "on",
        price: 5600,
        minOrder: 5,
        quantity: 80,
        used: 12,
      },
    ],
    createdAt: "2024-04-02 09:05",
    updatedAt: "2024-09-30 11:10",
  },
  {
    code: "G2024050004",
    shop: "苏州分公司模板租赁店",
    name: "装配式围挡 2.5m 高 彩钢",
    spec: "2.5m×2.0m / 片",
    category: "循环物资",
    subCategory: "拼装类",
    unit: "片",
    stock: 860,
    status: "draft",
    listings: [
      {
        id: "L240520001",
        type: "sale",
        status: "off",
        price: 365,
        minOrder: 20,
        quantity: 860,
        used: 210,
      },
    ],
    createdAt: "2024-06-18 16:40",
    updatedAt: "2024-10-02 08:50",
  },
  {
    code: "G2024060005",
    shop: "华东建设工程有限公司周转材料店",
    name: "施工轨道 P43 钢轨 12.5m",
    spec: "43kg/m",
    category: "循环物资",
    subCategory: "轨道类",
    unit: "根",
    stock: 60,
    status: "off",
    listings: [
      {
        id: "L240611001",
        type: "rent",
        status: "off",
        price: 280,
        period: "月",
        deposit: 6000,
        minDays: 90,
        quantity: 60,
        used: 18,
      },
    ],
    createdAt: "2024-05-27 11:15",
    updatedAt: "2024-08-19 13:25",
  },
  {
    code: "G2024070006",
    shop: "杭州分公司脚手架专营店",
    name: "H 型钢 400×200×8×13",
    spec: "Q235B / 12m",
    category: "循环物资",
    subCategory: "型材类",
    unit: "吨",
    stock: 480,
    status: "active",
    listings: [
      {
        id: "L240703001",
        type: "sale",
        status: "on",
        price: 4280,
        minOrder: 5,
        quantity: 95,
        used: 30,
      },
      {
        id: "L240703002",
        type: "rent",
        status: "on",
        price: 9.5,
        period: "天",
        deposit: 2500,
        minDays: 60,
        quantity: 300,
        used: 120,
      },
    ],
    createdAt: "2024-07-09 10:00",
    updatedAt: "2024-10-25 17:05",
  },
  {
    code: "G2024100009",
    shop: "苏州分公司模板租赁店",
    name: "组合式钢模板 300×1500 平模",
    spec: "Q235 / 5mm 面板",
    category: "循环物资",
    subCategory: "模板类",
    unit: "块",
    stock: 2400,
    status: "active",
    listings: [
      {
        id: "L241022001",
        type: "sale",
        status: "on",
        price: 186,
        minOrder: 100,
        quantity: 1200,
        used: 160,
      },
    ],
    entrust: {
      types: ["sale", "rent"],
      provider: "中建租赁服务（上海）有限公司",
      quantity: 800,
      salePrice: 175,
      rentPrice: 0.35,
      rentDeposit: 150,
      months: 12,
      status: "pending",
      createdAt: "2024-10-27",
    },
    createdAt: "2024-08-21 15:30",
    updatedAt: "2024-10-27 10:15",
  },
  {
    code: "G2024080007",
    shop: "华东建设工程有限公司周转材料店",
    name: "YJV 低压电缆 3×95+1×50",
    spec: "0.6/1kV / 米",
    category: "循环物资",
    subCategory: "电线电缆",
    unit: "米",
    stock: 8000,
    status: "violation",
    statusNote: "商品图片含联系方式水印，违反平台发布规范",
    listings: [
      {
        id: "L240816001",
        type: "rent",
        status: "off",
        price: 0.35,
        period: "天",
        deposit: 45,
        minDays: 30,
        quantity: 8000,
        used: 7900,
      },
    ],
    createdAt: "2024-09-12 09:45",
    updatedAt: "2024-10-22 10:00",
  },
  {
    code: "G2024090008",
    shop: "苏州分公司模板租赁店",
    name: "打包箱式活动房 3×6m 标准箱",
    spec: "含门窗 / 不含电",
    category: "循环物资",
    subCategory: "房屋建筑类",
    unit: "个",
    stock: 64,
    status: "rejected",
    statusNote: "缺少产品合格证明材料，请补充后重新提交",
    listings: [
      {
        id: "L240905001",
        type: "sale",
        status: "off",
        price: 16800,
        minOrder: 1,
        quantity: 24,
        used: 6,
      },
      {
        id: "L240905002",
        type: "rent",
        status: "off",
        price: 980,
        period: "月",
        deposit: 5000,
        minDays: 180,
        quantity: 40,
        used: 33,
      },
    ],
    createdAt: "2024-10-16 13:20",
    updatedAt: "2024-10-18 09:35",
  },
];

export const bizMeta: Record<BizType, { label: string; className: string }> = {
  sale: {
    label: "出售",
    className: "bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/30",
  },
  rent: {
    label: "出租",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

const listingStatusMeta: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  on: {
    label: "上架中",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  off: {
    label: "已下架",
    className: "bg-muted text-muted-foreground ring-border",
  },
};

const goodsStatusOrder: GoodsStatus[] = [
  "draft",
  "active",
  "off",
  "violation",
  "rejected",
];

const goodsStatusMeta: Record<
  GoodsStatus,
  { label: string; className: string; countClass: string }
> = {
  draft: {
    label: "草稿",
    className: "bg-muted text-muted-foreground ring-border",
    countClass: "text-muted-foreground",
  },
  active: {
    label: "运营中",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    countClass: "text-emerald-700",
  },
  off: {
    label: "已下架",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
    countClass: "text-gray-600",
  },
  violation: {
    label: "违规下架",
    className: "bg-red-50 text-red-600 ring-red-200",
    countClass: "text-red-600",
  },
  rejected: {
    label: "审核驳回",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    countClass: "text-amber-700",
  },
};

/** 同名商品的多个规格归为一组（保持首次出现顺序）；列表按组展示，规格明细在展开区与详情页中逐条列出 */
export type SpecGroup<T> = { name: string; items: T[] };

export function groupSpecs<T extends { name: string }>(
  list: T[],
): SpecGroup<T>[] {
  const groups: SpecGroup<T>[] = [];
  for (const item of list) {
    const g = groups.find((x) => x.name === item.name);
    if (g) g.items.push(item);
    else groups.push({ name: item.name, items: [item] });
  }
  return groups;
}

/** 分组行的编码列：单规格直接显示编码，多规格显示首个编码并标注数量 */
export function GroupCode({ codes }: { codes: string[] }) {
  return (
    <span className="flex flex-col font-mono text-xs leading-4 text-muted-foreground">
      <span>{codes[0]}</span>
      {codes.length > 1 && (
        <span className="text-[11px]">等 {codes.length} 个</span>
      )}
    </span>
  );
}

/** 分组行的名称列：名称旁标注规格数量 */
export function GroupName({
  name,
  size,
  sub,
}: {
  name: string;
  size: number;
  sub?: string;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-medium" title={name}>
          {name}
        </span>
        {size > 1 && (
          <Tag className="shrink-0 bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/20">
            {size} 规格
          </Tag>
        )}
      </span>
      {sub && (
        <span className="truncate text-[11px] leading-4 text-muted-foreground">
          {sub}
        </span>
      )}
    </span>
  );
}

/** 分组行的状态列：各规格状态一致时显示单个标签，否则按状态汇总数量 */
export function StatusSummary<S extends string>({
  statuses,
  order,
  meta,
}: {
  statuses: S[];
  order: readonly S[];
  meta: Record<S, { label: string; className: string }>;
}) {
  const counts = order
    .map((st) => ({ st, n: statuses.filter((x) => x === st).length }))
    .filter((x) => x.n > 0);
  if (counts.length === 0)
    return <span className="text-xs text-muted-foreground">—</span>;
  if (counts.length === 1)
    return (
      <Tag className={meta[counts[0].st].className}>
        {meta[counts[0].st].label}
      </Tag>
    );
  return (
    <span className="flex flex-wrap gap-1">
      {counts.map(({ st, n }) => (
        <Tag key={st} className={meta[st].className}>
          {meta[st].label} {n}
        </Tag>
      ))}
    </span>
  );
}

/** 详情页：返回条 + 标题区 */
export function DetailHeader({
  title,
  subtitle,
  tags,
  actions,
  onBack,
}: {
  title: string;
  subtitle?: React.ReactNode;
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card px-5 py-4">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-[#1890ff]"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        返回列表
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            {tags}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

/** 详情页：统计卡片 */
export function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-card px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="text-xl font-semibold tabular-nums leading-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </span>
      {hint && (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

/** 详情页：带标题的卡片区块 */
export function DetailSection({
  title,
  extra,
  children,
  flush,
}: {
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-medium">{title}</h3>
        {extra && <div className="text-xs text-muted-foreground">{extra}</div>}
      </div>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/** 详情页：描述列表项 */
export function DescItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function Tag({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded px-1.5 text-xs ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function fmtPrice(n: number) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: n < 1 ? 2 : 0,
    maximumFractionDigits: 3,
  });
}

export function ActionLink({
  children,
  tone = "primary",
  onClick,
}: {
  children: React.ReactNode;
  tone?: "primary" | "danger";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-xs hover:underline",
        tone === "primary" ? "text-[#1890ff]" : "text-red-600",
      )}
    >
      {children}
    </button>
  );
}

type GoodsAction =
  "detail" | "edit" | "list" | "stock" | "off" | "entrust" | "cancelEntrust";

function GoodsActions({
  goods,
  onAction,
  hideDetail,
}: {
  goods: Goods;
  onAction: (a: GoodsAction) => void;
  hideDetail?: boolean;
}) {
  const detailLink = hideDetail ? null : (
    <ActionLink onClick={() => onAction("detail")}>详情</ActionLink>
  );
  const entrustLink = !goods.entrust ? (
    <ActionLink onClick={() => onAction("entrust")}>委托</ActionLink>
  ) : goods.entrust.status === "pending" ? (
    <ActionLink tone="danger" onClick={() => onAction("cancelEntrust")}>
      撤回委托
    </ActionLink>
  ) : null;
  const actions: Record<GoodsStatus, React.ReactNode> = {
    draft: (
      <>
        <ActionLink onClick={() => onAction("edit")}>编辑</ActionLink>
        <ActionLink>提交审核</ActionLink>
        <ActionLink tone="danger">删除</ActionLink>
      </>
    ),
    active: (
      <>
        {detailLink}
        <ActionLink onClick={() => onAction("edit")}>编辑</ActionLink>
        <ActionLink onClick={() => onAction("list")}>上架</ActionLink>
        <ActionLink onClick={() => onAction("stock")}>调整库存</ActionLink>
        {entrustLink}
        <ActionLink tone="danger" onClick={() => onAction("off")}>
          下架
        </ActionLink>
      </>
    ),
    off: (
      <>
        {detailLink}
        <ActionLink onClick={() => onAction("edit")}>编辑</ActionLink>
        <ActionLink onClick={() => onAction("list")}>重新上架</ActionLink>
        {entrustLink}
      </>
    ),
    violation: (
      <>
        {detailLink}
        <ActionLink>查看违规原因</ActionLink>
        <ActionLink>整改后重新提交</ActionLink>
      </>
    ),
    rejected: (
      <>
        {detailLink}
        <ActionLink>编辑</ActionLink>
        <ActionLink>重新提交审核</ActionLink>
      </>
    ),
  };
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {actions[goods.status]}
    </span>
  );
}

/* ---------- 操作弹窗 ---------- */

/** 上架中记录占用的库存，调整库存时不可低于该值 */
function lockedStock(g: Goods) {
  return g.listings
    .filter((l) => l.status === "on")
    .reduce((s, l) => s + l.quantity, 0);
}

export function Modal({
  title,
  titleId,
  width = "max-w-[520px]",
  children,
  footer,
  onClose,
}: {
  title: string;
  titleId: string;
  width?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "flex w-full flex-col rounded-md bg-card shadow-xl",
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 id={titleId} className="text-base font-semibold">
            {title}
          </h3>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function DialogField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm">
        {required && <span className="mr-0.5 text-red-500">*</span>}
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function DialogInput({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: "text" | "number";
}) {
  return (
    <div className="flex h-9 items-center rounded border border-border bg-background text-sm focus-within:border-[#1890ff]">
      {prefix && <span className="pl-3 text-muted-foreground">{prefix}</span>}
      <input
        aria-label={label}
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-xs placeholder:text-muted-foreground/60"
      />
      {suffix && (
        <span className="pr-3 text-xs text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}

function GoodsSummary({ goods }: { goods: Goods }) {
  return (
    <div className="flex items-center gap-3 rounded bg-muted/40 px-3 py-2 text-sm">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{goods.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {goods.code} · {goods.spec}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        总库存{" "}
        <span className="tabular-nums text-foreground">
          {goods.stock.toLocaleString()}
        </span>{" "}
        {goods.unit}
      </span>
    </div>
  );
}

export const PRIMARY_BTN = "bg-[#1890ff] hover:bg-[#1890ff]/90";

export const PROVIDERS = [
  "华建周转材料服务有限公司",
  "中建租赁服务（上海）有限公司",
  "筑友设备运营服务商",
  "鼎盛建材流通服务中心",
];
const ENTRUST_MONTHS = ["3 个月", "6 个月", "12 个月"];

/** 委托：将商品委托给服务商代为出售 / 出租，服务商受理后可加价上架 */
function EntrustDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: Goods;
  onClose: () => void;
  onConfirm: (e: Entrust) => void;
}) {
  const available = goods.stock - lockedStock(goods);
  const [types, setTypes] = useState<BizType[]>([]);
  const [provider, setProvider] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [rentDeposit, setRentDeposit] = useState("");
  const [months, setMonths] = useState("6 个月");

  const toggleType = (t: BizType) =>
    setTypes((list) =>
      list.includes(t) ? list.filter((x) => x !== t) : [...list, t],
    );

  const qty = Number(quantity);
  const qtyOk = qty > 0 && qty <= available;
  const saleOk = !types.includes("sale") || Number(salePrice) > 0;
  const rentOk =
    !types.includes("rent") ||
    (Number(rentPrice) > 0 && rentDeposit !== "" && Number(rentDeposit) >= 0);
  const ok = types.length > 0 && provider !== "" && qtyOk && saleOk && rentOk;

  const submit = () => {
    if (!ok) return;
    onConfirm({
      types: (["sale", "rent"] as BizType[]).filter((t) => types.includes(t)),
      provider,
      quantity: qty,
      salePrice: types.includes("sale") ? Number(salePrice) : undefined,
      rentPrice: types.includes("rent") ? Number(rentPrice) : undefined,
      rentDeposit: types.includes("rent") ? Number(rentDeposit) : undefined,
      months: Number.parseInt(months, 10),
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <Modal
      title="委托服务商运营"
      titleId="entrust-dialog-title"
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
            提交委托
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />
      <DialogField
        label="委托方式"
        required
        hint="可同时勾选；服务商受理后按您填写的底价加价上架，差价为服务商收益"
      >
        <div
          role="group"
          aria-label="委托方式"
          className="grid grid-cols-2 gap-2"
        >
          {(["sale", "rent"] as BizType[]).map((t) => {
            const active = types.includes(t);
            return (
              <button
                key={t}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => toggleType(t)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded border text-sm transition-colors",
                  active
                    ? "border-[#1890ff] bg-[#1890ff]/5 text-[#1890ff]"
                    : "border-border hover:border-[#1890ff]/50",
                )}
              >
                {active && <CheckCircle2 className="size-3.5" aria-hidden />}
                委托{bizMeta[t].label}
              </button>
            );
          })}
        </div>
      </DialogField>
      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField label="服务商" required>
          <Select
            label="服务商"
            placeholder="请选择服务商"
            value={provider}
            options={PROVIDERS}
            onChange={setProvider}
          />
        </DialogField>
        <DialogField
          label="委托数量"
          required
          hint={
            quantity && !qtyOk
              ? `不可超过可委托库存 ${available.toLocaleString()} ${goods.unit}`
              : `可委托库存 ${available.toLocaleString()} ${goods.unit}`
          }
        >
          <DialogInput
            label="委托数量"
            type="number"
            value={quantity}
            onChange={setQuantity}
            placeholder="0"
            suffix={goods.unit}
          />
        </DialogField>
        {types.includes("sale") && (
          <DialogField label="出售底价" required>
            <DialogInput
              label="出售底价"
              type="number"
              value={salePrice}
              onChange={setSalePrice}
              placeholder="0.00"
              prefix="¥"
              suffix={`/ ${goods.unit}`}
            />
          </DialogField>
        )}
        {types.includes("rent") && (
          <>
            <DialogField label="出租底价" required>
              <DialogInput
                label="出租底价"
                type="number"
                value={rentPrice}
                onChange={setRentPrice}
                placeholder="0.00"
                prefix="¥"
                suffix={`/ ${goods.unit} / 天`}
              />
            </DialogField>
            <DialogField label="押金" required>
              <DialogInput
                label="押金"
                type="number"
                value={rentDeposit}
                onChange={setRentDeposit}
                placeholder="0.00"
                prefix="¥"
                suffix={`/ ${goods.unit}`}
              />
            </DialogField>
          </>
        )}
        <DialogField label="委托期限" required>
          <Select
            label="委托期限"
            placeholder="请选择"
            value={months}
            options={ENTRUST_MONTHS}
            onChange={setMonths}
          />
        </DialogField>
      </div>
    </Modal>
  );
}

const TAX_RATES = ["不含税", "1%", "3%", "6%", "9%", "13%"];
const PAY_TERMS = ["先款后货", "货到付款"] as const;
type PayTerm = (typeof PAY_TERMS)[number];

/** 上架：为商品新增一条上架记录，并在此确定该租售方式的运营规则（税率、结算、议价、租期等） */
function ListDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: Goods;
  onClose: () => void;
  onConfirm: (l: Listing) => void;
}) {
  const available = goods.stock - lockedStock(goods);
  const [type, setType] = useState<BizType>("sale");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [period, setPeriod] = useState<"天" | "月">("天");
  const [deposit, setDeposit] = useState("");
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");
  const [taxRate, setTaxRate] = useState("13%");
  const [payTerm, setPayTerm] = useState<PayTerm>("先款后货");
  const [negotiable, setNegotiable] = useState(false);
  const [lossRule, setLossRule] = useState("");

  const qty = Number(quantity);
  const qtyOk = qty > 0 && qty <= available;
  const rentOk =
    Number(deposit) >= 0 &&
    deposit !== "" &&
    Number(minDays) > 0 &&
    (maxDays === "" || Number(maxDays) >= Number(minDays));
  const ok =
    Number(price) > 0 &&
    qtyOk &&
    Boolean(taxRate) &&
    (type === "sale" || rentOk);

  const submit = () => {
    if (!ok) return;
    const id = `L${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${String(goods.listings.length + 1).padStart(3, "0")}`;
    const common = {
      id,
      status: "on" as const,
      price: Number(price),
      quantity: qty,
      used: 0,
      taxRate,
      payTerm,
      negotiable,
    };
    onConfirm(
      type === "sale"
        ? { ...common, type, minOrder: minOrder ? Number(minOrder) : undefined }
        : {
            ...common,
            type,
            period,
            deposit: Number(deposit),
            minDays: Number(minDays),
            maxDays: maxDays ? Number(maxDays) : undefined,
            lossRule: lossRule.trim() || undefined,
          },
    );
  };

  return (
    <Modal
      title={goods.status === "off" ? "重新上架" : "新增上架"}
      titleId="list-dialog-title"
      width="max-w-[640px]"
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
      <DialogField
        label="租售方式"
        required
        hint="同一商品可多次上架，每条上架记录对应一种租售方式及其运营规则"
      >
        <div
          role="radiogroup"
          aria-label="租售方式"
          className="grid grid-cols-2 gap-2"
        >
          {(["sale", "rent"] as BizType[]).map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(t)}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded border text-sm transition-colors",
                  active
                    ? "border-[#1890ff] bg-[#1890ff]/5 text-[#1890ff]"
                    : "border-border hover:border-[#1890ff]/50",
                )}
              >
                <span className="font-medium">{bizMeta[t].label}</span>
                <span
                  className={cn(
                    "text-[11px]",
                    active ? "text-[#1890ff]/80" : "text-muted-foreground",
                  )}
                >
                  {t === "sale"
                    ? "按单价一次性售出，库存随成交扣减"
                    : "按天或按月计租，归还后库存回收"}
                </span>
              </button>
            );
          })}
        </div>
      </DialogField>

      <ListGroup title="价格与数量">
        <div className="grid gap-4 sm:grid-cols-2">
          {type === "rent" && (
            <DialogField label="计租周期" required>
              <div
                role="radiogroup"
                aria-label="计租周期"
                className="flex h-9 items-center gap-4 text-sm"
              >
                {(["天", "月"] as const).map((p) => (
                  <label key={p} className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="list-period"
                      checked={period === p}
                      onChange={() => setPeriod(p)}
                      className="accent-[#1890ff]"
                    />
                    按{p}
                  </label>
                ))}
              </div>
            </DialogField>
          )}
          <DialogField
            label={type === "sale" ? "销售单价" : "租金单价"}
            required
          >
            <DialogInput
              label="单价"
              type="number"
              value={price}
              onChange={setPrice}
              placeholder="0.00"
              prefix="¥"
              suffix={
                type === "sale"
                  ? `/ ${goods.unit}`
                  : `/ ${goods.unit} / ${period}`
              }
            />
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
            <DialogField label="押金" required hint="归还验收合格后退还">
              <DialogInput
                label="押金"
                type="number"
                value={deposit}
                onChange={setDeposit}
                placeholder="0.00"
                prefix="¥"
                suffix={`/ ${goods.unit}`}
              />
            </DialogField>
          )}
          <DialogField
            label="上架数量"
            required
            hint={
              quantity && !qtyOk
                ? `不可超过可上架库存 ${available.toLocaleString()} ${goods.unit}`
                : `可上架库存 ${available.toLocaleString()} ${goods.unit}（总库存减去上架中记录占用）`
            }
          >
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
      </ListGroup>

      <ListGroup title={type === "sale" ? "出售规则" : "出租规则"}>
        <div className="grid gap-4 sm:grid-cols-2">
          {type === "rent" && (
            <>
              <DialogField label="最短租期" required>
                <DialogInput
                  label="最短租期"
                  type="number"
                  value={minDays}
                  onChange={setMinDays}
                  placeholder="0"
                  suffix={period}
                />
              </DialogField>
              <DialogField
                label="最长租期"
                hint={
                  maxDays && Number(maxDays) < Number(minDays)
                    ? "不可小于最短租期"
                    : undefined
                }
              >
                <DialogInput
                  label="最长租期"
                  type="number"
                  value={maxDays}
                  onChange={setMaxDays}
                  placeholder="不限"
                  suffix={period}
                />
              </DialogField>
            </>
          )}
          <DialogField
            label="税率"
            required
            hint={
              taxRate === "不含税"
                ? type === "sale"
                  ? "价格为不含税报价"
                  : "租金为不含税报价"
                : undefined
            }
          >
            <select
              aria-label="税率"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm outline-none focus:border-[#1890ff]"
            >
              {TAX_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </DialogField>
          <DialogField label="结算方式" required>
            <div
              role="radiogroup"
              aria-label="结算方式"
              className="flex h-9 items-center gap-4 text-sm"
            >
              {PAY_TERMS.map((t) => (
                <label key={t} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="list-pay-term"
                    checked={payTerm === t}
                    onChange={() => setPayTerm(t)}
                    className="accent-[#1890ff]"
                  />
                  {t}
                </label>
              ))}
            </div>
          </DialogField>
          <DialogField label="议价">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="accent-[#1890ff]"
              />
              支持{type === "sale" ? "买" : "租"}方发起议价
            </label>
          </DialogField>
          {type === "rent" && (
            <div className="sm:col-span-2">
              <DialogField label="损耗赔付标准">
                <textarea
                  aria-label="损耗赔付标准"
                  value={lossRule}
                  onChange={(e) => setLossRule(e.target.value)}
                  rows={2}
                  placeholder="说明归还时的验收标准及损坏、丢失的赔付方式，如：板面破损超过 10% 按原价 60% 赔付"
                  className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:border-[#1890ff]"
                />
              </DialogField>
            </div>
          )}
        </div>
      </ListGroup>
    </Modal>
  );
}

function ListGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded border p-3">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      {children}
    </div>
  );
}

/** 调整库存：直接修改总库存数量 */
function StockDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: Goods;
  onClose: () => void;
  onConfirm: (stock: number) => void;
}) {
  const locked = lockedStock(goods);
  const [amount, setAmount] = useState(String(goods.stock));

  const next = Number(amount);
  const amountOk = amount !== "" && Number.isInteger(next) && next >= 0;
  const belowLocked = amountOk && next < locked;
  const changed = next !== goods.stock;
  const ok = amountOk && !belowLocked && changed;

  return (
    <Modal
      title="调整库存"
      titleId="stock-dialog-title"
      width="max-w-[440px]"
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
            onClick={() => onConfirm(next)}
          >
            确认调整
          </Button>
        </>
      }
    >
      <GoodsSummary goods={goods} />
      <DialogField
        label="总库存"
        required
        hint={
          belowLocked
            ? `上架中记录已占用 ${locked.toLocaleString()} ${goods.unit}，库存不可低于该值`
            : `当前 ${goods.stock.toLocaleString()} ${goods.unit}，上架中记录占用 ${locked.toLocaleString()} ${goods.unit}`
        }
      >
        <DialogInput
          label="总库存"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0"
          suffix={goods.unit}
        />
      </DialogField>
    </Modal>
  );
}

const OFF_REASONS = [
  "库存不足",
  "价格调整",
  "暂停经营",
  "商品信息变更",
  "其他",
];

/** 下架：商品整体下架，所有上架中记录同步下架 */
function OffDialog({
  goods,
  onClose,
  onConfirm,
}: {
  goods: Goods;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const onCount = goods.listings.filter((l) => l.status === "on").length;
  const ok = reason !== "";

  return (
    <Modal
      title="确认下架商品？"
      titleId="off-dialog-title"
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
            disabled={!ok}
            onClick={() => onConfirm(note ? `${reason}：${note}` : reason)}
          >
            确认下架
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle className="size-4" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          下架后「{goods.name}」将从门户隐藏，{onCount}{" "}
          条上架中记录同步下架，买/租方无法浏览和下单；进行中的订单与合同不受影响。下架后可在列表中重新上架。
        </p>
      </div>
      <DialogField label="下架原因" required>
        <Select
          label="下架原因"
          placeholder="请选择原因"
          value={reason}
          options={OFF_REASONS}
          onChange={setReason}
        />
      </DialogField>
      <DialogField label="补充说明">
        <DialogInput
          label="补充说明"
          value={note}
          onChange={setNote}
          placeholder="选填"
        />
      </DialogField>
    </Modal>
  );
}

type EntrustFilter = "" | "has" | "none" | "pending" | "accepted";
type Filters = {
  code: string;
  name: string;
  category: string;
  status: GoodsStatus | "";
  entrust: EntrustFilter;
};
const emptyFilters: Filters = {
  code: "",
  name: "",
  category: "",
  status: "",
  entrust: "",
};

const entrustOptions: { label: string; value: EntrustFilter }[] = [
  { label: "有委托", value: "has" },
  { label: "有 · 待受理", value: "pending" },
  { label: "有 · 已受理", value: "accepted" },
  { label: "无委托", value: "none" },
];

const statusOptions: { label: string; value: GoodsStatus }[] =
  goodsStatusOrder.map((s) => ({
    label: goodsStatusMeta[s].label,
    value: s,
  }));
const allCategories = categoryTree.flatMap((g) => g.children);

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      aria-label={label}
      value={value}
      placeholder="请输入"
      onChange={(e) => onChange(e.target.value)}
      className="h-9 flex-1 rounded border border-border bg-background px-3 text-sm placeholder:text-xs placeholder:text-muted-foreground/60"
    />
  );
}

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

function FilterPanel({
  draft,
  onDraftChange,
  onSearch,
  onReset,
  onCreate,
}: {
  draft: Filters;
  onDraftChange: (f: Filters) => void;
  onSearch: () => void;
  onReset: () => void;
  onCreate: () => void;
}) {
  const statusLabel =
    statusOptions.find((o) => o.value === draft.status)?.label ?? "";
  const entrustLabel =
    entrustOptions.find((o) => o.value === draft.entrust)?.label ?? "";
  return (
    <div className="flex flex-col gap-4 rounded-md bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FilterRow label="商品编码">
          <FilterInput
            label="商品编码"
            value={draft.code}
            onChange={(code) => onDraftChange({ ...draft, code })}
          />
        </FilterRow>
        <FilterRow label="商品名称">
          <FilterInput
            label="商品名称"
            value={draft.name}
            onChange={(name) => onDraftChange({ ...draft, name })}
          />
        </FilterRow>
        <FilterRow label="品类">
          <Select
            label="品类"
            value={draft.category}
            placeholder="全部品类"
            options={allCategories}
            onChange={(category) => onDraftChange({ ...draft, category })}
          />
        </FilterRow>
        <FilterRow label="状态">
          <Select
            label="状态"
            value={statusLabel}
            placeholder="全部"
            options={statusOptions.map((o) => o.label)}
            onChange={(l) =>
              onDraftChange({
                ...draft,
                status: statusOptions.find((o) => o.label === l)?.value ?? "",
              })
            }
          />
        </FilterRow>
        <FilterRow label="委托情况">
          <Select
            label="委托情况"
            value={entrustLabel}
            placeholder="全部"
            options={entrustOptions.map((o) => o.label)}
            onChange={(l) =>
              onDraftChange({
                ...draft,
                entrust: entrustOptions.find((o) => o.label === l)?.value ?? "",
              })
            }
          />
        </FilterRow>
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="bg-[#1890ff] hover:bg-[#1890ff]/90"
          onClick={onSearch}
        >
          <Search data-icon="inline-start" />
          查询
        </Button>
        <Button variant="outline" onClick={onReset}>
          重置
        </Button>
        <Button variant="outline" className="ml-auto" onClick={onCreate}>
          <Plus data-icon="inline-start" />
          发布商品
        </Button>
      </div>
    </div>
  );
}

function matches(g: Goods, f: Filters) {
  if (f.code && !g.code.toLowerCase().includes(f.code.trim().toLowerCase()))
    return false;
  if (f.name && !g.name.includes(f.name.trim())) return false;
  if (f.category && g.subCategory !== f.category) return false;
  if (f.status && g.status !== f.status) return false;
  if (f.entrust === "has" && !g.entrust) return false;
  if (f.entrust === "none" && g.entrust) return false;
  if (
    (f.entrust === "pending" || f.entrust === "accepted") &&
    g.entrust?.status !== f.entrust
  )
    return false;
  return true;
}

const columns =
  "48px 118px minmax(170px,1.5fr) minmax(130px,1fr) 120px 90px minmax(100px,0.8fr) 80px 92px minmax(150px,1fr)";
const specColumns =
  "40px 118px minmax(160px,1.2fr) 100px 100px 100px minmax(100px,0.8fr) 90px minmax(200px,1fr)";
const listingColumns = "120px 72px minmax(160px,1fr) 110px 80px 130px";
const entrustColumns =
  "100px 72px minmax(160px,1fr) 100px minmax(170px,1fr) 80px 90px";

const entrustStatusMeta: Record<
  Entrust["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "待受理",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  accepted: {
    label: "已受理",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

/** 委托记录：一条委托按出售 / 出租拆成多行展示，便于逐项查看底价 */
function EntrustTable({
  goods,
  onCancel,
}: {
  goods: Goods;
  onCancel: () => void;
}) {
  const e = goods.entrust;
  if (!e) return null;
  const meta = entrustStatusMeta[e.status];
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">委托记录</span>
        <span className="text-muted-foreground">共 {e.types.length} 条</span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: entrustColumns }}
      >
        <span>委托日期</span>
        <span>委托方式</span>
        <span>服务商</span>
        <span>委托数量</span>
        <span>底价</span>
        <span>受理情况</span>
        <span>操作</span>
      </div>
      {e.types.map((t, i) => (
        <div
          key={t}
          className={cn(
            "grid items-center gap-3 px-3 py-2 text-sm",
            i > 0 && "border-t border-border",
          )}
          style={{ gridTemplateColumns: entrustColumns }}
        >
          <span className="font-mono text-xs text-muted-foreground">
            {e.createdAt}
          </span>
          <Tag className={bizMeta[t].className}>{bizMeta[t].label}</Tag>
          <span className="truncate" title={e.provider}>
            {e.provider}
          </span>
          <span className="tabular-nums">
            {e.quantity.toLocaleString()} {goods.unit}
          </span>
          <span className="text-xs tabular-nums">
            {t === "sale" ? (
              <>
                ¥ {fmtPrice(e.salePrice ?? 0)} / {goods.unit}
              </>
            ) : (
              <>
                ¥ {fmtPrice(e.rentPrice ?? 0)} / {goods.unit} / 天
                {e.rentDeposit !== undefined
                  ? `，押金 ¥ ${fmtPrice(e.rentDeposit)}`
                  : ""}
              </>
            )}
          </span>
          <Tag className={meta.className}>{meta.label}</Tag>
          <span className="flex items-center gap-3">
            <ActionLink>详情</ActionLink>
            {e.status === "pending" && (
              <ActionLink tone="danger" onClick={onCancel}>
                撤回
              </ActionLink>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

const usedLabel = (t: BizType) => (t === "sale" ? "已售" : "已租");

/** 表头按该商品上架记录的租售类型取名：只有出售显示「已售」，只有出租显示「已租」，混合时为「已售 / 已租」并在行内标注 */
function listingUsedHeader(listings: Listing[]) {
  const types = new Set(listings.map((l) => l.type));
  if (types.size === 1) return usedLabel([...types][0]);
  return "已售 / 已租";
}

function ListingTable({ goods }: { goods: Goods }) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">上架记录</span>
        <span className="text-muted-foreground">
          共 {goods.listings.length} 条
        </span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: listingColumns }}
      >
        <span>上架单号</span>
        <span>租售方式</span>
        <span>价格</span>
        <span>{listingUsedHeader(goods.listings)}</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      {goods.listings.map((l) => {
        const meta = bizMeta[l.type];
        const mixed = new Set(goods.listings.map((x) => x.type)).size > 1;
        return (
          <div
            key={l.id}
            className="grid items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
            style={{ gridTemplateColumns: listingColumns }}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {l.id}
            </span>
            <Tag className={meta.className}>{meta.label}</Tag>
            <span className="flex flex-col leading-tight">
              <span className="tabular-nums">
                ¥ {fmtPrice(l.price)} / {goods.unit}
                {l.type === "rent" && l.period ? ` / ${l.period}` : ""}
              </span>
              {(l.taxRate || l.payTerm || l.negotiable) && (
                <span className="text-[11px] text-muted-foreground">
                  {[
                    l.taxRate && `税率 ${l.taxRate}`,
                    l.payTerm,
                    l.negotiable && "可议价",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </span>
            <span className="tabular-nums">
              {mixed && (
                <span className="mr-1 text-xs text-muted-foreground">
                  {usedLabel(l.type)}
                </span>
              )}
              {l.used.toLocaleString()} {goods.unit}
            </span>
            <Tag className={listingStatusMeta[l.status].className}>
              {listingStatusMeta[l.status].label}
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

/** 规格明细：一组同名商品下各规格的编码、库存、状态与操作，可带出该规格的上架 / 委托记录 */
function SpecTable({
  items,
  onAction,
  withRecords,
  hideDetail,
}: {
  items: Goods[];
  onAction: (g: Goods, a: GoodsAction) => void;
  withRecords?: boolean;
  hideDetail?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">规格明细</span>
        <span className="text-muted-foreground">共 {items.length} 个规格</span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: specColumns }}
      >
        <span>序号</span>
        <span>商品编码</span>
        <span>规格型号</span>
        <span>总库存</span>
        <span>上架占用</span>
        <span>可上架</span>
        <span>状态</span>
        <span>委托情况</span>
        <span>操作</span>
      </div>
      {items.map((g, i) => {
        const locked = lockedStock(g);
        const meta = goodsStatusMeta[g.status];
        return (
          <Fragment key={g.code}>
            <div
              className={cn(
                "grid items-center gap-3 border-b border-border px-3 py-2.5 text-sm",
                !withRecords && "last:border-0",
              )}
              style={{ gridTemplateColumns: specColumns }}
            >
              <span className="text-xs text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {g.code}
              </span>
              <span className="truncate font-medium" title={g.spec}>
                {g.spec}
              </span>
              <span className="tabular-nums">
                {g.stock.toLocaleString()} {g.unit}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {locked.toLocaleString()} {g.unit}
              </span>
              <span className="tabular-nums">
                {(g.stock - locked).toLocaleString()} {g.unit}
              </span>
              <span className="flex min-w-0 flex-col items-start gap-1">
                <Tag className={meta.className}>{meta.label}</Tag>
                {g.statusNote && (
                  <span
                    className="line-clamp-1 text-[11px] leading-4 text-muted-foreground"
                    title={g.statusNote}
                  >
                    {g.statusNote}
                  </span>
                )}
              </span>
              <span className="flex flex-col items-start gap-0.5">
                {g.entrust ? (
                  <>
                    <Tag className="bg-violet-50 text-violet-700 ring-violet-200">
                      有
                    </Tag>
                    <span className="text-[11px] leading-4 text-muted-foreground">
                      {entrustStatusMeta[g.entrust.status].label}
                    </span>
                  </>
                ) : (
                  <Tag className="bg-muted text-muted-foreground ring-border">
                    无
                  </Tag>
                )}
              </span>
              <GoodsActions
                goods={g}
                hideDetail={hideDetail}
                onAction={(a) => onAction(g, a)}
              />
            </div>
            {withRecords && (
              <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-3 py-3 pl-[52px] last:border-0">
                <ListingTable goods={g} />
                {g.entrust && (
                  <EntrustTable
                    goods={g}
                    onCancel={() => onAction(g, "cancelEntrust")}
                  />
                )}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/** 商品详情页：汇总一组同名规格的基本信息、规格明细与各规格的上架 / 委托记录 */
function GoodsDetail({
  group,
  onBack,
  onAction,
}: {
  group: SpecGroup<Goods>;
  onBack: () => void;
  onAction: (g: Goods, a: GoodsAction) => void;
}) {
  const items = group.items;
  const head = items[0];
  const totalStock = items.reduce((s, g) => s + g.stock, 0);
  const onListings = items
    .flatMap((g) => g.listings)
    .filter((l) => l.status === "on");
  const saleUsed = items
    .flatMap((g) => g.listings)
    .filter((l) => l.type === "sale")
    .reduce((s, l) => s + l.used, 0);
  const rentUsed = items
    .flatMap((g) => g.listings)
    .filter((l) => l.type === "rent")
    .reduce((s, l) => s + l.used, 0);
  const entrusted = items.filter((g) => g.entrust).length;
  const createdAt = items.map((g) => g.createdAt).sort()[0];
  const updatedAt = items
    .map((g) => g.updatedAt)
    .sort()
    .at(-1);
  const canList = items.some(
    (g) => g.status === "active" || g.status === "off",
  );

  return (
    <div className="flex flex-col gap-4">
      <DetailHeader
        title={group.name}
        onBack={onBack}
        tags={
          <>
            {items.length > 1 && (
              <Tag className="bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/20">
                {items.length} 规格
              </Tag>
            )}
            <StatusSummary
              statuses={items.map((g) => g.status)}
              order={goodsStatusOrder}
              meta={goodsStatusMeta}
            />
          </>
        }
        subtitle={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span>{head.shop}</span>
            <span>
              {head.category} / {head.subCategory}
            </span>
            <span>计量单位：{head.unit}</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(head, "edit")}
            >
              编辑商品
            </Button>
            {canList && items.length === 1 && (
              <Button
                size="sm"
                className={PRIMARY_BTN}
                onClick={() => onAction(head, "list")}
              >
                上架
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="总库存"
          value={totalStock}
          unit={head.unit}
          hint={`${items.length} 个规格合计`}
        />
        <StatCard
          label="上架中记录"
          value={onListings.length}
          unit="条"
          hint={`占用库存 ${onListings.reduce((s, l) => s + l.quantity, 0).toLocaleString()} ${head.unit}`}
        />
        <StatCard
          label="累计已售 / 已租"
          value={`${saleUsed.toLocaleString()} / ${rentUsed.toLocaleString()}`}
          unit={head.unit}
        />
        <StatCard
          label="委托运营"
          value={entrusted ? `${entrusted} / ${items.length}` : "无"}
          unit={entrusted ? "个规格" : undefined}
          hint={entrusted ? "已委托给服务商代为运营" : "全部由本店自营"}
        />
      </div>

      <DetailSection title="基本信息">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DescItem label="商品名称">{group.name}</DescItem>
          <DescItem label="所属店铺">{head.shop}</DescItem>
          <DescItem label="品类">
            {head.category} / {head.subCategory}
          </DescItem>
          <DescItem label="计量单位">{head.unit}</DescItem>
          <DescItem label="商品编码">
            <span className="font-mono text-xs">
              {items.map((g) => g.code).join("、")}
            </span>
          </DescItem>
          <DescItem label="规格数量">{items.length} 个</DescItem>
          <DescItem label="创建时间">
            <span className="font-mono text-xs">{createdAt}</span>
          </DescItem>
          <DescItem label="最近更新">
            <span className="font-mono text-xs">{updatedAt}</span>
          </DescItem>
        </div>
      </DetailSection>

      <DetailSection
        title="规格明细与记录"
        extra="每个规格独立计库存与上架；上架 / 调整库存 / 委托等操作针对单个规格"
        flush
      >
        <div className="p-3">
          <SpecTable items={items} onAction={onAction} withRecords hideDetail />
        </div>
      </DetailSection>
    </div>
  );
}

export function GoodsList({
  onCreate,
  onEdit,
}: {
  onCreate: () => void;
  onEdit?: (code: string) => void;
}) {
  const [goods, setGoods] = useState<Goods[]>(goodsData);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<{
    action: Exclude<GoodsAction, "edit" | "detail">;
    code: string;
  } | null>(null);
  const [detailName, setDetailName] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dialogGoods = dialog
    ? goods.find((g) => g.code === dialog.code)
    : undefined;

  const now = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const updateGoods = (
    code: string,
    patch: (g: Goods) => Goods,
    message: string,
  ) => {
    setGoods((list) =>
      list.map((g) =>
        g.code === code ? { ...patch(g), updatedAt: now() } : g,
      ),
    );
    setDialog(null);
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };
  const handleAction = (g: Goods, action: GoodsAction) => {
    if (action === "detail") {
      setDetailName(g.name);
      return;
    }
    if (action === "edit") {
      onEdit?.(g.code);
      return;
    }
    if (action === "cancelEntrust") {
      if (g.entrust?.status !== "pending") return;
      updateGoods(
        g.code,
        (x) => ({ ...x, entrust: undefined }),
        `已撤回委托：${g.name}`,
      );
      return;
    }
    setDialog({ action, code: g.code });
  };

  const visible = goods.filter((g) => matches(g, applied));
  const isFiltered = Object.values(applied).some(Boolean);

  /** 各状态数量按除状态以外的其他条件统计，便于在页签间切换时看到全貌 */
  const baseFilters: Filters = { ...applied, status: "" };
  const base = goods.filter((g) => matches(g, baseFilters));
  const countOf = (s: GoodsStatus | "") =>
    s ? base.filter((g) => g.status === s).length : base.length;

  const selectStatus = (s: GoodsStatus | "") => {
    setDraft((d) => ({ ...d, status: s }));
    setApplied((a) => ({ ...a, status: s }));
  };

  const toggle = (name: string) =>
    setExpanded((e) => ({ ...e, [name]: !e[name] }));

  const groups = groupSpecs(visible);
  const detailGroup = detailName
    ? groupSpecs(goods.filter((g) => g.name === detailName))[0]
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      {detailGroup ? (
        <GoodsDetail
          group={detailGroup}
          onBack={() => setDetailName(null)}
          onAction={handleAction}
        />
      ) : (
        <>
          <FilterPanel
            draft={draft}
            onDraftChange={setDraft}
            onSearch={() => setApplied(draft)}
            onReset={() => {
              setDraft(emptyFilters);
              setApplied(emptyFilters);
            }}
            onCreate={onCreate}
          />

          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div
              className="flex items-center gap-1 border-b border-border px-2 text-xs"
              role="tablist"
              aria-label="商品状态"
            >
              {(["", ...goodsStatusOrder] as (GoodsStatus | "")[]).map((s) => {
                const active = applied.status === s;
                const label = s ? goodsStatusMeta[s].label : "全部";
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
                    {label}
                    <span
                      className={cn(
                        "tabular-nums",
                        active
                          ? "text-[#1890ff]"
                          : s
                            ? goodsStatusMeta[s].countClass
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
                {isFiltered ? `筛选结果 ${visible.length} 条 · ` : ""}
                同一商品的多个规格归为一行，点击编码前的角标展开查看规格明细与上架
                / 委托记录
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div
                  className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground"
                  style={{ gridTemplateColumns: columns }}
                >
                  <span className="text-center">展开</span>
                  <span>商品编码</span>
                  <span>商品名称</span>
                  <span>所属店铺</span>
                  <span>品类</span>
                  <span>库存</span>
                  <span>状态</span>
                  <span>委托情况</span>
                  <span>创建时间</span>
                  <span>操作</span>
                </div>

                {visible.length === 0 && (
                  <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                    没有符合筛选条件的商品
                  </p>
                )}

                {groups.map((grp) => {
                  const items = grp.items;
                  const head = items[0];
                  const open = expanded[grp.name] ?? false;
                  const listingCount = items.reduce(
                    (n, g) => n + g.listings.length,
                    0,
                  );
                  const entrusted = items.filter((g) => g.entrust).length;
                  const createdAt = items.map((g) => g.createdAt).sort()[0];
                  const single = items.length === 1;
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
                            aria-controls={`specs-${head.code}`}
                            aria-label={
                              open
                                ? `收起 ${grp.name} 规格明细`
                                : `展开 ${grp.name} 规格明细`
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
                          sub={single ? head.spec : undefined}
                        />
                        <span className="truncate text-xs" title={head.shop}>
                          {head.shop}
                        </span>
                        <span className="text-xs">
                          <span className="text-muted-foreground">
                            {head.category} /{" "}
                          </span>
                          {head.subCategory}
                        </span>
                        <span className="tabular-nums">
                          {items
                            .reduce((n, g) => n + g.stock, 0)
                            .toLocaleString()}{" "}
                          {head.unit}
                        </span>
                        <span className="flex min-w-0 flex-col items-start gap-1">
                          <StatusSummary
                            statuses={items.map((g) => g.status)}
                            order={goodsStatusOrder}
                            meta={goodsStatusMeta}
                          />
                          {single && head.statusNote && (
                            <span
                              className="line-clamp-2 text-[11px] leading-4 text-muted-foreground"
                              title={head.statusNote}
                            >
                              {head.statusNote}
                            </span>
                          )}
                        </span>
                        <span className="flex flex-col items-start gap-0.5">
                          {entrusted ? (
                            <>
                              <Tag className="bg-violet-50 text-violet-700 ring-violet-200">
                                有
                              </Tag>
                              <span className="text-[11px] leading-4 text-muted-foreground">
                                {single && head.entrust
                                  ? entrustStatusMeta[head.entrust.status].label
                                  : `${entrusted} / ${items.length} 规格`}
                              </span>
                            </>
                          ) : (
                            <Tag className="bg-muted text-muted-foreground ring-border">
                              无
                            </Tag>
                          )}
                        </span>
                        <span className="flex flex-col font-mono text-xs leading-4 text-muted-foreground">
                          <span>{createdAt.slice(0, 10)}</span>
                          <span className="text-[11px]">
                            {createdAt.slice(11)}
                          </span>
                        </span>
                        {single ? (
                          <GoodsActions
                            goods={head}
                            onAction={(a) => handleAction(head, a)}
                          />
                        ) : (
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <ActionLink
                              onClick={() => handleAction(head, "detail")}
                            >
                              详情
                            </ActionLink>
                            <ActionLink
                              onClick={() => handleAction(head, "edit")}
                            >
                              编辑
                            </ActionLink>
                            <span className="text-[11px] text-muted-foreground">
                              规格级操作请展开或进入详情
                            </span>
                          </span>
                        )}
                      </div>
                      {open && (
                        <div
                          id={`specs-${head.code}`}
                          className="border-b border-border bg-muted/20 px-4 py-3 pl-[84px]"
                        >
                          <SpecTable
                            items={items}
                            onAction={handleAction}
                            withRecords
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

      {dialog?.action === "list" && dialogGoods && (
        <ListDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(l) =>
            updateGoods(
              dialogGoods.code,
              (g) => ({ ...g, status: "active", listings: [l, ...g.listings] }),
              `已上架：${dialogGoods.name}（${bizMeta[l.type].label} ${l.quantity.toLocaleString()} ${dialogGoods.unit}）`,
            )
          }
        />
      )}
      {dialog?.action === "entrust" && dialogGoods && (
        <EntrustDialog
          key={dialogGoods.code}
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(entrust) =>
            updateGoods(
              dialogGoods.code,
              (g) => ({ ...g, entrust }),
              `已提交委托：${dialogGoods.name}（${entrust.types.map((t) => bizMeta[t].label).join("/")} ${entrust.quantity.toLocaleString()} ${dialogGoods.unit}，待 ${entrust.provider} 受理）`,
            )
          }
        />
      )}
      {dialog?.action === "stock" && dialogGoods && (
        <StockDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(stock) =>
            updateGoods(
              dialogGoods.code,
              (g) => ({ ...g, stock }),
              `库存已调整为 ${stock.toLocaleString()} ${dialogGoods.unit}`,
            )
          }
        />
      )}
      {dialog?.action === "off" && dialogGoods && (
        <OffDialog
          goods={dialogGoods}
          onClose={() => setDialog(null)}
          onConfirm={(note) =>
            updateGoods(
              dialogGoods.code,
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
