const express = require('express');
const app = express();
const PORTA = 80;

app.use(express.static('public'));
app.get('/', (req, res) => res.redirect('/Home.html'));

app.listen(PORTA, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORTA}`));
