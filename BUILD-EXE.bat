@echo off
chcp 65001 >nul
title Geometry Dash - сборка EXE
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Не найден Node.js. Установи LTS: https://nodejs.org
  pause
  exit /b 1
)
echo Установка зависимостей (при первом запуске может занять несколько минут)...
call npm install
if errorlevel 1 goto fail
echo Сборка игры...
call npm run build
if errorlevel 1 goto fail
echo Создание установщика Windows...
call npx electron-builder --win nsis
if errorlevel 1 goto fail
echo.
echo ГОТОВО! Установщик находится в папке release.
pause
exit /b 0
:fail
echo.
echo Сборка завершилась с ошибкой. Проверь интернет и сообщение выше.
pause
exit /b 1
