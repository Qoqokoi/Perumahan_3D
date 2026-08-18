import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  collection, onSnapshot, doc, setDoc, updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import {
  Home, Building2, Search, Filter, ShieldCheck, UserCheck,
  LogIn, LogOut, User, Plus, Trash2, Camera, RefreshCw,
  FileText, Eye, Check, X, Lock, Phone, Mail, MapPin, Bed, Bath, Maximize2
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { PropertyDetail } from './components/PropertyDetail';
import SalesInvoices from './components/SalesInvoice';

// --- DATA TYPES ---
export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt: number;
  image: string;
  description: string;
  features: string[];
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  nik: string;
  role: 'admin' | 'user';
  status: 'approved' | 'pending' | 'rejected';
  ktpImage?: string;
  selfieImage?: string;
  createdAt?: any;
}

export interface Invoice {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: number;
  propertyArea: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerAddress: string;
  buyerNik: string;
  downPayment: number;
  paymentMethod: string;
  totalPrice: number;
  date: any;
  createdAt?: any;
}

// --- INITIAL FALLBACK DATA ---
const defaultProperties: Property[] = [
  {
    id: 'PROP-01',
    title: 'Cluster Asteria Deluxe 3D',
    price: 1850000000,
    location: 'Kawasan Delon Hill Blok A-1',
    bedrooms: 4,
    bathrooms: 3,
    area: 160,
    yearBuilt: 2026,
    image: '/images/perumahanbanyak.jpeg',
    description: 'Hunian modern dengan fasad 3D kontemporer, pencahayaan alami optimal, dan sistem smart home mandiri.',
    features: ['Smart Door Lock', 'Rooftop Lounge', 'Solar Panel Ready', 'Carport 2 Mobil']
  },
  {
    id: 'PROP-02',
    title: 'Grand Celestia Minimalist',
    price: 1250000000,
    location: 'Kawasan Delon Hill Blok B-4',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    yearBuilt: 2026,
    image: '/images/perumahanbanyak.jpeg',
    description: 'Desain minimalis berestetika tinggi yang mengedepankan efisiensi sirkulasi udara dan ruang terbuka hijau.',
    features: ['Inner Courtyard', 'Underground Utilities', 'Keamanan 24 Jam CCTV', 'Instalasi Water Heater']
  },
  {
    id: 'PROP-03',
    title: 'Villa Elysium Luxury Residence',
    price: 2950000000,
    location: 'Kawasan Delon Lakeview Kav. 08',
    bedrooms: 5,
    bathrooms: 4,
    area: 280,
    yearBuilt: 2026,
    image: '/images/perumahanbanyak.jpeg',
    description: 'Arsitektur mewah privat dengan pemandangan danau buatan dan ruang keluarga double-height ceiling.',
    features: ['Private Swimming Pool', 'Balkon Kaca Tempered', 'Kamar Mandi Ensuite', 'Garasi Tertutup']
  },
  {
    id: 'PROP-04',
    title: 'The Orchard Compact Home',
    price: 890000000,
    location: 'Kawasan Delon Valley Blok C-12',
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    yearBuilt: 2026,
    image: '/images/perumahanbanyak.jpeg',
    description: 'Solusi hunian pertama berdaya guna tinggi dengan tata ruang modular yang siap dikembangkan.',
    features: ['Taman Depan & Belakang', 'One Gate System', 'PAM Mandiri Terfilter', 'Kitchen Set Siap Pakai']
  }
];

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'catalogue' | 'invoices' | 'admin' | 'register'>('catalogue');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Firestore Data Collections
  const [properties, setProperties] = useState<Property[]>(defaultProperties);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(3500000000);

  // Auth Form States
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Register / E-KYC States
  const [regFullName, setRegFullName] = useState<string>('');
  const [regNik, setRegNik] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [ktpImage, setKtpImage] = useState<string>('');
  const [selfieImage, setSelfieImage] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<'ktp' | 'selfie' | null>(null);

  // Admin New Property Form States
  const [newPropTitle, setNewPropTitle] = useState<string>('');
  const [newPropPrice, setNewPropPrice] = useState<string>('');
  const [newPropLocation, setNewPropLocation] = useState<string>('');
  const [newPropBedrooms, setNewPropBedrooms] = useState<string>('3');
  const [newPropBathrooms, setNewPropBathrooms] = useState<string>('2');
  const [newPropArea, setNewPropArea] = useState<string>('120');
  const [newPropImage, setNewPropImage] = useState<string>('/images/perumahanbanyak.jpeg');
  const [newPropDesc, setNewPropDesc] = useState<string>('');
  const [newPropFeatures, setNewPropFeatures] = useState<string>('Smart Home, Keamanan 24 Jam, Carport');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- 1. FIRESTORE REALTIME SYNC ---
  useEffect(() => {
    // Sinkronisasi Properties
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Property[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Property);
        });
        setProperties(loaded);
      } else {
        // Seeding database awal jika kosong
        defaultProperties.forEach(async (prop) => {
          await setDoc(doc(db, 'properties', prop.id), prop);
        });
      }
    });

    // Sinkronisasi Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const loadedUsers: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        loadedUsers.push({ id: docSnap.id, ...docSnap.data() } as UserAccount);
      });
      setUsers(loadedUsers);

      // Default Admin Seed
      const adminExists = loadedUsers.some((u) => u.username === 'admin');
      if (!adminExists) {
        setDoc(doc(db, 'users', 'USR-ADMIN'), {
          id: 'USR-ADMIN',
          username: 'admin',
          password: 'admin123',
          fullName: 'Delon Administrator',
          phone: '081234567890',
          email: 'admin@delonclusters.com',
          address: 'Headquarter Delon Clusters, Ponorogo',
          nik: '3502000000000001',
          role: 'admin',
          status: 'approved',
          createdAt: serverTimestamp()
        });
      }
    });

    // Sinkronisasi Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const loadedInv: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        loadedInv.push({ id: docSnap.id, ...docSnap.data() } as Invoice);
      });
      setInvoices(loadedInv.reverse());
    });

    return () => {
      unsubProps();
      unsubUsers();
      unsubInvoices();
    };
  }, []);

  // --- 2. CAMERA CAPTURE UTILS ---
  const startCamera = async (type: 'ktp' | 'selfie') => {
    setCameraActive(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: type === 'selfie' ? 'user' : 'environment', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Gagal mengakses kamera. Mohon berikan izin kamera pada browser.');
      setCameraActive(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (cameraActive === 'ktp') setKtpImage(dataUrl);
      if (cameraActive === 'selfie') setSelfieImage(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(null);
  };

  // --- 3. AUTH & REGISTRATION LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const found = users.find((u) => u.username === loginUsername && u.password === loginPassword);
    if (!found) {
      setLoginError('Username atau password tidak cocok.');
      return;
    }

    if (found.status === 'pending') {
      setLoginError('Akun Anda masih dalam antrean verifikasi KTP oleh Admin.');
      return;
    }

    if (found.status === 'rejected') {
      setLoginError('Pendaftaran akun Anda ditolak karena data KTP tidak sesuai.');
      return;
    }

    setCurrentUser(found);
    setShowLoginModal(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ktpImage || !selfieImage) {
      alert('Foto E-KTP dan Foto Selfie Wajah wajib diambil menggunakan kamera!');
      return;
    }

    const newId = `USR-${Date.now().toString().slice(-6)}`;
    const newAccount: UserAccount = {
      id: newId,
      username: regUsername.trim().toLowerCase(),
      password: regPassword,
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      address: regAddress.trim(),
      nik: regNik.trim(),
      role: 'user',
      status: 'pending',
      ktpImage,
      selfieImage,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', newId), newAccount);
      alert('Pendaftaran Berhasil! Akun Anda sedang menunggu persetujuan Admin.');
      setRegFullName('');
      setRegNik('');
      setRegPhone('');
      setRegEmail('');
      setRegAddress('');
      setRegUsername('');
      setRegPassword('');
      setKtpImage('');
      setSelfieImage('');
      setActiveTab('catalogue');
    } catch (err: any) {
      alert('Gagal mendaftar ke server: ' + err.message);
    }
  };

  // --- 4. PURCHASE & INVOICE LOGIC ---
  const handlePurchase = async (buyerData: any, paymentData: any) => {
    if (!selectedProperty) return;

    const invoiceId = `INV-DELONS-${Date.now().toString().slice(-6)}`;
    const newInvoice: Invoice = {
      id: invoiceId,
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyLocation: selectedProperty.location,
      propertyPrice: selectedProperty.price,
      propertyArea: selectedProperty.area,
      buyerName: buyerData.name,
      buyerPhone: buyerData.phone,
      buyerEmail: buyerData.email,
      buyerAddress: buyerData.address,
      buyerNik: buyerData.nik,
      downPayment: paymentData.downPayment,
      paymentMethod: paymentData.paymentMethod,
      totalPrice: selectedProperty.price,
      date: new Date().toISOString(),
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'invoices', invoiceId), newInvoice);
      setSelectedProperty(null);
      setActiveTab('invoices');
    } catch (err: any) {
      alert('Gagal menerbitkan nota ke server: ' + err.message);
    }
  };

  // --- 5. ADMIN ACTIONS ---
  const handleApproveUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'approved' });
    } catch (err: any) {
      alert('Gagal menyetujui user: ' + err.message);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'rejected' });
    } catch (err: any) {
      alert('Gagal menolak user: ' + err.message);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const propId = `PROP-${Date.now().toString().slice(-4)}`;
    const newProp: Property = {
      id: propId,
      title: newPropTitle,
      price: Number(newPropPrice) || 1000000000,
      location: newPropLocation,
      bedrooms: Number(newPropBedrooms) || 3,
      bathrooms: Number(newPropBathrooms) || 2,
      area: Number(newPropArea) || 100,
      yearBuilt: 2026,
      image: newPropImage || '/images/perumahanbanyak.jpeg',
      description: newPropDesc || 'Unit properti 3D modern Delon Clusters siap huni.',
      features: newPropFeatures.split(',').map((f) => f.trim())
    };

    try {
      await setDoc(doc(db, 'properties', propId), newProp);
      alert('Properti baru berhasil dipublikasikan ke Firestore!');
      setNewPropTitle('');
      setNewPropPrice('');
      setNewPropLocation('');
      setNewPropDesc('');
    } catch (err: any) {
      alert('Gagal menyimpan properti: ' + err.message);
    }
  };

  // Filter properti
  const filteredProperties = properties.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPrice = p.price <= maxPrice;
    return matchSearch && matchPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans antialiased">

      {/* NAVBAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => setActiveTab('catalogue')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
              <Building2 className="size-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-gray-900">Delon Clusters</span>
              <span className="text-xs font-bold ml-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">3D</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant={activeTab === 'catalogue' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('catalogue')}
              className="text-xs font-semibold"
            >
              Katalog 3D
            </Button>
            <Button
              variant={activeTab === 'invoices' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-semibold gap-1.5"
            >
              <FileText className="size-3.5" /> Nota Transaksi
            </Button>

            {currentUser?.role === 'admin' && (
              <Button
                variant={activeTab === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('admin')}
                className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
              >
                Admin Panel ({users.filter(u => u.status === 'pending').length})
              </Button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.fullName}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{currentUser.role}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentUser(null)}
                  className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1"
                >
                  <LogOut className="size-3.5" /> Keluar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                  className="text-xs font-semibold"
                >
                  Masuk
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('register')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  Daftar Akun
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* VIEW 1: KATALOG PROPERTI */}
        {activeTab === 'catalogue' && (
          <div className="space-y-6">
            {/* Banner Filter */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="w-full md:w-1/2 relative">
                <Search className="absolute left-3.5 top-3 size-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari cluster, blok rumah, atau spesifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-xs bg-gray-50/60"
                />
              </div>

              <div className="w-full md:w-auto flex items-center gap-3">
                <div className="text-xs font-medium text-gray-600">
                  Maksimal Harga: <span className="font-bold text-blue-600">Rp {(maxPrice / 1000000).toLocaleString('id-ID')} Jt</span>
                </div>
                <input
                  type="range"
                  min="500000000"
                  max="4000000000"
                  step="100000000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-32 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Grid Kartu Properti */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
                >
                  <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/perumahanbanyak.jpeg';
                      }}
                    />
                    <Badge className="absolute top-3 left-3 bg-blue-600 text-white text-[10px]">
                      Model 3D Ready
                    </Badge>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                        <MapPin className="size-3.5 text-blue-600" />
                        <span>{prop.location}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{prop.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-100 text-center text-gray-600">
                      <div>
                        <Bed className="size-4 mx-auto text-blue-600 mb-0.5" />
                        <span className="text-[11px] font-semibold">{prop.bedrooms} Kamar</span>
                      </div>
                      <div>
                        <Bath className="size-4 mx-auto text-blue-600 mb-0.5" />
                        <span className="text-[11px] font-semibold">{prop.bathrooms} Mandi</span>
                      </div>
                      <div>
                        <Maximize2 className="size-4 mx-auto text-blue-600 mb-0.5" />
                        <span className="text-[11px] font-semibold">{prop.area} m²</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Harga Resmi</p>
                        <p className="font-extrabold text-blue-600 text-base">
                          Rp {(prop.price / 1000000).toLocaleString('id-ID')} Jt
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedProperty(prop)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                      >
                        Beli / Pesan Unit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: SALES INVOICES */}
        {activeTab === 'invoices' && (
          <SalesInvoices
            invoices={invoices}
            onBack={() => setActiveTab('catalogue')}
          />
        )}

        {/* VIEW 3: DAFTAR AKUN BARU + E-KYC KAMERA */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-md space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registrasi Akun Calon Penghuni</h2>
              <p className="text-xs text-gray-500 mt-0.5">Lengkapi identitas resmi KTP Anda untuk memvalidasi kepemilikan unit 3D.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Nama Lengkap (Sesuai KTP)</label>
                  <Input
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nama lengkap..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Nomor Induk Kependudukan (NIK)</label>
                  <Input
                    required
                    value={regNik}
                    onChange={(e) => setRegNik(e.target.value)}
                    placeholder="3502xxxxxxxxxxxx"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Nomor WhatsApp Aktif</label>
                  <Input
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Alamat Email</label>
                  <Input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@domain.com"
                    className="text-xs"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Alamat Domisili KTP</label>
                  <Input
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Alamat jalan, kelurahan, kecamatan, kota..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Username Login</label>
                  <Input
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="username_baru"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Password Login</label>
                  <Input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Box Kamera E-KYC */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-blue-600" /> Verifikasi Identitas Langsung (Kamera)
                  </span>
                  <Badge variant="outline" className="text-[10px]">Wajib KYC</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-white text-center flex flex-col items-center justify-center min-h-[140px]">
                    {ktpImage ? (
                      <div className="space-y-2 w-full">
                        <img src={ktpImage} alt="KTP Preview" className="h-24 w-full object-cover rounded-lg border" />
                        <Button type="button" variant="outline" size="sm" onClick={() => startCamera('ktp')} className="text-[10px] h-7 w-full">
                          Ambil Ulang KTP
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={() => startCamera('ktp')} className="text-xs gap-1.5">
                        <Camera className="size-3.5 text-blue-600" /> Foto Fisik E-KTP
                      </Button>
                    )}
                  </div>

                  <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-white text-center flex flex-col items-center justify-center min-h-[140px]">
                    {selfieImage ? (
                      <div className="space-y-2 w-full">
                        <img src={selfieImage} alt="Selfie Preview" className="h-24 w-full object-cover rounded-lg border" />
                        <Button type="button" variant="outline" size="sm" onClick={() => startCamera('selfie')} className="text-[10px] h-7 w-full">
                          Ambil Ulang Wajah
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={() => startCamera('selfie')} className="text-xs gap-1.5">
                        <UserCheck className="size-3.5 text-blue-600" /> Foto Selfie Wajah
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab('catalogue')} className="flex-1 text-xs">
                  Batal
                </Button>
                <Button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5">
                  Kirim Pendaftaran Akun
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 4: ADMIN PANEL */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Admin Control Center</h2>
                <p className="text-xs text-gray-500">Pusat kelola verifikasi identitas calon pembeli dan katalog unit Firestore.</p>
              </div>
              <Badge className="bg-purple-600 text-white text-xs">Sesi Admin Aktif</Badge>
            </div>

            {/* TABEL VERIFIKASI USER */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm">
                  Daftar Pengajuan Akun ({users.filter(u => u.role !== 'admin').length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b">
                    <tr>
                      <th className="p-3">Nama & NIK</th>
                      <th className="p-3">Kontak & Email</th>
                      <th className="p-3">Bukti E-KYC</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.filter(u => u.role !== 'admin').map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/60">
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{u.fullName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">NIK: {u.nik}</p>
                        </td>
                        <td className="p-3">
                          <p>{u.phone}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {u.ktpImage && (
                              <a href={u.ktpImage} target="_blank" rel="noreferrer" className="underline text-blue-600 text-[10px]">
                                Cek KTP
                              </a>
                            )}
                            {u.selfieImage && (
                              <a href={u.selfieImage} target="_blank" rel="noreferrer" className="underline text-blue-600 text-[10px]">
                                Cek Wajah
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={`text-[10px] ${u.status === 'approved' ? 'bg-emerald-600 text-white' :
                            u.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                            }`}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {u.status === 'pending' && (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleApproveUser(u.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5"
                              >
                                ACC Akun
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectUser(u.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50 text-[11px] h-7 px-2"
                              >
                                Tolak
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FORM TAMBAH PROPERTI (JSX Tag Seimbang) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">Publikasikan Unit Properti 3D Baru</h3>

              <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Nama Cluster / Unit</label>
                  <Input
                    required
                    value={newPropTitle}
                    onChange={(e) => setNewPropTitle(e.target.value)}
                    placeholder="Contoh: Cluster Grand Asteria 3D"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Harga Unit (Rp)</label>
                  <Input
                    type="number"
                    required
                    value={newPropPrice}
                    onChange={(e) => setNewPropPrice(e.target.value)}
                    placeholder="1850000000"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Lokasi Blok / Kawasan</label>
                  <Input
                    required
                    value={newPropLocation}
                    onChange={(e) => setNewPropLocation(e.target.value)}
                    placeholder="Kawasan Delon Lakeview Blok A-10"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Luas Bangunan (m²)</label>
                  <Input
                    type="number"
                    required
                    value={newPropArea}
                    onChange={(e) => setNewPropArea(e.target.value)}
                    placeholder="140"
                    className="text-xs"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-gray-700">Deskripsi Arsitektur</label>
                  <Input
                    value={newPropDesc}
                    onChange={(e) => setNewPropDesc(e.target.value)}
                    placeholder="Penjelasan fasad dan keunggulan visual 3D..."
                    className="text-xs"
                  />
                </div>
                <div className="md:col-span-2 pt-2">
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5">
                    Publikasikan Unit ke Cloud Firestore
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* POPUP MODAL KAMERA E-KYC */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-center">
            <h4 className="font-bold text-gray-900 text-sm">
              Ambil {cameraActive === 'ktp' ? 'Foto Fisik KTP' : 'Foto Selfie Wajah'}
            </h4>
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={stopCamera} className="flex-1 text-xs">
                Batal
              </Button>
              <Button type="button" onClick={capturePhoto} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                Ambil Foto Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL LOGIN (BERSIH DARI HINT CREDENTIALS) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm">Masuk ke Akun Anda</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="size-4" />
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Username</label>
                <Input
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowLoginModal(false)} className="flex-1 text-xs">
                  Batal
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                  Masuk
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL DETAIL & PEMBELIAN PROPERTI */}
      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          currentUser={currentUser}
          onClose={() => setSelectedProperty(null)}
          onPurchase={handlePurchase}
        />
      )}

    </div>
  );
}
