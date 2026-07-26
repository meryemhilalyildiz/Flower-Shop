// src/services/whatsappService.ts

// 🎯 Mağaza Admin WhatsApp Numarası (Ülke kodu ile, başında + veya 0 olmadan)
export const PHONE_NUMBER = '905057430907';

export function generateWhatsAppMessage(order: {
  id: string;
  recipientName?: string;
  total: number;
  items?: Array<{ product: { name: string }; quantity: number }>;
}): string {
  const lines: string[] = [
    `Merhaba! 👋 *#${order.id}* numaralı siparişim hakkında bilgi almak istiyorum.`,
    '',
  ];

  if (order.recipientName) {
    lines.push(`👤 *Alıcı:* ${order.recipientName}`);
  }

  if (order.items && order.items.length > 0) {
    lines.push('💐 *Ürünler:*');
    order.items.forEach((item) => {
      lines.push(`- ${item.product.name} (x${item.quantity})`);
    });
  }

  lines.push('');
  lines.push(`💰 *Toplam Tutar:* ${order.total} TL`);
  lines.push('');
  lines.push('Siparişimin durumu hakkında yardımcı olabilir misiniz?');

  return encodeURIComponent(lines.join('\n'));
}

export function openWhatsApp(order: any) {
  const message = generateWhatsAppMessage(order);
  // Doğrudan WhatsApp sohbetini açan wa.me linki:
  const url = `https://wa.me/${PHONE_NUMBER}?text=${message}`;
  window.open(url, '_blank');
}