let expect = require("chai").expect,
    fs = require("fs"),
    rimraf = require("rimraf"),
    vinylFs = require("vinyl-fs"),
    cssRef = require("../index");

const DEST_FOLDER = "./test/dist";
const SOURCE_FOLDER = "./test/test-sources";

let sourceDistPath = {
    baseCss: `${DEST_FOLDER}/base.css`,
    baseImg: `${DEST_FOLDER}/base/imgs/base-bg.png`,
    baseCssUrl: "./base/imgs/base-bg.png",
    deepCss: `${DEST_FOLDER}/deep.css`,
    deepCssUrl: "./deep/imgs/deep-bg.png",
    deepImg: `${DEST_FOLDER}/deep/imgs/deep-bg.png`,
    deepFonts: [
        `${DEST_FOLDER}/deep/fonts/test-font.eot`,
        `${DEST_FOLDER}/deep/fonts/test-font.svg`,        
    ],
    deepFontsUrl: [
        "./deep/fonts/test-font.eot",
        "./deep/fonts/test-font.eot?#iefix",
        "./deep/fonts/test-font.svg#glyphicons_halflingsregular"
    ],
    ignoreCss: `${DEST_FOLDER}/ignore.css`,
    ignoreImg: `${DEST_FOLDER}/ignore/imgs/ignore-bg.png`,
    ignoreCssUrl: "../imgs/ignore-bg.png",
    ignoreProcessUrl: "./ignore/imgs/ignore-bg.png"
}

function isArray(val) {
    return Object.prototype.toString.call(val) === "[object Array]";
}

function fileContain(path, str) {
    let contents = fs.readFileSync(path);

    if (isArray(str)) {
        return str.every((item) => contents.indexOf(item) !== -1);
    } else {
        return contents.indexOf(str) !== -1;    
    }

}

describe("gulp-css-assets-ref", () => {
    afterEach((done) => {
        rimraf(DEST_FOLDER, done);
    });

    it("should through not support stream", (done) => {
        vinylFs.src(`${SOURCE_FOLDER}/css/**/*.css`, {buffer: false}).
                pipe(cssRef({"base.css": "base"})).
                on("error", (error) => {
                    expect(error.message).to.equal("stream not support!");
                    done();
                });
    });

    it("should copy assets", (done) => {
        vinylFs.src(`${SOURCE_FOLDER}/css/**/*.css`).
                pipe(cssRef({
                    "base.css": "base",
                    "deep.css": "deep"
                })).
                pipe(vinylFs.dest(DEST_FOLDER)).
                on("finish", () => {
                    // base.css
                    expect(fs.existsSync(sourceDistPath.baseCss)).to.equal(true);
                    expect(fs.existsSync(sourceDistPath.baseImg)).to.equal(true);
                    expect(fileContain(sourceDistPath.baseCss, sourceDistPath.baseCssUrl)).to.equal(true);
                    // deep.css
                    expect(fs.existsSync(sourceDistPath.deepCss)).to.equal(true);                    
                    expect(fs.existsSync(sourceDistPath.deepImg)).to.equal(true);
                    sourceDistPath.deepFonts.forEach((item) => {
                        expect(fs.existsSync(item)).to.equal(true);
                    });
                    expect(fileContain(sourceDistPath.deepCss, sourceDistPath.deepCssUrl)).to.equal(true);
                    expect(fileContain(sourceDistPath.deepCss, sourceDistPath.deepFontsUrl)).to.equal(true);                    
                    // ignore.css
                    expect(fs.existsSync(sourceDistPath.ignoreCss)).to.equal(true);
                    expect(fs.existsSync(sourceDistPath.ignoreImg)).to.equal(false);                    
                    expect(fileContain(sourceDistPath.ignoreCss, sourceDistPath.ignoreCssUrl)).to.equal(true);

                    done();
                });
    });

    it("should copy all assets", (done) => {
        vinylFs.src(`${SOURCE_FOLDER}/css/**/*.css`).
                pipe(cssRef({
                    processAllFile: true
                })).
                pipe(vinylFs.dest(DEST_FOLDER)).
                on("finish", () => {
                    // base.css
                    expect(fs.existsSync(sourceDistPath.baseCss)).to.equal(true);
                    expect(fs.existsSync(sourceDistPath.baseImg)).to.equal(true);
                    expect(fileContain(sourceDistPath.baseCss, sourceDistPath.baseCssUrl)).to.equal(true);
                    // deep.css
                    expect(fs.existsSync(sourceDistPath.deepCss)).to.equal(true);                    
                    expect(fs.existsSync(sourceDistPath.deepImg)).to.equal(true);
                    sourceDistPath.deepFonts.forEach((item) => {
                        expect(fs.existsSync(item)).to.equal(true);
                    });
                    expect(fileContain(sourceDistPath.deepCss, sourceDistPath.deepCssUrl)).to.equal(true);
                    expect(fileContain(sourceDistPath.deepCss, sourceDistPath.deepFontsUrl)).to.equal(true);                    
                    // ignore.css
                    expect(fs.existsSync(sourceDistPath.ignoreCss)).to.equal(true);
                    expect(fs.existsSync(sourceDistPath.ignoreImg)).to.equal(true);                    
                    expect(fileContain(sourceDistPath.ignoreCss, sourceDistPath.ignoreProcessUrl)).to.equal(true);

                    done();
                });
    });
});