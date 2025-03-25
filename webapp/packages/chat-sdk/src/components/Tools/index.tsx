import { isMobile } from '../../utils/utils';
import {
  DislikeOutlined,
  LikeOutlined,
  DownloadOutlined,
  RedoOutlined,
  FileJpgOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { MsgDataType } from '../../common/type';
import { Button } from 'antd';
import { CLS_PREFIX } from '../../common/constants';
import { useContext, useEffect, useState, useRef } from 'react';
import classNames from 'classnames';
import { updateQAFeedback, voiceTts } from '../../service';
import { useMethodRegister } from '../../hooks';
import { ChartItemContext } from '../ChatItem';

type Props = {
  queryId: number;
  scoreValue?: number;
  isLastMessage?: boolean;
  isParserError?: boolean;
  isSimpleMode?: boolean;
  msgData?: MsgDataType;
  onExportData?: () => void;
  onReExecute?: (queryId: number) => void;
  // onReadRes?: () => void;
};

const Tools: React.FC<Props> = ({
  queryId,
  scoreValue,
  isLastMessage,
  msgData,
  isParserError = false,
  isSimpleMode = false,
  onExportData,
  onReExecute,
  // onReadRes
}) => {
  const [score, setScore] = useState(scoreValue || 0);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const prefixCls = `${CLS_PREFIX}-tools`;

  const like = () => {
    setScore(5);
    updateQAFeedback(queryId, 5);
  };

  const dislike = () => {
    setScore(1);
    updateQAFeedback(queryId, 1);
  };

  const likeClass = classNames(`${prefixCls}-like`, {
    [`${prefixCls}-feedback-active`]: score === 5,
  });
  const dislikeClass = classNames(`${prefixCls}-dislike`, {
    [`${prefixCls}-feedback-active`]: score === 1,
  });

  const { call } = useContext(ChartItemContext);
  // 使用useEffect钩子在组件加载后操作DOM
  useEffect(() => {
    let audioCreate = document.getElementsByClassName('voiceReportPlayer')[0];
    if (!audioCreate) {
      const audioCreate = document.createElement('audio');
      audioCreate.className = 'voiceReportPlayer';
      audioCreate.style.width = '0';
      audioCreate.style.height = '0';
      audioCreate.style.position = 'absolute';
      const parentDiv = document.getElementById('messageContainer');
      parentDiv && parentDiv.appendChild(audioCreate);
    }
  }, []); // 空数组作为依赖项，表示这个effect只在组件挂载和卸载时执行一次
  
  // 改造为只有1个audio标签,点击播放就播放,在次点击就停止.
  const voiceReport = (msgData: any = {}) => {
    const voicePlay = function(msgData: any = {}) {
      const audioElementCur = document.getElementsByClassName('voiceReportPlayer');
      // iconList拿到正在播放的voice
      const iconList = document.getElementsByClassName(`voice-icon`)
      if (audioElementCur.length === 0) {
        return
      }
      // 有正在播放的,停止播放并且清除样式,且不再继续执行
      if (iconList.length > 0) {
          // @ts-ignore
          audioElementCur[0].pause()
          iconList[0]?.classList.remove('voice-icon')
          // 当前播放为A ---> 若点B的时候直接播放B，若点A的话就停止A
          // @ts-ignore
          if (audioElementCur[0].dataset.index === `${msgData.queryId}`) {
            setExportLoading(false);
            return
          }
      }

      // 只读总结
      let text = '';
      if (msgData.textSummary) {
          text = '智能洞察：' + msgData.textSummary;
      }
      if (!text) {
        console.log('语音播报失败', '返回的文本数据缺失');
        return;
      }
      // @ts-ignore
      voiceTts({ text }).then((res) => {
        if (res && res.code === 200 && res.data) {
          setExportLoading(false);
          // @ts-ignore
          const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
          const voicingIcon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
          // @ts-ignore
          if (audioElement) {
            // @ts-ignore
            audioElement.src = res.data
            // @ts-ignore
            // audioElement.load()
            // @ts-ignore
            audioElement.play();
            voicingIcon.classList.add('voice-icon')
            // @ts-ignore
            audioElement.dataset.index = msgData.queryId
            
            const handleEndedWrapper = function() {
              handleEnded(voicingIcon, audioElement)
            }
            const handleEnded = function(icon, audio) {
              // @ts-ignore
              icon?.classList?.remove('voice-icon')
              audio.dataset.index = ''
              // @ts-ignore
              console.log('ended: ' + audioElement.currentTime, audioElement.duration);
            }
            audioElement.removeEventListener('ended', handleEndedWrapper)
            audioElement.addEventListener('ended', handleEndedWrapper)
            // audioElement.addEventListener('timeupdate', function() {
            //   // 输出当前的播放时间
            //   // @ts-ignore
            //   console.log('Current time: ' + audioElement.currentTime, audioElement.duration);
            //   // @ts-ignore
            //   if (audioElement.currentTime === audioElement.duration) {
            //     // 您可以在这里添加其他逻辑，例如更新进度条或显示剩余时间等。
            //     // const icon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
            //     icon?.classList?.remove('voice-icon')
            //   }
            // })
          }
        }
      }).catch((err) => {
        setExportLoading(false);
        console.log('voiceReport', err);
      });
    }
    let audioCreate = document.getElementsByClassName('voiceReportPlayer')[0];
    if (!audioCreate) {
      alert('请先安装语音插件')
      const audioCreate = document.createElement('audio');
      audioCreate.className = `voiceReportPlayer voicePlayer${msgData.queryId}`;
      audioCreate.style.width = '0';
      audioCreate.style.height = '0';
      audioCreate.style.position = 'absolute';
      const parentDiv = document.getElementById('messageContainer');
      parentDiv && parentDiv.appendChild(audioCreate);
      setTimeout(() => {
        voicePlay(msgData)
      }, 100)
    } else {
      voicePlay(msgData)
    }
    // 取消requestAnimationFrame，改为setTimeout
    // requestAnimationFrame(() => {})
  }


  return (
    <div className={prefixCls}>
      {/* !isMobile && */}
      {(
        <div className={`${prefixCls}-feedback`}>
          {/* <div>这个回答正确吗？</div> */}

          <div className={`${prefixCls}-feedback-left`}>
            {(!isParserError && msgData?.textSummary) && (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    setExportLoading(true);
                    voiceReport(msgData);
                    // // onExportData?.();
                    // setTimeout(() => {
                    //   setExportLoading(false);
                    // }, 3000);
                  }}
                  type="text"
                  loading={exportLoading}
                >
                  <SoundOutlined className={`voice-icon-${msgData.queryId} voice-icon-default`} />
                  {/* <span className={`${prefixCls}-font-style`}>语音播放</span> */}
                  <span className={`${prefixCls}-font-style`}></span>
                </Button>
                {!isMobile && (
                <Button
                  size="small"
                  onClick={() => {
                    setExportLoading(true);
                    onExportData?.();
                    setTimeout(() => {
                      setExportLoading(false);
                    }, 1000);
                  }}
                  type="text"
                  loading={exportLoading}
                >
                  <DownloadOutlined />
                  <span className={`${prefixCls}-font-style`}>导出数据</span>
                </Button>
                )}
                {!isMobile && !isSimpleMode && (
                  <Button
                    size="small"
                    onClick={() => {
                      call('downloadChartAsImage');
                    }}
                    type="text"
                  >
                    <FileJpgOutlined />
                    <span className={`${prefixCls}-font-style`}>导出图片</span>
                  </Button>
                )}
                {!isMobile && isLastMessage && (
                  <Button
                    size="small"
                    onClick={() => {
                      onReExecute?.(queryId);
                    }}
                    type="text"
                  >
                    <RedoOutlined />
                    <span className={`${prefixCls}-font-style`}>再试一次</span>
                  </Button>
                )}
              </>
            )}
          </div>
          <div className={`${prefixCls}-feedback-left`}>
            <LikeOutlined className={likeClass} onClick={like} style={{ marginRight: 10 }} />
            <DislikeOutlined
              className={dislikeClass}
              onClick={e => {
                e.stopPropagation();
                dislike();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;
