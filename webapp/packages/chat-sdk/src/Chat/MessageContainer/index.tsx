import Text from '../components/Text';
import { memo, useCallback, useEffect, useState } from 'react';
import { isEqual, set } from 'lodash';
import { AgentType, MessageItem, MessageTypeEnum } from '../type';
import { isMobile, updateMessageContainerScroll } from '../../utils/utils';
import styles from './style.module.less';
import AgentTip from '../components/AgentTip';
import classNames from 'classnames';
import { MsgDataType } from '../../common/type';
import ChatItem from '../../components/ChatItem';
import { message } from 'antd';

type Props = {
  id: string;
  chatId: number;
  messageList: MessageItem[];
  historyVisible: boolean;
  currentAgent?: AgentType;
  chatVisible?: boolean;
  isDeveloper?: boolean;
  curItemIndex?: number;
  integrateSystem?: string;
  isSimpleMode?: boolean;
  isDebugMode?: boolean;
  onMsgDataLoaded: (
    data: MsgDataType,
    questionId: string | number,
    question: string,
    valid: boolean,
    isRefresh?: boolean
  ) => void;
  onSendMsg: (value: string) => void;
  onCouldNotAnswer: () => void;
};

const MessageContainer: React.FC<Props> = ({
  id,
  chatId,
  messageList,
  historyVisible,
  currentAgent,
  chatVisible,
  isDeveloper,
  curItemIndex,
  integrateSystem,
  isSimpleMode,
  isDebugMode,
  onMsgDataLoaded,
  onSendMsg,
  onCouldNotAnswer
}) => {
  const [triggerResize, setTriggerResize] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState<boolean>(false);
  const onResize = useCallback(() => {
    setTriggerResize(true);
    setTimeout(() => {
      setTriggerResize(false);
    }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    onResize();
  }, [historyVisible, chatVisible]);

  
  useEffect(() => {
    const audioDom1 = document.getElementsByClassName('voiceReportPlayer')[0];
    const audioDom2 = document.getElementsByClassName('cacheVoiceReportPlayer')[0];
    console.log(audioDom1, audioDom2, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  }, []); // 空数组作为依赖项，表示这个effect只在组件挂载和卸载时执行一次

  const cacheVoiceData = function(ttsUrl: string) {
    const audioElementCache = document.getElementsByClassName('cacheVoiceReportPlayer')[0]
    // @ts-ignore
    audioElementCache.src = ttsUrl
    // @ts-ignore
    audioElementCache.load()
    setTimeout(() => {
      // @ts-ignore
      audioElementCache.load()
    }, 1000)
    setTimeout(() => {
      // @ts-ignore
      audioElementCache.load()
    }, 2000)
  }
  useEffect(() => {
    // 当data变化时，这个函数会被调用
    setVoiceLoading(voiceLoading);
  }, [voiceLoading]);
  // 从Tools中触发点击事件传递到ChatItem在从ChatItem中触发MessageContainer的voiceReport函数
  const voiceReport = (msgData: any = {}) => {
    sessionStorage.setItem('voiceReportQueryId', JSON.stringify(msgData.queryId))
    setVoiceLoading(true)
    const voicePlay = function(msgData: any = {}) {
      const audioElementCur = document.getElementsByClassName('voiceReportPlayer');
      // iconList拿到正在播放的voice
      const iconList = document.getElementsByClassName(`voice-icon`)
      // 有正在播放的,停止播放并且清除样式,且不再继续执行
      if (iconList.length > 0) {
          // @ts-ignore
          audioElementCur[0].pause()
          iconList[0]?.classList.remove('voice-icon')
          // @ts-ignore
          if (audioElementCur[0].dataset.index === `${msgData.queryId}`) {
            setTimeout(() => {
              setVoiceLoading(false)
            }, 100)
            return
          }
      }
      const urlNew = msgData.ttsUrl.replace('dc.migu.cn', 'da.migu.cn:8443')
      const res = {data: urlNew}
      if (res && res.data) {
        // setTimeout(() => {
          // 延迟关闭loading效果，delay时间视作加载语音耗时
          // setVoiceLoading(false)
        // }, 1000)
        const closeAnimation = function() {
          const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
          const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
          voicingIcon?.classList?.remove('voice-icon')
          // @ts-ignore
          audioElement.dataset.index = ''
        }
        const activeAnimation = function() {
          const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
          const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
          voicingIcon?.classList?.add('voice-icon')
          // @ts-ignore
          audioElement.dataset.index = msgData.queryId
        }
        const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
        const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
        // 查到对应的voicingIcon
        // console.log(voicingIcon, 'voicingIcon')
        // @ts-ignore
        if (audioElement && voicingIcon) {
          // @ts-ignore
          audioElement.src = res.data
          // @ts-ignore
          audioElement.load()
          // @ts-ignore
          audioElement.dataset.index = msgData.queryId
          // 监听 'canplaythrough' 事件（表示可以完整播放）
          const oaAccount = localStorage.getItem('oaAccount');
          const accountList = ['liqianqianjs', 'liqianqian', 'jiangjiqi', 'jiangjiqipt', 'liaokun', 'liaokun_pt']
          let showTip = false
          // @ts-ignore
          if (accountList.indexOf(oaAccount) > -1) {
            showTip = true
          }
          audioElement.addEventListener("canplaythrough", () => {
            console.log("redChat canplaythrough 音频已完全加载，开始播放");
            showTip && message.success('即将为您播报语音');
            // 可以播放了
            // @ts-ignore
            audioElement.play().then(() => {
              // 成功播放,开启播放效果并且关闭loading效果
              setVoiceLoading(false)
              activeAnimation()
            }).catch(e => {
              // 播放失败,开启loading效果 并且关闭 播放效果
              setVoiceLoading(true)
              showTip && message.error('播放失败，3S后将自动播放');
              console.error("redChat 播放失败，3S后将自动播放:", e);
              closeAnimation()
              setTimeout(() => {
                // @ts-ignore
                audioElement.play().then(() => {
                  // 成功播放,开启播放效果并且关闭loading效果
                  activeAnimation()
                  setVoiceLoading(false)
                }).catch(e => {
                  showTip && message.error('播放失败，3S后将自动播放');
                  console.error("redChat 播放失败，3S后将自动播放:", e);
                  // 播放失败,开启loading效果 并且关闭 播放效果
                  setVoiceLoading(true)
                  closeAnimation()
                  setTimeout(() => {
                    // @ts-ignore
                    audioElement.play().then(() => {
                      // 成功播放,开启播放效果并且关闭loading效果
                      setVoiceLoading(false)
                      activeAnimation()
                    }).catch(e => {
                      showTip && message.error('播放失败，获取文件异常,可重新点击播放');
                      alert('播放失败，获取文件异常,可重新点击播放')
                      console.error("redChat 播放失败，获取文件异常,可重新点击播放:", e);
                      // 最后一次重试并且播放失败,关闭loading效果 并且关闭 播放效果
                      setVoiceLoading(false)
                      closeAnimation()
                    });
                  }, 6000)
                });
              }, 3000)
            });
          }, { once: true });
          // 错误处理
          audioElement.addEventListener("error", () => {
            showTip && message.error('音频文件生成中，请稍后再试');
            // 报错了,关闭播放效果,打开loading效果
            closeAnimation()
            setVoiceLoading(true)
            setTimeout(() => {
              // @ts-ignore
              audioElement.play().then(() => {
                // 成功播放,开启播放效果并且关闭loading效果
                activeAnimation()
                setVoiceLoading(false)
              }).catch(e => {
                showTip && message.error('播放失败，3S后将自动播放');
                console.error("redChat 播放失败，3S后将自动播放:", e);
                // 播放报错,关闭播放效果,打开loading效果
                setVoiceLoading(true)
                closeAnimation()
                setTimeout(() => {
                  // @ts-ignore
                  audioElement.play().then(() => {
                    // 成功播放,开启播放效果并且关闭loading效果
                    activeAnimation()
                    setVoiceLoading(false)
                  }).catch(e => {
                    showTip && message.error('播放失败，3S后将自动播放');
                    console.error("redChat 播放失败，3S后将自动播放:", e);
                    // 播放报错,关闭播放效果,打开loading效果
                    setVoiceLoading(true)
                    closeAnimation()
                    setTimeout(() => {
                      // @ts-ignore
                      audioElement.play().then(() => {
                        // 成功播放,开启播放效果并且关闭loading效果
                        activeAnimation()
                        setVoiceLoading(false)
                      }).catch(e => {
                        showTip && message.error('播放失败，获取文件异常,可重新点击播放');
                        alert('播放失败，获取文件异常,可重新点击播放')
                        console.error("redChat 播放失败，获取文件异常,可重新点击播放:", e);
                        // 最后一次重试并且播放失败,关闭loading效果 并且关闭 播放效果
                        closeAnimation()
                        setVoiceLoading(false)
                      });
                    }, 8000)
                  });
                }, 5000)
              });
            }, 3000)
          }, { once: true });
          audioElement.addEventListener('ended', closeAnimation, { once: true });
        }
      }
    }
    // 延迟3000ms播放,安卓加载异常问题尝试修复
    // 暂停播放时不延迟
    const iconList = document.getElementsByClassName(`voice-icon`)
    if (iconList.length > 0) {
      voicePlay(msgData)
    } else {
      setTimeout(() => {
        voicePlay(msgData)
      }, 3000)
    }
  }

  const messageContainerClass = classNames(styles.messageContainer, { [styles.mobile]: isMobile });
  return (
    <div id={id} className={messageContainerClass}>
      <div className={styles.messageList}>
        {messageList.map((msgItem: MessageItem, index: number) => {
          const {
            id: msgId,
            questionId,
            modelId,
            agentId,
            type,
            msg,
            msgValue,
            score,
            identityMsg,
            parseInfos,
            parseTimeCost,
            msgData,
            filters,
          } = msgItem;

          return (
            <div key={msgId} id={`${msgId}`} className={styles.messageItem}>
              {type === MessageTypeEnum.TEXT && <Text position="left" data={msg} />}
              {type === MessageTypeEnum.AGENT_LIST && (
                <AgentTip currentAgent={currentAgent} onSendMsg={onSendMsg} id={msgId}/>
              )}
              {type === MessageTypeEnum.QUESTION && (
                <>
                  <Text position="right" data={msg} />
                  {identityMsg && <Text position="left" data={identityMsg} />}
                  <ChatItem
                    msgId={msgId}
                    questionId={questionId}
                    currentAgent={currentAgent}
                    isSimpleMode={isSimpleMode}
                    isDebugMode={isDebugMode}
                    msg={msgValue || msg || ''}
                    parseInfos={parseInfos}
                    parseTimeCostValue={parseTimeCost}
                    msgData={msgData}
                    conversationId={chatId}
                    modelId={modelId}
                    agentId={agentId}
                    score={score}
                    filter={filters}
                    triggerResize={triggerResize}
                    itemVoiceLoading={voiceLoading}
                    isDeveloper={isDeveloper}
                    integrateSystem={integrateSystem}
                    onMsgDataLoaded={(data: MsgDataType, valid: boolean, isRefresh) => {
                      onMsgDataLoaded(data, msgId, msgValue || msg || '', valid, isRefresh);
                    }}
                    onVoiceReport={(msgData: any) => {
                      voiceReport(msgData)
                    }}
                    onUpdateMessageScroll={updateMessageContainerScroll}
                    onSendMsg={onSendMsg}
                    onCouldNotAnswer={onCouldNotAnswer}
                    isLastMessage={index === messageList.length - 1}
                    curItemIndex={index}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      <audio className={`voiceReportPlayer`} preload="true" style={{ width: 0, height: 0, position: 'absolute'}}></audio>
      <audio className={`cacheVoiceReportPlayer`} preload="true" style={{ width: 0, height: 0, position: 'absolute'}}></audio>
    </div>
  );
};

function areEqual(prevProps: Props, nextProps: Props) {
  if (
    prevProps.id === nextProps.id &&
    isEqual(prevProps.messageList, nextProps.messageList) &&
    prevProps.historyVisible === nextProps.historyVisible &&
    prevProps.currentAgent === nextProps.currentAgent &&
    prevProps.chatVisible === nextProps.chatVisible &&
    prevProps.isSimpleMode === nextProps.isSimpleMode
  ) {
    return true;
  }
  return false;
}

export default memo(MessageContainer, areEqual);
