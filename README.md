# Healthcare Inventory Management System

A modern React-based inventory management system for healthcare products with batch tracking and expiry monitoring.

##🚀 Features

- **Dashboard Overview** - Key metrics and insights at a glance
- **Product Management** - Add and manage product master data
- **Batch Tracking** - Track inventory batches with expiry dates
- **Stock Monitoring** - Real-time stock levels and alerts
- **Storage Management** - Cold storage and warehouse location tracking
- **Responsive Design** - Works on all device sizes

##📊 Featuresrd Features

The dashboard provides comprehensive insights including:

### Summary Statistics
- Total products count
- Total batches count  
- Total stock value
- Categories overview

### Alerts & Warnings
-🔴Low*Low Stock Items** - Products with stock below 10 units
-⚠ **Expiring Soon** - Items expiring within 3 months
-Expiredired Items** - Past expiry date items

### Quick Actions
- Add new products
- Add batch inventory

### Additional Insights
- Storage overview (cold vs normal storage)
- Recent activity (last 7 days)
- Categories distribution

##🛠️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd project

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5174`

### Login Credentials
Use any credentials to login (authentication is mocked for demo purposes)

##📝 Data Loading

The dashboard automatically loads data using your existing API hooks:

- **Products** - Loaded via `useBrands` and `useProductsByBrand` hooks
- **Batches** - Loaded from localStorage (existing functionality)

No manual data setup required - the dashboard connects to your existing data sources automatically.

##🎨/UX Features

- **Modern Glassmorphism Design** - Sleek frosted glass cards
- **Gradient Animations** - Smooth color transitions
- **Responsive Layout** - Adapts to all screen sizes
- **Interactive Elements** - Hover effects and smooth transitions
- **Intuitive Navigation** - Clear tab-based navigation
- **Visual Feedback** - Loading states and success/error messages

##🏗️ Architecture

### Technologies Used
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Project Structure
```
src/
├── components/
│   ├── dashboard/              # Dashboard components
│   │   ├── DashboardUI.tsx     # Dashboard UI layout
│   │  └── DashboardContent.tsx # Dashboard content logic
│   ├── ui/                     # Reusable UI components
│   ├── Dashboard.tsx           # Main dashboard (refactored)
│   ├── InventoryDashboard.tsx # Detailed inventory view
│   ├── ProductDataEntry.tsx    # Product master entry
│  └── InventoryDataEntry.tsx # Batch data entry
├── context/
│   └── AuthProvider.tsx       # Authentication context
├── hooks/
│   └── # Custom React hooks
└── App.tsx                    # Main application component
```

##🔧

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

##📱 Responsive Design

The application is fully responsive and works on:
-📱 Mobile phones (320px+)
-📱 (768px+)
-💻 Desktops (1024px+)
-🖥 Large screens (1280px+)

##🔐

The system uses a mock authentication system for demonstration purposes. In a production environment, this would be replaced with a proper authentication service.

##📈 Enhancements

Planned features:
- [ ] User role management
- [ ] Advanced reporting and analytics
- [ ] Barcode scanning integration
- [ ] Supplier management
- [ ] Purchase order tracking
- [ ] Multi-warehouse support
- [ ] Export to PDF/Excel
- [ ] Real-time notifications

##🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

##📄 License

This project is licensed under the MIT License.

---

**Powered by Waqin**🚀