# NaviSafe Backend Integration - QUICKSTART

This is your step-by-step guide to connect your MariaDB database to the React frontend.

---

## Prerequisites Checklist

- [x] MariaDB/MySQL running (verify with `systemctl status mariadb`)
- [x] Database created with tables: `userInfo`, `userAuth`, `userRole`, `organisation`, `registrations`
- [x] phpMyAdmin access or MySQL command line
- [x] .NET 6.0 or later installed (`dotnet --version`)
- [x] Node.js installed (`node --version`)
- [x] This React frontend code

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Setup Database Views (5 minutes)

1. Open phpMyAdmin
2. Select your `navisafe` database
3. Go to "SQL" tab
4. Copy and paste contents of `/guidelines/database-setup.sql`
5. Click "Go" to execute

**Verify:**
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
-- Should show: vw_Users, vw_ObstacleReports
```

---

### Step 2: Create C# Backend Project (10 minutes)

Open terminal and create a new ASP.NET Core Web API project:

```bash
# Create new project
dotnet new webapi -n NaviSafeAPI
cd NaviSafeAPI

# Install required packages
dotnet add package MySql.Data
dotnet add package Newtonsoft.Json

# Create Controllers folder
mkdir Controllers
```

---

### Step 3: Add Controllers (15 minutes)

Create these files in `NaviSafeAPI/Controllers/`:

**AuthController.cs**
```bash
# Copy the AuthController code from:
# /guidelines/MariaDB-Integration-Guide.md (Section 4.1)
```

**ReportsController.cs**
```bash
# Copy the ReportsController code from:
# /guidelines/MariaDB-Integration-Guide.md (Section 4.2)
```

---

### Step 4: Configure Backend (5 minutes)

Edit `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=navisafe;User=root;Password=YOUR_PASSWORD;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

Edit `Program.cs`:
```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("NaviSafePolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseStaticFiles();
app.UseCors("NaviSafePolicy");
app.UseAuthorization();
app.MapControllers();
app.Run();
```

---

### Step 5: Start Everything (2 minutes)

**Terminal 1 - Start Backend:**
```bash
cd NaviSafeAPI
dotnet run
# Should start on http://localhost:5000
```

**Terminal 2 - Start Frontend:**
```bash
cd navisafe-frontend  # Your React project
npm run dev
# Should start on http://localhost:3000 or http://localhost:5173
```

**Terminal 3 - Test API (optional):**
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pilot1","password":"test123"}'

# Test reports endpoint
curl http://localhost:5000/api/reports
```

---

## ✅ Testing Checklist

Open browser to `http://localhost:3000`:

- [ ] Login screen appears
- [ ] Can login with username/password from `userAuth` table
- [ ] After login, pilot sees map interface
- [ ] Can create a new obstacle report
- [ ] Report appears in database `registrations` table
- [ ] Admin can see all reports
- [ ] No CORS errors in browser console

---

## 🐛 Common Issues & Fixes

### Issue 1: "Connection refused" to database
**Fix:**
```bash
# Check MariaDB is running
systemctl status mariadb
# or
mysql -u root -p
```

### Issue 2: CORS error in browser
**Fix:**
- Check that backend `Program.cs` has `app.UseCors("NaviSafePolicy")` BEFORE `app.UseAuthorization()`
- Verify frontend URL in CORS policy matches your dev server

### Issue 3: "Table doesn't exist"
**Fix:**
```sql
-- Run in phpMyAdmin
SHOW TABLES;
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

### Issue 4: Login always fails
**Fix:**
- Check userAuth table has test users
- Password hashing might not match - implement proper password verification
- Check browser DevTools > Network tab for exact error

### Issue 5: Frontend shows "API Error"
**Fix:**
- Open browser DevTools > Console
- Check Network tab for failed requests
- Verify `REACT_APP_API_URL` in frontend `.env` file

---

## 📁 Project Structure

```
your-project/
├── navisafe-frontend/          # This React app
│   ├── components/
│   ├── lib/
│   │   ├── api.ts             # API calls (already configured!)
│   │   ├── types.ts           # TypeScript types
│   │   └── mockData.ts        # Remove after backend works
│   ├── guidelines/
│   │   ├── MariaDB-Integration-Guide.md  # Detailed guide
│   │   ├── database-setup.sql            # SQL to run
│   │   └── QUICKSTART.md                 # This file
│   └── .env                   # Create: REACT_APP_API_URL=http://localhost:5000/api
│
└── NaviSafeAPI/               # Your C# backend (create this)
    ├── Controllers/
    │   ├── AuthController.cs
    │   └── ReportsController.cs
    ├── appsettings.json
    └── Program.cs
```

---

## 🎯 What's Already Done

The React frontend is **100% ready** for backend integration:

✅ API layer in `/lib/api.ts` with all endpoints  
✅ TypeScript types matching database structure  
✅ Map component with Leaflet and GeoJSON support  
✅ Report forms for pilots  
✅ Admin dashboard  
✅ Image upload support  
✅ CORS-friendly configuration  

**You only need to:**
1. Run SQL script in database
2. Create C# controllers
3. Start backend server

---

## 📚 Additional Resources

- **Full Backend Guide**: `/guidelines/MariaDB-Integration-Guide.md`
- **Database Setup**: `/guidelines/database-setup.sql`
- **Frontend API Docs**: `/guidelines/Backend-Integration.md`
- **Types Reference**: `/lib/types.ts`
- **API Service**: `/lib/api.ts`

---

## 🆘 Need Help?

1. Check browser DevTools Console for errors
2. Check browser DevTools Network tab for API calls
3. Review `/guidelines/MariaDB-Integration-Guide.md` for detailed explanations
4. Verify database views are created correctly
5. Test backend endpoints with Postman or curl

---

## Next Steps After Basic Integration Works

1. Implement JWT authentication
2. Add password hashing (bcrypt/PBKDF2)
3. Add file upload handling for photos
4. Implement duplicate detection logic
5. Add input validation
6. Set up Docker deployment
7. Add logging and error monitoring

---

**Good luck! You're ready to integrate the backend.** 🚀
