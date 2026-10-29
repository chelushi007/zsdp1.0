"use client";

import { Fragment, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addEntrusts,
  entrustStatusLabel,
  nextEntrustId,
  removeEntrust,
  useEntrusts,
  type EntrustLine,
  type EntrustRecord,
  type EntrustStatus,
} from "@/lib/entrust-store";
import { Select, categoryTree } from "@/components/shop-form-fields";

export type BizType = "sale" | "rent";
type ListingStatus = "on" | "off";

/** 上架记录：一次上架生成一张上架单，按规格拆成多条记录，共用上架单号与运营规则 */
type Listing = {
  id: string;
  /** 上架单号 */
  batch: string;
  createdAt?: string;
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
  /** 履约方式 */
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

/** 商品状态：草稿 / 审核中 / 运营中 / 已下架 / 违规下架 / 审核驳回 */
type GoodsStatus =
  | "draft"
  | "reviewing"
  | "active"
  | "off"
  | "violation"
  | "rejected";

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
  /** 以下为商品级信息（与发布表单一致），同名商品的各规格共用 */
  location?: string;
  images?: string[];
  banAreas?: string[];
  freight?: string;
  description?: string;
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
    location: "上海市 松江区 车墩镇 北松公路 1688 号堆场",
    images: ["/images/goods-bamboo-plywood.png"],
    banAreas: ["西藏自治区", "新疆维吾尔自治区", "海南省 三沙市"],
    freight: "按件计费：首 200 张 ¥ 600，每续 100 张加收 ¥ 200；订单满 ¥ 50,000 包邮",
    description:
      "优质楠竹为基材，双面覆酚醛膜，表面光洁、脱模容易，可重复使用 8–12 次。适用于高层住宅、桥梁墩柱等现浇混凝土模板工程。板材含水率 ≤ 12%，静曲强度 ≥ 50 MPa，出厂附检测报告。",
    listings: [
      {
        id: "L240302001",

        batch: "S240302001",
        createdAt: "2024-03-02",
        taxRate: "13%",
        payTerm: "先款后货",
        type: "sale",
        status: "on",
        price: 128,
        minOrder: 50,
        quantity: 3200,
        used: 1250,
      },
      {
        id: "L240302002",

        batch: "S240302002",
        createdAt: "2024-03-02",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240315001",
        createdAt: "2024-03-15",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240110003",
        createdAt: "2024-01-10",
        taxRate: "13%",
        payTerm: "先款后货",
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
    location: "江苏省 苏州市 吴江区 汾湖高新区 周转材料基地",
    images: ["/images/goods-steel-strut.png"],
    banAreas: [],
    freight: "按距离计费：50km 内起步 ¥ 1,200 / 车，超出部分 ¥ 12 / km；可自提",
    description:
      "Φ609×16 钢支撑采用 Q235B 无缝钢管，配套法兰、活络头与预应力千斤顶，可按 9m / 12m 标准节与 6m 调节节自由组合，适用于地铁车站、深基坑内支撑体系。出租含进出场质检，归还按损耗标准结算。",
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

        batch: "S240408001",
        createdAt: "2024-04-08",
        taxRate: "13%",
        payTerm: "先款后货",
        type: "sale",
        status: "off",
        price: 5800,
        minOrder: 10,
        quantity: 120,
        used: 120,
      },
      {
        id: "L240408002",

        batch: "S240408002",
        createdAt: "2024-04-08",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240408002",
        createdAt: "2024-04-08",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240408001",
        createdAt: "2024-04-08",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240520001",
        createdAt: "2024-05-20",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240611001",
        createdAt: "2024-06-11",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240703001",
        createdAt: "2024-07-03",
        taxRate: "13%",
        payTerm: "先款后货",
        type: "sale",
        status: "on",
        price: 4280,
        minOrder: 5,
        quantity: 95,
        used: 30,
      },
      {
        id: "L240703002",

        batch: "S240703002",
        createdAt: "2024-07-03",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S241022001",
        createdAt: "2024-10-22",
        taxRate: "13%",
        payTerm: "先款后货",
        type: "sale",
        status: "on",
        price: 186,
        minOrder: 100,
        quantity: 1200,
        used: 160,
      },
    ],
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

        batch: "S240816001",
        createdAt: "2024-08-16",
        taxRate: "13%",
        payTerm: "先款后货",
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

        batch: "S240905001",
        createdAt: "2024-09-05",
        taxRate: "13%",
        payTerm: "先款后货",
        type: "sale",
        status: "off",
        price: 16800,
        minOrder: 1,
        quantity: 24,
        used: 6,
      },
      {
        id: "L240905002",

        batch: "S240905002",
        createdAt: "2024-09-05",
        taxRate: "13%",
        payTerm: "先款后货",
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
  "reviewing",
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
  reviewing: {
    label: "审核中",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    countClass: "text-sky-700",
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

/** 分组���的编码列：单规格直接显示编码，多规格显示首个编码并标注数量 */
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
  | "detail"
  | "edit"
  | "list"
  | "off"
  | "entrust"
  | "submit"
  | "withdraw";

function canList(items: Goods[]) {
  return items.some((g) => g.status === "active" || g.status === "off");
}

/** 操作列中的「违规原因」：鼠标移入 / 键盘聚焦时浮层显示原因全文 */
function ReasonHover({ label, reason }: { label: string; reason: string }) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={id}
        className="cursor-help text-xs text-red-600 underline decoration-dotted underline-offset-2"
      >
        {label}
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full right-0 z-30 mb-1.5 w-60 rounded border border-border bg-popover p-2.5 text-left text-xs leading-5 text-foreground opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="mb-1 block font-medium text-red-600">{label}</span>
        {reason}
      </span>
    </span>
  );
}

/** 商品级操作：上架 / 委托以整个商品（含全部规格）为单位；编辑在详情页进行；下架按规格 */
function GoodsActions({
  items,
  onAction,
}: {
  items: Goods[];
  onAction: (a: GoodsAction) => void;
}) {
  const head = items[0];
  const single = items.length === 1;
  const detailLink = <ActionLink onClick={() => onAction("detail")}>详情</ActionLink>;
  if (head.status === "draft")
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {detailLink}
        <ActionLink onClick={() => onAction("edit")}>继续编辑</ActionLink>
        <ActionLink onClick={() => onAction("submit")}>提交审核</ActionLink>
        <ActionLink tone="danger">删除</ActionLink>
      </span>
    );
  if (head.status === "reviewing")
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {detailLink}
        <ActionLink onClick={() => onAction("withdraw")}>撤回审核</ActionLink>
      </span>
    );
  if (head.status === "violation")
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {detailLink}
        {head.statusNote && (
          <ReasonHover label="违规原因" reason={head.statusNote} />
        )}
        <ActionLink onClick={() => onAction("submit")}>重新提交</ActionLink>
      </span>
    );
  if (head.status === "rejected")
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {detailLink}
        {head.statusNote && (
          <ReasonHover label="驳回原因" reason={head.statusNote} />
        )}
        <ActionLink onClick={() => onAction("submit")}>重新提交</ActionLink>
      </span>
    );
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {detailLink}
      {canList(items) && (
        <ActionLink onClick={() => onAction("list")}>
          {head.status === "off" && single ? "重新上架" : "上架"}
        </ActionLink>
      )}
      {canEntrust(items) && (
        <ActionLink onClick={() => onAction("entrust")}>委托</ActionLink>
      )}
      {single && head.status === "active" && (
        <ActionLink tone="danger" onClick={() => onAction("off")}>
          下架
        </ActionLink>
      )}
    </span>
  );
}

/* ---------- 操作弹窗 ---------- */

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** 上架中记录占用的库存，调整库存时不可低于该值 */
function lockedStock(g: Goods) {
  return g.listings
    .filter((l) => l.status === "on")
    .reduce((s, l) => s + l.quantity, 0);
}

/** 某规格在有效委托单（待受理 / 已受理）中已委托的数量 */
function entrustedQty(code: string, records: EntrustRecord[]) {
  return records
    .filter((r) => r.status !== "returned")
    .flatMap((r) => r.lines)
    .filter((l) => l.code === code)
    .reduce((s, l) => s + l.quantity, 0);
}

/** 某商品（按名称，含全部规格）的委托单 */
function entrustsOf(name: string, records: EntrustRecord[]) {
  return records.filter((r) => r.goodsName === name);
}

function canEntrust(items: Goods[]) {
  return items.some((g) => g.status === "active" || g.status === "off");
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
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-5">
          {children}
        </div>
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
  invalid,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  type?: "text" | "number";
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center rounded border bg-background text-sm focus-within:border-[#1890ff]",
        invalid ? "border-red-400" : "border-border",
        disabled && "bg-muted/40 text-muted-foreground",
      )}
    >
      {prefix && <span className="pl-3 text-muted-foreground">{prefix}</span>}
      <input
        aria-label={label}
        aria-invalid={invalid || undefined}
        disabled={disabled}
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

export const PRIMARY_BTN = "bg-[#1890ff] hover:bg-[#1890ff]/90";

export const PROVIDERS = [
  "华建周转材料服务有限公司",
  "中建租赁服务（上海）有限公司",
  "筑友设备运营服务商",
  "鼎盛建材流通服务中心",
  "华东绿色建材供应链服务有限公司",
  "苏州市路桥周转设备租赁有限公司",
  "浙江广厦机械设备运营服务中心",
  "北方建工物资流通服务有限公司",
  "南方模架科技服务商",
  "中铁建材循环利用服务（武汉）有限公司",
];

/** 模糊匹配：查询词连续出现，或各字符按顺序出现在名称中（如「华服」可命中「华建周转材料服务有限公司」） */
function fuzzyMatch(text: string, query: string) {
  const t = text.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (t.includes(q)) return true;
  let i = 0;
  for (const ch of t) if (ch === q[i]) i += 1;
  return i >= q.length;
}

/** 服务商选择：文本框 + 下拉融合组件，输入模糊匹配，可勾选一家或多家，已选以标签形式留在输入框内 */
function ProviderCombobox({
  value,
  onChange,
  options = PROVIDERS,
  placeholder = "输入服务商名称关键字搜索，或下拉选择",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options?: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const filtered = options.filter((p) => fuzzyMatch(p, query));
  const activeIndex = Math.min(cursor, Math.max(filtered.length - 1, 0));

  const toggle = (p: string) => {
    onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
    setQuery("");
    inputRef.current?.focus();
  };
  const remove = (p: string) => onChange(value.filter((x) => x !== p));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[activeIndex]) toggle(filtered[activeIndex]);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div
        className={cn(
          "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1 rounded border bg-background px-2 py-1 text-sm",
          open ? "border-[#1890ff]" : "border-border",
        )}
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {value.map((p) => (
          <span
            key={p}
            className="flex max-w-full items-center gap-1 rounded bg-[#1890ff]/10 px-1.5 py-0.5 text-xs text-[#1890ff]"
          >
            <span className="truncate" title={p}>
              {p}
            </span>
            <button
              type="button"
              aria-label={`移除 ${p}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(p);
              }}
              className="rounded hover:bg-[#1890ff]/20"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          role="combobox"
          aria-label="服务商"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined
          }
          value={query}
          placeholder={value.length === 0 ? placeholder : "继续搜索添加"}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-6 min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "收起服务商列表" : "展开服务商列表"}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="ml-auto text-muted-foreground"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable
          aria-label="服务商列表"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded border border-border bg-popover py-1 text-sm shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              未找到与「{query}」匹配的服务商
            </li>
          ) : (
            filtered.map((p, i) => {
              const selected = value.includes(p);
              return (
                <li
                  key={p}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => toggle(p)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-1.5",
                    i === activeIndex && "bg-muted",
                    selected && "text-[#1890ff]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      selected
                        ? "border-[#1890ff] bg-[#1890ff] text-white"
                        : "border-border",
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="size-3" />}
                  </span>
                  <span className="truncate">{p}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

type EntrustDraftLine = {
  on: boolean;
  quantity: string;
  salePrice: string;
  rentPrice: string;
  rentDeposit: string;
};

/** 规格默认委托价：取该租售方式最近一条上架记录的发布价 */
function defaultPrice(g: Goods, type: BizType) {
  const l =
    g.listings.find((x) => x.type === type && x.status === "on") ??
    g.listings.find((x) => x.type === type);
  return l;
}

/** 委托：以整个商品（含全部规格）为单位委托给一家或多家服务商，服务商受理后可加价上架 */
function EntrustDialog({
  items,
  records,
  onClose,
  onConfirm,
}: {
  items: Goods[];
  records: EntrustRecord[];
  onClose: () => void;
  onConfirm: (records: EntrustRecord[]) => void;
}) {
  const head = items[0];
  const availableOf = (g: Goods) =>
    Math.max(g.stock - lockedStock(g) - entrustedQty(g.code, records), 0);
  const [types, setTypes] = useState<BizType[]>(["sale"]);
  const [providers, setProviders] = useState<string[]>([]);
  const [lines, setLines] = useState<Record<string, EntrustDraftLine>>(() =>
    Object.fromEntries(
      items.map((g) => {
        const sale = defaultPrice(g, "sale");
        const rent = defaultPrice(g, "rent");
        return [
          g.code,
          {
            on: availableOf(g) > 0,
            quantity: String(availableOf(g)),
            salePrice: sale ? String(sale.price) : "",
            rentPrice: rent
              ? String(round2(rent.period === "月" ? rent.price / 30 : rent.price))
              : "",
            rentDeposit: rent?.deposit !== undefined ? String(rent.deposit) : "",
          },
        ];
      }),
    ),
  );

  const toggleType = (t: BizType) =>
    setTypes((list) =>
      list.includes(t) ? list.filter((x) => x !== t) : [...list, t],
    );
  const setLine = (code: string, patch: Partial<EntrustDraftLine>) =>
    setLines((m) => ({ ...m, [code]: { ...m[code], ...patch } }));

  const k = Math.max(providers.length, 1);
  const allOn = items.every((g) => lines[g.code].on);
  const toggleAll = () =>
    setLines((m) =>
      Object.fromEntries(
        Object.entries(m).map(([c, d]) => [c, { ...d, on: !allOn }]),
      ),
    );
  const lineState = items.map((g) => {
    const d = lines[g.code];
    const qty = Number(d.quantity);
    const available = availableOf(g);
    const qtyOk =
      !d.on ||
      (d.quantity !== "" && Number.isInteger(qty) && qty > 0 && qty * k <= available);
    const included = d.on;
    const saleOk = !included || !types.includes("sale") || Number(d.salePrice) > 0;
    const rentOk =
      !included ||
      !types.includes("rent") ||
      (Number(d.rentPrice) > 0 && d.rentDeposit !== "" && Number(d.rentDeposit) >= 0);
    return { g, d, qty, available, qtyOk, included, saleOk, rentOk };
  });
  const anyIncluded = lineState.some((x) => x.included);
  const ok =
    types.length > 0 &&
    providers.length > 0 &&
    anyIncluded &&
    lineState.every((x) => x.qtyOk && x.saleOk && x.rentOk);
  const totalQty = lineState.reduce((s, x) => s + (x.included ? x.qty : 0), 0);

  const submit = () => {
    if (!ok) return;
    const createdAt = new Date().toISOString().slice(0, 10);
    const orderedTypes = (["sale", "rent"] as BizType[]).filter((t) =>
      types.includes(t),
    );
    const recordLines: EntrustLine[] = lineState
      .filter((x) => x.included)
      .map(({ g, d, qty }) => ({
        code: g.code,
        spec: g.spec,
        quantity: qty,
        salePrice: types.includes("sale") ? Number(d.salePrice) : undefined,
        rentPrice: types.includes("rent") ? Number(d.rentPrice) : undefined,
        rentDeposit: types.includes("rent") ? Number(d.rentDeposit) : undefined,
      }));
    onConfirm(
      PROVIDERS.filter((p) => providers.includes(p)).map((provider) => ({
        id: nextEntrustId(),
        goodsName: head.name,
        shop: head.shop,
        category: head.category,
        subCategory: head.subCategory,
        unit: head.unit,
        provider,
        types: orderedTypes,
        lines: recordLines,
        status: "pending",
        createdAt,
      })),
    );
  };

  const cols = `24px minmax(130px,1fr) 80px 120px${types.includes("sale") ? " 120px" : ""}${types.includes("rent") ? " 130px 110px" : ""}`;

  return (
    <Modal
      title="委托服务商运营"
      titleId="entrust-dialog-title"
      width="max-w-[860px]"
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-muted-foreground">
            {providers.length > 0 && anyIncluded
              ? `将生成 ${providers.length} 张委托单，每张委托 ${lineState.filter((x) => x.included).length} 个规格共 ${totalQty.toLocaleString()} ${head.unit}`
              : "委托以整个商品为单位，可全部或部分规格委托"}
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
            提交委托
          </Button>
        </>
      }
    >
      <div className="grid gap-3 rounded bg-muted/40 px-3 py-2 text-xs sm:grid-cols-4">
        <span className="flex min-w-0 flex-col gap-0.5 sm:col-span-2">
          <span className="text-muted-foreground">商品</span>
          <span className="truncate font-medium" title={head.name}>
            {head.name}
          </span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">规格</span>
          <span>{items.length} 个</span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">计量单位</span>
          <span>{head.unit}</span>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DialogField
          label="委托方式"
          required
          hint="可同时勾选；服务商受理后按委托价加价上架，差价为服务商收益"
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
        <DialogField
          label="服务商"
          required
          hint={
            providers.length > 1
              ? `已选 ${providers.length} 家，每家各生成一张委托单，委托数量按家数占用库存`
              : "可选择一家或多家服务商"
          }
        >
          <ProviderCombobox value={providers} onChange={setProviders} />
        </DialogField>
      </div>

      <DialogField
        label="委托明细"
        required
        hint={`勾选需要委托的规格，可全部委托或部分委托；委托价默认取该规格的发布价，可按规格修改。已选 ${lineState.filter((x) => x.included).length} / ${items.length} 个规格`}
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
            <span>可委托</span>
            <span>委托数量</span>
            {types.includes("sale") && <span>出售委托价</span>}
            {types.includes("rent") && (
              <>
                <span>出租委托价</span>
                <span>押金</span>
              </>
            )}
          </div>
          {lineState.map(({ g, d, available, qtyOk, included, saleOk, rentOk }) => (
            <div
              key={g.code}
              className={cn(
                "grid items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0",
                !included && "text-muted-foreground",
              )}
              style={{ gridTemplateColumns: cols }}
            >
              <input
                type="checkbox"
                aria-label={`委托 ${g.spec}`}
                checked={d.on}
                onChange={(e) => setLine(g.code, { on: e.target.checked })}
                className="accent-[#1890ff]"
              />
              <span className="flex min-w-0 flex-col leading-4">
                <span className="truncate font-medium" title={g.spec}>
                  {g.spec}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {g.code}
                </span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {available.toLocaleString()} {g.unit}
              </span>
              <DialogInput
                label={`${g.spec} 委托数量`}
                type="number"
                value={d.quantity}
                onChange={(v) => setLine(g.code, { quantity: v })}
                placeholder="0"
                suffix={g.unit}
                invalid={!qtyOk}
                disabled={!d.on}
              />
              {types.includes("sale") && (
                <DialogInput
                  label={`${g.spec} 出售委托价`}
                  disabled={!d.on}
                  type="number"
                  value={d.salePrice}
                  onChange={(v) => setLine(g.code, { salePrice: v })}
                  placeholder="0.00"
                  prefix="¥"
                  suffix={`/ ${g.unit}`}
                  invalid={included && !saleOk}
                />
              )}
              {types.includes("rent") && (
                <>
                  <DialogInput
                    label={`${g.spec} 出租委托价`}
                    disabled={!d.on}
                    type="number"
                    value={d.rentPrice}
                    onChange={(v) => setLine(g.code, { rentPrice: v })}
                    placeholder="0.00"
                    prefix="¥"
                    suffix={`/ ${g.unit} / 天`}
                    invalid={included && !rentOk && Number(d.rentPrice) <= 0}
                  />
                  <DialogInput
                    label={`${g.spec} 押金`}
                    disabled={!d.on}
                    type="number"
                    value={d.rentDeposit}
                    onChange={(v) => setLine(g.code, { rentDeposit: v })}
                    placeholder="0.00"
                    prefix="¥"
                    invalid={included && d.rentDeposit === ""}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </DialogField>
    </Modal>
  );
}

const TAX_RATES = ["不含税", "1%", "3%", "6%", "9%", "13%"];
const PAY_TERMS = ["先款后货", "货到付款"] as const;
type PayTerm = (typeof PAY_TERMS)[number];

type ListDraftLine = {
  on: boolean;
  price: string;
  quantity: string;
  minOrder: string;
  deposit: string;
};

function initListLines(items: Goods[], type: BizType) {
  return Object.fromEntries(
    items.map((g) => {
      const available = g.stock - lockedStock(g);
      const last = defaultPrice(g, type);
      return [
        g.code,
        {
          on: available > 0,
          price: last ? String(last.price) : "",
          quantity: available > 0 ? String(available) : "",
          minOrder: last?.minOrder !== undefined ? String(last.minOrder) : "",
          deposit: last?.deposit !== undefined ? String(last.deposit) : "",
        } satisfies ListDraftLine,
      ];
    }),
  ) as Record<string, ListDraftLine>;
}

function nextBatchId(items: Goods[]) {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const batches = new Set(items.flatMap((g) => g.listings.map((l) => l.batch)));
  return `S${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}${String(batches.size + 1).padStart(3, "0")}`;
}

/** 上架：以整个商品为单位生成一张上架单，引用商品明细按规格分别定价、定量；运营规则（税率、结算、议价、租期等）为上架单共用 */
function ListDialog({
  items,
  onClose,
  onConfirm,
}: {
  items: Goods[];
  onClose: () => void;
  onConfirm: (created: { code: string; listing: Listing }[]) => void;
}) {
  const head = items[0];
  const relist = items.every((g) => g.status === "off");
  const [type, setTypeState] = useState<BizType>("sale");
  const [lines, setLines] = useState<Record<string, ListDraftLine>>(() =>
    initListLines(items, "sale"),
  );
  const setType = (t: BizType) => {
    setTypeState(t);
    setLines(initListLines(items, t));
  };
  const setLine = (code: string, patch: Partial<ListDraftLine>) =>
    setLines((m) => ({ ...m, [code]: { ...m[code], ...patch } }));
  const [period, setPeriod] = useState<"天" | "月">("天");
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");
  const [taxRate, setTaxRate] = useState("13%");
  const [payTerm, setPayTerm] = useState<PayTerm>("先款后货");
  const [negotiable, setNegotiable] = useState(false);
  const [lossRule, setLossRule] = useState("");

  const allOn = items.every((g) => lines[g.code].on);
  const toggleAll = () =>
    setLines((m) =>
      Object.fromEntries(
        Object.entries(m).map(([c, d]) => [c, { ...d, on: !allOn }]),
      ),
    );

  const lineState = items.map((g) => {
    const d = lines[g.code];
    const available = g.stock - lockedStock(g);
    const qty = Number(d.quantity);
    const qtyOk =
      !d.on ||
      (d.quantity !== "" && Number.isInteger(qty) && qty > 0 && qty <= available);
    const priceOk = !d.on || Number(d.price) > 0;
    const depositOk =
      !d.on || type === "sale" || (d.deposit !== "" && Number(d.deposit) >= 0);
    return { g, d, available, qty, qtyOk, priceOk, depositOk };
  });
  const included = lineState.filter((x) => x.d.on);
  const rentOk =
    type === "sale" ||
    (Number(minDays) > 0 && (maxDays === "" || Number(maxDays) >= Number(minDays)));
  const ok =
    included.length > 0 &&
    lineState.every((x) => x.qtyOk && x.priceOk && x.depositOk) &&
    Boolean(taxRate) &&
    rentOk;
  const totalQty = included.reduce((s, x) => s + x.qty, 0);

  const submit = () => {
    if (!ok) return;
    const batch = nextBatchId(items);
    const createdAt = new Date().toISOString().slice(0, 10);
    onConfirm(
      included.map(({ g, d, qty }, i) => {
        const common = {
          id: `L${batch.slice(1)}${String(i + 1).padStart(2, "0")}`,
          batch,
          createdAt,
          status: "on" as const,
          price: Number(d.price),
          quantity: qty,
          used: 0,
          taxRate,
          payTerm,
          negotiable,
        };
        const listing: Listing =
          type === "sale"
            ? { ...common, type, minOrder: d.minOrder ? Number(d.minOrder) : undefined }
            : {
                ...common,
                type,
                period,
                deposit: Number(d.deposit),
                minDays: Number(minDays),
                maxDays: maxDays ? Number(maxDays) : undefined,
                lossRule: lossRule.trim() || undefined,
              };
        return { code: g.code, listing };
      }),
    );
  };

  const cols = `24px minmax(130px,1fr) 80px 130px 120px 120px`;

  return (
    <Modal
      title={relist ? "重新上架" : "新增上架"}
      titleId="list-dialog-title"
      width="max-w-[860px]"
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-muted-foreground">
            {included.length > 0
              ? `将生成 1 张上架单：${bizMeta[type].label} ${included.length} 个规格，共 ${totalQty.toLocaleString()} ${head.unit}`
              : "上架以整个商品为单位，按规格分别定价、定量"}
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
            确认上架
          </Button>
        </>
      }
    >
      <div className="grid gap-3 rounded bg-muted/40 px-3 py-2 text-xs sm:grid-cols-4">
        <span className="flex min-w-0 flex-col gap-0.5 sm:col-span-2">
          <span className="text-muted-foreground">商品</span>
          <span className="truncate font-medium" title={head.name}>
            {head.name}
          </span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">规格</span>
          <span>{items.length} 个</span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">计量单位</span>
          <span>{head.unit}</span>
        </span>
      </div>

      <DialogField
        label="租赁方式"
        required
        hint="每张上架单对应一种租售方式；同一商品可多次上架"
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

      <DialogField
        label="上架明细"
        required
        hint={`引用商品明细，勾选需要上架的规格并分别填写价格与数量；价格默认取该规格最近一次${bizMeta[type].label}的发布价。已选 ${included.length} / ${items.length} 个规格`}
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
            <span>可上架</span>
            <span>{type === "sale" ? "销售单价" : "租金单价"}</span>
            <span>上架数量</span>
            <span>{type === "sale" ? "起订量" : "押金"}</span>
          </div>
          {lineState.map(({ g, d, available, qtyOk, priceOk, depositOk }) => (
            <div
              key={g.code}
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
                onChange={(e) => setLine(g.code, { on: e.target.checked })}
                className="accent-[#1890ff]"
              />
              <span className="flex min-w-0 flex-col leading-4">
                <span className="truncate font-medium" title={g.spec}>
                  {g.spec}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {g.code}
                </span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {available.toLocaleString()} {g.unit}
              </span>
              <DialogInput
                label={`${g.spec} 单价`}
                type="number"
                value={d.price}
                onChange={(v) => setLine(g.code, { price: v })}
                placeholder="0.00"
                prefix="¥"
                suffix={type === "sale" ? `/ ${g.unit}` : `/ ${g.unit} / ${period}`}
                invalid={!priceOk}
                disabled={!d.on}
              />
              <DialogInput
                label={`${g.spec} 上架数量`}
                type="number"
                value={d.quantity}
                onChange={(v) => setLine(g.code, { quantity: v })}
                placeholder="0"
                suffix={g.unit}
                invalid={!qtyOk}
                disabled={!d.on}
              />
              {type === "sale" ? (
                <DialogInput
                  label={`${g.spec} 起订量`}
                  type="number"
                  value={d.minOrder}
                  onChange={(v) => setLine(g.code, { minOrder: v })}
                  placeholder="不限"
                  suffix={g.unit}
                  disabled={!d.on}
                />
              ) : (
                <DialogInput
                  label={`${g.spec} 押金`}
                  type="number"
                  value={d.deposit}
                  onChange={(v) => setLine(g.code, { deposit: v })}
                  placeholder="0.00"
                  prefix="¥"
                  invalid={!depositOk}
                  disabled={!d.on}
                />
              )}
            </div>
          ))}
        </div>
      </DialogField>

      <ListGroup title={type === "sale" ? "出售规则（上架单共用）" : "出租规则（上架单共用）"}>
        <div className="grid gap-4 sm:grid-cols-2">
          {type === "rent" && (
            <>
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
              <DialogField label="最短租期" required>
                <DialogInput
                  label="最短租期"
                  type="number"
                  value={minDays}
                  onChange={setMinDays}
                  placeholder="0"
                  suffix={period}
                  invalid={minDays !== "" && Number(minDays) <= 0}
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
          <DialogField label="履约方式" required>
            <div
              role="radiogroup"
              aria-label="履约方式"
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

const CATEGORY_OPTIONS: Record<string, string[]> = {
  循环物资: ["模板类", "脚手架类", "钢支撑类", "围挡类", "安全防护类"],
  工程设备: ["起重设备", "混凝土设备", "土方设备", "桩工设备"],
  周转材料: ["钢管扣件", "型钢", "集装箱房", "其他"],
};
const UNIT_OPTIONS = ["张", "根", "套", "块", "米", "吨", "台", "个", "箱"];

export type GoodsEditPatch = {
  name: string;
  category: string;
  subCategory: string;
  unit: string;
  location: string;
  lines: { code: string; spec: string; stock: number }[];
};

const SELECT_CLS =
  "h-9 w-full rounded border border-border bg-background px-3 text-sm focus:border-[#1890ff] focus:outline-none";

const editLineColumns = "118px minmax(160px,1fr) 110px 140px";

/** 编辑商品：基于商品详情以整个商品为单位编辑，名称 / 品类 / 单位 / 所在地共用，商品明细按规格修改规格型号与库存；编码、店铺与上架记录不可改 */
function EditDialog({
  items,
  onClose,
  onConfirm,
}: {
  items: Goods[];
  onClose: () => void;
  onConfirm: (patch: GoodsEditPatch) => void;
}) {
  const head = items[0];
  const [name, setName] = useState(head.name);
  const [category, setCategory] = useState(head.category);
  const [subCategory, setSubCategory] = useState(head.subCategory);
  const [unit, setUnit] = useState(head.unit);
  const [location, setLocation] = useState(head.location ?? "");
  const [lines, setLines] = useState<Record<string, { spec: string; stock: string }>>(
    () =>
      Object.fromEntries(
        items.map((g) => [g.code, { spec: g.spec, stock: String(g.stock) }]),
      ),
  );
  const setLine = (code: string, patch: Partial<{ spec: string; stock: string }>) =>
    setLines((m) => ({ ...m, [code]: { ...m[code], ...patch } }));

  const subOptions = CATEGORY_OPTIONS[category] ?? [head.subCategory];
  const unitLocked = items.some((g) => g.listings.length > 0);
  const lineState = items.map((g) => {
    const d = lines[g.code];
    const locked = lockedStock(g);
    const stockNum = Number(d.stock);
    const stockOk = d.stock !== "" && Number.isInteger(stockNum) && stockNum >= 0;
    const belowLocked = stockOk && stockNum < locked;
    const specOk = d.spec.trim() !== "";
    const changed = d.spec.trim() !== g.spec || stockNum !== g.stock;
    return { g, d, locked, stockNum, stockOk, belowLocked, specOk, changed };
  });
  const changed =
    name.trim() !== head.name ||
    category !== head.category ||
    subCategory !== head.subCategory ||
    unit !== head.unit ||
    location.trim() !== (head.location ?? "") ||
    lineState.some((x) => x.changed);
  const ok =
    name.trim() !== "" &&
    subCategory !== "" &&
    lineState.every((x) => x.stockOk && !x.belowLocked && x.specOk) &&
    changed;
  const statusMeta = goodsStatusMeta[head.status];

  return (
    <Modal
      title="编辑商品"
      titleId="edit-dialog-title"
      width="max-w-[860px]"
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
              onConfirm({
                name: name.trim(),
                category,
                subCategory,
                unit,
                location: location.trim(),
                lines: lineState.map(({ g, d, stockNum }) => ({
                  code: g.code,
                  spec: d.spec.trim(),
                  stock: stockNum,
                })),
              })
            }
          >
            保存修改
          </Button>
        </>
      }
    >
      <div className="grid gap-3 rounded bg-muted/40 px-3 py-2 text-xs sm:grid-cols-4">
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">商品编码</span>
          <span className="font-mono">
            {items.length === 1 ? head.code : `${head.code} 等 ${items.length} 个`}
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 sm:col-span-2">
          <span className="text-muted-foreground">所属店铺</span>
          <span className="truncate" title={head.shop}>
            {head.shop}
          </span>
        </span>
        <span className="flex flex-col items-start gap-0.5">
          <span className="text-muted-foreground">当前状态</span>
          <Tag className={statusMeta.className}>{statusMeta.label}</Tag>
        </span>
      </div>

      <ListGroup title="基本信息">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <DialogField label="商品名称" required>
              <DialogInput label="商品名称" value={name} onChange={setName} />
            </DialogField>
          </div>
          <DialogField label="一级品类" required>
            <select
              aria-label="一级品类"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubCategory(CATEGORY_OPTIONS[e.target.value]?.[0] ?? "");
              }}
              className={SELECT_CLS}
            >
              {Object.keys(CATEGORY_OPTIONS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </DialogField>
          <DialogField label="二级品类" required>
            <select
              aria-label="二级品类"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className={SELECT_CLS}
            >
              {subOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </DialogField>
          <DialogField
            label="计量单位"
            required
            hint={
              unitLocked
                ? "已有上架记录按该单位计价，单位不可修改"
                : "上架后单位将随价格固定"
            }
          >
            <select
              aria-label="计量单位"
              value={unit}
              disabled={unitLocked}
              onChange={(e) => setUnit(e.target.value)}
              className={cn(
                SELECT_CLS,
                unitLocked && "cursor-not-allowed bg-muted/40 text-muted-foreground",
              )}
            >
              {Array.from(new Set([head.unit, ...UNIT_OPTIONS])).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </DialogField>
          <DialogField label="商品所在地" hint="省 / 市 / 区县 + 具体地址">
            <DialogInput
              label="商品所在地"
              value={location}
              onChange={setLocation}
              placeholder="如：上海市 松江区 车墩镇 北松公路 1688 号堆场"
            />
          </DialogField>
        </div>
      </ListGroup>

      <ListGroup title={`商品明细（${items.length} 个规格）`}>
        <div className="overflow-x-auto rounded border border-border">
          <div
            className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: editLineColumns }}
          >
            <span>商品编码</span>
            <span>规格型号</span>
            <span>上架占用</span>
            <span>总库存</span>
          </div>
          {lineState.map(({ g, d, locked, stockOk, belowLocked, specOk }) => (
            <div
              key={g.code}
              className="grid items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
              style={{ gridTemplateColumns: editLineColumns }}
            >
              <span className="font-mono text-xs text-muted-foreground">
                {g.code}
              </span>
              <DialogInput
                label={`${g.code} 规格型号`}
                value={d.spec}
                onChange={(v) => setLine(g.code, { spec: v })}
                invalid={!specOk}
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                {locked.toLocaleString()} {g.unit}
              </span>
              <DialogInput
                label={`${g.code} 总库存`}
                type="number"
                value={d.stock}
                onChange={(v) => setLine(g.code, { stock: v })}
                placeholder="0"
                suffix={g.unit}
                invalid={!stockOk || belowLocked}
              />
            </div>
          ))}
        </div>
        {lineState.some((x) => x.belowLocked) && (
          <span className="text-xs text-red-600">
            总库存不可低于上架中记录已占用的数量
          </span>
        )}
      </ListGroup>

      {head.statusNote && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {statusMeta.label}说明：{head.statusNote}
        </div>
      )}
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

/** 提交审核：草稿首次提交，或违规下架 / 审核驳回整改后重新提交；提交后进入「审核中」 */
function SubmitReviewDialog({
  items,
  onClose,
  onConfirm,
}: {
  items: Goods[];
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const head = items[0];
  const resubmit = head.status !== "draft";
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const totalStock = items.reduce((s, g) => s + g.stock, 0);
  const checks = [
    { label: "商品基础信息（名称、分类、单位）", ok: Boolean(head.name && head.category && head.unit) },
    { label: "规格明细与库存", ok: items.every((g) => g.spec && g.stock > 0) },
    { label: "商品图片与描述", ok: true },
  ];
  const ready = checks.every((c) => c.ok) && (!resubmit || confirmed);

  return (
    <Modal
      title={resubmit ? "重新提交审核" : "提交审核"}
      titleId="submit-review-title"
      width="max-w-[520px]"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            className="bg-[#1890ff] text-white hover:bg-[#1890ff]/90"
            disabled={!ready}
            onClick={() => onConfirm(note)}
          >
            确认提交
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        提交后商品进入「审核中」，平台一般在 1 个工作日内完成审核；审核期间不可编辑、上架或委托，可随时撤回。审核通过后商品转为「运营中」。
      </p>

      <ListGroup title="提交内容">
        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          <DescItem label="商品名称">{head.name}</DescItem>
          <DescItem label="分类">
            {head.category} / {head.subCategory}
          </DescItem>
          <DescItem label="规格数">{items.length} 个</DescItem>
          <DescItem label="总库存">
            {totalStock.toLocaleString()} {head.unit}
          </DescItem>
          <DescItem label="所属店铺">{head.shop}</DescItem>
          <DescItem label="当前状态">{goodsStatusMeta[head.status].label}</DescItem>
        </div>
      </ListGroup>

      <ListGroup title="提交前检查">
        <ul className="flex flex-col gap-1.5 text-xs">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              {c.ok ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
              ) : (
                <AlertTriangle className="size-3.5 text-red-600" aria-hidden />
              )}
              <span className={c.ok ? "" : "text-red-600"}>
                {c.label}
                {!c.ok && "（未完善，请先继续编辑）"}
              </span>
            </li>
          ))}
        </ul>
      </ListGroup>

      {resubmit && head.statusNote && (
        <div className="flex flex-col gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>
            {goodsStatusMeta[head.status].label}原因：{head.statusNote}
          </span>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="size-3.5 accent-[#1890ff]"
            />
            已按上述原因完成整改
          </label>
        </div>
      )}

      <DialogField label="给审核员的说明">
        <DialogInput
          label="给审核员的说明"
          value={note}
          onChange={setNote}
          placeholder={resubmit ? "说明整改内容，便于加快审核（选填）" : "选填"}
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
          ��询
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

function matches(g: Goods, f: Filters, records: EntrustRecord[]) {
  const entrusts = entrustsOf(g.name, records);
  if (f.code && !g.code.toLowerCase().includes(f.code.trim().toLowerCase()))
    return false;
  if (f.name && !g.name.includes(f.name.trim())) return false;
  if (f.category && g.subCategory !== f.category) return false;
  if (f.status && g.status !== f.status) return false;
  if (f.entrust === "has" && entrusts.length === 0) return false;
  if (f.entrust === "none" && entrusts.length > 0) return false;
  if (
    (f.entrust === "pending" || f.entrust === "accepted") &&
    !entrusts.some((e) => e.status === f.entrust)
  )
    return false;
  return true;
}

const columns =
  "48px 118px minmax(170px,1.5fr) minmax(130px,1fr) 120px 90px minmax(100px,0.8fr) 80px 92px minmax(150px,1fr)";
const listingColumns =
  "116px 92px 72px minmax(170px,1.2fr) 110px 110px 84px 120px";
const specSummaryColumns =
  "118px minmax(160px,1.2fr) 100px 100px 100px 100px minmax(100px,0.8fr) 80px";
const batchLineColumns =
  "118px minmax(160px,1.2fr) minmax(150px,1fr) 110px 110px 110px 80px";
const entrustColumns =
  "110px 92px minmax(170px,1fr) 90px 110px minmax(200px,1.2fr) 80px 90px";

const entrustStatusMeta: Record<
  EntrustStatus,
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
  returned: {
    label: "已退回",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
};

function fmtLinePrice(l: EntrustLine, unit: string, types: BizType[]) {
  const parts: string[] = [];
  if (types.includes("sale") && l.salePrice !== undefined)
    parts.push(`售 ¥ ${fmtPrice(l.salePrice)} / ${unit}`);
  if (types.includes("rent") && l.rentPrice !== undefined)
    parts.push(
      `租 ¥ ${fmtPrice(l.rentPrice)} / ${unit} / 天${l.rentDeposit !== undefined ? `，押金 ¥ ${fmtPrice(l.rentDeposit)}` : ""}`,
    );
  return parts.join("；");
}

/** 委托记录：每张委托单一行，对应一家服务商；委托以整个商品为单位，行内按规格列出数量与委托价 */
function EntrustTable({
  records,
  unit,
  onCancel,
}: {
  records: EntrustRecord[];
  unit: string;
  onCancel: (id: string) => void;
}) {
  if (records.length === 0)
    return (
      <div className="rounded border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        暂无委托记录，可在操作列点击「委托」发起
      </div>
    );
  const providers = new Set(records.map((r) => r.provider)).size;
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">委托记录</span>
        <span className="text-muted-foreground">
          共 {records.length} 张委托单 · {providers} 家服务商
        </span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: entrustColumns }}
      >
        <span>委托单号</span>
        <span>委托日期</span>
        <span>服务商</span>
        <span>委托方式</span>
        <span>委托数量</span>
        <span>委托价</span>
        <span>受理情况</span>
        <span>操作</span>
      </div>
      {records.map((r) => {
        const meta = entrustStatusMeta[r.status];
        const total = r.lines.reduce((s, l) => s + l.quantity, 0);
        const multi = r.lines.length > 1;
        return (
          <div
            key={r.id}
            className="grid items-start gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
            style={{ gridTemplateColumns: entrustColumns }}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {r.id}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {r.createdAt}
            </span>
            <span className="truncate" title={r.provider}>
              {r.provider}
            </span>
            <span className="flex flex-wrap gap-1">
              {r.types.map((t) => (
                <Tag key={t} className={bizMeta[t].className}>
                  {bizMeta[t].label}
                </Tag>
              ))}
            </span>
            <span className="flex flex-col text-xs leading-5 tabular-nums">
              <span className="text-sm">
                {total.toLocaleString()} {unit}
              </span>
              {multi &&
                r.lines.map((l) => (
                  <span key={l.code} className="text-muted-foreground">
                    {l.spec}：{l.quantity.toLocaleString()}
                  </span>
                ))}
            </span>
            <span className="flex flex-col text-xs leading-5 tabular-nums">
              {r.lines.map((l) => (
                <span key={l.code} className="truncate">
                  {multi && (
                    <span className="text-muted-foreground">{l.spec}：</span>
                  )}
                  {fmtLinePrice(l, unit, r.types)}
                </span>
              ))}
            </span>
            <span className="flex flex-col items-start gap-1">
              <Tag className={meta.className}>{meta.label}</Tag>
              {r.status === "returned" && r.statusNote && (
                <span
                  className="line-clamp-2 text-[11px] leading-4 text-muted-foreground"
                  title={r.statusNote}
                >
                  {r.statusNote}
                </span>
              )}
            </span>
            <span className="flex items-center gap-3">
              <ActionLink>详情</ActionLink>
              {r.status === "pending" && (
                <ActionLink tone="danger" onClick={() => onCancel(r.id)}>
                  撤回
                </ActionLink>
              )}
            </span>
          </div>
        );
      })}
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

/** 一组同名商品的全部上架记录：多规格时在行内标注编码与规格，记录按规格顺序排列 */
type ListingBatch = {
  id: string;
  type: BizType;
  createdAt?: string;
  rows: { g: Goods; l: Listing }[];
};

/** 把各规格的上架记录按上架单号归并 */
function batchesOf(items: Goods[]): ListingBatch[] {
  const map = new Map<string, ListingBatch>();
  for (const g of items)
    for (const l of g.listings) {
      const b = map.get(l.batch);
      if (b) b.rows.push({ g, l });
      else map.set(l.batch, { id: l.batch, type: l.type, createdAt: l.createdAt, rows: [{ g, l }] });
    }
  return [...map.values()].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );
}

type BatchStatus = "on" | "off" | "partial";
function batchStatus(b: ListingBatch): BatchStatus {
  const on = b.rows.filter((r) => r.l.status === "on").length;
  return on === 0 ? "off" : on === b.rows.length ? "on" : "partial";
}
const batchStatusMeta: Record<BatchStatus, { label: string; className: string }> = {
  on: listingStatusMeta.on,
  partial: {
    label: "部分下架",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  off: listingStatusMeta.off,
};

function fmtListingPrice(l: Listing, unit: string) {
  return `¥ ${fmtPrice(l.price)} / ${unit}${l.type === "rent" && l.period ? ` / ${l.period}` : ""}`;
}

/** 一组同名商品的全部上架记录：每张上架单一行，行内按规格列出价格与数量 */
function GroupListingTable({
  items,
  onDetail,
  onOff,
  onRelist,
}: {
  items: Goods[];
  onDetail: (batchId: string) => void;
  onOff: (batchId: string) => void;
  onRelist: () => void;
}) {
  const batches = batchesOf(items);
  const head = items[0];
  const rows = batches.flatMap((b) => b.rows.map((r) => r.l));
  const mixed = new Set(rows.map((l) => l.type)).size > 1;
  if (batches.length === 0)
    return (
      <div className="rounded border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        暂无上架记录，可在操作列点击「上架」创建
      </div>
    );
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-medium">上架记录</span>
        <span className="text-muted-foreground">
          共 {batches.length} 张上架单 · {rows.length} 条规格记录
        </span>
      </div>
      <div
        className="grid items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns: listingColumns }}
      >
        <span>上架单号</span>
        <span>上架时间</span>
        <span>租售方式</span>
        <span>价格</span>
        <span>上架数量</span>
        <span>{listingUsedHeader(rows)}</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      {batches.map((b) => {
        const meta = bizMeta[b.type];
        const st = batchStatusMeta[batchStatus(b)];
        const multi = b.rows.length > 1;
        const qty = b.rows.reduce((s, r) => s + r.l.quantity, 0);
        const used = b.rows.reduce((s, r) => s + r.l.used, 0);
        const first = b.rows[0].l;
        return (
          <div
            key={b.id}
            className="grid items-start gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
            style={{ gridTemplateColumns: listingColumns }}
          >
            <span className="font-mono text-xs text-muted-foreground">{b.id}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {b.createdAt ?? "—"}
            </span>
            <span className="flex">
              <Tag className={meta.className}>{meta.label}</Tag>
            </span>
            <span className="flex min-w-0 flex-col text-xs leading-5 tabular-nums">
              {b.rows.map(({ g, l }) => (
                <span key={l.id} className="truncate">
                  {multi && <span className="text-muted-foreground">{g.spec}：</span>}
                  {fmtListingPrice(l, g.unit)}
                </span>
              ))}
              {(first.taxRate || first.payTerm || first.negotiable) && (
                <span className="text-[11px] text-muted-foreground">
                  {[
                    first.taxRate && `税率 ${first.taxRate}`,
                    first.payTerm,
                    first.negotiable && "可议价",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </span>
            <span className="flex flex-col text-xs leading-5 tabular-nums">
              <span className="text-sm">
                {qty.toLocaleString()} {head.unit}
              </span>
              {multi &&
                b.rows.map(({ g, l }) => (
                  <span key={l.id} className="text-muted-foreground">
                    {g.spec}：{l.quantity.toLocaleString()}
                  </span>
                ))}
            </span>
            <span className="tabular-nums">
              {mixed && (
                <span className="mr-1 text-xs text-muted-foreground">
                  {usedLabel(b.type)}
                </span>
              )}
              {used.toLocaleString()} {head.unit}
            </span>
            <span className="flex">
              <Tag className={st.className}>{st.label}</Tag>
            </span>
            <span className="flex items-center gap-3">
              <ActionLink onClick={() => onDetail(b.id)}>详情</ActionLink>
              {batchStatus(b) !== "off" ? (
                <ActionLink tone="danger" onClick={() => onOff(b.id)}>
                  下架
                </ActionLink>
              ) : (
                <ActionLink onClick={onRelist}>重新上架</ActionLink>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 上架单详情：商品上架后的完整信息——运营规则、按规格的价格 / 数量 / 成交与状态 */
function ListingDetail({
  group,
  batch,
  onBack,
  onOff,
  onOffLine,
}: {
  group: SpecGroup<Goods>;
  batch: ListingBatch;
  onBack: () => void;
  onOff: (batchId: string) => void;
  onOffLine: (listingId: string) => void;
}) {
  const head = group.items[0];
  const first = batch.rows[0].l;
  const meta = bizMeta[batch.type];
  const st = batchStatusMeta[batchStatus(batch)];
  const qty = batch.rows.reduce((s, r) => s + r.l.quantity, 0);
  const used = batch.rows.reduce((s, r) => s + r.l.used, 0);
  const onQty = batch.rows
    .filter((r) => r.l.status === "on")
    .reduce((s, r) => s + r.l.quantity - r.l.used, 0);
  const rent = batch.type === "rent";
  return (
    <div className="flex flex-col gap-4">
      <DetailHeader
        title={`上架单 ${batch.id}`}
        onBack={onBack}
        tags={
          <>
            <Tag className={meta.className}>{meta.label}</Tag>
            <Tag className={st.className}>{st.label}</Tag>
          </>
        }
        subtitle={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span>{group.name}</span>
            <span>{head.shop}</span>
            <span>上架时间：{batch.createdAt ?? "—"}</span>
            <span>计量单位：{head.unit}</span>
          </span>
        }
        actions={
          batchStatus(batch) !== "off" ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onOff(batch.id)}
            >
              整单下架
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="上架数量"
          value={qty}
          unit={head.unit}
          hint={`${batch.rows.length} 个规格`}
        />
        <StatCard
          label={rent ? "累计已租" : "累计已售"}
          value={used}
          unit={head.unit}
          hint={qty ? `成交率 ${Math.round((used / qty) * 100)}%` : undefined}
        />
        <StatCard
          label="在售 / 在租可用"
          value={onQty}
          unit={head.unit}
          hint="上架中规格的剩余数量"
        />
        <StatCard
          label="规格状态"
          value={`${batch.rows.filter((r) => r.l.status === "on").length} / ${batch.rows.length}`}
          unit="上架中"
        />
      </div>

      <DetailSection title={rent ? "出租规则" : "出售规则"} extra="上架单内全部规格共用">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DescItem label="租售方式">{meta.label}</DescItem>
          {rent && <DescItem label="计租周期">按{first.period ?? "天"}</DescItem>}
          {rent && (
            <DescItem label="租期">
              {first.minDays ?? "—"} {first.period ?? "天"} 起
              {first.maxDays ? `，最长 ${first.maxDays} ${first.period ?? "天"}` : "，不限最长"}
            </DescItem>
          )}
          <DescItem label="税率">{first.taxRate ?? "—"}</DescItem>
          <DescItem label="履约方式">{first.payTerm ?? "—"}</DescItem>
          <DescItem label="议价">
            {first.negotiable ? `支持${rent ? "租" : "买"}方发起议价` : "不支持"}
          </DescItem>
          {rent && (
            <div className="sm:col-span-2 xl:col-span-4">
              <DescItem label="损耗赔付标准">{first.lossRule ?? "—"}</DescItem>
            </div>
          )}
        </div>
      </DetailSection>

      <DetailSection
        title="上架明细"
        extra="引用商品明细，按规格分别定价、定量；可按规格单独下架"
        flush
      >
        <div
          className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: batchLineColumns }}
        >
          <span>商品编码</span>
          <span>规格型号</span>
          <span>{rent ? "租金 / 押金" : "单价 / 起订量"}</span>
          <span>上架数量</span>
          <span>{rent ? "已租" : "已售"}</span>
          <span>剩余</span>
          <span>状态</span>
        </div>
        {batch.rows.map(({ g, l }) => {
          const m = listingStatusMeta[l.status];
          return (
            <div
              key={l.id}
              className="grid items-center gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0"
              style={{ gridTemplateColumns: batchLineColumns }}
            >
              <span className="font-mono text-xs text-muted-foreground">{g.code}</span>
              <span className="truncate font-medium" title={g.spec}>
                {g.spec}
              </span>
              <span className="flex flex-col text-xs leading-5 tabular-nums">
                <span className="text-sm">{fmtListingPrice(l, g.unit)}</span>
                <span className="text-muted-foreground">
                  {rent
                    ? `押金 ¥ ${fmtPrice(l.deposit ?? 0)} / ${g.unit}`
                    : l.minOrder
                      ? `起订 ${l.minOrder.toLocaleString()} ${g.unit}`
                      : "起订量不限"}
                </span>
              </span>
              <span className="tabular-nums">
                {l.quantity.toLocaleString()} {g.unit}
              </span>
              <span className="tabular-nums">
                {l.used.toLocaleString()} {g.unit}
              </span>
              <span className="tabular-nums">
                {(l.quantity - l.used).toLocaleString()} {g.unit}
              </span>
              <span className="flex items-center gap-3">
                <Tag className={m.className}>{m.label}</Tag>
                {l.status === "on" && (
                  <ActionLink tone="danger" onClick={() => onOffLine(l.id)}>
                    下架
                  </ActionLink>
                )}
              </span>
            </div>
          );
        })}
      </DetailSection>
    </div>
  );
}

/** 商品详情页：与发布表单对应——基本信息与图片、商品明细、区域禁售、运费、商品详情，以及上架 / 委托记录；编辑、上架、委托均在此以整个商品为单位操作 */
function GoodsDetail({
  group,
  entrusts,
  onBack,
  onAction,
  onCancelEntrust,
  onListingDetail,
  onOffBatch,
}: {
  group: SpecGroup<Goods>;
  entrusts: EntrustRecord[];
  onBack: () => void;
  onAction: (g: Goods, a: GoodsAction) => void;
  onCancelEntrust: (id: string) => void;
  onListingDetail: (batchId: string) => void;
  onOffBatch: (batchId: string) => void;
}) {
  const items = group.items;
  const head = items[0];
  const single = items.length === 1;
  const allListings = items.flatMap((g) => g.listings);
  const totalStock = items.reduce((s, g) => s + g.stock, 0);
  const lockedTotal = items.reduce((s, g) => s + lockedStock(g), 0);
  const onListings = allListings.filter((l) => l.status === "on");
  const batches = batchesOf(items);
  const saleUsed = allListings
    .filter((l) => l.type === "sale")
    .reduce((s, l) => s + l.used, 0);
  const rentUsed = allListings
    .filter((l) => l.type === "rent")
    .reduce((s, l) => s + l.used, 0);
  const activeEntrusts = entrusts.filter((e) => e.status !== "returned");
  const entrustedTotal = activeEntrusts
    .flatMap((e) => e.lines)
    .reduce((s, l) => s + l.quantity, 0);
  const createdAt = items.map((g) => g.createdAt).sort()[0];
  const updatedAt = items
    .map((g) => g.updatedAt)
    .sort()
    .at(-1);
  const editable = head.status !== "violation" && head.status !== "reviewing";
  const images = head.images ?? [];

  return (
    <div className="flex flex-col gap-4">
      <DetailHeader
        title={group.name}
        onBack={onBack}
        tags={
          <>
            <Tag className="bg-[#1890ff]/10 text-[#1890ff] ring-[#1890ff]/20">
              {items.length} 规格
            </Tag>
            <StatusSummary
              statuses={items.map((g) => g.status)}
              order={goodsStatusOrder}
              meta={goodsStatusMeta}
            />
          </>
        }
        subtitle={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="font-mono">
              {single ? head.code : `${head.code} 等 ${items.length} 个编码`}
            </span>
            <span>{head.shop}</span>
            <span>
              {head.category} / {head.subCategory}
            </span>
            <span>计量单位：{head.unit}</span>
          </span>
        }
        actions={
          <>
            {editable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction(head, "edit")}
              >
                编辑商品
              </Button>
            )}
            {canEntrust(items) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction(head, "entrust")}
              >
                委托服务商
              </Button>
            )}
            {canList(items) && (
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
          hint={`${items.length} 个规格合计 · 上架占用 ${lockedTotal.toLocaleString()} · 可上架 ${(totalStock - lockedTotal).toLocaleString()} ${head.unit}`}
        />
        <StatCard
          label="上架单"
          value={batches.length}
          unit="张"
          hint={`上架中 ${onListings.length} 条规格记录 · 占用库存 ${onListings.reduce((s, l) => s + l.quantity, 0).toLocaleString()} ${head.unit}`}
        />
        <StatCard
          label="累计已售 / 已租"
          value={`${saleUsed.toLocaleString()} / ${rentUsed.toLocaleString()}`}
          unit={head.unit}
        />
        <StatCard
          label="委托运营"
          value={activeEntrusts.length ? entrustedTotal : "无"}
          unit={activeEntrusts.length ? head.unit : undefined}
          hint={
            activeEntrusts.length
              ? `${activeEntrusts.length} 张委托单 · ${new Set(activeEntrusts.map((e) => e.provider)).size} 家服务商 · 已受理 ${activeEntrusts.filter((e) => e.status === "accepted").length} 张`
              : "全部由本店自营"
          }
        />
      </div>

      <DetailSection title="基本信息">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex shrink-0 gap-2">
            {images.length > 0 ? (
              images.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt={`${group.name} 商品图`}
                  className="size-28 rounded border border-border object-cover"
                />
              ))
            ) : (
              <div className="flex size-28 flex-col items-center justify-center gap-1 rounded border border-dashed border-border text-[11px] text-muted-foreground">
                <ImageIcon className="size-5" aria-hidden />
                暂无图片
              </div>
            )}
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="sm:col-span-2 xl:col-span-3">
              <DescItem label="商品名称">{group.name}</DescItem>
            </div>
            <DescItem label="所属店铺">{head.shop}</DescItem>
            <DescItem label="品类">
              {head.category} / {head.subCategory}
            </DescItem>
            <DescItem label="计量单位">{head.unit}</DescItem>
            <div className="sm:col-span-2 xl:col-span-3">
              <DescItem label="商品所在地">{head.location ?? "—"}</DescItem>
            </div>
            <DescItem label="创建时间">
              <span className="font-mono text-xs">{createdAt}</span>
            </DescItem>
            <DescItem label="最近更新">
              <span className="font-mono text-xs">{updatedAt}</span>
            </DescItem>
            {head.statusNote && (
              <DescItem label="状态说明">
                <span className="text-xs text-muted-foreground">{head.statusNote}</span>
              </DescItem>
            )}
          </div>
        </div>
      </DetailSection>

      <DetailSection
        title="商品明细"
        extra={`${items.length} 个规格 · 总库存 ${totalStock.toLocaleString()} ${head.unit}；上架 / 委托以整个商品为单位引用明细，下架按规格操作`}
        flush
      >
        <div
          className="grid items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: specSummaryColumns }}
        >
          <span>商品编码</span>
          <span>规格型号</span>
          <span>总库存</span>
          <span>上架占用</span>
          <span>委托中</span>
          <span>可上架</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        {items.map((g) => {
          const locked = lockedStock(g);
          const entrusted = entrustedQty(g.code, entrusts);
          const m = goodsStatusMeta[g.status];
          return (
            <div
              key={g.code}
              className="grid items-center gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0"
              style={{ gridTemplateColumns: specSummaryColumns }}
            >
              <span className="font-mono text-xs text-muted-foreground">{g.code}</span>
              <span className="truncate font-medium" title={g.spec}>
                {g.spec}
              </span>
              <span className="tabular-nums">
                {g.stock.toLocaleString()} {g.unit}
              </span>
              <span className="tabular-nums">
                {locked.toLocaleString()} {g.unit}
              </span>
              <span className="tabular-nums">
                {entrusted.toLocaleString()} {g.unit}
              </span>
              <span className="tabular-nums">
                {Math.max(g.stock - locked - entrusted, 0).toLocaleString()} {g.unit}
              </span>
              <span className="flex min-w-0 flex-col items-start gap-1">
                <Tag className={m.className}>{m.label}</Tag>
                {g.statusNote && (
                  <span
                    className="line-clamp-1 text-[11px] leading-4 text-muted-foreground"
                    title={g.statusNote}
                  >
                    {g.statusNote}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-3">
                {g.status === "active" ? (
                  <ActionLink tone="danger" onClick={() => onAction(g, "off")}>
                    下架
                  </ActionLink>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </span>
            </div>
          );
        })}
      </DetailSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="区域禁售">
          {head.banAreas === undefined ? (
            <span className="text-sm text-muted-foreground">未设置</span>
          ) : head.banAreas.length === 0 ? (
            <span className="text-sm text-muted-foreground">未启用区域禁售，全国可售</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {head.banAreas.map((a) => (
                <Tag key={a} className="bg-muted text-foreground ring-border">
                  {a}
                </Tag>
              ))}
            </div>
          )}
        </DetailSection>
        <DetailSection title="运费设置">
          <span className="text-sm">{head.freight ?? <span className="text-muted-foreground">未设置</span>}</span>
        </DetailSection>
      </div>

      <DetailSection title="商品详情">
        <p className="text-sm leading-6">
          {head.description ?? <span className="text-muted-foreground">暂无详情描述</span>}
        </p>
      </DetailSection>

      <DetailSection
        title="上架记录"
        extra="每次上架生成一张上架单，引用商品明细按规格定价、定量；点击详情查看上架后的完整信息"
        flush
      >
        <div className="p-3">
          <GroupListingTable
            items={items}
            onDetail={onListingDetail}
            onOff={onOffBatch}
            onRelist={() => onAction(head, "list")}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="委托记录"
        extra="委托以整个商品为单位，可全部或部分规格委托给多家服务商；待受理的委托可撤回，服务商受理后由其加价上架"
        flush
      >
        <div className="p-3">
          <EntrustTable
            records={entrusts}
            unit={head.unit}
            onCancel={onCancelEntrust}
          />
        </div>
      </DetailSection>
    </div>
  );
}

export function GoodsList({ onCreate }: { onCreate: () => void }) {
  const [goods, setGoods] = useState<Goods[]>(goodsData);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<{
    action: Exclude<GoodsAction, "detail">;
    code: string;
  } | null>(null);
  const [detailName, setDetailName] = useState<string | null>(null);
  const [detailBatch, setDetailBatch] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const records = useEntrusts();

  const dialogGoods = dialog
    ? goods.find((g) => g.code === dialog.code)
    : undefined;
  const dialogItems = dialogGoods
    ? goods.filter((g) => g.name === dialogGoods.name)
    : [];
  const notify = (message: string) => {
    setDialog(null);
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };
  const cancelEntrust = (id: string) => {
    const r = records.find((x) => x.id === id);
    if (!r || r.status !== "pending") return;
    removeEntrust(id);
    notify(`已撤回委托单 ${id}：${r.goodsName}（${r.provider}）`);
  };

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
    notify(message);
  };
  /** 同名商品的全部规格一起变更状态 */
  const updateGroupStatus = (
    name: string,
    status: GoodsStatus,
    statusNote: string | undefined,
    message: string,
  ) => {
    setGoods((list) =>
      list.map((g) =>
        g.name === name ? { ...g, status, statusNote, updatedAt: now() } : g,
      ),
    );
    notify(message);
  };
  const handleAction = (g: Goods, action: GoodsAction) => {
    if (action === "detail") {
      setDetailName(g.name);
      return;
    }
    if (action === "withdraw") {
      updateGroupStatus(g.name, "draft", undefined, `已撤回审核：${g.name}，商品恢复为草稿`);
      return;
    }
    setDialog({ action, code: g.code });
  };
  /** 整单下架：上架单内全部规格记录下架 */
  const offBatch = (batchId: string) => {
    setGoods((list) =>
      list.map((g) =>
        g.listings.some((l) => l.batch === batchId)
          ? {
              ...g,
              updatedAt: now(),
              listings: g.listings.map((l) =>
                l.batch === batchId ? { ...l, status: "off" as const } : l,
              ),
            }
          : g,
      ),
    );
    notify(`已下架上架单 ${batchId}`);
  };
  const offLine = (listingId: string) => {
    setGoods((list) =>
      list.map((g) =>
        g.listings.some((l) => l.id === listingId)
          ? {
              ...g,
              updatedAt: now(),
              listings: g.listings.map((l) =>
                l.id === listingId ? { ...l, status: "off" as const } : l,
              ),
            }
          : g,
      ),
    );
    notify("已下架该规格");
  };

  const visible = goods.filter((g) => matches(g, applied, records));
  const isFiltered = Object.values(applied).some(Boolean);

  /** 各状态数量按除状态以外的其他条件统计，便于在页签间切换时看到全貌 */
  const baseFilters: Filters = { ...applied, status: "" };
  const base = goods.filter((g) => matches(g, baseFilters, records));
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
  const batchGroup = detailBatch
    ? groupSpecs(
        goods.filter((g) => g.listings.some((l) => l.batch === detailBatch)),
      )[0]
    : undefined;
  const batch = batchGroup
    ? batchesOf(batchGroup.items).find((b) => b.id === detailBatch)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      {batchGroup && batch ? (
        <ListingDetail
          group={batchGroup}
          batch={batch}
          onBack={() => setDetailBatch(null)}
          onOff={offBatch}
          onOffLine={offLine}
        />
      ) : detailGroup ? (
        <GoodsDetail
          group={detailGroup}
          entrusts={entrustsOf(detailGroup.name, records)}
          onBack={() => setDetailName(null)}
          onAction={handleAction}
          onCancelEntrust={cancelEntrust}
          onListingDetail={setDetailBatch}
          onOffBatch={offBatch}
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
                同一商品的多个规格归为一行，点击编码前的角标展开查看上架记录
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
                  const entrusts = entrustsOf(grp.name, records);
                  const activeEntrusts = entrusts.filter(
                    (e) => e.status !== "returned",
                  );
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
                            aria-controls={`listings-${head.code}`}
                            aria-label={
                              open
                                ? `收起 ${grp.name} 上架 / 委托记录`
                                : `展开 ${grp.name} 上架 / 委托记录`
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
                              {listingCount + entrusts.length}
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
                          {single && head.status === "off" && head.statusNote && (
                            <span
                              className="line-clamp-2 text-[11px] leading-4 text-muted-foreground"
                              title={head.statusNote}
                            >
                              {head.statusNote}
                            </span>
                          )}
                        </span>
                        <span className="flex flex-col items-start gap-0.5">
                          {activeEntrusts.length ? (
                            <>
                              <Tag className="bg-violet-50 text-violet-700 ring-violet-200">
                                有
                              </Tag>
                              <span className="text-[11px] leading-4 text-muted-foreground">
                                {activeEntrusts.length === 1
                                  ? entrustStatusLabel(activeEntrusts[0].status)
                                  : `${activeEntrusts.length} 家服务商`}
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
                        <GoodsActions
                          items={items}
                          onAction={(a) => handleAction(head, a)}
                        />
                      </div>
                      {open && (
                        <div
                          id={`listings-${head.code}`}
                          className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-3 pl-[84px]"
                        >
                          <GroupListingTable
                            items={items}
                            onDetail={setDetailBatch}
                            onOff={offBatch}
                            onRelist={() => handleAction(head, "list")}
                          />
                          {entrusts.length > 0 && (
                            <EntrustTable
                              records={entrusts}
                              unit={head.unit}
                              onCancel={cancelEntrust}
                            />
                          )}
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
          key={dialogGoods.name}
          items={dialogItems}
          onClose={() => setDialog(null)}
          onConfirm={(created) => {
            const byCode = new Map(created.map((c) => [c.code, c.listing]));
            setGoods((list) =>
              list.map((g) => {
                const l = byCode.get(g.code);
                return l
                  ? {
                      ...g,
                      status: "active" as const,
                      statusNote: undefined,
                      updatedAt: now(),
                      listings: [l, ...g.listings],
                    }
                  : g;
              }),
            );
            const qty = created.reduce((s, c) => s + c.listing.quantity, 0);
            notify(
              `已上架：${dialogGoods.name}（上架单 ${created[0].listing.batch}，${bizMeta[created[0].listing.type].label} ${created.length} 个规格共 ${qty.toLocaleString()} ${dialogGoods.unit}）`,
            );
          }}
        />
      )}
      {dialog?.action === "entrust" && dialogGoods && (
        <EntrustDialog
          key={dialogGoods.name}
          items={dialogItems}
          records={records}
          onClose={() => setDialog(null)}
          onConfirm={(created) => {
            addEntrusts(created);
            const qty = created[0].lines.reduce((s, l) => s + l.quantity, 0);
            notify(
              `已提交 ${created.length} 张委托单：${dialogGoods.name}（${created[0].types.map((t) => bizMeta[t].label).join("/")} ${qty.toLocaleString()} ${dialogGoods.unit}，待 ${created.map((c) => c.provider).join("、")} 受理）`,
            );
          }}
        />
      )}
      {dialog?.action === "edit" && dialogGoods && (
        <EditDialog
          key={dialogGoods.name}
          items={dialogItems}
          onClose={() => setDialog(null)}
          onConfirm={(patch) => {
            const byCode = new Map(patch.lines.map((l) => [l.code, l]));
            setGoods((list) =>
              list.map((g) => {
                const l = byCode.get(g.code);
                return l
                  ? {
                      ...g,
                      name: patch.name,
                      category: patch.category,
                      subCategory: patch.subCategory,
                      unit: patch.unit,
                      location: patch.location || undefined,
                      spec: l.spec,
                      stock: l.stock,
                      updatedAt: now(),
                    }
                  : g;
              }),
            );
            notify(`已保存：${patch.name}（${patch.lines.length} 个规格）`);
            if (detailName === dialogGoods.name && patch.name !== detailName)
              setDetailName(patch.name);
          }}
        />
      )}
      {dialog?.action === "submit" && dialogGoods && (
        <SubmitReviewDialog
          key={dialogGoods.name}
          items={dialogItems}
          onClose={() => setDialog(null)}
          onConfirm={(note) =>
            updateGroupStatus(
              dialogGoods.name,
              "reviewing",
              note || undefined,
              `已提交审核：${dialogGoods.name}（${dialogItems.length} 个规格），预计 1 个工作日内完成`,
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
