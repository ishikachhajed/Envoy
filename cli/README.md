<div align="center">
  <img src="https://api.iconify.design/material-symbols/lock.svg?color=%2310b981" alt="Envoy Vault Logo" width="100"/>
  <h1>Envoy Vault CLI</h1>
  <p><strong>Secure, seamless, and centralized environment variable management for modern teams.</strong></p>

  [![NPM Version](https://img.shields.io/npm/v/envoy-vault-cli.svg?style=flat-square&color=10b981)](https://www.npmjs.com/package/envoy-vault-cli)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
</div>

<hr/>

## 🔒 What is Envoy Vault?

Stop sending `.env` files over Slack, Discord, or email. Envoy Vault is a modern secrets manager that allows you to securely store, manage, and inject environment variables directly into your applications across your entire team.

This is the command-line interface (CLI) for Envoy Vault, allowing you to pull and inject secrets instantly.

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
