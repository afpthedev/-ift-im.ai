@echo off
rem Tarım Tahmin API Testi
echo =====================================
echo Tarım Tahmin API Testi
echo =====================================
echo.

rem API sağlık kontrolü yapılıyor...
echo API sağlık kontrolü yapılıyor...
curl -s http://localhost:5000/api/health
echo.
echo.

rem Tahmin API'si test ediliyor...
echo Tahmin API'si test ediliyor...
echo Örnek veri gönderiliyor: {"soil_ph": 7.0, "rainfall_mm": 500, "temperature_celsius": 15.0}
echo.

rem Tahmin API'sine istek gönder
curl -s -X POST ^
  -H "Content-Type: application/json" ^
  -d "{\"soil_ph\":7.0,\"rainfall_mm\":500,\"temperature_celsius\":15.0}" ^
  http://localhost:5000/api/predict
echo.
echo.

echo Test tamamlandı.
echo Eğer yukarıda bir tahmin sonucu görüyorsanız, API başarıyla çalışıyor demektir.
pause
