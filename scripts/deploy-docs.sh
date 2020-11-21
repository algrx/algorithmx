# clone and merge
git clone "https://${DEPLOY_GITHUB_TOKEN}@github.com/algrx/algrx.github.io.git" website
rm -rf website/docs/js
cp -r docs website/docs/js
cd website

git config --local user.name "GitHub Action"
git config --local user.email "action@github.com"

# deploy
git add .
git commit -m "deploy: js docs"
git push -u origin master --force

# clean
cd ..
rm -rf website
