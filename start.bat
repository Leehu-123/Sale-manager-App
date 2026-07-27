@echo off
chcp 65001 >nul
echo ==============================================
echo KHỞI ĐỘNG HỆ THỐNG DAFA SALES MANAGER
echo ==============================================
echo.

echo [1] Đang kết nối tới Database qua VPS Tunnel...
set SSH_ASKPASS=D:\Antigrapvity\.ssh_pass.cmd
set SSH_ASKPASS_REQUIRE=force
set DISPLAY=none
start "DAFA Database Tunnel" cmd /c "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -N -L 5432:127.0.0.1:5432 root@103.176.178.81"

echo.
echo [2] Đang khởi động Server Next.js...
echo Vui lòng đợi trong giây lát... Hệ thống sẽ tự động mở trang web.
echo ----------------------------------------------

start http://localhost:3002
npm run dev

pause
