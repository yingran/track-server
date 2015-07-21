var gutil = require('gulp-util');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var through = require('through2');
var PluginError = gutil.PluginError;

var parsed = {};
var basePath = '';

function getFileContent(path){
    var filepath = basePath + path,
        file;
    try {
        file = fs.readFileSync(filepath, 'utf8');
    } catch (e) {
        file = '\n\r//Read File Error: ' + e.message + ';\n\r';
    }
    return file;
}

function distinct(arr1, arr2){
    var i, len, index;
    len = arr2.length;
    for (i=len-1; i>=0; i--){
        index = arr1.indexOf(arr2[i]);
        if (index>=0){
            arr1.splice(index, 1);
        }
    }
}

function getDependence(file){
    var requires = [], match, mname, arr = [];
    match = file.match(/@import *['"]?([^'"\n\r; ]+)/g) || [];
    if (!match || match.length == 0){
        return [];
    }
    mname = crypto.createHash('md5').update(file).digest('hex');
    match.forEach(function(elem){
        var temp = elem.replace(/@import *['"]?([^'"\n\r; ]+)/g, '$1');
        if (requires.indexOf(temp) < 0) {
            requires.push(temp);
        }
    });
    requires.forEach(function(elem){
        var index, len, i, arr2;
        arr2 = getDependence(getFileContent(elem));
        arr2.push(elem);
        distinct(arr2, arr);
        arr = arr.concat(arr2);
    });
    parsed[mname] = arr;
    return arr;
}

function depend(file){
    var requires = getDependence(String(file)),
        data = [];
    try {
        requires.map(function(elem){
            var path = basePath+elem;
            data.push(fs.readFileSync(path, 'utf8'));
        });
        data.push(file);
    } catch (e){
        data.push('//' + e.message);
    }
    return data.join('\n');
}

module.exports = function(options){
    options = options || {};
    basePath = options.base ? options.base + '/' : basePath;
    return through.obj(function(file, enc, cb){
        if (file.isNull()){
            return callback(null, file);
        }
        
        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-jsdependency',  'Streaming not supported'));
        }
        
        file.contents = new Buffer(depend(file.contents));
        
        this.push(file);
        cb();
        
    });
};
