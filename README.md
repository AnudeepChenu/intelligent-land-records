
# 🏛️ Intelligent Land Records Management System (LRMS)

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.103-009688?logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)

An intelligent platform designed to securely digitize, automatically validate, and seamlessly integrate legacy land records using advanced AI, Computer Vision, and OCR. 

Built for modern land administration, this system replaces manual data entry with an automated AI pipeline, complete with a 50/50 human-in-the-loop verification portal and real-time document queues.

---

## ✨ Key Features

* **🔐 Secure Authentication:** Role-based access control powered by Supabase Auth.
* **📄 Document Ingestion:** Drag-and-drop interface for uploading legacy records (PDF, JPG, PNG) directly to secure cloud storage buckets.
* **🤖 AI Extraction Engine (OCR):** Python/FastAPI backend utilizing EasyOCR and PyMuPDF to extract text from multi-page documents in multiple regional languages (English, Telugu, Hindi, Marathi).
* **🎨 Visual Confidence Mapping:** OpenCV automatically draws color-coded bounding boxes (**Green:** >80%, **Yellow:** >50%, **Red:** <50%) directly onto the document preview to highlight AI confidence levels.
* **⚡ Real-Time Queues:** Global document queues that update instantly across all clients using Supabase Realtime WebSockets.
* **⚖️ Verification Portal:** A side-by-side (50/50) split layout allowing officials to cross-reference AI-extracted data against the annotated document preview.
* **🖨️ Certificate Generation:** Instantly generate and download digitally verified PDF certificates for processed land records.

---

## 🛠️ Tech Stack

**Frontend:**
* [Next.js](https://nextjs.org/) (App Router)
* [React](https://react.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Lucide React](https://lucide.dev/) (Icons)
* [jsPDF](https://github.com/parallax/jsPDF) (Client-side PDF generation)

**Backend (AI Engine):**
* [FastAPI](https://fastapi.tiangolo.com/)
* [EasyOCR](https://github.com/JaidedAI/EasyOCR)
* [OpenCV](https://opencv.org/) & [NumPy](https://numpy.org/)
* [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/en/latest/)

**Database & Storage:**
* [Supabase](https://supabase.com/) (PostgreSQL, Edge Storage, Realtime Subscriptions, Auth)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* A **Supabase** account and project

### 1. Database Setup
1. Create a new project in [Supabase](https://supabase.com/).
2. Go to the SQL Editor and run the master schema provided in `database_schema.sql` (this creates your `documents` table, `profiles`, storage buckets, and RLS policies).

### 2. Environment Variables
Create a `.env` file in **both** the `frontend` and `backend` directories.

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```

**Backend (`backend/.env`):**

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key # Needs bypass RLS for processing

```

### 3. Backend Setup (AI Engine)

Open a terminal and navigate to the backend folder.

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn easyocr opencv-python-headless pymupdf python-dotenv supabase pydantic

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000

```

> **Note:** The first time you run an extraction, EasyOCR will download the necessary language models to your machine.

### 4. Frontend Setup

Open a new terminal and navigate to the frontend folder.

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev

```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:8000`.

---

## 📂 Project Structure

```text
intelligent-land-records/
├── backend/
│   ├── app/
│   │   └── main.py          # FastAPI application & AI Engine logic
│   ├── .env                 # Backend environment variables
│   └── requirements.txt     # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx               # Modern Landing Page
    │   │   ├── login/page.tsx         # Authentication
    │   │   ├── register/page.tsx      # User Registration
    │   │   └── dashboard/
    │   │       ├── layout.tsx         # Fixed Sidebar Layout (Cache-Busting)
    │   │       ├── page.tsx           # Real-time Metrics & Progress
    │   │       ├── upload/page.tsx    # Ingestion Portal
    │   │       ├── verified/page.tsx  # 50/50 Review Editor & Queue
    │   │       └── documents/page.tsx # Registry Archive
    │   │
    │   └── lib/
    │       └── supabaseClient.ts      # Supabase initialization
    │
    ├── .env.local           # Frontend environment variables
    ├── tailwind.config.ts
    └── package.json

```

---

## 🧠 Smart Extraction Logic

The system utilizes a custom Regex-based `smart_extract` function to parse raw OCR data efficiently. It is built to handle varying regional formatting quirks for the following data points:

* **Identifiers:** Registration / ULPIN Numbers, Khata Numbers, Survey / Gat Numbers
* **Geography:** Districts, Mandals, Tehsils, Villages
* **Details:** Landholder / Occupant Names, Total Extents / Area
* **Timestamps:** Dates of Issue



