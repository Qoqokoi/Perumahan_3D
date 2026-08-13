import { Property } from '../App';
import { useState } from 'react';
import { X, MapPin, Bed, Bath, Maximize, Calendar, CheckCircle, Phone, Mail, ShoppingCart, ScanLine } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { KTPScanner } from './KTPScanner';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onPurchase?: (buyerData: any, paymentData: any) => void;
}

export function PropertyDetail({ property, onClose, onPurchase }: PropertyDetailProps) {
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showKTPScanner, setShowKTPScanner] = useState(false);
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

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(buyerData, paymentData);
    }
  };

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      house: 'Rumah',
      apartment: 'Apartemen',
      villa: 'Villa'
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{property.title}</span>
            <Badge className="bg-blue-600">{getTypeLabel(property.type)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div className="relative rounded-lg overflow-hidden">
            <ImageWithFallback 
              src={property.image} 
              alt={property.title}
              className="w-full h-96 object-cover"
            />
          </div>

          {/* Price and Location */}
          <div>
            <p className="text-blue-600 mb-2">{formatPrice(property.price)}</p>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="size-5" />
              <span>{property.location}</span>
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bed className="size-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Kamar Tidur</p>
                <p>{property.bedrooms}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="size-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Kamar Mandi</p>
                <p>{property.bathrooms}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Maximize className="size-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Luas Tanah</p>
                <p>{property.area} m²</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Tahun Dibangun</p>
                <p>{property.yearBuilt}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-2">Deskripsi</h3>
            <p className="text-gray-600">{property.description}</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="mb-3">Fasilitas</h3>
            <div className="grid grid-cols-2 gap-2">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-green-600" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {!showPurchaseForm ? (
            /* Contact Actions */
            <div className="flex gap-3 pt-4 border-t">
              <Button className="flex-1 gap-2">
                <Phone className="size-4" />
                Hubungi Penjual
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Mail className="size-4" />
                Kirim Pesan
              </Button>
              {onPurchase && (
                <Button 
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => setShowPurchaseForm(true)}
                >
                  <ShoppingCart className="size-4" />
                  Beli Sekarang
                </Button>
              )}
            </div>
          ) : (
            /* Purchase Form */
            <div className="space-y-4 pt-4 border-t">
              <h3>Form Pembelian</h3>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4>Data Pembeli</h4>
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
                <h4>Data Pembayaran</h4>
                <div>
                  <Label>Uang Muka (DP)</Label>
                  <Input
                    type="number"
                    value={paymentData.downPayment}
                    onChange={(e) => setPaymentData({ ...paymentData, downPayment: Number(e.target.value) })}
                    placeholder="Masukkan nominal DP"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Sisa pembayaran: {formatPrice(property.price - paymentData.downPayment)}
                  </p>
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

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPurchaseForm(false)} className="flex-1">
                  Batal
                </Button>
                <Button onClick={handlePurchase} className="flex-1 bg-green-600 hover:bg-green-700">
                  Proses Pembelian
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* KTP Scanner Modal */}
        {showKTPScanner && (
          <KTPScanner
            onDataExtracted={handleKTPDataExtracted}
            onClose={() => setShowKTPScanner(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}