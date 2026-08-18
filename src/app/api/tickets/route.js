import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// GET /api/tickets
async function getHandler(req, session) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    const where = {};
    if (projectId) {
      where.projectId = projectId;
    }

    if (session.user.role === 'SALES_REP') {
      where.createdById = session.user.id;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        project: true,
        createdBy: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ticket:', error);
    return NextResponse.json({ error: 'Không thể lấy danh sách ticket' }, { status: 500 });
  }
}

// POST /api/tickets
async function postHandler(req, session) {
  try {
    const body = await req.json();
    const { projectId, errorType, responsibility, resolution, description, assignedToId } = body;

    if (!projectId || !errorType || !responsibility || !resolution) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc để tạo ticket' }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        projectId,
        errorType,
        responsibility,
        resolution,
        description,
        createdById: session.user.id,
        assignedToId,
        status: 'OPEN'
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo ticket:', error);
    return NextResponse.json({ error: 'Không thể tạo ticket' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, 'tickets', 'view');
export const POST = withAuth(postHandler, 'tickets', 'create');
