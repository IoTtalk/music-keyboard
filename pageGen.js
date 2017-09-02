/**
 * Created by kuan on 7/23/16.
 */
var fs = require('fs'),
    ejs = require('ejs'),
    indexPageDir= __dirname + "/webapp/html/index.ejs",
    chooseSongPageDir = __dirname + "/webapp/html/chooseSong.ejs",
    toneDemoPageDir = __dirname + "/webapp/html/toneDemo.ejs",
    songDir = __dirname + "/midi";

exports.indexPage = function (req, res) {
    readAllSongInDir(songDir, function (err,songs) {
        if(err)
            console.log(err);
        else{
            fs.readFile(indexPageDir,
                function (err, contents) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        contents = contents.toString('utf8');
                        res.writeHead(200, {"Content-Type": "text/html"});
                        res.end(ejs.render(contents, {songs:songs}));
                    }
                }
            );
        }

    });
};

exports.chooseSongPage = function (req, res) {

    readAllSongInDir(songDir, function (err,songs) {
       if(err)
           console.log(err);
       else{
           fs.readFile(chooseSongPageDir,
               function (err, contents) {
                   if (err) {
                       console.log(err);
                   }
                   else {
                       contents = contents.toString('utf8');
                       res.writeHead(200, {"Content-Type": "text/html"});
                       res.end(ejs.render(contents, {songs:songs}));
                   }
               }
           );
       }

    });

};

exports.toneDemoPage = function (req, res) {
    readAllSongInDir(songDir, function (err,songs) {
        if(err)
            console.log(err);
        else{
            fs.readFile(toneDemoPageDir,
                function (err, contents) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        contents = contents.toString('utf8');
                        res.writeHead(200, {"Content-Type": "text/html"});
                        res.end(ejs.render(contents, {songs:songs}));
                    }
                }
            );
        }

    });
};
var readAllSongInDir = function(songDir,callback) {
    fs.readdir(songDir, function (err, files) {
        if (err) {
            callback(err);
            return;
        }
        else {
            var songs = [];
            for(var i = 0; i < files.length; i++){
                var l = files[i].length;
                if(files[i].slice(l-3,l).toLowerCase() == "mid")
                    songs.push(files[i].slice(0,l-4));
            }
            callback(null, songs);
        }
    });
};