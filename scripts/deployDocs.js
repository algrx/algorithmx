const exec = require('child_process').exec

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
rm -rf docs/js
mkdir -p docs/js
cp -rf ../docs/. docs/js

# deploy
git add .
git commit -m "Deploy docs"
git push -u origin master:gh-pages --force
`

exec(script, (error, stdout, stderr) => {
  console.log(stdout)
  console.log(stderr)
})
