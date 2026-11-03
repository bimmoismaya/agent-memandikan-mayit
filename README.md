# Pemandian Jenazah Agent

Visualisasi 3D aktivitas Claude Code sebagai ruang pemandian jenazah (digambarkan sopan: jenazah selalu tertutup kain). Gerakannya dibaca dari transkrip lokal Claude Code (`~/.claude/projects`), read-only, tanpa data karangan.

Setiap subagent yang berjalan = satu pekerjaan di ruang pemandian:

| Tahap | Yang terjadi |
|---|---|
| Subagent mulai | Mobil putih datang membawa jenazah (berkain), worker membawanya ke dipan |
| Bekerja | Worker mengambil perlengkapan di rak, lalu memandikan (air dituang) tanpa balon dialog |
| Subagent selesai | Dikafani (kain putih + tali), dimuat ke mobil hijau, mobil pergi |
| Tidak ada agent | Ruang sepi |

Sesi utama **Joko** (ada aktivitas dalam 30 detik terakhir) berjaga di depan ruangan dan tidak pernah pergi. Kalau ada jenazah yang sedang dimandikan, Joko ikut membantu di dipan itu. Worker diberi nama Budi, Sari, Agus, dst. sesuai urutan slot.

## Kebutuhan
- **Node.js 18 atau lebih baru.** Tanpa `npm install`, tidak ada dependensi.
- **Internet** saat membuka halaman, karena three.js dimuat dari CDN (jsdelivr).
- Browser dengan WebGL (Chrome, Edge, Firefox, Safari modern).
- Windows, macOS, atau Linux. Di Windows tidak perlu WSL.

## Cara pakai
1. Buka terminal di folder ini, lalu jalankan:
   ```
   node server.mjs
   ```
2. Buka http://127.0.0.1:8788 di browser.
3. Pakai Claude Code seperti biasa di project mana pun. Ruang pemandian ikut bergerak.

Ganti port bila 8788 terpakai:
```
PORT=9000 node server.mjs              # macOS/Linux/Git Bash
$env:PORT=9000; node server.mjs        # PowerShell
```

Berhenti: tekan `Ctrl+C` di terminal server. Kalau server berjalan di latar belakang (Windows), matikan proses yang memakai port itu:
```
Get-NetTCPConnection -LocalPort 8788 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
```

## Isi tampilan
- **Adegan 3D.** Seret untuk memutar, scroll untuk zoom.
- **Aktivitas langsung (kiri).** Aksi terbaru Joko: membaca, menulis, menjalankan perintah, memanggil subagent.
- **Riwayat subagent (kanan).** Daftar subagent sesi ini beserta status Bekerja/Selesai dan lama kerjanya.
- **Kartu di bawah.** Agent yang sedang aktif.
- Layar sempit (di bawah 1000 px): panel samping disembunyikan, adegan tetap tampil.

## File
| File | Fungsi |
|---|---|
| `server.mjs` | Membaca transkrip, menyajikan `/api/state` (JSON) dan halaman |
| `index.html` | Seluruh tampilan 3D dan panel (satu file) |

## Batasan
- Hanya **sesi terbaru** (yang file transkripnya diubah dalam 10 menit terakhir) yang digambar. Sesi lain cuma dihitung sebagai "+N sesi lain".
- Aktivitas yang tampil hanya milik sesi utama. Langkah di dalam subagent tidak ada di transkrip utama, jadi bubble subagent berisi deskripsi tugasnya.
- Teks aktivitas (nama file, perintah) **tidak di-redact**. Aman untuk dipakai lokal. Jangan buka ke publik tanpa menambah penyaringan di `describe()` pada `server.mjs`.
- Server hanya mendengarkan `127.0.0.1`, jadi tidak bisa diakses dari perangkat lain.

## Masalah umum
- **Halaman kosong / tanpa 3D:** cek koneksi internet (CDN) dan pastikan WebGL aktif di browser.
- **Ruang selalu sepi:** pastikan Claude Code sedang dipakai dan `~/.claude/projects` ada. Cek `http://127.0.0.1:8788/api/state` dan lihat apakah `lead` terisi.
- **`EADDRINUSE`:** port terpakai, ganti dengan `PORT=...`.
- **Perubahan tidak terlihat:** tekan `Ctrl+F5`. Setelah mengubah `server.mjs`, jalankan ulang servernya.

## Mengubah tampilan
Pembuatan pekerjaan dari state ada di fungsi `tick()` di `index.html`, sedangkan bentuk benda ada di bagian `ruang pemandian`, `makeTruck`, dan `makePerson`. Alur satu pekerjaan ada di fungsi `run()`. Server tidak perlu disentuh untuk mengganti tema.
