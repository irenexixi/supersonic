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
    const audioElementAll = document.getElementsByClassName(`voiceReportPlayer`);
    const audioElements = document.getElementsByClassName(`voicePlayer${msgData.queryId}`)[0];
    for (let i = 0; i < audioElementAll.length; i++) {
      if (audioElementAll[i] !== audioElements) {
        // @ts-ignore
          audioElementAll[i].pause()
      }
    }
    // 再次点击且已经请求数据就缓存播放
    if (voiceData.current && `A${msgData.queryId}A` === voiceData.current && audioElements) {
      setExportLoading(false);
      // @ts-ignore
      if (audioElements.paused) {
        // @ts-ignore
        audioElements.play()
      } else {
        // @ts-ignore
        audioElements.pause();
      }
      return
    }
    console.log(msgData, msgData.textResult, msgData.textSummary);
    // 只读总结
    let text = msgData.textResult;
    if (msgData.textSummary) {
        text = '总结：' + msgData.textSummary;
    }
    const times = text.length / 60 * 1000
    setTimeout(() => {
      setExportLoading(false);
    }, times);
    if (audioElements) {
      // @ts-ignore
      audioElements.pause();
    }
    // @ts-ignore
    voiceTts({ text }).then((res) => {
      // @ts-ignore
      voiceData.current = `A${msgData.queryId}A`
      const audioElement = document.getElementsByClassName(`voicePlayer${msgData.queryId}`)[0];
      if (audioElement) {
        // @ts-ignore
        audioElement.pause();
        // @ts-ignore
        audioElement.src = res
        // @ts-ignore
        audioElement.load()
        // @ts-ignore
        audioElement.play();
        audioElement.addEventListener('ended', () => {
          // @ts-ignore
          // URL.revokeObjectURL(res);
        });
      }
    }).catch((err) => {
      console.log('voiceReport', err);
    });
  }


  return (
    <div className={prefixCls}>
      {/* !isMobile && */}
      {(
        <div className={`${prefixCls}-feedback`}>
          {/* <div>这个回答正确吗？</div> */}

          <div className={`${prefixCls}-feedback-left`}>
            {!isParserError && (
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
                  <SoundOutlined />
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
