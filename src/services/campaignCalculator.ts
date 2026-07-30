// src/services/campaignCalculator.ts
import type { CartItem } from '../types';

export function calculateCampaignDiscount(cartItems: any[], activeCampaigns: any | any[]): number {
  if (!cartItems || cartItems.length === 0 || !activeCampaigns) return 0;
  
  const campaignsList = Array.isArray(activeCampaigns) ? activeCampaigns : [activeCampaigns];
  let maxDiscount = 0;

  for (const activeCampaign of campaignsList) {
    if (!activeCampaign) continue;

    const currentDiscount = calculateSingleCampaignDiscount(cartItems, activeCampaign);

    if (currentDiscount > maxDiscount) {
      maxDiscount = currentDiscount;
    }
  }

  return Math.max(0, maxDiscount);
}

// 🌸 TEK BİR KAMPANYANIN İNDİRİM TUTARINI HESAPLAYAN YARDIMCI FONKSİYON
export function calculateSingleCampaignDiscount(cartItems: any[], activeCampaign: any): number {
  if (!cartItems || cartItems.length === 0 || !activeCampaign) return 0;

  // Kampanyanın geçerli olduğu ürünleri filtrele
  const eligibleItems = cartItems.filter((item) => {
    if (activeCampaign.target_type === 'all' || !activeCampaign.target_type) return true;
    return activeCampaign.target_product_ids?.includes(item.product?.id || item.productId || item.id);
  });

  if (eligibleItems.length === 0) return 0;

  // Minimum sepet tutarı kontrolü
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || item.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  if (activeCampaign.min_order_amount && subtotal < activeCampaign.min_order_amount) {
    return 0;
  }

  let currentDiscount = 0;

  switch (activeCampaign.discount_type) {
    // 1. Sabit TL İndirimi
    case 'fixed_amount':
      currentDiscount = Number(activeCampaign.discount_value) || 0;
      break;

    // 2. Yüzde İndirimi
    case 'percentage': {
      const eligibleTotal = eligibleItems.reduce(
        (acc, item) => acc + (item.product?.price || item.price || 0) * (item.quantity || 1),
        0
      );
      const percent = Number(activeCampaign.discount_value || activeCampaign.discount_percentage || 0);
      currentDiscount = (eligibleTotal * percent) / 100;
      break;
    }

    // 3. 2 Al 1 Öde / 3 Al 2 Öde
    case 'buy_x_pay_y': {
      const totalQuantity = eligibleItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
      const buyX = Number(activeCampaign.buy_x) || 2;
      const payY = Number(activeCampaign.pay_y) || 1;

      const freeItemsCount = Math.floor(totalQuantity / buyX) * (buyX - payY);

      if (freeItemsCount > 0) {
        const allPrices: number[] = [];
        eligibleItems.forEach((item) => {
          for (let i = 0; i < (item.quantity || 1); i++) {
            allPrices.push(item.product?.price || item.price || 0);
          }
        });

        allPrices.sort((a, b) => a - b);
        for (let k = 0; k < freeItemsCount && k < allPrices.length; k++) {
          currentDiscount += allPrices[k];
        }
      }
      break;
    }

    // 4. 2. Ürüne % İndirim
    case 'second_item_discount': {
      const itemsList: number[] = [];
      eligibleItems.forEach((item) => {
        for (let i = 0; i < (item.quantity || 1); i++) {
          itemsList.push(item.product?.price || item.price || 0);
        }
      });

      if (itemsList.length >= 2) {
        itemsList.sort((a, b) => a - b);
        const secondItemPrice = itemsList[1];
        const percent = Number(activeCampaign.discount_value) || 50;
        currentDiscount = (secondItemPrice * percent) / 100;
      }
      break;
    }
  }

  return Math.max(0, currentDiscount);
}