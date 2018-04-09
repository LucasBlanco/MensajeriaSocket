var express = require('express')
var socket = require('socket.io')
var cors = require('cors')
var bodyParser = require('body-parser')

var app = express();
//app.use(express)
//var puerto = 4050

app.use(cors())
app.use(bodyParser.json());
// Add headers


var server = app.listen(4050, function(){
    console.log('listening to request on port 4050')
});

var clientsToEmit = null
app.post('/actualizarClientes', function (req, res, next) {
    console.log('Post', req.body)
    res.send(`You sent:to Express`)
    updateClients(req.body)
});
//Statis files


var io = socket(server);

var clients = []

var getClientByCustomId =  customId => clients.find(elem => elem.customId == customId)
var getClientByClientId = clientId => clients.find(elem => elem.clientId == clientId)
var deleteClient = function(clientId, getClient){
    var index = clients.indexOf(getClient(clientId))
    if (index > -1) {
        clients.splice(index, 1);
    }
}

var updateClients = function(clientesANotificar){
    clientesANotificar.forEach(clienteANotificar => {
        console.log('updating client', clienteANotificar)
        var client = getClientByCustomId(clienteANotificar)
        if(client != undefined){
            console.log('found client', client)
            io.sockets.connected[client.clientId].emit('actualizarSolicitudes', {});
        }
    });
}

io.on('connection', function(socket){
    console.log('made socket connection', socket.id)

    socket.on('storeClientInfo', function (data) {
        console.log('socket: ',socket.id)
        var clientInfo = new Object();
        clientInfo.customId = data.customId;
        clientInfo.clientId = socket.id;
        clients.push(clientInfo);

    });

    socket.on('disconnect', function () {
        deleteClient(socket.id, getClientByClientId)
        console.log('client disconnected', socket.id)
    });

    socket.on('deleteClient', function (customId) {
        deleteClient(socket.id, getClientByCustomId)
        console.log('client deleted', socket.id)
        console.log(clients)
    });

})


