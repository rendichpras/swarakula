# SwaraKula - Platform Voting Online Universal

SwaraKula adalah platform voting online yang memungkinkan siapa saja untuk membuat dan mengelola voting dengan mudah. Platform ini dibangun menggunakan teknologi modern dan menyediakan fitur realtime untuk hasil voting.

## ✨ Fitur Utama

- 🔐 **Autentikasi** via Google (Supabase Auth)
- 📊 **Voting Universal**
  - Buat voting dengan opsi tunggal atau ganda
  - Atur waktu berakhir voting
  - Pilih mode tampilan hasil (setelah vote / setelah berakhir)
- 📈 **Hasil Realtime**
  - Update otomatis menggunakan Supabase Realtime
  - Visualisasi dengan chart interaktif (Recharts)
- 📱 **Responsif** di semua perangkat
- 🎨 **UI Modern** dengan shadcn/ui

---

## 🧰 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase
  - Auth
  - Database
  - Realtime
- **Charting**: Recharts

---

## 🚀 Cara Menjalankan Secara Lokal

1. Clone repositori:
   ```bash
   git clone https://github.com/username/swarakula.git
   cd swarakula
   ```

2. Install dependensi:
   ```bash
   npm install
   ```

3. Salin file `.env.example` ke `.env.local`, lalu isi dengan kredensial Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Jalankan development server:
   ```bash
   npm run dev
   ```

5. Buka browser dan akses:
   ```
   http://localhost:3000
   ```

---

## 🗃️ Struktur Database

### 🧑 Users
| Field       | Tipe             | Keterangan                    |
|-------------|------------------|-------------------------------|
| `id`        | string           | Sama dengan `auth.users.id`   |
| `name`      | string \| null   | Nama pengguna                 |
| `avatar_url`| string \| null   | URL avatar                    |
| `created_at`| timestamp        | Timestamp saat dibuat         |

### 🗳️ Votings
| Field           | Tipe                 | Keterangan                     |
|------------------|----------------------|--------------------------------|
| `id`             | string               | ID voting                      |
| `creator_id`     | string               | Referensi ke `users.id`        |
| `title`          | string               | Judul voting                   |
| `description`    | string               | Deskripsi voting               |
| `multiple_choice`| boolean              | Opsi ganda atau tunggal        |
| `reveal_mode`    | enum('after_vote', 'after_end') | Mode hasil ditampilkan  |
| `end_at`         | timestamp            | Waktu voting berakhir          |
| `created_at`     | timestamp            | Timestamp saat dibuat          |

### 🧩 Options
| Field      | Tipe    | Keterangan                |
|------------|---------|---------------------------|
| `id`       | string  | ID opsi                   |
| `voting_id`| string  | Referensi ke `votings.id` |
| `text`     | string  | Teks opsi voting          |

### ✅ Votes
| Field       | Tipe    | Keterangan                 |
|-------------|---------|----------------------------|
| `id`        | string  | ID suara                   |
| `voting_id` | string  | Referensi ke `votings.id`  |
| `option_id` | string  | Referensi ke `options.id`  |
| `voter_uuid`| string  | UUID pemilih (anonim)      |
| `created_at`| timestamp | Timestamp saat memilih   |

---

## 🤝 Kontribusi

Kontribusi selalu terbuka!  
Silakan buat issue atau pull request jika ingin membantu mengembangkan SwaraKula.