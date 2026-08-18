import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// GET /api/projects
async function getHandler(req, session) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  
  const where = {};
  if (status) {
    where.status = status;
  }

  // Filter based on role
  if (session.user.role === 'SALES_REP') {
    where.assignedToId = session.user.id;
  }

  try {
    const projects = await prisma.project.findMany({
      where,
      include: {
        customer: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách dự án:', error);
    return NextResponse.json({ error: 'Không thể lấy danh sách dự án' }, { status: 500 });
  }
}

// POST /api/projects
async function postHandler(req, session) {
  try {
    const body = await req.json();
    const { name, customerId, assignedToId } = body;

    if (!name || !customerId) {
      return NextResponse.json({ error: 'Tên dự án và Khách hàng là bắt buộc' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        customerId,
        assignedToId: assignedToId || session.user.id,
        status: 'NEW',
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo dự án:', error);
    return NextResponse.json({ error: 'Không thể tạo dự án' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, 'projects', 'view');
export const POST = withAuth(postHandler, 'projects', 'create');
