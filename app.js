const express = require('express');
const bodyParser = require('body-parser');
const PNode = require('./pNode'); 

const port = 18070+Math.floor(Math.random()*30);
console.log('Iniciando Nó na porta: ', port)
let node1 = new PNode(port);

node1.init();

const http_port = 3000+Math.floor(Math.random()*10);

let HTTP = function (){
	const app = new express();

	app.use(bodyParser.json());

	app.get('/addNode/:port', (req, res)=>{
		console.log('add host: '+req.params.port)
		node1.addPeer('localhost', req.params.port)
		res.send();
	})

	app.post('/addPaciente/:rg', (req, res)=>{
		//console.log(req.body)
		let newBlock = node1.createBlock(req.params.rg, req.body);
		console.log('Bloco criado');
		res.send();
	})

	app.get('/getPaciente/:rg', (req, res)=>{
		let newBlock = node1.getBrew(req.params.rg);
		console.log('Paciente Retornado');
		res.send();
	})

	app.listen(http_port, () => {
		console.log(`Servidor http on na porta:  ${http_port}`);
	})
}

let httpserver = new HTTP();

