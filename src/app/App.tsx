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
    title: 'Rumah Modern Fathur',
    price: 2500000000,
    location: 'Jakarta Selatan',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    type: 'house',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    description: 'Rumah modern minimalis dengan desain kontemporer berbasis render Lumion di kawasan elite.',
    features: ['Garasi 2 mobil', 'Taman belakang', 'Smart home', 'Security 24 jam'],
    yearBuilt: 2022
  },
  {
    id: '2',
    title: 'Rumah Tradisional Fathur',
    price: 5000000000,
    location: 'Bali',
    bedrooms: 5,
    bathrooms: 4,
    area: 400,
    type: 'house',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
    description: 'Villa mewah dengan pemandangan sawah dan kolam renang pribadi hasil pemodelan 3D.',
    features: ['Kolam renang', 'View sawah', 'Fully furnished', 'Dekat pantai'],
    yearBuilt: 2021
  },
  {
    id: '3',
    title: 'Villa Impian Delons',
    price: 3500000000,
    location: 'Surabaya',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'apartment',
    image: '/images/rumah-delon.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
    yearBuilt: 2024
  },
  {
    id: '4',
    title: 'Villa Impian Delons',
    price: 3500000000,
    location: 'Jember',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'apartment',
    image: '/images/rumah-delon.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
    yearBuilt: 2024
  },
  {
    id: '5',
    title: 'Villa Impian Davi',
    price: 3500000000,
    location: 'Bandung',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'villa',
    image: '/images/rumah-dafi.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
    yearBuilt: 2024
  },
  {
    id: '6',
    title: 'Villa Impian Davi',
    price: 3500000000,
    location: 'Tasikmalaya',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'villa',
    image: '/images/rumah-dafi.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
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

  // Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
      alert('Semua 6 kolom registrasi wajib diisi!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Password dan Konfirmasi Password tidak sesuai!');
      return;
    }
    alert('Registrasi Berhasil! Silakan Login.');
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full bg-white shadow-xl min-h-screen max-w-7xl flex flex-col">

        {/* Header / Navbar */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setCurrentPage('home')}
            >
              <img
                src="/images/logo-app.png"
                alt="Logo"
                className="w-8 h-8 object-contain rounded-md"
              />
              <div>
                <h1 className="font-bold text-blue-600 leading-tight">Delons Clusters</h1>
                <p className="text-[10px] text-gray-500">Platform Properti Lumion</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              <button onClick={() => setCurrentPage('home')} className={`hover:text-blue-600 transition ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Home</button>
              <button onClick={() => setCurrentPage('services')} className={`hover:text-blue-600 transition ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Layanan</button>
              <button onClick={() => setCurrentPage('video')} className={`hover:text-blue-600 transition ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Video Lumion</button>
              <button onClick={() => setCurrentPage('about')} className={`hover:text-blue-600 transition ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Tentang Kami</button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                onClick={() => {
                  const phoneNumber = "6281331517717";
                  const message = "Halo Admin Delons Clusters, saya ingin konsultasi dan tanya seputar properti 3D Lumion.";
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
                    alert('Anda telah berhasil Logout.');
                  }}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogIn className="size-3.5 mr-1 rotate-180" /> Logout
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage('login')}
                  className="text-xs"
                >
                  <LogIn className="size-3.5 mr-1" /> Login
                </Button>
              )}

              <Button size="sm" onClick={() => setCurrentPage('invoice')} className="text-xs bg-blue-600 hover:bg-blue-700">
                <FileText className="size-3.5 mr-1" /> Nota
              </Button>
            </div>
          </div>
        </header>

        {/* Content Pages */}
        <main className="p-4 md:p-6 flex-1">

          {/* PAGE: HOME */}
          {currentPage === 'home' && (
            <div className="space-y-6">
              <div
                className="relative rounded-2xl overflow-hidden text-white p-6 md:p-10 shadow-lg bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('/images/geter-unida.jpeg')`
                }}
              >
                <div className="relative z-10 max-w-xl space-y-3">
                  <Badge className="bg-blue-600 text-white">Visualisasi 3D Lumion</Badge>
                  <h2 className="text-2xl md:text-4xl font-bold">Temukan Hunian Impian Berbasis Model 3D</h2>
                  <p className="text-sm text-gray-200">
                    Jelajahi perumahan eksklusif hasil desain pemodelan 3D dan render Lumion interaktif kelompok kami.
                  </p>
                  <Button className="bg-white text-blue-900 hover:bg-gray-100 font-semibold text-xs mt-2" onClick={() => setCurrentPage('video')}>
                    Tonton Video Lumion
                  </Button>
                </div>
              </div>

              {/* Property Filter & List Grid */}
              <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <PropertyFilters onFilterChange={filterProperties} />
                </div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex justify-between items-center text-sm text-gray-600 border-b pb-2">
                    <p>Menampilkan <span className="font-semibold text-blue-600">{filteredProperties.length}</span> properti unggulan</p>
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
            <div className="space-y-6 max-w-4xl mx-auto py-2">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Layanan Properti & Jasa</h2>
                <p className="text-sm text-gray-600">Pilih berbagai layanan profesional seputar perumahan dan pembangunan.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Jual & Beli Rumah', desc: 'Layanan transaksi jual beli rumah baru dan second dengan legalitas aman.', price: 'Mulai 1% Komisi' },
                  { title: 'Sewa Rumah & Apartemen', desc: 'Pilihan sewa harian, bulanan, hingga tahunan di lokasi strategis.', price: 'Mulai Rp 25jt/tahun' },
                  { title: 'Jasa Desain Rumah 3D', desc: 'Pembuatan desain arsitektur dan pemodelan 3D menggunakan Lumion & AutoCAD.', price: 'Rp 5.000.000' },
                  { title: 'Jasa Pembangunan & Renovasi', desc: 'Kontraktor terpercaya untuk pembangunan rumah impian dari nol.', price: 'Estimasi RAB Custom' },
                ].map((s, idx) => (
                  <Card key={idx} className="shadow-sm hover:shadow-md transition">
                    <CardHeader>
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">{s.desc}</p>
                      <p className="font-bold text-blue-600 text-sm">{s.price}</p>
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Pilih Layanan</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: VIDEO */}
          {currentPage === 'video' && (
            <div className="space-y-6 max-w-4xl mx-auto py-2 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold">Video Walkthrough Lumion 3D</h2>
                <p className="text-sm text-gray-600">Video hasil rendering animasi 3D perumahan kelompok kami.</p>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg flex items-center justify-center relative">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/ng_r31w8AuQ?si=kEFJEdsp4sDV86zm"
                  title="Video Lumion 3D"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-xs text-gray-500">Link terhubung langsung dengan dokumentasi tugas 3D modeling kelompok.</p>
            </div>
          )}

          {/* PAGE: ABOUT TEAM */}
          {currentPage === 'about' && (
            <div className="space-y-6 max-w-5xl mx-auto py-2">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold">Tentang Pengembang Aplikasi</h2>
                <p className="text-sm text-gray-600">Tim Mahasiswa Pengembang Platform Properti 3D (Tugas UAS Desain Pemodelan 3D)</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: 'Fathurrahman Naufal', nim: '452024611064', role: 'Project Manager & Fullstack', desc: 'Bertanggung jawab atas arsitektur sistem web dan integrasi React.', img: '/images/rumah-fathur.jpeg' },
                  { name: 'Naufal Aqila', nim: '442024611', role: '3D & Lumion Specialist', desc: 'Membuat pemodelan objek 3D rumah dan rendering video Lumion.', img: '/images/rumah-delon.jpeg' },
                  { name: 'M. Davi Al Haq', nim: '452024611', role: 'UI/UX Designer', desc: 'Merancang layout antarmuka website dan mobile design figma.', img: '/images/rumah-dafi.jpeg' },
                ].map((member, idx) => (
                  <Card key={idx} className="text-center p-5 shadow-sm hover:shadow-md transition">
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-blue-600 shadow-md">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    <p className="text-xs text-blue-600 font-medium mb-1">{member.role}</p>
                    <p className="text-xs text-gray-500 mb-2">NIM: {member.nim}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{member.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: LOGIN */}
          {currentPage === 'login' && (
            <div
              className="w-full min-h-[75vh] flex items-center justify-center py-10 px-4 bg-cover bg-center rounded-2xl my-2"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('/images/perumahan-1.jpeg')`
              }}
            >
              <Card className="max-w-md w-full bg-white/95 backdrop-blur-md shadow-2xl border-0">
                <CardHeader className="text-center space-y-1">
                  <CardTitle className="text-2xl font-bold">Masuk ke Delons Clusters</CardTitle>
                  <p className="text-xs text-gray-500">Akses katalog dan transaksi pemodelan 3D</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Email atau Username</label>
                    <Input placeholder="Masukkan email..." value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Password</label>
                    <Input type="password" placeholder="Masukkan password..." value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                    onClick={() => {
                      if (!loginEmail || !loginPassword) {
                        alert('Silakan masukkan email dan password terlebih dahulu!');
                        return;
                      }
                      setIsLoggedIn(true);
                      setCurrentPage('home');
                      alert('Login Berhasil!');
                    }}
                  >
                    Login
                  </Button>
                  <p className="text-xs text-center text-gray-600 pt-2">
                    Belum punya akun? <button onClick={() => setCurrentPage('register')} className="text-blue-600 font-semibold hover:underline">Daftar di sini</button>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE: REGISTER (6 FIELD LENGKAP) */}
          {currentPage === 'register' && (
            <div
              className="w-full min-h-[75vh] flex items-center justify-center py-10 px-4 bg-cover bg-center rounded-2xl my-2"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('/images/perumahan-1.jpeg')`
              }}
            >
              <Card className="max-w-lg w-full bg-white/95 backdrop-blur-md shadow-2xl border-0">
                <CardHeader className="text-center space-y-1">
                  <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
                  <p className="text-xs text-gray-500">Lengkapi data pendaftaran akun platform</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nama Lengkap</label>
                        <Input placeholder="Nama lengkap..." value={regFullName} onChange={(e) => setRegFullName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Username</label>
                        <Input placeholder="Username..." value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Email</label>
                        <Input type="email" placeholder="Email aktif..." value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nomor HP / WA</label>
                        <Input type="tel" placeholder="08xxxxxxxxxx..." value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Password</label>
                        <Input type="password" placeholder="Password..." value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Konfirmasi Password</label>
                        <Input type="password" placeholder="Ulangi password..." value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-3">
                      Register
                    </Button>
                    <p className="text-xs text-center text-gray-600 pt-2">
                      Sudah punya akun? <button type="button" onClick={() => setCurrentPage('login')} className="text-blue-600 font-semibold hover:underline">Login</button>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE: INVOICE */}
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
          <div className="sticky bottom-0 bg-white border-t flex justify-around py-2 px-1 z-20 text-xs shadow-lg md:hidden">
            <button onClick={() => setCurrentPage('home')} className={`flex flex-col items-center ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Home className="size-5" />
              <span>Home</span>
            </button>
            <button onClick={() => setCurrentPage('services')} className={`flex flex-col items-center ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Building2 className="size-5" />
              <span>Layanan</span>
            </button>
            <button onClick={() => setCurrentPage('video')} className={`flex flex-col items-center ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Video className="size-5" />
              <span>Video</span>
            </button>
            <button onClick={() => setCurrentPage('about')} className={`flex flex-col items-center ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Users className="size-5" />
              <span>Tim</span>
            </button>
            <button onClick={() => setCurrentPage('invoice')} className={`flex flex-col items-center ${currentPage === 'invoice' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <FileText className="size-5" />
              <span>Nota</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
