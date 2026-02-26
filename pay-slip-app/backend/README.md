# Pay-Slip App Backend

The Pay-Slip App Backend is a Go-based microservice designed to manage users and pay slip metadata, providing a secure and scalable API for pay slip administration and retrieval.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)

## Tech Stack
- **Language**: [Go (1.24.0+)](https://golang.org/)
- **Database**: [MySQL](https://www.mysql.com/) (User management and Pay Slip metadata)
- **Object Storage**: [Firebase Storage (GCS)](https://firebase.google.com/docs/storage) (PDF file storage)
- **Authentication**: JWT-based (integration with Superapp Identity Provider)
- **Documentation**: OpenAPI 3.0

## Project Structure
```text
pay-slip-app/backend/
├── api/              # OpenAPI specifications
├── cmd/              # Application entry points (main.go)
├── internal/         # Private application and library code
│   ├── database/     # DB connection and migrations
│   ├── handlers/     # HTTP request handlers
│   ├── models/       # Data structures and domain models
│   ├── services/     # Business logic layer
│   └── storage/      # Firebase Storage interactions
└── pkg/              # Public library code (Auth)
```

## Getting Started

### Prerequisites
- Go 1.24.0 or higher
- MySQL instance
- Firebase Project with Storage enabled
- GCP Service Account key (required if deploying outside of Google Cloud / for local development)

### Environment Configuration
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required environment variables in `.env`:
   - `PORT`: The port on which the server will listen (defaults to `8081`).
   - `DB_*`: Your MySQL connection details (Host, Port, User, Password, Name).
   - `JWKS_URL`: The JWKS endpoint for authentication (same as Superapp).
   - `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket name (e.g., `your-project.appspot.com`).
   - `GOOGLE_APPLICATION_CREDENTIALS`: Set this to `service-account.json` (refer to [Service Account Key Setup](#service-account-key-setup)).

### Service Account Key Setup
If you are running locally or outside of GCP, you must provide a Service Account key:
1. **Generate Key**: 
   - Go to the [Google Cloud Console](https://console.cloud.google.com/) > **IAM & Admin** > **Service Accounts**.
   - Create a service account with **Storage Object Admin** permissions (or select an existing one).
   - Go to the **Keys** tab > **Add Key** > **Create new key**.
   - Select **JSON** and download the file.
2. **Rename & Place**: 
   - Rename the downloaded file to `service-account.json`.
   - Place it in the `pay-slip-app/backend/` root directory.
3. **Configure .env**:
   - Set `GOOGLE_APPLICATION_CREDENTIALS=service-account.json` in your `.env` file.

### Running Locally
To start the server:
```bash
go run cmd/main.go
```
The server will start on the port specified by the `PORT` environment variable (default: `8081`).

## API Documentation
The API is documented using OpenAPI. You can find the specification in [api/openapi.yaml](./api/openapi.yaml).

### Key Endpoints
- `GET /api/me`: Get current user info.
- `GET /api/users`: List all users (Admin only).
- `POST /api/upload`: Upload a PDF to storage.
- `POST /api/pay-slips`: Create pay slip metadata.
- `GET /api/pay-slips`: List pay slips.

## Architecture
The project follows a clean architecture pattern with separated concerns:
- **Handlers**: Handle HTTP routing and request/response parsing.
- **Services**: Contain business logic and orchestrate data flow.
- **Repositories (Database)**: Manage MySQL persistence.
- **Storage**: Abstracts interaction with Firebase/GCS.
- **Auth Middleware**: Secures endpoints using JWT validation against the Superapp identity provider.
