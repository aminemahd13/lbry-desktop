// @flow
import * as React from 'react';
import ClaimPreview from 'component/claimPreview';

type Props = {
  channelUri: string,
  includeFileActions: boolean,
};

function FileAuthor(props: Props) {
  const { channelUri, includeFileActions } = props;

  return channelUri ? (
    <ClaimPreview uri={channelUri} type="inline" properties={false} hideBlock includeFileActions={includeFileActions} />
  ) : (
    <div className="claim-preview--inline claim-preview__title">{__('Anonymous')}</div>
  );
}

export default FileAuthor;
