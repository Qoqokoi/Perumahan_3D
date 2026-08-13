import { useState } from 'react';
import { Property, Transaction } from '../App';
import { Printer, Plus, Calendar, User, Phone, Mail, MapPin, Home as HomeIcon, ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { KTPScanner } from './KTPScanner';

interface SalesInvoiceProps {
  transactions: Transaction[];
  onCreateInvoice: (property: Property, buyerData: any, paymentData: any) => void;
  properties: Property[];
}

export function SalesInvoice({ transactions, onCreateInvoice, properties }: SalesInvoiceProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(
    transactions.length > 0 ? transactions[0] : null
  );
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [showKTPScanner, setShowKTPScanner] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [buyerData, setBuyerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [paymentData, setPaymentData] = useState({
    downPayment: 0,
    paymentMethod: 'transfer'
  });

  const handleKTPDataExtracted = (ktpData: any) => {
    // Build full address from KTP data
    let fullAddress = '';
    if (ktpData.address) fullAddress += ktpData.address;
    if (ktpData.rtRw) fullAddress += ` ${ktpData.rtRw}`;
    if (ktpData.village) fullAddress += `, ${ktpData.village}`;
    if (ktpData.district) fullAddress += `, ${ktpData.district}`;
    if (ktpData.city) fullAddress += `, ${ktpData.city}`;
    if (ktpData.province) fullAddress += `, ${ktpData.province}`;

    setBuyerData({
      name: ktpData.name || '',
      phone: buyerData.phone, // Keep existing phone as KTP doesn't have it
      email: buyerData.email, // Keep existing email as KTP doesn't have it
      address: fullAddress.trim() || ''
    });
    
    setShowKTPScanner(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateNewInvoice = () => {
    const property = properties.find(p => p.id === selectedProperty);
    if (property) {
      onCreateInvoice(property, buyerData, paymentData);
      setShowNewInvoiceDialog(false);
      // Reset form
      setSelectedProperty('');
      setBuyerData({ name: '', phone: '', email: '', address: '' });
      setPaymentData({ downPayment: 0, paymentMethod: 'transfer' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - List of Invoices */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Nota</CardTitle>
                <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="size-4" />
                      Buat
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Buat Nota Penjualan Baru</DialogTitle>
                      <DialogDescription>Pilih properti dan masukkan data pembeli serta pembayaran.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Pilih Properti</Label>
                        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih properti..." />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map(property => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.title} - {formatPrice(property.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3>Data Pembeli</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowKTPScanner(true)}
                            className="gap-2"
                          >
                            <ScanLine className="size-4" />
                            Scan KTP
                          </Button>
                        </div>
                        <div>
                          <Label>Nama Lengkap</Label>
                          <Input
                            value={buyerData.name}
                            onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
                            placeholder="Masukkan nama lengkap"
                          />
                        </div>
                        <div>
                          <Label>Nomor Telepon</Label>
                          <Input
                            value={buyerData.phone}
                            onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                            placeholder="Masukkan nomor telepon"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={buyerData.email}
                            onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                            placeholder="Masukkan email"
                          />
                        </div>
                        <div>
                          <Label>Alamat</Label>
                          <Input
                            value={buyerData.address}
                            onChange={(e) => setBuyerData({ ...buyerData, address: e.target.value })}
                            placeholder="Masukkan alamat lengkap"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h3>Data Pembayaran</h3>
                        <div>
                          <Label>Uang Muka (DP)</Label>
                          <Input
                            type="number"
                            value={paymentData.downPayment}
                            onChange={(e) => setPaymentData({ ...paymentData, downPayment: Number(e.target.value) })}
                            placeholder="Masukkan nominal DP"
                          />
                        </div>
                        <div>
                          <Label>Metode Pembayaran</Label>
                          <Select value={paymentData.paymentMethod} onValueChange={(v) => setPaymentData({ ...paymentData, paymentMethod: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transfer">Transfer Bank</SelectItem>
                              <SelectItem value="cash">Tunai</SelectItem>
                              <SelectItem value="kpr">KPR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={handleCreateNewInvoice} className="w-full">
                        Buat Nota
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada nota</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(transaction => (
                    <button
                      key={transaction.id}
                      onClick={() => setSelectedTransaction(transaction)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedTransaction?.id === transaction.id
                          ? 'bg-blue-50 border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm">{transaction.invoiceNumber}</p>
                      <p className="text-xs text-gray-600">{transaction.buyer.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Invoice Display */}
        <div className="lg:col-span-3">
          {selectedTransaction ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Nota Penjualan</CardTitle>
                  <Button onClick={handlePrint} className="gap-2">
                    <Printer className="size-4" />
                    Cetak Nota
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 print:p-8">
                  {/* Invoice Header */}
                  <div className="text-center border-b pb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <HomeIcon className="size-8 text-blue-600" />
                      <h1 className="text-blue-600">RumahKu</h1>
                    </div>
                    <p className="text-sm text-gray-600">Jl. Properti Indah No. 123, Jakarta</p>
                    <p className="text-sm text-gray-600">Telp: (021) 1234-5678 | Email: info@rumahku.com</p>
                  </div>

                  {/* Invoice Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="mb-3">Informasi Nota</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Calendar className="size-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-gray-600">Nomor Nota</p>
                            <p>{selectedTransaction.invoiceNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="size-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-gray-600">Tanggal</p>
                            <p>{formatDate(selectedTransaction.date)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3">Data Pembeli</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <User className="size-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-gray-600">Nama</p>
                            <p>{selectedTransaction.buyer.name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="size-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-gray-600">Telepon</p>
                            <p>{selectedTransaction.buyer.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail className="size-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p>{selectedTransaction.buyer.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="size-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-gray-600">Alamat</p>
                            <p>{selectedTransaction.buyer.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Property Details */}
                  <div>
                    <h3 className="mb-3">Detail Properti</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="mb-2">{selectedTransaction.property.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{selectedTransaction.property.location}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Tipe</p>
                          <p className="capitalize">{selectedTransaction.property.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Luas Tanah</p>
                          <p>{selectedTransaction.property.area} m²</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Kamar Tidur</p>
                          <p>{selectedTransaction.property.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Kamar Mandi</p>
                          <p>{selectedTransaction.property.bathrooms}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Details */}
                  <div>
                    <h3 className="mb-3">Rincian Pembayaran</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harga Properti</span>
                        <span>{formatPrice(selectedTransaction.property.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uang Muka (DP)</span>
                        <span className="text-green-600">-{formatPrice(selectedTransaction.downPayment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Metode Pembayaran</span>
                        <span className="capitalize">{selectedTransaction.paymentMethod === 'transfer' ? 'Transfer Bank' : selectedTransaction.paymentMethod === 'cash' ? 'Tunai' : 'KPR'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span>Sisa Pembayaran</span>
                        <span className="text-blue-600">{formatPrice(selectedTransaction.remaining)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t pt-6 mt-8">
                    <div className="grid grid-cols-2 gap-8 text-center text-sm">
                      <div>
                        <p className="mb-12 text-gray-600">Pembeli</p>
                        <div className="border-t border-gray-400 inline-block px-8">
                          <p className="mt-2">{selectedTransaction.buyer.name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="mb-12 text-gray-600">Penjual</p>
                        <div className="border-t border-gray-400 inline-block px-8">
                          <p className="mt-2">RumahKu</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-500 mt-6">
                    <p>Terima kasih atas kepercayaan Anda</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Pilih nota dari daftar atau buat nota baru</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-8, .print\\:p-8 * {
            visibility: visible;
          }
          .print\\:p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
        }
      `}</style>

      {/* KTP Scanner Modal */}
      {showKTPScanner && (
        <KTPScanner
          onDataExtracted={handleKTPDataExtracted}
          onClose={() => setShowKTPScanner(false)}
        />
      )}
    </div>
  );
}