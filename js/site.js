var skulptgl = {
    util: {
        indexOf: function(list, elem) {
            for (var i = 0; i < list.length; i++) {
                if (list[i] == elem)
                    return i;
            }
            return -1;
        },
        // http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
        makeId: function(len) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var nlen = len ? len : 24;
            for( var i=0; i < nlen; i++ )
                text += possible.charAt(
                    Math.floor(Math.random() * possible.length));
            return text;
        },
        deepCopy: function(obj) {
            if (typeof obj === "string" || typeof obj === "number" ||
                typeof obj === "boolean")
                return obj;

            if (obj.length !== undefined) {
                var ret = [];
                for (var i = 0; i < obj.length; i++)
                    ret.push(this.deepCopy(obj[i]));
                return ret;
            }

            var ret = {};
            for (var k in obj)
                ret[k] = this.deepCopy(obj[k]);
            return ret;
        },
        xhrGet: function(url, onLoad, onFailed) {
            console.log('making a request for ' + url);
            var contentReq = new XMLHttpRequest();
            var readyStateChange = function() {
                if (contentReq.readyState == 4 && contentReq.status == 200) {
                    onLoad(contentReq.responseText);
                } else if (contentReq.readyState == 4 && onFailed) {
                    onFailed(contentReq.status);
                }
            }
            contentReq.onreadystatechange = readyStateChange;
            contentReq.open('GET', url, true);
            contentReq.send();
        },
        xhrPost: function(url, text, onLoad, onFailed) {
            console.log('making a request for ' + url);
            var contentReq = new XMLHttpRequest();
            var readyStateChange = function() {
                if (contentReq.readyState == 4 && contentReq.status == 200) {
                    onLoad(contentReq.responseText);
                } else if (contentReq.readyState == 4 && onFailed) {
                    onFailed(contentReq.status);
                }
            }
            contentReq.onreadystatechange = readyStateChange;
            contentReq.open('POST', url, true);
            contentReq.send(text);
        }
    },
    readProject: function(onLoad, onFailed) {
        this.util.xhrGet('/run/?proj', onLoad, onFailed);
    },
    writeProject: function(newProj, onLoad, onFailed) {
        var newProjStr = JSON.stringify(newProj);
        this.util.xhrPost('/run/?wproj', newProjStr, onLoad, onFailed);
    },
    readSrcFile: function(filename, onLoad, onFailed) {
        this.util.xhrGet('/run/?read=' + filename, onLoad, onFailed);
    },
    writeSrcFile: function(filename, text, onLoad, onFailed) {
        this.util.xhrPost('/run/?write=' + filename, text, onLoad, onFailed);
    },
    openProjectDialog: function(project, onOK, onCancel) {
        React.render(
            <ProjectDialog proj={project} onOK={onOK} onCancel={onCancel} />,
            document.getElementById('project-dialog'));
    },
    closeProjectDialog: function() {
        React.unmountComponentAtNode(
            document.getElementById('project-dialog'));
    },
    project: null,
};

(function() {
    skulptgl.project = {
        NAME: 'name',
        SRC: 'src',
        DEFAULT_FILE: 'defaultFile'
    }
})();
