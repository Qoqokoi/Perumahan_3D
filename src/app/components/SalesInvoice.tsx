import React, { useState } from 'react';
import {
  Building2, Printer, Calendar, User, Phone, Mail,
  MapPin, CreditCard, ShieldCheck, CheckCircle2, FileText, ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
  date?: any;
  createdAt?: any;
  buyer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
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

export default function SalesInvoice({ invoices = [], onBack }: SalesInvoiceProps) {
  const invoiceList: InvoiceData[] = Array.isArray(invoices) ? (invoices as InvoiceData[]) : [];
  const [selectedId, setSelectedId] = useState<string | null>(invoiceList[0]?.id || null);

  const activeInvoice: InvoiceData | undefined =
    invoiceList.find((inv: InvoiceData) => inv.id === selectedId) || invoiceList[0];

  const handlePrint = () => {
    window.print();
  };

  if (invoiceList.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm max-w-xl mx-auto my-12">
        <FileText className="size-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Belum Ada Riwayat Nota Transaksi</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Silakan pilih dan lakukan pemesanan unit properti 3D di katalog untuk menerbitkan nota resmi otomatis.
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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="h-9 gap-1 text-xs">
              <ArrowLeft className="size-3.5" /> Kembali
            </Button>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Lembar Nota & Bukti Transaksi</h2>
            <p className="text-xs text-gray-500">Dokumen transaksi sah kepemilikan unit Delon Clusters 3D</p>
          </div>
        </div>
        <Button
          onClick={handlePrint}
          className="bg-gray-900 hover:bg-black text-white text-xs gap-2 shadow-sm font-semibold print:hidden"
        >
          <Printer className="size-4" /> Cetak / Simpan PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Kolom Kiri: Riwayat Nota */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3 print:hidden">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600">
              Daftar Nota ({invoiceList.length})
            </h4>
            <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200 font-semibold">
              Sinkron Cloud
            </Badge>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {invoiceList.map((inv: InvoiceData) => {
              const isSelected = (inv.id === (activeInvoice?.id || ''));
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${isSelected
                      ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-700">{inv.id}</span>
                    <Badge className="bg-emerald-600 text-white text-[10px] py-0">Terbit</Badge>
                  </div>
                  <p className="font-bold text-gray-800 text-xs mt-1 truncate">
                    {inv.buyerName || inv.buyer?.name || 'Pembeli Terverifikasi'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-gray-400" />
                      {formatTanggalIndonesia(inv.date || inv.createdAt)}
                    </span>
                    <span className="font-semibold text-gray-700">
                      DP: Rp {Number(inv.downPayment || inv.payment?.downPayment || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Lembar Fisik Nota */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-md print:border-none print:shadow-none print:p-0">

          {/* Header Surat Nota */}
          <div className="text-center pb-5 border-b-2 border-gray-800 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="size-7 text-blue-600" />
              <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                Delon Clusters 3D
              </h1>
            </div>
            <p className="text-xs font-semibold text-gray-600">
              Pengembangan Kawasan Properti Modern Berbasis Visualisasi Real-Time Tiga Dimensi
            </p>
            <p className="text-[11px] text-gray-500">
              Jl. Delon Boulevard No. 88, Ponorogo, Jawa Timur | Telp: (0352) 889977 | Email: official@delonclusters.com
            </p>
          </div>

          {/* Nomor Registrasi */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
            <div>
              <p className="text-gray-500">Nomor Registrasi Nota:</p>
              <p className="font-mono font-bold text-sm text-blue-700">{activeInvoice?.id}</p>
              <p className="text-gray-500 mt-2">Tanggal Terbit:</p>
              <p className="font-semibold text-gray-800">
                {formatTanggalIndonesia(activeInvoice?.date || activeInvoice?.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Status Pembayaran:</p>
              <span className="inline-block mt-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-md text-xs border border-emerald-300">
                BOOKING & DP TERVERIFIKASI
              </span>
              <p className="text-gray-500 mt-2">Kanal Pembayaran:</p>
              <p className="font-semibold text-gray-800">
                {activeInvoice?.paymentMethod || activeInvoice?.payment?.paymentMethod || 'Transfer Bank Otomatis'}
              </p>
            </div>
          </div>

          {/* Data Pembeli & Data Unit */}
          <div className="grid md:grid-cols-2 gap-6 py-5 border-b border-gray-200 text-xs">
            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 pb-1 border-b border-gray-200">
                <User className="size-4 text-blue-600" />
                <span>Identitas Pemilik / Pembeli</span>
              </div>
              <p><span className="text-gray-500">Nama:</span> <strong className="text-gray-900">{activeInvoice?.buyerName || activeInvoice?.buyer?.name || '-'}</strong></p>
              <p><span className="text-gray-500">No. WhatsApp:</span> <strong className="text-gray-900">{activeInvoice?.buyerPhone || activeInvoice?.buyer?.phone || '-'}</strong></p>
              <p><span className="text-gray-500">Email:</span> <strong className="text-gray-900">{activeInvoice?.buyerEmail || activeInvoice?.buyer?.email || '-'}</strong></p>
              <p><span className="text-gray-500">Domisili KTP:</span> <strong className="text-gray-900">{activeInvoice?.buyerAddress || activeInvoice?.buyer?.address || '-'}</strong></p>
            </div>

            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 pb-1 border-b border-gray-200">
                <Building2 className="size-4 text-blue-600" />
                <span>Rincian Unit Properti 3D</span>
              </div>
              <p><span className="text-gray-500">Tipe Unit:</span> <strong className="text-gray-900">{activeInvoice?.propertyTitle || activeInvoice?.property?.title || 'Cluster Premium Delon'}</strong></p>
              <p><span className="text-gray-500">Lokasi Blok:</span> <strong className="text-gray-900">{activeInvoice?.propertyLocation || activeInvoice?.property?.location || 'Kawasan Blok A - Delon Clusters'}</strong></p>
              <p><span className="text-gray-500">Spesifikasi:</span> <strong className="text-gray-900">{activeInvoice?.propertyArea || activeInvoice?.property?.area || 120} m² (Visual 3D Verified)</strong></p>
              <p><span className="text-gray-500">Legalitas:</span> <strong className="text-emerald-700">SHM (Sertifikat Hak Milik)</strong></p>
            </div>
          </div>

          {/* Rincian Finansial */}
          <div className="py-5 border-b border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500 text-left">
                  <th className="pb-2">Deskripsi Alokasi Finansial</th>
                  <th className="pb-2 text-right">Nominal (Rupiah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="py-2.5 text-gray-800">Total Harga Unit Properti</td>
                  <td className="py-2.5 text-right font-bold text-gray-900">
                    Rp {totalHarga.toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-emerald-700 font-semibold">Uang Muka (Down Payment - DP) Terbayar</td>
                  <td className="py-2.5 text-right font-bold text-emerald-700">
                    - Rp {totalDp.toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr className="bg-blue-50/70 font-black text-sm">
                  <td className="p-3 text-blue-950">Sisa Pelunasan / Akad KPR</td>
                  <td className="p-3 text-right text-blue-600">
                    Rp {sisaPelunasan.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan */}
          <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs">
            <div>
              <p className="text-gray-500">Diverifikasi oleh Sistem,</p>
              <p className="font-bold text-gray-800 mt-0.5">Delon Clusters 3D Admin</p>
              <div className="my-3 flex justify-center">
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 text-[10px] gap-1 font-semibold">
                  <ShieldCheck className="size-3" /> E-Signature Verified
                </Badge>
              </div>
              <p className="font-mono text-[10px] text-gray-400">
                Security Hash: {activeInvoice?.id?.slice(0, 16) || 'SEC-VERIFIED'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Pemilik / Pembeli Sah,</p>
              <p className="font-bold text-gray-900 mt-0.5">
                {activeInvoice?.buyerName || activeInvoice?.buyer?.name || 'Pembeli'}
              </p>
              <div className="h-10"></div>
              <p className="font-bold text-gray-800 underline underline-offset-4">
                ( {activeInvoice?.buyerName || activeInvoice?.buyer?.name || '.......................'} )
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
