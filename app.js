const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcrypt');
const app = express();

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const SALT_ROUNDS = 10;

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }));
}

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.send('<script>alert("Musisz się najpierw zalogować!"); window.location.href = "/index.html";</script>');
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/register.html', (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
})

app.get('/map.html', requireAuth, (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'map.html'));
})

app.get('/bilety.html', requireAuth, (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'bilety.html'));
})

app.get('/index.html', (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
})

app.post('/register-form', async (req, res) => {
  const { firstName, lastName, email, password, repassword } = req.body;

  if (!firstName || !lastName || !email || !password || !repassword) {
    return res.send('<script>alert("Wszystkie pola są wymagane!"); window.location.href = "/register.html";</script>');
  }
  
  if (password.length < 8) {
    return res.send('<script>alert("Hasło musi mieć co najmniej 8 znaków!"); window.location.href = "/register.html";</script>');
  }
  
  if (password !== repassword) {
    return res.send('<script>alert("Hasła nie są identyczne!"); window.location.href = "/register.html";</script>');
  }
  
  if (!email.includes('@')) {
    return res.send('<script>alert("Nieprawidłowy format email!"); window.location.href = "/register.html";</script>');
  }

  try {
    const data = JSON.parse(fs.readFileSync(USERS_FILE));
    
    if (data.users.some(user => user.email === email)) {
      return res.send('<script>alert("Ten email jest już zarejestrowany!"); window.location.href = "/register.html";</script>');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    data.users.push({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    
    res.send('<script>alert("Rejestracja udana! Możesz się teraz zalogować."); window.location.href = "/index.html";</script>');
  } catch (error) {
    console.error('Registration error:', error);
    res.send('<script>alert("Wystąpił błąd podczas rejestracji."); window.location.href = "/register.html";</script>');
  }
});

app.post('/login-form', async (req, res) => {
  const { email, password } = req.body;
    
  if (!email || !password) {
    return res.send('<script>alert("Wszystkie pola są wymagane!"); window.location.href = "/index.html";</script>');
  }
    
  if (!email.includes('@')) {
    return res.send('<script>alert("Nieprawidłowy format email!"); window.location.href = "/index.html";</script>');
  }

  try {
    const data = JSON.parse(fs.readFileSync(USERS_FILE));
    const user = data.users.find(u => u.email === email);

    if (!user) {
      return res.send('<script>alert("Nieprawidłowy email lub hasło!"); window.location.href = "/index.html";</script>');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.send('<script>alert("Nieprawidłowy email lub hasło!"); window.location.href = "/index.html";</script>');
    }

    req.session.isAuthenticated = true;
    req.session.userEmail = email;
    req.session.userName = user.firstName;
    res.redirect('/map.html');
  } catch (error) {
    console.error('Login error:', error);
    res.send('<script>alert("Wystąpił błąd podczas logowania."); window.location.href = "/index.html";</script>');
  }
});

app.post('/zapomnialem-hasla', (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.send('<script>alert("Proszę podać prawidłowy adres email!"); window.location.href = "/index.html";</script>');
  }

  res.send('<script>alert("Link do resetowania hasła został wysłany na podany adres email."); window.location.href = "/index.html";</script>');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
