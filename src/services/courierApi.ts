import { supabase } from '../supabaseClient';
import { updateOrderStatus as adminUpdateOrderStatus } from './adminApi';
import type { Courier, CourierOrder } from '../types';

// 🌸 Realtime subscription type
export type RealtimeSubscription = {
  unsubscribe: () => void;
};

// Simple password hashing (for production, use bcrypt on backend)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Courier login
export async function courierLogin(email: string, password: string): Promise<{ success: boolean; courier?: Courier; error?: string }> {
  try {
    const { data: courier, error } = await supabase
      .from('couriers')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !courier) {
      return { success: false, error: 'Kurye bulunamadı veya hesap aktif değil' };
    }

    const passwordHash = await hashPassword(password);
    if (courier.password_hash !== passwordHash) {
      return { success: false, error: 'Hatalı şifre' };
    }

    // Store courier session in localStorage
    localStorage.setItem('courierId', courier.id);
    localStorage.setItem('courierName', courier.name);
    localStorage.setItem('courierEmail', courier.email);

    return { success: true, courier };
  } catch (error: any) {
    console.error('Kurye giriş hatası:', error);
    return { success: false, error: 'Giriş sırasında bir hata oluştu' };
  }
}

// Courier logout
export function courierLogout() {
  localStorage.removeItem('courierId');
  localStorage.removeItem('courierName');
  localStorage.removeItem('courierEmail');
}

// Get current courier from localStorage
export function getCurrentCourier(): { id: string; name: string; email: string } | null {
  const courierId = localStorage.getItem('courierId');
  const courierName = localStorage.getItem('courierName');
  const courierEmail = localStorage.getItem('courierEmail');

  if (courierId && courierName && courierEmail) {
    return { id: courierId, name: courierName, email: courierEmail };
  }
  return null;
}

// Get courier's assigned orders
export async function getCourierOrders(courierId: string): Promise<CourierOrder[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('courier_id', courierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getCourierOrders hatası:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Kurye siparişleri yüklenirken hata:', error);
    return [];
  }
}

// 🌸 Subscribe to realtime order updates for a courier
export function subscribeToCourierOrders(
  courierId: string,
  callback: (orders: CourierOrder[]) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`courier_orders_${courierId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `courier_id=eq.${courierId}`,
      },
      async (payload) => {
        try {
          // Fetch updated orders when change occurs
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('courier_id', courierId)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error fetching updated orders:', error);
            return;
          }
          
          if (data) {
            callback(data);
          }
        } catch (error) {
          console.error('Error in realtime callback:', error);
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error('Realtime subscription error:', err);
      }
    });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// Update order status (courier can update their assigned orders)
export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 🌸 Admin API kullanarak güncelleme (RLS politikası bypass için)
    const result = await adminUpdateOrderStatus(orderId, status);

    if (!result) {
      throw new Error('Admin API güncelleme başarısız');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Sipariş durumu güncellenirken hata:', error);
    return { success: false, error: error.message };
  }
}

// Update order status with email notification
export async function updateOrderStatusWithEmail(
  orderId: string,
  status: string,
  orderDetails?: {
    customerName: string;
    customerEmail: string;
    trackingNumber?: string;
    totalAmount: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 🌸 Admin API kullanarak güncelleme (RLS politikası bypass için)
    const result = await adminUpdateOrderStatus(orderId, status);

    if (!result) {
      throw new Error('Admin API güncelleme başarısız');
    }

    // Verify the update by reading the record again
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (verifyError) {
      console.error('Doğrulama hatası:', verifyError);
    }

    // Send email notification if order details provided
    if (orderDetails && orderDetails.customerEmail) {
      try {
        const { generateOrderEmailHtml } = await import('./emailService');
        const { emailSubject, html } = generateOrderEmailHtml({
          customerName: orderDetails.customerName,
          orderNumber: orderId,
          totalAmount: orderDetails.totalAmount,
          status: status,
          trackingNumber: orderDetails.trackingNumber
        });

        await supabase.functions.invoke('send-email', {
          body: {
            to: orderDetails.customerEmail,
            subject: emailSubject,
            html: html
          }
        });
      } catch (emailError) {
        console.error('Email gönderilirken hata:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Sipariş durumu güncellenirken hata:', error);
    return { success: false, error: error.message };
  }
}

// Get all couriers (for admin)
export async function getAllCouriers(): Promise<Courier[]> {
  try {
    const { data, error } = await supabase
      .from('couriers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Kuryeler yüklenirken hata:', error);
    return [];
  }
}

// Add new courier (for admin)
export async function addCourier(courierData: {
  name: string;
  email: string;
  phone: string;
  vehicle_type: 'motor' | 'araba';
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await hashPassword(courierData.password);

    const { error } = await supabase.from('couriers').insert({
      name: courierData.name,
      email: courierData.email,
      phone: courierData.phone,
      vehicle_type: courierData.vehicle_type,
      password_hash: passwordHash,
      is_active: true
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Kurye eklenirken hata:', error);
    return { success: false, error: error.message };
  }
}

// Update courier (for admin)
export async function updateCourier(
  courierId: string,
  updates: Partial<Courier>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = { ...updates };
    
    // If password is being updated, hash it
    if (updates.password_hash) {
      updateData.password_hash = await hashPassword(updates.password_hash);
    }

    const { error } = await supabase
      .from('couriers')
      .update(updateData)
      .eq('id', courierId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Kurye güncellenirken hata:', error);
    return { success: false, error: error.message };
  }
}

// Delete courier (for admin)
export async function deleteCourier(courierId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First unassign all orders from this courier
    await supabase
      .from('orders')
      .update({ courier_id: null })
      .eq('courier_id', courierId);

    // Then delete the courier
    const { error } = await supabase
      .from('couriers')
      .delete()
      .eq('id', courierId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Kurye silinirken hata:', error);
    return { success: false, error: error.message };
  }
}
