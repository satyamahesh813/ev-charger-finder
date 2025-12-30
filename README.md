# EV Charger Finder

A production-ready full-stack application to locate EV charging stations with real-time data, user authentication, and comprehensive admin management.

## Features

- 🔐 **Secure Authentication**: JWT-based auth with role-based access control (Driver/Admin)
- 🗺️ **Interactive Map**: Real-time charger locations with Leaflet integration
- 🔍 **Smart Search**: Location-based search with 25km radius
- 📊 **Admin Dashboard**: Complete CRUD operations, bulk actions, and activity logging
- 🌐 **Geolocation**: Robust location detection with fallback mechanisms
- 🎨 **Modern UI**: Dark/light modes, responsive design, premium aesthetics

## Tech Stack

**Backend:**
- Spring Boot 3.x
- Spring Security (JWT)
- Spring Data JPA
- MySQL Database
- API Ninjas EV Charger API

**Frontend:**
- React 18+ with Vite
- React Router
- Axios
- React Leaflet (Maps)
- Tailwind CSS
- Lucide Icons

## Prerequisites

- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

## Quick Start (Development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ev-charger-finder
```

### 2. Backend Setup
```bash
cd ev-charger-backend

# Copy environment file
cp .env.example .env

# Update .env with your credentials:
# - DB_PASSWORD: Your MySQL password
# - API_NINJAS_KEY: Get from https://api-ninjas.com
# - JWT_SECRET: Generate a secure 256-bit key

# Run the application
mvn spring-boot:run
```

Backend will start on `http://localhost:8081`

### 3. Frontend Setup
```bash
cd ev-charger-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start on `http://localhost:5173`

### 4. Create First Admin User
The first user must be created via the signup page and then manually updated in the database:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | MySQL connection string | `jdbc:mysql://localhost:3306/evdb` |
| `DB_USERNAME` | Database username | `root` |
| `DB_PASSWORD` | Database password | - |
| `API_NINJAS_KEY` | API Ninjas API key | - |
| `JWT_SECRET` | JWT signing secret (256-bit) | - |
| `JWT_EXPIRATION` | Token expiration (ms) | `86400000` (24h) |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173` |
| `PORT` | Server port | `8081` |

## Production Deployment

### Using Spring Profiles

**Development:**
```bash
mvn spring-boot:run
```

**Production:**
```bash
# Set environment variables first
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:mysql://your-prod-db:3306/evdb
export DB_USERNAME=prod_user
export DB_PASSWORD=secure_password
export JWT_SECRET=your_secure_256_bit_key
export API_NINJAS_KEY=your_api_key
export CORS_ORIGINS=https://your-domain.com

# Build and run
mvn clean package -DskipTests
java -jar target/ev-charger-backend-0.0.1-SNAPSHOT.jar
```

### Frontend Production Build
```bash
cd ev-charger-frontend
npm run build

# Serve with nginx, Apache, or any static hosting
```

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong JWT secrets** - Minimum 256 bits of randomness
3. **Enable HTTPS** - Always use SSL/TLS in production
4. **Update CORS origins** - Set to your actual production domain
5. **Database security** - Use strong passwords, restricted access
6. **Regular updates** - Keep dependencies up to date

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login

### Chargers (Authenticated)
- `GET /api/chargers?lat={lat}&lng={lng}` - Get nearby chargers
- `GET /api/chargers/stats` - Get charger statistics

### Admin (Admin Only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/bulk-toggle` - Bulk enable/disable users
- `GET /api/admin/chargers` - List all chargers
- `POST /api/admin/chargers` - Create charger
- `GET /api/admin/logs` - Activity logs
- `GET /api/admin/stats` - Admin statistics

## Project Structure

```
ev-charger-finder/
├── ev-charger-backend/
│   ├── src/main/java/com/evfinder/
│   │   ├── controller/      # REST controllers
│   │   ├── model/           # JPA entities
│   │   ├── repository/      # Data access layer
│   │   ├── security/        # Security configuration
│   │   ├── dto/             # Data transfer objects
│   │   └── service/         # Business logic
│   └── src/main/resources/
│       ├── application.properties
│       └── application-prod.properties
├── ev-charger-frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   └── main.jsx         # Entry point
│   └── package.json
└── README.md
```

## Troubleshooting

**Backend won't start:**
- Check MySQL is running: `mysql -u root -p`
- Verify environment variables are set
- Check logs in `logs/ev-charger.log`

**Frontend can't connect:**
- Verify backend is running on correct port
- Check CORS configuration in `.env`
- Clear browser cache and cookies

**Geolocation not working:**
- Ensure HTTPS is enabled (required by browsers)
- Check browser location permissions
- Try the manual search features

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues and questions, please create an issue in the repository.
