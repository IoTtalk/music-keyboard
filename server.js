
var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	serv_io = require('socket.io')(server);

app.use(express.static("./webapp"));
server.listen((process.env.PORT || 5566));


serv_io.sockets.on('connection', function(socket) {
    socket.on('join', function(data) { socket.join(data); })
    socket.on('leave', function(data) { socket.leave(data); })
});

var room = 'red'
setInterval(function(){
    serv_io.sockets.in(room).emit('message', 'hello world!');
}, 1000);




