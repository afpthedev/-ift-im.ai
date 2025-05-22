@echo off
REM ==============================================
REM Tarım Tahmin Projesi - Klasör Yapısı Kontrolü
REM ==============================================

echo Tarım Tahmin Projesi - Klasör Yapısı Kontrolü
echo ===============================================

REM --- Ana dizinleri kontrol et ve oluştur ---
for %%D in (
    "data\raw"
    "data\processed"
    "data\models"
    "backend"
    "frontend\src"
    "frontend\public"
    "hadoop\config"
    "hadoop\data\namenode"
    "hadoop\data\datanode"
    "hadoop\scripts"
    "spark"
    "docs"
) do (
    if not exist %%~D (
        echo Oluşturuluyor: %%~D
        mkdir %%~D
    ) else (
        echo Mevcut: %%~D
    )
)

REM --- Gerekli dosyaların varlığını kontrol et ---
echo.
echo Dosya kontrolü:
for %%F in (
    "docker-compose.yml"
    "hadoop\config\core-site.xml"
    "hadoop\config\hdfs-site.xml"
    "hadoop\config\hadoop-env.sh"
    "hadoop\hadoop.env"
    "hadoop\scripts\load_data_to_hdfs.sh"
    "backend\app.py"
    "backend\requirements.txt"
    "backend\Dockerfile"
    "frontend\src\App.js"
    "frontend\src\index.js"
    "frontend\src\index.css"
    "frontend\Dockerfile"
    "frontend\package.json"
    "data\raw\fake_agricultural_data.csv"
    "spark\spark_ml_pipeline.py"
) do (
    if exist %%~F (
        echo Mevcut: %%~F
    ) else (
        echo Eksik: %%~F
    )
)

echo.
echo Klasör yapısı kontrolü tamamlandı.
pause
