# 🏛️ Intelligent Land Records Digitization & Verification System

An end-to-end intelligent platform for **automated land record ingestion, handwriting-optimized OCR extraction, metadata parsing, human-in-the-loop verification, and official government certificate generation**.

The system combines a modern Next.js frontend with a Python-based AI/OCR engine and Supabase for secure database and document storage.

---

## ✨ Features

* 📄 **Land Record Upload**

  * Upload scanned land records in PDF or image format.
  * Securely store documents using Supabase private storage.

* 🤖 **AI-Powered OCR**

  * Extract text from scanned documents using EasyOCR.
  * Optimized for challenging handwritten and low-quality documents.
  * OpenCV-based image preprocessing.

* 🧠 **Metadata Extraction**

  * Parse important information from extracted land records.
  * Prepare structured data for verification.

* 👨‍💼 **Human-in-the-Loop Verification**

  * Review AI-generated extraction results.
  * Approve or correct extracted information before final verification.

* 🏛️ **Government Certificate Generation**

  * Generate official-looking verification certificates.
  * Export certificates as downloadable PDF documents.

* 🔐 **Secure Data Storage**

  * PostgreSQL database through Supabase.
  * Private document storage buckets.
  * Row Level Security (RLS) support.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────┐
│                 Next.js Frontend            │
│                                             │
│  Upload Portal → Verification Queue         │
│       ↓                ↓                    │
│  Supabase Storage   Review & Approval       │
│                         ↓                   │
│                 Certificate PDF              │
└──────────────────────┬──────────────────────┘
                       │
                       │ REST API
                       ▼
┌─────────────────────────────────────────────┐
│             Python FastAPI Backend          │
│                                             │
│  Document Processing                        │
│       ↓                                     │
│  PyMuPDF / OpenCV                           │
│       ↓                                     │
│  EasyOCR                                    │
│       ↓                                     │
│  Text & Metadata Extraction                 │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                    Supabase                 │
│                                             │
│  PostgreSQL Database                        │
│  Private Storage                            │
│  Row Level Security                         │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

| Technology       | Purpose                                 |
| ---------------- | --------------------------------------- |
| **Next.js**      | React framework and application routing |
| **App Router**   | Modern Next.js routing architecture     |
| **Tailwind CSS** | UI styling                              |
| **Lucide Icons** | Interface icons                         |
| **jsPDF**        | Certificate PDF generation              |

### Backend / AI Engine

| Technology         | Purpose                             |
| ------------------ | ----------------------------------- |
| **Python**         | Backend and AI processing           |
| **FastAPI**        | REST API                            |
| **EasyOCR**        | OCR and handwriting text extraction |
| **OpenCV**         | Image preprocessing                 |
| **PyMuPDF (fitz)** | PDF processing                      |
| **Uvicorn**        | ASGI development server             |

### Database & Storage

| Technology             | Purpose                                |
| ---------------------- | -------------------------------------- |
| **Supabase**           | Backend-as-a-Service                   |
| **PostgreSQL**         | Document metadata and application data |
| **Supabase Storage**   | Secure document storage                |
| **Row Level Security** | Database access control                |

---

# ⚙️ Prerequisites

Make sure the following are installed on your system:

* [Node.js](https://nodejs.org/) **v18+**
* npm
* [Python](https://www.python.org/) **v3.10+**
* pip
* A [Supabase](https://supabase.com/) account
* Git

You can verify your installations with:

```bash
node --version
npm --version
python3 --version
pip --version
git --version
```

---

# 🚀 Installation & Setup

## 1. Clone the Repository

Clone the project and move into the project directory:

```bash
git clone https://github.com/your-username/intelligent-land-records.git

cd intelligent-land-records
```

---

# 🗄️ 2. Supabase Setup

Create a new project from the [Supabase Dashboard](https://supabase.com/dashboard).

### Create Storage Bucket

Navigate to:

```text
Supabase Dashboard
       ↓
Storage
       ↓
Create Bucket
```

Create a **private** bucket named:

```text
land_records
```

---

## Create the Documents Table

Open:

```text
Supabase Dashboard
       ↓
SQL Editor
       ↓
New Query
```

Run the following SQL:

```sql
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  status text default 'pending',
  extracted_text text,
  uploaded_at timestamp with time zone
    default timezone('utc'::text, now()) not null
);
```

### Recommended RLS Configuration

For production deployments, enable Row Level Security:

```sql
alter table public.documents enable row level security;
```

> Add policies appropriate to your application's authentication model before exposing the table to users.

---

# 🔑 3. Get Supabase Credentials

Go to:

```text
Supabase Dashboard
    ↓
Project Settings
    ↓
API
```

You will need:

* **Project URL**
* **anon public key**
* **service role key**

### ⚠️ Important Security Rule

The keys have different purposes:

| Key                | Used By          | Public?                     |
| ------------------ | ---------------- | --------------------------- |
| `anon` key         | Next.js frontend | ✅ Yes                       |
| `service_role` key | FastAPI backend  | ❌ **Never expose publicly** |

**Never commit your `service_role` key to GitHub.**

---

# 🐍 4. Backend Setup

Open a new terminal and navigate to the backend:

```bash
cd backend
```

## Create a Virtual Environment

### macOS / Linux

```bash
python3 -m venv venv

source venv/bin/activate
```

### Windows

```powershell
python -m venv venv

venv\Scripts\activate
```

---

## Install Dependencies

Install the required Python packages:

```bash
pip install fastapi uvicorn supabase-py python-dotenv python-multipart pydantic easyocr opencv-python-headless pymupdf
```

Or, if the project contains `requirements.txt`:

```bash
pip install -r requirements.txt
```

---

## Create Backend Environment Variables

Create:

```text
backend/.env
```

Add:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-secret-key
```

### ⚠️ Never commit `.env`

Make sure your `.gitignore` contains:

```gitignore
.env
.env.local
venv/
__pycache__/
node_modules/
```

---

# ▶️ 5. Start the FastAPI Server

From the `backend` directory:

```bash
uvicorn main:app --reload --port 8000
```

The backend API will be available at:

```text
http://localhost:8000
```

FastAPI's interactive documentation is available at:

```text
http://localhost:8000/docs
```

> **Note:** The first EasyOCR startup may take some time because its recognition models need to be downloaded.

---

# ⚛️ 6. Frontend Setup

Open a **new terminal**.

From the project root:

```bash
cd frontend
```

Install the Node.js dependencies:

```bash
npm install
```

---

## Create Frontend Environment Variables

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

> Only use the Supabase **anon public key** in the frontend.

---

# ▶️ 7. Start the Next.js Application

Run:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

Open the URL in your browser.

---

# 🔄 End-to-End Workflow

The complete workflow looks like this:

```text
        Upload Land Record
                │
                ▼
       Supabase Private Storage
                │
                ▼
        Document Registry
                │
                ▼
       Run AI Extraction
                │
                ▼
       FastAPI OCR Engine
                │
        ┌───────┴────────┐
        ▼                ▼
     PyMuPDF           OpenCV
        │                │
        └───────┬────────┘
                ▼
             EasyOCR
                │
                ▼
       Extracted Raw Text
                │
                ▼
       Metadata Processing
                │
                ▼
       Human Verification
                │
        ┌───────┴────────┐
        ▼                ▼
     Reject             Approve
                           │
                           ▼
             Official Certificate
                           │
                           ▼
                       PDF Export
```

---

# 🧪 Testing the Application

## 1. Open the Application

Navigate to:

```text
http://localhost:3000
```

---

## 2. Upload a Land Record

Navigate to:

```text
/dashboard/upload
```

Upload a:

* PDF land record
* Scanned document
* Supported image document

The file will be stored in the Supabase `land_records` bucket.

---

## 3. Open the Verification Queue

Navigate to:

```text
/dashboard/verified
```

Find the uploaded document in the registry.

---

## 4. Run AI Extraction

Select the document and click:

```text
Run AI Extraction
```

The frontend communicates with the FastAPI backend:

```text
Next.js
   ↓
FastAPI
   ↓
PyMuPDF / OpenCV
   ↓
EasyOCR
   ↓
Extracted Text
```

---

## 5. Review the Extraction

Review the OCR output and parsed information.

Because OCR can make mistakes—especially with handwritten records—the system uses a **human verification step** before final approval.

---

## 6. Approve & Verify

After reviewing the extracted information, click:

```text
Approve & Verify
```

The document status is updated and the record becomes verified.

---

## 7. Generate Certificate

The application generates an official certificate PDF containing the verified information and digital sign-offs.

The certificate can then be downloaded from the application.

---

# 📁 Project Structure

```text
intelligent-land-records/
│
├── .gitignore
├── README.md
│
├── backend/
│   ├── requirements.txt
│   ├── .env
│   ├── venv/
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── ocr.py
│       ├── parser.py
│       └── ...
│
└── frontend/
    ├── package.json
    ├── .env.local
    ├── next.config.js
    ├── tailwind.config.js
    │
    ├── app/
    │   ├── page.jsx
    │   │
    │   └── dashboard/
    │       ├── upload/
    │       └── verified/
    │
    ├── components/
    ├── lib/
    └── public/
```

> Adjust the structure above to match the actual files in your repository.

---

# 🔐 Environment Variables

## Backend

Create:

```text
backend/.env
```

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

## Frontend

Create:

```text
frontend/.env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

---

# 🛡️ Security Considerations

This project handles potentially sensitive land records, so security should be treated as a core requirement.

### Never expose the Supabase service role key

The service role key should exist **only on the backend**.

```text
❌ frontend/.env.local
❌ GitHub
❌ client-side JavaScript
❌ public repositories

✅ backend/.env
```

### Use private storage

The `land_records` bucket should remain private.

### Enable Row Level Security

Use PostgreSQL RLS policies to control access to document metadata.

### Protect production API endpoints

For production, add:

* Authentication
* Authorization
* API rate limiting
* Input validation
* File-size restrictions
* File-type validation
* Secure logging
* HTTPS
* Proper CORS configuration

---

# 🧠 OCR Processing

The backend uses a document-processing pipeline designed for scanned land records:

```text
Input Document
      │
      ▼
PDF/Image Processing
      │
      ▼
Image Preprocessing
      │
      ├── Noise Reduction
      ├── Thresholding
      ├── Contrast Enhancement
      └── Image Conversion
      │
      ▼
EasyOCR
      │
      ▼
Raw Text
      │
      ▼
Metadata Parsing
      │
      ▼
Human Verification
```

This architecture allows OCR results to be reviewed before they are treated as verified information.

---

# 📌 Current Status

| Component                    | Status |
| ---------------------------- | ------ |
| Next.js Frontend             | ✅      |
| Land Record Upload           | ✅      |
| Supabase Storage             | ✅      |
| PostgreSQL Document Registry | ✅      |
| FastAPI Backend              | ✅      |
| PDF Processing               | ✅      |
| OpenCV Preprocessing         | ✅      |
| EasyOCR Integration          | ✅      |
| Verification Queue           | ✅      |
| Human Verification           | ✅      |
| Certificate Generation       | ✅      |

---

# 🚧 Future Improvements

Potential improvements include:

* [ ] Advanced handwriting recognition models
* [ ] Telugu / Hindi / regional-language OCR
* [ ] Automatic land-owner name extraction
* [ ] Survey number detection
* [ ] Village / Mandal / District metadata extraction
* [ ] Automatic document classification
* [ ] Duplicate document detection
* [ ] OCR confidence scoring
* [ ] Version history for corrections
* [ ] Digital signatures
* [ ] Government authentication integration
* [ ] Role-based access control
* [ ] Audit logs
* [ ] Production-grade authentication
* [ ] Cloud deployment

---

# 🤝 Contributing

Contributions are welcome.

### 1. Fork the repository

```bash
git fork https://github.com/your-username/intelligent-land-records.git
```

### 2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

### 3. Commit your changes

```bash
git add .

git commit -m "Add your feature"
```

### 4. Push the branch

```bash
git push origin feature/your-feature
```

### 5. Open a Pull Request

Describe the changes and include relevant screenshots or testing information where appropriate.

---

# 📜 License

This project is intended for educational, research, and demonstration purposes.

Add your preferred open-source license here, for example:

```text
MIT License
```

---

# 👨‍💻 Author

**Your Name**

GitHub: `https://github.com/your-username`

---

## ⭐ Support the Project

If you find this project useful, consider giving the repository a ⭐ on GitHub.
