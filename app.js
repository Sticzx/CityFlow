const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

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

app.post('/register-form', (req, res) => {
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
  
  res.send('<script>alert("Rejestracja udana! Możesz się teraz zalogować."); window.location.href = "/index.html";</script>');
});

app.post('/login-form', (req, res) => {
  const { email, password } = req.body;
    
  if (!email || !password) {
    return res.send('<script>alert("Wszystkie pola są wymagane!"); window.location.href = "/index.html";</script>');
  }
    
  if (!email.includes('@')) {
    return res.send('<script>alert("Nieprawidłowy format email!"); window.location.href = "/index.html";</script>');
  }
    
  req.session.isAuthenticated = true;
  req.session.userEmail = email;
  res.redirect('/map.html');
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
