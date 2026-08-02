import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Lock, Package, ArrowRight, Trash2, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';

// 🗺️ Leaflet Harita Importları
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

// 🗺️ Haritayı merkezlemek için yardımcı bileşen
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
    setTimeout(() => {
      map.invalidateSize(); // Gri ekran kalmasın diye haritayı tazeler
    }, 100);
  }, [center, map]);
  return null;
}

// 🗺️ Haritaya tıklayınca konumu ve açık adresi alan yardımcı bileşen
function LocationSelector({ position, setPosition, setAddressText }: { position: [number, number], setPosition: (pos: [number, number]) => void, setAddressText: (addr: string) => void }) {
  useMapEvents({
    async click(e: any) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=tr`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddressText(data.display_name);
        }
      } catch (err) {
        console.error('Adres alınamadı', err);
      }
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('Henüz eklenmedi');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  
  // Yeni Adres Form State'leri
  const [newTitle, setNewTitle] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [selectedCity, setSelectedCity] = useState('Ankara');
  const [selectedDistrict, setSelectedDistrict] = useState('Çankaya');
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  // Harita Konum State'i
  const [position, setPosition] = useState<[number, number]>([39.9334, 32.8597]);

  // 🌸 İl/İlçe değiştiğinde haritayı o bölgeye götüren fonksiyon
  const handleCityOrDistrictChange = async (city: string, district: string) => {
    setSelectedCity(city);
    setSelectedDistrict(district);

    try {
      const query = `${district}, ${city}, Türkiye`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPosition([lat, lon]);
        setNewAddressText(data[0].display_name); // 🌸 Burası düzeltildi
      }
    } catch (err) {
      console.error('Konum bulunamadı', err);
    }
  };

  // 🌸 Türkiye'nin 81 İçi ve Tüm İlçeleri
  const districtsMap: Record<string, string[]> = {
    "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
    "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"],
    "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sinanpaşa", "Sultandağı", "Şuhut"],
    "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
    "Aksaray": ["Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi", "Sultanhanı"],
    "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
    "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
    "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
    "Ardahan": ["Çıldır", "Damal", "Göle", "Hanak", "Merkez", "Posof"],
    "Artvin": ["Ardanuç", "Arhavi", "Borçka", "Hopa", "Kemalpaşa", "Merkez", "Murgul", "Şavşat", "Yusufeli"],
    "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
    "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
    "Bartın": ["Amasra", "Kurucaşile", "Merkez", "Ulus"],
    "Batman": ["Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Merkez", "Sason"],
    "Bayburt": ["Aydıntepe", "Demirözü", "Merkez"],
    "Bilecik": ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
    "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
    "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
    "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
    "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
    "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
    "Çanakkale": ["Ayvacık", "Bahar", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
    "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
    "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
    "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
    "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kulp", "Lice", "Silvan", "Sur", "Tantı", "Yenişehir"],
    "Düzce": ["Akçakoca", "Cumayeri", "Çilimli", "Golyaka", "Gümüşova", "Merkez", "Kaynaşlı", "Yığılca"],
    "Edirne": ["Enez", "Havsa", "İpsala", "Keşan", "Lüleburgaz", "Meriç", "Merkez", "Süloğlu", "Uzunköprü"],
    "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"],
    "Erzincan": ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
    "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karaköse", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
    "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sivrihisar", "Tepebaşı"],
    "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
    "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
    "Gümüşhane": ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"],
    "Hakkari": ["Çukurca", "Merkez", "Şemdinli", "Yüksekova"],
    "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
    "Iğdır": ["Aralık", "Karakoyunlu", "Merkez", "Tuzluca"],
    "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
    "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
    "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
    "Kahramanmaraş": ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"],
    "Karabük": ["Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice"],
    "Karaman": ["Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Merkez", "Sarıveliler"],
    "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"],
    "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
    "Kayseri": ["Akkışla", "Bünyan", "Develi", "Fecirli", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
    "Kırıkkale": ["Bahşılı", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Merkez", "Sulakyurt", "Yahşihan"],
    "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
    "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"],
    "Kilis": ["Elbeyli", "Merkez", "Musabeyli", "Polateli"],
    "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
    "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
    "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Simav", "Tavşanlı"],
    "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
    "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
    "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
    "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
    "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
    "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
    "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
    "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
    "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
    "Osmaniye": ["Bahçe", "Disirli", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"],
    "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
    "Sakarya": ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
    "Samsun": ["19 Mayıs", "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "Kavak", "Ladik", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
    "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"],
    "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
    "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
    "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
    "Şırnak": ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi", "Uludere"],
    "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"],
    "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"],
    "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
    "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazımiye", "Ovacık", "Pertek", "Pülümür"],
    "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
    "Van": ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Saray", "Tuşba"],
    "Yalova": ["Altınova", "Armutlu", "Çınarcık", "Çiftlikköy", "Merkez", "Termal"],
    "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadişehri", "Merkez", "Saraykent", "Sarıkaya", "Sorgun", "Şefaatli", "Yenifakılı", "Yerköy"],
    "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Gökçebey", "Karadeniz Ereğli", "Merkez"]
  };

  const cities = Object.keys(districtsMap);

  // Şifre ve Telefon Güncelleme State'leri
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');

        // 🌸 Kullanıcının telefon numarasını profiles tablosundan çekiyoruz
        const { data: profileData } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData && profileData.phone) {
          setUserPhone(profileData.phone);
        }

        const { data: addresses, error } = await supabase
          .from('saved_addresses')
          .select('*')
          .eq('user_id', user.id);

        if (!error && addresses) {
          setSavedAddresses(addresses);
        }
      }
    } catch (err) {
      console.error('Profil verisi yüklenirken hata:', err);
    }
  };

// 🌸 Yeni Adres Ekleme
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAddressText || !selectedCity || !selectedDistrict) {
      alert('Lütfen adres başlığı, açık adres, il ve ilçe seçimlerini eksiksiz yapın.');
      return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
  
        // İl ve ilçeyi açık adresle birleştiriyoruz ki veritabanı hata vermesin
        const fullAddress = `${newAddressText} - ${selectedDistrict} / ${selectedCity}`;
  
        const { data, error } = await supabase
          .from('saved_addresses')
          .insert([
            {
              user_id: user.id,
              title: newTitle,
              address: fullAddress, // 🌸 Tüm bilgiyi address sütununa yazıyoruz
              district: selectedDistrict,
              recipient_name: newRecipient || user.email?.split('@')[0],
              recipient_phone: newPhone || '5555555555'
            }
          ])
          .select();

      if (error) throw error;

      if (data) {
        setSavedAddresses([...savedAddresses, data[0]]);
        setNewTitle('');
        setNewAddressText('');
        setNewRecipient('');
        setNewPhone('');
        alert('✅ Adres başarıyla eklendi!');
      }
    } catch (err: any) {
      alert(`❌ Adres eklenemedi: ${err.message}`);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedAddresses(savedAddresses.filter(addr => addr.id !== id));
      alert('🗑️ Adres silindi.');
    } catch (err: any) {
      alert(`❌ Silinemedi: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50/60 pb-16">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        
        {/* 👤 PROFİL BAŞLIK KARTI */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-8 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              ŞÜ
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-display">Şehriban Ümmü İnce</h1>
              <p className="text-xs text-brand-100">{userEmail}</p>
            </div>
          </div>

          <button
            onClick={() => { window.location.hash = '#/siparislerim'; }}
            className="px-5 py-2.5 bg-white text-brand-800 rounded-2xl text-xs font-bold shadow-sm hover:bg-brand-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" /> Siparişlerim Geçmişi <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* 📍 SOL KONUM: KAYITLI ADRESLER VE YENİ ADRES EKLEME */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-sand-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" /> Kayıtlı Adreslerim
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {savedAddresses.length === 0 ? (
                  <p className="text-xs text-sand-400">Henüz kayıtlı adresiniz bulunmuyor.</p>
                ) : (
                  savedAddresses.map((addr) => (
                    <div key={addr.id} className="p-3.5 rounded-2xl bg-sand-50/70 border border-sand-100 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold bg-brand-100 text-brand-800 px-2.5 py-0.5 rounded-full">
                          {addr.title}
                        </span>
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-sand-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Adresi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-sand-900 pt-1">{addr.address}</p>
                      <p className="text-[11px] text-sand-500">{addr.city} / {addr.district} ({addr.recipient_name})</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Yeni Adres Ekleme Formu */}
            <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-sand-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-600" /> Yeni Adres Ekle
              </h3>
              <form onSubmit={handleAddAddress} className="space-y-3">
                <input
                  type="text"
                  placeholder="Adres Başlığı (Örn: Ev, Ofis)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input text-xs py-2 w-full"
                />
                <input
                  type="text"
                  placeholder="Alıcı Adı Soyadı"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="input text-xs py-2 w-full"
                />
                <input
                  type="text"
                  placeholder="Alıcı Telefon (5XXXXXXXXX)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="input text-xs py-2 w-full"
                />

                {/* 🌸 İL VE İLÇE SEÇİM KUTULARI (Harita ile Senkronize) */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      const city = e.target.value;
                      const firstDistrict = districtsMap[city]?.[0] || '';
                      handleCityOrDistrictChange(city, firstDistrict);
                    }}
                    className="input text-xs py-2 w-full bg-white cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      handleCityOrDistrictChange(selectedCity, e.target.value);
                    }}
                    className="input text-xs py-2 w-full bg-white cursor-pointer"
                  >
                    {(districtsMap[selectedCity] || []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* 🗺️ HARİTA ALANI */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-sand-600">Haritadan Konum Seç</label>
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-sand-200 z-0 relative">
                    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapController center={position} />
                      <LocationSelector position={position} setPosition={setPosition} setAddressText={setNewAddressText} />
                    </MapContainer>
                  </div>
                </div>

                <textarea
                  placeholder="Açık Adres (Haritadan seçince veya il/ilçe seçince güncellenir)"
                  value={newAddressText}
                  onChange={(e) => setNewAddressText(e.target.value)}
                  className="input text-xs py-2 w-full resize-none h-16"
                />

                <button type="submit" className="btn-primary text-xs w-full py-2.5 cursor-pointer">
                  Adresi Kaydet
                </button>
              </form>
            </div>
          </div>

          {/* ⚙️ SAĞ KONUM: BİLGİ GÜNCELLEME ALANLARI */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Telefon Numarası Güncelleme */}
            <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-sand-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600" /> Telefon Numarası Güncelle
              </h3>
              <p className="text-xs text-sand-500">Mevcut Numaranız: <span className="font-bold text-sand-800">{userPhone}</span></p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newPhoneInput.trim()) {
                  alert('Lütfen geçerli bir telefon numarası girin.');
                  return;
                }

                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;

                  // 🌸 Supabase profiles tablosundaki phone sütununu güncelliyoruz
                  const { error } = await supabase
                    .from('profiles')
                    .update({ phone: newPhoneInput })
                    .eq('id', user.id);

                  if (error) throw error;

                  setUserPhone(newPhoneInput);
                  setNewPhoneInput('');
                  alert('✅ Telefon numaranız başarıyla veritabanına kaydedildi!');
                } catch (err: any) {
                  alert(`❌ Güncellenemedi: ${err.message}`);
                }
              }} className="flex gap-3">
                <input
                  type="text"
                  placeholder="05XX XXX XX XX"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value)}
                  className="input text-xs py-2.5 flex-1"
                />
                <button type="submit" className="btn-primary text-xs px-5 py-2.5 cursor-pointer">
                  Güncelle
                </button>
              </form>
            </div>

            {/* E-posta Adresi */}
            <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-sand-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600" /> E-Posta Adresi
              </h3>
              <input
                type="email"
                disabled
                value={userEmail}
                className="input text-xs py-2.5 w-full bg-sand-50 text-sand-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-sand-400">E-posta adresi güvenlik nedeniyle buradan değiştirilemez.</p>
            </div>

            {/* Şifre Değiştir */}
            <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-sand-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-600" /> Şifre Değiştir
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!currentPassword || !newPassword) {
                  alert('Lütfen mevcut ve yeni şifre alanlarını doldurun.');
                  return;
                }

                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user || !user.email) return;

                  const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                  });

                  if (signInError) {
                    alert('❌ Mevcut şifrenizi hatalı girdiniz!');
                    return;
                  }

                  const { error: updateError } = await supabase.auth.updateUser({
                    password: newPassword,
                  });

                  if (updateError) throw updateError;

                  alert('✅ Şifreniz başarıyla değiştirildi! Artık yeni şifrenizle giriş yapabilirsiniz.');
                  setCurrentPassword('');
                  setNewPassword('');
                } catch (err: any) {
                  alert(`❌ Şifre güncellenemedi: ${err.message}`);
                }
              }} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-sand-600 mb-1">Mevcut Şifre</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-xs py-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-sand-600 mb-1">Yeni Şifre</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input text-xs py-2 w-full"
                  />
                </div>
                <button type="submit" className="btn-primary text-xs px-5 py-2.5 mt-2 cursor-pointer">
                  Şifreyi Güncelle
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}