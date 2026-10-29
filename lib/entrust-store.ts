import { useSyncExternalStore } from "react";

export type EntrustBizType = "sale" | "rent";
export type EntrustStatus = "pending" | "accepted" | "returned";

/** 委托单中某个规格的委托数量与委托价 */
export type EntrustLine = {
  code: string;
  spec: string;
  quantity: number;
  /** 出售委托价（按单位计） */
  salePrice?: number;
  /** 出租委托价（按单位 / 天计） */
  rentPrice?: number;
  /** 出租押金（按单位计） */
  rentDeposit?: number;
};

/** 委托单：以整个商品（含全部规格）为单位，委托给一家服务商 */
export type EntrustRecord = {
  id: string;
  goodsName: string;
  shop: string;
  category: string;
  subCategory: string;
  unit: string;
  provider: string;
  types: EntrustBizType[];
  lines: EntrustLine[];
  status: EntrustStatus;
  statusNote?: string;
  createdAt: string;
  acceptedAt?: string;
  /** 演示数据：服务商侧已有对应的受托记录与上架情况，不再二次派生 */
  seeded?: boolean;
};

const seedRecords: EntrustRecord[] = [
  {
    id: "W2024091801",
    goodsName: "钢支撑 Φ609×16 基坑内支撑",
    shop: "华东建设工程有限公司周转材料店",
    category: "循环物资",
    subCategory: "支护类",
    unit: "根",
    provider: "华建周转材料服务有限公司",
    types: ["rent"],
    lines: [
      {
        code: "G2024040003",
        spec: "9m 标准节",
        quantity: 120,
        rentPrice: 10,
        rentDeposit: 3000,
      },
      {
        code: "G2024040010",
        spec: "12m 标准节",
        quantity: 60,
        rentPrice: 7,
        rentDeposit: 2000,
      },
      {
        code: "G2024040011",
        spec: "6m 调节节",
        quantity: 40,
        rentPrice: 4,
        rentDeposit: 1000,
      },
    ],
    status: "accepted",
    createdAt: "2024-09-18",
    acceptedAt: "2024-09-19 09:40",
    seeded: true,
  },
  {
    id: "W2024102701",
    goodsName: "组合式钢模板 300×1500 平模",
    shop: "苏州分公司模板租赁店",
    category: "循环物资",
    subCategory: "模板类",
    unit: "块",
    provider: "中建租赁服务（上海）有限公司",
    types: ["sale", "rent"],
    lines: [
      {
        code: "G2024100009",
        spec: "Q235 / 5mm 面板",
        quantity: 800,
        salePrice: 175,
        rentPrice: 0.35,
        rentDeposit: 150,
      },
    ],
    status: "pending",
    createdAt: "2024-10-27",
    seeded: true,
  },
];

let records: EntrustRecord[] = seedRecords;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return records;
}

/** 订阅全部委托单（商家与服务商共用同一份数据） */
export function useEntrusts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addEntrusts(next: EntrustRecord[]) {
  records = [...next, ...records];
  emit();
}

export function updateEntrust(
  id: string,
  patch: (r: EntrustRecord) => EntrustRecord,
) {
  records = records.map((r) => (r.id === id ? patch(r) : r));
  emit();
}

export function removeEntrust(id: string) {
  records = records.filter((r) => r.id !== id);
  emit();
}

let seq = 0;
export function nextEntrustId() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  seq += 1;
  return `W${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(seq)}`;
}

export function entrustStatusLabel(s: EntrustStatus) {
  return s === "pending" ? "待受理" : s === "accepted" ? "已受理" : "已退回";
}
