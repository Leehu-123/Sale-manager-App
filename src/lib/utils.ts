import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function generateCode(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, '0')}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateArea(length?: number | null, width?: number | null): number | null {
  if (length && width) {
    return Math.round(length * width * 100) / 100
  }
  return null
}

export function calculateLineTotal(
  area: number | null,
  quantity: number,
  unitPrice: number,
  discount: number = 0
): number {
  const baseAmount = (area || quantity) * unitPrice
  return baseAmount - (baseAmount * discount / 100)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Vietnamese role labels
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Trưởng phòng',
  SALES: 'Nhân viên kinh doanh',
}

// Vietnamese status labels for customers
export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  CONTACTED: 'Đã liên hệ',
  CONSULTING: 'Đang tư vấn',
  QUOTE_SENT: 'Đã gửi báo giá',
  NEGOTIATING: 'Đang thương lượng',
  PURCHASED: 'Đã mua',
  NO_NEED: 'Chưa có nhu cầu',
  UNREACHABLE: 'Không liên hệ được',
  FOLLOW_UP: 'Chăm sóc lại',
}

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Cá nhân',
  CONTRACTOR: 'Nhà thầu',
  CONSTRUCTION_COMPANY: 'Công ty xây dựng',
  ARCHITECT: 'Kiến trúc sư',
  INVESTOR: 'Chủ đầu tư',
  DEALER: 'Đại lý',
  OTHER: 'Khác',
}

export const CUSTOMER_SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  FACEBOOK: 'Facebook',
  ZALO: 'Zalo',
  GOOGLE_ADS: 'Google Ads',
  REFERRAL: 'Giới thiệu',
  RETURNING: 'Khách cũ',
  TELESALES: 'Telesales',
  SHOWROOM: 'Showroom',
  FIELD_MARKETING: 'Khách đi thị trường',
  OTHER: 'Khác',
}

export const OPPORTUNITY_STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'Lead mới',
  CONTACTED: 'Đã liên hệ',
  SURVEYED: 'Đã khảo sát',
  CONSULTING: 'Đang tư vấn',
  QUOTE_SENT: 'Đã gửi báo giá',
  NEGOTIATING: 'Đang thương lượng',
  CONTRACT_PENDING: 'Chờ ký hợp đồng',
  WON: 'Chốt thành công',
  LOST: 'Chốt thất bại',
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SENT: 'Đã gửi khách',
  UNDER_REVIEW: 'Khách đang xem xét',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Hết hạn',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới tạo',
  IN_PRODUCTION: 'Đang sản xuất',
  IN_PROGRESS: 'Đang thi công',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  DEPOSITED: 'Đã đặt cọc',
  PARTIAL: 'Thanh toán một phần',
  FULLY_PAID: 'Đã thanh toán đủ',
}

export const TASK_TYPE_LABELS: Record<string, string> = {
  CALL: 'Gọi điện',
  ZALO: 'Gửi Zalo',
  EMAIL: 'Gửi email',
  MEETING: 'Gặp khách',
  SITE_SURVEY: 'Khảo sát công trình',
  SEND_QUOTE: 'Gửi báo giá',
  FOLLOW_QUOTE: 'Theo dõi báo giá',
  FOLLOW_PAYMENT: 'Theo dõi thanh toán',
  FOLLOW_UP: 'Chăm sóc lại',
}

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'Chưa làm',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Hoàn thành',
  OVERDUE: 'Quá hạn',
}

export const INTERACTION_TYPE_LABELS: Record<string, string> = {
  CALL: 'Gọi điện',
  ZALO: 'Zalo',
  EMAIL: 'Email',
  IN_PERSON: 'Gặp trực tiếp',
  SITE_SURVEY: 'Khảo sát công trình',
  SEND_QUOTE: 'Gửi báo giá',
  FOLLOW_PAYMENT: 'Theo dõi thanh toán',
  OTHER: 'Khác',
}

export const PRODUCT_GROUP_LABELS: Record<string, string> = {
  TEMPERED_GLASS: 'Kính cường lực',
  INSULATED_GLASS: 'Kính hộp',
  LAMINATED_GLASS: 'Kính dán an toàn',
  TINTED_GLASS: 'Kính màu',
  REFLECTIVE_GLASS: 'Kính phản quang',
  GLASS_PARTITION: 'Vách kính',
  GLASS_DOOR: 'Cửa kính',
  GLASS_RAILING: 'Lan can kính',
  SHOWER_CABIN: 'Cabin tắm kính',
  GLASS_FACADE: 'Mặt dựng kính',
  ACCESSORIES: 'Phụ kiện',
  INSTALLATION: 'Thi công/lắp đặt',
}

export const PRODUCT_UNIT_LABELS: Record<string, string> = {
  SQM: 'm²',
  SET: 'bộ',
  LINEAR_METER: 'mét dài',
  PIECE: 'cái',
  PACKAGE: 'gói',
}

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  ON_LEAVE: 'Tạm nghỉ',
  INACTIVE: 'Đã nghỉ',
}

// Status color mappings
export const CUSTOMER_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-brand-100 text-blue-800',
  CONTACTED: 'bg-cyan-100 text-cyan-800',
  CONSULTING: 'bg-indigo-100 text-indigo-800',
  QUOTE_SENT: 'bg-purple-100 text-purple-800',
  NEGOTIATING: 'bg-brand-100 text-amber-800',
  PURCHASED: 'bg-green-100 text-green-800',
  NO_NEED: 'bg-surface-100 text-surface-800',
  UNREACHABLE: 'bg-red-100 text-red-800',
  FOLLOW_UP: 'bg-orange-100 text-orange-800',
}

export const OPPORTUNITY_STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: 'bg-brand-100 text-blue-800',
  CONTACTED: 'bg-cyan-100 text-cyan-800',
  SURVEYED: 'bg-teal-100 text-teal-800',
  CONSULTING: 'bg-indigo-100 text-indigo-800',
  QUOTE_SENT: 'bg-purple-100 text-purple-800',
  NEGOTIATING: 'bg-brand-100 text-amber-800',
  CONTRACT_PENDING: 'bg-yellow-100 text-yellow-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
}

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-surface-100 text-surface-800',
  MEDIUM: 'bg-brand-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-surface-100 text-surface-800',
  IN_PROGRESS: 'bg-brand-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-800',
  DEPOSITED: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  FULLY_PAID: 'bg-green-100 text-green-800',
}
