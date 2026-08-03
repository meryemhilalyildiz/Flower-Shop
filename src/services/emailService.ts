// src/services/emailService.ts

export interface EmailOrderDetails {
    customerName: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    trackingNumber?: string;
    cargoCompany?: string;
    cancelReason?: string;
  }
  
  export interface OrderEmailData {
    toEmail: string;
    recipientName: string;
    orderId: string;
    cancelReason: string;
    totalAmount: number;
    type: 'USER_REQUESTED' | 'ADMIN_APPROVED'; // 🌸 Mailin türü (Talep mi iletildi yoksa Admin onayladı mı)
  }
  
  /**
   * Genel Sipariş Durumu Güncelleme HTML Şablonu
   */
  export const generateOrderEmailHtml = (details: EmailOrderDetails) => {
    const storeName = "A şirketi";

    let emailSubject = `${storeName} - Siparişiniz Hakkında Güzel Haberler!`;
    let statusTitle = "Siparişinizle İlgili Güncellemeler";
    let statusMessage = `Sevgili ${details.customerName}, ${storeName} mağazasından verdiğiniz siparişinizle ilgili size güzel haberlerimiz var! 🌸`;
    let statusDetail = `Siparişinizle ilgili tüm gelişmeleri buradan takip edebilirsiniz.`;
  
    const normalizedStatus = (details.status || '').toLowerCase();
  
    if (['shipped', 'kargoda', 'kargoya verildi'].includes(normalizedStatus)) {
      emailSubject = `Çiçekleriniz Yolda! - ${storeName}`;
      statusTitle = "Siparişiniz Kargoya Verildi";
      statusMessage = `Sevgili ${details.customerName}, harika çiçekleriniz hazırlanıp kargoya verildi! Yakında sizde olacaklar 🌸`;
      statusDetail = `Siparişiniz özenle paketlenmiş ve yola çıkmış durumda. Keyifli alımlar! 💐`;
    } else if (['in_transit', 'yolda', 'yola çıktı'].includes(normalizedStatus)) {
      emailSubject = `Çiçekleriniz Yakında Sizde! - ${storeName}`;
      statusTitle = "Siparişiniz Yola Çıktı";
      statusMessage = `Sevgili ${details.customerName}, ${storeName} mağazasındaki siparişiniz kuryemiz tarafından teslim edilmek üzere yola çıktı. Çiçekleriniz yakında sizde! 🌸`;
      statusDetail = `Siparişiniz özel kuryemiz ile özenle taşınmaktadır. Yakında güzel bir sürprizle karşılaşacaksınız! 💐`;
    } else if (['cancellation_requested', 'iptal talebi alındı'].includes(normalizedStatus)) {
      emailSubject = `İptal Talebiniz Alındı - ${storeName}`;
      statusTitle = "İptal Talebiniz Şirkete İletilmiştir";
      statusMessage = `Sevgili ${details.customerName}, #${details.orderNumber} numaralı siparişiniz için oluşturduğunuz iptal talebiniz bize ulaştı. En kısa sürede değerlendireceğiz.`;
      statusDetail = details.cancelReason
        ? `<strong>İptal Talebi Gerekçesi:</strong> "${details.cancelReason}"`
        : 'Talebiniz en kısa sürede değerlendirilip tarafınıza bilgilendirme yapılacaktır.';
    } else if (['cancelled', 'iptal edildi', 'iptal'].includes(normalizedStatus)) {
      emailSubject = `Sipariş İptal İşlemi - ${storeName}`;
      statusTitle = "Sipariş İptal Edildi";
      statusMessage = `Sevgili ${details.customerName}, siparişiniz iptal edilmiştir. Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.`;

      // 🌸 İptal gerekçesi varsa doğrudan Status Box alt yazısına yazıyoruz
      if (details.cancelReason) {
        statusDetail = `<strong>İptal Gerekçesi:</strong> "${details.cancelReason}"`;
      } else {
        statusDetail = `Başka bir fırsatta tekrar görüşmek dileğiyle 🌸`;
      }
    } else if (['processing', 'işleniyor', 'hazırlanıyor'].includes(normalizedStatus)) {
      emailSubject = `Çiçekleriniz Hazırlanıyor! - ${storeName}`;
      statusTitle = "Siparişiniz Hazırlanıyor";
      statusMessage = `Sevgili ${details.customerName}, sipariş ettiğiniz güzel çiçekleri özenle hazırlıyoruz. En kısa sürede yola çıkaracaklar 🌸`;
      statusDetail = `Çiçekleriniz taze ve canlı olarak size ulaşmak için hazırlanıyor. Sabırsızlıkla bekliyoruz! 💐`;
    }
  
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        
        <!-- Banner Header -->
        <div style="background-color: #be185d; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">${storeName} 🌸</h1>
        </div>
  
        <!-- Main Body -->
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">Merhaba <strong>${details.customerName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">${statusMessage}</p>
  
          <!-- Status Box (Gerekçenin Yazılacağı Pembe Vurgulu Kutu) -->
          <div style="background-color: #fdf2f8; border-left: 4px solid #be185d; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <h3 style="margin: 0 0 6px 0; color: #be185d; font-size: 16px;">${statusTitle}</h3>
            <p style="margin: 0; font-size: 14px; color: #831843;">${statusDetail}</p>
          </div>
  
          <!-- Order Info Table -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #f3f4f6; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Mağaza:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${storeName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Sipariş Numarası:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">#${details.orderNumber}</td>
              </tr>
              ${details.trackingNumber ? `
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Kargo Takip No:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #be185d; text-align: right;">
                  <span style="background-color: #fce7f3; padding: 3px 8px; border-radius: 4px;">${details.trackingNumber}</span>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Toplam Tutar:</td>
                <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #111827;">₺${Number(details.totalAmount).toFixed(2)}</td>
              </tr>
            </table>
          </div>
  
          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-bottom: 0;">
            ${storeName} olarak bizi tercih ettiğiniz için teşekkür eder, renkli günler dileriz! 💐
          </p>
        </div>
      </div>
    `;
  
    return { emailSubject, html };
  };
  
  /**
   * 🌸 İptal Durumuna Göre Özelleştirilmiş E-Posta Gönderir
   */
  export const sendCancellationStatusEmail = async ({
    toEmail,
    recipientName,
    orderId,
    cancelReason,
    totalAmount,
    type
  }: OrderEmailData) => {
    try {
      const isUserRequest = type === 'USER_REQUESTED';
  
      const subject = isUserRequest
        ? `Sipariş İptal Talebiniz Alındı (#${orderId})`
        : `Siparişiniz İptal Edilmiştir (#${orderId})`;
  
      const titleText = isUserRequest
        ? 'İptal Talebiniz Şirkete İletilmiştir'
        : 'Sipariş İptal İşleminiz Onaylandı';
  
      const descriptionText = isUserRequest
        ? `<strong>#${orderId}</strong> numaralı siparişiniz için oluşturduğunuz iptal talebi şirketimize ulaşmıştır. İncelemelerin ardından tarafınıza dönüş yapılacaktır.`
        : `<strong>#${orderId}</strong> numaralı siparişinizin iptal işlemi yetkili ekibimiz tarafından onaylanmış ve gerçekleştirilmiştir.`;
  
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #db2777; margin: 0;">🌸 Çiçekçi</h1>
            <p style="color: #6b7280; font-size: 14px;">${titleText}</p>
          </div>
  
          <p style="font-size: 16px; color: #374151;">Sayın <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            ${descriptionText}
          </p>
  
          <!-- 🌸 İPTAL NEDENİ KUTUSU -->
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase;">İptal Nedeni / Gerekçesi:</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #7f1d1d; font-style: italic;">
              "${cancelReason || 'Nedeni belirtilmedi'}"
            </p>
          </div>
  
          <div style="background-color: #f9fafb; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #374151;">
              <strong>Sipariş Tutarı:</strong> <span style="color: #db2777; font-weight: bold;">₺${Number(totalAmount).toFixed(2)}</span>
            </p>
          </div>
  
          <p style="font-size: 13px; color: #6b7280; line-height: 1.4;">
            ${
              isUserRequest
                ? 'Talebiniz en kısa sürede değerlendirilip mail ve WhatsApp üzerinden bilgilendirme yapılacaktır.'
                : 'Ücret iadeniz ödeme yönteminize bağlı olarak 1-3 iş günü içerisinde bankanız tarafından hesabınıza yansıtılacaktır.'
            }
          </p>
  
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
          
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin: 0;">
            Çiçekçi © 2026 — Taze Çiçekler & Buketler
          </p>
        </div>
      `;
  
      // Supabase edge function üzerinden e-posta gönderimi
      await fetch('https://ftsmqcgzpzjcebrdhysw.supabase.co/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: subject,
          html: htmlContent,
        }),
      });
    } catch (error) {
      console.error('İptal e-postası gönderilirken hata oluştu:', error);
    }
  };