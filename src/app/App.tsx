import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { PropertyList } from './components/PropertyList';
import { PropertyFilters } from './components/PropertyFilters';
import { PropertyDetail } from './components/PropertyDetail';
import { SalesInvoice } from './components/SalesInvoice';
import { useIsMobile } from './components/ui/use-mobile';
import {
  Home, FileText, LogIn,
  Video, Users, Building2, MessageCircle, ShieldCheck,
  Camera, CheckCircle2, XCircle, PlusCircle, UserCheck
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

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  nik: string;
  address: string;
  occupation: string;
  ktpImage: string;
  faceImage: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  password: string;
  registeredAt: string;
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

const defaultProperties: Property[] = [
  {
    id: 'prop-1',
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
    id: 'prop-2',
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
    id: 'prop-3',
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
    id: 'prop-4',
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
    id: 'prop-5',
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
    id: 'prop-6',
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

const defaultAdmin: UserAccount = {
  id: 'USR-ADMIN',
  fullName: 'Super Administrator',
  username: 'admin',
  email: 'admin@delons.com',
  phone: '081331517717',
  nik: '3200000000000001',
  address: 'Kantor Pusat Delons Clusters',
  occupation: 'Head Administrator',
  ktpImage: '/images/gambar_delon.jpeg',
  faceImage: '/images/gambar_delon.jpeg',
  status: 'approved',
  role: 'admin',
  password: 'admin123',
  registeredAt: '2024-01-01'
};

type PageType = 'home' | 'invoice' | 'login' | 'register' | 'video' | 'about' | 'services' | 'admin';

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('delons_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'addProperty'>('users');
  const isMobile = useIsMobile();

  // Sinkronisasi Real-Time Firestore (Users, Properties, Transactions)
  useEffect(() => {
    // 1. Listen Properties
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed default properties jika Firestore kosong
        defaultProperties.forEach(p => setDoc(doc(db, 'properties', p.id), p));
      } else {
        const list: Property[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as Property));
        setProperties(list);
        setFilteredProperties(list);
      }
    });

    // 2. Listen Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed admin akun jika Firestore kosong
        setDoc(doc(db, 'users', defaultAdmin.id), defaultAdmin);
      } else {
        const list: UserAccount[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as UserAccount));
        setUsers(list);
      }
    });

    // 3. Listen Transactions
    const unsubTrx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach(docSnap => list.push(docSnap.data() as Transaction));
      setTransactions(list);
    });

    return () => {
      unsubProps();
      unsubUsers();
      unsubTrx();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('delons_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('delons_session');
    }
  }, [currentUser]);

  // Form State Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form State Register
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regKtpImage, setRegKtpImage] = useState<string>('');
  const [regFaceImage, setRegFaceImage] = useState<string>('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // State WebCam
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'ktp' | 'face' | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // State Tambah Properti
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState<number>(2000000000);
  const [newLocation, setNewLocation] = useState('');
  const [newBedrooms, setNewBedrooms] = useState<number>(3);
  const [newBathrooms, setNewBathrooms] = useState<number>(2);
  const [newArea, setNewArea] = useState<number>(150);
  const [newType, setNewType] = useState<'house' | 'apartment' | 'villa'>('house');
  const [newImage, setNewImage] = useState('/images/perumahanbanyak.jpeg');
  const [newDesc, setNewDesc] = useState('');
  const [newFeatures, setNewFeatures] = useState('Smart Home, Garasi 2 Mobil, Keamanan 24 Jam');

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
    const currentHash = window.location.hash.replace('#', '') as PageType;
    if (currentHash && ['home', 'invoice', 'login', 'register', 'video', 'about', 'services', 'admin'].includes(currentHash)) {
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

  // WebCam Handlers
  const startCamera = async (target: 'ktp' | 'face') => {
    setCameraTarget(target);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: target === 'face' ? 'user' : 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Izin kamera ditolak atau tidak tersedia di browser Anda.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 480, 360);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Kompresi ringan agar ramah Firestore
      if (cameraTarget === 'ktp') setRegKtpImage(dataUrl);
      if (cameraTarget === 'face') setRegFaceImage(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraTarget(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'ktp' | 'face') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'ktp') setRegKtpImage(reader.result as string);
        if (target === 'face') setRegFaceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Login Validator via Firestore Data
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      alert('Masukkan Username/Email dan Password!');
      return;
    }

    const foundUser = users.find(
      u => (u.username.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
        u.email.toLowerCase() === loginIdentifier.trim().toLowerCase()) &&
        u.password === loginPassword
    );

    if (!foundUser) {
      alert('Kredensial tidak valid! Username atau Password salah.');
      return;
    }

    if (foundUser.role === 'admin') {
      setCurrentUser(foundUser);
      setLoginIdentifier('');
      setLoginPassword('');
      alert('Selamat datang, Admin! Mengarahkan ke Control Panel.');
      navigateTo('admin');
      return;
    }

    if (foundUser.status === 'pending') {
      alert('AKUN BELUM DI-ACC ADMIN!\n\nIdentitas Anda sedang diverifikasi di cloud database. Silakan hubungi Admin atau tunggu ACC.');
      return;
    }

    if (foundUser.status === 'rejected') {
      alert('AKUN DITOLAK!\n\nDokumen verifikasi Anda ditolak oleh Admin.');
      return;
    }

    setCurrentUser(foundUser);
    setLoginIdentifier('');
    setLoginPassword('');
    alert(`Selamat datang di Delons Clusters, ${foundUser.fullName}!`);
    navigateTo('home');
  };

  // Register ke Cloud Firestore
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regEmail || !regPhone || !regNik || !regAddress || !regPassword || !regConfirmPassword) {
      alert('Wajib mengisi seluruh data pendaftaran!');
      return;
    }
    if (regNik.length !== 16) {
      alert('Format NIK KTP wajib 16 digit!');
      return;
    }
    if (!regKtpImage || !regFaceImage) {
      alert('Wajib melampirkan Foto KTP dan Foto Wajah Kamera!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Password dan Konfirmasi tidak cocok!');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === regUsername.toLowerCase())) {
      alert('Username sudah terdaftar! Gunakan username lain.');
      return;
    }

    const newUserId = `USR-${Date.now()}`;
    const newUser: UserAccount = {
      id: newUserId,
      fullName: regFullName,
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      nik: regNik,
      address: regAddress,
      occupation: regOccupation || 'Wiraswasta / Profesional',
      ktpImage: regKtpImage,
      faceImage: regFaceImage,
      status: 'pending',
      role: 'user',
      password: regPassword,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    try {
      await setDoc(doc(db, 'users', newUserId), newUser);
      alert('PENDAFTARAN BERHASIL DISIMPAN KE CLOUD!\n\nAkun Anda telah masuk ke Database Cloud Firebase dengan status PENDING.');

      setRegFullName('');
      setRegUsername('');
      setRegEmail('');
      setRegPhone('');
      setRegNik('');
      setRegAddress('');
      setRegKtpImage('');
      setRegFaceImage('');
      setRegPassword('');
      setRegConfirmPassword('');

      navigateTo('login');
    } catch (err) {
      alert('Gagal menyimpan data ke Firestore. Pastikan Firestore rules dalam Test Mode.');
    }
  };

  // Admin ACC/Reject via Firestore Update
  const handleUserStatusUpdate = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      alert(`Status akun berhasil diubah menjadi: ${newStatus.toUpperCase()}`);
    } catch (err) {
      alert('Gagal mengupdate status akun di cloud.');
    }
  };

  // Admin Tambah Properti ke Cloud Firestore
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLocation || !newDesc) {
      alert('Lengkapi judul, lokasi, dan deskripsi!');
      return;
    }

    const newPropId = `PROP-${Date.now()}`;
    const newProp: Property = {
      id: newPropId,
      title: newTitle,
      price: Number(newPrice),
      location: newLocation,
      bedrooms: Number(newBedrooms),
      bathrooms: Number(newBathrooms),
      area: Number(newArea),
      type: newType,
      image: newImage,
      description: newDesc,
      features: newFeatures.split(',').map(f => f.trim()),
      yearBuilt: new Date().getFullYear()
    };

    try {
      await setDoc(doc(db, 'properties', newPropId), newProp);
      alert(`Properti "${newTitle}" berhasil ditambahkan ke Cloud Database & Katalog!`);
      setNewTitle('');
      setNewDesc('');
      setAdminActiveTab('users');
    } catch (err) {
      alert('Gagal menyimpan properti ke Firestore.');
    }
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

  // Pemesanan & Cetak Nota ke Cloud Firestore
  const handleCreateInvoice = async (property: Property, buyerData: any, paymentData: any) => {
    const finalBuyer = {
      name: buyerData?.name || currentUser?.fullName || 'Pembeli Terverifikasi',
      phone: buyerData?.phone || currentUser?.phone || '-',
      email: buyerData?.email || currentUser?.email || '-',
      address: buyerData?.address || currentUser?.address || '-',
      nik: currentUser?.nik || '-'
    };

    const trxId = `TRX-${Date.now()}`;
    const transaction: Transaction = {
      id: trxId,
      property,
      buyer: finalBuyer,
      date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      invoiceNumber: `INV-DELONS-${Math.floor(100000 + Math.random() * 900000)}`,
      downPayment: paymentData.downPayment,
      remaining: property.price - paymentData.downPayment,
      paymentMethod: paymentData.paymentMethod
    };

    await setDoc(doc(db, 'transactions', trxId), transaction);
    navigateTo('invoice');
  };

  const isAuthPage = currentPage === 'login' || currentPage === 'register';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full bg-white shadow-xl min-h-screen max-w-7xl flex flex-col">

        {/* NAVBAR */}
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
                  <p className="text-[10px] text-gray-500 font-medium">Platform Properti Lumion 3D (Cloud Sync)</p>
                </div>
              </div>

              {/* Desktop Menu */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <button onClick={() => navigateTo('home')} className={`hover:text-blue-600 transition ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Home</button>
                <button onClick={() => navigateTo('services')} className={`hover:text-blue-600 transition ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Layanan</button>
                <button onClick={() => navigateTo('video')} className={`hover:text-blue-600 transition ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Video Lumion</button>
                <button onClick={() => navigateTo('about')} className={`hover:text-blue-600 transition ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Tentang Kami</button>
                {currentUser?.role === 'admin' && (
                  <button onClick={() => navigateTo('admin')} className={`text-purple-600 font-bold flex items-center gap-1 ${currentPage === 'admin' ? 'underline' : ''}`}>
                    <ShieldCheck className="size-4" /> Admin Panel
                  </button>
                )}
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                  onClick={() => {
                    const msg = `Halo Admin Delons Clusters, saya ingin konsultasi unit properti 3D Lumion.`;
                    window.open(`https://wa.me/6281331517717?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                >
                  <MessageCircle className="size-3.5" /> <span className="hidden sm:inline">Chat Admin</span>
                </Button>

                {currentUser ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentUser(null);
                      alert('Anda telah logout.');
                      navigateTo('login');
                    }}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogIn className="size-3.5 mr-1 rotate-180" /> Keluar ({currentUser.username})
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

        {/* MAIN VIEWPORT */}
        <main className="p-4 md:p-6 flex-1 flex flex-col">

          {/* PAGE: HOME */}
          {currentPage === 'home' && (
            <div className="space-y-6">
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

              <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <PropertyFilters onFilterChange={filterProperties} />
                </div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex justify-between items-center text-sm text-gray-600 border-b pb-2">
                    <p>Menampilkan <span className="font-semibold text-blue-600">{filteredProperties.length}</span> unit klaster 3D (Cloud Sync)</p>
                  </div>
                  <PropertyList
                    properties={filteredProperties}
                    onSelectProperty={(prop) => {
                      if (!currentUser) {
                        alert('Silakan Masuk / Registrasi terlebih dahulu untuk memesan properti!');
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

          {/* PAGE: ADMIN PANEL */}
          {currentPage === 'admin' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="size-6 text-purple-600" /> Admin Cloud Control Panel
                  </h2>
                  <p className="text-xs text-gray-500">Data tersinkronisasi langsung ke Firebase Firestore Database.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={adminActiveTab === 'users' ? 'default' : 'outline'}
                    onClick={() => setAdminActiveTab('users')}
                    className={adminActiveTab === 'users' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    <UserCheck className="size-4 mr-1" /> Verifikasi User ({users.filter(u => u.status === 'pending').length} Pending)
                  </Button>
                  <Button
                    size="sm"
                    variant={adminActiveTab === 'addProperty' ? 'default' : 'outline'}
                    onClick={() => setAdminActiveTab('addProperty')}
                    className={adminActiveTab === 'addProperty' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    <PlusCircle className="size-4 mr-1" /> Tambah Rumah 3D
                  </Button>
                </div>
              </div>

              {/* TAB 1: VERIFIKASI USER */}
              {adminActiveTab === 'users' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">Daftar Pengguna Cloud Firestore & ACC Status</h3>
                  <div className="grid gap-4">
                    {users.map(u => (
                      <Card key={u.id} className="p-4 border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-base">{u.fullName}</span>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]">
                              {u.role.toUpperCase()}
                            </Badge>
                            <Badge
                              className={`text-[10px] ${u.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                  u.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                    'bg-red-100 text-red-800 border-red-300'
                                }`}
                            >
                              {u.status === 'approved' ? 'TERVERIFIKASI (ACC)' : u.status === 'pending' ? 'MENUNGGU ACC' : 'DITOLAK'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                            <p><span className="font-semibold">NIK:</span> {u.nik}</p>
                            <p><span className="font-semibold">Username:</span> {u.username}</p>
                            <p><span className="font-semibold">Password:</span> <code className="bg-gray-100 px-1 rounded">{u.password}</code></p>
                            <p><span className="font-semibold">WhatsApp:</span> {u.phone}</p>
                            <p><span className="font-semibold">Email:</span> {u.email}</p>
                            <p className="sm:col-span-2"><span className="font-semibold">Alamat KTP:</span> {u.address}</p>
                          </div>

                          <div className="flex gap-4 pt-2">
                            <div>
                              <p className="text-[11px] font-semibold text-gray-500 mb-1">Foto Dokumen KTP:</p>
                              <img src={u.ktpImage} alt="KTP" className="w-24 h-16 object-cover rounded-md border shadow-sm bg-gray-100" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-gray-500 mb-1">Foto Wajah Kamera:</p>
                              <img src={u.faceImage} alt="Wajah" className="w-24 h-16 object-cover rounded-md border shadow-sm bg-gray-100" />
                            </div>
                          </div>
                        </div>

                        {u.role !== 'admin' && (
                          <div className="flex md:flex-col gap-2 w-full md:w-auto">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-xs w-full"
                              disabled={u.status === 'approved'}
                              onClick={() => handleUserStatusUpdate(u.id, 'approved')}
                            >
                              <CheckCircle2 className="size-3.5 mr-1" /> ACC Akun
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50 text-xs w-full"
                              disabled={u.status === 'rejected'}
                              onClick={() => handleUserStatusUpdate(u.id, 'rejected')}
                            >
                              <XCircle className="size-3.5 mr-1" /> Tolak
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: TAMBAH PROPERTI CLOUD */}
              {adminActiveTab === 'addProperty' && (
                <Card className="max-w-2xl mx-auto p-6 shadow-sm">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl">Tambah Unit Rumah Pemodelan 3D (Cloud Firestore)</CardTitle>
                    <p className="text-xs text-gray-500">Data otomatis ter-upload ke Firestore dan sinkron di semua device.</p>
                  </CardHeader>
                  <form onSubmit={handleAddProperty} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Nama Unit Properti</label>
                        <Input placeholder="Cluster Grand Delons Tipe 45" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Harga Jual (Rp)</label>
                        <Input type="number" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Lokasi Kota</label>
                        <Input placeholder="Bandung / Surabaya" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Tipe Unit</label>
                        <select
                          className="w-full p-2 border rounded-md text-xs bg-white"
                          value={newType}
                          onChange={(e: any) => setNewType(e.target.value)}
                        >
                          <option value="house">House (Rumah)</option>
                          <option value="villa">Villa Eksklusif</option>
                          <option value="apartment">Apartemen Modern</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Path Gambar 3D</label>
                        <Input value={newImage} onChange={(e) => setNewImage(e.target.value)} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Kamar Tidur</label>
                        <Input type="number" value={newBedrooms} onChange={(e) => setNewBedrooms(Number(e.target.value))} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Kamar Mandi</label>
                        <Input type="number" value={newBathrooms} onChange={(e) => setNewBathrooms(Number(e.target.value))} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Luas Bangunan (m²)</label>
                        <Input type="number" value={newArea} onChange={(e) => setNewArea(Number(e.target.value))} required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Deskripsi Arsitektur 3D</label>
                      <Input placeholder="Visualisasi fasad modern dengan tata cahaya Lumion..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Fasilitas (Pisahkan koma)</label>
                      <Input placeholder="Smart Home, Carport, Private Pool, CCTV" value={newFeatures} onChange={(e) => setNewFeatures(e.target.value)} />
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 font-semibold text-white">
                      Publikasikan Unit ke Cloud Firestore
                    </Button>
                  </form>
                </CardContent>
              )}
            </div>
          )}

          {/* PAGE: SERVICES */}
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
                          onClick={() => {
                            const msg = `Halo Admin Delons, saya atas nama ${currentUser?.fullName || 'Pengunjung'} ingin konsultasi layanan: ${s.title}`;
                            window.open(`https://wa.me/6281331517717?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
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

          {/* PAGE: LOGIN */}
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
                  <p className="text-xs text-gray-500">Portal Pemesanan Properti 3D (Cloud Database)</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Email atau Username</label>
                      <Input
                        placeholder="Contoh: admin / username anda"
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
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-medium py-2.5 shadow-md">
                      Masuk ke Sistem
                    </Button>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
                      <p className="font-bold flex items-center gap-1"><ShieldCheck className="size-3.5" /> Akun Super Admin Cloud:</p>
                      <p>• <b>Username:</b> <code className="bg-white px-1 py-0.5 rounded font-mono">admin</code> | PW: <code className="bg-white px-1 py-0.5 rounded font-mono">admin123</code></p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t">
                      <button type="button" onClick={() => navigateTo('home')} className="text-gray-500 hover:text-gray-800">
                        ← Beranda
                      </button>
                      <span>
                        Belum punya akun? <button type="button" onClick={() => navigateTo('register')} className="text-blue-600 font-bold hover:underline">Daftar Akun Baru</button>
                      </span>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PAGE: REGISTER */}
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
                    <ShieldCheck className="size-4" /> Registrasi Cloud Firestore
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Formulir Identitas & Verifikasi Wajah</CardTitle>
                  <p className="text-xs text-gray-500">Akun tersimpan ke Cloud Firestore & wajib di-ACC Admin sebelum login.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nama Lengkap (Sesuai KTP) *</label>
                        <Input placeholder="Muhammad Dafi Al Haq" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Username Akun *</label>
                        <Input placeholder="dafi_buyer" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nomor NIK KTP (16 Digit) *</label>
                        <Input
                          placeholder="3201xxxxxxxxxxxx"
                          maxLength={16}
                          value={regNik}
                          onChange={(e) => setRegNik(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Profesi / Pekerjaan</label>
                        <Input placeholder="Software Engineer / Swasta" value={regOccupation} onChange={(e) => setRegOccupation(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Email Aktif *</label>
                        <Input type="email" placeholder="dafi@gmail.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nomor WhatsApp / HP *</label>
                        <Input type="tel" placeholder="08xxxxxxxxxx" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Alamat Domisili KTP *</label>
                      <Input placeholder="Jl. Pemuda No. 45, RT 01/RW 02, Bandung" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} />
                    </div>

                    {/* DUAL PHOTO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 flex flex-col justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-gray-800">1. Foto Dokumen KTP *</p>
                          <p className="text-[10px] text-gray-500">Ambil foto KTP via kamera atau upload.</p>
                        </div>
                        {regKtpImage && (
                          <img src={regKtpImage} alt="Preview KTP" className="w-full h-24 object-cover rounded-lg border shadow-sm" />
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs flex-1 gap-1"
                            onClick={() => startCamera('ktp')}
                          >
                            <Camera className="size-3.5" /> Kamera
                          </Button>
                          <label className="flex-1">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ktp')} />
                            <div className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-xs font-medium cursor-pointer">
                              Upload
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 flex flex-col justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-gray-800">2. Foto Wajah Selfie *</p>
                          <p className="text-[10px] text-gray-500">Buka kamera untuk scan keaslian wajah.</p>
                        </div>
                        {regFaceImage && (
                          <img src={regFaceImage} alt="Preview Wajah" className="w-full h-24 object-cover rounded-lg border shadow-sm" />
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1"
                            onClick={() => startCamera('face')}
                          >
                            <Camera className="size-3.5" /> Kamera
                          </Button>
                          <label className="flex-1">
                            <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileUpload(e, 'face')} />
                            <div className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-xs font-medium cursor-pointer">
                              Upload
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Password *</label>
                        <Input type="password" placeholder="Minimal 8 karakter..." value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Konfirmasi Password *</label>
                        <Input type="password" placeholder="Ulangi password..." value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-2.5 shadow-md">
                      Kirim Pendaftaran ke Cloud Database
                    </Button>

                    <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t">
                      <button type="button" onClick={() => navigateTo('home')} className="text-gray-500 hover:text-gray-800">
                        ← Beranda
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

          {/* PAGE: INVOICE */}
          {currentPage === 'invoice' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Arsip Nota & Riwayat Transaksi (Cloud Sync)</h2>
                  <p className="text-xs text-gray-500">Data transaksi tersimpan permanen di cloud server.</p>
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

        {/* MODAL KAMERA */}
        {isCameraActive && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full bg-white overflow-hidden shadow-2xl">
              <CardHeader className="bg-gray-900 text-white py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Camera className="size-4 text-blue-400" />
                  Ambil {cameraTarget === 'ktp' ? 'Foto Dokumen KTP' : 'Foto Wajah Saat Ini'}
                </CardTitle>
                <button onClick={stopCamera} className="text-gray-400 hover:text-white font-bold text-lg">&times;</button>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-center">
                <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-inner">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
                    <p className="text-white/70 text-xs bg-black/40 px-3 py-1 rounded-full">Posisikan di tengah kamera</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 text-xs" onClick={stopCamera}>
                    Batal
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1" onClick={capturePhoto}>
                    <Camera className="size-4" /> Jepret Foto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MODAL DETAIL PROPERTI */}
        {selectedProperty && (
          <PropertyDetail
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onPurchase={(buyerData, paymentData) => {
              const payloadBuyer = {
                name: buyerData?.name || currentUser?.fullName || '',
                phone: buyerData?.phone || currentUser?.phone || '',
                email: buyerData?.email || currentUser?.email || '',
                address: buyerData?.address || currentUser?.address || '',
              };
              handleCreateInvoice(selectedProperty, payloadBuyer, paymentData);
              setSelectedProperty(null);
            }}
          />
        )}

        {/* MOBILE NAVIGATION */}
        {!isAuthPage && isMobile && (
          <div className="sticky bottom-0 bg-white border-t flex justify-around py-2.5 px-2 z-30 text-[11px] shadow-lg md:hidden">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Home className="size-4" />
              <span>Home</span>
            </button>
            <button onClick={() => navigateTo('services')} className={`flex flex-col items-center gap-1 ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Building2 className="size-4" />
              <span>Layanan</span>
            </button>
            <button onClick={() => navigateTo('video')} className={`flex flex-col items-center gap-1 ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Video className="size-4" />
              <span>Video</span>
            </button>
            <button onClick={() => navigateTo('about')} className={`flex flex-col items-center gap-1 ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Users className="size-4" />
              <span>Tim</span>
            </button>
            {currentUser?.role === 'admin' ? (
              <button onClick={() => navigateTo('admin')} className={`flex flex-col items-center gap-1 ${currentPage === 'admin' ? 'text-purple-600 font-bold' : 'text-purple-500'}`}>
                <ShieldCheck className="size-4" />
                <span>Admin</span>
              </button>
            ) : (
              <button onClick={() => navigateTo('invoice')} className={`flex flex-col items-center gap-1 ${currentPage === 'invoice' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                <FileText className="size-4" />
                <span>Nota</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
