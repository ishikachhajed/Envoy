<hr/>

## 🔒 What is Envoy Vault?

Stop sending `.env` files over Slack, Discord, or email. Envoy Vault is a modern secrets manager that allows you to securely store, manage, and inject environment variables directly into your applications across your entire team.

It consists of three parts:
1. **The Web Dashboard**: Manage your teams, projects, and secrets in a beautiful web interface.
2. **The API**: A highly secure, encrypted backend.
3. **The CLI**: A developer-friendly command-line tool to pull and inject secrets instantly.

<hr/>

## 🚀 Installation

Install the Envoy Vault CLI globally on your machine using NPM:

```bash
npm install -g envoy-vault-cli
```

*(Note: Requires Node.js 18 or higher)*

<hr/>

## 💻 CLI Usage

### 1. Authentication
Log in to your Envoy Vault account right from the terminal using a passwordless, secure OTP sent directly to your email:

```bash
envoy login
```
*To logout, simply run `envoy logout`.*

### 2. View Your Organizations and Projects
See all the teams you are a part of and the projects within them:

```bash
envoy org list
envoy project list
```

### 3. Pull Secrets Locally
Download your environment variables straight from the cloud into a local `.env` file. Never ask a coworker for their `.env` file again!

```bash
envoy pull --org <org-id> --project <project-id> --env development
```

### 4. Run Commands with Secrets (Coming Soon)
Inject secrets directly into a running process in memory without ever writing them to your hard drive:

```bash
envoy run -- npm run dev
```

<hr/>

## 🛡️ Security
Envoy Vault takes security incredibly seriously:
- **AES-256 Encryption**: All secrets are encrypted before being stored in the database.
- **No Passwords**: We use secure, time-sensitive Email OTPs (One Time Passwords) for authentication.
- **JWT Authorization**: Every API request is verified with short-lived JSON Web Tokens.

<hr/>

## 🛠️ Tech Stack
- **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion
- **Backend**: Spring Boot (Java), Hibernate, PostgreSQL, Brevo (SMTP)
- **CLI**: Node.js, Commander.js, TypeScript

<hr/>

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
