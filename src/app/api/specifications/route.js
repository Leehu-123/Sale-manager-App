import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/rbac';

// GET /api/specifications
async function getHandler(req, session) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    const where = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const specs = await prisma.dealSpecification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(specs);
  } catch (error) {
    console.error('Lỗi khi lấy thông số kỹ thuật:', error);
    return NextResponse.json({ error: 'Không thể lấy thông số kỹ thuật' }, { status: 500 });
  }
}

// POST /api/specifications
async function postHandler(req, session) {
  try {
    const body = await req.json();
    const { projectId, description, area, glassColor, glassThickness, hardware, installationType } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Dự án (projectId) là bắt buộc' }, { status: 400 });
    }

    const spec = await prisma.dealSpecification.create({
      data: {
        projectId,
        description,
        area,
        glassColor,
        glassThickness,
        hardware,
        installationType
      },
    });

    return NextResponse.json(spec, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo thông số kỹ thuật:', error);
    return NextResponse.json({ error: 'Không thể tạo thông số kỹ thuật' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, 'specifications', 'view');
export const POST = withAuth(postHandler, 'specifications', 'create');
