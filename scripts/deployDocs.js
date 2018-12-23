const pkg = require('../package.json')
const exec = require('child_process').exec;

const versionSplit = pkg.version.split('.')
const versionMajorMinor = versionSplit[0] + '.' + versionSplit[1]

const htmlRedirect = `<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${versionMajorMinor}/">
  </head>
</html>`

const script = `
rm -rf public
mkdir public

# config
git config --global user.email "travis@travis-ci.com"
git config --global user.name "Travis CI"

# git
cd public
git init
git remote add origin "https://\${GITHUB_TOKEN}@github.com/\${GITHUB_REPO}.git"
git pull origin gh-pages

# copy
rm -rf docs/js/${versionMajorMinor}
mkdir -p docs/js/${versionMajorMinor}
cp -rf ../docs/. docs/js/${versionMajorMinor}

# redirect
echo '${htmlRedirect}' > docs/js/index.html

# deploy
git add .
git commit -m "Deploy to GitHub Pages"
git push -u origin master:gh-pages 
`

exec(script, (error, stdout, stderr) => {
  console.log(stdout)
  console.log(stderr)
})
