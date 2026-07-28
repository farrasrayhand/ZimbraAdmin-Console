# 🚀 ZimbraAdmin Console

A modern, high-performance, **mobile-responsive web administration console** designed to enable system administrators to conveniently manage Zimbra Collaboration Suite accounts, aliases, quotas, statuses, and services from any mobile or desktop browser.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)
![Zimbra](https://img.shields.io/badge/Zimbra--SOAP-Port%207071-red.svg)

---

## ✨ Features

- 📱 **Mobile-First & Desktop Responsive UI**: High-contrast, glassmorphic interface tailored for smartphones, tablets, and desktop displays.
- 👥 **Full Account Lifecycle Management**:
  - Structured name entry: **First Name** (`givenName`), **Middle Name** (`initials`), and **Last Name** (`sn`).
  - Auto-generated and custom **Display Name** support.
  - Multi-domain support with instant domain dropdowns.
- 📧 **Email Alias Management**: Add and remove email aliases effortlessly with visual badge lists.
- 🔐 **Account Security & Status Control**:
  - Instant status switches: `Active`, `Locked`, `Closed`, and `Maintenance`.
  - Secure Password Resets with real-time policy validation and policy-compliant **Random Password Generator**.
  - Enforce password change on next login (`zimbraPasswordMustChange`).
- 💾 **Storage Quota & COS Control**: Visual storage progress bars with Class of Service (COS) overrides.
- 🛡️ **Zero-Trust Security**:
  - **No local database required** (Stateless Proxy connecting directly to Zimbra SOAP HTTPS Port 7071).
  - **Zero plain-text password logging** in server outputs or transcripts.
  - Enforced `HttpOnly` and `SameSite` session security cookies.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **API Protocol**: Zimbra Admin SOAP Web Services (Port 7071 HTTPS)
- **Templating**: EJS (Embedded JavaScript)
- **Styling**: Modern Vanilla CSS Design Tokens (Glassmorphism, Dark/Light elements, Micro-animations)

---

## ⚡ Quick Start

### Prerequisites

- Node.js `v18.x` or higher
- Access to a Zimbra Admin SOAP Port (`7071` HTTPS)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/farrasrayhand/ZimbraAdmin-Console.git
   cd ZimbraAdmin-Console
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   SESSION_SECRET=your_secure_random_64_char_string
   NODE_ENV=production
   ```

4. **Start the application**:
   ```bash
   npm start
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 🔒 Production Security & Deployment

To deploy in production (VPS / Cloud Server):

1. **Run behind Nginx Reverse Proxy with HTTPS (Certbot Let's Encrypt)**:
   ```bash
   sudo certbot --nginx -d admin.yourdomain.com
   ```
2. **Restrict Zimbra SOAP Port 7071 Firewall (UFW)**:
   ```bash
   sudo ufw allow from <YOUR_HOSTING_IP> to any port 7071 proto tcp
   ```
3. **Run with PM2 Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "zimbra-admin"
   pm2 save
   pm2 startup
   ```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
