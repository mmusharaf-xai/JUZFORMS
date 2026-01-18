# Juzdata - Forms SaaS Platform

A comprehensive SaaS application for creating and managing forms with a visual drag-and-drop builder and integrated database management.

## Features

### Authentication
- User signup with first name, last name, email, and password
- User login with email and password
- JWT-based authentication

### Forms Module
1. **Forms Listing Page**
   - View all forms
   - Add, edit, and delete forms
   - Form names must be unique per user

2. **Forms Configuration Page**
   - Drag-and-drop form builder
   - Widget types: Text, Large Text, Number, JSON, URL, Date, DateTime, Time, Dropdown, Phone, Email, Ratings
   - Configure field settings: Label, Description, Required
   - Header/Footer sections with grid layout (left, center, right)
   - Add buttons and rich text to header/footer
   - Button actions: API calls or Database row creation
   - Save and publish forms

3. **Public Form Page**
   - View and submit published forms
   - Field validation based on type
   - Support for all widget types

### Database Module
1. **Database Listing Page**
   - View all databases
   - Add, edit, and delete databases
   - Database names must be unique per user

2. **Database Details Page**
   - Add/edit/delete columns with types: TEXT, LARGE_TEXT, JSON, URL, NUMBER, DATE, DATETIME, TIME, SELECT, MULTI_SELECT, PHONE, EMAIL, RATINGS
   - Add/edit/delete rows with type-specific input fields
   - Column uniqueness constraints
   - Sorting by column
   - Multiple column filters

### Settings Module
1. **Account Details**
   - View and update profile (first name, last name)
   - Change password (requires current password)
   - Delete account

2. **Statistics**
   - Forms created count
   - Form submissions count
   - Databases created count

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn/UI components
- React Router DOM
- React Hook Form
- @dnd-kit (drag and drop)
- TipTap (rich text editor)
- React Select
- React Day Picker
- Axios

### Backend
- Node.js
- Express
- TypeScript
- **Prisma ORM**
- PostgreSQL
- JWT Authentication
- bcryptjs

## Project Structure

```
juzdata/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Prisma schema with all models
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.ts      # Prisma client instance
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── formsController.ts
│   │   │   ├── databaseController.ts
│   │   │   └── statsController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── authRoutes.ts
│   │   │   ├── formsRoutes.ts
│   │   │   ├── databaseRoutes.ts
│   │   │   └── statsRoutes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ...
│   │   │   ├── forms/
│   │   │   │   ├── WidgetItem.tsx
│   │   │   │   ├── SortableFieldItem.tsx
│   │   │   │   ├── FieldPreview.tsx
│   │   │   │   ├── HeaderFooterEditor.tsx
│   │   │   │   └── RichTextEditor.tsx
│   │   │   └── Layout.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Signup.tsx
│   │   │   ├── forms/
│   │   │   │   ├── FormsListing.tsx
│   │   │   │   ├── FormConfiguration.tsx
│   │   │   │   ├── FormSubmissions.tsx
│   │   │   │   └── PublicForm.tsx
│   │   │   ├── database/
│   │   │   │   ├── DatabaseListing.tsx
│   │   │   │   └── DatabaseDetails.tsx
│   │   │   └── settings/
│   │   │       └── Settings.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```sql
CREATE DATABASE juzdata;
```

4. Update the `.env` file with your database connection:
```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/juzdata
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

5. Generate Prisma client and push schema to database:
```bash
npm run db:generate
npm run db:push
```

Or use migrations for production:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:5173`

### Using Docker Compose

```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Prisma Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (development)
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:prod

# Open Prisma Studio (database GUI)
npm run db:studio
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/account` - Delete user account

### Forms
- `GET /api/forms` - Get all forms
- `GET /api/forms/:id` - Get form by ID
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `GET /api/forms/public/:id` - Get published form (public)
- `POST /api/forms/public/:id/submit` - Submit form (public)
- `GET /api/forms/:id/submissions` - Get form submissions

### Databases
- `GET /api/databases` - Get all databases
- `GET /api/databases/:id` - Get database by ID
- `POST /api/databases` - Create new database
- `PUT /api/databases/:id` - Update database
- `DELETE /api/databases/:id` - Delete database
- `POST /api/databases/:id/columns` - Add column
- `PUT /api/databases/:id/columns/:columnId` - Update column
- `DELETE /api/databases/:id/columns/:columnId` - Delete column
- `GET /api/databases/:id/rows` - Get all rows
- `POST /api/databases/:id/rows` - Add row
- `PUT /api/databases/:id/rows/:rowId` - Update row
- `DELETE /api/databases/:id/rows/:rowId` - Delete row

### Stats
- `GET /api/stats` - Get user statistics

## Database Schema (Prisma)

```prisma
model User {
  id         String   @id @default(uuid())
  firstName  String
  lastName   String
  email      String   @unique
  password   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  forms      Form[]
  databases  Database[]
}

model Form {
  id           String   @id @default(uuid())
  userId       String
  name         String
  fields       Json     @default("[]")
  headerConfig Json     @default("{}")
  footerConfig Json     @default("{}")
  isPublished  Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(...)
  submissions  FormSubmission[]
}

model FormSubmission {
  id        String   @id @default(uuid())
  formId    String
  data      Json
  createdAt DateTime @default(now())
  form      Form     @relation(...)
}

model Database {
  id        String   @id @default(uuid())
  userId    String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(...)
  columns   DatabaseColumn[]
  rows      DatabaseRow[]
}

model DatabaseColumn {
  id         String   @id @default(uuid())
  databaseId String
  name       String
  type       String
  isUnique   Boolean  @default(false)
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  database   Database @relation(...)
}

model DatabaseRow {
  id         String   @id @default(uuid())
  databaseId String
  data       Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  database   Database @relation(...)
}
```

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| DATABASE_URL | PostgreSQL connection string (Prisma format) | - |
| JWT_SECRET | Secret key for JWT tokens | - |
| JWT_EXPIRES_IN | JWT token expiration | 7d |

## License

MIT
