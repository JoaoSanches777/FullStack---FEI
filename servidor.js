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

// Lab 10 - banco da loja de carros
var dbCarros = client.db("loja_carros");
var colecaoUsuarios = dbCarros.collection("usuarios");
var colecaoCarros = dbCarros.collection("carros");

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

// Lab 10 - Loja de carros

function respostaCarros(resposta, mensagem, sucesso) {
    resposta.render('carros_resposta', { mensagem, sucesso })
}

// Confere se o id recebido do formulario e um id valido do MongoDB
function idValido(id) {
    return mongodb.ObjectId.isValid(id) && String(new mongodb.ObjectId(id)) == id
}

// Pagina de listagem dos carros disponiveis
app.get('/carros', function (requisicao, resposta) {
    colecaoCarros.find({}).toArray(function (err, items) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao buscar os carros!', false)
        } else {
            resposta.render('carros_lista', { carros: items })
        }
    });
})

// Cadastro de usuario
app.get('/carros/cadastro', function (requisicao, resposta) {
    resposta.redirect('/Lab10/cadastro.html')
})

app.post('/carros/cadastrar_usuario', function (requisicao, resposta) {
    var nome = requisicao.body.nome;
    var login = requisicao.body.login;
    var senha = requisicao.body.senha;

    if (!nome || !login || !senha) {
        return respostaCarros(resposta, 'Preencha todos os campos!', false)
    }

    colecaoUsuarios.find({ login: login }).toArray(function (err, items) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao cadastrar usuário!', false)
        } else if (items.length > 0) {
            respostaCarros(resposta, 'Este login já está cadastrado!', false)
        } else {
            var data = { nome: nome, login: login, senha: senha };
            colecaoUsuarios.insertOne(data, function (err) {
                if (err) {
                    console.log(err);
                    respostaCarros(resposta, 'Erro ao cadastrar usuário!', false)
                } else {
                    respostaCarros(resposta, 'Usuário ' + nome + ' cadastrado com sucesso!', true)
                }
            });
        }
    });
})

// Login de usuario
app.get('/carros/login', function (requisicao, resposta) {
    resposta.redirect('/Lab10/login.html')
})

app.post('/carros/logar', function (requisicao, resposta) {
    var data = { login: requisicao.body.login, senha: requisicao.body.senha };
    colecaoUsuarios.find(data).toArray(function (err, items) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao fazer login!', false)
        } else if (items.length == 0) {
            respostaCarros(resposta, 'Login ou senha incorretos!', false)
        } else {
            resposta.redirect('/carros/gerenciar')
        }
    });
})

// Pagina de gerencia dos carros
app.get('/carros/gerenciar', function (requisicao, resposta) {
    colecaoCarros.find({}).toArray(function (err, items) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao buscar os carros!', false)
        } else {
            resposta.render('carros_gerencia', { carros: items })
        }
    });
})

// Create - cadastrar novo carro
app.post('/carros/cadastrar', function (requisicao, resposta) {
    var data = {
        marca: requisicao.body.marca,
        modelo: requisicao.body.modelo,
        ano: parseInt(requisicao.body.ano),
        qtde_disponivel: parseInt(requisicao.body.qtde_disponivel)
    };

    if (!data.marca || !data.modelo || isNaN(data.ano) || isNaN(data.qtde_disponivel) || data.qtde_disponivel < 0) {
        return respostaCarros(resposta, 'Preencha todos os campos corretamente!', false)
    }

    colecaoCarros.insertOne(data, function (err) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao cadastrar o carro!', false)
        } else {
            respostaCarros(resposta, 'Carro ' + data.marca + ' ' + data.modelo + ' cadastrado com sucesso!', true)
        }
    });
})

// Update - atualizar carro
app.post('/carros/atualizar', function (requisicao, resposta) {
    if (!idValido(requisicao.body.id)) {
        return respostaCarros(resposta, 'Carro não encontrado!', false)
    }
    var data = { _id: new mongodb.ObjectId(requisicao.body.id) };
    var newData = {
        $set: {
            marca: requisicao.body.marca,
            modelo: requisicao.body.modelo,
            ano: parseInt(requisicao.body.ano),
            qtde_disponivel: parseInt(requisicao.body.qtde_disponivel)
        }
    };

    if (!newData.$set.marca || !newData.$set.modelo || isNaN(newData.$set.ano) || isNaN(newData.$set.qtde_disponivel) || newData.$set.qtde_disponivel < 0) {
        return respostaCarros(resposta, 'Preencha todos os campos corretamente!', false)
    }

    colecaoCarros.updateOne(data, newData, function (err, result) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao atualizar o carro!', false)
        } else if (result.matchedCount == 0) {
            respostaCarros(resposta, 'Carro não encontrado!', false)
        } else {
            respostaCarros(resposta, 'Carro atualizado com sucesso!', true)
        }
    });
})

// Delete - remover carro
app.post('/carros/remover', function (requisicao, resposta) {
    if (!idValido(requisicao.body.id)) {
        return respostaCarros(resposta, 'Carro não encontrado!', false)
    }
    var data = { _id: new mongodb.ObjectId(requisicao.body.id) };
    colecaoCarros.deleteOne(data, function (err, result) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao remover o carro!', false)
        } else if (result.deletedCount == 0) {
            respostaCarros(resposta, 'Carro não encontrado!', false)
        } else {
            respostaCarros(resposta, 'Carro removido com sucesso!', true)
        }
    });
})

// Vender carro - diminui 1 da quantidade disponivel (so se ainda tiver no estoque)
app.post('/carros/vender', function (requisicao, resposta) {
    if (!idValido(requisicao.body.id)) {
        return respostaCarros(resposta, 'Carro não encontrado!', false)
    }
    var data = { _id: new mongodb.ObjectId(requisicao.body.id), qtde_disponivel: { $gt: 0 } };
    var newData = { $inc: { qtde_disponivel: -1 } };
    colecaoCarros.updateOne(data, newData, function (err, result) {
        if (err) {
            console.log(err);
            respostaCarros(resposta, 'Erro ao vender o carro!', false)
        } else if (result.modifiedCount == 0) {
            respostaCarros(resposta, 'Carro esgotado!', false)
        } else {
            resposta.redirect('/carros/gerenciar')
        }
    });
})
