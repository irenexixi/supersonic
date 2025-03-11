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
import { useContext, useState } from 'react';
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
  
  const voiceReport = (msgData: any = {}) => {
    console.log(msgData, msgData.textResult, msgData.textSummary);
    let text = msgData.textResult;
    if (msgData.textSummary) {
        text = msgData.textResult + '总结：' + msgData.textSummary;
    }
    const times = text.length / 60 * 1000
    setTimeout(() => {
      setExportLoading(false);
    }, times);
    const audioElements = document.getElementsByClassName('voiceReportPlayer')[0];
    if (audioElements) {
      // @ts-ignore
      audioElements.pause();
    }
    // @ts-ignore
    voiceTts({ text }).then((res) => {
      const audioElement = document.getElementsByClassName('voiceReportPlayer')[0];
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
          URL.revokeObjectURL(res);
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
                    voiceReport(msgData);
                    setExportLoading(true);
                    // // onExportData?.();
                    // setTimeout(() => {
                    //   setExportLoading(false);
                    // }, 3000);
                  }}
                  type="text"
                  loading={exportLoading}
                >
                  <SoundOutlined />
                  <span className={`${prefixCls}-font-style`}>语音播放</span>
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
