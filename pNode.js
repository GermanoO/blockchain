const PChain = require('./pChain');
const WebSocket = require('ws');

const PNode = function(port){
    let pSockets = [];
    let pServer;
    let _port = port
    let chain = new PChain();

    const REQUEST_CHAIN = "REQUEST_CHAIN";
    const REQUEST_BLOCK = "REQUEST_BLOCK";
    const BLOCK = "BLOCK";
	const CHAIN = "CHAIN";

    function init(){

        chain.init();
		
        pServer = new WebSocket.Server({ port: _port });
		
        pServer.on('connection', (connection) => {
            console.log('conexão em');
            initConnection(connection);
        });		
    }

    const messageHandler = (connection) =>{
        connection.on('message', (data) => {
            const msg = JSON.parse(data);
            switch(msg.event){
            	case REQUEST_CHAIN:
                    connection.send(JSON.stringify({ event: CHAIN, message: chain.getChain()}))    
                    break;                  
            	case REQUEST_BLOCK:
                    requestLatestBlock(connection);
                    break;      
                case BLOCK:
                    processedRecievedBlock(msg.message);
                    break;  
                case CHAIN:
                    processedRecievedChain(msg.message);
                    break;  

                default:  
                    console.log('Mensagem Desconhecida ');
            }
        });
    }


    const processedRecievedChain = (blocks) => {
        let newChain = blocks.sort((block1, block2) => (block1.index - block2.index))

        if(newChain.length > chain.getTotalBlocks() && chain.checkNewChainIsValid(newChain)){
        	chain.replaceChain(newChain);
        	console.log('chain substituida');
        }
    }

    const processedRecievedBlock = (block) => {

        let currentTopBlock = chain.getLatestBlock();

        // Verifica se é o mesmo bloco ou o antigo
        if(block.index <= currentTopBlock.index){
        	console.log('Nenhum update necessário');
        	return;
        }

        if(block.previousHash == currentTopBlock.hash){
        	chain.addToChain(block);

        	console.log('New block adicionado');
        	console.log(chain.getLatestBlock());
        }else{
        	console.log('solicitando chain');
        	broadcastMessage(REQUEST_CHAIN,"");
        }
    }

    const requestLatestBlock = (connection) => {
        connection.send(JSON.stringify({ event: BLOCK, message: chain.getLatestBlock()}))   
    }

    const broadcastMessage = (event, message) => {
        pSockets.forEach(node => node.send(JSON.stringify({ event, message})))
    }

    const closeConnection = (connection) => {
        console.log('fechando conexão');
        pSockets.splice(pSockets.indexOf(connection),1);
    }

    const initConnection = (connection) => {
        console.log('iniciando conexão');

        messageHandler(connection);
        
        requestLatestBlock(connection);

        pSockets.push(connection);

        connection.on('error', () => closeConnection(connection));
        connection.on('close', () => closeConnection(connection));
    }

    const createBlock = (rg, dadosPaciente) => {
        let newBlock = chain.createBlock(rg, dadosPaciente)
        chain.addToChain(newBlock);
		broadcastMessage(BLOCK, newBlock);
    }

    const getBrew = (rg) => {
        let Block = chain.getBrew(rg)
        console.log(Block)
    }

    const getStats = () => {
        return {
            blocks: chain.getTotalBlocks()
        }
    }

    const addPeer = (host, port) => {
        let connection = new WebSocket(`ws://${host}:${port}`);
        connection.on('error', (error) =>{
            console.log(error);
        });
        connection.on('open', (msg) =>{
            initConnection(connection);
        });
    }
    return {
        init,
        broadcastMessage,
        addPeer,
        createBlock,
        getBrew,
        getStats
    }
}
module.exports = PNode;