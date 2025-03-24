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
import { useContext, useState, useRef } from 'react';
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
  
  const voiceData = useRef('')

  const voiceReport = (msgData: any = {}) => {
    console.log(msgData)
    let audioCreate = document.getElementsByClassName(`voicePlayer${msgData.queryId}`)[0];
    if (!audioCreate) {
      const audioCreate = document.createElement('audio');
      audioCreate.className = `voiceReportPlayer voicePlayer${msgData.queryId}`;
      audioCreate.style.width = '0';
      audioCreate.style.height = '0';
      audioCreate.style.position = 'absolute';
      const parentDiv = document.getElementsByClassName('anticon-sound')[0]
      parentDiv.appendChild(audioCreate);
    }
    requestAnimationFrame( () => {
      const audioElementAll = document.getElementsByClassName(`voiceReportPlayer`);
      const iconList = document.getElementsByClassName(`voice-icon`)
      for (let i = 0; i < audioElementAll.length; i++) {
        if (audioElementAll[i] !== audioCreate) {
          // @ts-ignore
            audioElementAll[i].pause()
        }
      }
      for (let index = 0; index < iconList.length; index++) {
        iconList[index].classList.remove('voice-icon')
      }
      // 再次点击且已经请求数据就缓存播放
      if (voiceData.current && `A${msgData.queryId}A` === voiceData.current && audioCreate) {
        setExportLoading(false);
        // @ts-ignore
        if (audioCreate.paused) {
          const icon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
          icon.classList.add('voice-icon')
          // @ts-ignore
          audioCreate.play()
        } else {
          const icon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
          icon.classList.remove('voice-icon')
          // @ts-ignore
          audioCreate.pause();
        }
        return
      }
      // 只读总结
      let text = '';
      if (msgData.textSummary) {
          text = '智能洞察：' + msgData.textSummary;
      }
      if (audioCreate) {
        // @ts-ignore
        audioCreate.pause();
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
          voiceData.current = `A${msgData.queryId}A`
          const audioElement = document.getElementsByClassName(`voicePlayer${msgData.queryId}`)[0];
          // @ts-ignore
          if (audioElement) {
          // @ts-ignore
            // audioElement.src = 'http://downsc.chinaz.net/files/download/sound1/201206/1638.mp3'
            // @ts-ignore
            audioElement.pause();
            // @ts-ignore
            audioElement.src = res.data
            // @ts-ignore
            audioElement.load()
            // @ts-ignore
            audioElement.play();
            const icon = document.getElementsByClassName(`voice-icon-${msgData.queryId}`)[0];
            icon.classList.add('voice-icon')
            
            const handleEndedWrapper = function() {
              handleEnded(icon)
            }
            const handleEnded = function(icon) {
              // @ts-ignore
              icon?.classList?.remove('voice-icon')
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
    })
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
