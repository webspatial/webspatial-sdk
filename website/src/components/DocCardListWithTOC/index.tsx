import React from 'react';
import DocCardWithTOC from '@site/src/components/DocCardWithTOC';
import styles from './style.module.scss';

// Create a require-context for all .md files in docs/api/classes
// directory: (directory, useSubdirectories, regex)

//@ts-ignore
// const req = require.context(
//   // relative to this file, adjust path if necessary
//   '../../../docs/api/classes',
//   false,
//   /\.md$/,
// );

const reqObj = {
  //@ts-ignore
  coreClasses: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-core/classes',
    false,
    /\.md$/,
  ),
  //@ts-ignore
  coreInterfaces: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-core/interfaces',
    false,
    /\.md$/,
  ),
  //@ts-ignore
  reactTypeAliases: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-react/type-aliases',
    false,
    /\.md$/,
  ),
  //@ts-ignore
  reactClasses: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-react/classes',
    false,
    /\.md$/,
  ),
  //@ts-ignore
  reactInterfaces: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-react/interfaces',
    false,
    /\.md$/,
  ),
  //@ts-ignore
  reactVariables: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-react/variables',
    false,
    /\.md$/,
  ),
  //@ts-ignore
  reactTypeAliases: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-react/type-aliases',
    false,
    /\.md$/,
  ),
  //@ts-ignore
  reactFunctions: require.context(
    // relative to this file, adjust path if necessary
    '../../../docs/api-react/functions',
    false,
    /\.md$/,
  ),
};

export default function CardList({path}: {path: keyof typeof reqObj}) {
  // req.keys() returns an array of matching file paths

  const modules = reqObj[path].keys().map((filePath) => reqObj[path](filePath));
  return (
    <div className={styles.myDocCardGrid}>
      {modules.map((mod, idx) => (
        // `mod` is the module object; default export is the MDX component
        <DocCardWithTOC key={idx} item={mod} />
      ))}
    </div>
  );
}
