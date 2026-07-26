import type { OrderInfo } from '../types';

export const generateInvoicePDF = (order: OrderInfo) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen açılır pencerelere (pop-up) izin verin.');
    return;
  }

  // 1. Ödeme Yöntemi & Taksit Hesaplama
  const paymentMethodRaw = (order as any).paymentMethod || (order as any).payment_method || 'Kapıda Ödeme (Kredi Kartı / Nakit)';
  const installmentCount = (order as any).installment || (order as any).installments || 1;
  
  let paymentMethodText = 'Kapıda Ödeme (Kredi Kartı / Nakit)';

  if (paymentMethodRaw.toLowerCase().includes('iban') || paymentMethodRaw.toLowerCase().includes('eft') || paymentMethodRaw.toLowerCase().includes('havale')) {
    paymentMethodText = 'Banka Havalesi / IBAN';
  } else if (paymentMethodRaw.toLowerCase().includes('online') || paymentMethodRaw.toLowerCase().includes('card') || paymentMethodRaw.toLowerCase().includes('kart')) {
    paymentMethodText = installmentCount > 1 
      ? `Online Kredi Kartı (${installmentCount} Taksit)` 
      : 'Online Kredi / Banka Kartı (Tek Çekim)';
  } else if (typeof paymentMethodRaw === 'string' && paymentMethodRaw.trim() !== '') {
    paymentMethodText = paymentMethodRaw;
  }

  // 2. Kupon ve İndirim Hesaplama
  const couponCode = (order as any).couponCode || (order as any).coupon_code || null;
  const discountAmount = Number((order as any).discountAmount || (order as any).discount_amount || 0);
  const deliveryFee = Number((order as any).deliveryFee || (order as any).delivery_fee || 0);

  // Ürünlerin ham ara toplamı
  const subtotal = order.items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    const qty = item.quantity || 1;
    return sum + (price * qty);
  }, 0);

  const itemsHtml = order.items
    .map((item) => {
      const productName = item.product?.name || 'Çiçek Ürünü';
      const qty = item.quantity || 1;
      const price = item.product?.price || 0;
      const total = price * qty;

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₺${price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₺${total.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fatura - INV-${order.id.slice(0, 8).toUpperCase()}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #db2777; padding-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; color: #db2777; }
          .info { margin-top: 20px; display: flex; justify-content: space-between; gap: 20px; }
          .info-box { font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 13px; }
          th { background-color: #f9fafb; padding: 10px; text-align: left; border-bottom: 2px solid #eee; }
          
          .summary-table { margin-left: auto; width: 280px; margin-top: 20px; font-size: 13px; line-height: 1.8; }
          .summary-table td { padding: 3px 0; }
          .grand-total { font-size: 16px; font-weight: bold; color: #db2777; border-top: 2px solid #db2777; padding-top: 6px; }
          .coupon-badge { background-color: #fdf2f8; color: #db2777; padding: 2px 6px; rounded: 4px; font-weight: bold; font-size: 11px; }

          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🌸 ÇİÇEKÇİ</div>
            <div style="font-size: 12px; color: #666;">Sipariş Faturası & Bilgi Fişi</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #555;">
            <div><strong>Fatura No:</strong> INV-${order.id.slice(0, 8).toUpperCase()}</div>
            <div><strong>Tarih:</strong> ${new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
            <div><strong>Durum:</strong> ${order.status || 'Hazırlanıyor'}</div>
          </div>
        </div>

        <div class="info">
          <div class="info-box">
            <strong>Müşteri & Teslimat Bilgileri:</strong><br/>
            <strong>Alıcı:</strong> ${order.recipientName || 'Belirtilmedi'}<br/>
            <strong>Telefon:</strong> ${order.recipientPhone || 'Belirtilmedi'}<br/>
            <strong>Şehir:</strong> ${order.city || 'Belirtilmedi'}<br/>
            <strong>Adres:</strong> ${order.shipping_address || order.address || 'Belirtilmedi'}<br/>
            ${order.tracking_number ? `<strong>Kargo Takip No:</strong> ${order.tracking_number}` : ''}
          </div>
          <div class="info-box" style="text-align: right;">
            <strong>Ödeme & Kampanya Bilgileri:</strong><br/>
            <strong>Ödeme Yöntemi:</strong> ${paymentMethodText}<br/>
            ${couponCode ? `<strong>Uygulanan Kupon:</strong> <span class="coupon-badge">${couponCode}</span><br/>` : ''}
            <strong>Ödeme Durumu:</strong> Onaylandı
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ürün Adı</th>
              <th style="text-align: center;">Adet</th>
              <th style="text-align: right;">Birim Fiyat</th>
              <th style="text-align: right;">Toplam</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Hesap Döküm Tablosu -->
        <table class="summary-table">
          <tr>
            <td>Ara Toplam:</td>
            <td style="text-align: right;">₺${subtotal.toFixed(2)}</td>
          </tr>
          ${deliveryFee > 0 ? `
          <tr>
            <td>Teslimat / Kargo Ücreti:</td>
            <td style="text-align: right;">₺${deliveryFee.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${discountAmount > 0 ? `
          <tr style="color: #db2777;">
            <td>Kupon İndirimi (${couponCode || 'Kampanya'}):</td>
            <td style="text-align: right;">-₺${discountAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="grand-total">
            <td>Genel Toplam:</td>
            <td style="text-align: right;">₺${order.total.toFixed(2)}</td>
          </tr>
        </table>

        <div class="footer">
          Bizi tercih ettiğiniz için teşekkür ederiz! - Çiçekçi A.Ş.
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};