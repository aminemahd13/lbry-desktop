// @flow
import type { RowDataItem } from 'homepage';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { SITE_NAME } from 'config';
import classnames from 'classnames';
import React from 'react';
import Page from 'component/page';
import Button from 'component/button';
import ClaimTilesDiscover from 'component/claimTilesDiscover';
import getHomepage from 'homepage';

type Props = {
  authenticated: boolean,
  followedTags: Array<Tag>,
  subscribedChannels: Array<Subscription>,
};

function HomePage(props: Props) {
  const { followedTags, subscribedChannels, authenticated } = props;
  const showPersonalizedChannels = (authenticated || !IS_WEB) && subscribedChannels && subscribedChannels.length > 0;
  const showPersonalizedTags = (authenticated || !IS_WEB) && followedTags && followedTags.length > 0;
  const showIndividualTags = showPersonalizedTags && followedTags.length < 5;

  const rowData: Array<RowDataItem> = getHomepage(
    authenticated,
    showPersonalizedChannels,
    showPersonalizedTags,
    subscribedChannels,
    followedTags,
    showIndividualTags
  );

  return (
    <Page fullWidthPage>
      {(authenticated || !IS_WEB) && !subscribedChannels.length && (
        <div className="notice-message">
          <h1 className="section__title">
            {__("%SITE_NAME% is more fun if you're following channels", { SITE_NAME })}
          </h1>
          <p className="section__actions">
            <Button
              button="primary"
              navigate={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
              label={__('Find new channels to follow')}
            />
          </p>
        </div>
      )}
      {rowData.map(({ label, route, navigate, help, options = {}, hideRepostLabel = false }, index) => (
        <div key={label} className="claim-grid__wrapper">
          <h1 className="section__actions">
            <span
              className={classnames('claim-grid__title', {
                'claim-grid__title--first': index === 0,
              })}
            >
              {label}
            </span>
            {help}
          </h1>

          <ClaimTilesDiscover {...options} />
          {navigate && (
            <Button
              className="claim-grid__title--secondary"
              button="link"
              navigate={route || navigate}
              iconRight={ICONS.ARROW_RIGHT}
              label={__('View More')}
            />
          )}
        </div>
      ))}
    </Page>
  );
}

export default HomePage;
