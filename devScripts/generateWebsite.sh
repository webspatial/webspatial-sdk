echo 'creating folders...'
mkdir ../webspatial.github.io/dist ;
mkdir ../webspatial.github.io/dist/src;
mkdir ../webspatial.github.io/src ;

echo 'Copying homepage files...'
cp testServer/index.html ../webspatial.github.io/index.html;
cp testServer/dist/index.js ../webspatial.github.io/dist/index.js;
cp testServer/dist/src/index.css ../webspatial.github.io/dist/src/index.css;

echo 'Copying docs website...'
cp -r testServer/dist/src/docsWebsite ../webspatial.github.io/dist/src;
cp -r testServer/src/docsWebsite ../webspatial.github.io/src/;

echo 'Copying assets'
cp -r testServer/public ../webspatial.github.io/;

echo 'done, run: [cd ../webspatial.github.io/; npx serve .] to test locally'