const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/register.html', (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
})

app.get('/map.html', (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'map.html'));
})

app.get('/bilety.html', (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'bilety.html'));
})

app.get('/index.html', (req,res)=>{
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
