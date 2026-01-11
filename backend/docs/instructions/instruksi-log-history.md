# Instruksi Pembuatan Section "History Task"

## Tujuan
Membuat section `History Task` yang menampilkan riwayat pengerjaan task per hari, dengan format:
- Jika hari ini ada task → tampilkan label `"Hari Ini"`
- Untuk hari sebelumnya → tampilkan tanggal dalam format `"DD MMM YYYY"`
- Di samping label tanggal, tampilkan progress dalam format `"X/Y"` (X = jumlah task selesai, Y = total task pada hari tersebut)
- List history harus mencerminkan laporan pengerjaan task berdasarkan tanggal pembuatan (creation date), bukan tanggal penyelesaian (completion date). Artinya task yang dibuat tanggal 8 Jan tapi selesai tanggal 9 Jan tetap muncul di tanggal 8 Jan.

---

## Spesifikasi UI

### 1. Struktur Komponen
```plaintext
[Section Title: "History Task"]
   └── [List Item 1] → "Hari Ini" 6/7
   └── [List Item 2] → "6 Jan 2025" 10/15
   └── [List Item 3] → "5 Jan 2025" 5/5