import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Cấu hình tài khoản Cloudflare R2
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'e80f38e8c23873a00f3fbd1c469c15d6'
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '099b1a447ce1713a1e54f6cf5c9360e5'
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'ee98fee50489cd6036c7276ae60630a6e34f401172c6d960608c7505812ada63'
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'dafaglass'
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

// POST: Upload ảnh lên Cloudflare R2
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'Vui lòng chọn file hình ảnh' }, { status: 400 })
    }

    // Lấy tên file và tạo đường dẫn lưu trong R2
    const ext = file.name.split('.').pop() || 'jpg'
    const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
    const fileName = `trip_reports/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    )

    // Nếu cấu hình tên miền Public URL thì hiển thị trực tiếp từ CDN, ngược lại gọi qua API phát stream nội bộ
    let url = ''
    if (PUBLIC_URL) {
      url = `${PUBLIC_URL.replace(/\/$/, '')}/${fileName}`
    } else {
      url = `/api/upload?key=${encodeURIComponent(fileName)}`
    }

    return NextResponse.json({
      success: true,
      message: 'Tải ảnh lên Cloudflare R2 thành công',
      url,
      data: { url }
    })
  } catch (error: any) {
    console.error('Cloudflare R2 Upload Error:', error)
    return NextResponse.json({ 
      message: error?.message || 'Lỗi tải ảnh lên Cloudflare R2'
    }, { status: 500 })
  }
}

// GET: Phát luồng hiển thị file ảnh trực tiếp từ Cloudflare R2 về trình duyệt
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ message: 'Thiếu mã định danh file (key)' }, { status: 400 })
  }

  try {
    const data = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    )

    if (!data.Body) {
      return new NextResponse('File không tồn tại trên hệ thống R2', { status: 404 })
    }

    const bytes = await data.Body.transformToByteArray()
    const buffer = Buffer.from(bytes)
    const contentType = data.ContentType || 'image/jpeg'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache 1 năm trên thiết bị người dùng
      },
    })
  } catch (error: any) {
    console.error('Cloudflare R2 GetObject Error:', error)
    return new NextResponse('Không tìm thấy file hình ảnh trong Bucket R2', { status: 404 })
  }
}
