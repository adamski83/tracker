# UPS Tracker - CSV Reader with Email System

This is a [Next.js](https://nextjs.org) project for tracking and managing UPS
data with email functionality.

## Features

- 📊 **CSV File Upload and Processing** - Upload and process CSV files with
  automatic data validation
- 💾 **MongoDB Integration** - Automatic data storage with duplicate prevention
- 🔍 **Advanced Search** - Search and filter data across all fields
- 📧 **Email System** - Send emails with data attachments using Nodemailer
- 👥 **Contact Management** - Manage email contacts with easy selection
- 📈 **Database Statistics** - Real-time stats about uploaded files and records
- 📝 **Email History** - Track all sent emails with status monitoring

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB running on localhost:27017 (or update connection string in
  `lib/db.ts`)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure email settings:

```bash
cp .env.example .env.local
```

4. Update `.env.local` with your email configuration:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Email Configuration

#### For Gmail:

1. Enable 2-Factor Authentication in your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password as `EMAIL_PASS`

#### For other providers:

Update the transporter configuration in `app/api/send-email/route.ts`

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

### 1. Data Management

- Upload CSV files using the upload form
- Data is automatically saved to MongoDB
- Duplicate records are prevented using hash comparison
- Search and filter data using the search panel

### 2. Email System

- **Send Emails**: Compose and send emails with optional CSV data attachments
- **Manage Contacts**: Add, edit, and delete email contacts
- **Email History**: View sent email history with status and error tracking

### 3. Database Features

- Real-time statistics display
- Automatic data loading on page start
- Manual refresh options

## API Endpoints

- `GET /api/database` - Retrieve all database records
- `POST /api/upload` - Upload and process CSV files
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Add new contact
- `DELETE /api/contacts?id=<id>` - Delete contact
- `POST /api/send-email` - Send email with optional attachment
- `GET /api/send-email` - Get email history

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **Email**: Nodemailer
- **File Processing**: Papa Parse (CSV parsing)

## Project Structure

```
├── app/
│   ├── api/          # API routes
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Main page
├── components/
│   └── EmailManager.tsx  # Email management component
├── lib/
│   ├── db.ts         # Database connection
│   ├── models.ts     # Mongoose models
│   └── parseCsv.ts   # CSV parsing utilities
└── types/
    └── index.ts      # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
