
var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	serv_io = require('socket.io')(server);


app.use(express.static("./webapp"));

app.get("/",function(req,res){
	res.sendFile(__dirname+'/webapp/html/index.html');
});

server.listen((process.env.PORT || 5566));

var color = ['#dc143c','#ffa500','#ffd700','#3cb371','#1e90ff','#00bfff','#9932cc'];
var joined = new Array(color.length);
var n = 0;
var now = false;
var allIn = function(){
	for(var i = 0; i < color.length; i++)
    		if(joined[i] != 1)
    			return false;
    return true;
}

serv_io.sockets.on('connection', function(socket) {
    socket.on('join', function(data) { 
		socket.join(data); 

    	joined[color.indexOf(data)] = 1; 
    	// if(allIn() && !now){
    		serv_io.sockets.in(color[n]).emit('command', 'play');
    		now = true;
    	// }
    });
    socket.on('leave', function(data) {
    	socket.leave(data); 
    });
    socket.on('ack',function(msg){
    	if(msg=="played"){ 
    		// console.log(msg);
    		console.log(n);
    		if(n == color.length-1){
    			n = 0;
    			now = false;
    		}
    		else
    			n++;
    		serv_io.sockets.in(color[n]).emit('command', 'play');
    	}
    });
});




