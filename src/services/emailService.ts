import { Resend } from 'resend';
const resend = new Resend((import.meta as any).env.VITE_RESEND_API_KEY);

// onboarding@resend.dev yerine kendi domain e-postan:
const FROM_EMAIL = 'Flower Shop <siparis@cicekci.com>';

interface EmailParams {
  to: string;
  recipientName: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
  totalAmount?: number;
}

export const sendOrderStatusEmail = async ({
  to,
  recipientName,
  orderId,
  status,
  trackingNumber,
  totalAmount,
}: EmailParams) => {
  try {
    let subject = '';
    let bodyHtml = '';

    const shortId = orderId ? orderId.slice(0, 8) : '---';

    // Sipariş Durumuna Göre Başlık ve HTML Tasarımı
    if (status === 'shipped' || status === 'Kargoda') {
      subject = `🚚 Siparişiniz Kargoya Verildi! (#${shortId})`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #db2777; border-bottom: 2px solid #fce7f3; padding-bottom: 10px;">Sayın ${recipientName},</h2>
          <p>Siparişiniz özenle paketlendi ve kargoya teslim edildi! 🌸</p>
          <div style="background-color: #fce7f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #831843;">Sipariş Numarası: #${shortId}</p>
            ${trackingNumber ? `<p style="margin: 8px 0 0 0; color: #1e40af; font-weight: bold;">Kargo Takip No: ${trackingNumber}</p>` : ''}
          </div>
          <p>Teslimat adresinize en kısa sürede ulaştırılacaktır.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #777;">Flower Shop - Taze Çiçekler & Buketler</p>
        </div>
      `;
    } else if (status === 'delivered' || status === 'Teslim Edildi') {
      subject = `✅ Siparişiniz Teslim Edildi (#${shortId})`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #15803d; border-bottom: 2px solid #dcfce7; padding-bottom: 10px;">Sayın ${recipientName},</h2>
          <p>Siparişiniz başarıyla teslim edilmiştir! 💐</p>
          <p>Çiçeklerinizin sevdiklerinize mutluluk getirmesini dileriz. Bizi tercih ettiğiniz için teşekkür ederiz!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #777;">Flower Shop</p>
        </div>
      `;
    } else if (status === 'cancelled' || status === 'İptal Edildi') {
      subject = `❌ Siparişiniz İptal Edildi (#${shortId})`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #b91c1c; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;">Sayın ${recipientName},</h2>
          <p><strong>#${shortId}</strong> numaralı siparişinizin iptal işlemi gerçekleştirilmiştir.</p>
          <p>Bir sorun olduğunu düşünüyorsanız veya destek almak isterseniz sitemiz üzerinden WhatsApp hattımıza ulaşabilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #777;">Flower Shop</p>
        </div>
      `;
    } else {
      subject = `🌸 Siparişiniz Alındı! (#${shortId})`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #db2777; border-bottom: 2px solid #fce7f3; padding-bottom: 10px;">Sayın ${recipientName},</h2>
          <p>Siparişiniz bize ulaştı! Hazırlanmaya başlıyor. 🌸</p>
          <div style="background-color: #fdf2f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Sipariş Kodu: #${shortId}</p>
            ${totalAmount ? `<p style="margin: 5px 0 0 0; font-weight: bold; color: #db2777;">Toplam Tutar: ₺${totalAmount}</p>` : ''}
          </div>
          <p>Siparişinizin durumunu sitemizden anlık olarak takip edebilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #777;">Flower Shop</p>
        </div>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: bodyHtml,
    });

    if (error) {
      console.error('❌ Resend Mail Hatası:', error);
      return false;
    }

    console.log('✉️ Mail başarıyla yollandı:', data);
    return true;
  } catch (err) {
    console.error('❌ Mail gönderilirken hata oluştu:', err);
    return false;
  }
};