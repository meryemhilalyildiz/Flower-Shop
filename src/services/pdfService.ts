import type { OrderInfo } from '../types';

export const generateInvoicePDF = (order: OrderInfo) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen açılır pencerilere (pop-up) izin verin.');
    return;
  }

  // 🌸 1. Müşteri & Teslimat Bilgileri
  const recipientName = order.recipientName || (order as any).recipient_name || 'Belirtilmedi';
  
  const recipientPhone = 
    (order as any).recipientPhone || 
    (order as any).recipient_phone || 
    (order as any).phone || 
    (order as any).recipient_telephone ||
    'Belirtilmedi';

  const locationCity = order.city || (order as any).province || (order as any).district || 'Belirtilmedi';
  const fullAddress = order.shipping_address || order.address || (order as any).shippingAddress || 'Belirtilmedi';

  // 🌸 2. Ödeme Yöntemi & Taksit
  const paymentMethodRaw = (order as any).paymentMethod || (order as any).payment_method || 'Online Kredi / Banka Kartı (Tek Çekim)';
  const installmentCount = (order as any).installment || (order as any).installments || 1;
  
  let paymentMethodText = 'Online Kredi / Banka Kartı (Tek Çekim)';

  if (typeof paymentMethodRaw === 'string') {
    const lower = paymentMethodRaw.toLowerCase();
    if (lower.includes('iban') || lower.includes('eft') || lower.includes('havale')) {
      paymentMethodText = 'Banka Havalesi / IBAN';
    } else if (lower.includes('online') || lower.includes('card') || lower.includes('kart')) {
      paymentMethodText = installmentCount > 1 
        ? `Online Kredi Kartı (${installmentCount} Taksit)` 
        : 'Online Kredi / Banka Kartı (Tek Çekim)';
    } else if (paymentMethodRaw.trim() !== '') {
      paymentMethodText = paymentMethodRaw;
    }
  }

  const couponCode = (order as any).applied_coupon_code || (order as any).couponCode || (order as any).coupon_code || null;

  // 🌸 3. Tutar Hesaplamaları
  const totalAmount = Number(order.total || (order as any).total_amount || 0);
  let deliveryFee = Number(order.deliveryFee ?? (order as any).delivery_fee ?? 0);
  const discountAmount = Number((order as any).discountAmount || (order as any).discount_amount || 0);

  if (deliveryFee === 0 && totalAmount > 0) {
    deliveryFee = 300;
  }

  let rawSubtotal = Number(order.subtotal || 0);
  if (rawSubtotal <= 0 || rawSubtotal >= totalAmount) {
    rawSubtotal = totalAmount - deliveryFee + discountAmount;
  }

  const discountPercentage = rawSubtotal > 0 && discountAmount > 0 
    ? Math.round((discountAmount / rawSubtotal) * 100) 
    : 0;

  // 🌸 4. Ürün Satırlarını Oluşturma
  const rawItems = 
    order.items || 
    (order as any).order_items || 
    (order as any).orderItems || 
    [];

  const itemsList = Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : [];

  let itemsHtml = '';

  if (itemsList.length > 0) {
    itemsHtml = itemsList
      .map((item: any) => {
        const fullName = 
          item.product_name || 
          item.product?.name || 
          item.name || 
          item.title || 
          'Çiçek Ürünü';

        const qty = Number(item.quantity || item.qty || 1);

        let price = Number(
          item.price ?? 
          item.unit_price ?? 
          item.product?.price ?? 
          item.product_price ?? 
          0
        );

        if (price === 0 && rawSubtotal > 0) {
          price = rawSubtotal / itemsList.length;
        }

        const total = price * qty;

        let baseName = fullName;
        let variantSubtext = '';

        if (fullName.includes('(') && fullName.includes(')')) {
          const parts = fullName.split('(');
          baseName = parts[0].trim();
          variantSubtext = parts[1].replace(')', '').trim();
        }

        return `
          <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
              <div style="font-weight: bold; color: #333; font-size: 14px;">${baseName}</div>
              ${
                variantSubtext
                  ? `<div style="font-size: 11px; color: #db2777; margin-top: 4px; font-weight: 600; display: inline-block;">
                      ✨ Varyant / Detay: ${variantSubtext}
                     </div>`
                  : '<div style="font-size: 11px; color: #888; margin-top: 2px;">Standart Boyut</div>'
              }
            </td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: 500;">${qty} Adet</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right;">₺${price.toFixed(2)}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #111827;">₺${total.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');
  } else {
    itemsHtml = `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #333; font-size: 14px;">Özel Tasarım Çiçek Aranjmanı</div>
          <div style="font-size: 11px; color: #888; margin-top: 2px;">Taze Cicek Siparis Urunu</div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: 500;">1 Adet</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right;">₺${rawSubtotal.toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #111827;">₺${rawSubtotal.toFixed(2)}</td>
      </tr>
    `;
  }

  // 🌸 5. HTML Şablon Çıktısı
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fatura - INV-${String(order.id).slice(0, 8).toUpperCase()}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #db2777; padding-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; color: #db2777; }
          .info { margin-top: 20px; display: flex; justify-content: space-between; gap: 20px; }
          .info-box { font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 13px; }
          th { background-color: #f9fafb; padding: 10px; text-align: left; border-bottom: 2px solid #eee; }
          
          .summary-table { margin-left: auto; width: 340px; margin-top: 20px; font-size: 13px; line-height: 1.8; }
          .summary-table td { padding: 4px 0; }
          .grand-total { font-size: 16px; font-weight: bold; color: #db2777; border-top: 2px solid #db2777; padding-top: 8px; }
          .coupon-badge { background-color: #fdf2f8; color: #db2777; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; }

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
            <div><strong>Fatura No:</strong> INV-${String(order.id).slice(0, 8).toUpperCase()}</div>
            <div><strong>Tarih:</strong> ${new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
            <div><strong>Durum:</strong> ${order.status || 'Hazırlanıyor'}</div>
          </div>
        </div>

        <div class="info">
          <div class="info-box">
            <strong>Müşteri & Teslimat Bilgileri:</strong><br/>
            <strong>Alıcı:</strong> ${recipientName}<br/>
            <strong>Telefon:</strong> ${recipientPhone}<br/>
            <strong>Şehir / İlçe:</strong> ${locationCity}<br/>
            <strong>Adres:</strong> ${fullAddress}<br/>
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
              <th>Ürün Detayı / Varyant</th>
              <th style="text-align: center;">Miktar</th>
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
            <td>Ürünler Toplamı:</td>
            <td style="text-align: right; font-weight: 500;">₺${rawSubtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>🚚 Teslimat / Kargo Ücreti:</td>
            <td style="text-align: right; font-weight: 500;">₺${deliveryFee.toFixed(2)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr style="color: #059669; font-weight: 600; background-color: #ecfdf5;">
            <td style="padding: 4px 6px;">
              ${couponCode ? '🎟️ İndirim Kuponu' : '🏷️ Kampanya İndirimi'} ${discountPercentage > 0 ? `(%${discountPercentage})` : ''}:
            </td>
            <td style="text-align: right; padding: 4px 6px;">-₺${discountAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="grand-total">
            <td>Genel Toplam:</td>
            <td style="text-align: right;">₺${totalAmount.toFixed(2)}</td>
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