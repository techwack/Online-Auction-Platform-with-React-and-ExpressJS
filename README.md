# Online Auction Platform

A full-stack web auction platform built with React and Express.js, allowing users to register, browse live auction listings, and place bids in real time. Built during the Edunet Foundation internship (EY GDS & AICTE).

## Screenshots

<!-- Add screenshots of your Register page, Catalog page, and Dashboard here -->
![Auction Catalog](assets/catalog.png)

## Features

- **User Authentication** — Secure register and login with JWT
- **Auction Catalog** — Browse active listings with item details
- **Bid Placement** — Place and track bids in real time
- **Responsive UI** — Clean, mobile-friendly interface built with React + Vite
- **RESTful API** — Scalable Express.js backend with MongoDB

## Tech Stack

**Frontend:** React (Vite), React Router, CSS  
**Backend:** Node.js, Express.js  
**Database:** MongoDB  
**Auth:** JWT  
**Tools:** Git, npm, ESLint

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/techwack/online-auction.git
cd online-auction
```

### 2. Run the frontend

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

### 3. Run the backend

```bash
cd backend
npm install
node server.js
```

## Project Structure

```
online-auction/
├── public/
├── src/
│   ├── components/     # Navbar, BidCard, etc.
│   ├── pages/          # Login, Register, Catalog, Dashboard
│   ├── App.jsx
│   └── main.jsx
├── backend/            # Express.js API server
├── package.json
└── vite.config.js
```

## Roadmap

- [x] User registration and login
- [x] Auction catalog display
- [x] JWT authentication
- [ ] Real-time bidding with WebSockets
- [ ] Payment integration (Razorpay)
- [ ] Seller dashboard to list items
- [ ] Email notifications on bid win

## Built During

**Edunet Foundation Full Stack Internship** (EY GDS & AICTE) — Mar–Apr 2025  
Served 100+ users during testing phase.

## Author

**Divyanshi Jain** — [GitHub](https://github.com/techwack) · [LinkedIn](https://linkedin.com/in/divyanshijain31)
