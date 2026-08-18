import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, isOwnerOrManager } from '@/lib/rbac';
import { checkCredit } from '@/lib/credit-check';

async function getHandler(req, session, context) {
  try {
    const params = await context.params;
    const { id } = params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: true,
        dealSpecification: true,
        quotes: true,
        milestones: true,
        tickets: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    if (!isOwnerOrManager(session, project.assignedToId)) {
      return NextResponse.json({ error: 'Bạn không có quyền truy cập dự án này' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết dự án:', error);
    return NextResponse.json({ error: 'Không thể lấy thông tin dự án' }, { status: 500 });
  }
}

async function patchHandler(req, session, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const { status, name, assignedToId } = body;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    if (!isOwnerOrManager(session, existingProject.assignedToId)) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa dự án này' }, { status: 403 });
    }

    // Xử lý logic workflow theo trạng thái mới
    if (status && status !== existingProject.status) {
      // Nếu chuyển sang SURVEYING -> Thông báo cho Tech Staff
      if (status === 'SURVEYING') {
        const techStaffs = await prisma.user.findMany({ where: { role: 'TECH_STAFF' } });
        if (techStaffs.length > 0) {
          const notifications = techStaffs.map(staff => ({
            userId: staff.id,
            message: `Dự án mới cần khảo sát: ${existingProject.name}`,
          }));
          await prisma.notification.createMany({ data: notifications });
        }
      }

      // Nếu chuyển sang WON -> Kiểm tra credit
      if (status === 'WON') {
        // Giả sử lấy giá trị báo giá đã duyệt làm newAmount (để kiểm tra tín dụng thêm)
        // Nếu không có báo giá, coi như 0.
        const approvedQuote = await prisma.quoteVersion.findFirst({
          where: { projectId: id, status: 'APPROVED' }
        });
        const newAmount = approvedQuote?.totalAmount || 0;
        
        const creditStatus = await checkCredit(existingProject.customerId, newAmount);
        if (!creditStatus.canProceed) {
          return NextResponse.json({ 
            error: 'Không thể chuyển trạng thái WON. Khách hàng vượt quá hạn mức tín dụng.', 
            warnings: creditStatus.warnings 
          }, { status: 400 });
        }
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(assignedToId && { assignedToId }),
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Lỗi khi cập nhật dự án:', error);
    return NextResponse.json({ error: 'Không thể cập nhật dự án' }, { status: 500 });
  }
}

async function deleteHandler(req, session, context) {
  try {
    const params = await context.params;
    const { id } = params;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    if (!isOwnerOrManager(session, existingProject.assignedToId)) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa dự án này' }, { status: 403 });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi khi xóa dự án:', error);
    return NextResponse.json({ error: 'Không thể xóa dự án' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, 'projects', 'view');
export const PATCH = withAuth(patchHandler, 'projects', 'edit');
export const DELETE = withAuth(deleteHandler, 'projects', 'delete');
