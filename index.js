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


var server = app.listen(9125, function(){
    console.log('listening to request on port 9125')
});

//Statis files


var io = socket(server);

var clientes = []

var getClienteBySocketId =  socketId => clientes.find(elem => elem.socketId == socketId)
var getClienteByUser = user => clientes.find(elem => elem.user == user)


var updateClientes = function(accion, data, userNoANotificar){
    clientes.forEach(clienteANotificar => {
        console.log('updating client', clienteANotificar)
        if(clienteANotificar.user != userNoANotificar){
            io.sockets.connected[clienteANotificar.socketId].emit(accion, data);
        }
    });
}

var tomarVenta =  function({user: user, idVenta: idVenta}) {
    var cliente = getClienteByUser(user)
    if(cliente != undefined){
        cliente.ventaTomada = idVenta
        updateClientes('eliminar', idVenta, user)
    }
}

var liberarVenta = function ({ user: user, idVenta: idVenta }) {
    var cliente = getClienteByUser(user)
    if (cliente != undefined && cliente.ventaTomada == idVenta) {
        cliente.ventaTomada = null
        updateClientes('agregar', idVenta, user)
    }
    
}

var eliminarVenta = function ({ user: user, idVenta: idVenta }) {
    var cliente = getClienteByUser(user)
    if (cliente != undefined) {
        cliente.ventaTomada = null
        updateClientes('eliminar', idVenta, user)
    }
}

var getVentasTomadas = function(){
    return clientes.map(cliente =>{
        if(cliente.ventaTomada != null){ 
            return cliente.ventaTomada
        }
    })
}
io.on('connection', function(socket){
    console.log('made socket connection', socket.id)

    socket.on('crearUsuario', function (user) {
        console.log('socket: ',socket.id)
        var nuevoCliente = new Object();
        nuevoCliente.user = user;
        nuevoCliente.socketId = socket.id;
        nuevoCliente.ventaTomada = null
        clientes.push(nuevoCliente);
    });

    socket.on('getVentasTomadas', function (data){
        socket.emit('filtrar', getVentasTomadas());
    })

    socket.on('tomar', function (data) {
        console.log('Socket ID: ', socket.id)
        console.log('User: ', data.user)
        console.log('Toma venta: ', data.idVenta)
        tomarVenta(data)
         
    });

    socket.on('liberar', function (data) {
        console.log('Socket ID: ', socket.id)
        console.log('User: ', data.user)
        console.log('Libera venta: ', data.idVenta)
        liberarVenta(data)
        
    });

    socket.on('eliminar', function (data) {
        console.log('Socket ID: ', socket.id)
        console.log('User: ', data.user)
        console.log('Elimina venta: ', data.idVenta)
        eliminarVenta(data)
        
    });

    socket.on('disconnect', function () {
        var cliente = getClienteBySocketId(socket.id)
        var index = clientes.indexOf(cliente)
        if (index > -1) {
            clientes.splice(index, 1);
            console.log('client disconnected', cliente.user)
        }

    });


})


