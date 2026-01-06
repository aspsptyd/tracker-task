# Sistem Time Tracking & Time Blocking

Dokumen ini menjelaskan spesifikasi fitur dan arsitektur untuk sistem **Time Tracking & Time Blocking** yang bertujuan mencatat durasi pengerjaan task secara akurat, terstruktur, dan representatif.

Sistem ini dirancang untuk menghindari **double data**, mendukung **multi-session dalam satu task**, serta menampilkan **alur pengerjaan task secara kronologis**.

---

## 🎯 Tujuan Utama

* Mencatat waktu pengerjaan task secara presisi (start → stop)
* Mendukung konsep **time blocking** agar tahapan kerja terlihat jelas
* Menyatukan beberapa sesi pengerjaan dalam **satu representasi task**
* Menyediakan visualisasi yang mudah dipahami dan interaktif

---

## 🧩 Ketentuan Fitur

### 1. Sistem Time Tracking (Start & Stop Timer)

#### Deskripsi

Sistem menyediakan fitur **Start Timer** dan **Stop Timer** untuk mencatat durasi pengerjaan task.

#### Aturan Utama

* Setiap aksi **start–stop** disimpan sebagai **log proses** ke dalam database MySQL
* Perhitungan waktu berdasarkan selisih `start_time` dan `end_time`
* Time tracking bersifat **task-based** (satu task dapat memiliki banyak sesi)

#### Data yang Disimpan

* Task ID
* Session ID
* Start Time
* End Time
* Duration (detik / menit)
* Created At

> Tujuan utama: memastikan durasi kerja tercatat jelas untuk mendukung evaluasi dan time blocking

---

### 2. Time Block Berurutan & Detail Interaktif

#### Urutan Time Block

* Time block **diurutkan berdasarkan waktu start → stop**
* Setiap block merepresentasikan **satu task**, bukan satu sesi
* Urutan mencerminkan **alur tahapan kerja** yang sebenarnya

#### Interaksi UI

* Setiap time block memiliki **badge / indikator**
* Saat badge diklik, muncul **popup / modal** berisi:

  * Nama task
  * Total waktu pengerjaan (akumulasi semua sesi)
  * Range waktu pengerjaan (start pertama → stop terakhir)

#### Contoh Informasi di Popup

* Total Durasi: `2 jam 35 menit`
* Waktu Pengerjaan: `09:10 – 11:45`
* Jumlah Sesi: `3 sesi`

---

### 3. Konsolidasi Multi-Session dalam Satu Time Block

#### Permasalahan yang Dihindari

* Satu task muncul **berkali-kali** di time block (double data)
* Representasi task menjadi tidak akurat

#### Solusi

* Jika sebuah task memiliki **lebih dari 1 sesi**, maka:

  * **Hanya 1 card time block** yang ditampilkan
  * Semua sesi ditampilkan di **halaman detail / popup**

#### Detail Sesi di Popup

* Sesi 1: 09:10 – 09:40 (30 menit)
* Sesi 2: 10:00 – 10:50 (50 menit)
* Sesi 3: 11:00 – 11:45 (45 menit)

#### Akumulasi

* Total durasi dihitung dari **penjumlahan seluruh sesi**
* Range waktu diambil dari:

  * Start paling awal
  * End paling akhir

> Pendekatan ini membuat data lebih representatif dan bebas duplikasi

---

## 🗄️ Desain Database (MySQL)

### Tabel: `tasks`

* `id`
* `title`
* `description`
* `created_at`

### Tabel: `task_sessions`

* `id`
* `task_id` (FK)
* `start_time`
* `end_time`
* `duration`
* `created_at`

Relasi:

* 1 Task → Banyak Session

---

## 🖥️ Arsitektur Frontend

### Teknologi yang Digunakan

* **Vite** – Build tool
* **TypeScript** – Type safety
* **React** – UI Framework
* **shadcn-ui** – Komponen UI (Dialog, Badge, Card)
* **Tailwind CSS** – Styling

---

## 🧱 Struktur UI

### 1. Time Block View

* List / timeline berbasis waktu
* 1 card = 1 task
* Sorted berdasarkan waktu start

### 2. Badge & Popup Detail

* Badge menampilkan total durasi singkat
* Klik badge → Dialog (shadcn-ui)

Dialog berisi:

* Informasi task
* Total waktu
* Range waktu
* Daftar sesi

---

## 🧠 Prinsip Desain

* **Single Source of Truth** → sesi disimpan terpisah, ditampilkan teragregasi
* **Chronological First** → urutan berdasarkan waktu nyata
* **No Double Representation** → satu task = satu time block
* **Detail on Demand** → detail hanya muncul saat dibutuhkan

---

## 📌 Catatan Pengembangan Lanjutan

* Export laporan time tracking (CSV / PDF)
* Daily / weekly summary
* Idle detection
* Tag & kategori task

---

## ✅ Kesimpulan

Sistem ini memastikan:

* Time tracking akurat
* Time blocking jelas dan berurutan
* Data tidak duplikatif
* Representasi task lebih realistis

Dokumen ini dapat dijadikan **acuan implementasi frontend & backend**.
