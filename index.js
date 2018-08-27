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


var updateClientes = function(accion, data, userNoANotificar, pantalla){
    clientes.forEach(clienteANotificar => {
        console.log('updating client', clienteANotificar)
        if(clienteANotificar.user != userNoANotificar && clienteANotificar.pantalla == pantalla){
            io.sockets.connected[clienteANotificar.socketId].emit(accion, data);
        }
    });
}

var tomarVenta =  function({user: user, idVenta: idVenta, pantalla: pantalla}) {
    var cliente = getClienteByUser(user)
    if(cliente != undefined){
        cliente.ventaTomada = idVenta
        if(idVenta != undefined){
            updateClientes('eliminar', idVenta, user, pantalla)
        }
    }
}

var liberarVenta = function ({ user: user, idVenta: idVenta , pantalla: pantalla}) {
    var cliente = getClienteByUser(user)
    if (cliente != undefined && cliente.ventaTomada == idVenta) {
        cliente.ventaTomada = null
        updateClientes('agregar', idVenta, user, pantalla)
    }
    
}

var eliminarVenta = function ({ user: user, idVenta: idVenta , pantalla: pantalla}) {
    var cliente = getClienteByUser(user)
    if (cliente != undefined) {
        cliente.ventaTomada = null
        //updateClientes('eliminar', idVenta, user, pantalla)
    }
}

var getVentasTomadas = function(pantalla){
    return clientes.map(cliente =>{
        if(cliente.ventaTomada != null && cliente.pantalla == pantalla){ 
            return cliente.ventaTomada
        }
    })
}

io.on('connection', function(socket){
    console.log('made socket connection', socket.id)

    socket.on('crearUsuario', function (usuario) {
        console.log('socket: ',socket.id)
        var nuevoCliente = new Object();
        nuevoCliente.user = usuario.nombre;
        nuevoCliente.pantalla = usuario.pantalla;
        nuevoCliente.socketId = socket.id;
        nuevoCliente.ventaTomada = null
        clientes.push(nuevoCliente);
    });

    socket.on('getVentasTomadas', function (pantalla){
        socket.emit('ventasTomadas', getVentasTomadas(pantalla));
    })

    socket.on('tomar', function (data) {
        console.log('Socket ID: ', socket.id)
        console.log('User: ', data.user)
        console.log('De la pantalla: ', data.pantalla)
        if (clientes.some(client => client.ventaTomada == data.idVenta && data.user != client.user && client.pantalla == data.pantalla)) {
            socket.emit('ventaTomada', 'ventaTomada');
            console.log('Se le deniega la venta porque ya esta tomada: ')
        }else{
            console.log('Toma venta: ', data.idVenta)
            tomarVenta(data)
        }
    });

    socket.on('liberar', function (data) {
        console.log('Socket ID: ', socket.id)
        console.log('User: ', data.user)
        console.log('Libera venta: ', data.idVenta)
        console.log('De la pantalla: ', data.pantalla)
        liberarVenta(data)
        
    });

    socket.on('eliminar', function (data) {
        console.log('Socket ID: ', socket.id)
        console.log('User: ', data.user)
        console.log('Elimina venta: ', data.idVenta)
        console.log('De la pantalla: ', data.pantalla)
        eliminarVenta(data)
    });

    socket.on('disconnect', function () {
        var cliente = getClienteBySocketId(socket.id)
        var index = clientes.indexOf(cliente)
        if (index > -1) {
            if(cliente.pantalla){
                updateClientes('agregar', cliente.ventaTomada, cliente.user, cliente.pantalla)
            }
            clientes.splice(index, 1);
            console.log('client disconnected', cliente.user)
        }

    });


})


