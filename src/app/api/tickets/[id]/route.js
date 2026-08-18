import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, isOwnerOrManager } from '@/lib/rbac';
import { triggerWebhook } from '@/lib/webhook';

async function getHandler(req, session, context) {
  try {
    const params = await context.params;
    const { id } = params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        project: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Không tìm thấy ticket' }, { status: 404 });
    }

    if (!isOwnerOrManager(session, ticket.createdById) && session.user.id !== ticket.assignedToId) {
      return NextResponse.json({ error: 'Bạn không có quyền truy cập ticket này' }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết ticket:', error);
    return NextResponse.json({ error: 'Không thể lấy thông tin ticket' }, { status: 500 });
  }
}

async function patchHandler(req, session, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const { status, resolution, assignedToId, description } = body;

    const existingTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) {
      return NextResponse.json({ error: 'Không tìm thấy ticket' }, { status: 404 });
    }

    if (!isOwnerOrManager(session, existingTicket.createdById) && session.user.id !== existingTicket.assignedToId) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa ticket này' }, { status: 403 });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(resolution && { resolution }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(description !== undefined && { description }),
      },
      include: {
        project: true
      }
    });

    // Nếu resolution=REWORK và status=APPROVED -> gọi webhook
    const newResolution = resolution || existingTicket.resolution;
    const newStatus = status || existingTicket.status;

    if (newResolution === 'REWORK' && newStatus === 'APPROVED' && existingTicket.status !== 'APPROVED') {
      await triggerWebhook('ticket.rework_approved', {
        ticketId: updatedTicket.id,
        projectId: updatedTicket.projectId,
        projectName: updatedTicket.project?.name,
        errorType: updatedTicket.errorType,
        description: updatedTicket.description
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Lỗi khi cập nhật ticket:', error);
    return NextResponse.json({ error: 'Không thể cập nhật ticket' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, 'tickets', 'view');
export const PATCH = withAuth(patchHandler, 'tickets', 'edit');
