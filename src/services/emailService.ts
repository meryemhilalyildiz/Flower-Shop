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
  
  export const generateOrderEmailHtml = (details: EmailOrderDetails) => {
    const storeName = "A şirketi";
  
    let emailSubject = `${storeName} - Sipariş Güncellemesi`;
    let statusTitle = "Siparişiniz Güncellendi";
    let statusMessage = `${storeName} mağazasından verdiğiniz siparişiniz güncellenmiştir.`;
    let statusDetail = `${storeName} siparişiniz ile ilgili güncellemeleri bu e-posta üzerinden takip edebilirsiniz.`;
  
    const normalizedStatus = (details.status || '').toLowerCase();
  
    if (['shipped', 'kargoda', 'kargoya verildi'].includes(normalizedStatus)) {
      emailSubject = `Kargoya Verildi - ${storeName}`;
      statusTitle = "Siparişiniz Kargoya Verildi";
      statusMessage = `${storeName} mağazasındaki siparişiniz kargo firmasına teslim edilmiştir. Çiçekleriniz yolda!`;
      statusDetail = `${storeName} siparişiniz ile ilgili güncellemeleri bu e-posta üzerinden takip edebilirsiniz.`;
    } else if (['cancelled', 'iptal edildi', 'iptal'].includes(normalizedStatus)) {
      emailSubject = `Sipariş İptal Edildi - ${storeName}`;
      statusTitle = "Sipariş İptal Edildi";
      statusMessage = `${storeName} mağazasındaki siparişiniz iptal edilmiştir. Sorularınız için bizimle iletişime geçebilirsiniz.`;
      
      // 🌸 İptal gerekçesi varsa doğrudan Status Box alt yazısına yazıyoruz:
      if (details.cancelReason) {
        statusDetail = `<strong>İptal Gerekçesi:</strong> ${details.cancelReason}`;
      } else {
        statusDetail = `${storeName} siparişiniz ile ilgili güncellemeleri bu e-posta üzerinden takip edebilirsiniz.`;
      }
    } else if (['processing', 'işleniyor', 'hazırlanıyor'].includes(normalizedStatus)) {
      emailSubject = `Sipariş Hazırlanıyor - ${storeName}`;
      statusTitle = "Siparişiniz Hazırlanıyor";
      statusMessage = `${storeName} ekibi sipariş ettiğiniz çiçekleri özenle hazırlıyor. En kısa sürede kargoya teslim edilecektir.`;
      statusDetail = `${storeName} siparişiniz ile ilgili güncellemeleri bu e-posta üzerinden takip edebilirsiniz.`;
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
                <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #111827;">₺${details.totalAmount}</td>
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