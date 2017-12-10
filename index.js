let nodePath = require("path"),
    vinylFs = require("vinyl-fs"),
    through = require("through2"),
    PｕginError = require("gulp-util").PluginError;

const PLUGIN_NAME = "gulp-css-assets";
// 匹配 css 文件中的 url 中的值
const URL_REG = /url\s*\(\s*(['"]?)(.*?)\1\s*\)/g;
// 获取路径中除相对路径以外的值，即 ../../img/hello.png => /img/hello.png
const RELATIVE_REG = /(\/\w.*)/;

/**
 * 判断一个路径是否为 css 文件
 * @param {string} path 
 */
function isCssFile(path) {
    return nodePath.extname(path).toLowerCase() === ".css";
}

/**
 * 获取一个路径对应的 basename
 * /hello/world/img.png => img.png
 * @param {string} path 
 */
function getBaseName(path) {
    return nodePath.basename(path);
}

/**
 * 判断是否应该处理一个文件
 * 依据是
 *     1. 是 css 文件
 *     2. options 中有对应的配置
 * @param {object} file 
 * @param {object} options 
 */
function shouldProcessFile(file, options) {
    let relativePath = file.relative;

    return isCssFile(relativePath) && options[getBaseName(relativePath)];
}

/**
 * 获取配置中文件资源所存放的目录
 * @param {object} file 
 * @param {object} options 
 */
function getAssetFolder(file, options) {
    let relativePath = file.relative;

    return options[getBaseName(relativePath)];
}

/**
 * 获取路径中除相对路径外的部分
 * 即 ../../hello/world/img.png => /hello/world.png
 * @param {string} relativePath 
 */
function getRelativePathSuffix(relativePath) {
    return relativePath.match(RELATIVE_REG)[1];
}

/**
 * 获取路径中除文件名以外的部分
 * @param {string} filePath 
 */
function getFileFolderPath(filePath) {
    return nodePath.dirname(filePath);
}

/**
 * 构建保存资源以及 css 中 url 引用的路径
 * 取值为： 配置的目录名 ＋ 除相对路径以外的路径
 * 用以替换 css 中的 url 的路径以及保存到磁盘的路径
 * @param {string} assetPath 
 * @param {string} folder 
 */
function buildAssetUrlPath(assetPath, folder) {
    let pathSuffix = getRelativePathSuffix(assetPath);

    return nodePath.join(".", folder, pathSuffix);
}

/**
 * 移除 url 中的后缀
 * 目前只是看到 bootstrap 中的资源会跟有 ? 和 #，不清楚其它路径
 * @todo 完善清除方式
 * @param {string} assetPath 
 */
function cleanAssetPath(assetPath) {
    return assetPath.split(/[?#]+/)[0];
}

/**
 * 处理一个 css 文件
 * 处理过程
 *    1. 查找 css 中 url 引用的资源，将 css 中引用的资源路径替换成其它路径
 *    2. 将 css 中引用的资源写入流中
 * @todo 目前不支持 css 中使用 @import,后续添加支持
 * @param {object} file - 需要处理的 vinyl 对象 
 * @param {object} options - 用户的配置属性
 * @param {function} callback - 处理完成的回调函数
 */
function processCssFile(file, options, callback) {
    let contents = file.contents.toString(),
        assetFolder = getAssetFolder(file, options),
        results = null,
        self = this,
        fileAssetsPath = [],
        assetPathMap = {};
    
    // 对文件内容进行替换，并保存资源的实际路径和替换路径之前的映射以便在后续中修改资源的路径
    results = contents.replace(URL_REG, function (match, splitChar, assetPath) {
        let absolutePath = nodePath.join(getFileFolderPath(file.path), assetPath),
            cleanPath = cleanAssetPath(absolutePath),
            assetUrl = buildAssetUrlPath(assetPath, assetFolder);

        fileAssetsPath.push(cleanPath);
        assetPathMap[cleanPath] = cleanAssetPath(assetUrl);

        return `url(./${assetUrl})`;
    });

    // 重写文件的内容以及路径
    file.contents = new Buffer(results);
    file.base = file.cwd;
    file.path = nodePath.join(file.cwd, getBaseName(file.path));

    // 如果文件中引用有资源，则添加到流中，没有则直接跳过
    if (fileAssetsPath.length > 0) {
        vinylFs.src(fileAssetsPath, {base: file.cwd}).
        pipe(through.obj(function (assetFile, end, assetCallback) {
            assetFile.path = nodePath.join(assetFile.base, assetPathMap[assetFile.path]);
            self.push(assetFile);

            assetCallback();
        })).on("finish", function () {
            self.push(file);  
            callback();
        });
    } else {
        this.push(file);
        callback();

    }

}

function gulpCssAssets(options) {
    let stream = through.obj(function (file, enc, callback) {
        if (file.contents === null) {
            this.push(file);
            return callback();
        }

        if (file.isStream()) {
            this.emit("error", new PluginError(PLUGIN_NAME, "Streams not support!"));
            return callback();
        }

        if (shouldProcessFile(file, options)) {
            processCssFile.call(this, file, options, callback);
        } else {
            this.push(file);
            callback();
        }
    });

    return stream;
}

module.exports = gulpCssAssets;