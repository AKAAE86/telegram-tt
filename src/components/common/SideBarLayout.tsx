import type { FC, TeactNode } from '../../lib/teact/teact';
import React, { useCallback, useRef } from '../../lib/teact/teact';

import type { MenuItemContextAction } from '../ui/ListItem';
import { LeftColumnContent } from '../../types';

import {
  ALL_FOLDER_ID, APP_NAME, DEBUG, IS_BETA,
} from '../../config';
import buildClassName from '../../util/buildClassName';
import { IS_ELECTRON, IS_MAC_OS, MouseButton } from '../../util/windowEnvironment';

import useAppLayout from '../../hooks/useAppLayout';
import useContextMenuHandlers from '../../hooks/useContextMenuHandlers';
import { useFastClick } from '../../hooks/useFastClick';
import useFlag from '../../hooks/useFlag';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import { useFullscreenStatus } from '../../hooks/window/useFullscreen';

import LeftSideMenuItems from '../left/main/LeftSideMenuItems';
import Button from '../ui/Button';
import DropdownMenu from '../ui/DropdownMenu';
import Menu from '../ui/Menu';
import MenuItem from '../ui/MenuItem';
import MenuSeparator from '../ui/MenuSeparator';

import './SideBarLayout.scss';

import botIconPath from '../../assets/icons/bot.svg';
import channelIconPath from '../../assets/icons/channel.svg';
import chatIconPath from '../../assets/icons/chat.svg';
import chatsIconPath from '../../assets/icons/chats.svg';
import folderIconPath from '../../assets/icons/folder.svg';
import groupIconPath from '../../assets/icons/group.svg';
import starIconPath from '../../assets/icons/star.svg';
import userIconPath from '../../assets/icons/user.svg';

export type TabWithEmojiProperties = {
  id?: number;
  titleNode: TeactNode;
  iconNode?: TeactNode;
  badgeCount?: number;
  isBlocked?: boolean;
  isBadgeActive?: boolean;
  contextActions?: MenuItemContextAction[];
  regularEmoji?: string;
  icon?: string;
};

interface SideBarLayoutProps {
  children: TeactNode;
  tabList?: TabWithEmojiProperties[];
  onTabSelect: (tabId: number) => void;
  sidebarBackground?: string;
  content: LeftColumnContent;
  onSelectSettings: NoneToVoidFunction;
  onSelectContacts: NoneToVoidFunction;
  onSelectArchived: NoneToVoidFunction;
  onReset: () => void;
  shouldSkipAnimations: boolean;
  activeChatFolderId: number;
}

export const IconConfig = {
  chats: {
    emoji: '☑',
    path: chatsIconPath,
  },
  chat: {
    emoji: '💬',
    path: chatIconPath,
  },
  bot: {
    emoji: '🤖',
    path: botIconPath,
  },
  star: {
    emoji: '⭐',
    path: starIconPath,
  },
  user: {
    emoji: '👤',
    path: userIconPath,
  },
  group: {
    emoji: '👥',
    path: groupIconPath,
  },
  folder: {
    emoji: '🗂',
    path: folderIconPath,
  },
  channel: {
    emoji: '📣',
    path: channelIconPath,
  },
};

export const IconMap = new Map(Object.values(IconConfig).map(({ emoji, path }) => [emoji, path]));

const DefaultIcon = folderIconPath;

const getIconPath = (id: number, icon?: string) => {
  if (id === ALL_FOLDER_ID) {
    return chatsIconPath;
  }
  return icon ? IconMap.get(icon) : DefaultIcon;
};

interface TabProps {
  tab: TabWithEmojiProperties;
  index: number;
  selectedTabIndex: number;
  handleTabClick: (tabIndex: number) => void;
}

const TabComponent: FC<TabProps> = ({
  tab,
  index,
  selectedTabIndex,
  handleTabClick,
}) => {
  const isSelected = index === selectedTabIndex;
  const iconPath = getIconPath(tab.id ?? -1, tab.icon);

  // eslint-disable-next-line no-null/no-null
  const tabRef = useRef<HTMLDivElement>(null);

  const {
    contextMenuAnchor, handleContextMenu, handleBeforeContextMenu, handleContextMenuClose,
    handleContextMenuHide, isContextMenuOpen,
  } = useContextMenuHandlers(tabRef, !tab.contextActions);

  const { handleClick, handleMouseDown } = useFastClick((e: React.MouseEvent<HTMLDivElement>) => {
    if (tab.contextActions && (e.button === MouseButton.Secondary)) {
      handleBeforeContextMenu(e);
    }

    if (e.type === 'mousedown' && e.button !== MouseButton.Main) {
      return;
    }

    handleTabClick?.(index ?? -1);
  });

  const contextRootElementSelector = '#SideBarLayout';
  const getTriggerElement = useLastCallback(() => tabRef.current);
  const getRootElement = useLastCallback(
    () => (contextRootElementSelector ? tabRef.current!.closest(contextRootElementSelector) : document.body),
  );
  const getMenuElement = useLastCallback(
    () => document.querySelector('#portals')!.querySelector('.Tab-context-menu .bubble'),
  );
  const getLayout = useLastCallback(() => ({ withPortal: true }));

  return (
    <div
      key={tab.id}
      ref={tabRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      className={buildClassName('SideBarLayout', 'tab', isSelected && 'selected')}
      onClick={handleClick}
    >
      <div className={buildClassName('SideBarLayout', 'tab-icon-container')}>
        {tab.iconNode ? (
          <div className={buildClassName('SideBarLayout', 'tab-animated-icon')}>
            {tab.iconNode}
          </div>
        ) : tab.regularEmoji ? (
          <span className={buildClassName('SideBarLayout', 'tab-fonticon')}>
            {tab.regularEmoji}
          </span>
        ) : (
          <img
            src={iconPath}
            className={buildClassName('SideBarLayout', 'tab-icon')}
            alt=""
          />
        )}
      </div>
      <div className={buildClassName('SideBarLayout', 'tab-title')}>
        <div className={buildClassName('SideBarLayout', 'tab-title-inner')}>
          <span className={buildClassName('SideBarLayout', 'tab-title-content')}>
            {tab.titleNode}
          </span>
        </div>
      </div>
      {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
        <span className={buildClassName('SideBarLayout', 'tab-badge', tab.isBadgeActive && 'active')}>
          {tab.badgeCount}
        </span>
      )}

      {tab.contextActions && contextMenuAnchor !== undefined && (
        <Menu
          isOpen={isContextMenuOpen}
          anchor={contextMenuAnchor}
          getTriggerElement={getTriggerElement}
          getRootElement={getRootElement}
          getMenuElement={getMenuElement}
          getLayout={getLayout}
          className="Tab-context-menu"
          autoClose
          onClose={handleContextMenuClose}
          onCloseAnimationEnd={handleContextMenuHide}
          withPortal
        >
          {tab.contextActions.map((action) => (
            ('isSeparator' in action) ? (
              <MenuSeparator key={action.key || 'separator'} />
            ) : (
              <MenuItem
                key={action.title}
                icon={action.icon}
                destructive={action.destructive}
                disabled={!action.handler}
                onClick={action.handler}
              >
                {action.title}
              </MenuItem>
            )
          ))}
        </Menu>
      )}
    </div>
  );
};

const SideBarLayout: FC<SideBarLayoutProps> = ({
  children,
  tabList,
  onTabSelect,
  sidebarBackground = '#191919',
  content,
  onReset,
  shouldSkipAnimations,
  onSelectArchived,
  onSelectContacts,
  onSelectSettings,
  activeChatFolderId,
}) => {
  const selectedTabIndex = activeChatFolderId ?? 0;

  const { isMobile } = useAppLayout();
  const [isBotMenuOpen, markBotMenuOpen, unmarkBotMenuOpen] = useFlag();
  const isFullscreen = useFullscreenStatus();
  const oldLang = useOldLang();
  const versionString = IS_BETA ? `${APP_VERSION} Beta (${APP_REVISION})` : (DEBUG ? APP_REVISION : APP_VERSION);
  const hasMenu = content === LeftColumnContent.ChatList || content !== LeftColumnContent.Contacts;

  const MainButton: FC<{ onTrigger: () => void; isOpen?: boolean }> = useCallback(({ onTrigger, isOpen }) => (
    <Button
      round
      ripple={hasMenu && !isMobile}
      size="smaller"
      color="translucent"
      className={isOpen ? 'active' : ''}
      // eslint-disable-next-line react/jsx-no-bind
      onClick={hasMenu ? onTrigger : () => onReset()}
      ariaLabel={hasMenu ? oldLang('AccDescrOpenMenu2') : 'Return to chat list'}
    >
      <div className={buildClassName(
        'SideBarLayout',
        'animated-menu-icon',
        !hasMenu && 'state-back',
        shouldSkipAnimations && 'no-animation',
      )}
      />
    </Button>
  ), [hasMenu, isMobile, oldLang, onReset, shouldSkipAnimations]);

  const handleTabClick = useCallback((tabIndex: number) => {
    onTabSelect(tabIndex);
  }, [onTabSelect]);

  return (
    <div className={buildClassName('SideBarLayout')}>
      {tabList && (
        <div
          className={buildClassName('SideBarLayout', 'sidebar')}
          style={`background: ${sidebarBackground};`}
        >
          <div className={buildClassName('SideBarLayout', 'sidebar-container')}>
            <div className={buildClassName('SideBarLayout', 'nav', 'scrollable')}>
              <div className={buildClassName('SideBarLayout', 'nav-scroll-container')}>
                <div className={buildClassName('SideBarLayout', 'menu-button-container')}>
                  <DropdownMenu
                    trigger={MainButton}
                    footer={`${APP_NAME} ${versionString}`}
                    className={buildClassName('SideBar')}
                    positionX="left"
                    transformOriginX={IS_ELECTRON && IS_MAC_OS && !isFullscreen ? 90 : undefined}
                    forceOpen={isBotMenuOpen}
                  >
                    <LeftSideMenuItems
                      onSelectArchived={onSelectArchived}
                      onSelectContacts={onSelectContacts}
                      onSelectSettings={onSelectSettings}
                      onBotMenuOpened={markBotMenuOpen}
                      onBotMenuClosed={unmarkBotMenuOpen}
                    />
                  </DropdownMenu>
                </div>
                {tabList?.map((tab, index) => (
                  <TabComponent
                    tab={tab}
                    selectedTabIndex={selectedTabIndex}
                    index={index}
                    handleTabClick={handleTabClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={buildClassName('SideBarLayout', 'content')}>
        {children}
      </div>
    </div>
  );
};

export default SideBarLayout;
