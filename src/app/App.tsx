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
