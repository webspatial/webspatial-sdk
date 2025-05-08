echo 'creating folders...'
mkdir ../webspatial.github.io/dist ;
mkdir ../webspatial.github.io/dist/src;
mkdir ../webspatial.github.io/src ;

echo 'Copying homepage files...'
cp apps/test-server/index.html ../webspatial.github.io/index.html;
cp apps/test-server/dist/index.js ../webspatial.github.io/dist/index.js;
cp apps/test-server/dist/src/index.css ../webspatial.github.io/dist/src/index.css;

echo 'Copying docs website...'
cp -r apps/test-server/dist/src/docsWebsite ../webspatial.github.io/dist/src;
cp -r apps/test-server/src/docsWebsite ../webspatial.github.io/src/;

echo 'Copying assets'
cp -r apps/test-server/public ../webspatial.github.io/;

echo 'done, run: [cd ../webspatial.github.io/; npx serve .] to test locally'