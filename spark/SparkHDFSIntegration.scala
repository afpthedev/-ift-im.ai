import org.apache.spark.sql.SparkSession

object SparkHDFSIntegration {
  def main(args: Array[String]): Unit = {
    // Spark oturumu oluştur ve Hadoop ile entegre et
    val spark = SparkSession.builder()
      .appName("Tarım Tahmin - Spark HDFS Entegrasyonu")
      .master("spark://spark-master:7077")
      .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000")
      .getOrCreate()

    // HDFS'ten veri oku
    val agricultureData = spark.read
      .option("header", "true")
      .option("inferSchema", "true")
      .csv("hdfs://namenode:9000/user/hadoop/agri_predict/raw/fake_agricultural_data.csv")

    // Veriyi göster
    println("Tarım Verileri:")
    agricultureData.show()

    // Basit bir analiz yap
    println("İllere Göre Ortalama Toprak pH Değerleri:")
    agricultureData.groupBy("province_name")
      .avg("soil_ph")
      .orderBy("province_name")
      .show()

    // İşlenmiş veriyi HDFS'e yaz
    agricultureData.write
      .mode("overwrite")
      .parquet("hdfs://namenode:9000/user/hadoop/agri_predict/processed/agriculture_data.parquet")

    println("İşlem tamamlandı. Veriler HDFS'e yazıldı.")

    // Spark oturumunu kapat
    spark.stop()
  }
}
