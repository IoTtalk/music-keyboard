
var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	serv_io = require("socket.io")(server),
    fs = require("fs"),
    MidiConvert = require("./MidiConvert");


app.use(express.static("./webapp"));

app.get("/",function(req,res){
	res.sendFile(__dirname+'/webapp/html/index.html');
});
app.get("/chooseSong",function(req,res){
    res.sendFile(__dirname+'/webapp/html/chooseSong.html');
});
app.get("/toneDemo",function(req,res){
    res.sendFile(__dirname+'/webapp/html/toneDemo.html');
});
server.listen((process.env.PORT || 5566));

var color = ['#dc143c','#ffa500','#ffd700','#3cb371','#1e90ff','#00bfff','#9932cc'];
var joined = new Array(color.length);
var part = null;
var progress = 0;
var defaultSong = 'panther.mid'


var allIn = function(){
	for(var i = 0; i < color.length; i++)
    		if(joined[i] != 1)
    			return false;
    return true;
}
serv_io.sockets.on('connection', function(socket) {


    socket.on('midi',function(data){
        fs.readFile("midi/panther.mid", "binary", function(err, data){
            if (!err){
                part = MidiConvert.parseParts(data)[0];
                serv_io.sockets.emit('midi',part);
            }else{
                console.log(err)
            }
        });
    })
    socket.on('chooseSong',function(songName){
        fs.readFile("midi/"+songName+".mid", "binary", function(err, data){
            if (!err){
                part = MidiConvert.parseParts(data)[0];
                // console.log(part);
                progress = 0;
            }else{
                console.log(err);
            }
        });
    });
    socket.on('join', function(data) { 
		socket.join(data); 
    	joined[color.indexOf(data)] = 1; 
    	if(allIn()){
            if(!part){
                 fs.readFile("midi/" + defaultSong, "binary", function(err, data){
                    if (!err){
                            part = MidiConvert.parseParts(data)[0];
                            //Determin which room by note's first character
                            var room = part[0]["noteName"].charCodeAt(0)-65;
                            serv_io.sockets.in(color[room]).emit('command', part[0]["noteName"]); 
                    }else{
                        console.log(err);
                    }
                });
            }
            else{
                var room = part[0]["noteName"].charCodeAt(0)-65;//determin which room
                serv_io.sockets.in(color[room]).emit('command', part[0]["noteName"]);  
            }
        }

    });
    socket.on('leave', function(data) {
    	socket.leave(data); 
    });
    socket.on('ack',function(msg){
    	if(msg == "played"){ 
           
            //first note is played at the time all join,so plus 1
            progress++;
            if(progress < part.length){
                console.log(part[progress]["noteName"]);
                var room = part[progress]["noteName"].charCodeAt(0)-65;//determin which room
                serv_io.sockets.in(color[room]).emit('command', part[progress]["noteName"]);
            }
    	}
    });
});




