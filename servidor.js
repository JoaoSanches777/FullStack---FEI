var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require("mongodb");

// A string de conexao do MongoDB fica no arquivo .env (fora do GitHub, porque tem a senha do banco)
try { process.loadEnvFile(); } catch (e) { }

const MongoClient = mongodb.MongoClient;
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri, { useNewUrlParser: true });

var dbo = client.db("blog");
var posts = dbo.collection("posts");

var app = express();
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('view engine', 'ejs')
app.set('views', './views');

// Porta 80 (pedida no lab). Para testar em outra porta: set PORTA=8080
var porta = process.env.PORTA || 80;
var server = http.createServer(app);
server.listen(porta);
console.log('Servidor rodando na porta ' + porta);

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

// Lab 9 - Blog

app.get('/blog', function (requisicao, resposta) {
    posts.find({}).sort({ _id: -1 }).toArray(function (err, items) {
        if (err) {
            console.log(err);
            resposta.render('blog', { posts: [], erro: 'Erro ao buscar os posts!' })
        } else {
            resposta.render('blog', { posts: items, erro: null })
        }
    });
})

app.get('/cadastrar_post', function (requisicao, resposta) {
    resposta.redirect('Lab9/cadastrar_post.html')
})

app.post('/cadastrar_post', function (requisicao, resposta) {
    var data = {
        db_titulo: requisicao.body.titulo,
        db_resumo: requisicao.body.resumo,
        db_conteudo: requisicao.body.conteudo
    };

    posts.insertOne(data, function (err) {
        if (err) {
            console.log(err);
            resposta.render('blog', { posts: [], erro: 'Erro ao cadastrar o post!' })
        } else {
            resposta.redirect('/blog')
        }
    });
})
