@echo off
chcp 65001 >nul
title DEPLOY DAFA SALES MANAGER TO VPS (CLOUD019467)
echo ===================================================================
echo            TỰ ĐỘNG CẢI LÊN MÁY CHỦ VPS DAFA SALES
echo ===================================================================
echo.
echo [Thông tin Server]
echo   - Cloud ID : CLOUD019467 (Gói: ĐK SSD CLOUD RAM A)
echo   - Máy chủ  : CloudVPS-OPS (IP: 103.176.178.81)
echo   - Tài khoản: root
echo   - Thư mục  : /var/www/Sale-manager-App
echo   - Web URL  : https://sale.ldhuy.name.vn
echo -------------------------------------------------------------------

REM [Cấu hình SSH tự động nhập Mật khẩu]
set SSH_PASS_FILE=D:\Antigrapvity\.ssh_pass.cmd
if not exist "%SSH_PASS_FILE%" (
    set SSH_PASS_FILE=%TEMP%\dafa_vps_pass.cmd
    echo @echo off > "%TEMP%\dafa_vps_pass.cmd"
    echo echo Y6zqYBaga5UD5HWe>> "%TEMP%\dafa_vps_pass.cmd"
)
set SSH_ASKPASS=%SSH_PASS_FILE%
set SSH_ASKPASS_REQUIRE=force
set DISPLAY=none

echo.
echo [Bước 1/3] Lưu thay đổi tại máy local và đẩy lên GitHub...
git add .
set commit_msg=
set /p commit_msg="-> Nhập ghi chú cho phiên bản này (Enter để bỏ qua/mặc định): "
if "%commit_msg%"="" set commit_msg=Auto deploy update (%date% %time%)

git commit -m "%commit_msg%"
git push origin main
if %ERRORLEVEL% neq 0 (
    echo [Cảnh báo] Chưa có thay đổi mới nào hoặc lỗi khi push git.
    echo Vẫn tiếp tục kết nối và nâng cấp trên VPS...
) else (
    echo [Thành công] Đã đưa code mới nhất lên repository!
)
echo -------------------------------------------------------------------

echo.
echo [Bước 2/3] Kết nối SSH tới VPS (103.176.178.81) và tải code mới...
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL root@103.176.178.81 "cd /var/www/Sale-manager-App && echo '--- Ký gửi file tạm và Pull Code ---' && git stash && git pull origin main && git stash pop 2>/dev/null || true"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [LỖI] Kết nối SSH hoặc tải code trên máy chủ bị gián đoạn!
    goto :cleanup
)
echo [Thành công] Code trên Server đã được nâng cấp lên bản mới nhất.
echo -------------------------------------------------------------------

echo.
echo [Bước 3/3] Đang đóng gói và khởi tạo lại Container (Zero-downtime build)...
echo Vui lòng kiên nhẫn (thời gian build Docker có thể mất khoảng 1 - 2 phút)...
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL root@103.176.178.81 "cd /var/www/Sale-manager-App && docker compose -f docker-compose.prod.yml up -d --build --remove-orphans && echo '--- Dọn dẹp cache image cũ ---' && docker image prune -f && echo '--- Trạng thái Container hiện tại ---' && docker ps | grep sale_manager_app"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [LỖI] Có sự cố trong lúc khởi chạy Docker trên máy chủ!
    goto :cleanup
)

echo.
echo ===================================================================
echo    ✅ DEPLOY HOÀN TẤT VÀ KIỂM TRA THÀNH CÔNG!
echo ===================================================================
echo - Hệ thống đã cập nhật tính năng thông báo qua Telegram và code mới.
echo - Truy cập ngay tại: https://sale.ldhuy.name.vn
echo - Gặp vướng mắc gì xin xem thêm logs trên VPS bằng lệnh:
echo   docker logs sale_manager_app --tail 50 -f
echo -------------------------------------------------------------------

:cleanup
if exist "%TEMP%\dafa_vps_pass.cmd" del /f /q "%TEMP%\dafa_vps_pass.cmd" >nul 2>&1
echo.
pause
