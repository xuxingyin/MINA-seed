const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const path = require('path');
const yargs = require('yargs');
const { isRegExp, isNumber, spawnDefer } = require('./utilities');

let argv = yargs
  .option('a', {
    alias: 'add',
    describe: 'add a new page',
    type: 'string',
  })
  .option('e', {
    alias: 'eslintFix',
    describe: 'gulp eslintFix',
    type: 'boolean',
  })
  .help('help')
  .argv;

const gulpfilePath = path.join(__dirname, '../gulpfile.js');
const eslintFixCmd = {
  cmd: 'gulp',
  arg: ['--gulpfile', gulpfilePath, 'eslintFix'],
};

const args = argv._;

if (argv.add || argv.a || checkArgs(2, 'add', args[1])) {
  addPage(argv.a || args[1]);
}
else if (argv.eslintFix || argv.e || checkArgs(1, 'eslintFix')) {
  spawnDefer(eslintFixCmd);
}
else {
  yargs.showHelp();
}


function getPagePath(name) {
  const directoryPath = path.join(__dirname, `../pages/${name}`);
  const wxmlPath = path.join(__dirname, `../pages/${name}/${name}.wxml`);
  const jsPath = path.join(__dirname, `../pages/${name}/${name}.js`);
  const scssPath = path.join(__dirname, `../scss/${name}.scss`);
  const pagePath = `pages/${name}/${name}`;

  return {
    directoryPath,
    wxmlPath,
    jsPath,
    scssPath,
    pagePath,
  };
}

function checkNotExists(filePath) {
  return fs.accessAsync(filePath)
    .then(() =>
       Promise.reject(new Error(`${filePath} exists`))
    , () => true);
}

function addPageToAppJson(directoryPath) {
  const appJsonPath = path.resolve(__dirname, '../app.json');
  fs.readJsonAsync(appJsonPath)
    .then((obj) => {
      obj.pages = obj.pages || [];
      obj.pages.push(directoryPath);

      return fs.writeJsonAsync(appJsonPath, obj);
    });
}

function createFileIfNotExists(name) {
  const { directoryPath, wxmlPath, jsPath, pagePath, scssPath } = getPagePath(name);

  return Promise
    .props({
      directory: checkNotExists(directoryPath),
      scss: checkNotExists(scssPath),
    })
    .then(() =>
       Promise.props({
         wxml: fs.ensureFileAsync(wxmlPath),
         js: fs.ensureFileAsync(jsPath),
         scss: fs.ensureFileAsync(scssPath),
         addPageToAppJson: addPageToAppJson(pagePath),
       })
    );
}

function addPage(name) {
  return createFileIfNotExists(name)
    .then(() => {
      console.info('create success');
    })
    .catch(e => console.warn(e));
}

function checkArgs(len, firstStr, returnValue = true) {
  if (args.length !== len) {
    return false;
  }

  if (isNumber(returnValue)) {
    returnValue = args[returnValue];
  }

  if (isRegExp(firstStr) && firstStr.test(args[1])) {
    return returnValue;
  }
  else if (firstStr === args[0]) {
    return returnValue;
  }

  return false;
}
