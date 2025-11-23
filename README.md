# Daton ESG Insight

Daton ESG Insight is a comprehensive, AI-powered Environmental, Social, and Governance (ESG) management platform designed to help organizations track, analyze, and report on their sustainability performance.

## 🚀 Key Features

### 🌱 Environmental Management
- **GHG Inventory**: Complete tracking of Scope 1, 2, and 3 emissions with automatic calculation based on emission factors.
- **Waste Management**: End-to-end tracking of waste generation, transportation, and destination (MTR integration).
- **Resource Monitoring**: Real-time monitoring of water and energy consumption.
- **Biodiversity**: Management of conservation areas and carbon credit projects.

### ⚖️ Compliance & Governance
- **Licensing Management**: Proactive monitoring of environmental licenses with expiration alerts and risk scoring.
- **Audits & Inspections**: Management of internal and external audits, non-conformities, and corrective actions.
- **Stakeholder Management**: Tools for materiality analysis and stakeholder engagement.
- **Risk Management**: Identification and mitigation of ESG risks.

### 💰 Financial Integration
- **ESG Finance**: Tracking of costs and revenues related to ESG initiatives.
- **Budgeting**: Management of budgets for sustainability projects.
- **ROI Analysis**: Calculation of return on investment for ESG actions.

### 🤖 Daton AI Chat
A sophisticated AI assistant integrated throughout the platform that offers:
- **Predictive Analytics**: Forecasts for goal achievement and emissions trends.
- **Proactive Insights**: Automatic identification of risks, expiring licenses, and anomalies.
- **Document Processing**: Intelligent extraction of data from PDFs, images, and spreadsheets.
- **Context-Aware Assistance**: Provides relevant information based on the current page and user role.

### 📊 Reporting
- **GRI Standards**: Automated generation of reports following Global Reporting Initiative standards.
- **Custom Reports**: Flexible report builder for specific stakeholder needs.
- **Dashboards**: Interactive visualizations for real-time performance monitoring.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI, Radix UI
- **State Management**: React Query, Context API
- **Routing**: React Router

### Backend & Infrastructure
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Edge Functions**: Deno (TypeScript) for AI logic and complex processing
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## 📂 Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # Global state providers (Auth, Company, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Application pages (Dashboard, Inventory, etc.)
│   ├── services/       # API interaction layers
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helper functions
├── supabase/
│   ├── functions/      # Edge Functions (AI Chat, Document Processor, etc.)
│   ├── migrations/     # Database schema definitions
│   └── config.toml     # Supabase configuration
└── public/             # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun
- Supabase CLI (for local backend development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daton-esg-insight
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env` file based on `.env.example` and add your Supabase credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
