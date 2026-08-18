import React, { useState, useEffect } from 'react';
import { Property } from '../App';
import {
  X, MapPin, Bed, Bath, Maximize2, CheckCircle2,
  ShieldCheck, CreditCard, Building2, UserCheck, AlertCircle, Lock
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface PropertyDetailProps {
  property: Property;
  currentUser?: any;
  onClose: () => void;
  onPurchase: (buyerData: any, paymentData: any) => void;
}

export function PropertyDetail({
  property,
  currentUser,
  onClose,
  onPurchase
}: PropertyDetailProps) {
  const isUserLoggedIn = Boolean(currentUser && currentUser.fullName);

  const getInitialEmail = () => {
    if (!currentUser?.email) return '';
    const raw = currentUser.email.trim();
    return raw.includes('@') ? raw : `${raw}@gmail.com`;
  };

  const [name, setName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(getInitialEmail);
  const [address, setAddress] = useState(currentUser?.address || '');
  const [nik, setNik] = useState(currentUser?.nik || '');

  const [downPayment, setDownPayment] = useState<string>('50000000');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank (BCA / Mandiri / BRI)');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
      setNik(currentUser.nik || '');

      const rawMail = currentUser.email || '';
      setEmail(rawMail.includes('@') ? rawMail : `${rawMail}@gmail.com`);
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNik('');
      setEmail('');
    }
  }, [currentUser]);

  const handleEmailBlur = () => {
    const trimmed = email.trim();
    if (trimmed && !trimmed.includes('@')) {
      setEmail(`${trimmed}@gmail.com`);
    }
  };

  const dpNumber = Number(downPayment) || 0;
  const remainingPayment = Math.max(0, property.price - dpNumber);

  const handleDpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setDownPayment(rawVal);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isUserLoggedIn) {
      alert('Akses Ditolak: Anda wajib Login dengan akun yang sudah di-ACC Admin sebelum melakukan pemesanan!');
      return;
    }

    const cleanNik = nik.replace(/\D/g, '').trim();
    const cleanPhone = phone.replace(/\D/g, '').trim();
    const finalEmail = email.trim().includes('@') ? email.trim() : `${email.trim()}@gmail.com`;

    if (!name.trim() || !cleanPhone || !finalEmail || !address.trim() || !cleanNik) {
      alert('Gagal: Semua data identitas pemesan (NIK, Nama, WA, Email, Alamat) wajib terisi!');
      return;
    }

    if (cleanNik.length !== 16) {
      alert('Gagal: NIK pemesan harus berupa 16 digit angka!');
      return;
    }

    if (dpNumber < 10000000) {
      alert('Gagal: Uang Muka (DP) minimal pemesanan unit adalah Rp 10.000.000!');
      return;
    }

    if (dpNumber > property.price) {
      alert('Gagal: Nominal DP tidak boleh melebihi total harga unit!');
      return;
    }

    onPurchase(
      {
        name: name.trim(),
        phone: cleanPhone,
        email: finalEmail,
        address: address.trim(),
        nik: cleanNik
      },
      {
        downPayment: dpNumber,
        paymentMethod
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-gray-100 flex flex-col max-h-[92vh]">

        {/* Header Modal */}
        <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white text-[11px]">Unit Terverifikasi 3D</Badge>
            <h3 className="font-bold text-gray-900 text-base md:text-lg truncate max-w-md">
              {property.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6">

          {/* Section 1: Visual & Spesifikasi */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden border bg-gray-100 shadow-inner">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/rumah-delon.jpeg';
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span className="flex items-center gap-1"><MapPin className="size-3.5 text-blue-600" /> {property.location}</span>
                <span className="font-semibold text-gray-700">Tahun Bangun: {property.yearBuilt}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Harga Resmi Unit</p>
                <h4 className="text-2xl md:text-3xl font-extrabold text-blue-600">
                  Rp {property.price.toLocaleString('id-ID')}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
                <div className="bg-gray-50 p-2.5 rounded-lg text-center">
                  <Bed className="size-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-[11px] text-gray-500">Kamar Tidur</p>
                  <p className="font-bold text-gray-800 text-xs">{property.bedrooms} Kamar</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg text-center">
                  <Bath className="size-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-[11px] text-gray-500">Kamar Mandi</p>
                  <p className="font-bold text-gray-800 text-xs">{property.bathrooms} Ruang</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg text-center">
                  <Maximize2 className="size-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-[11px] text-gray-500">Luas Bangunan</p>
                  <p className="font-bold text-gray-800 text-xs">{property.area} m²</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-800 mb-1">Deskripsi Arsitektur 3D:</p>
                <p className="text-xs text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-800 mb-1.5">Fasilitas Utama:</p>
                <div className="flex flex-wrap gap-1.5">
                  {property.features.map((feat, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium">
                      <CheckCircle2 className="size-3 text-blue-600" /> {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Form Pemesanan */}
          <form onSubmit={handleFormSubmit} className="space-y-5">

            {/* Status Autentikasi Pengguna */}
            {isUserLoggedIn ? (
              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-5 text-emerald-600" />
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs md:text-sm">Identitas Pembeli Terverifikasi</h5>
                    <p className="text-[10px] text-gray-500">Akun telah diverifikasi & di-ACC oleh Administrator</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] gap-1 font-medium">
                  <ShieldCheck className="size-3" /> E-KTP Valid & ACC
                </Badge>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-3 text-amber-900">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Peringatan: Anda Belum Login / Belum Terverifikasi</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Identitas pembeli belum terdeteksi. Silakan tutup jendela ini, lalu <b>Daftar / Login</b> dengan akun yang telah disetujui (ACC) Admin agar dapat memesan unit.
                  </p>
                </div>
              </div>
            )}

            {/* Grid Input Data Pembeli */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">NIK (Nomor KTP)</label>
                <Input
                  value={nik}
                  disabled={!isUserLoggedIn}
                  maxLength={16}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  placeholder={isUserLoggedIn ? "3502xxxxxxxxxxxx" : "Login untuk memuat NIK"}
                  className={`text-xs font-mono font-bold ${isUserLoggedIn ? 'bg-gray-50' : 'bg-gray-100 cursor-not-allowed'}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Nama Lengkap Pemesan</label>
                <Input
                  value={name}
                  disabled={!isUserLoggedIn}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isUserLoggedIn ? "Nama lengkap..." : "Login untuk memuat Nama"}
                  className={`text-xs font-medium ${isUserLoggedIn ? 'bg-gray-50' : 'bg-gray-100 cursor-not-allowed'}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Nomor WhatsApp / HP</label>
                <Input
                  value={phone}
                  disabled={!isUserLoggedIn}
                  maxLength={14}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={isUserLoggedIn ? "08xxxxxxxxxx" : "Login untuk memuat No. HP"}
                  className={`text-xs font-mono font-medium ${isUserLoggedIn ? 'bg-gray-50' : 'bg-gray-100 cursor-not-allowed'}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Alamat Email</label>
                <Input
                  type="text"
                  disabled={!isUserLoggedIn}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder={isUserLoggedIn ? "nama@gmail.com" : "Login untuk memuat Email"}
                  className={`text-xs font-medium ${isUserLoggedIn ? 'bg-gray-50' : 'bg-gray-100 cursor-not-allowed'}`}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-700">Alamat Domisili KTP</label>
                <Input
                  value={address}
                  disabled={!isUserLoggedIn}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isUserLoggedIn ? "Alamat domisili..." : "Login untuk memuat Alamat KTP"}
                  className={`text-xs font-medium ${isUserLoggedIn ? 'bg-gray-50' : 'bg-gray-100 cursor-not-allowed'}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <CreditCard className="size-4 text-blue-600" />
              <h5 className="font-bold text-gray-900 text-xs md:text-sm">Rincian Skema Pembayaran Unit</h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-800">
                  Uang Muka (Down Payment - DP) <span className="text-red-500">*Min Rp 10 Juta</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    disabled={!isUserLoggedIn}
                    value={downPayment}
                    onChange={handleDpChange}
                    placeholder="Masukkan nominal DP..."
                    className="pl-9 font-bold text-gray-900 text-sm bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Nominal DP: <span className="font-bold text-gray-700">Rp {dpNumber.toLocaleString('id-ID')}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-800">Metode Penyaluran DP</label>
                <select
                  value={paymentMethod}
                  disabled={!isUserLoggedIn}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="Transfer Bank (BCA / Mandiri / BRI)">Transfer Bank Otomatis (BCA / Mandiri / BRI)</option>
                  <option value="Virtual Account Realtime">Virtual Account 24 Jam (VA)</option>
                  <option value="QRIS Dynamic Payment">QRIS Instant Payment</option>
                  <option value="KPR Developer Cicilan Bertahap">KPR In-House (Cicilan Bertahap)</option>
                </select>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <p className="text-xs text-gray-500">Sisa Pelunasan / Akad KPR:</p>
                  <p className="text-lg font-black text-blue-600">
                    Rp {remainingPayment.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] text-gray-500">
                  <p>Total Harga: <b>Rp {property.price.toLocaleString('id-ID')}</b></p>
                  <p>Status: <span className="text-emerald-600 font-bold">Booking Valid</span></p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 text-xs py-2.5"
              >
                Batal
              </Button>

              {isUserLoggedIn ? (
                <Button
                  type="submit"
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-md transition"
                >
                  Proses Pembelian & Terbitkan Nota Otomatis
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled
                  className="flex-[2] bg-gray-300 text-gray-500 font-bold text-xs py-2.5 cursor-not-allowed gap-1.5"
                >
                  <Lock className="size-3.5" /> Wajib Login untuk Membeli Unit
                </Button>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
