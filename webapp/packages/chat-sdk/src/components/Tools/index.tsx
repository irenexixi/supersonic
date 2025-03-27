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
  voiceLoading?: boolean;
  isSimpleMode?: boolean;
  msgData?: MsgDataType;
  onExportData?: () => void;
  onReExecute?: (queryId: number) => void;
  onVoiceReport?: (msgData: any) => void;
  // onReadRes?: () => void;
};

const Tools: React.FC<Props> = ({
  queryId,
  scoreValue,
  isLastMessage,
  msgData,
  isParserError = false,
  voiceLoading = false,
  isSimpleMode = false,
  onExportData,
  onReExecute,
  onVoiceReport,
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
  
  useEffect(() => {
    // 当data变化时，这个函数会被调用
    // handleDataChange(data);
    setExportLoading(voiceLoading);
  }, [voiceLoading]);

  // 改造为只有1个audio标签,点击播放就播放,在次点击就停止.
  const voiceReport = (msgData: any = {}) => {
    // 调用父组件的语音播报
    if (onVoiceReport) {
      onVoiceReport?.(msgData);
    }
  }

  return (
    <div className={prefixCls}>
      {/* !isMobile && */}
      {(
        <div className={`${prefixCls}-feedback`}>
          {/* <div>这个回答正确吗？</div> */}

          <div className={`${prefixCls}-feedback-left`}>
            {(!isParserError && msgData?.textSummary && msgData?.ttsUrl) && (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    // setExportLoading(true);
                    voiceReport(msgData);
                    // // onExportData?.();
                    // setTimeout(() => {
                    //   setExportLoading(false);
                    // }, 3000);
                  }}
                  type="text"
                  loading={`${msgData?.queryId}` === sessionStorage.getItem('voiceReportQueryId') ? exportLoading : false}
                >
                  <SoundOutlined className={`voice-icon-${msgData.queryId} voice-icon-default`} />
                  {/* <span className={`${prefixCls}-font-style`}>语音播放</span> */}
                  {/* <audio className={`voiceReportPlayer`} preload='auto' style={{ position: 'absolute', width: '0', height: '0' }}></audio> */}
                  <span className={`${prefixCls}-font-style`}></span>
                </Button>
                {!isMobile && (
                  <Button
                    size="small"
                    onClick={() => {
                      // setExportLoading(true);
                      onExportData?.();
                      // setTimeout(() => {
                      //   setExportLoading(false);
                      // }, 1000);
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
