import prisma from '@/lib/prisma';

/**
 * Kiểm tra hạn mức tín dụng của khách hàng
 * @param {String} customerId - ID khách hàng
 * @param {Number} newAmount - Số tiền phát sinh mới (từ dự án hoặc báo giá)
 * @returns {Object} - { canProceed, remainingCredit, warnings, totalDebt }
 */
export async function checkCredit(customerId, newAmount = 0) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      projects: {
        include: {
          milestones: {
            where: { isPaid: false }
          }
        }
      }
    }
  });

  if (!customer) {
    throw new Error('Không tìm thấy khách hàng');
  }

  const { creditLimit } = customer;

  // Tính tổng nợ từ các milestone chưa thanh toán
  let totalDebt = 0;
  let overdueCount = 0;
  const now = new Date();

  customer.projects.forEach(project => {
    project.milestones.forEach(ms => {
      totalDebt += ms.amount || 0;
      if (ms.dueDate && new Date(ms.dueDate) < now) {
        overdueCount++;
      }
    });
  });

  const proposedTotalDebt = totalDebt + newAmount;
  const canProceed = proposedTotalDebt <= creditLimit;
  const remainingCredit = creditLimit - totalDebt;

  const warnings = [];
  if (!canProceed) {
    warnings.push(`Vượt quá hạn mức tín dụng. Hạn mức còn lại: ${remainingCredit.toLocaleString('vi-VN')} đ`);
  }

  if (overdueCount > 0) {
    warnings.push(`Khách hàng đang có ${overdueCount} khoản thanh toán quá hạn.`);
  }

  return {
    canProceed,
    remainingCredit,
    totalDebt,
    warnings
  };
}
