import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, ScanLine } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import Tesseract from 'tesseract.js';

interface KTPData {
  nik?: string;
  name?: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  village?: string;
  rtRw?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  religion?: string;
  maritalStatus?: string;
  occupation?: string;
}

interface KTPScannerProps {
  onDataExtracted: (data: KTPData) => void;
  onClose: () => void;
}

export function KTPScanner({ onDataExtracted, onClose }: KTPScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
      if (!validTypes.includes(file.type)) {
        alert('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau BMP.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setImage(imageData);
        processImage(imageData);
      };
      reader.onerror = () => {
        alert('Gagal membaca file. Silakan coba lagi.');
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input value so same file can be selected again
    event.target.value = '';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Tidak dapat mengakses kamera. Silakan gunakan fitur upload gambar.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setImage(imageData);
        stopCamera();
        processImage(imageData);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(
        imageData,
        'ind', // Indonesian language
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      setExtractedText(text);
      const ktpData = parseKTPData(text);
      
      setIsProcessing(false);
      
      // Auto-fill after 1 second to show the extracted data
      setTimeout(() => {
        onDataExtracted(ktpData);
      }, 1000);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
      alert('Gagal memproses gambar. Silakan coba lagi dengan gambar yang lebih jelas.');
    }
  };

  const parseKTPData = (text: string): KTPData => {
    const data: KTPData = {};
    const lines = text.split('\n').map(line => line.trim());

    // Extract NIK (16 digits)
    const nikMatch = text.match(/\b\d{16}\b/);
    if (nikMatch) {
      data.nik = nikMatch[0];
    }

    // Extract Name (usually after "Nama" or on specific line)
    const namePatterns = [
      /Nama\s*:?\s*([A-Z\s]+)/i,
      /^([A-Z][A-Z\s]+[A-Z])$/m
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 3) {
        data.name = match[1].trim();
        break;
      }
    }

    // Extract Address components
    const addressMatch = text.match(/Alamat\s*:?\s*([^\n]+)/i);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }

    // Extract RT/RW
    const rtRwMatch = text.match(/RT[\s\/]*(\d+)\s*[\/]?\s*RW[\s\/]*(\d+)/i);
    if (rtRwMatch) {
      data.rtRw = `RT ${rtRwMatch[1]} / RW ${rtRwMatch[2]}`;
    }

    // Extract Kel/Desa
    const villageMatch = text.match(/Kel[\/]?Desa\s*:?\s*([^\n]+)/i);
    if (villageMatch) {
      data.village = villageMatch[1].trim();
    }

    // Extract Kecamatan
    const districtMatch = text.match(/Kecamatan\s*:?\s*([^\n]+)/i);
    if (districtMatch) {
      data.district = districtMatch[1].trim();
    }

    // Extract City/Kabupaten
    const cityMatch = text.match(/(?:Kab|Kota)[^\n]*:?\s*([^\n]+)/i);
    if (cityMatch) {
      data.city = cityMatch[1].trim();
    }

    // Extract Province
    const provinceMatch = text.match(/Provinsi\s*:?\s*([^\n]+)/i);
    if (provinceMatch) {
      data.province = provinceMatch[1].trim();
    }

    // Extract Birth Place and Date
    const birthMatch = text.match(/Tempat[\/\s]*Tgl[^\n]*Lahir\s*:?\s*([^,\n]+),?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
    if (birthMatch) {
      data.birthPlace = birthMatch[1].trim();
      data.birthDate = birthMatch[2].trim();
    }

    // Extract Gender
    const genderMatch = text.match(/(?:Jenis\s*Kelamin|Kel\s*Kelamin)\s*:?\s*(LAKI-LAKI|PEREMPUAN)/i);
    if (genderMatch) {
      data.gender = genderMatch[1].trim();
    }

    // Extract Religion
    const religionMatch = text.match(/Agama\s*:?\s*([^\n]+)/i);
    if (religionMatch) {
      data.religion = religionMatch[1].trim();
    }

    // Extract Marital Status
    const maritalMatch = text.match(/(?:Status\s*)?Perkawinan\s*:?\s*([^\n]+)/i);
    if (maritalMatch) {
      data.maritalStatus = maritalMatch[1].trim();
    }

    // Extract Occupation
    const occupationMatch = text.match(/Pekerjaan\s*:?\s*([^\n]+)/i);
    if (occupationMatch) {
      data.occupation = occupationMatch[1].trim();
    }

    return data;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanLine className="size-6 text-blue-600" />
              <h2>Scanner KTP</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>

          {!image && !isCameraActive && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Ambil foto KTP atau upload gambar KTP untuk mengekstrak data secara otomatis
              </p>

              {cameraError && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">{cameraError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={startCamera}
                  className="gap-2 h-32 flex-col"
                  variant="outline"
                >
                  <Camera className="size-8" />
                  <span>Ambil Foto</span>
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 h-32 flex-col"
                  variant="outline"
                >
                  <Upload className="size-8" />
                  <span>Upload Gambar</span>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p className="text-blue-900 mb-2">Tips untuk hasil terbaik:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Pastikan pencahayaan cukup terang</li>
                  <li>KTP dalam posisi rata dan tidak miring</li>
                  <li>Hindari pantulan cahaya pada KTP</li>
                  <li>Pastikan semua teks terlihat jelas</li>
                  <li>Format file: JPG, PNG, WEBP, atau BMP (max 10MB)</li>
                </ul>
              </div>

              {/* Alternative: Drag and Drop Zone */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const mockEvent = {
                      target: { files: [file], value: '' }
                    } as any;
                    handleFileUpload(mockEvent);
                  }
                }}
              >
                <Upload className="size-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-1">Atau drag & drop file KTP di sini</p>
                <p className="text-sm text-gray-500">Mendukung JPG, PNG, WEBP, BMP</p>
              </div>
            </div>
          )}

          {isCameraActive && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <div className="flex gap-3">
                <Button onClick={capturePhoto} className="flex-1 gap-2">
                  <Camera className="size-4" />
                  Ambil Foto
                </Button>
                <Button onClick={stopCamera} variant="outline" className="flex-1">
                  Batal
                </Button>
              </div>
            </div>
          )}

          {image && (
            <div className="space-y-4">
              <div className="relative">
                <ImageWithFallback 
                  src={image} 
                  alt="KTP"
                  className="w-full rounded-lg"
                />
              </div>

              {isProcessing ? (
                <div className="bg-blue-50 p-6 rounded-lg text-center space-y-3">
                  <Loader2 className="size-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-blue-900">Memproses gambar KTP...</p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-blue-700">{progress}%</p>
                </div>
              ) : extractedText && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-900 mb-2">✓ Data berhasil diekstrak!</p>
                  <p className="text-sm text-green-700">
                    Form akan terisi otomatis dengan data dari KTP
                  </p>
                </div>
              )}

              <Button 
                onClick={() => {
                  setImage(null);
                  setExtractedText('');
                  setProgress(0);
                }}
                variant="outline"
                className="w-full"
              >
                Scan Ulang
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}