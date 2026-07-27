-- Sayfa içerikleri için dinamik içerik yönetimi tablosu
-- Live Page Editor için kullanılacak

CREATE TABLE IF NOT EXISTS page_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE, -- 'about', 'contact', 'faq' gibi sayfa tanımlayıcıları
  content JSONB NOT NULL DEFAULT '{}', -- Sayfa içeriği (metinler, başlıklar, adresler vb.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) politikasına
ALTER TABLE page_contents ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (eğer varsa)
DROP POLICY IF EXISTS "Admins can read page contents" ON page_contents;
DROP POLICY IF EXISTS "Admins can update page contents" ON page_contents;
DROP POLICY IF EXISTS "Admins can insert page contents" ON page_contents;
DROP POLICY IF EXISTS "Public can read page contents" ON page_contents;

-- Sadece admin kullanıcıların okuyabilmesi
CREATE POLICY "Admins can read page contents"
  ON page_contents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sadece admin kullanıcıların güncelleyebilmesi
CREATE POLICY "Admins can update page contents"
  ON page_contents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sadece admin kullanıcıların ekleyebilmesi
CREATE POLICY "Admins can insert page contents"
  ON page_contents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Herkesin okuyabilmesi (public read - frontend için)
CREATE POLICY "Public can read page contents"
  ON page_contents FOR SELECT
  TO anon
  USING (true);

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_contents_updated_at
  BEFORE UPDATE ON page_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Varsayılan sayfa içeriklerini ekle
INSERT INTO page_contents (page_key, content) VALUES
  (
    'home',
    '{
      "hero_title": "Sevdiklerinize Çiçek Gönderin",
      "hero_subtitle": "Türkiye''nin her yerine aynı gün teslimat ile duygularınızı çiçeklerle iletin",
      "hero_cta": "Hemen Sipariş Ver",
      "hero_image_1": "https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600",
      "hero_image_2": "https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=600",
      "hero_image_3": "https://images.pexels.com/photos/1932467/pexels-photo-1932467.jpeg?auto=compress&cs=tinysrgb&w=600"
    }'::jsonb
  ),
  (
    'about',
    '{
      "hero_title": "Çiçek sevgiyi anlatmanın en güzel yoludur",
      "hero_description": "Çiçekçi, 1998 yılında İstanbul''da küçük bir çiçekçi dükkanı olarak başladı. Bugün, Türkiye''nin dört bir yanına taze çiçek ulaştıran, yüz binlerce gülümsemeye vesile olmuş bir marka. Amacımız, her çiçeğin taşıdığı duyguyu en güzel şekilde iletmenize aracılık etmek.",
      "stats": [
        { "icon": "Users", "value": "50K+", "label": "Mutlu Müşteri" },
        { "icon": "Flower2", "value": "100K+", "label": "Çiçek Teslim Edildi" },
        { "icon": "Award", "value": "25+", "label": "Yıllık Tecrübe" },
        { "icon": "Heart", "value": "4.8/5", "label": "Müşteri Puanı" }
      ],
      "values": [
        { "icon": "Leaf", "title": "Tazelik", "desc": "Her çiçek taze kesilir ve aynı gün teslim edilir. 7 gün tazelik garantisi." },
        { "icon": "Sparkles", "title": "Usta İşçiliği", "desc": "Profesyonel floristlerimiz her buketi özenle tasarlar." },
        { "icon": "Heart", "title": "Samimiyet", "desc": "Her sipariş bir sevgi mesajı taşır. Kalbinizi iletmenize aracı oluruz." },
        { "icon": "Award", "title": "Güven", "desc": "25 yılı aşkın tecrübemizle, her zaman en iyi hizmeti sunarız." }
      ],
      "story": "1998''de, İstanbul Beyoğlu''nda küçük bir dükkan açtığımızda hayalimiz tek bir şeydi: insanların sevdiklerine en güzel duyguları çiçeklerle iletmesine yardımcı olmak. Yıllar geçtikçe büyüdük, ama hep aynı tutkuyla çalıştık. Her buket bir hikaye, her çiçek bir mesaj taşıyor. Bugün Türkiye''nin 81 iline çiçek ulaştırıyoruz. 25 yılı aşkın tecrübemiz, binlerce mutlu müşterimiz ve taze çiçeklerimizle, kalbinizi iletmenize aracı olmaya devam ediyoruz.",
      "hero_image": "https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800",
      "story_image": "https://images.pexels.com/photos/6340978/pexels-photo-6340978.jpeg?auto=compress&cs=tinysrgb&w=800"
    }'::jsonb
  ),
  (
    'contact',
    '{
      "hero_title": "İletişime Geçin",
      "hero_description": "Sorularınız, özel siparişler veya işbirlikleri için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.",
      "contact_info": [
        { "icon": "MapPin", "title": "Adres", "value": "İstiklal Cd. No:123, Beyoğlu, İstanbul" },
        { "icon": "Phone", "title": "Telefon", "value": "0850 123 45 67" },
        { "icon": "Mail", "title": "E-posta", "value": "destek@cicekci.com" },
        { "icon": "Clock", "title": "Çalışma Saatleri", "value": "Her gün 08:00 - 22:00" }
      ],
      "contact_image": "https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800"
    }'::jsonb
  ),
  (
    'faq',
    '{
      "hero_title": "Sıkça Sorulan Sorular",
      "hero_description": "Merak ettiğiniz soruların cevaplarını burada bulamadıysanız, bize ulaşmaktan çekinmeyin.",
      "categories": [
        {
          "category": "Teslimat",
          "questions": [
            { "q": "Siparişim ne zaman teslim edilir?", "a": "Saat 16:00''dan önce verilen siparişler aynı gün, 16:00''dan sonra verilen siparişler ertesi gün teslim edilir. Teslimat saatleri 09:00-22:00 arasındadır." },
            { "q": "Teslimat ücreti ne kadar?", "a": "Teslimat ücreti 49 TL''dir." },
            { "q": "Türkiye''nin her yerine teslimat yapıyor musunuz?", "a": "Evet, Türkiye''nin 81 iline teslimat yapıyoruz. Kırsal bölgelerde teslimat süresi 1-2 gün uzayabilir." },
            { "q": "Teslimat saatini seçebilir miyim?", "a": "Sipariş sırasında teslimat tarihini belirtebilirsiniz. Özel saat talepleri için müşteri hizmetlerimizi arayabilirsiniz." }
          ]
        },
        {
          "category": "Çiçekler & Bakım",
          "questions": [
            { "q": "Çiçeklerim ne kadar süre taze kalır?", "a": "Doğru bakım ile kesme çiçekler 5-7 gün taze kalır. Saksılı bitkiler çok daha uzun ömümlüdür. 7 gün tazelik garantisi sunuyoruz." },
            { "q": "Çiçeklerimi nasıl bakım yapmalıyım?", "a": "Vazoyu temiz su ile doldurun, çiçek saplarını 45 derece açıyla kesin ve suyu her 2 günde bir değiştirin. Direkt güneş ışığından uzak tutun." },
            { "q": "Çiçekler taze değilse ne yapmalıyım?", "a": "Çiçekleriniz taze değilse, teslimattan itibaren 48 saat içinde bize ulaşın. Ücretsiz değiştirme veya iade sağlıyoruz." },
            { "q": "Özel buket siparişi verebilir miyim?", "a": "Evet! Özel günler için kişiselleştirilmiş buketler tasarlıyoruz. İletişim sayfamızdan bize ulaşın, floristlerimiz size yardımcı olsun." }
          ]
        },
        {
          "category": "Ödeme & İade",
          "questions": [
            { "q": "Hangi ödeme yöntemlerini kabul ediyorsunuz?", "a": "Tüm kredi/banka kartları kabul edilmektedir. Ödemeleriniz 256-bit SSL sertifikası ile güvenle işlenir." },
            { "q": "İade politikası nedir?", "a": "Çiçek tazelik garantisi kapsamında, teslimattan sonraki 48 saat içinde çiçeklerde sorun tespit ederseniz ücretsiz değiştirme veya iade yapılır." },
            { "q": "Fatura alabilir miyim?", "a": "Evet, sipariş sırasında fatura bilgilerinizi girebilirsiniz. Fatura e-posta adresinize PDF olarak gönderilir." },
            { "q": "Hediye kartı veya kupon kullanabilir miyim?", "a": "Sipariş ödeme sayfasında indirim kodunuzu girebilirsiniz. Hediye kartları da aynı şekilde kullanılabilir." }
          ]
        },
        {
          "category": "Hesap & Sipariş",
          "questions": [
            { "q": "Üyelik zorunlu mu?", "a": "Hayır, üye olmadan misafir olarak sipariş verebilirsiniz. Ancak üyelik ile sipariş geçmişinize erişebilir ve daha hızlı sipariş verebilirsiniz." },
            { "q": "Siparişimi nasıl takip edebilirim?", "a": "Sipariş onay sayfasından ve size gönderilen e-posta linkinden sipariş durumunuzu takip edebilirsiniz." },
            { "q": "Siparişimi iptal edebilir miyim?", "a": "Siparişiniz henüz hazırlanma aşamasındaysa iptal edebilirsiniz. Çiçekler hazırlanmaya başlandıysa iptal mümkün olmayabilir." }
          ]
        }
      ]
    }'::jsonb
  )
ON CONFLICT (page_key) DO NOTHING;
