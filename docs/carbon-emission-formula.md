# Konteks lengkap — Formula dan logika perhitungan emisi karbon **yang dihemat** dari sampah yang disetor (bank sampah / TPS)

## 1) Inti pendek (satu baris)

Emisi yang dihemat (kg CO₂e) = jumlah sampah per jenis (kg) × (efekt baseline per kg − efekt pengolahan sebenarnya per kg). Total diakumulasikan menjumlahkan semua jenis sampah.

---

## 2) Definisi variabel utama

- `m_i` = massa sampah jenis _i_ (kg).
- `EF_baseline_i` = faktor emisi baseline untuk sampah jenis _i_ (kg CO₂e/kg) — asumsi: apa yang terjadi **jika tidak disetor** (biasanya landfill atau insinerasi lokal).
- `EF_treatment_i` = faktor emisi untuk metode pengolahan yang diimplementasikan setelah disetor (kg CO₂e/kg) — mis. recycling, composting, energi-tercitra dari incinerator modern, dsb.
- `Saved_i` = emisi yang dihemat dari jenis _i_ (kg CO₂e).
- `Saved_total` = ∑_i Saved_i (kg CO₂e), akumulasi semua jenis sampah.

Rumus dasar per jenis:

```
Saved_i = m_i × (EF_baseline_i − EF_treatment_i)
```

Jika hasil negatif (mis. `EF_treatment_i` > `EF_baseline_i`) maka tidak ada penghematan — set `Saved_i = 0` atau laporkan sebagai _net increase_ sesuai kebijakan Anda.

---

## 3) Penjelasan konsep baseline vs treatment

- **Baseline** harus merepresentasikan skenario _tidak ada_ setoran ke bank sampah: mis. pembuangan ke TPA (landfill) dengan potensi emisi CH₄, atau insinerasi terbuka, tergantung praktik lokal. (Sumber pedoman metodologi GHGP/GHG.) GHG Protocol. ([GHG Protocol][1])
- **Treatment** adalah skenario setelah disetor: recycling, composting, recovery (waste-to-energy), atau penanganan formal dengan capture gas. Perbedaan inilah sumber _avoided emissions_.

---

## 4) Contoh nilai faktor emisi (nilai contoh — **harus disesuaikan dengan kondisi lokal**)

> Catatan: nilai di bawah adalah contoh praktis/umum dari literatur; gunakan sumber lokal/nasional atau update dataset seperti _EPA, JRC, CLIMATIQ_, atau pedoman GHGP untuk akurasi. Saya sertakan referensi primer per baris.

| Jenis sampah                               |                       EF_baseline (kg CO₂e/kg) — contoh |                                               EF_treatment (kg CO₂e/kg) — contoh |                                                          Penghematan per ton (kg CO₂e/ton) |
| ------------------------------------------ | ------------------------------------------------------: | -------------------------------------------------------------------------------: | -----------------------------------------------------------------------------------------: |
| Aluminium (kaleng)                         |                                  12.0 (produksi primer) |                               3.0 (recycled process) → penghematan ≈ 9,000 kg/t. |                                                            ~9,000 kg CO₂e/t. ([Alupro][2]) |
| Baja/Steel                                 |                                         1.67 (baseline) |               0.0–0.17 (dari penggunaan scrap) → penghematan ≈ 1,500–1,670 kg/t. |                                   ~1,500–1,670 kg CO₂e/t. ([Circular Economy Platform][3]) |
| Plastik (campuran, polymer)                |                                                 2.0–2.7 |                            0.0–1.0 (recycling) → penghematan ≈ 1,000–2,700 kg/t. |                                            ~1,000–2,700 kg CO₂e/t. ([Publications JRC][4]) |
| Kertas / Karton                            |                                                 0.3–1.6 |                             0.05–0.3 (recycling) → penghematan ≈ 300–1,300 kg/t. |                                                    ~300–1,300 kg CO₂e/t. ([Pro Carton][5]) |
| Organik (food/green) — landfill vs compost | landfill: tinggi potensial CH₄ (var), setara CO₂e besar | compost/anaerobic digestion: jauh lebih rendah (atau net sink tergantung metode) | penghematan sangat variabel; gunakan metodologi landfill CH₄ untuk estimasi. ([US EPA][6]) |

Sumber dan contoh angka di atas berasal dari studi dan pedoman teknis internasional; angka aktual bergantung pada:

- kondisi landfill (capture gas/lempar ke atmosfer),
- efisiensi fasilitas recycling lokal,
- jenis plastik/paper (kualitas isi ulang),
- energi listrik grid lokal (intensitas karbon listrik memengaruhi proses daur ulang).

---

## 5) Langkah implementasi perhitungan (recommended)

1. **Kategorisasi**: Tetapkan kategori yang Anda dukung di aplikasi (mis. aluminium, ferrous metal, plastik PET, plastik film, kertas, karton, kaca, organik, e-waste).
2. **Satuan masukan**: Minta pengguna input berat (kg). Jika user memberi volume atau jumlah item, konversikan ke massa dengan _density table_ (lihat bagian 7).
3. **Pilih baseline & treatment per wilayah**: Konfigurasikan default `EF_baseline_i` dan `EF_treatment_i` berdasarkan kota/region atau pilihan admin (TPA lokal vs insinerator).
4. **Hitung `Saved_i`** menggunakan rumus di §2.
5. **Akumulasi dan simpan**: `Saved_total += Saved_i`. Simpan metadata transaksi (user id, ts, lokasi, kategori, massa, EF yang dipakai).
6. **Tampilkan**: angka per transaksi (kg CO₂e) + metrik agregat (harian / bulanan / lifetime). Convert ke satuan yang mudah dimengerti (ton CO₂e; atau “setara menanam X pohon/tahun” dengan faktor penjelas jika ingin visualisasi).

---

## 6) Contoh perhitungan singkat

Misal: pengguna setor 2 kg aluminium kaleng; kita pakai penghematan ≈ 9,000 kg CO₂e per ton (9 kg CO₂e/kg).

```
m_al = 2 kg
EF_baseline_al = 12 kgCO2e/kg
EF_treatment_al = 3 kgCO2e/kg
Saved_al = 2 * (12 - 3) = 18 kg CO2e
```

Tampilkan: _Anda menghemat 18 kg CO₂e_ (atau 0.018 ton CO₂e).

---

## 7) Penting: konversi volume → massa (contoh densitas)

Jika input volume/item:

- Aluminium kaleng (kosong): ~0.0027 kg per kaleng (konteks: satu kaleng minuman ≈ 15 g — verifikasi lokal).
- Botol PET 1 L (kosong): ~25–30 g (0.025–0.03 kg).
- Kardus/karton (papan lapis): densitas ~200–600 kg/m³ tergantung tipe.
  Sebaiknya sediakan tabel densitas per item/kemasan yang di-edit oleh admin.

---

## 8) Pseudocode (Python-like) — implementasi cepat

```python
# data: ef values in kg CO2e per kg
EF_baseline = {'aluminium':12.0, 'steel':1.67, 'plastic':2.5, 'paper':0.8, 'organic':0.9}
EF_treatment = {'aluminium':3.0, 'steel':0.2, 'plastic':0.8, 'paper':0.2, 'organic':0.05}

def saved_for_item(kind: str, mass_kg: float) -> float:
    baseline = EF_baseline.get(kind, 0.0)
    treatment = EF_treatment.get(kind, 0.0)
    saved = mass_kg * (baseline - treatment)
    return max(saved, 0.0)

# accumulate per deposit
total_saved = 0.0
for deposit in deposits:  # deposits: list of {kind, mass_kg}
    s = saved_for_item(deposit['kind'], deposit['mass_kg'])
    total_saved += s
```

(Implementasikan validasi, logging EF source/version, handling negative results.)

---

## 9) Rekomendasi sumber data resmi & cara memperbarui

- Gunakan pedoman lokal (Kementerian/Lingkungan hidup setempat) atau pedoman internasional **GHG Protocol** untuk metodologi kategori sampah. GHG Protocol. ([GHG Protocol][1])
- Untuk organik/landfill methane, refer ke data **EPA** tentang kontribusi food waste pada CH₄ landfill. EPA. ([US EPA][6])
- Untuk angka penghematan daur ulang per material: sumber industri dan studi JRC / European Aluminium / metal recycling factsheets (contoh: aluminium ≈ 9 tCO₂e/t; steel ≈ 1.5–1.67 tCO₂e/t). ([Alupro][2])
- Untuk plastic/paper LCA dan rentang penghematan gunakan laporan JRC dan studi plastik daur ulang (JRC, SystemIQ). ([Publications JRC][4])

**Praktik:** simpan `ef_version` (timestamp + sumber URL) bersama tiap transaksi sehingga ketika data EF diperbarui Anda bisa merekalkulasi atau menampilkan nilai historis yang digunakan saat transaksi terjadi.

---

## 10) Edge cases & catatan implementasi

- **Kontaminasi**: sampah terkontaminasi menurunkan efisiensi recycling → terapkan faktor penalty (mis. pengurangan `%` penghematan) bila tingkat kontaminasi tinggi.
- **Minimum reporting**: jika `Saved_i < threshold` (mis. < 0.01 kg CO₂e) mungkin tidak perlu tampilkan detail per-item.
- **Double counting**: hindari menghitung penghematan dari bahan yang kemudian masih dikirim ke landfill (tracking lifecycle). Simpan status akhir materi.
- **Transparansi**: selalu tampilkan asumsi (EF yang dipakai, baseline, tanggal versi) saat menampilkan angka ke user.
- **Validasi user input**: pastikan massa tidak negatif, dan jika user memasukkan volume, beri pilihan konversi atau default densitas.

---

## 11) Output UX / rekomendasi tampilan

- Tampilkan angka per deposit (kg CO₂e) + ikon kategori.
- Aggregate: _Hari ini_, _Bulan ini_, _Total pengguna_, _Total komunitas_ dalam ton CO₂e.
- Sediakan toggle “lihat asumsi” yang menampilkan: `EF_baseline` & `EF_treatment` (sumber + tanggal).
- Opsional: konversi ke metrik populer: `tree-years` atau `km berkendara` dengan faktor referensi (sertakan sumber jika dipakai).

---

## 12) Ringkasan singkat rumus agregasi akhir

```
Saved_total = sum_over_all_types( m_i * max(0, EF_baseline_i - EF_treatment_i) )
```

Simpan juga: `meta = {source_EF_version, calculation_ts, baseline_description, notes}` per batch/transaction.

---

## 13) Tindakan selanjutnya yang saya rekomendasikan untukmu (implementasi)

1. Pilih kategori sampah yang akan didukung aplikasi sekarang (minimal: aluminium, plastik, kertas, organik, baja, kaca).
2. Tetapkan default EF berdasarkan sumber yang dapat diandalkan (referensi internasional / data lokal) — masukkan ke admin panel sebagai _configuration_.
3. Implementasikan perhitungan seperti pseudocode di atas; simpan `ef_version` setiap transaksi.
4. Tambahkan page “transparency” untuk menunjukkan sumber EF ke pengguna.

---
