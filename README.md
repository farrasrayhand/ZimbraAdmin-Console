# 🚀 ZimbraAdmin Console

A modern, high-performance, **mobile-responsive web administration console** designed to enable system administrators to conveniently manage Zimbra Collaboration Suite accounts, aliases, mail queues, quotas, statuses, and services from any mobile or desktop browser.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)
![Zimbra](https://img.shields.io/badge/Zimbra--SOAP-Port%207071-red.svg)
![Responsive](https://img.shields.io/badge/Mobile--Friendly-100%25-success.svg)

---

## ✨ Key Features

### 📱 Modern Mobile-First UX & Desktop Design
- **Responsive Architecture**: High-contrast, clean interface with glassmorphic cards, CSS design tokens, and smooth micro-animations tailored for smartphones, tablets, and desktop displays.
- **Dedicated Mobile Card View**: Multi-row layout separating header, matched alias banners, and storage pills to prevent layout crowding or badge overlapping on small touchscreens.
- **Centered Modal System**: Native backdrop-blur popup dialogs with `Escape` key and click-outside dismissal.

### 👥 Full Account Lifecycle Management
- **Structured Name Fields**: First Name (`givenName`), Middle Name (`initials`), and Last Name (`sn`).
- **Display Name Support**: Auto-formatted and customizable display names.
- **Multi-Domain Support**: Seamless switching between domains configured on the server.
- **Interactive Search & Filter Console**: Instant filtering by keywords, domains, and account statuses (`Active`, `Locked`, `Closed`, `Maintenance`) with filter chips and one-click reset.

### 🏷️ Intelligent Email Alias Management & Search
- **Deep LDAP Alias Search**: Search queries automatically evaluate both primary email addresses (`mail`) and aliases (`zimbraMailAlias`, `zimbraMailDeliveryAddress`).
- **Matched Alias Badges**: Visual indicators highlighting which alias matched the search criteria.
- **Two-Step Deletion Protection**: Centered confirmation modal requiring administrators to retype the target alias before removal to prevent accidental data loss.

### 🔐 Account Security & Password Control
- **Quick Status Switches**: Instantly toggle between `Active`, `Locked`, `Closed`, and `Maintenance` modes.
- **Secure Password Resets**: Real-time password strength validation with policy-compliant **Random Password Generator**.
- **Enforced Password Change**: Toggle `zimbraPasswordMustChange` to require users to set a new password on their next webmail/IMAP login.

### 💾 Storage Quota & Class of Service (COS)
- **Visual Storage Meters**: Dynamic color-coded progress bars (Green / Orange / Red) showing real-time mailbox utilization in Megabytes.
- **COS Inheritance**: Full compatibility with Zimbra Class of Service defaults and individual quota overrides.

### 📬 Mail Queue Monitor
- **Real-Time Queue Inspection**: Monitor Zimbra Postfix mail queues including Active, Incoming, Deferred, Hold, and Corrupt counts.
- **Queue Actions**: Flush and requeue delayed messages directly from the dashboard.

### 🛡️ Zero-Trust Security Architecture
- **Stateless Proxy**: Direct encrypted communication with Zimbra SOAP HTTPS (Port 7071) without requiring any local database.
- **Zero Plain-Text Credentials Logging**: Strict sanitization preventing passwords or auth tokens from appearing in server logs or console traces.
- **Hardened Cookies**: Session cookies protected by `HttpOnly`, `SameSite`, and secure transmission flags.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **API Protocol**: Zimbra Admin SOAP Web Services (Port 7071 HTTPS)
- **Templating Engine**: EJS (Embedded JavaScript)
- **Styling**: Modern Vanilla CSS (Design Tokens, Flexbox/Grid, Glassmorphism, Micro-animations)
- **Icons**: Lightweight inline SVGs for zero latency and crisp rendering on Retina/OLED displays

---

## ⚡ Quick Start

### Prerequisites

- Node.js `v18.x` or higher
- Network access to Zimbra Admin SOAP Port (`7071` HTTPS)

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

## 🔒 Production Deployment

### 1. Run behind Nginx Reverse Proxy with SSL (Certbot Let's Encrypt)
```nginx
server {
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Generate free SSL certificate:
```bash
sudo certbot --nginx -d admin.yourdomain.com
```

### 2. Firewall Hardening (UFW)
Restrict Zimbra SOAP Port 7071 access strictly to the IP address where this console is hosted:
```bash
sudo ufw allow from <YOUR_CONSOLE_SERVER_IP> to any port 7071 proto tcp
```

### 3. Keep Running with PM2
```bash
npm install -g pm2
pm2 start server.js --name "zimbra-admin"
pm2 save
pm2 startup
```

---

## 👨‍💻 Maintainer

Developed and maintained by **[Farras Rayhand](https://github.com/farrasrayhand)** (`farrasrayhand@gmail.com`).

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
