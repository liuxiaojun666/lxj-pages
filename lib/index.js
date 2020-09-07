const { src, dest, parallel, series, watch } = require('gulp')
const plugins = require('gulp-load-plugins')()
const del = require('del')
const bs = require('browser-sync').create()
const path = require('path')

let config = {}

try {
    // const loadConfig = require(path.join(process.cwd(), 'pages.config.js'))
    const loadConfig = require(process.cwd() + '/pages.config.js')
    config = Object.assign({}, config, loadConfig)
} catch (error) {
    
}


const clean = () => del([config.build.dist, config.build.temp])

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const script = () => {
    return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const imgAndFont = () => {
  return src([config.build.paths.images, config.build.paths.fonts], { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const serve = () => {
  watch([config.build.paths.styles], { cwd: config.build.src }, style)
  watch([config.build.paths.scripts], { cwd: config.build.src }, script)
  watch([config.build.paths.pages], { cwd: config.build.src }, page)
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], { cwd: config.build.src }, bs.reload)
  watch(['**'], { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false,
    port: '8888',
    // open: false,
    // files: 'dist/**',
    server: {
      baseDir: [config.build.temp, config.build.dist, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src('*.html', { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page)
const build = series(
  clean,
  parallel(
    series(compile, useref),
    extra,
    imgAndFont
  )
)
const develop = series(compile, serve)

module.exports = {
  build,
  clean,
  develop
}

