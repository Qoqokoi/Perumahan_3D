import React, { useState } from 'react';
import {
  Building2, Printer, Calendar, User, Phone, Mail,
  MapPin, CreditCard, ShieldCheck, CheckCircle2, FileText, ArrowLeft, Trash2,
  Clock, Wallet, ArrowRight, X, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export interface InvoiceData {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyLocation?: string;
  propertyPrice?: number;
  propertyArea?: number;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  buyerNik?: string;
  downPayment?: number;
  paymentMethod?: string;
  totalPrice?: number;
  remaining?: number;
  deadline?: any;
  date?: any;
  createdAt?: any;
  buyer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    nik?: string;
  };
  property?: {
    title?: string;
    location?: string;
    area?: number;
    price?: number;
  };
  payment?: {
    downPayment?: number;
    paymentMethod?: string;
  };
}

interface SalesInvoiceProps {
  invoices?: InvoiceData[] | any[];
  onBack?: () => void;
  isAdmin?: boolean;
  onDeleteInvoice?: (id: string) => void;
  onPayInstallment?: (invoiceId: string, amount: number, method: string) => void;
}

const formatTanggalIndonesia = (rawDate: any): string => {
  if (!rawDate) {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  if (typeof rawDate === 'object' && rawDate.seconds !== undefined) {
    return new Date(rawDate.seconds * 1000).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const hitungDeadline = (rawDate: any): string => {
  let baseDate = new Date();
  if (rawDate) {
    if (typeof rawDate === 'object' && rawDate.seconds !== undefined) {
      baseDate = new Date(rawDate.seconds * 1000);
    } else {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) baseDate = parsed;
    }
  }
  // Tambahkan 30 hari sebagai tenggat waktu cicilan berikutnya
  const deadlineDate = new Date(baseDate);
  deadlineDate.setDate(deadlineDate.getDate() + 30);

  return deadlineDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function SalesInvoice({
  invoices = [],
  onBack,
  isAdmin = false,
  onDeleteInvoice,
  onPayInstallment
}: SalesInvoiceProps) {
  const invoiceList: InvoiceData[] = Array.isArray(invoices) ? (invoices as InvoiceData[]) : [];
  const [selectedId, setSelectedId] = useState<string | null>(invoiceList[0]?.id || null);

  // Modal State Lanjut Bayar
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  const [installmentMethod, setInstallmentMethod] = useState<string>('Transfer Bank (BCA / Mandiri / BRI)');

  const activeInvoice: InvoiceData | undefined =
    invoiceList.find((inv: InvoiceData) => inv.id === selectedId) || invoiceList[0];

  const handlePrint = () => {
    window.print();
  };

  if (invoiceList.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
        <FileText className="size-14 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base sm:text-lg font-bold text-gray-800">Belum Ada Riwayat Nota & Tagihan</h3>
        <p className="text-xs text-gray-500 mt-1 mb-5 leading-relaxed">
          Silakan pesan unit properti 3D di katalog untuk menerbitkan lembar nota resmi dan memantau status tagihan.
        </p>
        {onBack && (
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            Kembali ke Katalog Properti
          </Button>
        )}
      </div>
    );
  }

  const totalHarga = Number(
    activeInvoice?.totalPrice ||
    activeInvoice?.propertyPrice ||
    activeInvoice?.property?.price ||
    0
  );

  const totalDp = Number(
    activeInvoice?.downPayment ||
    activeInvoice?.payment?.downPayment ||
    0
  );

  const sisaPelunasan = Math.max(0, totalHarga - totalDp);
  const persentaseLunas = totalHarga > 0 ? Math.min(100, Math.round((totalDp / totalHarga) * 100)) : 0;
  const isLunas = sisaPelunasan === 0;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(installmentAmount.replace(/\D/g, ''));

    if (amountNum <= 0) {
      alert('Gagal: Nominal pembayaran harus lebih dari Rp 0!');
      return;
    }

    if (amountNum > sisaPelunasan) {
      alert(`Gagal: Nominal pembayaran tidak boleh melebihi sisa tagihan (Rp ${sisaPelunasan.toLocaleString('id-ID')})!`);
      return;
    }

    if (activeInvoice && onPayInstallment) {
      onPayInstallment(activeInvoice.id, amountNum, installmentMethod);
      setShowPaymentModal(false);
      setInstallmentAmount('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6 space-y-5">

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="h-8 gap-1 text-xs">
              <ArrowLeft className="size-3.5" /> Kembali
            </Button>
          )}
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">Lembar Nota & Status Tagihan</h2>
            <p className="text-[11px] sm:text-xs text-gray-500">Pantau progres pembayaran dan pelunasan kepemilikan unit Delon Clusters 3D</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
          {isAdmin && activeInvoice && onDeleteInvoice && (
            <Button
              variant="outline"
              onClick={() => onDeleteInvoice(activeInvoice.id)}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs gap-1.5 h-9"
            >
              <Trash2 className="size-3.5" /> Hapus Nota
            </Button>
          )}
          <Button
            onClick={handlePrint}
            className="bg-gray-900 hover:bg-black text-white text-xs gap-2 shadow-sm font-semibold h-9 flex-1 sm:flex-initial"
          >
            <Printer className="size-3.5" /> Cetak / PDF
          </Button>
        </div>
      </div>

      {/* PANEL STATUS TAGIHAN & LANJUT BAYAR (ACTIVE NOTA) */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-blue-700 print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <Wallet className="size-5 text-blue-300" />
            </div>
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-mono tracking-wider">No. Registrasi: {activeInvoice?.id}</span>
              <h3 className="text-base sm:text-lg font-bold">{activeInvoice?.propertyTitle || 'Unit Delon Clusters 3D'}</h3>
            </div>
          </div>

          <Badge className={`text-xs font-bold px-3 py-1 ${isLunas ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>
            {isLunas ? 'LUNAS (HAK MILIK PENUH)' : 'BELUM LUNAS (DALAM CICILAN)'}
          </Badge>
        </div>

        {/* Grid Angka Tagihan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] text-blue-200">Total Harga Unit:</span>
            <p className="text-base sm:text-lg font-black mt-0.5">Rp {totalHarga.toLocaleString('id-ID')}</p>
          </div>

          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-300">Total Terbayar (DP + Cicilan):</span>
            <p className="text-base sm:text-lg font-black text-emerald-300 mt-0.5">Rp {totalDp.toLocaleString('id-ID')}</p>
          </div>

          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] text-amber-200 font-semibold">Sisa Tagihan yang Harus Dibayar:</span>
            <p className="text-base sm:text-lg font-black text-amber-300 mt-0.5">Rp {sisaPelunasan.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Progress Bar & Deadline Info */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-blue-200">Progres Pelunasan: <b className="text-white font-bold">{persentaseLunas}%</b></span>
            <span className="text-blue-200 flex items-center gap-1">
              <Clock className="size-3.5 text-amber-300" /> Deadline Cicilan: <b className="text-white font-bold">{hitungDeadline(activeInvoice?.date || activeInvoice?.createdAt)}</b>
            </span>
          </div>
          <div className="w-full bg-blue-950/60 rounded-full h-2.5 overflow-hidden border border-blue-700/50">
            <div
              className={`h-full transition-all duration-500 rounded-full ${isLunas ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-emerald-400'}`}
              style={{ width: `${persentaseLunas}%` }}
            />
          </div>
        </div>

        {/* Action Button Lanjut Bayar */}
        {!isLunas && (
          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => {
                setInstallmentAmount(String(Math.min(sisaPelunasan, 25000000)));
                setShowPaymentModal(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg gap-2"
            >
              <CreditCard className="size-4" /> Lanjut Bayar Tagihan / Pelunasan <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Kolom Kiri: Riwayat Nota */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-sm space-y-3 print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600">
              Daftar Nota ({invoiceList.length})
            </h4>
            <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200 font-semibold">
              Sinkron Cloud
            </Badge>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {invoiceList.map((inv: InvoiceData) => {
              const isSelected = (inv.id === (activeInvoice?.id || ''));
              const invTotal = Number(inv.totalPrice || inv.propertyPrice || inv.property?.price || 0);
              const invPaid = Number(inv.downPayment || inv.payment?.downPayment || 0);
              const invSisa = Math.max(0, invTotal - invPaid);
              const invLunas = invSisa === 0;

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left ${isSelected
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-700">{inv.id}</span>
                    <Badge className={`text-[9px] py-0 ${invLunas ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                      {invLunas ? 'Lunas' : 'Belum Lunas'}
                    </Badge>
                  </div>
                  <p className="font-bold text-gray-800 text-xs mt-1 truncate">
                    {inv.buyerName || inv.buyer?.name || 'Pembeli'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-gray-400" />
                      {formatTanggalIndonesia(inv.date || inv.createdAt)}
                    </span>
                    <span className="font-semibold text-gray-700">
                      Sisa: Rp {invSisa.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Lembar Fisik Nota Resmi */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-8 border border-gray-200 shadow-md print:border-none print:shadow-none print:p-0">

          {/* Header Surat */}
          <div className="text-center pb-4 border-b-2 border-gray-800 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="size-6 sm:size-7 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 uppercase">
                Delon Clusters 3D
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-600">
              Pengembangan Kawasan Properti Modern Berbasis Visualisasi Real-Time Tiga Dimensi
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-500">
              Jl. Delon Boulevard No. 88, Ponorogo, Jawa Timur | Telp: (0352) 889977 | official@delonclusters.com
            </p>
          </div>

          {/* Nomor Registrasi */}
          <div className="grid grid-cols-2 gap-3 py-3 border-b border-gray-200 text-xs">
            <div>
              <p className="text-gray-500">No. Registrasi Nota:</p>
              <p className="font-mono font-bold text-xs sm:text-sm text-blue-700">{activeInvoice?.id}</p>
              <p className="text-gray-500 mt-1.5">Tanggal Terbit:</p>
              <p className="font-semibold text-gray-800">
                {formatTanggalIndonesia(activeInvoice?.date || activeInvoice?.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Status Pembayaran:</p>
              <span className={`inline-block mt-0.5 px-2.5 py-0.5 font-bold rounded text-[10px] sm:text-xs border ${isLunas ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                {isLunas ? 'LUNAS - HAK MILIK RESMI' : 'DP & CICILAN TERVERIFIKASI'}
              </span>
              <p className="text-gray-500 mt-1.5">Metode Bayar Terakhir:</p>
              <p className="font-semibold text-gray-800 text-[11px]">
                {activeInvoice?.paymentMethod || activeInvoice?.payment?.paymentMethod || 'Transfer Bank'}
              </p>
            </div>
          </div>

          {/* Data Pembeli & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
            <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 pb-1 border-b border-gray-200">
                <User className="size-3.5 text-blue-600" />
                <span>Identitas Pemesan</span>
              </div>
              <p><span className="text-gray-500">Nama:</span> <strong className="text-gray-900">{activeInvoice?.buyerName || activeInvoice?.buyer?.name || '-'}</strong></p>
              <p><span className="text-gray-500">NIK:</span> <strong className="font-mono text-gray-900">{activeInvoice?.buyerNik || activeInvoice?.buyer?.nik || '-'}</strong></p>
              <p><span className="text-gray-500">WhatsApp:</span> <strong className="text-gray-900">{activeInvoice?.buyerPhone || activeInvoice?.buyer?.phone || '-'}</strong></p>
              <p><span className="text-gray-500">Email:</span> <strong className="text-gray-900">{activeInvoice?.buyerEmail || activeInvoice?.buyer?.email || '-'}</strong></p>
              <p><span className="text-gray-500">Alamat:</span> <strong className="text-gray-900">{activeInvoice?.buyerAddress || activeInvoice?.buyer?.address || '-'}</strong></p>
            </div>

            <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 pb-1 border-b border-gray-200">
                <Building2 className="size-3.5 text-blue-600" />
                <span>Rincian Unit Properti</span>
              </div>
              <p><span className="text-gray-500">Tipe Unit:</span> <strong className="text-gray-900">{activeInvoice?.propertyTitle || activeInvoice?.property?.title || 'Cluster Premium'}</strong></p>
              <p><span className="text-gray-500">Lokasi:</span> <strong className="text-gray-900">{activeInvoice?.propertyLocation || activeInvoice?.property?.location || 'Kawasan Blok A'}</strong></p>
              <p><span className="text-gray-500">Luas:</span> <strong className="text-gray-900">{activeInvoice?.propertyArea || activeInvoice?.property?.area || 120} m² (3D Verified)</strong></p>
              <p><span className="text-gray-500">Legalitas:</span> <strong className="text-emerald-700">SHM (Sertifikat Hak Milik)</strong></p>
            </div>
          </div>

          {/* Rincian Finansial */}
          <div className="py-4 border-b border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500 text-left">
                  <th className="pb-1.5">Deskripsi Alokasi</th>
                  <th className="pb-1.5 text-right">Nominal (Rupiah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="py-2 text-gray-800">Total Harga Unit Properti</td>
                  <td className="py-2 text-right font-bold text-gray-900">
                    Rp {totalHarga.toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-emerald-700 font-semibold">Total Pembayaran Masuk (DP & Cicilan)</td>
                  <td className="py-2 text-right font-bold text-emerald-700">
                    - Rp {totalDp.toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr className="bg-blue-50/70 font-black text-xs sm:text-sm">
                  <td className="p-2.5 text-blue-950">Sisa Tagihan / Pelunasan KPR</td>
                  <td className="p-2.5 text-right text-blue-600">
                    Rp {sisaPelunasan.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan */}
          <div className="pt-5 grid grid-cols-2 gap-3 text-center text-xs">
            <div>
              <p className="text-gray-500">Diverifikasi Sistem,</p>
              <p className="font-bold text-gray-800 mt-0.5">Delon Clusters Admin</p>
              <div className="my-2.5 flex justify-center">
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 text-[9px] gap-1 font-semibold">
                  <ShieldCheck className="size-3" /> E-Signature Verified
                </Badge>
              </div>
              <p className="font-mono text-[9px] text-gray-400">
                Hash: {activeInvoice?.id?.slice(0, 14) || 'SEC-VERIFIED'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Pemilik / Pembeli,</p>
              <p className="font-bold text-gray-900 mt-0.5">
                {activeInvoice?.buyerName || activeInvoice?.buyer?.name || 'Pembeli'}
              </p>
              <div className="h-8"></div>
              <p className="font-bold text-gray-800 underline underline-offset-4">
                ( {activeInvoice?.buyerName || activeInvoice?.buyer?.name || '.......................'} )
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL LANJUT BAYAR / CICILAN */}
      {showPaymentModal && activeInvoice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-sm text-gray-900">Pembayaran Tagihan / Cicilan</h4>
                <p className="text-[11px] text-gray-500">{activeInvoice.propertyTitle}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="size-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-amber-900">
                <span>Sisa Tagihan Saat Ini:</span>
                <b className="text-blue-700 font-bold">Rp {sisaPelunasan.toLocaleString('id-ID')}</b>
              </div>
              <div className="flex justify-between text-amber-800 text-[11px]">
                <span>Tenggat Waktu (Deadline):</span>
                <b>{hitungDeadline(activeInvoice.date || activeInvoice.createdAt)}</b>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700">Nominal Pembayaran Lanjutan</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    required
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukkan nominal..."
                    className="pl-9 font-bold text-gray-900 text-sm"
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setInstallmentAmount('10000000')}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-semibold text-gray-700"
                  >
                    Rp 10 Jt
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallmentAmount('25000000')}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-semibold text-gray-700"
                  >
                    Rp 25 Jt
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallmentAmount(String(sisaPelunasan))}
                    className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded text-[10px] font-bold text-emerald-800 ml-auto"
                  >
                    Lunasi Semua (Rp {sisaPelunasan.toLocaleString('id-ID')})
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700">Metode Penyaluran Dana</label>
                <select
                  value={installmentMethod}
                  onChange={(e) => setInstallmentMethod(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Transfer Bank (BCA / Mandiri / BRI)">Transfer Bank Otomatis (BCA / Mandiri / BRI)</option>
                  <option value="Virtual Account Realtime">Virtual Account 24 Jam (VA)</option>
                  <option value="QRIS Dynamic Payment">QRIS Instant Payment</option>
                  <option value="KPR Developer Cicilan Bertahap">KPR In-House (Cicilan Bertahap)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1 text-xs">
                  Batal
                </Button>
                <Button type="submit" className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5">
                  Konfirmasi Pembayaran
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
