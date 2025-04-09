import Text from '../components/Text';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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

  // useEffect(() => {
  //   // 当data变化时，这个函数会被调用
  //   setVoiceLoading(voiceLoading);
  // }, [voiceLoading]);

  useEffect(() => {
    // 如果在iframe中，调用语音播放就用父页面的postMessage触发audio的播放,否则用当前项目内的audio播放
    // 这样做是因为咪咕家访问红海系统内iframe引入的红海经分小助手（chatBI）时，播放音频有兼容性问题。
    if (window.self !== window.top) {
      sessionStorage.setItem('isInIframe', 'false')
      // sessionStorage.setItem('isInIframe', 'true')
    } else {
      sessionStorage.setItem('isInIframe', 'false')
    }
    // 监听来自父页面的消息
    window.addEventListener('message', (event) => {
      const closeAnimation = () => {
        const iconList = document.getElementsByClassName(`voice-icon`)
        if (iconList.length > 0) {
          // 有正在播放的,停止播放并且清除样式
          // @ts-ignore
          // iconList[0]?.classList.remove('voice-icon')
          Array.from(iconList).forEach(ele => {
            ele.classList.remove('voice-icon')
          })
        }
      }
      // 处理消息
      if (event.data.action === 'voicePause') {
        closeAnimation()
      }
      // 处理消息
      if (event.data.action === 'iframeHidden') {
        closeAnimation()
      }
    });
  }, []);

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
                    onUpdateMessageScroll={updateMessageContainerScroll}
                    onSendMsg={onSendMsg}
                    onCouldNotAnswer={onCouldNotAnswer}
                    isLastMessage={index === messageList.length - 1}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      {/* <audio preload="auto" className={`voiceReportPlayerCache`} style={{ width: 0, height: 0, position: 'absolute'}}></audio> */}
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
