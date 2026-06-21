@echo off
chcp 65001 >nul
echo ==============================================
echo KHỞI ĐỘNG HỆ THỐNG DAFA SALES MANAGER
echo ==============================================
echo.
echo Đang kiểm tra và cập nhật Database (Prisma Client)...
call npx prisma generate

echo.
echo Đang khởi động Server Next.js...
echo Vui lòng đợi trong giây lát... Hệ thống sẽ tự động mở trang web.
echo ----------------------------------------------

start http://localhost:3002
npm run dev

pause
