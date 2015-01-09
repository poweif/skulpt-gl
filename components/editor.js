var MainPanel = React.createClass({
    getInitialState: function() {
        return {
            name: '',
            srcs: {},
            srcFiles: [],
            defaultFileInd: -1,
            isDialogOpen: false,
            canvasId: "mainPanelCanvas"
        };
    },
    handleScroll: function(ev) {
        this.refs.context.getDOMNode().style.marginTop =
            window.pageYOffset + 'px';
    },
    handleResize: function(ev) {
        var width = Math.min(
            this.refs.contextWrapper.getDOMNode().offsetWidth - 30,
            window.innerHeight - 150
        );

        this.refs.context.getDOMNode().style.width = width + 'px';
        this.refs.context.getDOMNode().style.height = width + 'px';
        this.refs.context.getDOMNode().width = width;
        this.refs.context.getDOMNode().height = width;
    },
    openTextDialog: function(text, prompt, onOK) {
        skulptgl.openDialog(text, prompt, onOK, this.closeDialog);
        this.setState({isDialogOpen: true});
    },
    openPromptDialog: function(prompt) {
        skulptgl.openDialog(null, prompt, this.closeDialog, null);
        this.setState({isDialogOpen: true});
    },
    openBinaryDialog: function(prompt, onOK) {
        skulptgl.openDialog(null, prompt, onOK, this.closeDialog);
        this.setState({isDialogOpen: true});
    },
    openWorkingDialog: function() {
        skulptgl.openDialog(null, "Working...", null, null);
        this.setState({isDialogOpen: true});
    },
    closeDialog: function() {
        skulptgl.closeDialog();
        this.setState({isDialogOpen: false});
    },
    onProjectNameOK: function(text) {
        var that = this;
        var success = function() {
            that.closeDialog();
            that.setState({name: text});
        };

        var failure = function() {
            that.openPromptDialog("Failed to change project name");
        };

        this.openWorkingDialog();

        var proj = {};
        proj[skulptgl.project.NAME] = text;
        skulptgl.writeProject(proj, success, failure);
    },
    onProjectNameClick: function() {
        this.openTextDialog(
            this.state.name, "New project name?", this.onProjectNameOK);
    },
    onFileNameOK: function(oldFile, newFile) {
        if (newFile === oldFile)
            return;

        this.openWorkingDialog();

        var oldFileExt = oldFile + ".py"
        var newFileExt = newFile + ".py"

        var that = this;

        var ofiles = skulptgl.util.deepCopy(this.state.srcFiles);
        var nfiles = ofiles.map(
            function(file) {
                return file==oldFileExt ? newFileExt : file;
            }
        );

        var successFile = function() {
            that.closeDialog();
            that.setState({srcFiles: nfiles});
        };

        var failureFile = function() {
            that.openPromptDialog("Failed to change file name");

            // roll back project change
            console.log("hope we never get here :(");
            var oproj = {};
            oproj[skulptgl.project.SRC] = ofiles;
            skulptgl.writeProject(oproj);
        };

        var successProj = function() {
            skulptgl.renameSrcFile(oldFileExt, newFileExt, successFile,
                failureFile);
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to change file name");
        };

        var proj = {};
        proj[skulptgl.project.SRC] = nfiles;
        skulptgl.writeProject(proj, successProj, failureProj);
    },
    onFileNameClick: function(oldFile) {
        var ind = skulptgl.util.indexOf(this.state.srcFiles, oldFile + ".py");

        if (this.state.defaultFileInd != ind) {
            this.changeCurrentFile(ind);
            return;
        }

        var that = this;
        var fnameOK = function(newFile) {
            that.onFileNameOK(oldFile, newFile);
        };
        this.openTextDialog(oldFile, "Change file name?", fnameOK);
    },
    onFileAddOK: function(fname) {
        var fnameExt = fname + ".py";
        var fileSrc = "# " + fnameExt;

        if (skulptgl.util.indexOf(this.state.srcFiles, fnameExt) >= 0) {
            this.openPromptDialog("File already exist");
            return;
        }

        this.openWorkingDialog();

        var that = this;
        var ofiles = this.state.srcFiles;
        var nfiles = skulptgl.util.deepCopy(ofiles);
        nfiles.push(fnameExt);

        var successFile = function() {
            that.closeDialog();
            that.state.srcs[fnameExt] = fileSrc;
            that.setState({
                srcFiles: nfiles,
                defaultFileInd: nfiles.length - 1
            });
        };

        var failureFile = function() {
            that.openPromptDialog("Failed to add file");

            // roll back project change
            console.log("hope we never get here :(");
            var oproj = {};
            oproj[skulptgl.project.SRC] = ofiles;
            skulptgl.writeProject(oproj);
        };

        var successProj = function() {
            skulptgl.writeSrcFile(
                fnameExt, fileSrc, successFile, failureFile);
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to add file");
        };

        var proj = {};
        proj[skulptgl.project.SRC] = nfiles;
        skulptgl.writeProject(proj, successProj, failureProj);
    },
    onFileAddClick: function() {
        this.openTextDialog("new", "New file?", this.onFileAddOK);
    },
    onFileDeleteOK: function(fname) {
        var fnameExt = fname + ".py";

        if (this.state.srcFiles.length < 2) {
            that.openPromptDialog(
                "Cannot delete " + fnameExt +
                    " since we need at least one source file.");
            return;
        }

        var ind = skulptgl.util.indexOf(this.state.srcFiles, fnameExt);
        if (ind < 0)
            return;

        this.openWorkingDialog();

        var that = this;
        var ofiles = this.state.srcFiles;
        var nfiles = skulptgl.util.deepCopy(ofiles);
        nfiles.splice(ind, 1);

        var successFile = function() {
            that.closeDialog();
            that.setState({
                srcFiles: nfiles,
                defaultFileInd: 0
            });
        };

        var failureFile = function() {
            that.openPromptDialog("Failed to delete file");

            // roll back project change
            console.log("hope we never get here :(");
            var oproj = {};
            oproj[skulptgl.project.SRC] = ofiles;
            skulptgl.writeProject(oproj);
        };

        var successProj = function() {
            skulptgl.deleteSrcFile(fnameExt, successFile, failureFile);
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to change file name");
        };

        var proj = {};
        proj[skulptgl.project.SRC] = nfiles;
        skulptgl.writeProject(proj, successProj, failureProj);
    },
    onFileDeleteClick: function(fname) {
        var that = this;
        var del = function() { that.onFileDeleteOK(fname); };
        this.openBinaryDialog(
            "Are you sure you'd like to delete " + (fname + ".py") + "?", del);
    },
    onFileIndClick: function(origin, target) {
        if (target < 0 || target >= this.state.srcFiles.length)
            return;

        this.openWorkingDialog();

        var that = this;
        var ofiles = this.state.srcFiles;
        var nfiles = skulptgl.util.deepCopy(ofiles);

        var tmp = nfiles[origin];
        nfiles[origin] = nfiles[target];
        nfiles[target] = tmp;

        var successProj = function() {
            that.closeDialog();
            that.setState({
                srcFiles: nfiles,
                defaultFileInd: target
            });
        };

        var failureProj = function() {
            that.openPromptDialog("Failed to change file order");
        };

        var proj = {};
        proj[skulptgl.project.SRC] = nfiles;
        skulptgl.writeProject(proj, successProj, failureProj);
    },
    onLoadProject: function(text) {
        var project = JSON.parse(text);
        this.setState({
            name: project[skulptgl.project.NAME],
            srcFiles: project[skulptgl.project.SRC],
            defaultFileInd: project[skulptgl.project.DEFAULT_FILE]
        });
    },
    onLoadSource: function(file, text) {
        console.log("source loaded " + file);
        var srcs = this.state.srcs;
        srcs[file] = text;
        this.setState({srcs: srcs});
    },
    runProg: function() {
        // If files are missing, do not run program.
        for (var i = 0; i < this.state.srcFiles.length; i++) {
            var file = this.state.srcFiles[i];
            if (!this.state.srcs[file])
                return;
        }

        var that = this;
        var prog = this.state.srcFiles
            .map(function(file) {return that.state.srcs[file];})
            .join("\n");

        var output = function(s) { if (s.trim().length > 0) console.log("python> " + s); };
        var builtinRead = function(x) {
            if (Sk.builtinFiles === undefined ||
                Sk.builtinFiles["files"][x] === undefined) {
                throw "File not found: '" + x + "'";
            }
            return Sk.builtinFiles["files"][x];
        };

        Sk.canvas = this.state.canvasId;
        Sk.configure({
            "output": output,
            "debugout": output,
            "read": builtinRead
        });
        try {
            eval(Sk.importMainWithBody("<stdin>", false, prog));
        } catch(e) {
            console.log("python[ERROR]> " + e.toString());
//            if (e.toSource)
//                console.log(e.toSource());
        }
    },
    onRun: function(code) {
        if (this.state.defaultFileInd < 0 ||
            this.state.defaultFileInd >= this.state.srcFiles.length) {
            return;
        }

        this.onSave(code, true);
        this.runProg();
    },
    onSave: function(code, dontForward) {
        if (this.state.defaultFileInd < 0 ||
            this.state.defaultFileInd >= this.state.srcFiles.length) {
            return;
        }

        var fname = this.state.srcFiles[this.state.defaultFileInd];
        this.state.srcs[fname] = code;

        var success = function() {console.log("Successfully wrote " + fname);};
        var fail = function() {console.log("Failed to write " + fname);};

        if (!dontForward)
            skulptgl.writeSrcFile(fname, code, success, fail);
    },
    changeCurrentFile: function(ind) {
        if (ind < 0 || ind >= this.state.srcFiles.length)
            return;

        if (this.refs.editor) {
            this.onSave(this.refs.editor.getContent());
            this.setState({
                defaultFileInd: ind
            });
        }
    },
    componentDidUpdate: function(prevProps, prevState) {
        var that = this;
        if (prevState.srcFiles != this.state.srcFiles) {
            var toRead = [];
            for (var i = 0; i < this.state.srcFiles.length; i++) {
                var file = this.state.srcFiles[i];
                if (!this.state.srcs[file])
                    toRead.push(file);
            }
            var f = function(aRead) {
                if (toRead.length == 0) {
                    // Try running after the sources have been loaded.
                    that.runProg();
                    return;
                }
                var read = aRead[0];
                aRead.splice(0, 1);
                var g = function(text) {
                    if (!text) {
                        console.log("reading " + read + " failed");
                        return;
                    }
                    that.onLoadSource(read, text);
                    f(aRead);
                };
                skulptgl.readSrcFile(read, g, g);
            }

            f(toRead);
        }
    },
    componentDidMount: function() {
        skulptgl.readProject(this.onLoadProject);
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleResize);
        this.handleResize();

        var that = this;

        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };
        for (var i = 0; i < 10; i++) {
            (function() {
                var j = i;
                var key = 'Alt+' + (j + 1);
                shortcut.add(
                    key, function() { that.changeCurrentFile(j); },
                    keyMapParams);
            })();
        }
    },
    componentWillUnmount: function() {
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);

        for (var i = 0; i < 10; i++)
            shortcut.remove('Alt+' + (i + 1));
    },
    render: function() {
        var that = this;
        var fileButtons = this.state.srcFiles.map(
            function(fileExt, order) {
                var file = fileExt.substring(0, fileExt.indexOf('.'));
                var click = function() {
                    that.onFileNameClick(file);
                };
                var buttonClassName = "button";
                if (order == that.state.defaultFileInd)
                    buttonClassName += "-selected";
                return (
                    <div key={order} className={buttonClassName}
                        onClick={click} >
                        <span>{fileExt}</span>
                        <span className="file-order">{order + 1}</span>
                    </div>
                );
            }
        );
        fileButtons.push((function() { return (
            <img src="/img/add186.png"  onClick={that.onFileAddClick}
                className="options-button" />
        );})());


        var srcFile = this.state.srcFiles[this.state.defaultFileInd];
        var src = null;
        if (srcFile)
            src = this.state.srcs[srcFile];

        var srcFileOnly = srcFile ? srcFile.substring(0, srcFile.indexOf('.')) : '';
        var optButtons = [];
        var fileInd = this.state.defaultFileInd;
        var delfunc = function() { that.onFileDeleteClick(srcFileOnly); };
        var decfunc = function() { that.onFileIndClick(fileInd, fileInd - 1); };
        var incfunc = function() { that.onFileIndClick(fileInd, fileInd + 1); };

        optButtons.push((function() { return (
            <img src="/img/go10.png" onClick={decfunc}
                className="options-button" />
        );})());

        optButtons.push((function() { return (
            <img src="/img/right244.png" onClick={incfunc}
                className="options-button" />
        );})());

        optButtons.push((function() { return (
            <img src="/img/close47.png" onClick={delfunc}
                className="options-button" />
        );})());

        return (
            <div className="main-panel">
                <div className="project-name-holder">
                    <span className="project-name"
                        onClick={this.onProjectNameClick}>
                        {this.state.name}
                    </span>
                </div>
                <div className="bottom-panel">
                    <div ref="contextWrapper" className="canvas-wrapper">
                        <canvas className="unselectable" ref="context"
                            id={this.state.canvasId}></canvas>
                    </div>
                    <div>
                        <div className="button-row">
                            <span className="file-row">{fileButtons}</span>
                            <span>{optButtons}</span>
                        </div>
                        <SourceEditor ref="editor" src={src} onRun={this.onRun}
                            onSave={this.onSave}
                            isDialogOpen={this.state.isDialogOpen} />
                    </div>
                </div>
            </div>
        );
    }
});

var SourceEditor = React.createClass({
    cdm: null,
    getContent: function() {
        if (!this.cdm)
            return null;
        return this.cdm.getValue();
    },
    onScrollTo: function() {
        if (!this.cdm)
            return;
        var cursorPos = (this.cdm.cursorCoords().top +
                         this.cdm.cursorCoords().bottom) / 2;
        var winHeight = window.innerHeight;
        window.scrollTo(0, cursorPos - (winHeight / 2));
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevProps.src != this.props.src && this.props.src) {
            var code = this.props.src;
            if (!this.cdm) {
                this.refs.textarea.getDOMNode().value = code;
                this.cdm = CodeMirror.fromTextArea(
                    this.refs.textarea.getDOMNode(),
                    {
                        lineNumbers: true,
                        lineWrapping: true,
                        mode: "python",
                        keyMap: "emacs",
                        autoCloseBrackets: true,
                        matchBrackets: true,
                        showCursorWhenSelecting: true,
                        theme: "monokai"
                    }
                );
                this.cdm.setSize(650, null);
            } else {
                this.cdm.setValue(code);
            }
        }
    },
    componentDidMount: function() {
        var keyMapParams = {
            type: 'keydown',
            propagate: false,
            target: document
        };
        var that = this;

        if (this.props.onRun) {
            var run = function() {
                if (that.cdm)
                    that.props.onRun(that.cdm.getValue());
            };
            shortcut.add('Ctrl+B', run, keyMapParams);
        }

        if (this.props.onSave) {
            var save = function() {
                if (that.cdm)
                    that.props.onSave(that.cdm.getValue());
            };
            shortcut.add('Ctrl+S', save, keyMapParams);
        }
        // Technically this should be in codemirror's emacs keymap, but putting
        // this here for now.
        shortcut.add('Ctrl+L', this.onScrollTo, keyMapParams);
    },
    componentWillUnmount: function() {
        shortcut.remove('Ctrl+B');
        shortcut.remove('Ctrl+S');
        shortcut.remove('Ctrl+L');
    },
    render: function() {
        return (
            <div className="editor">
                <div className=
                    {this.props.isDialogOpen ? "codearea-hidden" : "codearea"} >
                    <textarea ref="textarea" cols="79" rows="30"></textarea>
                </div>
            </div>
        );
    }
});
