import React from 'react';
import './App.css'; // Assuming About.js will use similar styling

function About() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Bu Proje Ne İşe Yarar?</h1>
      </header>
      <div className="container">
        <div className="about-content">
          <h2>Projenin Amacı</h2>
          <p>
            Bu proje, Türkiye genelindeki tarımsal verileri kullanarak il bazında
            toprak, yağış ve sıcaklık verilerine dayalı olarak en uygun tarım
            ürününü tahmin eden bir uygulamadır. Amacı, çiftçilere ve tarımla
            ilgilenen diğer paydaşlara bilinçli karar verme süreçlerinde yardımcı olmaktır.
          </p>

          <h2>Ana Bileşenler</h2>
          <p>Proje aşağıdaki temel teknolojileri ve bileşenleri kullanmaktadır:</p>
          <ul>
            <li><strong>React:</strong> Kullanıcı arayüzünü oluşturmak için modern ve bileşen tabanlı bir JavaScript kütüphanesi.</li>
            <li><strong>Flask:</strong> Makine öğrenimi modelini ve veri işleme mantığını barındıran hafif bir Python web çatısı.</li>
            <li><strong>Hadoop:</strong> Büyük ölçekli tarımsal verilerin depolanması ve dağıtık işlenmesi için kullanılan bir çerçeve.</li>
            <li><strong>Spark:</strong> Veri işleme ve makine öğrenimi modelini eğitmek için hızlı ve genel amaçlı bir küme hesaplama sistemi.</li>
            <li><strong>Docker:</strong> Uygulamanın farklı bileşenlerini (frontend, backend, Hadoop, Spark) izole edilmiş ortamlarda paketlemek ve dağıtmak için kullanılan konteynerleştirme platformu.</li>
            <li><strong>PostgreSQL:</strong> Uygulamanın yapısal verilerini (il bilgileri, kullanıcı verileri vb.) depolamak için kullanılan ilişkisel veritabanı sistemi.</li>
            <li><strong>Leaflet & React-Leaflet:</strong> Türkiye haritasını interaktif bir şekilde görüntülemek ve il bazında verileri harita üzerinde sunmak için kullanılan kütüphaneler.</li>
          </ul>

          <h2>Kullanıcılara Faydaları</h2>
          <p>Bu uygulama kullanıcılara aşağıdaki faydaları sağlar:</p>
          <ul>
            <li>İnteraktif harita üzerinden Türkiye'deki illerin tarımsal ve hava durumu verilerine kolay erişim.</li>
            <li>Belirli bir il için mevcut koşullara göre en uygun tarım ürünü önerisi.</li>
            <li>Manuel olarak girilen toprak pH'ı, yağış miktarı ve sıcaklık değerlerine göre ürün tahmini yapabilme.</li>
            <li>Tarımsal planlama ve karar alma süreçlerinde bilimsel verilere dayalı destek.</li>
            <li>Sistem durumu hakkında bilgi edinme (API ve Hadoop bağlantı durumu).</li>
          </ul>
          <p>
            Proje, büyük veri işleme yeteneklerini makine öğrenimi ile birleştirerek tarım sektöründe verimliliği artırmayı ve daha sürdürülebilir tarım uygulamalarını teşvik etmeyi hedefler.
          </p>
        </div>
      </div>
      <footer className="App-footer">
        <p>Hadoop, Spark, Flask & React ile Tarım Tahmin © 2025</p>
      </footer>
    </div>
  );
}

export default About;