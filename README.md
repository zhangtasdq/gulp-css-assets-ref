gulp-css-assets-ref
===
> 用于在使用 `gulp` 打包 `css` 的时候, `css` 中引用的图片、字体等无法同时打包的问题.
> 主要是将打包的 `css` 文件中引用到的图片和字体文件提取后一起输出到 `gulp.dest` 中，同时
> 会修改 `css` 文件中的 `url` 以指向打包后的路径

使用方法
---

### 示例
#### gulpfile.js
```js
let cssRef = require("gulp-css-assets-ref");

gulp.task("example", () => {
    return gulp.src("./css/**/*.css").
                pipe(cssAssets({
                    "arch.css": "arch",
                    "base.css": "base",
                    "bootstrap.css": "bootstrap"
                })).
                pipe(gulp.dest("./dist"));
});

```
##### 说明
> 这个任务是将 `css` 目录下的 `arch.css` 文件引用的资源放到 `dist/arch` 中，`base.css` 文件引用的资源放到 `/dist/base` 目录下，
>`bootstrap.css` 中引用的资源放到 `./dist/bootstrap` 目录下。目录名由上述参数进行配置

#### arch.css
#### 生成前
``` css
.close {
    color: #fff;
    background-image: url( "../imgs/icon_book.png" );
}
```
#### 生成后
``` css
.close {
    color: #fff;
    background-image: url( ".／arch/imgs/icon_book.png" );
}
```

#### base.css
#### 生成前
```css
.bg {
    background-image: url("../imgs/login_close.png");
}
```
#### 生成后
```css
.bg {
    background-image: url("./base/imgs/login_close.png");
}
```

#### 目录结构
```
├── gulp-css-assets-ref-example/
├    ├── dist/(构建过后生成此目录)
|-   |-    |── arch.css
|-   |-    |── arch/
|-   |-    |-   |── imgs/
|-   |-    |-   |-    |── icon_book.png
|-   |-    |── base.css
|-   |-    |── base/
|-   |-    |-   |── imgs/
|-   |-    |-   |-    |── icon_close.png
|-   |-    |── bootstrap.css
|-   |-    |── bootstrap/
|-   |-    |-   |── fonts/
|-   |-    |-   |-    |── glyphicons-halflings-regular.svg ....glyphicons-halflings-regular
├    ├── css/
├    ├    ├── bootstrap/ 
├    ├    ├    ├── css/
├    ├    ├    ├── fonts/
├    ├    ├    ├── js/ 
├    ├    ├── arch.css
├    ├    ├── base.css
├    ├── imgs
|-   |-   |── icon_book.png
|-   |-   |── icon_close.png
├    ├── gulpfile.js （gulp文件）
```
#####


### 实际使用
> 因此插件会将图片、字体等资源写入 `gulp`处理过程中，因些会对合并压缩 `css` 产生影响，
> 所以需要在合并压缩时进行判断,使用 `gulp-if` 插件，如下所示

```js
function isCssFile(file) {
    return file.path.indexOf(".css") !== -1;
}
gulp.task("example", () => {
    return gulp.src("./css/**/*.css").
                pipe(cssAssets({
                    "arch.css": "arch",
                    "base.css": "base",
                    "bootstrap.css": "bootstrap"
                })).
                pipe(gulpIf(isCssFile, concat("all.css"))).
                pipe(gulpIf(isCssFile, cssClean())).
                pipe(gulp.dest("./dist"));
});
```