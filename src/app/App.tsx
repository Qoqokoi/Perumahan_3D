import { useState } from 'react';
import { PropertyList } from './components/PropertyList';
import { PropertyFilters } from './components/PropertyFilters';
import { PropertyDetail } from './components/PropertyDetail';
import { SalesInvoice } from './components/SalesInvoice';
import { useIsMobile } from './components/ui/use-mobile';
import {
  Home, FileText, LogIn,
  Video, Users, Building2, MessageCircle
} from 'lucide-react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: 'house' | 'apartment' | 'villa';
  image: string;
  description: string;
  features: string[];
  yearBuilt: number;
}

export interface Transaction {
  id: string;
  property: Property;
  buyer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  date: string;
  invoiceNumber: string;
  downPayment: number;
  remaining: number;
  paymentMethod: string;
}

const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Cluster Modern Delons Prime',
    price: 2500000000,
    location: 'Jakarta Selatan',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    type: 'house',
    image: '/images/perumahanbanyak.jpeg',
    description: 'Rumah modern minimalis dengan tata ruang efisien dan visualisasi pencahayaan Lumion 3D.',
    features: ['Garasi 2 mobil', 'Taman belakang', 'Smart home system', 'Security 24 jam'],
    yearBuilt: 2024
  },
  {
    id: '2',
    title: 'Villa Kontemporer Delons Eco',
    price: 4500000000,
    location: 'Bandung',
    bedrooms: 5,
    bathrooms: 4,
    area: 400,
    type: 'villa',
    image: '/images/perumahanbanyak.jpeg',
    description: 'Villa tropis modern terintegrasi dengan pemodelan lanskap 3D arsitektural.',
    features: ['Kolam renang', 'Rooftop Lounge', 'Fully furnished', 'Green Energy'],
    yearBuilt: 2024
  },
  {
    id: '3',
    title: 'Cluster Minimalis Delon',
    price: 1850000000,
    location: 'Surabaya',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    type: 'house',
    image: '/images/gambar_delon.jpeg',
    description: 'Hunian kompak modern dengan pemodelan presisi eksterior dan interior Lumion.',
    features: ['Carport 2 Mobil', 'Taman Depan', 'One Gate System', 'CCTV 24 Jam'],
    yearBuilt: 2024
  },
  {
    id: '4',
    title: 'Villa Panorama Delons',
    price: 3200000000,
    location: 'Malang',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'villa',
    image: '/images/gambar_delon.jpeg',
    description: 'Villa eksklusif dengan view perbukitan hasil simulasi walkthrough 3D.',
    features: ['Private Pool', 'Balkon Luas', 'Smart Door Lock', 'Gazebo'],
    yearBuilt: 2024
  },
  {
    id: '5',
    title: 'Delons Residence Suite A',
    price: 2100000000,
    location: 'Yogyakarta',
    bedrooms: 3,
    bathrooms: 2,
    area: 200,
    type: 'house',
    image: '/images/gambar_dapi.jpeg',
    description: 'Konsep hunian modern berpadu arsitektur tropis berbasis render 3D Lumion.',
    features: ['Solar Panel Ready', 'Taman Samping', 'Clubhouse Access', 'Underground Utilities'],
    yearBuilt: 2024
  },
  {
    id: '6',
    title: 'Delons Residence Suite B',
    price: 2750000000,
    location: 'Semarang',
    bedrooms: 4,
    bathrooms: 3,
    area: 260,
    type: 'villa',
    image: '/images/gambar_dapi.jpeg',
    description: 'Desain fasad geometris modern dengan material tekstur render fotorealistik.',
    features: ['Private Garden', 'Dapur Bersih & Kotor', 'High Ceiling', 'Water Heater'],
    yearBuilt: 2024
  }
];

export default function App() {
  const [properties] = useState<Property[]>(mockProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'invoice' | 'login' | 'register' | 'video' | 'about' | 'services'>('home');

  const isMobile = useIsMobile();

  // State Form Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State Form Register (Lengkap 6 Field Wajib)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const filterProperties = ({
    priceRange,
    propertyType,
    minBedrooms
  }: {
    priceRange?: [number, number];
    propertyType?: string;
    minBedrooms?: number;
  } = {}) => {
    let filtered = properties;
    if (priceRange) {
      filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    }
    if (propertyType && propertyType !== 'all') {
      filtered = filtered.filter(p => p.type === propertyType);
    }
    if (minBedrooms) {
      filtered = filtered.filter(p => p.bedrooms >= minBedrooms);
    }
    setFilteredProperties(filtered);
  };

  const handleCreateInvoice = (property: Property, buyerData: any, paymentData: any) => {
    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      property,
      buyer: buyerData,
      date: new Date().toISOString(),
      invoiceNumber: `INV-${Date.now()}`,
      downPayment: paymentData.downPayment,
      remaining: property.price - paymentData.downPayment,
      paymentMethod: paymentData.paymentMethod
    };
    setTransactions([...transactions, transaction]);
    setCurrentPage('invoice');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      alert('Wajib mengisi seluruh 6 formulir pendaftaran!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Konfirmasi password tidak cocok dengan password utama!');
      return;
    }
    alert('Registrasi akun berhasil! Silakan masuk.');
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full bg-white shadow-xl min-h-screen max-w-7xl flex flex-col">

        {/* Header / Navbar */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setCurrentPage('home')}
            >
              <img
                src="/images/logo_rumah_kita.png"
                alt="Logo Delons Clusters"
                className="w-9 h-9 object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="font-bold text-blue-600 leading-tight text-base md:text-lg">Delons Clusters</h1>
                <p className="text-[10px] text-gray-500 font-medium">3D Architecture & Property Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button onClick={() => setCurrentPage('home')} className={`transition hover:text-blue-600 ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Home</button>
              <button onClick={() => setCurrentPage('services')} className={`transition hover:text-blue-600 ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Layanan</button>
              <button onClick={() => setCurrentPage('video')} className={`transition hover:text-blue-600 ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Video Lumion</button>
              <button onClick={() => setCurrentPage('about')} className={`transition hover:text-blue-600 ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Tentang Kami</button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
                onClick={() => {
                  const phoneNumber = "6281331517717";
                  const message = "Halo Admin Delons Clusters, saya tertarik untuk konsultasi seputar properti 3D Lumion.";
                  window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="size-3.5" /> <span className="hidden sm:inline">Chat Admin</span>
              </Button>

              {isLoggedIn ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsLoggedIn(false);
                    alert('Anda berhasil logout.');
                  }}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogIn className="size-3.5 mr-1 rotate-180" /> Keluar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage('login')}
                  className="text-xs"
                >
                  <LogIn className="size-3.5 mr-1" /> Masuk
                </Button>
              )}

              <Button size="sm" onClick={() => setCurrentPage('invoice')} className="text-xs bg-blue-600 hover:bg-blue-700">
                <FileText className="size-3.5 mr-1" /> Nota
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="p-4 md:p-6 flex-1">

          {/* PAGE: HOME */}
          {currentPage === 'home' && (
            <div className="space-y-8">
              {/* Hero Section dengan Render Lumion */}
              <div
                className="relative rounded-2xl overflow-hidden text-white p-6 md:p-12 shadow-xl bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('/images/perumahanbanyak.jpeg')`
                }}
              >
                <div className="relative z-10 max-w-2xl space-y-4">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-600 px-3 py-1 text-xs">Visualisasi 3D Lumion Eksklusif</Badge>
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    Temukan Hunian Modern Berbasis Desain 3D Realistis
                  </h2>
                  <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                    Eksplorasi masterplan perumahan masa depan dengan visualisasi presisi hasil pemodelan 3D dan simulasi walkthrough Lumion.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs md:text-sm px-5 py-2.5" onClick={() => setCurrentPage('video')}>
                      Tonton Video Walkthrough
                    </Button>
                    <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs md:text-sm px-5 py-2.5" onClick={() => setCurrentPage('services')}>
                      Katalog Layanan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filtering & Property Cards */}
              <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <PropertyFilters onFilterChange={filterProperties} />
                </div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-600 border-b pb-2">
                    <p>Menampilkan <span className="text-blue-600 font-bold">{filteredProperties.length}</span> properti unggulan</p>
                  </div>
                  <PropertyList
                    properties={filteredProperties}
                    onSelectProperty={setSelectedProperty}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAGE: SERVICES */}
          {currentPage === 'services' && (
            <div className="space-y-6 max-w-5xl mx-auto py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Layanan Properti & Desain 3D</h2>
                <p className="text-sm text-gray-600">Solusi menyeluruh dari tahap visualisasi arsitektural hingga serah terima unit.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-4">
                {[
                  { title: 'Jual & Beli Unit Klaster', desc: 'Transaksi unit properti perumahan baru dengan jaminan legalitas SHM dan fasilitas terlengkap.', price: 'Mulai Rp 1.8M / Unit' },
                  { title: 'Jasa Pemodelan 3D & Lumion', desc: 'Layanan visualisasi desain 3D eksterior, interior, hingga video animasi walkthrough sinematik.', price: 'Rp 5.000.000 / Proyek' },
                  { title: 'Konsultasi Arsitektur & KPR', desc: 'Simulasi pembiayaan cicilan properti terstruktur dan konsultasi denah modular bersama tim ahli.', price: 'Gratis Sesi Pertama' },
                  { title: 'Kontraktor & Renovasi Bangunan', desc: 'Pembangunan fisik hunian dengan manajemen material terukur dan pengawasan arsitektur berkala.', price: 'Estimasi RAB Custom' },
                ].map((s, idx) => (
                  <Card key={idx} className="border border-gray-200 shadow-sm hover:shadow-md transition">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-bold text-blue-600 text-sm">{s.price}</span>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">Pilih Layanan</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: VIDEO WALKTHROUGH */}
          {currentPage === 'video' && (
            <div className="space-y-6 max-w-4xl mx-auto py-4 text-center">
              <div className="space-y-2">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Dokumentasi 3D Modeling</Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Video Walkthrough Perumahan Lumion</h2>
                <p className="text-sm text-gray-600">Simulasi pencahayaan, material real-time, dan tata ruang kompleks Delons Clusters.</p>
              </div>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/ng_r31w8AuQ?si=kEFJEdsp4sDV86zm"
                  title="Video Lumion 3D Delons Clusters"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-xs text-gray-500">Kompilasi render 3D Lumion resmi Tugas UAS Desain Pemodelan 3D.</p>
            </div>
          )}

          {/* PAGE: ABOUT TEAM */}
          {currentPage === 'about' && (
            <div className="space-y-8 max-w-5xl mx-auto py-4">
              <div className="text-center space-y-2">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Struktur Tim Pengembang</Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Profil Tim Pengembang Aplikasi</h2>
                <p className="text-sm text-gray-600">Tim Mahasiswa Pengembang Platform Properti 3D - UAS Desain Pemodelan 3D</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Fathurrahman Naufal',
                    nim: '452024611064',
                    role: 'Project Manager & Fullstack',
                    desc: 'Bertanggung jawab atas integrasi sistem platform web, manajemen state data, dan arsitektur aplikasi.',
                    img: '/images/gambar_delon.jpeg'
                  },
                  {
                    name: 'Naufal Aqila',
                    nim: '442024611000',
                    role: '3D & Lumion Specialist',
                    desc: 'Merancang pemodelan objek 3D perumahan, integrasi tekstur material, dan rendering video animasi Lumion.',
                    img: '/images/gambar_delon.jpeg'
                  },
                  {
                    name: 'Muhammad Dafi Al Haq',
                    nim: '452024611000',
                    role: 'UI/UX & Frontend Designer',
                    desc: 'Merancang tata letak antarmuka desktop/mobile, konsistensi token desain, dan alur checkout interaktif.',
                    img: '/images/gambar_dapi.jpeg'
                  },
                ].map((member, idx) => (
                  <Card key={idx} className="text-center p-6 border shadow-sm hover:shadow-md transition">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-2 border-blue-600 shadow-md">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5 mb-1">{member.role}</p>
                    <p className="text-xs text-gray-500 font-mono mb-3">NIM: {member.nim}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{member.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: LOGIN */}
          {currentPage === 'login' && (
            <div
              className="w-full min-h-[78vh] flex items-center justify-center p-4 bg-cover bg-center rounded-2xl shadow-inner"
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url('/images/perumahanbanyak.jpeg')`
              }}
            >
              <Card className="max-w-md w-full bg-white/95 backdrop-blur-md shadow-2xl border-0 p-2">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">Masuk Akun</CardTitle>
                  <p className="text-xs text-gray-500">Akses katalog dan transaksi Delons Clusters</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Email atau Username</label>
                    <Input
                      placeholder="Masukkan email atau username..."
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Password</label>
                    <Input
                      type="password"
                      placeholder="Masukkan password..."
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 shadow-md transition"
                    onClick={() => {
                      if (!loginEmail || !loginPassword) {
                        alert('Silakan masukkan email/username dan password terlebih dahulu!');
                        return;
                      }
                      setIsLoggedIn(true);
                      setCurrentPage('home');
                      alert('Login berhasil! Selamat datang di Delons Clusters.');
                    }}
                  >
                    Masuk Sekarang
                  </Button>
                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-600">
                      Belum memiliki akun?{' '}
                      <button onClick={() => setCurrentPage('register')} className="text-blue-600 font-semibold hover:underline">
                        Daftar Akun Baru
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE: REGISTER (LENGKAP 6 FIELD SESUAI SYARAT UAS) */}
          {currentPage === 'register' && (
            <div
              className="w-full min-h-[78vh] flex items-center justify-center p-4 bg-cover bg-center rounded-2xl shadow-inner my-2"
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url('/images/perumahanbanyak.jpeg')`
              }}
            >
              <Card className="max-w-lg w-full bg-white/95 backdrop-blur-md shadow-2xl border-0 p-2">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">Registrasi Pengguna Baru</CardTitle>
                  <p className="text-xs text-gray-500">Lengkapi 6 data formulir untuk membuat akun platform</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nama Lengkap</label>
                        <Input
                          placeholder="Nama lengkap..."
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Username</label>
                        <Input
                          placeholder="Username unik..."
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Alamat Email</label>
                        <Input
                          type="email"
                          placeholder="nama@email.com..."
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nomor Telepon / WA</label>
                        <Input
                          type="tel"
                          placeholder="081234567890..."
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Password</label>
                        <Input
                          type="password"
                          placeholder="Minimal 8 karakter..."
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Konfirmasi Password</label>
                        <Input
                          type="password"
                          placeholder="Ulangi password..."
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 mt-2 shadow-md transition">
                      Daftar Akun Sekarang
                    </Button>

                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-600">
                        Sudah punya akun?{' '}
                        <button type="button" onClick={() => setCurrentPage('login')} className="text-blue-600 font-semibold hover:underline">
                          Masuk di Sini
                        </button>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE: INVOICE & NOTA */}
          {currentPage === 'invoice' && (
            <SalesInvoice
              transactions={transactions}
              onCreateInvoice={handleCreateInvoice}
              properties={properties}
            />
          )}
        </main>

        {/* Property Detail Modal */}
        {selectedProperty && (
          <PropertyDetail
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onPurchase={(buyerData, paymentData) => {
              handleCreateInvoice(selectedProperty, buyerData, paymentData);
              setSelectedProperty(null);
            }}
          />
        )}

        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <div className="sticky bottom-0 bg-white border-t flex justify-around py-2.5 px-2 z-30 text-[11px] shadow-lg md:hidden">
            <button onClick={() => setCurrentPage('home')} className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Home className="size-4" />
              <span>Home</span>
            </button>
            <button onClick={() => setCurrentPage('services')} className={`flex flex-col items-center gap-1 ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Building2 className="size-4" />
              <span>Layanan</span>
            </button>
            <button onClick={() => setCurrentPage('video')} className={`flex flex-col items-center gap-1 ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
              <Video className="size-4" />
              <span>Video</span>
            </button>
            <button onClick={() => setCurrentPage('about')} className={`flex flex-col items-center gap-1 ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Users className="size-4" />
              <span>Tim</span>
            </button>
            <button onClick={() => setCurrentPage('invoice')} className={`flex flex-col items-center gap-1 ${currentPage === 'invoice' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <FileText className="size-4" />
              <span>Nota</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
