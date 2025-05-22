#!/bin/bash

# Bu script, HDFS'e veri yüklemek için kullanılır

# HDFS'in hazır olmasını bekle
echo "HDFS'in hazır olması bekleniyor..."
sleep 10

# HDFS'te dizin yapısını oluştur
echo "HDFS'te dizin yapısı oluşturuluyor..."
hdfs dfs -mkdir -p /user/hadoop/agri_predict/raw
hdfs dfs -mkdir -p /user/hadoop/agri_predict/processed
hdfs dfs -mkdir -p /user/hadoop/agri_predict/models

# Yerel CSV dosyasını HDFS'e yükle
echo "Tarım verileri HDFS'e yükleniyor..."
hdfs dfs -put /opt/bitnami/spark/data/raw/fake_agricultural_data.csv /user/hadoop/agri_predict/raw/

echo "Veri yükleme işlemi tamamlandı."
