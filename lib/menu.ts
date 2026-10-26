export type MenuNode = {
  id: string
  label: string
  description?: string
  emphasized?: boolean
  children?: MenuNode[]
}

const workbenchCommon = (prefix: string, role: string): MenuNode[] => [
  {
    id: `${prefix}-orders`,
    label: '订单管理',
    description: `${role}查看与处理所有租赁、销售订单`,
    children: [
      { id: `${prefix}-orders-rent`, label: '租赁订单', description: '租赁类订单列表、状态流转与归还处理' },
      { id: `${prefix}-orders-sale`, label: '销售订单', description: '销售类订单列表、发货与签收' },
      { id: `${prefix}-orders-after`, label: '售后处理', description: '退换货、退款与纠纷处理' },
    ],
  },
  {
    id: `${prefix}-settle`,
    label: '结算管理',
    description: `${role}的结算单、账单明细与资金往来`,
    children: [
      { id: `${prefix}-settle-bill`, label: '结算单', description: '按周期生成的结算单列表与确认' },
      { id: `${prefix}-settle-detail`, label: '账单明细', description: '每笔收支、押金、租金明细' },
      { id: `${prefix}-settle-account`, label: '账户与提现', description: '账户余额、提现申请与记录' },
    ],
  },
  {
    id: `${prefix}-contract`,
    label: '合同管理',
    description: `${role}签署的租赁/买卖合同归档与查看`,
  },
]

export const menuTree: MenuNode[] = [
  { id: 'portal', label: '门户首页', description: '面向所有访客的租售门户，展示店铺与商品' },
  {
    id: 'entry',
    label: '用户工作台入口选择',
    description: '登录后选择以商家、买/租方或服务商身份进入工作台',
  },
  {
    id: 'seller',
    label: '用户工作台-商家',
    children: [
      { id: 'seller-dashboard', label: '我的工作台', description: '商家经营概览：待办、订单、结算、店铺数据' },
      {
        id: 'seller-shop',
        label: '店铺管理',
        description: '店铺基础信息、装修与资质维护',
        children: [
          { id: 'seller-shop-info', label: '店铺信息', description: '店铺名称、简介、联系方式与营业状态' },
          { id: 'seller-shop-deco', label: '店铺装修', description: '首页模板、轮播图与栏目配置' },
          { id: 'seller-shop-cert', label: '资质认证', description: '营业执照、经营许可等资质上传与审核' },
        ],
      },
      {
        id: 'seller-goods',
        label: '商品管理',
        description: '租赁与销售商品的发布、上下架与库存',
        children: [
          { id: 'seller-goods-list', label: '商品列表', description: '全部商品的查询、上下架与批量操作' },
          { id: 'seller-goods-publish', label: '发布商品', description: '新增商品，设置租售方式、价格与押金' },
          { id: 'seller-goods-stock', label: '库存管理', description: '可租/可售库存、在租数量与归还记录' },
        ],
      },
      ...workbenchCommon('seller', '商家'),
    ],
  },
  {
    id: 'buyer',
    label: '用户工作台-买/租方',
    children: [
      { id: 'buyer-dashboard', label: '我的工作台', description: '买/租方概览：在租商品、待付款、待归还' },
      ...workbenchCommon('buyer', '买/租方'),
    ],
  },
  {
    id: 'provider',
    label: '用户工作台-服务商',
    children: [
      { id: 'provider-dashboard', label: '我的工作台', description: '服务商概览：受托商品、服务订单、佣金结算' },
      {
        id: 'provider-entrust',
        label: '委托商品管理',
        emphasized: true,
        description: '接收商家委托的商品，代为出租/销售与维护',
      },
      ...workbenchCommon('provider', '服务商'),
    ],
  },
  {
    id: 'ops',
    label: '运营工作台',
    children: [
      { id: 'ops-dashboard', label: '运营概览', description: '平台整体 GMV、店铺数、订单与用户趋势' },
      { id: 'ops-users', label: '用户管理', description: '商家、买/租方、服务商账号管理与权限' },
      { id: 'ops-audit-shop', label: '店铺审核', description: '店铺入驻与资质审核' },
      { id: 'ops-audit-goods', label: '商品审核', description: '商品发布与变更审核' },
      { id: 'ops-orders', label: '订单监控', description: '全平台订单、纠纷与异常监控' },
      { id: 'ops-settings', label: '系统设置', description: '租售规则、费率、字典与通知配置' },
    ],
  },
]

export function findPath(nodes: MenuNode[], id: string, trail: MenuNode[] = []): MenuNode[] | null {
  for (const node of nodes) {
    const next = [...trail, node]
    if (node.id === id) return next
    if (node.children) {
      const found = findPath(node.children, id, next)
      if (found) return found
    }
  }
  return null
}
