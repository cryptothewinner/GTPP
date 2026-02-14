# SepeERP - Next Generation Manufacturing & Resource Planning

![SepeERP Banner](https://via.placeholder.com/1200x400?text=SepeERP+Manufacturing+Intelligence)

**SepeERP** is a modern, high-performance Enterprise Resource Planning (ERP) system tailored for the manufacturing industry, specifically designed for pharmaceutical and supplement production. It bridges the gap between traditional ERP functions and modern, real-time production monitoring, providing a seamless experience from raw material intake to finished product dispatch.

## 🚀 Key Features

### 🏭 Production Management
- **Dynamic Production Structure:** Flexible definition of Organizations, Production Sites, and Work Stations.
- **Recipe Management:** Version-controlled recipes with detailed bill of materials (BOM), wastage calculations, and cost analysis.
- **Production Planning:** Drag-and-drop production scheduling with Gantt charts and capacity planning.
- **Batch Tracking:** End-to-end traceability of production batches (User & System generated).

### 🧪 Quality Assurance (QA/QC)
- **Integrated QC Workflows:** Built-in status transitions for Quality Control (Pending -> QC -> Released/Rejected).
- **Cleanroom Standards:** Support for Grade A/B/C/D and CNC zone classifications.
- **Electronic Batch Records (EBR):** Digital tracking of all manufacturing steps and environmental conditions.

### 📦 Inventory & Material Management
- **Warehouse Management:** Multi-warehouse and bin location tracking.
- **Material Classification:** Distinct handling for Raw Materials, Packaging, Semi-Finished, and Finished Goods.
- **Stock Movements:** Real-time tracking of goods receipt, issuances, transfers, and consumption.

### 📊 Dashboard & Analytics
- **Real-time Monitoring:** KPI dashboards for OEE (Overall Equipment Effectiveness), production output, and efficiency.
- **Financial Insights:** Real-time cost calculation per batch based on actual consumption.

## 🛠 Technology Stack

This project is built as a **Turborepo** monorepo, ensuring high performance and scalability.

- **Frontend:** [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [NestJS](https://nestjs.com/) (Modular Architecture)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Integration:** .NET 8 Bridge for legacy ERP (Netsis) sync
- **DevOps:** [Docker](https://www.docker.com/) & Docker Compose for containerized development

## 📂 Project Structure

```text
.
├── apps/
│   ├── web/            # Next.js Admin Dashboard & Production Interfaces
│   ├── api/            # NestJS REST API & Business Logic
│   └── integration/    # .NET 8 Service for External ERP Sync
├── packages/
│   ├── shared/         # Shared Types, DTOs, and Utilities
│   ├── ui/             # Design System & UI Components
│   └── config/         # Shared Configuration (ESLint, TSConfig)
├── docker/             # Docker Composition & Environment Configs
└── turbo.json          # Build System Configuration
```

## ⚡ Getting Started

### Prerequisites
- **Node.js:** v20+
- **pnpm:** v9+
- **Docker Desktop:** Running based on your OS
- **Git**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/cryptothewinner/SepeERP.git
    cd SepeERP
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Environment Setup:**
    ```bash
    cp .env.example .env
    cp apps/api/.env.example apps/api/.env
    ```
    *Update the `.env` files with your database credentials.*

### Running the Application

1.  **Start Infrastructure (PostgreSQL & Redis):**
    ```bash
    pnpm db:up
    # OR directly via docker
    docker-compose -f docker/docker-compose.yml up -d
    ```

2.  **Initialize Database:**
    ```bash
    pnpm db:push   # Push schema to DB
    pnpm db:seed   # Populate initial data (Users, References, Production Structure)
    ```

3.  **Start Development Server:**
    ```bash
    pnpm dev
    ```

- **Web App:** [http://localhost:3000](http://localhost:3000)
- **API Swagger:** [http://localhost:3001/api](http://localhost:3001/api)

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
