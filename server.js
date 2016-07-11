
var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	serv_io = require('socket.io')(server);


app.use(express.static("./webapp"));

app.get("/",function(req,res){
	res.sendFile(__dirname+'/webapp/html/index.html');
});



server.listen((process.env.PORT || 5566));


serv_io.sockets.on('connection', function(socket) {
    socket.on('join', function(data) { socket.join(data); })
    socket.on('leave', function(data) { socket.leave(data); })
});

var color = ['#dc143c','#ffa500','#ffd700','#3cb371','#1e90ff','#00bfff','#9932cc'];
setInterval(function(){
	for (var i = 0; i < color.length; i++)
		serv_io.sockets.in(color[i]).emit('command', 'play');
}, 3500);




