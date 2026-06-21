import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export const customerSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'CONTRACTOR', 'CONSTRUCTION_COMPANY', 'ARCHITECT', 'INVESTOR', 'DEALER', 'OTHER']),
  name: z.string().min(1, 'Tên khách hàng không được để trống'),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
  source: z.enum(['WEBSITE', 'FACEBOOK', 'ZALO', 'GOOGLE_ADS', 'REFERRAL', 'RETURNING', 'TELESALES', 'SHOWROOM', 'OTHER']),
  status: z.enum(['NEW', 'CONTACTED', 'CONSULTING', 'QUOTE_SENT', 'NEGOTIATING', 'PURCHASED', 'NO_NEED', 'UNREACHABLE', 'FOLLOW_UP']).optional(),
  productNeeds: z.array(z.string()).optional(),
  estimatedArea: z.number().optional().nullable(),
  estimatedBudget: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  assignedToId: z.string().optional(),
})

export const interactionSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(['CALL', 'ZALO', 'EMAIL', 'IN_PERSON', 'SITE_SURVEY', 'SEND_QUOTE', 'FOLLOW_PAYMENT', 'OTHER']),
  content: z.string().min(1, 'Nội dung không được để trống'),
  result: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
})

export const opportunitySchema = z.object({
  name: z.string().min(1, 'Tên cơ hội không được để trống'),
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  projectName: z.string().optional().nullable(),
  assignedToId: z.string().optional(),
  products: z.array(z.string()).optional(),
  estimatedArea: z.number().optional().nullable(),
  estimatedValue: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  stage: z.enum(['NEW_LEAD', 'CONTACTED', 'SURVEYED', 'CONSULTING', 'QUOTE_SENT', 'NEGOTIATING', 'CONTRACT_PENDING', 'WON', 'LOST']).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  lossReason: z.string().optional().nullable(),
  competitor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const productSchema = z.object({
  code: z.string().min(1, 'Mã sản phẩm không được để trống'),
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  group: z.enum(['TEMPERED_GLASS', 'INSULATED_GLASS', 'LAMINATED_GLASS', 'TINTED_GLASS', 'REFLECTIVE_GLASS', 'GLASS_PARTITION', 'GLASS_DOOR', 'GLASS_RAILING', 'SHOWER_CABIN', 'GLASS_FACADE', 'ACCESSORIES', 'INSTALLATION']),
  unit: z.enum(['SQM', 'SET', 'LINEAR_METER', 'PIECE', 'PACKAGE']).optional(),
  referencePrice: z.number().min(0).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const quoteItemSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'Mô tả không được để trống'),
  specification: z.string().optional().nullable(),
  thickness: z.string().optional().nullable(),
  length: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  area: z.number().optional().nullable(),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0).default(0),
  discount: z.number().min(0).max(100).default(0),
  total: z.number().default(0),
  sortOrder: z.number().default(0),
})

export const quoteSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  opportunityId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SENT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  expiryDate: z.string().optional().nullable(),
  shippingCost: z.number().min(0).default(0),
  installationCost: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(10),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).min(1, 'Báo giá phải có ít nhất 1 hạng mục'),
})

export const orderSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  opportunityId: z.string().optional().nullable(),
  quoteId: z.string().optional().nullable(),
  assignedToId: z.string().optional(),
  projectName: z.string().optional().nullable(),
  status: z.enum(['NEW', 'IN_PRODUCTION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'DEPOSITED', 'PARTIAL', 'FULLY_PAID']).optional(),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(10),
  signedDate: z.string().optional().nullable(),
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string().optional().nullable(),
    description: z.string().min(1),
    specification: z.string().optional().nullable(),
    thickness: z.string().optional().nullable(),
    length: z.number().optional().nullable(),
    width: z.number().optional().nullable(),
    area: z.number().optional().nullable(),
    quantity: z.number().min(1).default(1),
    unitPrice: z.number().min(0).default(0),
    discount: z.number().min(0).max(100).default(0),
    total: z.number().default(0),
    sortOrder: z.number().default(0),
  })).optional(),
})

export const paymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  paymentDate: z.string().min(1, 'Vui lòng chọn ngày thanh toán'),
  method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  customerId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  assignedToId: z.string().min(1, 'Vui lòng chọn người phụ trách'),
  type: z.enum(['CALL', 'ZALO', 'EMAIL', 'MEETING', 'SITE_SURVEY', 'SEND_QUOTE', 'FOLLOW_QUOTE', 'FOLLOW_PAYMENT', 'FOLLOW_UP']),
  dueDate: z.string().min(1, 'Vui lòng chọn hạn xử lý'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE']).optional(),
  notes: z.string().optional().nullable(),
})

export const userSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
  name: z.string().min(1, 'Họ tên không được để trống'),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES']).optional(),
  teamId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE']).optional(),
})

export const kpiSchema = z.object({
  userId: z.string().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  targetRevenue: z.number().min(0).default(0),
  targetNewCustomers: z.number().min(0).default(0),
  targetInteractions: z.number().min(0).default(0),
})

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional().nullable(),
})
