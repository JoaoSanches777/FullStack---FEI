var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('view engine', 'ejs')
app.set('views', './views');

var server = http.createServer(app);
server.listen(80);
console.log('Servidor rodando na porta 80');

// Usuarios cadastrados (ficam na memoria enquanto o servidor estiver ligado)
var usuarios = [];

app.get('/', function (requisicao, resposta) {
    resposta.redirect('Aula2/projects.html')
})

app.get('/cadastra', function (requisicao, resposta) {
    resposta.redirect('Lab8/Cadastro.html')
})

app.post('/cadastra', function (requisicao, resposta) {
    var nome = requisicao.body.nome;
    var login = requisicao.body.login;
    var senha = requisicao.body.senha;

    if (!nome || !login || !senha) {
        resposta.render('resposta', { sucesso: false, status: 'Preencha todos os campos!', login })
    } else if (usuarios.find(u => u.login == login)) {
        resposta.render('resposta', { sucesso: false, status: 'Este login já está cadastrado!', login })
    } else {
        usuarios.push({ nome, login, senha });
        resposta.render('resposta', { sucesso: true, status: 'Usuário ' + nome + ' cadastrado com sucesso!', login })
    }
})

app.get('/login', function (requisicao, resposta) {
    resposta.redirect('Lab8/Login.html')
})

app.post('/login', function (requisicao, resposta) {
    var login = requisicao.body.login;
    var senha = requisicao.body.senha;

    var usuario = usuarios.find(u => u.login == login && u.senha == senha);

    if (usuario) {
        resposta.render('resposta', { sucesso: true, status: 'Login realizado com sucesso! Bem-vindo, ' + usuario.nome + '!', login })
    } else {
        resposta.render('resposta', { sucesso: false, status: 'Login ou senha incorretos!', login })
    }
})
