import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, onSnapshot, doc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { PropertyList } from './components/PropertyList';
import { PropertyFilters } from './components/PropertyFilters';
import { PropertyDetail } from './components/PropertyDetail';
import SalesInvoice from './components/SalesInvoice';
import {
  Home, Search, FileText, User, LogIn,
  Video, Users, Building2, Phone, MessageCircle, Mail, MapPin, CheckCircle, ShieldCheck
} from 'lucide-react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';

// --- DATA TYPES ---
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

export interface CurrentUserType {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'user';
}

// 6 PROPERTI ASLI AWAL (Folder public/images/)
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
    image: '/images/rumah-fathur.jpeg',
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
    image: '/images/perumahan-1.jpeg',
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
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Auth & Page State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserType | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'invoice' | 'login' | 'register' | 'video' | 'about' | 'services'>('login');

  // Responsive Hook Inline
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // 1. FIRESTORE REALTIME SYNC (Invoices & Properties)
  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
      if (loaded.length > 0) {
        setTransactions(loaded.reverse());
      }
    });

    return () => unsubInvoices();
  }, []);

  // 2. SEARCH & FILTER HANDLERS
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    let filtered = properties;
    if (query) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredProperties(filtered);
  };

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

  // 3. PURCHASE & INVOICE HANDLER
  const handleCreateInvoice = async (property: Property, buyerData: any, paymentData: any) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    // Pastikan domain email pembeli selalu terisi
    const finalBuyerEmail = buyerData.email
      ? (buyerData.email.includes('@') ? buyerData.email.trim() : `${buyerData.email.trim()}@gmail.com`)
      : (currentUser?.email || 'buyer@gmail.com');

    const newTx: any = {
      id: invoiceNumber,
      invoiceNumber: invoiceNumber,
      property,
      buyer: {
        ...buyerData,
        email: finalBuyerEmail
      },
      buyerName: buyerData.name || currentUser?.fullName || 'Pembeli Delons',
      buyerPhone: buyerData.phone || currentUser?.phone || '081234567890',
      buyerEmail: finalBuyerEmail,
      buyerAddress: buyerData.address || currentUser?.address || 'Kawasan Delons Clusters',
      propertyTitle: property.title,
      propertyLocation: property.location,
      propertyPrice: property.price,
      propertyArea: property.area,
      downPayment: paymentData.downPayment,
      totalPrice: property.price,
      remaining: property.price - paymentData.downPayment,
      paymentMethod: paymentData.paymentMethod,
      date: new Date().toISOString(),
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'invoices', invoiceNumber), newTx);
    } catch (e) {
      console.warn('Fallback lokal invoice:', e);
    }

    setTransactions(prev => [newTx, ...prev]);
    setCurrentPage('invoice');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Main Container */}
      <div className="w-full bg-white shadow-xl min-h-screen max-w-7xl">

        {/* Header / Navbar */}
        <header className="bg-white border-b sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { if (isLoggedIn) setCurrentPage('home'); }}>
              <img
                src="/images/logo-app.png"
                alt="Logo"
                className="w-8 h-8 object-contain rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo_rumah kita.png';
                }}
              />
              <div>
                <h1 className="font-bold text-blue-600 leading-tight">Delons Poenya</h1>
                <p className="text-[10px] text-gray-500">Platform Properti Lumion</p>
              </div>
            </div>

            {/* MENU NAVBAR HANYA MUNCUL JIKA TIDAK DI HALAMAN LOGIN */}
            {currentPage !== 'login' && (
              <>
                {/* Navigation Menu */}
                <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
                  <button onClick={() => setCurrentPage('home')} className={`hover:text-blue-600 ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Home</button>
                  <button onClick={() => setCurrentPage('services')} className={`hover:text-blue-600 ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Layanan</button>
                  <button onClick={() => setCurrentPage('video')} className={`hover:text-blue-600 ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Video Lumion</button>
                  <button onClick={() => setCurrentPage('about')} className={`hover:text-blue-600 ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Tentang Kami</button>
                </nav>

                {/* Navigasi Kanan */}
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
                    <MessageCircle className="size-3" /> Chat Admin
                  </Button>

                  {isLoggedIn ? (
                    <div className="flex items-center gap-2">
                      {/* USER & ROLE BADGE */}
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border rounded-lg text-xs">
                        <User className="size-3 text-blue-600" />
                        <span className="font-semibold text-gray-800">{currentUser?.fullName}</span>
                        <Badge className={`text-[9px] px-1.5 py-0 ${currentUser?.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {currentUser?.role === 'admin' ? 'ADMIN' : 'PEMBELI'}
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsLoggedIn(false);
                          setCurrentUser(null);
                          setCurrentPage('login');
                          alert('Anda telah berhasil Logout.');
                        }}
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <LogIn className="size-3 mr-1 rotate-180" /> Logout
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage('login')}
                      className="text-xs"
                    >
                      <LogIn className="size-3 mr-1" /> Login
                    </Button>
                  )}

                  <Button size="sm" onClick={() => setCurrentPage('invoice')} className="text-xs bg-blue-600">
                    <FileText className="size-3 mr-1" /> Nota
                  </Button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Pages */}
        <main className="p-4">

          {currentPage === 'home' && (
            <div className="space-y-6">
              {/* Hero Section */}
              <div
                className="relative rounded-2xl overflow-hidden text-white p-6 md:p-10 shadow-lg bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('/images/geter-unida.jpeg')`
                }}
              >
                <div className="relative z-10 max-w-xl space-y-3">
                  <Badge className="bg-blue-500 text-white">Visualisasi 3D Lumion</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold">Temukan Hunian Impian Berbasis Model 3D</h2>
                  <p className="text-sm text-blue-100">
                    Jelajahi perumahan eksklusif hasil desain pemodelan 3D dan render Lumion interaktif kelompok kami.
                  </p>
                  <Button className="bg-white text-blue-900 hover:text-white font-semibold text-xs" onClick={() => setCurrentPage('video')}>
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
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <p>Menampilkan {filteredProperties.length} properti unggulan</p>
                  </div>
                  <PropertyList
                    properties={filteredProperties}
                    onSelectProperty={setSelectedProperty}
                  />
                </div>
              </div>
            </div>
          )}

          {currentPage === 'services' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Layanan Properti & Jasa</h2>
                <p className="text-sm text-gray-600">Pilih berbagai layanan profesional seputar perumahan dan pembangunan.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Jual & Beli Rumah', desc: 'Layanan transaksi jual beli rumah baru dan second dengan legalitas aman.', price: 'Mulai 1% Komisi' },
                  { title: 'Sewa Rumah & Apartemen', desc: 'Pilihan sewa harian, bulanan, hingga tahunan di lokasi strategis.', price: 'Mulai Rp 25jt/tahun' },
                  { title: 'Jasa Desain Rumah 3D', desc: 'Pembuatan desain arsitektur dan pemodelan 3D menggunakan Lumion & AutoCAD.', price: 'Rp 5.000.000' },
                  { title: 'Jasa Pembangunan & Renovasi', desc: 'Kontraktor terpercaya untuk pembangunan rumah impian dari nol.', price: 'Estimasi RAB Custom' },
                ].map((s, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">{s.desc}</p>
                      <p className="font-bold text-blue-600 text-sm">{s.price}</p>
                      <Button size="sm" className="w-full">Pilih Layanan</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentPage === 'video' && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Video Walkthrough Lumion 3D</h2>
                <p className="text-sm text-gray-600">Video hasil rendering animasi 3D perumahan kelompok kami.</p>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg flex items-center justify-center relative max-w-4xl mx-auto">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/ng_r31w8AuQ?si=kEFJEdsp4sDV86zm"
                  title="Video Lumion 3D"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-xs text-gray-500">Link terhubung langsung dengan dokumentasi tugas 3D modeling sebelumnya.</p>
            </div>
          )}

          {currentPage === 'about' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Tentang Pengembang Aplikasi</h2>
                <p className="text-sm text-gray-600">Tim Mahasiswa Pengembang Platform Properti 3D (Tugas UAS Desain Pemodelan 3D)</p>
              </div>

              {/* 3 Anggota Tim */}
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: 'Fathurrahman Naufal', nim: '452024611064', role: 'Project Manager & Fullstack', desc: 'Bertanggung jawab atas arsitektur sistem web dan integrasi React.', img: '/images/rumah-fathur.jpeg' },
                  { name: 'Naufal Aqila', nim: '442024611', role: '3D & Lumion Specialist', desc: 'Membuat pemodelan objek 3D rumah dan rendering video Lumion.', img: '/images/rumah-delon.jpeg' },
                  { name: 'M. Davi Al Haq', nim: '452024611', role: 'UI/UX Designer', desc: 'Merancang layout antarmuka website dan mobile design figma.', img: '/images/rumah-dafi.jpeg' },
                ].map((member, idx) => (
                  <Card key={idx} className="text-center p-4">
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-blue-600 shadow-md">
                      <img
                        src={member.img}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/perumahan-1.jpeg';
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    <p className="text-xs text-blue-600 font-medium mb-1">{member.role}</p>
                    <p className="text-xs text-gray-500 mb-2">NIM: {member.nim}</p>
                    <p className="text-xs text-gray-600">{member.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentPage === 'login' && (
            <div
              className="w-full min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 bg-cover bg-center rounded-2xl my-2 gap-6"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/perumahan-1.jpeg')`
              }}
            >
              {/* EFEK TEKS 3D */}
              <div className="text-center space-y-1">
                <h2
                  className="text-2xl md:text-4xl font-black tracking-wider text-amber-400 uppercase"
                  style={{
                    textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15)'
                  }}
                >
                  SELAMAT DATANG
                </h2>
                <h3
                  className="text-xl md:text-3xl font-bold tracking-widest text-white uppercase"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6)'
                  }}
                >
                  DELONS CLUSTERS
                </h3>
              </div>

              {/* Card Form Login */}
              <Card className="max-w-md w-full bg-white/95 backdrop-blur-md shadow-2xl border-0">
                <CardHeader>
                  <CardTitle className="text-center text-xl">Login ke RumahKu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Email / Username</label>
                    <Input
                      placeholder="Masukkan email atau username..."
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Password</label>
                    <Input
                      type="password"
                      placeholder="Masukkan password..."
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      if (!loginEmail || !loginPassword) {
                        alert('Silakan masukkan email dan password terlebih dahulu!');
                        return;
                      }

                      const cleanIdentifier = loginEmail.trim().toLowerCase();
                      const isAdmin = (cleanIdentifier === 'admin') && loginPassword === 'admin123';

                      // Auto format email dengan @gmail.com
                      const formattedEmail = cleanIdentifier.includes('@')
                        ? cleanIdentifier
                        : `${cleanIdentifier}@gmail.com`;

                      const userObj: CurrentUserType = {
                        fullName: isAdmin ? 'Administrator Delons' : (regName || loginEmail.split('@')[0]),
                        email: isAdmin ? 'admin@delonclusters.com' : formattedEmail,
                        phone: regPhone || '081234567890',
                        address: regAddress || 'Kawasan Delons Clusters, Ponorogo',
                        role: isAdmin ? 'admin' : 'user'
                      };

                      setCurrentUser(userObj);
                      setIsLoggedIn(true);
                      setCurrentPage('home');
                      alert(`Login Berhasil! Selamat datang ${isAdmin ? 'Admin' : userObj.fullName}.`);
                    }}
                  >
                    Login
                  </Button>
                  <p className="text-xs text-center text-gray-600">
                    Belum punya akun? <button onClick={() => setCurrentPage('register')} className="text-blue-600 underline font-medium">Daftar di sini</button>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'register' && (
            <div className="max-w-md mx-auto py-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-xl">Daftar Akun Baru</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Nama Lengkap</label>
                    <Input placeholder="Nama lengkap..." value={regName} onChange={(e) => setRegName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Nomor WhatsApp</label>
                    <Input placeholder="08xxxxxxxxxx" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Alamat Domisili</label>
                    <Input placeholder="Alamat lengkap..." value={regAddress} onChange={(e) => setRegAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Email / Username</label>
                    <Input
                      placeholder="Email atau username..."
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Password</label>
                    <Input type="password" placeholder="Buat password..." value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                  </div>
                  <Button
                    className="w-full bg-blue-600"
                    onClick={() => {
                      if (!regName || !regEmail || !regPassword) {
                        alert('Mohon lengkapi nama, email, dan password.');
                        return;
                      }

                      const autoEmail = regEmail.includes('@') ? regEmail.trim() : `${regEmail.trim()}@gmail.com`;
                      setRegEmail(autoEmail);

                      alert('Registrasi Berhasil! Silakan Login.');
                      setCurrentPage('login');
                    }}
                  >
                    Register
                  </Button>
                  <p className="text-xs text-center text-gray-600">
                    Sudah punya akun? <button onClick={() => setCurrentPage('login')} className="text-blue-600 underline font-medium">Login</button>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'invoice' && (
            <SalesInvoice
              invoices={transactions as any}
              onBack={() => setCurrentPage('home')}
            />
          )}
        </main>

        {/* Property Detail Modal */}
        {selectedProperty && (
          <PropertyDetail
            property={selectedProperty}
            currentUser={currentUser}
            onClose={() => setSelectedProperty(null)}
            onPurchase={(buyerData, paymentData) => {
              handleCreateInvoice(selectedProperty, buyerData, paymentData);
              setSelectedProperty(null);
            }}
          />
        )}

        {/* Mobile Bottom Navigation Bar */}
        {isLoggedIn && isMobile && (
          <div className="sticky bottom-0 bg-white border-t flex justify-around py-2 px-1 z-20 text-xs shadow-lg">
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
