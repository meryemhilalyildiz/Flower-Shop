import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:math';
import 'package:geocoding/geocoding.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://ftsmqcgzpzjcebrdhysw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0c21xY2d6cHpqY2VicmRoeXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY3ODgsImV4cCI6MjEwMDUwMjc4OH0.aAPTGTkznmpDg2DT0ekm6mHk4lf26YhvzEGmERaUp6g',
  );

  runApp(const CourierMobileApp());
}

class CourierMobileApp extends StatelessWidget {
  const CourierMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Flower Shop Kurye',
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFFBE185D),
        scaffoldBackgroundColor: const Color(0xFFFBF9F6),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFBE185D),
          primary: const Color(0xFFBE185D),
          surface: Colors.white,
        ),
      ),
      home: const CourierLoginPage(),
    );
  }
}

class CourierLoginPage extends StatefulWidget {
  const CourierLoginPage({super.key});

  @override
  State<CourierLoginPage> createState() => _CourierLoginPageState();
}

class _CourierLoginPageState extends State<CourierLoginPage> {
  final _plateController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    final plate = _plateController.text.trim();
    final password = _passwordController.text.trim();

    if (plate.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen plaka ve şifrenizi girin.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await Supabase.instance.client
          .from('couriers')
          .select()
          .eq('plate', plate)
          .maybeSingle();

      if (response == null) {
        throw 'Bu plakaya ait kurye bulunamadı.';
      }

      if (response['password_hash'] != password) {
        throw 'Hatalı şifre!';
      }

      if (!mounted) return;
      
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => CourierDashboardPage(courier: response),
        ),
      );

    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Giriş başarısız: $e'), 
          backgroundColor: Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 420),
            padding: const EdgeInsets.all(36),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFBE185D).withOpacity(0.08),
                  blurRadius: 30,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFCE7F3),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.local_shipping_rounded, size: 40, color: Color(0xFFBE185D)),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Flower Shop',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1C1917)),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Kurye Operasyon Paneli',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 32),
                TextField(
                  controller: _plateController,
                  decoration: InputDecoration(
                    labelText: 'Araç Plakası',
                    hintText: '06 TEST 06',
                    filled: true,
                    fillColor: const Color(0xFFFAF8F5),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                    prefixIcon: const Icon(Icons.directions_car_filled, color: Color(0xFFBE185D)),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Şifre',
                    filled: true,
                    fillColor: const Color(0xFFFAF8F5),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                    prefixIcon: const Icon(Icons.lock_rounded, color: Color(0xFFBE185D)),
                  ),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFBE185D),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Giriş Yap', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class CourierDashboardPage extends StatefulWidget {
  final Map<String, dynamic> courier;

  const CourierDashboardPage({super.key, required this.courier});

  @override
  State<CourierDashboardPage> createState() => _CourierDashboardPageState();
}

class _CourierDashboardPageState extends State<CourierDashboardPage> {
  int _selectedIndex = 0;
  
  // 🌸 1. Setter hatasını önlemek için final kelimesini kaldırıyoruz
  LatLng storeLocation = const LatLng(39.9334, 32.8597);
  String storeAddressLoaded = 'Yükleniyor...';
  
  List<Map<String, dynamic>> allOrders = [];
  bool isLoadingOrders = true;

  @override
  void initState() {
    super.initState();
    _loadStoreSettings();
    _fetchOrders(); // 🌸 2. Sayfa açıldığında siparişleri çekmesi için buraya ekliyoruz
  }

  Future<void> _loadStoreSettings() async {
    try {
      final response = await Supabase.instance.client
          .from('store_settings')
          .select()
          .maybeSingle();

      if (response != null) {
        setState(() {
          storeAddressLoaded = "${response['street'] ?? ''}, ${response['neighborhood'] ?? ''}, ${response['city'] ?? ''}";
          if (response['latitude'] != null && response['longitude'] != null) {
            storeLocation = LatLng(
              (response['latitude'] as num).toDouble(),
              (response['longitude'] as num).toDouble(),
            );
          }
        });
      }
    } catch (e) {
      // Hata yönetimi
    }
  }

  // 🌸 3. Sorduğun fonksiyonu tam olarak buraya yerleştiriyoruz
  Future<void> _fetchOrders() async {
    try {
      final rawOrders = await Supabase.instance.client
          .from('orders')
          .select()
          .eq('courier_id', widget.courier['id'])
          .order('delivery_date', ascending: false)
          .order('created_at', ascending: false);

      final Map<String, Map<String, dynamic>> uniqueOrdersMap = {};
      for (var order in rawOrders) {
        final id = order['id'].toString();
        if (!uniqueOrdersMap.containsKey(id)) {
          uniqueOrdersMap[id] = order;
        }
      }

      if (mounted) {
        setState(() {
          allOrders = uniqueOrdersMap.values.toList();
          isLoadingOrders = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => isLoadingOrders = false);
    }
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(scheme: 'tel', path: phoneNumber);
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }

  double _calculateDistance(LatLng point1, LatLng point2) {
    const p = 0.017453292519943295;
    final c = cos;
    final a = 0.5 -
        c((point2.latitude - point1.latitude) * p) / 2 +
        c(point1.latitude * p) *
            c(point2.latitude * p) *
            (1 - c((point2.longitude - point1.longitude) * p)) /
            2;
    return 12742 * asin(sqrt(a));
  }

  // Adresi dinamik olarak koordinata çeviren sürdürülebilir fonksiyon
LatLng _getOrderLatLng(Map<String, dynamic> order) {
  final double lat = (order['latitude'] as num?)?.toDouble() ?? storeLocation.latitude;
  final double lng = (order['longitude'] as num?)?.toDouble() ?? storeLocation.longitude;
  return LatLng(lat, lng);
}

  Future<void> _updateOrderStatus(String orderId, String newStatus, {String? failureReason}) async {
    try {
      final updateData = <String, dynamic>{'status': newStatus};
      if (failureReason != null) {
        updateData['delivery_failure_reason'] = failureReason;
      }

      await Supabase.instance.client
          .from('orders')
          .update(updateData)
          .eq('id', orderId);

      setState(() {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Sipariş güncellendi: $newStatus'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF1C1917),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Hata: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showNotDeliveredDialog(String orderId) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Teslim Edilemedi Gerekçesi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        content: TextField(
          controller: reasonController,
          decoration: InputDecoration(
            hintText: 'Örn: Müşteriye ulaşılamadı, adres yanlış...',
            filled: true,
            fillColor: const Color(0xFFFAF8F5),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Vazgeç', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              if (reasonController.text.trim().isEmpty) return;
              Navigator.pop(context);
              _updateOrderStatus(orderId, 'delivery_failed', failureReason: reasonController.text.trim());
            },
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
  }

  void _openFullRouteMap(List<Map<String, dynamic>> activeOrders) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FullRouteMapPage(
          storeLocation: storeLocation,
          storeAddress: storeAddressLoaded,
          initialActiveOrders: activeOrders,
          makePhoneCall: _makePhoneCall,
          updateOrderStatus: _updateOrderStatus,
          showNotDeliveredDialog: _showNotDeliveredDialog,
          courierId: widget.courier['id'],
          onOrderUpdated: _fetchOrders,
        ),
      ),
    );
  }

  String _getDateCategory(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Diğer';
    try {
      final orderDate = DateTime.parse(dateStr);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final orderDay = DateTime(orderDate.year, orderDate.month, orderDate.day);

      final difference = today.difference(orderDay).inDays;

      if (difference == 0) {
        return 'Bugün';
      } else if (difference == 1) {
        return 'Dün';
      } else {
        return '${orderDate.day}.${orderDate.month}.${orderDate.year}';
      }
    } catch (e) {
      return 'Diğer';
    }
  }

  String _translateStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending': return 'BEKLİYOR';
      case 'processing': return 'HAZIRLANIYOR';
      case 'shipped': return 'YOLDA';
      case 'in_transit': return 'DAĞITIMDA';
      case 'delivered': return 'TESLİM EDİLDİ';
      case 'cancelled':
      case 'delivery_failed': return 'TESLİM EDİLEMEDİ';
      default: return status.toUpperCase();
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered': return Colors.green.shade600;
      case 'cancelled':
      case 'delivery_failed': return Colors.red.shade600;
      case 'in_transit':
      case 'shipped': return Colors.orange.shade800;
      default: return Colors.blue.shade600;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.courier['name']} (${widget.courier['plate'] ?? ''})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFFBE185D),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Yenile',
            onPressed: () => setState(() {}),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Çıkış Yap',
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const CourierLoginPage()),
              );
            },
          ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: Supabase.instance.client
            .from('orders')
            .select()
            .eq('courier_id', widget.courier['id'])
            .ilike('city', '%ankara%') // 🌸 Sadece Ankara içi siparişleri getirir
            .order('delivery_date', ascending: false)
            .order('created_at', ascending: false),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFBE185D)));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Hata oluştu: ${snapshot.error}'));
          }

          final rawOrders = snapshot.data ?? [];
          
          final Map<String, Map<String, dynamic>> uniqueOrdersMap = {};
          for (var order in rawOrders) {
            final id = order['id'].toString();
            if (!uniqueOrdersMap.containsKey(id)) {
              uniqueOrdersMap[id] = order;
            }
          }
          final allOrders = uniqueOrdersMap.values.toList();

          final activeOrders = allOrders.where((o) => o['status'] != 'delivered' && o['status'] != 'cancelled' && o['status'] != 'delivery_failed').toList();
          final deliveredOrders = allOrders.where((o) => o['status'] == 'delivered').toList();
          final failedOrders = allOrders.where((o) => o['status'] == 'cancelled' || o['status'] == 'delivery_failed').toList();
          
          final activeCount = activeOrders.length;
          final deliveredCount = deliveredOrders.length;
          final failedCount = failedOrders.length;
          final totalAssignedCount = activeCount + deliveredCount + failedCount;
          
          activeOrders.sort((a, b) => _calculateDistance(
    storeLocation, 
    _getOrderLatLng(a)
  ).compareTo(_calculateDistance(
    storeLocation, 
    _getOrderLatLng(b)
  )));

          List<Map<String, dynamic>> displayedOrders = [];
          if (_selectedIndex == 0) {
            displayedOrders = activeOrders;
          } else if (_selectedIndex == 1) {
            displayedOrders = deliveredOrders;
          } else {
            displayedOrders = allOrders;
          }

          return Column(
            children: [
              // 🌸 Üst 4'lü Şık İstatistik Kartları
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                color: Colors.white,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatCard('Aktif', activeCount, Colors.blue.shade700),
                    _buildStatCard('Teslim Edilen', deliveredCount, Colors.green.shade700),
                    _buildStatCard('Edilemeyen', failedCount, Colors.red.shade700),
                    _buildStatCard('Toplam', totalAssignedCount, Colors.purple.shade700),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFEFECE6)),

              // Mağaza Bilgi Şeridi
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: const Color(0xFFFDF2F8),
                child: Text(
                  '🌸 Mağaza (DB): $storeAddressLoaded',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF831843)),
                ),
              ),

              if (_selectedIndex == 0 && activeOrders.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: InkWell(
                    onTap: () => _openFullRouteMap(activeOrders),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFFBE185D), Color(0xFF9D174D)]),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFBE185D).withOpacity(0.25),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.map_rounded, color: Colors.white, size: 22),
                          SizedBox(width: 10),
                          Text(
                            '🗺️ Tüm Dağıtım Rotasını Haritada Gör',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.3),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              Expanded(
                child: displayedOrders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox_rounded, size: 54, color: Colors.grey.shade400),
                            const SizedBox(height: 10),
                            const Text('Bu kategoride sipariş bulunmuyor.', style: TextStyle(color: Colors.grey, fontSize: 15, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      )
                    : _selectedIndex == 2 
                        ? _buildGroupedOrdersList(displayedOrders)
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: displayedOrders.length,
                            itemBuilder: (context, index) => _buildOrderCard(displayedOrders[index], index),
                          ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, -4)),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          selectedItemColor: const Color(0xFFBE185D),
          unselectedItemColor: Colors.grey.shade500,
          backgroundColor: Colors.white,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.local_shipping_rounded), label: 'Aktif Siparişler'),
            BottomNavigationBarItem(icon: Icon(Icons.check_circle_rounded), label: 'Teslim Edilenler'),
            BottomNavigationBarItem(icon: Icon(Icons.list_alt_rounded), label: 'Tüm Siparişler'),
          ],
        ),
      ),
    );
  }

  Widget _buildGroupedOrdersList(List<Map<String, dynamic>> orders) {
    final Map<String, List<Map<String, dynamic>>> grouped = {};
    for (var order in orders) {
      final dateField = order['delivery_date'] ?? order['created_at'];
      final category = _getDateCategory(dateField);
      if (!grouped.containsKey(category)) {
        grouped[category] = [];
      }
      grouped[category]!.add(order);
    }

    final keys = grouped.keys.toList();

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: keys.length,
      itemBuilder: (context, groupIndex) {
        final category = keys[groupIndex];
        final groupOrders = grouped[category]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCE7F3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  category,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF831843), fontSize: 13),
                ),
              ),
            ),
            ...groupOrders.map((order) => _buildOrderCard(order, 0)).toList(),
            const SizedBox(height: 12),
          ],
        );
      },
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order, int index) {
  final status = order['status'] ?? 'pending';
  final address = order['address'] ?? order['shipping_address'] ?? 'Adres belirtilmemiş';
  final city = order['city'] ?? 'Ankara';
  
  // 1. Bu siparişin kendi konumu (Zaten eklemiştik)
  final LatLng orderLocation = _getOrderLatLng(order);
  final String distance = _calculateDistance(storeLocation, orderLocation).toStringAsFixed(1);

  // 2. Haritanın ilk odaklanacağı merkez için bunu da HEMEN BURAYA ekliyoruz:
  final LatLng initialOrderLocation = orderLocation;
  final failureReason = order['delivery_failure_reason'];
  final bool showButtons = (_selectedIndex == 0);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEFECE6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _translateStatus(status),
                        style: TextStyle(fontSize: 10, color: _getStatusColor(status), fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (_selectedIndex == 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF831843).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${index + 1}. Durak ($distance km)',
                          style: const TextStyle(fontSize: 10, color: Color(0xFF831843), fontWeight: FontWeight.bold),
                        ),
                      ),
                  ],
                ),
                Text('₺${order['total_amount'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: Color(0xFF1C1917))),
              ],
            ),
            const SizedBox(height: 12),
            Text('Alıcı: ${order['recipient_name'] ?? order['recipientName'] ?? 'Bilinmiyor'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF292524))),
            const SizedBox(height: 4),
            Text('Adres: $address, $city', style: const TextStyle(color: Colors.grey, fontSize: 13)),
            
            if ((status == 'cancelled' || status == 'delivery_failed') && failureReason != null && failureReason.toString().isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Text(
                  '❌ Gerekçe: $failureReason',
                  style: TextStyle(color: Colors.red.shade900, fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ],

            const SizedBox(height: 12),

            Container(
              height: 130,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: initialOrderLocation,
                    initialZoom: 13.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.courier_mobile_app',
                    ),

// 🌸 1. Dükkandan bu siparişe giden rota çizgisi
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: [
                            const LatLng(39.9334, 32.8597), // Dükkanın konumu (Ankara merkez veya sabit dükkan koordinatın)
                            orderLocation,                  // Siparişin teslimat adresi konumu
                          ],
                          color: const Color(0xFFBE185D), // Şık pembe/kırmızı rota çizgisi
                          strokeWidth: 4.0,
                        ),
                      ],
                    ),

                    MarkerLayer(
                      markers: [
                        Marker(
                          point: orderLocation,
                          width: 40,
                          height: 40,
                          child: const Icon(Icons.location_pin, color: Colors.red, size: 38),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                const Icon(Icons.phone_rounded, size: 16, color: Color(0xFFBE185D)),
                const SizedBox(width: 6),
                InkWell(
                  onTap: () => _makePhoneCall(order['recipient_phone'] ?? ''),
                  child: Text(
                    order['recipient_phone'] ?? 'Telefon yok',
                    style: const TextStyle(color: Color(0xFFBE185D), fontWeight: FontWeight.bold, fontSize: 13, decoration: TextDecoration.underline),
                  ),
                ),
              ],
            ),
            
            if (showButtons) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _showNotDeliveredDialog(order['id']),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade600,
                      side: BorderSide(color: Colors.red.shade200),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                    icon: const Icon(Icons.close_rounded, size: 16),
                    label: const Text('Teslim Edilmedi', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                  ElevatedButton.icon(
                    onPressed: () => _updateOrderStatus(order['id'], 'delivered'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: const Text('Teslim Et', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, int count, Color color) {
    return Container(
      constraints: const BoxConstraints(minWidth: 78),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text('$count', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 2),
          Text(title, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class FullRouteMapPage extends StatefulWidget {
  final LatLng storeLocation;
  final String storeAddress;
  final List<Map<String, dynamic>> initialActiveOrders;
  final Future<void> Function(String) makePhoneCall;
  final Future<void> Function(String, String, {String? failureReason}) updateOrderStatus;
  final void Function(String) showNotDeliveredDialog;
  final String courierId;
  final Future<void> Function() onOrderUpdated;

  const FullRouteMapPage({
    super.key,
    required this.storeLocation,
    required this.storeAddress,
    required this.initialActiveOrders,
    required this.makePhoneCall,
    required this.updateOrderStatus,
    required this.showNotDeliveredDialog,
    required this.courierId,
    required this.onOrderUpdated,
  });

  @override
  State<FullRouteMapPage> createState() => _FullRouteMapPageState();
}

class _FullRouteMapPageState extends State<FullRouteMapPage> {
  List<Map<String, dynamic>> activeOrders = [];
  bool isLoading = true;
  late MapController _mapController;

  List<LatLng> streetRoutePoints = [];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    activeOrders = List.from(widget.initialActiveOrders);
    _sortOrdersByDistance();
    _refreshRouteOrders();
  }

  void _sortOrdersByDistance() {
    activeOrders.sort((a, b) => _calculateDistance(
      widget.storeLocation, 
      LatLng((a['latitude'] as num?)?.toDouble() ?? 39.9334, (a['longitude'] as num?)?.toDouble() ?? 32.8597)
    ).compareTo(_calculateDistance(
      widget.storeLocation, 
      LatLng((b['latitude'] as num?)?.toDouble() ?? 39.9334, (b['longitude'] as num?)?.toDouble() ?? 32.8597)
    )));
  }

  // 🌸 OSRM API ile gerçek sokak rotasını çeken fonksiyon
  // 🌸 Her durak arasında tek tek sokak rotası çizen gelişmiş fonksiyon
  Future<void> _fetchStreetRoute() async {
    if (activeOrders.isEmpty) return;

    try {
      List<LatLng> allRoutePoints = [];
      
      // Noktalar listesini oluştur: Dükkan -> Durak 1 -> Durak 2 -> Durak 3 ...
      List<LatLng> stops = [widget.storeLocation];
      for (var order in activeOrders) {
        final double lat = (order['latitude'] as num?)?.toDouble() ?? 39.9334;
        final double lng = (order['longitude'] as num?)?.toDouble() ?? 32.8597;
        stops.add(LatLng(lat, lng));
      }

      // Her durak arası için OSRM'den sokak yollarını parça parça çekelim
      for (int i = 0; i < stops.length - 1; i++) {
        final start = stops[i];
        final end = stops[i + 1];

        final url = Uri.parse(
          'https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson'
        );
        
        final response = await http.get(url);
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final routes = data['routes'] as List;
          if (routes.isNotEmpty) {
            final geometry = routes[0]['geometry'];
            final coordinates = geometry['coordinates'] as List;

            for (var coord in coordinates) {
              allRoutePoints.add(LatLng(coord[1], coord[0]));
            }
          }
        }
      }

      if (mounted && allRoutePoints.isNotEmpty) {
        setState(() {
          streetRoutePoints = allRoutePoints;
        });
      }
    } catch (e) {
      print('Sokak rota parça çekme hatası: $e');
    }
  }

  Future<void> _refreshRouteOrders() async {
    try {
      final rawOrders = await Supabase.instance.client
          .from('orders')
          .select()
          .eq('courier_id', widget.courierId)
          .ilike('city', '%ankara%');

      final Map<String, Map<String, dynamic>> uniqueMap = {};
      for (var order in rawOrders) {
        final id = order['id'].toString();
        if (!uniqueMap.containsKey(id)) {
          uniqueMap[id] = order;
        }
      }

      final all = uniqueMap.values.toList();
      final currentActive = all.where((o) => o['status'] != 'delivered' && o['status'] != 'cancelled' && o['status'] != 'delivery_failed').toList();

      currentActive.sort((a, b) => _calculateDistance(
        widget.storeLocation, 
        LatLng((a['latitude'] as num?)?.toDouble() ?? 39.9334, (a['longitude'] as num?)?.toDouble() ?? 32.8597)
      ).compareTo(_calculateDistance(
        widget.storeLocation, 
        LatLng((b['latitude'] as num?)?.toDouble() ?? 39.9334, (b['longitude'] as num?)?.toDouble() ?? 32.8597)
      )));

      if (mounted) {
        setState(() {
          activeOrders = currentActive;
          isLoading = false;
        });

        // 🌸 Sokak rotasını API'den güncelle
        await _fetchStreetRoute();

        if (activeOrders.isNotEmpty) {
          final double firstLat = (activeOrders.first['latitude'] as num?)?.toDouble() ?? 39.9334;
          final double firstLng = (activeOrders.first['longitude'] as num?)?.toDouble() ?? 32.8597;
          _mapController.move(LatLng(firstLat, firstLng), 13.0);
        }
      }
      await widget.onOrderUpdated();
    } catch (e) {
      if (mounted) setState(() => isLoading = false);
    }
  }

  double _calculateDistance(LatLng point1, LatLng point2) {
    const p = 0.017453292519943295;
    final c = cos;
    final a = 0.5 -
        c((point2.latitude - point1.latitude) * p) / 2 +
        c(point1.latitude * p) *
            c(point2.latitude * p) *
            (1 - c((point2.longitude - point1.longitude) * p)) /
            2;
    return 12742 * asin(sqrt(a));
  }

  @override
  Widget build(BuildContext context) {
    List<Marker> markers = [
      Marker(
        point: widget.storeLocation,
        width: 50,
        height: 50,
        child: const Icon(Icons.store_rounded, color: Colors.purple, size: 45),
      ),
    ];

    for (int i = 0; i < activeOrders.length; i++) {
      final order = activeOrders[i];
      final double lat = (order['latitude'] as num?)?.toDouble() ?? 39.9334;
      final double lng = (order['longitude'] as num?)?.toDouble() ?? 32.8597;
      final LatLng orderLatLng = LatLng(lat, lng);

      markers.add(
        Marker(
          point: orderLatLng,
          width: 45,
          height: 45,
          child: GestureDetector(
            onTap: () {
              _mapController.move(orderLatLng, 15.0);
            },
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFBE185D),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2)),
                ],
              ),
              child: Center(
                child: Text(
                  '${i + 1}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
          ),
        ),
      );
    }

    LatLng initialCenter = widget.storeLocation;
    if (activeOrders.isNotEmpty) {
      final double firstLat = (activeOrders.first['latitude'] as num?)?.toDouble() ?? 39.9334;
      final double firstLng = (activeOrders.first['longitude'] as num?)?.toDouble() ?? 32.8597;
      initialCenter = LatLng(firstLat, firstLng);
    }

    // 1. Önce points listemizi hazırlıyoruz:
    List<LatLng> polylinePoints = streetRoutePoints.isNotEmpty 
        ? streetRoutePoints 
        : [widget.storeLocation, if (activeOrders.isNotEmpty) LatLng((activeOrders[0]['latitude'] as num?)?.toDouble() ?? 39.9334, (activeOrders[0]['longitude'] as num?)?.toDouble() ?? 32.8597)];

    // 2. Ardından PolylineLayer içinde güvenle kullanıyoruz:
    return Scaffold(
      appBar: AppBar(
        title: const Text('Akıllı Dağıtım ve Rota Rehberi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFFBE185D),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refreshRouteOrders,
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: initialCenter,
              initialZoom: 13.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.courier_mobile_app',
              ),
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: polylinePoints, // 🌸 İşte buraya veriyoruz!
                    color: const Color(0xFFBE185D),
                    strokeWidth: 4.0,
                  ),
                ],
              ),
              MarkerLayer(markers: markers),
            ],
          ),
          Positioned(
            top: 16,
            right: 16,
            bottom: 16,
            width: 350,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.97),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 15, offset: const Offset(0, 6)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      '📋 Sıralı Durak Listesi & Rota',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFFBE185D)),
                    ),
                  ),
                  if (activeOrders.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDF2F8),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFCE7F3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.directions_bike_rounded, color: Color(0xFFBE185D), size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Önce 1. Durak (${activeOrders[0]['city'] ?? 'Ankara'}) noktasına gitmeniz önerilir.',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF831843)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const Divider(height: 12, color: Color(0xFFEFECE6)),
                  Expanded(
                    child: isLoading
                        ? const Center(child: CircularProgressIndicator(color: Color(0xFFBE185D)))
                        : activeOrders.isEmpty
                            ? const Center(child: Text('Aktif durak kalmadı.', style: TextStyle(color: Colors.grey)))
                            : ListView.builder(
                                itemCount: activeOrders.length,
                                itemBuilder: (context, index) {
                                  final order = activeOrders[index];
                                  final address = order['address'] ?? order['shipping_address'] ?? 'Adres yok';
                                  final city = order['city'] ?? 'Ankara';
                                  final phone = order['recipient_phone'] ?? '';
                                  final recipient = order['recipient_name'] ?? order['recipientName'] ?? 'Müşteri';
                                  final orderId = order['id'];
                                  
                                  final double orderLat = (order['latitude'] as num?)?.toDouble() ?? 39.9334;
                                  final double orderLng = (order['longitude'] as num?)?.toDouble() ?? 32.8597;
                                  final distance = _calculateDistance(widget.storeLocation, LatLng(orderLat, orderLng)).toStringAsFixed(1);

                                  return InkWell(
                                    onTap: () {
                                      _mapController.move(LatLng(orderLat, orderLng), 15.0);
                                    },
                                    child: Container(
                                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: index == 0 ? const Color(0xFFFFF1F2) : Colors.white,
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(color: index == 0 ? const Color(0xFFFECDD3) : Colors.grey.shade200),
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFF831843).withOpacity(0.1),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    index == 0 ? '🚀 1. Durak (Sıradaki) - $distance km' : '${index + 1}. Durak ($distance km)', 
                                                    style: const TextStyle(fontSize: 10, color: Color(0xFF831843), fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                                IconButton(
                                                  constraints: const BoxConstraints(),
                                                  padding: EdgeInsets.zero,
                                                  icon: const Icon(Icons.phone_rounded, color: Color(0xFFBE185D), size: 18),
                                                  onPressed: () => widget.makePhoneCall(phone),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 6),
                                            Text(recipient, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF292524))),
                                            const SizedBox(height: 2),
                                            Text('Adres: $address, $city', style: const TextStyle(fontSize: 11, color: Colors.grey), maxLines: 2, overflow: TextOverflow.ellipsis),
                                            const SizedBox(height: 8),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                OutlinedButton(
                                                  style: OutlinedButton.styleFrom(
                                                    foregroundColor: Colors.red.shade600,
                                                    side: BorderSide(color: Colors.red.shade200),
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
                                                    minimumSize: const Size(80, 28),
                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                                  ),
                                                  onPressed: () {
                                                    widget.showNotDeliveredDialog(orderId);
                                                    Future.delayed(const Duration(seconds: 1), _refreshRouteOrders);
                                                  },
                                                  child: const Text('Edilemedi', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
                                                ),
                                                ElevatedButton(
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: Colors.green.shade600,
                                                    foregroundColor: Colors.white,
                                                    elevation: 0,
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
                                                    minimumSize: const Size(65, 28),
                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                                  ),
                                                  onPressed: () async {
                                                    await widget.updateOrderStatus(orderId, 'delivered');
                                                    await _refreshRouteOrders();
                                                  },
                                                  child: const Text('Teslim Et', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}