#!/bin/bash

# Bu script, Docker Compose ile tüm servisleri başlatır ve test eder

echo "Tarım Tahmin Projesi - Uçtan Uca Test"
echo "===================================="

# Docker Compose ile servisleri başlat
echo "Docker Compose ile servisleri başlatılıyor..."
docker-compose up -d

# Servislerin başlamasını bekle
echo "Servislerin başlaması bekleniyor (30 saniye)..."
sleep 30

# Hadoop NameNode UI'a erişim testi
echo "Hadoop NameNode UI erişim testi yapılıyor..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:9870 | grep 200 > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Hadoop NameNode UI erişilebilir"
else
  echo "❌ Hadoop NameNode UI erişilemiyor"
fi

# Spark Master UI'a erişim testi
echo "Spark Master UI erişim testi yapılıyor..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep 200 > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Spark Master UI erişilebilir"
else
  echo "❌ Spark Master UI erişilemiyor"
fi

# Flask API sağlık kontrolü
echo "Flask API sağlık kontrolü yapılıyor..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health | grep 200 > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Flask API çalışıyor"
else
  echo "❌ Flask API çalışmıyor"
fi

# React Frontend erişim testi
echo "React Frontend erişim testi yapılıyor..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep 200 > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ React Frontend erişilebilir"
else
  echo "❌ React Frontend erişilemiyor"
fi

echo ""
echo "Test sonuçları:"
echo "---------------"
echo "Tüm servisler başarıyla çalışıyorsa, aşağıdaki URL'leri tarayıcınızda açabilirsiniz:"
echo "- React Frontend: http://localhost:3000"
echo "- Flask API: http://localhost:5000/api/health"
echo "- Hadoop NameNode UI: http://localhost:9870"
echo "- Spark Master UI: http://localhost:8080"
echo ""
echo "Not: Servislerin tam olarak başlaması birkaç dakika sürebilir."
echo "Herhangi bir sorun yaşarsanız, docker-compose logs komutu ile logları kontrol edebilirsiniz."
