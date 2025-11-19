# Equipo Gestión - Team Management Platform

Platform for managing amateur football teams, focusing on financial management (Panel de Socios) in V1.

## Architecture

This project follows Clean Architecture / Hexagonal Architecture principles:

- **Backend**: Python + FastAPI (async, ASGI)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Decoupled via AuthProvider interface (LocalAuthProvider for V1, CognitoAuthProvider planned)
- **Payments**: Decoupled via PaymentProvider interface (MockPaymentProvider for V1, Mercado Pago planned)

## Project Structure

```
equipo_gestion/
├── backend/
│   ├── app/
│   │   ├── domain/           # Business logic, entities
│   │   ├── application/       # Use cases, interfaces
│   │   ├── infrastructure/    # Repositories, auth, payments, DB
│   │   └── presentation/      # API endpoints, schemas
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── package.json
├── database/
│   └── ddl_schema.sql
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Supabase account)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from `.env.example` and configure:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run database migrations:
```bash
# Execute the SQL file in database/ddl_schema.sql on your PostgreSQL database
# Also ensure userprofile table exists (from userprofile.sql)
```

6. Start the server:
```bash
python main.py
# Or: uvicorn app.presentation.api.main:app --reload
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Database Schema

The database includes the following main tables:
- `levels` - Team levels (0-6, determines feature access)
- `teams` - Teams (with level_id reference)
- `members` - Team members (socios) with userprofile_id reference
- `sponsors` - Sponsors
- `collectas` - Fundraising campaigns
- `campaigns` - Member campaigns (Cuota Social Amateur / Socios Coquita)
- `movements` - Financial movements (Cuenta Corriente)
- `config_cuota` - Monthly fee configuration
- `payment_links` - Payment links tracking
- `users` - Authentication users
- `userprofile` - User profiles (existing table, contains username, first_name, last_name)
- `assistants` - AI assistants (Guillote, Marta, Kela, Pela, Chori)
- `chat_messages` - Chat messages for assistant conversations

See `database/ddl_schema.sql` for the complete schema.

## V1 Features

### Implemented
- ✅ Login/Authentication
- ✅ Dashboard layout with sidebar
- ✅ Team level system (0-6) with feature gating
- ✅ Finanzas module
  - ✅ Caja - Financial summary
  - ✅ Socios (Members) - Complete member management
    - ✅ Active campaign verification
    - ✅ Campaign configuration display (when active)
    - ✅ Level-based campaign creation (requires level 1+)
    - ✅ Historical campaigns listing
    - ✅ Members list with username, first_name, last_name from userprofile
    - ✅ Member payment evolution (cuotas history per member)
    - ✅ Total paid and pending calculations per member
  - ✅ Sponsors - Sponsor management
  - ✅ Tiendas - Store integrations
- ✅ Panel de Socios module (legacy, redirects to Finanzas → Socios)
  - ✅ Campaña (Campaign) - Create and configure member campaigns
    - Monthly fee configuration
    - Alternative amounts
    - Payment method selection (Mercado Pago)
    - Save as draft or publish
  - ✅ Cuenta Corriente view (movements table with filters)
  - ✅ Dashboard view (charts and KPIs)
- ✅ Monthly fee configuration
- ✅ Payment links (mock implementation)
- ✅ Collectas (fundraising campaigns)
- ✅ Member campaigns (Cuota Social Amateur / Socios Coquita)
- ✅ Asistentes (AI Assistants) module
  - ✅ Chat interface with 5 assistants (Guillote, Quela, Pela, Chori, Marta)
  - ✅ Individual conversation per assistant
  - ✅ Message history persistence

### Not Implemented (Future)
- Transfers between teams
- Purchases from providers
- Advanced integrations
- Automatic monthly billing
- Real payment provider integration (Mercado Pago)

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register

### Movements
- `GET /api/v1/movements?team_id={id}` - Get movements
- `POST /api/v1/movements` - Create movement

### Dashboard
- `GET /api/v1/dashboard/stats?team_id={id}` - Get dashboard statistics

### Config
- `GET /api/v1/config/cuota?team_id={id}` - Get monthly fee config
- `POST /api/v1/config/cuota` - Create/update monthly fee config

### Collectas
- `GET /api/v1/collectas?team_id={id}` - Get collectas
- `POST /api/v1/collectas` - Create collecta

### Campaigns
- `GET /api/v1/campaigns/current` - Get current campaign for team (prefers published, fallback to draft)
- `GET /api/v1/campaigns/active` - Get active (published) campaign for team
- `GET /api/v1/campaigns/all` - Get all campaigns (active and historical) for team
- `GET /api/v1/campaigns/check-access` - Check if team can create campaigns (based on level_id)
- `POST /api/v1/campaigns/draft` - Save campaign as draft
- `POST /api/v1/campaigns/publish` - Publish campaign

### Members
- `GET /api/v1/members/with-details` - Get all members with username, first_name, last_name from userprofile
- `GET /api/v1/members/{member_id}/evolution` - Get payment evolution (cuotas history) for a specific member

### Teams
- `GET /api/v1/teams/current` - Get current user's team information (includes level information)

### Chat / Assistants
- `GET /api/v1/chat/assistants` - Get list of available assistants
- `GET /api/v1/chat/messages` - Get chat messages for an assistant
- `POST /api/v1/chat/messages` - Send a message to an assistant

## Development Notes

- All code, comments, and identifiers are in English
- The architecture is designed to be easily migrated to AWS Lambda + API Gateway
- Authentication and payment providers are abstracted via interfaces
- The frontend uses React Router for navigation
- Tailwind CSS is used for styling
- Team level system: Teams start at level 0 and need level 1+ to create member campaigns
- Finanzas → Socios module:
  - Automatically checks for active campaign on load
  - Shows campaign configuration if active campaign exists
  - Validates team level before allowing campaign creation
  - Displays historical campaigns separately
  - Shows members with full details from userprofile (username, first_name, last_name)
  - Provides payment evolution view per member showing all cuotas
- Campaigns can be saved as drafts or published directly
- Members are linked to userprofile table for additional user information

## Testing

Backend tests (to be implemented):
```bash
pytest
```

Frontend tests (to be implemented):
```bash
npm test
```

## License

[Your License Here]

