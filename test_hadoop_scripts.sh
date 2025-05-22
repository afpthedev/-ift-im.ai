#!/bin/bash

# Bu script, Hadoop scriptlerinin konteynerde erişilebilirliğini test eder

echo "Hadoop Script Erişim Testi"
echo "=========================="

# Namenode konteynerinde script dizinini kontrol et
echo "Namenode konteynerinde script dizinini kontrol ediliyor..."
docker exec -it namenode ls -la /hadoop/scripts

# Script dosyasının çalıştırılabilir olduğunu kontrol et
echo "Script dosyasının izinlerini kontrol ediliyor..."
docker exec -it namenode ls -la /hadoop/scripts/load_data_to_hdfs.sh

# Script dosyasını çalıştır
echo "Script dosyası çalıştırılıyor..."
docker exec -it namenode bash -c "chmod +x /hadoop/scripts/load_data_to_hdfs.sh && /hadoop/scripts/load_data_to_hdfs.sh"

# HDFS'te dosyaların varlığını kontrol et
echo "HDFS'te dosyaların varlığı kontrol ediliyor..."
docker exec -it namenode hdfs dfs -ls /user/hadoop/agri_predict/raw/

echo ""
echo "Test tamamlandı."
echo "Eğer tüm adımlar başarılı olduysa, Hadoop scriptleri doğru şekilde mount edilmiş ve çalıştırılabilir demektir."
