import React, {type ReactNode} from 'react';
import Info from '@theme-original/BlogPostItem/Header/Info';
import type InfoType from '@theme/BlogPostItem/Header/Info';
import type {WrapperProps} from '@docusaurus/types';

import style from './style.module.scss';

type Props = WrapperProps<typeof InfoType>;

// blog detail header time
export default function InfoWrapper(props: Props): ReactNode {
  return (
    <>
      <Info {...props} className={style.customTitle} />
    </>
  );
}
