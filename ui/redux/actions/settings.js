import { Lbry, ACTIONS, SHARED_PREFERENCES, doWalletReconnect, SETTINGS, DAEMON_SETTINGS } from 'lbry-redux';
import { doToast } from 'redux/actions/notifications';
import * as LOCAL_ACTIONS from 'constants/action_types';
import analytics from 'analytics';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import { launcher } from 'util/autoLaunch';
import { makeSelectClientSetting } from 'redux/selectors/settings';
const { DEFAULT_LANGUAGE } = require('config');
const { SDK_SYNC_KEYS } = SHARED_PREFERENCES;

export const IS_MAC = process.platform === 'darwin';
const UPDATE_IS_NIGHT_INTERVAL = 5 * 60 * 1000;

export function doFetchDaemonSettings() {
  return dispatch => {
    Lbry.settings_get().then(settings => {
      analytics.toggleInternal(settings.share_usage_data);
      dispatch({
        type: ACTIONS.DAEMON_SETTINGS_RECEIVED,
        data: {
          settings,
        },
      });
    });
  };
}

export function doFindFFmpeg() {
  return dispatch => {
    dispatch({
      type: LOCAL_ACTIONS.FINDING_FFMPEG_STARTED,
    });
    return Lbry.ffmpeg_find().then(done => {
      dispatch(doGetDaemonStatus());
      dispatch({
        type: LOCAL_ACTIONS.FINDING_FFMPEG_COMPLETED,
      });
    });
  };
}

export function doGetDaemonStatus() {
  return dispatch => {
    return Lbry.status().then(status => {
      dispatch({
        type: ACTIONS.DAEMON_STATUS_RECEIVED,
        data: {
          status,
        },
      });
      return status;
    });
  };
}

export function doClearDaemonSetting(key) {
  return dispatch => {
    const clearKey = {
      key,
    };
    Lbry.settings_clear(clearKey).then(defaultSettings => {
      if (SDK_SYNC_KEYS.includes(key)) {
        dispatch({
          type: ACTIONS.SHARED_PREFERENCE_SET,
          data: { key: key, value: null },
        });
      }
      if (key === DAEMON_SETTINGS.LBRYUM_SERVERS) {
        dispatch(doWalletReconnect());
      }
    });
    Lbry.settings_get().then(settings => {
      analytics.toggleInternal(settings.share_usage_data);
      dispatch({
        type: ACTIONS.DAEMON_SETTINGS_RECEIVED,
        data: {
          settings,
        },
      });
    });
  };
}
// if doPopulate is applying settings, we don't want to cause a loop; doNotDispatch = true.
export function doSetDaemonSetting(key, value, doNotDispatch = false) {
  return dispatch => {
    const newSettings = {
      key,
      value: !value && value !== false ? null : value,
    };
    Lbry.settings_set(newSettings).then(newSetting => {
      if (SDK_SYNC_KEYS.includes(key) && !doNotDispatch) {
        dispatch({
          type: ACTIONS.SHARED_PREFERENCE_SET,
          data: { key: key, value: newSetting[key] },
        });
      }
      // hardcoding this in lieu of a better solution
      if (key === DAEMON_SETTINGS.LBRYUM_SERVERS) {
        dispatch(doWalletReconnect());
        // todo: add sdk reloadsettings() (or it happens automagically?)
      }
    });
    Lbry.settings_get().then(settings => {
      analytics.toggleInternal(settings.share_usage_data);
      dispatch({
        type: ACTIONS.DAEMON_SETTINGS_RECEIVED,
        data: {
          settings,
        },
      });
    });
  };
}

export function doSaveCustomWalletServers(servers) {
  return {
    type: ACTIONS.SAVE_CUSTOM_WALLET_SERVERS,
    data: servers,
  };
}

export function doSetClientSetting(key, value) {
  return dispatch => {
    dispatch({
      type: ACTIONS.CLIENT_SETTING_CHANGED,
      data: {
        key,
        value,
      },
    });
  };
}

export function doUpdateIsNight() {
  return {
    type: ACTIONS.UPDATE_IS_NIGHT,
  };
}

export function doUpdateIsNightAsync() {
  return dispatch => {
    dispatch(doUpdateIsNight());

    setInterval(() => dispatch(doUpdateIsNight()), UPDATE_IS_NIGHT_INTERVAL);
  };
}

export function doSetDarkTime(value, options) {
  const { fromTo, time } = options;
  return (dispatch, getState) => {
    const state = getState();
    const darkModeTimes = state.settings.clientSettings[SETTINGS.DARK_MODE_TIMES];
    const { hour, min } = darkModeTimes[fromTo];
    const newHour = time === 'hour' ? value : hour;
    const newMin = time === 'min' ? value : min;
    const modifiedTimes = {
      [fromTo]: {
        hour: newHour,
        min: newMin,
        formattedTime: newHour + ':' + newMin,
      },
    };
    const mergedTimes = { ...darkModeTimes, ...modifiedTimes };

    dispatch(doSetClientSetting(SETTINGS.DARK_MODE_TIMES, mergedTimes));
    dispatch(doUpdateIsNight());
  };
}

export function doSyncClientSettings() {
  return (dispatch, getState) => {
    const state = getState();
    const syncEnabled = makeSelectClientSetting(SETTINGS.ENABLE_SYNC)(state);
    if (syncEnabled) {
      dispatch({
        type: LOCAL_ACTIONS.SYNC_CLIENT_SETTINGS,
      });
    }
  };
}

export function doFetchLanguage(language) {
  return (dispatch, getState) => {
    const { settings } = getState();

    if (settings.language !== language || (settings.loadedLanguages && !settings.loadedLanguages.includes(language))) {
      // this should match the behavior/logic in index-web.html
      fetch('https://lbry.com/i18n/get/lbry-desktop/app-strings/' + language + '.json')
        .then(r => r.json())
        .then(j => {
          window.i18n_messages[language] = j;
          dispatch({
            type: LOCAL_ACTIONS.DOWNLOAD_LANGUAGE_SUCCESS,
            data: {
              language,
            },
          });
        })
        .catch(e => {
          dispatch({
            type: LOCAL_ACTIONS.DOWNLOAD_LANGUAGE_FAILURE,
          });
        });
    }
  };
}

export function doSetLanguage(language) {
  return (dispatch, getState) => {
    const { settings } = getState();
    if (settings.language !== language || (settings.loadedLanguages && !settings.loadedLanguages.includes(language))) {
      // this should match the behavior/logic in index-web.html
      fetch('https://lbry.com/i18n/get/lbry-desktop/app-strings/' + language + '.json')
        .then(r => r.json())
        .then(j => {
          window.i18n_messages[language] = j;
          dispatch({
            type: LOCAL_ACTIONS.DOWNLOAD_LANGUAGE_SUCCESS,
            data: {
              language,
            },
          });
        })
        .then(() => {
          // set on localStorage so it can be read outside of redux
          window.localStorage.setItem(SETTINGS.LANGUAGE, language);
          dispatch(doSetClientSetting(SETTINGS.LANGUAGE, language));
        })
        .catch(e => {
          window.localStorage.setItem(SETTINGS.LANGUAGE, DEFAULT_LANGUAGE);
          dispatch(doSetClientSetting(SETTINGS.LANGUAGE, DEFAULT_LANGUAGE));
          const languageName = SUPPORTED_LANGUAGES[language] ? SUPPORTED_LANGUAGES[language] : language;
          dispatch(
            doToast({
              message: __('Failed to load %language% translations.', { language: languageName }),
              isError: true,
            })
          );
        });
    }
  };
}

export function doSetAutoLaunch(value) {
  return (dispatch, getState) => {
    const state = getState();
    const autoLaunch = makeSelectClientSetting(SETTINGS.AUTO_LAUNCH)(state);

    if (IS_MAC || process.env.NODE_ENV !== 'production') {
      return;
    }

    if (value === undefined) {
      launcher.isEnabled().then(isEnabled => {
        if (isEnabled) {
          if (!autoLaunch) {
            launcher.disable().then(() => {
              dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, false));
            });
          }
        } else {
          if (autoLaunch || autoLaunch === null || autoLaunch === undefined) {
            launcher.enable().then(() => {
              dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, true));
            });
          }
        }
      });
    } else if (value === true) {
      launcher.isEnabled().then(function(isEnabled) {
        if (!isEnabled) {
          launcher.enable().then(() => {
            dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, true));
          });
        } else {
          dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, true));
        }
      });
    } else {
      // value = false
      launcher.isEnabled().then(function(isEnabled) {
        if (isEnabled) {
          launcher.disable().then(() => {
            dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, false));
          });
        } else {
          dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, false));
        }
      });
    }
  };
}

export function doSetAppToTrayWhenClosed(value) {
  return dispatch => {
    window.localStorage.setItem(SETTINGS.TO_TRAY_WHEN_CLOSED, value);
    dispatch(doSetClientSetting(SETTINGS.TO_TRAY_WHEN_CLOSED, value));
  };
}
