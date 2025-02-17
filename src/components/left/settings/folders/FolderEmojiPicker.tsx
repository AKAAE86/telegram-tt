import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useCallback, useState } from '../../../../lib/teact/teact';

import type { ApiSticker } from '../../../../api/types';

import buildClassName from '../../../../util/buildClassName';

import useLastCallback from '../../../../hooks/useLastCallback';

import CustomEmojiPicker from '../../../common/CustomEmojiPicker';
import EmojiPicker from '../../../middle/composer/EmojiPicker';
import SymbolMenuFooter, { SymbolMenuTabs } from '../../../middle/composer/SymbolMenuFooter';
import Transition from '../../../ui/Transition';

import './SettingsFolders.scss';

type OwnProps = {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  onFolderSelect?: (emoji: string, path: string) => void;
  onCustomEmojiSelect: (emoji: ApiSticker) => void;
  className?: string;
};

let isActivated = false;

const FolderEmojiPicker: FC<OwnProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  onFolderSelect,
  onCustomEmojiSelect,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  }, [onEmojiSelect, onClose]);

  if (!isActivated && isOpen) {
    isActivated = true;
  }

  const handleCustomEmojiSelect = useLastCallback((sticker: ApiSticker) => {
    onCustomEmojiSelect(sticker);
    onClose();
  });

  function renderContent(isActive: boolean, isFrom: boolean) {
    switch (activeTab) {
      case SymbolMenuTabs.Emoji:
        return (
          <EmojiPicker
            className="picker-tab"
            onEmojiSelect={handleEmojiSelect}
            isRenderFolderIcons
            onFolderSelect={onFolderSelect}
          />
        );
      case SymbolMenuTabs.CustomEmoji:
        return (
          <CustomEmojiPicker
            className="picker-tab"
            isHidden={!isOpen || !isActive}
            loadAndPlay={isOpen && (isActive || isFrom)}
            isTranslucent={false}
            onCustomEmojiSelect={handleCustomEmojiSelect}
          />
        );
    }

    return undefined;
  }

  const menuContent = (
    <>
      <div className="SymbolMenu-main">
        {isActivated && (
          <Transition
            name="slide"
            activeKey={activeTab}
            renderCount={2}
          >
            {renderContent}
          </Transition>
        )}
      </div>
      <div className={buildClassName('SymbolMenu-footer', 'container')}>
        <SymbolMenuFooter
          activeTab={activeTab}
          onSwitchTab={setActiveTab}
          canSearch
          isAttachmentModal
          canSendPlainText
        />
      </div>
    </>
  );

  return (
    <div className="emoji-picker-modal">
      <div className="emoji-picker-container">
        {menuContent}
      </div>
    </div>
  );
};

export default memo(FolderEmojiPicker);
