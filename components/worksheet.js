var OutputConsole =  React.createClass({
    getInitialState: function() {
        return {
            hidden: true,
        };
    },
    toggleConsole: function() {
        this.setState({hidden: !this.state.hidden});
    },
    write: function(s) {
        var textarea = this.refs.tarea.getDOMNode();
        textarea.value += (s + '\n');
        textarea.scrollTop = textarea.scrollHeight;
    },
    render: function() {
        var outputClassName = "output-console";
        var verticalButtonClassName = "vertical-button";
        var buttonImg = "/img/keyboard54.png";

        if (this.state.hidden) {
            outputClassName += " output-console-hide";
            buttonImg = "/img/sort52.png";
            verticalButtonClassName += " vertical-button-hide";
        }
        return (
            <div className={outputClassName}>
                <textarea ref="tarea" readOnly></textarea>
                <img src={buttonImg}
                     className={verticalButtonClassName}
                     onClick={this.toggleConsole} />
            </div>
        )
    }
});

var HeaderBar = React.createClass({
    mixins: [DialogMixins(function(v) {
        if (this.props.main) {
            this.props.main.setState({isDialogOpen: v});
        }
    })],
    getInitialState: function() {
        return {};
    },
    onProjectNameOK: function(text) {
        var that = this;
        var success = function() {
            that.closeDialog();
            if (that.props.main)
                that.props.main.changeProjectName(text);
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
            this.props.projectName, "New project name?", this.onProjectNameOK);
    },
    render: function(){
        return (
            <div className="project-name-holder">
                <span className="project-name"
                    onClick={this.onProjectNameClick}>
                    {this.props.projectName}
                </span>
                <Button icon="tack" />
            </div>
        );
    }
});

var MainPanel = React.createClass({
    mixins: [DialogMixins(function(v) {
        console.log(v);
        this.setState({isDialogOpen: v})
    })],
    getInitialState: function() {
        return {
            name: '',
            srcs: {},
            srcFiles: [],
            defaultFileInd: -1,
            isDialogOpen: false,
            panelDoms: null,
            consoleOutput: ''
        };
    },
    handleScroll: function() {
        this.refs.contextWrapper.getDOMNode().style.marginTop =
            window.pageYOffset + 'px';
    },
    handleResize: function() {
        var width = Math.min(
            this.refs.contextWrapper.getDOMNode().offsetWidth - 30,
            window.innerHeight - 150
        );

        var panelDoms = this.state.panelDoms;
        if (panelDoms) {
            panelDoms.forEach(function(dom) {
                dom.style.width = width + 'px';
                dom.style.height = width + 'px';
                dom.width = width;
                dom.height = width;
            });
        }
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
        var progs = this.state.srcFiles.map(function(file) {
            return {name: file, body: that.state.srcs[file]};
        });

        var output = function(s) {
            if (s.trim().length > 0) {
                that.refs.outputConsole.write(s);
            };
        }
        var builtinRead = function(x) {
            if (Sk.builtinFiles === undefined ||
                Sk.builtinFiles["files"][x] === undefined) {
                throw "File not found: '" + x + "'";
            }
            return Sk.builtinFiles["files"][x];
        };

        Sk.configure({
            "output": output,
            "debugout": output,
            "read": builtinRead
        });
        try {
            Sk.importMainWithMultipleFiles(false, progs);

            var wrapper = this.refs.contextWrapper.getDOMNode();
            while(wrapper.hasChildNodes()) {
                wrapper.removeChild(wrapper.firstChild);
            }
            Sk.progdomIds().forEach(function(elem) { wrapper.appendChild(elem.dom); });

            var ndoms = Sk.progdomIds().map(function(elem) { return elem.dom; });
            this.setState({panelDoms: ndoms});
        } catch(e) {
            console.log("python[ERROR]> " + e.toString());
        }
    },
    onRun: function(code) {
        if (this.state.defaultFileInd < 0 ||
            this.state.defaultFileInd >= this.state.srcFiles.length) {
            return;
        }

        var fname = this.state.srcFiles[this.state.defaultFileInd];
        this.memSave(fname, code);
        this.runProg();
    },
    memSave: function(fname, code) {
        if (!fname)
            return;

        this.state.srcs[fname] = code;
    },
    onSave: function(fname, code, onSuccess, onFail) {
        if (!fname)
            return;

        this.memSave(fname, code);

        var success = function() {
            console.log("Successfully wrote " + fname);
            if (onSuccess)
                onSuccess();
        };
        var fail = function() {
            console.log("Failed to write " + fname);
            if (onFail)
                onFail();
        };
        skulptgl.writeSrcFile(fname, code, success, fail);
    },
    changeCurrentFile: function(ind) {
        if (ind < 0 || ind >= this.state.srcFiles.length)
            return;

        if (this.refs.editor) {
            var oldFile = this.state.srcFiles[this.state.defaultFileInd];
            this.memSave(oldFile, this.refs.editor.getContent());
            this.setState({
                defaultFileInd: ind
            });
        }
    },
    changeProjectName: function(name) {
        this.setState({name: name});
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
        this.handleResize();
    },
    componentDidMount: function() {
        skulptgl.readProject(this.onLoadProject);
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    },
    componentWillUnmount: function() {
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
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

        var save = function(code) {
            var fname = that.state.srcFiles[that.state.defaultFileInd];
            that.onSave(fname, code);
        };

        return (
           <div className="main-panel">
                <HeaderBar main={this} projectName={this.state.name} />
                <OutputConsole ref="outputConsole" />
                <div className="bottom-panel">
                    <div ref="contextWrapper" className="context-wrapper">
                    </div>
                    <div>
                        <div className="button-row">
                            <span className="file-row">{fileButtons}</span>
                            <span className="option-row">{optButtons}</span>
                        </div>
                        <SourceEditor ref="editor" src={src} onRun={this.onRun}
                            onSave={save}
                            isDialogOpen={this.state.isDialogOpen} />
                    </div>
                </div>
            </div>
        );
    }
});
