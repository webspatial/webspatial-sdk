/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Image from '@theme/IdealImage';
import {Tags, TagList, type TagType, type User} from '@site/src/data/users';
import {sortBy} from '@site/src/utils/jsUtils';
import Heading from '@theme/Heading';
import FavoriteIcon from '../FavoriteIcon';
import styles from './styles.module.css';

function TagItem({
  label,
  description,
  color,
  backgroundColor,
}: {
  label: string;
  description: string;
  color: string;
  backgroundColor: string;
}) {
  return (
    <li
      className={styles.tag}
      title={description}
      style={{color, backgroundColor}}>
      <span className={styles.textLabel}>{label}</span>
      {/* <span className={styles.colorLabel} style={{backgroundColor: color}} /> */}
    </li>
  );
}

function ShowcaseCardTag({tags}: {tags: TagType[]}) {
  const tagObjects = tags.map((tag) => ({tag, ...Tags[tag]}));

  // Keep same order for all tags
  const tagObjectsSorted = sortBy(tagObjects, (tagObject) =>
    TagList.indexOf(tagObject.tag),
  );

  return (
    <>
      {tagObjectsSorted.map((tagObject, index) => {
        // escape for empty label
        if (!tagObject.label) return null;
        return <TagItem key={index} {...tagObject} />;
      })}
    </>
  );
}

function getCardImage(user: User): string {
  return (
    user.preview ??
    // TODO make it configurable
    `https://slorber-api-screenshot.netlify.app/${encodeURIComponent(
      user.website,
    )}/showcase`
  );
}

function ShowcaseCard({user}: {user: User}) {
  const image = getCardImage(user);
  return (
    <li
      key={user.title}
      className={clsx('card ', styles.cardWrap)} /**shadow--md */
    >
      <div className={clsx('card__image', styles.showcaseCardImage)}>
        <Image img={image} alt={user.title} />
      </div>
      <div className="card__body">
        <div className={clsx(styles.showcaseCardHeader)}>
          <Heading as="h4" className={styles.showcaseCardTitle}>
            <span className={styles.showcaseCardLink}>{user.title}</span>
          </Heading>
          {/* {user.tags.includes('favorite') && (
            <FavoriteIcon size="medium" style={{marginRight: '0.25rem'}} />
          )} */}
          {user.source && (
            <Link href={user.website}>
              <div className={styles.linkIcon}>
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 25 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12.0762 4.14844C16.7706 4.14844 20.5762 7.95402 20.5762 12.6484C20.5762 17.3429 16.7706 21.1484 12.0762 21.1484C7.38175 21.1484 3.57617 17.3429 3.57617 12.6484C3.57617 7.95402 7.38175 4.14844 12.0762 4.14844ZM13.0869 11.6045C12.8533 11.3755 12.4968 11.4293 12.2578 11.6621C11.9997 11.9156 11.9356 12.2226 12.1494 12.4854C12.5791 12.9599 12.6121 13.7361 12.2129 14.1758L10.5693 15.9473C10.3806 16.1544 10.1166 16.2727 9.84082 16.2734C9.56689 16.2734 9.30932 16.1585 9.11328 15.9473C8.91567 15.7267 8.8064 15.4407 8.80664 15.1445C8.8069 14.8482 8.91709 14.5621 9.11523 14.3418L9.87012 13.459C10.0952 13.2128 10.078 12.9092 9.84961 12.6465C9.55654 12.3607 9.19849 12.3628 9.01367 12.5635L8.23828 13.4443C7.36736 14.3882 7.36857 15.9091 8.24219 16.8516C8.44457 17.0749 8.69155 17.2542 8.9668 17.377C9.2419 17.4996 9.53963 17.5631 9.84082 17.5645C10.1428 17.5634 10.4419 17.4999 10.7178 17.377C10.9936 17.254 11.2407 17.0745 11.4434 16.8506L13.0869 15.0781C13.9613 14.1349 13.9612 12.5484 13.0869 11.6045ZM14.2363 8.00195C13.9345 8.00299 13.636 8.06763 13.3604 8.19043C13.0847 8.31328 12.8374 8.4921 12.6348 8.71582L10.9912 10.4863C10.1166 11.4302 10.116 12.9545 10.9893 13.8984C11.1781 14.1043 11.5872 14.1643 11.8545 13.9043C12.1091 13.6265 12.1609 13.3888 11.9629 13.1084C11.5202 12.6179 11.4716 11.8223 11.8643 11.3887L13.5078 9.61719C13.7038 9.4067 13.9615 9.29199 14.2354 9.29199C14.3721 9.29269 14.507 9.32217 14.6318 9.37793C14.7567 9.43373 14.8692 9.51477 14.9609 9.61621C15.1593 9.83677 15.2686 10.1232 15.2686 10.4199C15.2685 10.7166 15.1594 11.0031 14.9609 11.2236L14.209 12.0322C13.9757 12.2896 13.998 12.6582 14.2461 12.9043C14.5397 13.1945 14.8863 13.1514 15.083 12.9346L15.835 12.125C16.7096 11.1811 16.7096 9.65777 15.835 8.71387C15.4087 8.25594 14.8407 8.00208 14.2363 8.00195Z"
                    fill="var(--color-fill-5)"
                  />
                </svg>
              </div>
            </Link>
          )}
          {user.source && (
            <Link href={user.source} style={{marginLeft: '4px'}}>
              <div className={styles.sourceIcon}>
                <svg
                  width="24"
                  height="25"
                  viewBox="0 0 24 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M11.9926 4.55444C7.29752 4.55282 3.49219 8.35491 3.49219 13.0484C3.49219 16.7597 5.87214 19.9143 9.18641 21.0731C9.63209 21.1849 9.56402 20.8681 9.56402 20.6517V19.1794C6.98716 19.4816 6.88181 17.7759 6.70921 17.4906C6.36077 16.8942 5.53423 16.7427 5.78057 16.4574C6.36725 16.156 6.96609 16.5336 7.65893 17.5571C8.16052 18.3001 9.1386 18.1745 9.63452 18.0514C9.74229 17.6049 9.97486 17.2062 10.2933 16.8966C7.62327 16.4185 6.50987 14.7882 6.50987 12.8515C6.50987 11.9115 6.81942 11.0468 7.42717 10.35C7.03983 9.2009 7.46364 8.21715 7.52036 8.07048C8.62403 7.97162 9.77066 8.86056 9.8606 8.93106C10.487 8.7617 11.2033 8.67256 12.0047 8.67256C12.8094 8.67256 13.5282 8.76575 14.1602 8.93673C14.375 8.77385 15.4381 8.00971 16.464 8.1029C16.5191 8.24876 16.9332 9.21062 16.5685 10.3443C17.1844 11.0428 17.4972 11.9147 17.4972 12.8563C17.4972 14.7979 16.3765 16.4299 13.6983 16.8999C14.1448 17.3407 14.422 17.9525 14.422 18.6283V20.7652C14.4374 20.9353 14.422 21.1055 14.7072 21.1055C18.0701 19.971 20.4922 16.7945 20.4922 13.0508C20.4922 8.35572 16.686 4.55525 11.9934 4.55525"
                    fill="var(--color-fill-5)"
                  />
                </svg>
              </div>
            </Link>
          )}
        </div>
        <p className={styles.showcaseCardBody}>{user.description}</p>
      </div>
      <ul className={clsx('card__footer', styles.cardFooter)}>
        <ShowcaseCardTag tags={user.tags} />
      </ul>
    </li>
  );
}

export default React.memo(ShowcaseCard);
