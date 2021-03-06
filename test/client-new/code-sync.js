describe("Code Sync", function() {
    var codeSync;
    var bs;
    var socketSpy;

    before(function () {
        bs        = window.__bs_stub__;
        codeSync  = window.__bs_code_sync__;
        socketSpy = sinon.spy(bs.socket, "on");
    });
    after(function () {
        socketSpy.restore();
    });

    it("should register a listener on the socket", function () {
        var reloadStub = sinon.stub(codeSync, "reload").returns("reloadFunc");

        codeSync.init(bs);
        sinon.assert.calledWithExactly(socketSpy, "file:reload", "reloadFunc");

        var secondCall = socketSpy.getCall(1).args;
        assert.equal(secondCall[0], "browser:reload");

        reloadStub.restore();
    });

    describe("reload()", function () {

        var dataStub;
        var reloadStub;
        before(function () {
            dataStub = {
                assetFileName: "style.css",
                fileExtension: "css"
            };
            reloadStub = sinon.stub(codeSync, "reloadBrowser").returns(true);
        });
        after(function () {
            reloadStub.restore();
        });
        it("can call reload", function() {
            var matches = [
                { attr: "href", id: "match1", href: "http://localhst.com/css/styles.css?rel=123"}
            ];

            var elemsStub  = sinon.stub(codeSync, "getElems").returns({elems: matches, attr: "href"});
            var matchesStub = sinon.stub(codeSync, "getMatches").returns(matches);

            var reload = codeSync.reload(bs);
            var actual = reload(dataStub);
            assert.equal(actual.elem.id, "match1");
            matchesStub.restore();
            elemsStub.restore();
        });
    });
    describe("reloading the browser", function(){
        var spy;
        var stub;
        beforeEach(function () {
            spy = sinon.spy();
            stub = sinon.stub(codeSync, "getWindow").returns({
                location: {
                    reload: spy
                }
            });
        });
        it("can reload the browser", function () {
            codeSync.reloadBrowser(true);
            sinon.assert.called(stub);
            sinon.assert.called(spy);
            stub.restore();
        });
        it("can reload the browser", function () {
            codeSync.reloadBrowser(false);
            sinon.assert.notCalled(spy);
            stub.restore();
        });
    });
    it("getTagName(): 1", function () {
        var actual   = codeSync.getTagName("css");
        var expected = "link";
        assert.equal(actual, expected);
    });
    it("getTagName(): 2", function () {
        var actual   = codeSync.getTagName("jpg");
        var expected = "img";
        assert.equal(actual, expected);
    });
    it("getAttr(): 1", function () {
        var actual   = codeSync.getAttr("link");
        var expected = "href";
        assert.equal(actual, expected);
    });
    it("getAttr(): 2", function () {
        var actual   = codeSync.getAttr("img");
        var expected = "src";
        assert.equal(actual, expected);
    });
    it("can retrieve the window object", function () {
        var actual = codeSync.getWindow();
        assert.equal(typeof actual, "object");
    });

    describe("matching elements", function () {

        var stubs = [
            {
                id: "stub1",
                href: "http://localhost:8080/style.css"
            },
            {
                id: "stub2",
                href: "http://localhost:8080/style-with-rel.css?rel=213456"
            },
            {
                id: "stub3",
                href: "http://localhost:8080/stee/erqq/qefrerf/erferf/style-with-paths.css"
            }
        ];

        it("can return element matches: 1", function() {
            var matches  = codeSync.getMatches(stubs, "style.css", "href");
            var actual   = matches[0];
            var expected = "stub1";
            assert.equal(actual.id, expected);
            assert.equal(matches.length, 1);
        });
        it("can return element matches: 2", function() {
            var matches  = codeSync.getMatches(stubs, "style-with-rel.css", "href");
            var actual   = matches[0];
            var expected = "stub2";
            assert.equal(actual.id, expected);
            assert.equal(matches.length, 1);
        });
        it("can return element matches: 3", function() {
            var matches  = codeSync.getMatches(stubs, "style-with-paths.css", "href");
            var actual   = matches[0];
            var expected = "stub3";
            assert.equal(actual.id, expected);
            assert.equal(matches.length, 1);
        });
        it("can return Multiple element matches: 1", function() {
            stubs.push({
                id: "stub4",
                href: "http://localhost:8080/style.css"
            });
            var matches  = codeSync.getMatches(stubs, "style.css", "href");
            assert.equal(matches[0].id, "stub1");
            assert.equal(matches[1].id, "stub4");
            assert.equal(matches.length, 2);
        });
    });
    describe("Getting elements", function(){
        it("should return elements + attr", function(){
            var elemStub = sinon.stub(document, "getElementsByTagName").returns([
                {
                    id: "stub1",
                    href: "http://localhost:8080/style.css"
                }
            ]);
            var actual = codeSync.getElems("css");
            assert.equal(actual.elems[0].id, "stub1");
            assert.equal(actual.attr, "href");
            elemStub.restore();
        });
        it("should handle filenames with regexes", function () {
            var input    = "http://localhost:8080/style.css?rel=123343";
            var expected = "http://localhost:8080/style.css";
            var actual   = codeSync.getFilenameOnly(input);
            assert.equal(actual[0], expected);
        });
        it.skip("should handle filenames with regexes with multiple ?", function () {
            var input    = "http://localhost.com/??/style.css";
            var expected = "http://localhost:8080/style.css";
            var actual   = codeSync.getFilenameOnly(input);
            assert.equal(actual[0], expected);
        });
    });
});