import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { PropertyList } from './components/PropertyList';
import { PropertyFilters } from './components/PropertyFilters';
import { PropertyDetail } from './components/PropertyDetail';
import SalesInvoice from './components/SalesInvoice';
import {
  Home, Search, FileText, User, LogIn,
  Video, Users, Building2, Phone, MessageCircle, Mail, MapPin,
  CheckCircle, ShieldCheck, Camera, Upload, Image as ImageIcon, X, AlertCircle, Check, Ban, Trash2, AtSign
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
    nik?: string;
  };
  date: string;
  invoiceNumber: string;
  downPayment: number;
  remaining: number;
  paymentMethod: string;
}

export interface CurrentUserType {
  fullName: string;
  username: string;
  nik: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'user';
  status: 'approved' | 'pending' | 'rejected';
  ktpImage?: string;
  selfieImage?: string;
}

const mockProperties: Property[] = [
  {
    id: 'PROP-01',
    title: 'Rumah 1 lantai by:fathur',
    price: 2500000000,
    location: 'Jakarta Selatan',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    type: 'house',
    image: '/images/fathur-1lantai.jpeg',
    description: 'Rumah modern minimalis dengan desain kontemporer berbasis render Lumion di kawasan elite.',
    features: ['Garasi 2 mobil', 'Taman belakang', 'Smart home', 'Security 24 jam'],
    yearBuilt: 2022
  },
  {
    id: 'PROP-02',
    title: 'Rumah 2 lantai by:fathur',
    price: 5000000000,
    location: 'Bali',
    bedrooms: 5,
    bathrooms: 4,
    area: 400,
    type: 'house',
    image: '/images/fathur-2lantai.png',
    description: 'Villa mewah dengan pemandangan sawah dan kolam renang pribadi hasil pemodelan 3D.',
    features: ['Kolam renang', 'View sawah', 'Fully furnished', 'Dekat pantai'],
    yearBuilt: 2021
  },
  {
    id: 'PROP-03',
    title: 'rumah 1 lantai by:naufal',
    price: 3500000000,
    location: 'Surabaya',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'apartment',
    image: '/images/delon-1lantai.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
    yearBuilt: 2024
  },
  {
    id: 'PROP-04',
    title: 'rumah 2 lantai by:naufal',
    price: 3500000000,
    location: 'Jember',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'apartment',
    image: '/images/delon-2lantai.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
    yearBuilt: 2024
  },
  {
    id: 'PROP-05',
    title: 'rumah 1 lantai by:dafi',
    price: 3500000000,
    location: 'Bandung',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'villa',
    image: '/images/dafi-1lantai.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
    yearBuilt: 2024
  },
  {
    id: 'PROP-06',
    title: 'rumah 2 lantai by:dafi',
    price: 3500000000,
    location: 'Tasikmalaya',
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    type: 'villa',
    image: '/images/dafi-2lantai.jpeg',
    description: 'Villa eksklusif dengan pemandangan pegunungan hasil pemodelan 3D.',
    features: ['Private Pool', 'Rooftop Garden', 'Smart Security', 'Carport 2 Mobil'],
    yearBuilt: 2024
  }
];

export default function App() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  // Sesi Login Persistent
  const [currentUser, setCurrentUser] = useState<CurrentUserType | null>(() => {
    try {
      const savedUser = localStorage.getItem('delons_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('delons_auth_user'));
  });

  const [currentPage, setCurrentPage] = useState<'home' | 'invoice' | 'login' | 'register' | 'video' | 'about' | 'services' | 'admin'>('home');
  const [adminTab, setAdminTab] = useState<'users' | 'properties' | 'invoices'>('users');

  const [previewImageModal, setPreviewImageModal] = useState<{ title: string; src: string } | null>(null);

  // Live Camera State
  const [activeCameraTarget, setActiveCameraTarget] = useState<'ktp' | 'selfie' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Responsive Hook
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regKtpImage, setRegKtpImage] = useState<string>('');
  const [regSelfieImage, setRegSelfieImage] = useState<string>('');

  const ktpInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // 1. SINKRONISASI FIRESTORE
  useEffect(() => {
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: Property[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as Property));
        setProperties(loaded);
      } else {
        mockProperties.forEach(async (p) => {
          await setDoc(doc(db, 'properties', p.id), p);
        });
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((d) => usersList.push({ id: d.id, ...d.data() }));
      setRegisteredUsers(usersList);
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
      if (loaded.length > 0) {
        setTransactions(loaded.reverse());
      }
    });

    return () => {
      unsubProps();
      unsubUsers();
      unsubInvoices();
    };
  }, []);

  // 2. FILTER PRIVASI NOTA (User hanya melihat miliknya, Admin melihat semua)
  const visibleInvoices = currentUser?.role === 'admin'
    ? transactions
    : isLoggedIn && currentUser
      ? transactions.filter((t: any) => {
        const userEmail = currentUser.email?.toLowerCase();
        const userNik = currentUser.nik;
        const userName = currentUser.fullName?.toLowerCase();

        const tEmail = (t.buyerEmail || t.buyer?.email || '').toLowerCase();
        const tNik = t.buyerNik || t.buyer?.nik || '';
        const tName = (t.buyerName || t.buyer?.name || '').toLowerCase();

        return (userEmail && tEmail === userEmail) ||
          (userNik && tNik === userNik) ||
          (userName && tName === userName);
      })
      : [];

  // 3. PROTEKSI PASSWORD ADMIN
  const verifyAdminPassword = (actionName: string): boolean => {
    const pass = window.prompt(`[OTORISASI ADMIN]\nMasukkan Password Admin untuk menghapus ${actionName}:`);
    if (pass === 'admin123') return true;
    if (pass !== null) alert('Akses Ditolak: Password Admin Salah!');
    return false;
  };

  // 4. HANDLER PEMBAYARAN TAGIHAN / CICILAN
  const handlePayInstallment = async (invoiceId: string, amount: number, method: string) => {
    const targetInvoice = transactions.find((t) => t.id === invoiceId);
    if (!targetInvoice) return;

    const oldPaid = Number(targetInvoice.downPayment || 0);
    const totalPrice = Number(targetInvoice.totalPrice || targetInvoice.property?.price || 0);

    const newPaid = oldPaid + amount;
    const newRemaining = Math.max(0, totalPrice - newPaid);

    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        downPayment: newPaid,
        remaining: newRemaining,
        paymentMethod: method,
        lastPaymentDate: new Date().toISOString(),
        status: newRemaining === 0 ? 'LUNAS' : 'CICILAN'
      });

      setTransactions((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
              ...inv,
              downPayment: newPaid,
              remaining: newRemaining,
              paymentMethod: method
            }
            : inv
        )
      );

      alert(`Pembayaran Berhasil Diterima!\n\nNominal Masuk: Rp ${amount.toLocaleString('id-ID')}\nSisa Tagihan: Rp ${newRemaining.toLocaleString('id-ID')}`);
    } catch (error: any) {
      alert('Gagal memproses pembayaran: ' + error.message);
    }
  };

  // 5. LIVE CAMERA CONTROLS
  const startCamera = async (target: 'ktp' | 'selfie') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: target === 'selfie' ? 'user' : 'environment' }
      });
      setCameraStream(stream);
      setActiveCameraTarget(target);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 200);
    } catch (err) {
      alert('Tidak dapat mengakses kamera! Berikan izin kamera pada browser Anda.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setActiveCameraTarget(null);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (activeCameraTarget === 'ktp') setRegKtpImage(dataUrl);
        if (activeCameraTarget === 'selfie') setRegSelfieImage(dataUrl);
      }
    }
    stopCamera();
  };

  const handleImageUpload = (file: File, type: 'ktp' | 'selfie') => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (type === 'ktp') setRegKtpImage(base64);
      if (type === 'selfie') setRegSelfieImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // 6. REGISTRASI E-KYC
  const handleRegisterSubmit = async () => {
    const cleanUsername = regUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanNik = regNik.replace(/\D/g, '').trim();
    const cleanName = regName.trim();
    const cleanPhone = regPhone.replace(/\D/g, '').trim();
    const cleanAddress = regAddress.trim();
    const cleanEmailInput = regEmail.trim().toLowerCase();
    const cleanPassword = regPassword.trim();

    if (!cleanUsername || !cleanNik || !cleanName || !cleanPhone || !cleanAddress || !cleanEmailInput || !cleanPassword) {
      alert('Gagal: Seluruh data pendaftaran (termasuk Username) wajib diisi lengkap!');
      return;
    }

    if (cleanUsername.length < 3) {
      alert('Gagal: Username minimal 3 karakter!');
      return;
    }

    if (cleanNik.length !== 16) {
      alert('Gagal: NIK harus berupa 16 digit angka sesuai KTP!');
      return;
    }

    if (cleanName.length < 3) {
      alert('Gagal: Nama lengkap minimal 3 huruf!');
      return;
    }

    if (!cleanPhone.startsWith('08') || cleanPhone.length < 10) {
      alert('Gagal: Format Nomor WhatsApp wajib 08xxxxxxxxxx.');
      return;
    }

    if (cleanPassword.length < 6) {
      alert('Gagal: Password minimal 6 karakter!');
      return;
    }

    if (!regKtpImage || !regSelfieImage) {
      alert('Gagal: Wajib melampirkan Foto E-KTP dan Foto Wajah!');
      return;
    }

    const finalEmail = cleanEmailInput.includes('@') ? cleanEmailInput : `${cleanEmailInput}@gmail.com`;

    if (registeredUsers.some(u => u.username?.toLowerCase() === cleanUsername)) {
      alert(`Gagal: Username "${cleanUsername}" sudah digunakan!`);
      return;
    }

    if (registeredUsers.some(u => u.email?.toLowerCase() === finalEmail)) {
      alert(`Gagal: Email "${finalEmail}" sudah terdaftar.`);
      return;
    }

    const newUserId = `USR-${Date.now().toString().slice(-6)}`;
    const newUserData = {
      id: newUserId,
      username: cleanUsername,
      fullName: cleanName,
      nik: cleanNik,
      phone: cleanPhone,
      address: cleanAddress,
      email: finalEmail,
      password: cleanPassword,
      ktpImage: regKtpImage,
      selfieImage: regSelfieImage,
      role: 'user',
      status: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', newUserId), newUserData);
      alert(`Pendaftaran Berhasil!\n\nUsername: ${cleanUsername}\nStatus: MENUNGGU ACC ADMIN.`);

      setLoginEmail(cleanUsername);
      setLoginPassword(cleanPassword);

      setRegUsername('');
      setRegName('');
      setRegNik('');
      setRegPhone('');
      setRegAddress('');
      setRegEmail('');
      setRegPassword('');
      setRegKtpImage('');
      setRegSelfieImage('');

      setCurrentPage('login');
    } catch (error: any) {
      alert('Gagal mendaftar: ' + error.message);
    }
  };

  // 7. AUTENTIKASI LOGIN
  const handleLoginSubmit = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert('Silakan masukkan email/username dan password!');
      return;
    }

    const inputId = loginEmail.trim().toLowerCase();
    const inputPass = loginPassword.trim();

    if ((inputId === 'admin' || inputId === 'admin@delonclusters.com') && inputPass === 'admin123') {
      const adminData: CurrentUserType = {
        fullName: 'Administrator Delons',
        username: 'admin',
        nik: '3502000000000001',
        email: 'admin@delonclusters.com',
        phone: '081234567890',
        address: 'Headquarter Delon Clusters, Ponorogo',
        role: 'admin',
        status: 'approved'
      };

      localStorage.setItem('delons_auth_user', JSON.stringify(adminData));
      setCurrentUser(adminData);
      setIsLoggedIn(true);
      setCurrentPage('admin');
      alert('Login Berhasil! Selamat datang Admin Delons Clusters.');
      return;
    }

    const formattedEmail = inputId.includes('@') ? inputId : `${inputId}@gmail.com`;

    const matchedUser = registeredUsers.find(
      (u) =>
        (u.username?.toLowerCase() === inputId ||
          u.email?.toLowerCase() === inputId ||
          u.email?.toLowerCase() === formattedEmail) &&
        u.password === inputPass
    );

    if (!matchedUser) {
      alert('Kredensial tidak valid! Username/Email atau Password salah.');
      return;
    }

    if (matchedUser.status === 'pending') {
      alert('AKUN BELUM DI-ACC ADMIN!\n\nIdentitas Anda sedang dalam antrean verifikasi.');
      return;
    }

    if (matchedUser.status === 'rejected') {
      alert('AKUN DITOLAK!\n\nDokumen verifikasi Anda ditolak oleh Admin.');
      return;
    }

    const verifiedUser: CurrentUserType = {
      fullName: matchedUser.fullName || matchedUser.name || 'User Delons',
      username: matchedUser.username || inputId,
      nik: matchedUser.nik || '3502xxxxxxxxxxxx',
      email: matchedUser.email || formattedEmail,
      phone: matchedUser.phone || '081234567890',
      address: matchedUser.address || 'Kawasan Delons Clusters',
      role: matchedUser.role || 'user',
      status: matchedUser.status || 'approved',
      ktpImage: matchedUser.ktpImage,
      selfieImage: matchedUser.selfieImage
    };

    localStorage.setItem('delons_auth_user', JSON.stringify(verifiedUser));
    setCurrentUser(verifiedUser);
    setIsLoggedIn(true);
    setCurrentPage('home');
    alert(`Login Berhasil! Selamat datang, ${verifiedUser.fullName}.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('delons_auth_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('home');
    alert('Anda telah berhasil Logout.');
  };

  // 8. ADMIN ACTIONS
  const handleUpdateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      alert(`Akun berhasil ${newStatus === 'approved' ? 'DI-ACC' : 'DIBLOKIR'}!`);
    } catch (e: any) {
      alert('Gagal update status: ' + e.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!verifyAdminPassword(`Akun Pengguna "${userName}"`)) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert(`Akun "${userName}" berhasil dihapus permanen.`);
    } catch (e: any) {
      alert('Gagal menghapus user: ' + e.message);
    }
  };

  const handleDeleteProperty = async (propertyId: string, propertyTitle: string) => {
    if (!verifyAdminPassword(`Unit Properti "${propertyTitle}"`)) return;
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      alert(`Unit properti "${propertyTitle}" berhasil dihapus.`);
    } catch (e: any) {
      alert('Gagal menghapus properti: ' + e.message);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!verifyAdminPassword(`Nota Transaksi [${invoiceId}]`)) return;
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      setTransactions((prev) => prev.filter((t) => t.id !== invoiceId));
      alert(`Nota transaksi "${invoiceId}" berhasil dihapus.`);
    } catch (e: any) {
      alert('Gagal menghapus nota: ' + e.message);
    }
  };

  // 9. ORDER PROPERTI
  const handleCreateInvoice = async (property: Property, buyerData: any, paymentData: any) => {
    if (!isLoggedIn || !currentUser) {
      alert('Akses Ditolak: Anda wajib Login terlebih dahulu sebelum memesan properti!');
      setSelectedProperty(null);
      setCurrentPage('login');
      return;
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const finalBuyerEmail = buyerData.email
      ? buyerData.email.includes('@')
        ? buyerData.email.trim()
        : `${buyerData.email.trim()}@gmail.com`
      : currentUser.email;

    const newTx: any = {
      id: invoiceNumber,
      invoiceNumber: invoiceNumber,
      property,
      buyer: {
        ...buyerData,
        email: finalBuyerEmail,
        nik: buyerData.nik || currentUser.nik
      },
      buyerName: buyerData.name || currentUser.fullName,
      buyerNik: buyerData.nik || currentUser.nik,
      buyerPhone: buyerData.phone || currentUser.phone,
      buyerEmail: finalBuyerEmail,
      buyerAddress: buyerData.address || currentUser.address,
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

    setTransactions((prev) => [newTx, ...prev]);
    setCurrentPage('invoice');
  };

  const pendingUsersCount = registeredUsers.filter((u) => u.status === 'pending' && u.role !== 'admin').length;

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
      filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    }
    if (propertyType && propertyType !== 'all') {
      filtered = filtered.filter((p) => p.type === propertyType);
    }
    if (minBedrooms) {
      filtered = filtered.filter((p) => p.bedrooms >= minBedrooms);
    }
    setFilteredProperties(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center overflow-x-hidden">
      <div className="w-full bg-white shadow-xl min-h-screen max-w-7xl flex flex-col justify-between">

        {/* NAVBAR */}
        <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">

            <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setCurrentPage('home')}>
              <img
                src="/images/logo-app.png"
                alt="Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo_rumah kita.png';
                }}
              />
              <div>
                <h1 className="font-bold text-blue-600 text-sm sm:text-base leading-tight">Delons Poenya</h1>
                <p className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">Platform Properti Lumion</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <button onClick={() => setCurrentPage('home')} className={`transition-colors duration-200 hover:text-blue-600 ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Home</button>
              <button onClick={() => setCurrentPage('services')} className={`transition-colors duration-200 hover:text-blue-600 ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Layanan</button>
              <button onClick={() => setCurrentPage('video')} className={`transition-colors duration-200 hover:text-blue-600 ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Video Lumion</button>
              <button onClick={() => setCurrentPage('about')} className={`transition-colors duration-200 hover:text-blue-600 ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>Tentang Kami</button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${currentPage === 'admin'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                    }`}
                >
                  <ShieldCheck className="size-3.5" /> Admin Panel ({pendingUsersCount})
                </button>
              )}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                size="sm"
                className="text-[11px] sm:text-xs bg-green-600 hover:bg-green-700 text-white gap-1 px-2.5 sm:px-3 h-8 sm:h-9"
                onClick={() => {
                  const phoneNumber = "6281331517717";
                  const message = "Halo Admin Delons Clusters, saya ingin konsultasi seputar properti 3D.";
                  window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="size-3" /> <span className="hidden xs:inline">Chat</span> Admin
              </Button>

              {isLoggedIn ? (
                <div className="flex items-center gap-1.5">
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-100 border rounded-lg text-xs">
                    <User className="size-3 text-blue-600" />
                    <span className="font-semibold text-gray-800 truncate max-w-[90px]">{currentUser?.fullName}</span>
                    <Badge className={`text-[9px] px-1 py-0 ${currentUser?.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {currentUser?.role === 'admin' ? 'ADMIN' : 'PEMBELI'}
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogout}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <LogIn className="size-3 sm:mr-1 rotate-180" /> <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage('login')}
                    className="text-xs font-semibold h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <LogIn className="size-3 sm:mr-1" /> Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage('register')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm h-8 sm:h-9 px-2.5 sm:px-3 hidden sm:flex"
                  >
                    Daftar
                  </Button>
                </div>
              )}

              <Button
                size="sm"
                onClick={() => setCurrentPage('invoice')}
                className="text-xs bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 px-2.5 sm:px-3 hidden md:flex"
              >
                <FileText className="size-3 mr-1" /> Nota
              </Button>
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="p-3 sm:p-6 w-full max-w-7xl mx-auto flex-1 pb-24 md:pb-8">
          <div
            key={currentPage}
            className="transition-all duration-300 ease-out"
            style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* 1. HOME */}
            {currentPage === 'home' && (
              <div className="space-y-6">
                <div
                  className="relative rounded-2xl overflow-hidden text-white p-5 sm:p-8 md:p-10 shadow-lg bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('/images/hero.jpg')`
                  }}
                >
                  <div className="relative z-10 max-w-xl space-y-2.5">
                    <Badge className="bg-blue-500 text-white text-[11px]">Visualisasi 3D Lumion</Badge>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                      Temukan Hunian Impian Berbasis Model 3D
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                      Jelajahi perumahan eksklusif hasil desain pemodelan 3D dan render Lumion interaktif kelompok kami.
                    </p>
                    <Button
                      className="bg-white text-blue-900 hover:text-white font-semibold text-xs mt-1"
                      onClick={() => setCurrentPage('video')}
                    >
                      Tonton Video Lumion
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                  <div className="lg:col-span-1 w-full">
                    <PropertyFilters onFilterChange={filterProperties} />
                  </div>
                  <div className="lg:col-span-3 space-y-4 w-full">
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600 font-medium">
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

            {/* 2. SERVICES */}
            {currentPage === 'services' && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Layanan Properti & Jasa</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Pilih berbagai layanan profesional seputar perumahan dan pembangunan.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Jual & Beli Rumah', desc: 'Layanan transaksi jual beli rumah baru dan second dengan legalitas aman.', price: 'Mulai 1% Komisi' },
                    { title: 'Sewa Rumah & Apartemen', desc: 'Pilihan sewa harian, bulanan, hingga tahunan di lokasi strategis.', price: 'Mulai Rp 25jt/tahun' },
                    { title: 'Jasa Desain Rumah 3D', desc: 'Pembuatan desain arsitektur dan pemodelan 3D menggunakan Lumion & AutoCAD.', price: 'Rp 5.000.000' },
                    { title: 'Jasa Pembangunan & Renovasi', desc: 'Kontraktor terpercaya untuk pembangunan rumah impian dari nol.', price: 'Estimasi RAB Custom' },
                  ].map((s, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                        <CardTitle className="text-base sm:text-lg">{s.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                        <p className="text-xs sm:text-sm text-gray-600">{s.desc}</p>
                        <p className="font-bold text-blue-600 text-sm">{s.price}</p>
                        <Button size="sm" className="w-full text-xs">Pilih Layanan</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 3. VIDEO */}
            {currentPage === 'video' && (
              <div className="space-y-6 text-center">
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold">Video Walkthrough Lumion 3D</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Video hasil rendering animasi 3D perumahan kelompok kami.</p>
                </div>
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg flex items-center justify-center relative max-w-4xl mx-auto w-full">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/ng_r31w8AuQ?si=kEFJEdsp4sDV86zm"
                    title="Video Lumion 3D"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* 4. ABOUT */}
            {currentPage === 'about' && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold">About Us</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Tim Mahasiswa Pengembang Platform Properti 3D</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    {
                      name: 'Fathurrahman Naufal',
                      nim: '452024611064',
                      role: 'Frontend & UI/UX System Lead',
                      desc: 'Mengembangkan arsitektur antarmuka interaktif React, optimasi responsivitas mobile, dan integrasi logic state aplikasi.',
                      img: '/images/pp-fathur.jpeg'
                    },
                    {
                      name: 'Naufal Aqila',
                      nim: '452024611048',
                      role: '3D Architecture & Lumion Specialist',
                      desc: 'Merancang pemodelan spasial fasad 3D presisi tinggi serta memproduksi animasi walkthrough rendering visual Lumion.',
                      img: '/images/pp-delon.jpg'
                    },
                    {
                      name: 'Muhammad Dafi Al Haq',
                      nim: '452024611067',
                      role: 'Backend & Cloud Database Engineer',
                      desc: 'Mengelola arsitektur database realtime Cloud Firestore, validasi keamanan sistem E-KYC, dan infrastruktur deployment.',
                      img: '/images/pp-dafi.jpeg'
                    },
                  ].map((member, idx) => (
                    <Card key={idx} className="text-center p-4 hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-blue-600 shadow-md">
                        <img
                          src={member.img}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/perumahan.jpg';
                          }}
                        />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">{member.name}</h3>
                      <p className="text-[11px] sm:text-xs text-blue-600 font-medium mb-1">{member.role}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 font-mono">NIM: {member.nim}</p>
                      <p className="text-[11px] sm:text-xs text-gray-600">{member.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 5. LOGIN */}
            {currentPage === 'login' && (
              <div
                className="w-full min-h-[75vh] flex flex-col items-center justify-center py-8 px-3 sm:px-4 bg-cover bg-center rounded-2xl my-2 gap-5 shadow-sm"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('/images/perumahan.jpg')`
                }}
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-wider text-amber-400 uppercase">
                    SELAMAT DATANG
                  </h2>
                  <h3 className="text-base sm:text-2xl md:text-3xl font-bold tracking-widest text-white uppercase">
                    DELONS CLUSTERS
                  </h3>
                </div>

                <Card className="max-w-md w-full bg-white/95 backdrop-blur-md shadow-2xl border-0">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="text-center text-lg sm:text-xl font-bold">Login ke RumahKu</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Email atau Username</label>
                      <Input
                        placeholder="Contoh: fathur24 atau fathur@gmail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Password</label>
                      <Input
                        type="password"
                        placeholder="Masukkan password..."
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs py-2.5"
                      onClick={handleLoginSubmit}
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

            {/* 6. REGISTER */}
            {currentPage === 'register' && (
              <div className="max-w-xl mx-auto py-3 sm:py-6">
                <Card className="shadow-lg border border-gray-200">
                  <CardHeader className="p-4 sm:p-6 border-b pb-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-xl font-bold text-gray-900">Registrasi Calon Pembeli</CardTitle>
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Lengkapi data valid & identitas untuk verifikasi Admin.</p>
                      </div>
                      <Badge className="bg-blue-600 text-white text-[9px] sm:text-[10px]">Wajib ACC</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-1">
                          <AtSign className="size-3 text-blue-600" /> Username Akun (Untuk Login)
                        </label>
                        <Input
                          placeholder="Contoh: fathur24"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="text-xs mt-1 font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700">Nama Lengkap (Sesuai KTP)</label>
                        <Input
                          placeholder="Nama lengkap..."
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700">NIK (16 Digit KTP)</label>
                        <Input
                          placeholder="Contoh: 3502010101010001"
                          maxLength={16}
                          value={regNik}
                          onChange={(e) => setRegNik(e.target.value.replace(/\D/g, ''))}
                          className="text-xs mt-1 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700">WhatsApp (08...)</label>
                        <Input
                          placeholder="Contoh: 081234567890"
                          maxLength={14}
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                          className="text-xs mt-1 font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700">Email (Auto @gmail.com)</label>
                        <Input
                          placeholder="nama@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-gray-700">Password Akun (Min. 6 Karakter)</label>
                        <Input
                          type="password"
                          placeholder="Minimal 6 karakter..."
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-gray-700">Alamat Domisili KTP</label>
                        <Input
                          placeholder="Alamat lengkap domisili..."
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-800">Lampiran Dokumen Identitas (Wajib)</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/60">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">1. Foto Fisik E-KTP</span>
                            {regKtpImage && <Badge className="bg-emerald-600 text-white text-[9px]">Terpasang</Badge>}
                          </div>

                          {regKtpImage ? (
                            <div className="aspect-[16/10] rounded-lg overflow-hidden border bg-black/5">
                              <img src={regKtpImage} alt="KTP" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="aspect-[16/10] rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                              <ImageIcon className="size-6 mb-1 opacity-50" />
                              <span className="text-[10px]">KTP Belum Dipilih</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => startCamera('ktp')}
                              className="text-[10px] sm:text-[11px] h-8 gap-1 font-semibold px-1"
                            >
                              <Camera className="size-3 text-blue-600" /> Kamera
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => ktpInputRef.current?.click()}
                              className="text-[10px] sm:text-[11px] h-8 gap-1 font-semibold px-1"
                            >
                              <Upload className="size-3 text-emerald-600" /> Upload
                            </Button>
                          </div>
                          <input
                            type="file"
                            ref={ktpInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'ktp')}
                          />
                        </div>

                        <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/60">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">2. Foto Wajah (Selfie)</span>
                            {regSelfieImage && <Badge className="bg-emerald-600 text-white text-[9px]">Terpasang</Badge>}
                          </div>

                          {regSelfieImage ? (
                            <div className="aspect-[16/10] rounded-lg overflow-hidden border bg-black/5">
                              <img src={regSelfieImage} alt="Selfie" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="aspect-[16/10] rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                              <User className="size-6 mb-1 opacity-50" />
                              <span className="text-[10px]">Wajah Belum Dipilih</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => startCamera('selfie')}
                              className="text-[10px] sm:text-[11px] h-8 gap-1 font-semibold px-1"
                            >
                              <Camera className="size-3 text-blue-600" /> Kamera
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selfieInputRef.current?.click()}
                              className="text-[10px] sm:text-[11px] h-8 gap-1 font-semibold px-1"
                            >
                              <Upload className="size-3 text-emerald-600" /> Upload
                            </Button>
                          </div>
                          <input
                            type="file"
                            ref={selfieInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'selfie')}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs py-3 shadow-md"
                      onClick={handleRegisterSubmit}
                    >
                      Kirim & Ajukan Verifikasi Akun
                    </Button>

                    <p className="text-xs text-center text-gray-600">
                      Sudah punya akun? <button onClick={() => setCurrentPage('login')} className="text-blue-600 underline font-medium">Login</button>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 7. CONTROL PANEL ADMIN */}
            {currentPage === 'admin' && currentUser?.role === 'admin' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 bg-purple-50 border border-purple-200 p-3.5 sm:p-4 rounded-2xl">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-purple-950">Control Panel Manajemen Cloud</h2>
                    <p className="text-[11px] sm:text-xs text-purple-700">Kelola Pengguna, Unit Rumah, dan Nota dengan Proteksi Password Admin.</p>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-purple-200">
                    <button
                      onClick={() => setAdminTab('users')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${adminTab === 'users' ? 'bg-purple-700 text-white' : 'text-purple-700 hover:bg-purple-50'}`}
                    >
                      User ({registeredUsers.filter(u => u.role !== 'admin').length})
                    </button>
                    <button
                      onClick={() => setAdminTab('properties')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${adminTab === 'properties' ? 'bg-purple-700 text-white' : 'text-purple-700 hover:bg-purple-50'}`}
                    >
                      Rumah ({properties.length})
                    </button>
                    <button
                      onClick={() => setAdminTab('invoices')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${adminTab === 'invoices' ? 'bg-purple-700 text-white' : 'text-purple-700 hover:bg-purple-50'}`}
                    >
                      Nota ({transactions.length})
                    </button>
                  </div>
                </div>

                {/* TAB 1: KELOLA PENGGUNA */}
                {adminTab === 'users' && (
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-100 text-gray-700 border-b">
                          <tr>
                            <th className="p-3">User & NIK</th>
                            <th className="p-3">Kontak & Alamat</th>
                            <th className="p-3 text-center">Dokumen</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Aksi Admin (Pass Protect)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {registeredUsers.filter((u) => u.role !== 'admin').length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-gray-400">
                                Belum ada akun pendaftar di database.
                              </td>
                            </tr>
                          ) : (
                            registeredUsers.filter((u) => u.role !== 'admin').map((u) => (
                              <tr key={u.id} className="hover:bg-gray-50/80 transition">
                                <td className="p-3">
                                  <p className="font-bold text-gray-900">{u.fullName}</p>
                                  <p className="text-[11px] text-purple-700 font-mono font-semibold">@{u.username || 'user'}</p>
                                  <p className="font-mono text-[10px] text-blue-600">NIK: {u.nik || '-'}</p>
                                </td>
                                <td className="p-3">
                                  <p className="font-medium text-gray-800">{u.phone}</p>
                                  <p className="text-[10px] text-gray-500">{u.email}</p>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center items-center gap-1.5">
                                    {u.ktpImage && (
                                      <button
                                        onClick={() => setPreviewImageModal({ title: `Foto KTP: ${u.fullName}`, src: u.ktpImage })}
                                        className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded font-bold text-[10px]"
                                      >
                                        KTP
                                      </button>
                                    )}
                                    {u.selfieImage && (
                                      <button
                                        onClick={() => setPreviewImageModal({ title: `Foto Wajah: ${u.fullName}`, src: u.selfieImage })}
                                        className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded font-bold text-[10px]"
                                      >
                                        Wajah
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <Badge
                                    className={`text-[9px] font-bold ${u.status === 'approved'
                                      ? 'bg-emerald-600 text-white'
                                      : u.status === 'rejected'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-amber-500 text-white'
                                      }`}
                                  >
                                    {u.status === 'approved' ? 'DI-ACC' : u.status === 'rejected' ? 'DITOLAK' : 'PENDING'}
                                  </Badge>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end items-center gap-1">
                                    {u.status !== 'approved' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateUserStatus(u.id, 'approved')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-6 px-2 gap-0.5"
                                      >
                                        <Check className="size-2.5" /> ACC
                                      </Button>
                                    )}

                                    {u.status === 'approved' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateUserStatus(u.id, 'rejected')}
                                        className="text-amber-600 border-amber-200 hover:bg-amber-50 text-[10px] h-6 px-1.5 gap-0.5"
                                      >
                                        <Ban className="size-2.5" /> Blokir
                                      </Button>
                                    )}

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteUser(u.id, u.fullName)}
                                      className="text-red-600 border-red-200 hover:bg-red-50 text-[10px] h-6 px-1.5 gap-0.5"
                                    >
                                      <Trash2 className="size-2.5" /> Hapus
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* TAB 2: KELOLA PROPERTI */}
                {adminTab === 'properties' && (
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-100 text-gray-700 border-b">
                          <tr>
                            <th className="p-3">Unit Properti</th>
                            <th className="p-3">Lokasi & Tipe</th>
                            <th className="p-3">Spesifikasi</th>
                            <th className="p-3">Harga</th>
                            <th className="p-3 text-right">Aksi (Pass Protect)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {properties.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/80 transition">
                              <td className="p-3 flex items-center gap-2">
                                <img src={p.image} alt={p.title} className="size-8 rounded object-cover border" />
                                <div>
                                  <p className="font-bold text-gray-900">{p.title}</p>
                                  <p className="font-mono text-[10px] text-gray-400">{p.id}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="font-medium text-gray-800">{p.location}</p>
                                <p className="text-[10px] text-blue-600 uppercase font-semibold">{p.type}</p>
                              </td>
                              <td className="p-3 text-gray-600">
                                {p.bedrooms} KT • {p.bathrooms} KM • {p.area} m²
                              </td>
                              <td className="p-3 font-bold text-blue-600">
                                Rp {p.price.toLocaleString('id-ID')}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteProperty(p.id, p.title)}
                                  className="text-red-600 border-red-200 hover:bg-red-50 text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <Trash2 className="size-3" /> Hapus Properti
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* TAB 3: KELOLA NOTA */}
                {adminTab === 'invoices' && (
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-100 text-gray-700 border-b">
                          <tr>
                            <th className="p-3">ID Nota & Tanggal</th>
                            <th className="p-3">Pembeli</th>
                            <th className="p-3">Unit Properti</th>
                            <th className="p-3">DP Terbayar</th>
                            <th className="p-3 text-right">Aksi (Pass Protect)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {transactions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-gray-400">
                                Belum ada riwayat nota transaksi.
                              </td>
                            </tr>
                          ) : (
                            transactions.map((t: any) => (
                              <tr key={t.id} className="hover:bg-gray-50/80 transition">
                                <td className="p-3">
                                  <p className="font-mono font-bold text-blue-600">{t.id}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(t.date || t.createdAt).toLocaleDateString('id-ID')}</p>
                                </td>
                                <td className="p-3">
                                  <p className="font-bold text-gray-900">{t.buyerName || t.buyer?.name}</p>
                                  <p className="text-[10px] text-gray-500">{t.buyerPhone || t.buyer?.phone}</p>
                                </td>
                                <td className="p-3">
                                  <p className="font-medium text-gray-800">{t.propertyTitle || t.property?.title}</p>
                                </td>
                                <td className="p-3 font-bold text-emerald-600">
                                  Rp {Number(t.downPayment || t.payment?.downPayment || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteInvoice(t.id)}
                                    className="text-red-600 border-red-200 hover:bg-red-50 text-[10px] h-7 px-2.5 gap-1"
                                  >
                                    <Trash2 className="size-3" /> Hapus Nota
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

              </div>
            )}

            {/* 8. INVOICE (DENGAN HANDLER BAYAR CICILAN & HAPUS NOTA) */}
            {currentPage === 'invoice' && (
              <SalesInvoice
                invoices={visibleInvoices as any}
                onBack={() => setCurrentPage('home')}
                isAdmin={currentUser?.role === 'admin'}
                onDeleteInvoice={handleDeleteInvoice}
                onPayInstallment={handlePayInstallment}
              />
            )}
          </div>
        </main>

        {/* MODAL PREVIEW FOTO */}
        {previewImageModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">{previewImageModal.title}</h4>
                <button onClick={() => setPreviewImageModal(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="size-5" />
                </button>
              </div>
              <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden">
                <img src={previewImageModal.src} alt="Preview" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* MODAL LIVE CAMERA */}
        {activeCameraTarget && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl p-4 sm:p-5 max-w-md w-full space-y-3 sm:space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2.5">
                <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                  {activeCameraTarget === 'ktp' ? 'Foto Fisik E-KTP' : 'Foto Wajah (Selfie)'}
                </h4>
                <button onClick={stopCamera} className="text-gray-400 hover:text-gray-700">
                  <X className="size-5" />
                </button>
              </div>

              <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={stopCamera} className="flex-1 text-xs">
                  Batal
                </Button>
                <Button onClick={takePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1">
                  <Camera className="size-4" /> Ambil Foto
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL UNIT */}
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

        {/* BOTTOM NAVIGATION MOBILE */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 py-2 px-2 flex justify-around items-center shadow-lg safe-area-bottom">
            <button onClick={() => setCurrentPage('home')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'home' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Home className="size-4" />
              <span className="text-[10px]">Home</span>
            </button>
            <button onClick={() => setCurrentPage('services')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'services' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Building2 className="size-4" />
              <span className="text-[10px]">Layanan</span>
            </button>
            <button onClick={() => setCurrentPage('video')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'video' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Video className="size-4" />
              <span className="text-[10px]">Video</span>
            </button>
            <button onClick={() => setCurrentPage('about')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <Users className="size-4" />
              <span className="text-[10px]">Tim</span>
            </button>
            <button onClick={() => setCurrentPage('invoice')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'invoice' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              <FileText className="size-4" />
              <span className="text-[10px]">Nota</span>
            </button>
            {currentUser?.role === 'admin' && (
              <button onClick={() => setCurrentPage('admin')} className={`flex flex-col items-center gap-0.5 ${currentPage === 'admin' ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>
                <ShieldCheck className="size-4" />
                <span className="text-[10px]">Admin</span>
              </button>
            )}
          </nav>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
