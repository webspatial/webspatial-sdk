// src/components/DocCardWithTOC/index.tsx
import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.scss';

interface TOCItem {
  value: string;
  id: string;
  level: number;
}

interface DocCardWithTOCProps {
  item: {
    contentTitle: string;
    metadata: {permalink: string};
    toc: TOCItem[];
  };
}

const DocCardWithTOC: React.FC<DocCardWithTOCProps> = ({item}) => {
  const {contentTitle: title, metadata, toc} = item;
  const {permalink} = metadata;

  return (
    <div
      className={clsx('card padding--lg', styles.cardContainer)} // Infima + 本地模块
    >
      <Heading
        as="h2"
        className={clsx('text--truncate', styles.cardTitle)} // 截断标题一致
        title={title}>
        <Link to={permalink}>{title}</Link>
      </Heading>

      <div className={clsx('card__body', styles.body)}>
        <ul className={styles.myDocCardList}>
          {toc
            .filter((tocItem) => tocItem.level === 3)
            .map((tocItem) => (
              <li key={tocItem.id}>
                <Link to={`${permalink}#${tocItem.id}`}>
                  {tocItem.value.replace(/\(\)$/, '')}
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default DocCardWithTOC;
