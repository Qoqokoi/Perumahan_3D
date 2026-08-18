import React, { useState, useEffect } from 'react';
import { PropertyList } from './components/PropertyList';
import { PropertyFilters } from './components/PropertyFilters';
import { PropertyDetail } from './components/PropertyDetail';
import { SalesInvoice } from './components/SalesInvoice';
import { useIsMobile } from './components/ui/use-mobile';
import {
  Home, FileText, LogIn,
  Video, Users, Building2, MessageCircle, ShieldCheck, UploadCloud, CheckCircle2
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

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  nik: string;
  address: string;
  occupation: string;
  isKtpVerified: boolean;
}

export interface Transaction {
  id: string;
  property: Property;
  buyer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    nik?: string;
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
    image: '/images/rumah-delon.jpeg',
    description: 'Hunian kompak modern dengan pemodelan presisi eksterior dan interior Lumion.',
    features: ['Carport 2 Mobil', 'Taman Depan', 'One Gate System', 'CCTV 24 Jam'],
    yearBuilt: 2024
  },
  {
    id: '4',
    title: 'Villa Panorama Delons',
    price: 3200000000,
    location: 'Jember',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'apartment',
    image: '/images/rumah-delon.jpeg',
    description: 'Villa eksklusif dengan view perbukitan hasil simulasi walkthrough 3D.',
    features: ['Private Pool', 'Balkon Luas', 'Smart Door Lock', 'Gazebo'],
    yearBuilt: 2024
  },
  {
    id: '5',
    title: 'Delons Residence Suite A',
    price: 2100000000,
    location: 'Bandung',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'villa',
    image: '/images/rumah-dafi.jpeg',
    description: 'Konsep hunian modern berpadu arsitektur tropis berbasis render 3D Lumion.',
    features: ['Solar Panel Ready', 'Taman Samping', 'Clubhouse Access', 'Underground Utilities'],
    yearBuilt: 2024
  },
  {
    id: '6',
    title: 'Delons Residence Suite B',
    price: 2750000000,
    location: 'Tasikmalaya',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'villa',
    image: '/images/rumah-dafi.jpeg',
    description: 'Desain fasad geometris modern dengan material tekstur render fotorealistik.',
    features: ['Private Garden', 'Dapur Bersih & Kotor', 'High Ceiling', 'Water Heater'],
    yearBuilt: 2024
  }
];

type PageType = 'home' | 'invoice' | 'login' | 'register' | 'video' | 'about' | 'services';

export default function App() {
  const [properties] = useState<Property[]>(mockProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Auth & Profile State (Default mock user jika langsung login)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    fullName: 'Muhammad Dafi Al Haq',
    username: 'dafi_buyer',
    email: 'dafi@gmail.com',
    phone: '081234567890',
    nik: '3201123456780001',
    address: 'Jl. Pemuda No. 45, Bandung',
    occupation: 'Software Engineer',
    isKtpVerified: true
  });

  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const isMobile = useIsMobile();

  // 1. Integrasi History API untuk Browser Back / Forward Button
  const navigateTo = (page: PageType, replace = false) => {
    if (page === currentPage) return;
    if (replace) {
      window.history.replaceState({ page }, '', `#${page}`);
    } else {
      window.history.pushState({ page }, '', `#${page}`);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Sinkronisasi state awal hash
    const currentHash = window.location.hash.replace('#', '') as PageType;
    if (currentHash && ['home', 'invoice', 'login', 'register', 'video', 'about', 'services'].includes(currentHash)) {
      setCurrentPage(currentHash);
    } else {
      window.history.replaceState({ page: 'home' }, '', '#home');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
      } else {
        const hash = window.location.hash.replace('#', '') as PageType;
        if (hash) setCurrentPage(hash);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Form State Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form State Register (Lengkap Standar Verifikasi Properti / KPR)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regKtpUploaded, setRegKtpUploaded] = useState(false);
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

  // Auto-Generated Invoice dari Pemesanan Properti
  const handleCreateInvoice = (property: Property, buyerData: any, paymentData: any) => {
    const finalBuyer = {
      name: buyerData?.name || currentUser.fullName,
      phone: buyerData?.phone || currentUser.phone,
      email: buyerData?.email || currentUser.email,
      address: buyerData?.address || currentUser.address,
      nik: currentUser.nik
    };

    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      property,
      buyer: finalBuyer,
      date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      invoiceNumber: `INV-DELONS-${Math.floor(100000 + Math.random() * 900000)}`,
      downPayment: paymentData.downPayment,
      remaining: property.price - paymentData.downPayment,
      paymentMethod: paymentData.paymentMethod
    };
    setTransactions([transaction, ...transactions]);
    navigateTo('invoice');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regEmail || !regPhone || !regNik || !regAddress || !regPassword || !regConfirmPassword) {
      alert('Wajib melengkapi semua formulir identitas KTP & Kontak!');
      return;
    }
    if (regNik.length !== 16) {
      alert('Format NIK KTP wajib 16 digit angka!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Konfirmasi Password tidak sesuai!');
      return;
    }

    // Set user profile & otomatis auto-login
    const newUser: UserProfile = {
      fullName: regFullName,
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      nik: regNik,
      address: regAddress,
      occupation: regOccupation || 'Wiraswasta / Profesional',
      isKtpVerified: regKtpUploaded
    };

    setCurrentUser(newUser);
    setIsLoggedIn(true);
    alert(`Registrasi Berhasil! Identitas atas nama ${newUser.fullName} telah tersinkronisasi.`);
    navigateTo('home');
  };

  const handleServiceOrder = (serviceTitle: string) => {
    const message = `Halo Admin Delons Clusters, saya atas nama *${currentUser.fullName}* (${currentUser.phone}) ingin konsultasi dan pemesanan layanan *${serviceTitle}*. Mohon info prosedurnya.`;
    window.open(`https://wa.me/6281331517717?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Cek apakah di halaman auth (Login/Register)
  const isAuthPage = currentPage === 'login' || currentPage === 'register';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full bg-white shadow-xl min-h-screen max-w-7xl flex flex-col">

        {/* 2. NAVBAR HANYA MUNCUL DI LUAR HALAMAN LOGIN & REGISTER */}
        {!isAuthPage && (
          <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigateTo('home')}
              >
                <img
                  src="/images/logo-app.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain rounded-md"
                />
                <div>
                  <h1 className="font-bold text-blue-600 leading-tight text-base">Delons Clusters</h1>
                  <p className="text-[10px] text-gray-500 font-medium">Platform Properti Lumion 3D</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <button onClick={() => navigateTo('home')} className={`hover:text-blue-600 transition ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Home</button>
                <button onClick={() => navigateTo('services')} className={`hover:text-blue-600 transition ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Layanan</button>
                <button onClick={() => navigateTo('video')} className={`hover:text-blue-600 transition ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Video Lumion</button>
                <button onClick={() => navigateTo('about')} className={`hover:text-blue-600 transition ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Tentang Kami</button>
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                  onClick={() => handleServiceOrder("Konsultasi Umum Properti 3D")}
                >
                  <MessageCircle className="size-3.5" /> <span className="hidden sm:inline">Chat Admin</span>
                </Button>

                {isLoggedIn ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsLoggedIn(false);
                      alert('Anda telah berhasil keluar dari akun.');
                      navigateTo('login');
                    }}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogIn className="size-3.5 mr-1 rotate-180" /> Logout ({currentUser.username})
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigateTo('login')}
                    className="text-xs"
                  >
                    <LogIn className="size-3.5 mr-1" /> Masuk
                  </Button>
                )}

                <Button size="sm" onClick={() => navigateTo('invoice')} className="text-xs bg-blue-600 hover:bg-blue-700">
                  <FileText className="size-3.5 mr-1" /> Nota ({transactions.length})
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="p-4 md:p-6 flex-1 flex flex-col">

          {/* PAGE: HOME */}
          {currentPage === 'home' && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div
                className="relative rounded-2xl overflow-hidden text-white p-6 md:p-10 shadow-lg bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/geter-unida.jpeg')`
                }}
              >
                <div className="relative z-10 max-w-xl space-y-3">
                  <Badge className="bg-blue-600 text-white">Visualisasi 3D Lumion Eksklusif</Badge>
                  <h2 className="text-2xl md:text-4xl font-bold">Temukan Hunian Impian Berbasis Model 3D</h2>
                  <p className="text-sm text-gray-200">
                    Jelajahi perumahan eksklusif hasil desain pemodelan 3D dan render Lumion interaktif kelompok kami.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button className="bg-white text-blue-900 hover:bg-gray-100 font-semibold text-xs" onClick={() => navigateTo('video')}>
                      Tonton Video Lumion
                    </Button>
                    <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/40 text-xs" onClick={() => navigateTo('services')}>
                      Lihat Layanan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Property Filter & List Grid */}
              <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <PropertyFilters onFilterChange={filterProperties} />
                </div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex justify-between items-center text-sm text-gray-600 border-b pb-2">
                    <p>Menampilkan <span className="font-semibold text-blue-600">{filteredProperties.length}</span> unit klaster 3D</p>
                  </div>
                  <PropertyList
                    properties={filteredProperties}
                    onSelectProperty={(prop) => {
                      if (!isLoggedIn) {
                        alert('Silakan Masuk / Registrasi terlebih dahulu untuk melihat detail dan transaksi unit!');
                        navigateTo('login');
                        return;
                      }
                      setSelectedProperty(prop);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAGE: SERVICES (Layanan Sekarang Bisa Diklik & Langsung Reservasi) */}
          {currentPage === 'services' && (
            <div className="space-y-6 max-w-4xl mx-auto py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Layanan Properti & Desain 3D</h2>
                <p className="text-sm text-gray-600">Pilih layanan profesional arsitektur dan pembangunan unit.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Jual & Beli Unit Rumah 3D', desc: 'Layanan pemesanan unit klaster Delons dengan verifikasi legalitas dan serah terima kunci.', price: 'Sesuai Harga Unit' },
                  { title: 'Jasa Desain Arsitektur & Render Lumion', desc: 'Pembuatan pemodelan 3D eksterior/interior, denah teknis, dan video walkthrough kualitas HD.', price: 'Mulai Rp 5.000.000' },
                  { title: 'Konsultasi Pengajuan KPR & Legalitas', desc: 'Pendampingan akad kredit bank, sertifikat SHM/IMB, dan kalkulasi uang muka terstruktur.', price: 'Gratis Khusus Anggota' },
                  { title: 'Kontraktor & Custom Renovasi', desc: 'Pembangunan fisik hunian dari nol berbasis blueprint pemodelan 3D dengan jaminan mutu material.', price: 'Estimasi RAB Custom' },
                ].map((s, idx) => (
                  <Card key={idx} className="shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="font-bold text-blue-600 text-sm">{s.price}</p>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                          onClick={() => handleServiceOrder(s.title)}
                        >
                          Pilih Layanan
                        </Button>
                      </div>
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
              <p className="text-xs text-gray-500">Dokumentasi Tugas UAS Desain Pemodelan 3D.</p>
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
                  { name: 'Naufal Aqila', nim: '442024611000', role: '3D & Lumion Specialist', desc: 'Membuat pemodelan objek 3D rumah dan rendering video Lumion.', img: '/images/rumah-delon.jpeg' },
                  { name: 'Muhammad Dafi Al Haq', nim: '452024611000', role: 'UI/UX Designer', desc: 'Merancang layout antarmuka website dan mobile design figma.', img: '/images/rumah-dafi.jpeg' },
                ].map((member, idx) => (
                  <Card key={idx} className="text-center p-5 shadow-sm hover:shadow-md transition">
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-blue-600 shadow-md">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    <p className="text-xs text-blue-600 font-medium mb-1">{member.role}</p>
                    <p className="text-xs text-gray-500 mb-2 font-mono">NIM: {member.nim}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{member.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: LOGIN (ISOLATED VIEW / NO NAVBAR) */}
          {currentPage === 'login' && (
            <div
              className="flex-1 w-full min-h-[90vh] flex flex-col items-center justify-center py-10 px-4 bg-cover bg-center rounded-2xl"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/perumahan-1.jpeg')`
              }}
            >
              <Card className="max-w-md w-full bg-white/95 backdrop-blur-md shadow-2xl border-0 p-2">
                <CardHeader className="text-center space-y-1">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-1 font-bold text-xl">
                    DC
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Masuk ke Delons Clusters</CardTitle>
                  <p className="text-xs text-gray-500">Portal Pemesanan Properti & Desain 3D</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Email atau Username</label>
                    <Input
                      placeholder="Masukkan email / username..."
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
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
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-2 font-medium"
                    onClick={() => {
                      if (!loginIdentifier || !loginPassword) {
                        alert('Silakan isi email/username dan password!');
                        return;
                      }
                      setIsLoggedIn(true);
                      alert(`Login Berhasil! Selamat datang kembali, ${currentUser.fullName}.`);
                      navigateTo('home');
                    }}
                  >
                    Masuk Sekarang
                  </Button>

                  <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t">
                    <button onClick={() => navigateTo('home')} className="text-gray-500 hover:text-gray-800">
                      ← Kembali ke Beranda
                    </button>
                    <span>
                      Belum punya akun? <button onClick={() => navigateTo('register')} className="text-blue-600 font-bold hover:underline">Daftar KTP</button>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE: REGISTER (VERIFIKASI LENGKAP: NIK, ALAMAT, PEKERJAAN, KTP) */}
          {currentPage === 'register' && (
            <div
              className="flex-1 w-full min-h-[90vh] flex items-center justify-center py-8 px-4 bg-cover bg-center rounded-2xl"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('/images/perumahan-1.jpeg')`
              }}
            >
              <Card className="max-w-2xl w-full bg-white/95 backdrop-blur-md shadow-2xl border-0 p-2 my-4">
                <CardHeader className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-xs mb-1">
                    <ShieldCheck className="size-4" /> Registrasi Akun Terverifikasi
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Formulir Identitas Pembeli Properti</CardTitle>
                  <p className="text-xs text-gray-500">Data terintegrasi otomatis dengan nota transaksi KPR / Pembelian Unit</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">

                    {/* Baris 1: Nama & Username */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nama Lengkap (Sesuai KTP) *</label>
                        <Input placeholder="Muhammad Dafi Al Haq" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Username Akun *</label>
                        <Input placeholder="dafi_alhaq" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
                      </div>
                    </div>

                    {/* Baris 2: NIK KTP & Pekerjaan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nomor Induk Kependudukan (NIK 16 Digit) *</label>
                        <Input
                          placeholder="3201xxxxxxxxxxxx"
                          maxLength={16}
                          value={regNik}
                          onChange={(e) => setRegNik(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Profesi / Pekerjaan</label>
                        <Input placeholder="PNS / Pegawai Swasta / Wiraswasta" value={regOccupation} onChange={(e) => setRegOccupation(e.target.value)} />
                      </div>
                    </div>

                    {/* Baris 3: Email & Telepon */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Alamat Email Aktif *</label>
                        <Input type="email" placeholder="nama@gmail.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nomor WhatsApp / HP *</label>
                        <Input type="tel" placeholder="08xxxxxxxxxx" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                      </div>
                    </div>

                    {/* Baris 4: Alamat Domisili KTP */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Alamat Lengkap Domisili KTP *</label>
                      <Input placeholder="Jl. Sudirman No. 12, RT 01/RW 04, Kelurahan, Kecamatan, Kota" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} />
                    </div>

                    {/* Baris 5: Simulasi Scan/Upload KTP */}
                    <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <UploadCloud className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">Verifikasi Dokumen E-KTP / Wajah</p>
                          <p className="text-[10px] text-gray-500">Upload foto KTP asli untuk validasi nota transaksi hukum</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={regKtpUploaded ? "secondary" : "outline"}
                        className={`text-xs ${regKtpUploaded ? 'text-green-700 bg-green-100 border-green-300' : ''}`}
                        onClick={() => setRegKtpUploaded(!regKtpUploaded)}
                      >
                        {regKtpUploaded ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5" /> Terupload</span>
                        ) : 'Pilih File'}
                      </Button>
                    </div>

                    {/* Baris 6: Password & Confirm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Kata Sandi *</label>
                        <Input type="password" placeholder="Minimal 8 karakter..." value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Ulangi Kata Sandi *</label>
                        <Input type="password" placeholder="Konfirmasi kata sandi..." value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-2.5 shadow-md">
                      Daftar & Verifikasi Akun Pembeli
                    </Button>

                    <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t">
                      <button type="button" onClick={() => navigateTo('home')} className="text-gray-500 hover:text-gray-800">
                        ← Kembali ke Beranda
                      </button>
                      <span>
                        Sudah punya akun? <button type="button" onClick={() => navigateTo('login')} className="text-blue-600 font-bold hover:underline">Masuk</button>
                      </span>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE: INVOICE (Otomatis Menampilkan Transaksi Pemesanan Properti) */}
          {currentPage === 'invoice' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Arsip Nota & Riwayat Transaksi</h2>
                  <p className="text-xs text-gray-500">Nota otomatis terbit saat Anda melakukan booking unit pada katalog properti.</p>
                </div>
                <Button size="sm" onClick={() => navigateTo('home')} className="text-xs bg-gray-900 text-white">
                  + Pesan Unit Lain
                </Button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <FileText className="size-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="font-semibold text-gray-700">Belum Ada Transaksi Pemesanan</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Silakan pilih salah satu klaster hunian 3D di katalog, lalu klik "Pesan Unit Sekarang" untuk menerbitkan nota otomatis.
                  </p>
                  <Button size="sm" className="bg-blue-600 text-xs" onClick={() => navigateTo('home')}>
                    Buka Katalog Properti
                  </Button>
                </div>
              ) : (
                <SalesInvoice
                  transactions={transactions}
                  onCreateInvoice={handleCreateInvoice}
                  properties={properties}
                />
              )}
            </div>
          )}
        </main>

        {/* Modal Detail Properti (Auto-Fill Data Pembeli dari State Profil Terdaftar) */}
        {selectedProperty && (
          <PropertyDetail
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onPurchase={(buyerData, paymentData) => {
              // Otomatis pakai data akun yang sedang login jika form kosong
              const payloadBuyer = {
                name: buyerData?.name || currentUser.fullName,
                phone: buyerData?.phone || currentUser.phone,
                email: buyerData?.email || currentUser.email,
                address: buyerData?.address || currentUser.address,
              };
              handleCreateInvoice(selectedProperty, payloadBuyer, paymentData);
              setSelectedProperty(null);
            }}
          />
        )}

        {/* Mobile Bottom Navigation (Hanya Muncul Jika Bukan di Halaman Auth) */}
        {!isAuthPage && isMobile && (
          <div className="sticky bottom-0 bg-white border-t flex justify-around py-2 px-1 z-30 text-xs shadow-lg md:hidden">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Home className="size-5" />
              <span>Home</span>
            </button>
            <button onClick={() => navigateTo('services')} className={`flex flex-col items-center ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Building2 className="size-5" />
              <span>Layanan</span>
            </button>
            <button onClick={() => navigateTo('video')} className={`flex flex-col items-center ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Video className="size-5" />
              <span>Video</span>
            </button>
            <button onClick={() => navigateTo('about')} className={`flex flex-col items-center ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Users className="size-5" />
              <span>Tim</span>
            </button>
            <button onClick={() => navigateTo('invoice')} className={`flex flex-col items-center ${currentPage === 'invoice' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <FileText className="size-5" />
              <span>Nota</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
