var express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    pageGen = require("./pageGen.js"),
    serv_io = require("socket.io")(server),
    fs = require("fs"),
    MidiConvert = require("./MidiConvert");

app.use(express.static("./webapp"));

app.get("/", function (req, res) {
    //res.sendFile(__dirname + '/webapp/html/index.html');
    pageGen.indexPage(req,res);
});
app.get("/chooseSong", function (req, res) {
    //res.sendFile(__dirname + '/webapp/html/chooseSong.html');
    pageGen.chooseSongPage(req,res);
});
app.get("/toneDemo", function (req, res) {
    //res.sendFile(__dirname + '/webapp/html/toneDemo.html');
    pageGen.toneDemoPage(req,res);
});

server.listen((process.env.PORT || 5566), '0.0.0.0');


var color = ['#dc143c', '#00bfff', '#ffd700', '#3cb371', '#1e90ff',
            '#ffa500','#9932cc'];
var joined = Array.apply(null, Array(color.length)).map(Number.prototype.valueOf,0);
var song = null;
var playing = false;
var head = 0;
var duration = 20;
var room = 0;
var roomNum = 2;
var track = 0;

var partition = function (len) {
    var r;
    if (head < len) {
        if (head + 20 < len) {
            r = {"start": head, "end": head + duration};
            head += duration;
        }
        else {
            r = {"start": head, "end": len};
            head = len;
        }
        console.log(r);
        return r;
    }
    else {
        return null;
    }
};
var sendNotes = function () {
    if (song != null){
        var part = song.songPart;
        var r = partition(part.length);
        if (r != null) {
            var o = {songPart: part.slice(r.start, r.end), songId: song.songId};
            serv_io.sockets.in(color[room % roomNum]).emit('partObject', o);
            room++;
            playing = true;
        }
        else {
            reset();
            console.log('reset');
        }
    }
};
var reset = function () {
    playing = false;
    head = 0;
    room = 0;
    song = null;
};
var allIn = function () {
    for (var i = 0; i < roomNum; i++)
        if (joined[i] == 0)
            return false;
    return true;
};
serv_io.sockets.on('connection', function (socket) {


    socket.on('midi', function (songName) {
        fs.readFile("midi/" + songName + ".mid", "binary", function (err, data) {
            if (!err) {
                var part = MidiConvert.parseParts(data)[0];
                serv_io.sockets.emit('midi', part);
            } else {
                console.log(err)
            }
        });
    });
    socket.on('chooseSong', function (songObject) {
        fs.readFile("midi/" + songObject.songName + ".mid", "binary", function (err, data) {
            if (err) {
                console.log(err);
                return
            }
            reset();
            var part = MidiConvert.parseParts(data)[track];
            //add unique id for each note in part
            for (var i = 1; i <= part.length; i++)
                part[i-1].index = i;
            song = {songPart: part, songId: songObject.songId};
            console.log(part);
            if (allIn()) {
                sendNotes();
            }
        });
    });
    socket.on('join', function (data) {
        socket.join(data);
        joined[color.indexOf(data)]++;
        //console.log(song);
        if (allIn() && !playing) {
            if (!song) {
                for(var i = 0; i < roomNum; i++)
                    serv_io.sockets.in(color[i]).emit('command', "chooseSong");
            }
            else {
                sendNotes();
            }
        }
        if(!allIn())
            socket.emit('command',"waitOthers");
    });
    socket.on('leave', function (data) {
        //console.log('leave');
        socket.leave(data);
        if(joined[color.indexOf(data)] > 0)
            joined[color.indexOf(data)]--;
        if(!allIn()) {
            for (var i = 0; i < joined.length; i++) {
                if (joined[i] != 0) {
                    serv_io.sockets.in(color[i]).emit("command", "clearAllPart");
                    serv_io.sockets.in(color[i]).emit('command',"waitOthers");
                }
            }
            reset();
        }
    });
    socket.on('ack', function (msg) {

        if (msg == color[(room-1)%roomNum]) {
            sendNotes();
        }
    });

});



