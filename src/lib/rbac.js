// ============================================================
// RBAC - Hệ thống phân quyền theo vai trò (Role-Based Access Control)
// Kiểm tra quyền truy cập cho từng tài nguyên và hành động
// ============================================================

import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

// ============================================================
// Định nghĩa quyền cho từng vai trò
// Mỗi vai trò → tài nguyên → danh sách hành động được phép
// ============================================================
export const PERMISSIONS = {
  ADMIN: {
    leads:      ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    deals:      ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    activities: ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    kpis:       ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    users:      ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    webhooks:   ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    export:     ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    projects:   ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    specifications: ['view', 'create', 'edit', 'delete'],
    quotes:     ['view', 'create', 'edit', 'delete'],
    milestones: ['view', 'create', 'edit', 'delete'],
    tickets:    ['view', 'create', 'edit', 'delete', 'assign'],
    customers:  ['view', 'create', 'edit', 'delete'],
    pricing:    ['view', 'create', 'edit', 'delete'],
  },

  SALES_MANAGER: {
    leads:      ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    deals:      ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    activities: ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    kpis:       ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    users:      ['view'],
    webhooks:   ['view', 'create', 'edit', 'delete', 'export'],
    export:     ['view', 'export'],
    projects:   ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    specifications: ['view', 'create', 'edit', 'delete'],
    quotes:     ['view', 'create', 'edit', 'delete'],
    milestones: ['view', 'create', 'edit', 'delete'],
    tickets:    ['view', 'create', 'edit', 'delete', 'assign'],
    customers:  ['view', 'create', 'edit', 'delete'],
    pricing:    ['view', 'create', 'edit', 'delete'],
  },

  SALES_REP: {
    leads:      ['view', 'create', 'edit'],
    deals:      ['view', 'create', 'edit'],
    activities: ['view', 'create', 'edit'],
    kpis:       ['view'],
    users:      [],
    webhooks:   [],
    export:     [],
    projects:   ['view', 'create', 'edit'],
    specifications: ['view', 'create', 'edit'],
    quotes:     ['view', 'create', 'edit'],
    milestones: ['view', 'create', 'edit'],
    tickets:    ['view', 'create', 'edit'],
    customers:  ['view', 'create', 'edit'],
    pricing:    ['view'],
  },

  TECH_STAFF: {
    projects:   ['view', 'edit'],
    specifications: ['view', 'create', 'edit'],
    tickets:    ['view', 'edit', 'assign'],
    customers:  ['view'],
  },
};

// ============================================================
// Kiểm tra quyền truy cập
// ============================================================

/**
 * Kiểm tra người dùng có quyền thực hiện hành động trên tài nguyên không
 * @param {object} session - Session của NextAuth
 * @param {string} resource - Tên tài nguyên (leads, deals, ...)
 * @param {string} action - Hành động (view, create, edit, delete, ...)
 * @returns {boolean} true nếu có quyền
 */
export function checkPermission(session, resource, action) {
  if (!session?.user?.role) return false;

  const role = session.user.role;
  const rolePermissions = PERMISSIONS[role];

  if (!rolePermissions) return false;
  if (!rolePermissions[resource]) return false;

  return rolePermissions[resource].includes(action);
}

/**
 * Kiểm tra người dùng là chủ sở hữu tài nguyên hoặc là Manager/Admin
 * SALES_REP chỉ được truy cập tài nguyên của chính mình
 * @param {object} session - Session của NextAuth
 * @param {string} resourceOwnerId - ID của chủ sở hữu tài nguyên
 * @returns {boolean} true nếu là chủ sở hữu hoặc Manager/Admin
 */
export function isOwnerOrManager(session, resourceOwnerId) {
  if (!session?.user) return false;

  const { role, id } = session.user;

  // Admin, Manager và Tech Staff có thể truy cập tất cả tài nguyên tương ứng
  if (role === 'ADMIN' || role === 'SALES_MANAGER' || role === 'TECH_STAFF') {
    return true;
  }

  // SALES_REP chỉ được truy cập tài nguyên của chính mình
  return id === resourceOwnerId;
}

/**
 * HOC bọc API handler với kiểm tra xác thực và phân quyền
 * Tự động trả về 401 nếu chưa đăng nhập, 403 nếu không đủ quyền
 * @param {Function} handler - Hàm xử lý API route (req, session) => Response
 * @param {string} resource - Tên tài nguyên cần kiểm tra quyền
 * @param {string} action - Hành động cần kiểm tra quyền
 * @returns {Function} Hàm xử lý API đã được bọc
 */
export function withAuth(handler, resource, action) {
  return async (req, context) => {
    try {
      // Kiểm tra đăng nhập
      const session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json(
          { error: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.' },
          { status: 401 }
        );
      }

      // Kiểm tra quyền truy cập (nếu có resource và action)
      if (resource && action) {
        const hasPermission = checkPermission(session, resource, action);

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Bạn không có quyền thực hiện hành động này.' },
            { status: 403 }
          );
        }
      }

      // Gọi handler với session đã xác thực
      return await handler(req, session, context);
    } catch (error) {
      console.error('[RBAC] Lỗi xác thực:', error);
      return NextResponse.json(
        { error: 'Đã xảy ra lỗi khi xác thực. Vui lòng thử lại.' },
        { status: 500 }
      );
    }
  };
}
