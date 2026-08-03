import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import nodemailer from "https://esm.sh/nodemailer@6.9.7";
serve(async (req)=>{
  try {
    const payload = await req.json();
    console.log("📥 Gelen Webhook Verisi:", JSON.stringify(payload));
    const record = payload.record || {};
    const table = payload.table; // Hangi tablodan geldiğini ayırt etmek için
    // Nodemailer SMTP Ayarları
    const transporter = nodemailer.createTransport({
      host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT")) || 465,
      secure: true,
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS")
      }
    });
    // ==========================================
    // 📩 1. İLETİŞİM FORMU MESAJLARI (contact_messages)
    // ==========================================
    if (table === "contact_messages") {
      const senderName = record.name || "Ziyaretçi";
      const senderEmail = record.email || "E-posta belirtilmedi";
      const subject = record.subject || "Konu Yok";
      const messageContent = record.message || "";
      const htmlContactContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 25px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="color: #d81b60; border-bottom: 2px solid #f1f1f1; padding-bottom: 10px;">📩 Yeni İletişim Formu Mesajı</h2>
            <p><b>Gönderen Adı:</b> ${senderName}</p>
            <p><b>E-Posta Adresi:</b> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
            <p><b>Konu:</b> ${subject}</p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
            <p><b>Mesaj:</b></p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #d81b60; font-size: 14px; line-height: 1.5; color: #333333;">
              ${messageContent.replace(/\n/g, "<br>")}
            </div>
            <p style="font-size: 12px; color: #888888; margin-top: 25px; text-align: center;">
              Bu e-posta Flower Shop web sitesindeki İletişim Formu üzerinden gönderilmiştir.
            </p>
          </div>
        </div>
      `;
      await transporter.sendMail({
        from: `"${senderName} (İletişim Formu)" <${Deno.env.get("SMTP_USER")}>`,
        to: Deno.env.get("SMTP_USER"),
        replyTo: senderEmail,
        subject: `📩 [İletişim Formu] ${subject}`,
        html: htmlContactContent
      });
      console.log("✅ İletişim e-postası yöneticiye iletildi:", senderEmail);
      return new Response(JSON.stringify({
        success: true,
        message: "İletişim mesajı iletildi."
      }), {
        headers: {
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    // ==========================================
    // 🌸 2. SİPARİŞ BİLDİRİM E-POSTALARI (Orijinal Kodunuz)
    // ==========================================
    const old_record = payload.old_record || {};
    const eventType = payload.type; // 'INSERT' veya 'UPDATE'
    // Güncelleme işleminde durum değişmediyse pas geç
    if (eventType === "UPDATE" && old_record && record.status === old_record.status) {
      console.log("ℹ️ Sipariş durumu değişmedi, işlem atlandı.");
      return new Response(JSON.stringify({
        message: "Durum değişmedi, mail atılmadı."
      }), {
        status: 200
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // ADMIN / MAĞAZA ADINI PROFILES TABLOSUNDAN ÇEKME
    let storeName = "Flower Shop"; // Varsayılan dükkan adı
    const adminId = record.updated_by_admin_id || record.admin_id || record.seller_id;
    if (adminId) {
      const { data: adminProfile } = await supabase.from("profiles").select("full_name").eq("id", adminId).single();
      if (adminProfile && adminProfile.full_name) {
        storeName = adminProfile.full_name;
      }
    } else {
      const { data: adminUser } = await supabase.from("profiles").select("full_name").eq("role", "admin").not("full_name", "is", null).limit(1).single();
      if (adminUser && adminUser.full_name) {
        storeName = adminUser.full_name;
      }
    }
    console.log("🏪 Mağaza / Admin Adı:", storeName);
    // MÜŞTERİ E-POSTASINI BULMA
    let customerEmail = record.user_email || record.email || record.customer_email || record.recipient_email || record.buyer_email;
    if ((!customerEmail || !customerEmail.includes("@")) && record.user_id) {
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", record.user_id).single();
      if (profile && profile.email) {
        customerEmail = profile.email;
      } else {
        const { data: userData } = await supabase.auth.admin.getUserById(record.user_id);
        if (userData?.user?.email) {
          customerEmail = userData.user.email;
        }
      }
    }
    if (!customerEmail || !customerEmail.includes("@")) {
      console.error("❌ Müşteri e-postası bulunamadı. User ID:", record.user_id);
      return new Response(JSON.stringify({
        error: "Müşteri e-postası bulunamadı."
      }), {
        status: 400
      });
    }
    // Duruma Göre Başlıklar ve İçerikler
    let subject = `${storeName} - Sipariş Bilgilendirmesi 🌸`;
    let statusTitle = "Sipariş Durum Güncellemesi";
    let statusText = `<b>${storeName}</b> firmasından verdiğiniz siparişin durumu <b>"${record.status}"</b> olarak güncellenmiştir.`;
    if (eventType === "INSERT" || record.status === "Sipariş Alındı" || record.status === "pending" || record.status === "beklemede") {
      subject = `🎉 Siparişiniz Alındı! - ${storeName}`;
      statusTitle = "Siparişiniz Başarıyla Alındı!";
      statusText = `<b>${storeName}</b> mağazasından verdiğiniz sipariş bize ulaştı. Çiçekleriniz özenle hazırlanmak üzere sıraya alındı!`;
    } else if (record.status === "shipped" || record.status === "Kargoda" || record.status === "processing" || record.status === "İşleniyor") {
      subject = `🚚 Siparişiniz Hazırlanıyor / Kargoda! - ${storeName}`;
      statusTitle = "Siparişiniz İşleme Alındı!";
      statusText = `<b>${storeName}</b> ekibi sipariş ettiğiniz çiçekleri özenle hazırlıyor / kargo firmasına teslim etti.`;
    } else if (record.status === "in_transit" || record.status === "Yolda" || record.status === "Yola Çıktı") {
      subject = `🚀 Siparişiniz Yolda! - ${storeName}`;
      statusTitle = "Siparişiniz Yolda!";
      statusText = `<b>${storeName}</b> mağazasındaki siparişiniz kurye tarafından teslim edilmek üzere yola çıkmıştır. Çiçekleriniz yakında sizde!`;
    } else if (record.status === "delivered" || record.status === "Teslim Edildi") {
      subject = `🌸 Siparişiniz Teslim Edildi! - ${storeName}`;
      statusTitle = "Çiçekleriniz Teslim Edildi!";
      statusText = `<b>${storeName}</b> mağazasından siparişiniz başarıyla teslim edilmiştir. Güzel günlerde kullanmanızı dileriz!`;
    } else if (record.status === "cancelled" || record.status === "İptal Edildi") {
      subject = `ℹ️ Sipariş İptal Bilgilendirmesi - ${storeName}`;
      statusTitle = "Sipariş İptal Edildi";
      statusText = `<b>${storeName}</b> mağazasındaki siparişiniz iptal edilmiştir. Sorularınız için bizimle iletişime geçebilirsiniz.`;
    }
    const recipientName = record.recipient_name || record.customer_name || "Müşterimiz";
    // E-Posta Şablonu (HTML)
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 30px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <div style="background-color: #d81b60; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${storeName} 🌸</h1>
          </div>

          <!-- Body -->
          <div style="padding: 30px; color: #333333; line-height: 1.6;">
            <p style="font-size: 16px; margin-top: 0;">Merhaba <b>${recipientName}</b>,</p>
            
            <p style="font-size: 15px;">
              ${statusText}
            </p>

            <div style="background-color: #f8f9fa; border-left: 4px solid #d81b60; padding: 15px 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; color: #d81b60; font-size: 16px;">${statusTitle}</h3>
              <p style="margin: 0; font-size: 14px; color: #555;"><b>${storeName}</b> siparişiniz ile ilgili güncellemeleri bu e-posta üzerinden takip edebilirsiniz.</p>
            </div>

            <!-- Sipariş Detayları -->
            <div style="background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 5px 0; font-size: 14px;"><b>Mağaza:</b> ${storeName}</p>
              <p style="margin: 5px 0; font-size: 14px;"><b>Sipariş Numarası:</b> #${record.id}</p>
              ${record.tracking_number ? `<p style="margin: 5px 0; font-size: 14px;"><b>Kargo Takip No:</b> <span style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${record.tracking_number}</span></p>` : ""}
              ${record.total_amount ? `<p style="margin: 5px 0; font-size: 14px;"><b>Toplam Tutar:</b> ₺${record.total_amount}</p>` : ""}
            </div>

            <p style="font-size: 14px; color: #666; margin-bottom: 0;">
              <b>${storeName}</b> olarak bizi tercih ettiğiniz için teşekkür eder, renkli günler dileriz! 💐
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f3f5; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            © ${storeName} Sipariş Bilgilendirme Sistemi
          </div>

        </div>
      </div>
    `;
    // Mail Gönderimi
    await transporter.sendMail({
      from: `"${storeName}" <${Deno.env.get("SMTP_USER")}>`,
      to: customerEmail,
      subject: subject,
      html: htmlContent
    });
    console.log(`✅ Mail başarıyla gönderildi (${storeName}) ->`, customerEmail);
    return new Response(JSON.stringify({
      success: true,
      message: "Mail başarıyla gönderildi!"
    }), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("💥 Hata oluştu:", error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
