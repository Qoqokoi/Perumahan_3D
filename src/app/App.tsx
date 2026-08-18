import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import {
  Building2, FileText, UserCheck, ShieldCheck,
  LogIn, LogOut, Plus, Trash2, Check, X
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';

// Menggunakan Komponen Asli Proyek
import { PropertyList } from './components/PropertyList';
import { PropertyFilters } from './components/PropertyFilters';
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

const defaultProperties: Property[] = [
  {
    id: 'PROP-01',
    title: 'Cluster Modern Delons Prime',
    price: 2500000000,
    location: 'Jakarta Selatan',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    yearBuilt: 2026,
    image: '/images/perumahanbanyak.jpeg',
    description: 'Rumah modern minimalis dengan tata ruang efisien dan visualisasi pencahayaan Lumion 3D.',
    features: ['Smart Home', 'Kolam Renang Privat', 'Security 24 Jam', 'Carport 2 Mobil']
  },
  {
    id: 'PROP-02',
    title: 'Cluster Minimalis Delon',
    price: 1850000000,
    location: 'Surabaya',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    yearBuilt: 2026,
    image: '/images/perumahanbanyak.jpeg',
    description: 'Hunian kompak modern dengan pemodelan presisi eksterior dan interior Lumion.',
    features: ['Inner Garden', 'Solar Water Heater', 'One Gate System']
  },
  {
    id: 'PROP-03',
    title: 'Villa Panorama Delons',
    price: 3200000000,
    location: 'Jember',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    yearBuilt: 2026,
    image: '/images/perumahanbanyak.jpeg',
    description: 'Villa eksklusif dengan view perbukitan hasil simulasi walkthrough 3D.',
    features: ['Balkon Luas', 'Private Jacuzzi', 'Underground Cable']
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'invoices' | 'admin' | 'register'>('catalogue');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Firestore Realtime States
  const [properties, setProperties] = useState<Property[]>(defaultProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(defaultProperties);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(5000000000);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Register Form States
  const [regFullName, setRegFullName] = useState<string>('');
  const [regNik, setRegNik] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [ktpImage, setKtpImage] = useState<string>('');
  const [selfieImage, setSelfieImage] = useState<string>('');

  // 1. SINKRONISASI FIRESTORE
  useEffect(() => {
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Property[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as Property));
        setProperties(loaded);
      } else {
        defaultProperties.forEach(async (p) => {
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

  // 2. FILTER LOGIC
  useEffect(() => {
    let result = properties;
    if (searchQuery) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedLocation !== 'all') {
      result = result.filter((p) => p.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    }
    result = result.filter((p) => p.price <= priceRange);
    setFilteredProperties(result);
  }, [properties, searchQuery, selectedLocation, priceRange]);

  // 3. AUTH & FLOW HANDLERS
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
      setLoginError('AKUN BELUM DI-ACC ADMIN! Identitas Anda sedang diverifikasi di cloud database.');
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
      alert('Wajib mengisi seluruh data pendaftaran!');
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
      alert('Pendaftaran Berhasil! Akun Anda menunggu verifikasi admin.');
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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">

      {/* NAVBAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => setActiveTab('catalogue')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <Building2 className="size-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">Delon Clusters</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">3D</span>
          </div>

          <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-2 pl-2 border-l">
                <span className="text-xs font-bold text-gray-800 hidden sm:inline">{currentUser.fullName}</span>
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
              <div className="flex items-center gap-2 pl-2 border-l">
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

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* VIEW 1: KATALOG (MENGGUNAKAN KOMPONEN ASLI) */}
        {activeTab === 'catalogue' && (
          <div className="space-y-6">
            <PropertyFilters
              {...({
                searchQuery,
                setSearchQuery,
                selectedLocation,
                setSelectedLocation,
                priceRange,
                setPriceRange
              } as any)}
            />

            <PropertyList
              properties={filteredProperties}
              onSelectProperty={(prop: Property) => setSelectedProperty(prop)}
            />
          </div>
        )}

        {/* VIEW 2: SALES INVOICE */}
        {activeTab === 'invoices' && (
          <SalesInvoice
            invoices={invoices as any}
            onBack={() => setActiveTab('catalogue')}
          />
        )}

        {/* VIEW 3: REGISTRASI DENGAN KTP SCANNER */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registrasi Akun Calon Penghuni</h2>
              <p className="text-xs text-gray-500">Lengkapi data identitas dan verifikasi E-KTP untuk validasi pemesanan.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Nama Lengkap</label>
                  <Input value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required className="text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">NIK (Nomor Induk Kependudukan)</label>
                  <Input value={regNik} onChange={(e) => setRegNik(e.target.value)} required className="text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Nomor WhatsApp</label>
                  <Input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required className="text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Email</label>
                  <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="text-xs" />
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold text-gray-700">Alamat Lengkap</label>
                  <Input value={regAddress} onChange={(e) => setRegAddress(e.target.value)} required className="text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Username Login</label>
                  <Input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required className="text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Password</label>
                  <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="text-xs" />
                </div>
              </div>

              {/* Komponen Kamera KTP Scanner */}
              <KTPScanner
                {...({
                  onCaptureKTP: (img: string) => setKtpImage(img),
                  onCaptureSelfie: (img: string) => setSelfieImage(img),
                  ktpImage,
                  selfieImage
                } as any)}
              />

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab('catalogue')} className="flex-1 text-xs">
                  Batal
                </Button>
                <Button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5">
                  Kirim Pendaftaran
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 4: ADMIN PANEL */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Verifikasi Pengajuan User Baru</h2>
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
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5"
                            >
                              ACC
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDoc(doc(db, 'users', u.id), { status: 'rejected' })}
                              className="text-red-600 border-red-200 text-[11px] h-7 px-2"
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
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm">Masuk ke Akun</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="size-4" />
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Username</label>
                <Input required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="text-xs" />
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
