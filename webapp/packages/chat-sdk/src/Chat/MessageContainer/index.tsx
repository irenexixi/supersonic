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
  }, []); // 空数组作为依赖项，表示这个effect只在组件挂载和卸载时执行一次

  useEffect(() => {
    // 当data变化时，这个函数会被调用
    setVoiceLoading(voiceLoading);
  }, [voiceLoading]);

  const showTip = useRef(false)
  useEffect(() => {
    sessionStorage.setItem('voiceReportId', '1')
    sessionStorage.setItem('loadVoiceData', 'true')
    // 当data变化时，这个函数会被调用
    const oaAccount = localStorage.getItem('oaAccount');
    const accountList = ['liqianqianjs', 'liqianqian', 'jiangjiqi', 'jiangjiqipt', 'liaokun', 'liaokun_pt', 'zhouzhou_pt', 'zhouzhou']
    // @ts-ignore
    if (accountList.indexOf(oaAccount) > -1) {
      showTip.current = true
    }
    // 全部打开弹窗,部署在redred环境,不影响正式环境的功能
    showTip.current = true
  }, []);
  

  // 从Tools中触发点击事件传递到ChatItem在从ChatItem中触发MessageContainer的voiceReport函数
  const voiceReport = (msgData: any = {}) => {
    console.clear()
    const iconList = document.getElementsByClassName(`voice-icon`)
    const audioElementCur = document.getElementsByClassName('voiceReportPlayer');
    if (iconList.length > 0) {
      // 有正在播放的,停止播放并且清除样式
      // @ts-ignore
      audioElementCur[0].pause()
      iconList[0]?.classList.remove('voice-icon')
      // @ts-ignore
      if (audioElementCur[0].dataset.index === `${msgData.queryId}`) {
        setTimeout(() => {
          setVoiceLoading(false)
        }, 100)
      } else {
        // 如果当前播放和点击的不是同一个，那就播放当前点击的
        voiceReport(msgData)
      }
    } else {
      const closeAnimation = function() {
        const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
        const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
        voicingIcon?.classList?.remove('voice-icon')
        // @ts-ignore
        audioElement.dataset.index = ''
      }
      const playAudio = function(url, retries = 10, delay = 3000) {
        // 调用播放功能，设置loading和当前播放ID
        sessionStorage.setItem('voiceReportQueryId', JSON.stringify(msgData.queryId))
        setVoiceLoading(true)
        const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
        let attempt = 0;
        function attemptPlay() {
          attempt++
        // @ts-ignore
          audioElement.src = url
          // @ts-ignore
          audioElement.load();
          // @ts-ignore
          // @ts-ignore
          audioElement.play().then(()=> {
            // 播放成功，添加播放动效，停止loading效果
            const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
            voicingIcon?.classList?.add('voice-icon')
            setVoiceLoading(false)
            // @ts-ignore
            audioElement.dataset.index = msgData.queryId
            showTip.current && message.success('播放成功！！！');
            // @ts-ignore
            console.log('播放成功');
          }).catch(e => {
            // 播放失败，定时重试
            console.error(`播放失败(尝试 ${attempt}/${(attempt < retries)}`)
            showTip.current && message.error(`播放失败(尝试 ${attempt}/${(attempt < retries)}`)
            setTimeout(attemptPlay, delay)
            // 重试10次后也未能播放，触发执行
            if (attempt >= retries) {
              const iconList = document.getElementsByClassName(`voice-icon`)
              iconList[0]?.classList.remove('voice-icon')
              setVoiceLoading(false)
              showTip.current && message.error('播放失败，获取文件异常,可重新点击播放');
            }
          })
        }
        audioElement.addEventListener('ended', closeAnimation, { once: true });
        audioElement.addEventListener('timeupdate', function() {
          // @ts-ignore
          if (audioElement.currentTime === audioElement.duration) {
            // 您可以在这里添加其他逻辑，例如更新进度条或显示剩余时间等。
            const icon = document.getElementsByClassName(`voice-icon`)[0];
            // const icon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
            icon?.classList?.remove('voice-icon')
          }
        }, { once: true })
        // @ts-ignore
        audioElement.addEventListener('loadedmetadata', () => {
          // 音频时长（秒）
          // @ts-ignore
          const duration = audioElement.duration;
          console.log('音频时长:', duration, '秒');
          showTip.current && message.success('音频时长:' + duration + '秒');
        }, { once: true });
        // attemptPlay();

        function playDynamicAudio() {
          const audioElement = document.getElementsByClassName('voiceReportPlayer')[0] || new Audio();
          // 先暂停并重置
          // @ts-ignore
          audioElement.pause();
          // @ts-ignore
          audioElement.currentTime = 0;
          
          // 重要：先移除事件监听器，避免内存泄漏
          // @ts-ignore
          audioElement.onerror = null;
          // @ts-ignore
          audioElement.onended = null;
          
          // 重置src前先设置为空
          // @ts-ignore
          audioElement.src = '';
          // @ts-ignore
          audioElement.load(); // 强制清空
          
          // 设置新src
          // @ts-ignore
          audioElement.src = msgData.ttsUrl.replace('dc.migu.cn', 'da.migu.cn:8443')
          
          // 添加错误处理
          // @ts-ignore
          audioElement.onerror = () => console.error('音频加载失败');
          
          // @ts-ignore
          audioElement.play().then(() =>{
            // 播放成功，添加播放动效，停止loading效果
            const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
            voicingIcon?.classList?.add('voice-icon')
            setVoiceLoading(false)
            // @ts-ignore
            audioElement.dataset.index = msgData.queryId
            showTip.current && message.success('播放成功！！！');
          }).catch(e => {
            console.error('播放被阻止:', e);
            // 可能需要用户交互
            attemptPlay()
          });
        }
        playDynamicAudio()
      }
      // playAudio(msgData.ttsUrl.replace('dc.migu.cn', 'da.migu.cn:8443'))

      const oaAccount = localStorage.getItem('oaAccount') || '';
      const accountList = ['liqianqianjs', 'dmtest02']
      if (accountList.includes(oaAccount) && false) {
        const prefix = 'https://da.migu.cn:8443/elephant-screen/upload/video/tts/20250328/'
        const url = `${prefix}${sessionStorage.getItem('voiceReportId')}.wav`
        // @ts-ignore
        const vId = sessionStorage.getItem('voiceReportId') || 0
        let voiceId = (+(vId) || 0) + 1
        sessionStorage.setItem('voiceReportId', `${voiceId % 10}`)
        const load = function(){
          // @ts-ignore
          audioElementCur[0].src = url
          // @ts-ignore
          audioElementCur[0].load();
        }
        sessionStorage.setItem('voiceReportQueryId', JSON.stringify(msgData.queryId))
        setVoiceLoading(true)
        
        audioElementCur[0].addEventListener('ended', () => {
          const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
          const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
          voicingIcon?.classList?.remove('voice-icon')
          // @ts-ignore
          audioElement.dataset.index = ''
        }, { once: true });
        audioElementCur[0].addEventListener('timeupdate', function() {
          // @ts-ignore
          if (audioElementCur[0].currentTime === audioElementCur[0].duration) {
            // 您可以在这里添加其他逻辑，例如更新进度条或显示剩余时间等。
            const icon = document.getElementsByClassName(`voice-icon`)[0];
            // const icon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
            icon?.classList?.remove('voice-icon')
          }
        }, { once: true })
        // load()
        // setTimeout(() => {load()}, 2000)
        // setTimeout(() => {load()}, 4000)
        // setTimeout(() => {load()}, 6000)
        // setTimeout(() => {load()}, 8000)
        // setTimeout(() => {load()}, 10000)
        // setTimeout(() => {load()}, 12000)
        load();
        setTimeout(() => {
          // @ts-ignore
          audioElementCur[0].play();
          const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
          voicingIcon?.classList?.add('voice-icon')
          setVoiceLoading(false)
          // @ts-ignore
          audioElementCur[0].dataset.index = msgData.queryId
        }, 100)
      } else {
        playAudio(msgData.ttsUrl.replace('dc.migu.cn', 'da.migu.cn:8443'))
      }
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
      <audio className={`voiceReportPlayer`} style={{ width: 0, height: 0, position: 'absolute'}}></audio>
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
