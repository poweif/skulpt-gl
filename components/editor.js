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
