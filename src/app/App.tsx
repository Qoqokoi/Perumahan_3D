import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import {
  Building2, Search, MapPin, Bed, Bath, Maximize2,
  FileText, ShieldCheck, LogOut, X, Camera, UserCheck
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { PropertyDetail } from './components/PropertyDetail';
import SalesInvoice from './components/SalesInvoice';
import { KTPScanner } from './components/KTPScanner';

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

// 6 UNIT PROPERTI ASLI (Sesuai Folder public/images/)
const initialHouseList: Property[] = [
  {
    id: 'PROP-01',
    title: 'Cluster Delon Prime 3D',
    price: 2500000000,
    location: 'Kawasan Delon Hills Blok A-1',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    yearBuilt: 2026,
    image: '/images/rumah-delon.jpeg',
    description: 'Rumah modern kontemporer dengan fasad presisi hasil pemodelan 3D dan tata cahaya alami.',
    features: ['Smart Home System', 'Kolam Renang Privat', 'Security 24 Jam', 'Carport 2 Mobil']
  },
  {
    id: 'PROP-02',
    title: 'Cluster Dafi Modern 3D',
    price: 1850000000,
    location: 'Kawasan Delon Hills Blok B-4',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    yearBuilt: 2026,
    image: '/images/rumah-dafi.jpeg',
    description: 'Hunian minimalis dengan efisiensi sirkulasi udara optimal dan pencahayaan Lumion 3D.',
    features: ['Inner Garden', 'Solar Water Heater', 'One Gate System', 'Balkon Atas']
  },
  {
    id: 'PROP-03',
    title: 'Cluster Fathur Deluxe 3D',
    price: 2100000000,
    location: 'Kawasan Delon Hills Blok C-2',
    bedrooms: 4,
    bathrooms: 3,
    area: 210,
    yearBuilt: 2026,
    image: '/images/rumah-fathur.jpeg',
    description: 'Desain arsitektur modern tropis dengan ruang keluarga terbuka dan double height ceiling.',
    features: ['Double Ceiling', 'Smart Door Lock', 'Kitchen Set Mewah', 'Taman Samping']
  },
  {
    id: 'PROP-04',
    title: 'Grand Delon Hills 3D',
    price: 1450000000,
    location: 'Kawasan Delon Valley Blok D-8',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    yearBuilt: 2026,
    image: '/images/perumahan-1.jpeg',
    description: 'Kompleks hunian asri dengan view panorama dan jalur utilitas bawah tanah.',
    features: ['Underground Cable', 'CCTV 24 Jam', 'Area Bermain Anak', 'Clubhouse']
  },
  {
    id: 'PROP-05',
    title: 'Villa Panorama UNIDA 3D',
    price: 3200000000,
    location: 'Kawasan UNIDA View Kav. 12',
    bedrooms: 5,
    bathrooms: 4,
    area: 300,
    yearBuilt: 2026,
    image: '/images/geter-unida.jpeg',
    description: 'Villa eksklusif bernuansa asri hasil simulasi walkthrough 3D dengan fasilitas lengkap.',
    features: ['Private Jacuzzi', 'Rooftop Lounge', 'Taman Tropis', 'Garasi Tertutup']
  },
  {
    id: 'PROP-06',
    title: 'The Royal Delon Residence 3D',
    price: 2800000000,
    location: 'Kawasan Delon Lakeview Blok E-5',
    bedrooms: 4,
    bathrooms: 3,
    area: 240,
    yearBuilt: 2026,
    image: '/images/rumah-delon.jpeg',
    description: 'Hunian premium dengan konsep arsitektur mewah dan fasad kaca tempered modern.',
    features: ['Smart Glass Window', 'Solar Panel Ready', 'Automatic Gate', 'Gazebo']
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'invoices' | 'admin' | 'register'>('catalogue');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Firestore Data State
  const [properties, setProperties] = useState<Property[]>(initialHouseList);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(4000000000);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Register Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regNik, setRegNik] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [ktpImage, setKtpImage] = useState<string>('');
  const [selfieImage, setSelfieImage] = useState<string>('');

  // SINKRONISASI FIRESTORE
  useEffect(() => {
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Property[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as Property));
        setProperties(loaded);
      } else {
        // Seeding otomatis jika database kosong
        initialHouseList.forEach(async (p) => {
          await setDoc(doc(db, 'properties', p.id), p);
        });
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const loaded: UserAccount[] = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as UserAccount));
      setUsers(loaded);

      if (!loaded.some((u) => u.username === 'admin')) {
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

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const loaded: Invoice[] = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as Invoice));
      setInvoices(loaded.reverse());
    });

    return () => {
      unsubProps();
      unsubUsers();
      unsubInvoices();
    };
  }, []);

  // Filter properti berdasarkan teks pencarian & rentang harga
  const filteredProperties = properties.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPrice = p.price <= maxPrice;
    return matchSearch && matchPrice;
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const foundUser = users.find((u) => u.username === loginUsername && u.password === loginPassword);
    if (!foundUser) {
      setLoginError('Kredensial tidak valid! Username atau Password salah.');
      return;
    }

    if (foundUser.role === 'admin') {
      setCurrentUser(foundUser);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
      setActiveTab('admin');
      return;
    }

    if (foundUser.status === 'pending') {
      setLoginError('AKUN BELUM DI-ACC ADMIN! Identitas Anda sedang diverifikasi.');
      return;
    }

    if (foundUser.status === 'rejected') {
      setLoginError('AKUN DITOLAK! Dokumen verifikasi Anda ditolak oleh Admin.');
      return;
    }

    setCurrentUser(foundUser);
    setShowLoginModal(false);
    setLoginUsername('');
    setLoginPassword('');
    setActiveTab('catalogue');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regEmail || !regPhone || !regNik || !regAddress || !regPassword) {
      alert('Wajib mengisi seluruh formulir pendaftaran!');
      return;
    }

    if (!ktpImage || !selfieImage) {
      alert('Wajib mengambil foto E-KTP dan foto wajah!');
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
      alert('Pendaftaran Berhasil! Akun Anda menunggu verifikasi Admin.');
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
      alert('Gagal registrasi: ' + err.message);
    }
  };

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
      alert('Gagal membuat invoice: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col font-sans antialiased">

      {/* NAVBAR */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            onClick={() => setActiveTab('catalogue')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="bg-[#2563eb] text-white p-2.5 rounded-2xl shadow-sm">
              <Building2 className="size-6" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[#0f172a]">Delon Clusters</span>
              <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-md">3D</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('catalogue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'catalogue'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              Katalog 3D
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${activeTab === 'invoices'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <FileText className="size-3.5" /> Nota Transaksi
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'admin'
                    ? 'bg-purple-700 text-white'
                    : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                  }`}
              >
                Admin Panel ({users.filter(u => u.status === 'pending').length})
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <span className="text-xs font-bold text-gray-800 hidden sm:inline">{currentUser.fullName}</span>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition flex items-center gap-1"
                >
                  <LogOut className="size-3.5" /> Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-black transition"
                >
                  Masuk
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Daftar Akun
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* VIEW 1: KATALOG PROPERTI 3D (PERSIS SCREENSHOT TARGET) */}
        {activeTab === 'catalogue' && (
          <div className="space-y-8">

            {/* Filter Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="w-full md:w-3/5 relative">
                <Search className="absolute left-4 top-3.5 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari cluster, lokasi kota, atau spesifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-xs bg-gray-50/70 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
              </div>

              <div className="w-full md:w-auto flex items-center justify-end gap-3">
                <span className="text-xs font-semibold text-gray-600">
                  Maksimal Harga: <b className="text-[#2563eb] font-bold">Rp {(maxPrice / 1000000).toLocaleString('id-ID')} Jt</b>
                </span>
                <input
                  type="range"
                  min="1000000000"
                  max="4000000000"
                  step="50000000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-36 accent-[#2563eb] cursor-pointer"
                />
              </div>
            </div>

            {/* Grid 6 Unit Rumah 3D */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Foto Rumah */}
                  <div>
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/rumah-delon.jpeg';
                        }}
                      />
                      <span className="absolute top-4 left-4 bg-[#2563eb] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                        Model 3D Ready
                      </span>
                    </div>

                    {/* Rincian Deskripsi */}
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mb-1">
                          <MapPin className="size-3.5 text-[#2563eb]" />
                          <span>{prop.location}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {prop.description}
                        </p>
                      </div>

                      {/* Spesifikasi Unit */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 text-center text-gray-700">
                        <div>
                          <Bed className="size-4 mx-auto text-[#2563eb] mb-1" />
                          <span className="text-[11px] font-bold">{prop.bedrooms} Kamar</span>
                        </div>
                        <div>
                          <Bath className="size-4 mx-auto text-[#2563eb] mb-1" />
                          <span className="text-[11px] font-bold">{prop.bathrooms} Mandi</span>
                        </div>
                        <div>
                          <Maximize2 className="size-4 mx-auto text-[#2563eb] mb-1" />
                          <span className="text-[11px] font-bold">{prop.area} m²</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Harga & Tombol Beli */}
                  <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-gray-50">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider">HARGA RESMI</p>
                      <p className="font-black text-[#2563eb] text-lg">
                        Rp {(prop.price / 1000000).toLocaleString('id-ID')} Jt
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedProperty(prop)}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
                    >
                      Beli / Pesan Unit
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 2: SALES INVOICE */}
        {activeTab === 'invoices' && (
          <SalesInvoice
            invoices={invoices as any}
            onBack={() => setActiveTab('catalogue')}
          />
        )}

        {/* VIEW 3: REGISTRASI DENGAN E-KYC */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-md space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registrasi Akun Calon Penghuni</h2>
              <p className="text-xs text-gray-500 mt-0.5">Lengkapi data identitas dan verifikasi E-KTP untuk validasi pemesanan.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Nama Lengkap</label>
                  <Input value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required className="text-xs rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">NIK (Nomor Induk Kependudukan)</label>
                  <Input value={regNik} onChange={(e) => setRegNik(e.target.value)} required className="text-xs rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Nomor WhatsApp</label>
                  <Input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required className="text-xs rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Email</label>
                  <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="text-xs rounded-xl" />
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold text-gray-700">Alamat Lengkap Domisili</label>
                  <Input value={regAddress} onChange={(e) => setRegAddress(e.target.value)} required className="text-xs rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Username Login</label>
                  <Input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required className="text-xs rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Password</label>
                  <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="text-xs rounded-xl" />
                </div>
              </div>

              {/* Komponen Kamera Scanner */}
              <KTPScanner
                {...({
                  onCaptureKTP: (img: string) => setKtpImage(img),
                  onCaptureSelfie: (img: string) => setSelfieImage(img),
                  ktpImage,
                  selfieImage
                } as any)}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab('catalogue')} className="flex-1 text-xs rounded-xl">
                  Batal
                </Button>
                <Button type="submit" className="flex-[2] bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl">
                  Kirim Pendaftaran
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 4: ADMIN PANEL */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-bold text-gray-900">Verifikasi Pengajuan User Baru</h2>
              <Badge className="bg-purple-600 text-white text-xs">Sesi Admin</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 border-b">
                  <tr>
                    <th className="p-3">Nama / NIK</th>
                    <th className="p-3">Kontak</th>
                    <th className="p-3">Foto E-KYC</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.filter(u => u.role !== 'admin').map((u) => (
                    <tr key={u.id}>
                      <td className="p-3">
                        <p className="font-bold">{u.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">NIK: {u.nik}</p>
                      </td>
                      <td className="p-3">
                        <p>{u.phone}</p>
                        <p className="text-[10px] text-gray-400">{u.email}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {u.ktpImage && <a href={u.ktpImage} target="_blank" rel="noreferrer" className="text-blue-600 underline">KTP</a>}
                          {u.selfieImage && <a href={u.selfieImage} target="_blank" rel="noreferrer" className="text-blue-600 underline">Wajah</a>}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[10px] ${u.status === 'approved' ? 'bg-emerald-600 text-white' : u.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {u.status === 'pending' && (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => updateDoc(doc(db, 'users', u.id), { status: 'approved' })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5 rounded-lg"
                            >
                              ACC
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDoc(doc(db, 'users', u.id), { status: 'rejected' })}
                              className="text-red-600 border-red-200 text-[11px] h-7 px-2 rounded-lg"
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
        )}

      </main>

      {/* POPUP LOGIN (BERSIH DARI HINT) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm">Masuk ke Akun</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="size-4" />
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Username</label>
                <Input required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="text-xs rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="text-xs rounded-xl" />
              </div>
              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowLoginModal(false)} className="flex-1 text-xs rounded-xl">
                  Batal
                </Button>
                <Button type="submit" className="flex-1 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs rounded-xl">
                  Masuk
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP DETAIL & PEMBELIAN */}
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
